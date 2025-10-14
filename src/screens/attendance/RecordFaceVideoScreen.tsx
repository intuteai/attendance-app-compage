import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';

import {
  Camera,
  useCameraDevice,
  useCameraFormat,
} from 'react-native-vision-camera';
import { openSettings } from 'react-native-permissions';
import RNFS from 'react-native-fs';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';


const DRAFT_KEY = 'addEmployeeDraft:v1';
const RESTORE_FLAG_KEY = 'addEmployee:restoreOnReturn';
// ====== CONFIG ======
const DEFAULT_UPLOAD_URL = 'http://148.66.155.196:6900/register';

// Capture cadence / UI timings
const FRAME_INTERVAL_MS = 900; // ~1 fps while capturing
const PROMPT_DURATION_MS = 6000; // 6s per prompt
// Keep in sync with server-side face_processing.MAX_IMAGES (20)
const MAX_BATCH_FRAMES = 20;

const FACE_PROMPTS: ReadonlyArray<string> = [
  'Look straight',
  'Turn left',
  'Turn right',
  'Look up',
  'Look down',
  'Smile',
];

type Props = NativeStackScreenProps<RootStackParamList, 'RecordFaceVideo'>;

const RecordFaceVideoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { empId, fullName, uploadUrl } = (route.params as any) || {};
  const ML_REGISTER_URL: string = uploadUrl || DEFAULT_UPLOAD_URL;

  // Prefer front camera, fallback to back
  const device = useCameraDevice('front') ?? useCameraDevice('back');

  // Lightweight format for fast, reliable still captures
  const format = useCameraFormat(device ?? undefined, [
    { videoResolution: { width: 640, height: 360 } },
    { photoResolution: { width: 640, height: 360 } },
  ]);

  const camera = useRef<Camera>(null);

  // permissions
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // session flags
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false); // logical "session running"
  const [busy, setBusy] = useState(false); // uploading/finalizing

  // prompts
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptCountdown, setPromptCountdown] = useState(
    PROMPT_DURATION_MS / 1000
  );
  const totalPrompts = FACE_PROMPTS.length;
  const totalDurationMs = totalPrompts * PROMPT_DURATION_MS;

  // frame batching
  const framePathsRef = useRef<string[]>([]); // file:// paths to upload
  const [capturedCount, setCapturedCount] = useState(0); // internal only (no UI)
  const [isCapturingFrame, setIsCapturingFrame] = useState(false);

  // timers (for cleanup)
  const timersRef = useRef<{
    tick?: ReturnType<typeof setInterval>;
    prompt?: ReturnType<typeof setInterval>;
    whole?: ReturnType<typeof setTimeout>;
    frame?: ReturnType<typeof setInterval>;
    firstTO?: ReturnType<typeof setTimeout>;
  }>({});

  // ===== Permissions =====
  const checkPermissions = useCallback(async () => {
    try {
      const cam = await Camera.requestCameraPermission();
      // mic is not required anymore; you can skip requesting it if you prefer
      const mic = await Camera.requestMicrophonePermission();
      setHasPermission(cam === 'granted' && mic === 'granted');
    } catch {
      setHasPermission(false);
    } finally {
      setPermissionAsked(true);
    }
  }, []);

  useEffect(() => {
    if (!permissionAsked) checkPermissions();
  }, [permissionAsked, checkPermissions]);

  // block back during capture/upload
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (recording || busy) return true;
      return false;
    });
    return () => sub.remove();
  }, [recording, busy]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // ===== Helpers =====
  const clearTimers = () => {
    const t = timersRef.current;
    if (t.tick) clearInterval(t.tick);
    if (t.prompt) clearInterval(t.prompt);
    if (t.whole) clearTimeout(t.whole);
    if (t.frame) clearInterval(t.frame);
    if (t.firstTO) clearTimeout(t.firstTO);
    timersRef.current = {};
  };

  // take a still photo and buffer it (no upload here)
  const captureFrame = useCallback(async () => {
    if (!camera.current || !recording || isCapturingFrame) return;
    if (framePathsRef.current.length >= MAX_BATCH_FRAMES) return;

    setIsCapturingFrame(true);
    try {
      const photo = await camera.current.takePhoto({});
      const rawPath = photo?.path ?? '';
      if (!rawPath) throw new Error('No frame path');

      const uri = rawPath.startsWith('file://') ? rawPath : `file://${rawPath}`;
      framePathsRef.current.push(uri);
      const newCount = framePathsRef.current.length;
      setCapturedCount(newCount);

      // LOG each capture
      console.log(
        `[ML] frame captured ${newCount}/${MAX_BATCH_FRAMES} ` +
          `(empId=${empId ?? 'N/A'}, name="${fullName ?? ''}")`
      );

      // Reached max → stop session & upload
      if (newCount >= MAX_BATCH_FRAMES) {
        await stopCapture(); // triggers finalize+upload
        return;
      }
    } catch (e) {
      console.warn('Frame capture error:', e);
    } finally {
      setIsCapturingFrame(false);
    }
  }, [recording, isCapturingFrame, empId, fullName]);

  const startFrameLoop = useCallback(() => {
    // small initial delay to let camera settle
    timersRef.current.firstTO = setTimeout(() => {
      captureFrame();
      timersRef.current.frame = setInterval(() => {
        captureFrame();
      }, FRAME_INTERVAL_MS);
    }, 300);
  }, [captureFrame]);

  // >>>>>>> FIX: start frame loop AFTER recording becomes true to avoid stale-closure <<<<<<<
  useEffect(() => {
    if (recording) {
      startFrameLoop();
    }
    return () => {
      // cleanup when recording flips false or component unmounts
      if (timersRef.current.frame) clearInterval(timersRef.current.frame);
      if (timersRef.current.firstTO) clearTimeout(timersRef.current.firstTO);
      timersRef.current.frame = undefined;
      timersRef.current.firstTO = undefined;
    };
  }, [recording, startFrameLoop]);

  // POST /register (name + files[])
  const uploadBatch = useCallback(
    async (paths: string[]) => {
      const toSend = paths.slice(0, MAX_BATCH_FRAMES); // ensure we never exceed server MAX_IMAGES
      console.log(
        `[ML] Upload triggered: captured=${paths.length}, sending=${toSend.length}, ` +
          `endpoint=${ML_REGISTER_URL}`
      );
      if (!toSend.length) throw new Error('No frames captured.');
      if (!ML_REGISTER_URL) throw new Error('No ML register URL.');

      const form = new FormData();
      form.append('name', String(fullName || ''));

      for (let i = 0; i < toSend.length; i++) {
        form.append('files', {
          uri: toSend[i],
          name: `frame_${i + 1}.jpg`,
          type: 'image/jpeg',
        } as any);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);

      try {
        console.log('[ML] Sending POST /register…');
        const res = await fetch(ML_REGISTER_URL, {
          method: 'POST',
          body: form,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        console.log('[ML] Response status:', res.status);

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.log('[ML] Upload failed:', res.status, text);
          throw new Error(`Register failed: HTTP ${res.status}${text ? ` – ${text}` : ''}`);
        }

        const json = await res.json().catch(() => ({}));
        console.log('[ML] Upload success.', json);
        return { json, sentCount: toSend.length, capturedCount: paths.length };
      } catch (e) {
        clearTimeout(timeout);
        console.error('[ML] Network or upload error:', e);
        throw e;
      }
    },
    [ML_REGISTER_URL, fullName]
  );

  const cleanupPhotos = useCallback(async () => {
    await Promise.allSettled(
      framePathsRef.current.map(async (p) => {
        try {
          const plain = p.replace('file://', '');
          await RNFS.unlink(plain);
        } catch {}
      })
    );
  }, []);

  const finalizeUpload = useCallback(async () => {
    setBusy(true);

    try {
      // last-chance capture if nothing collected yet
      if (framePathsRef.current.length === 0 && camera.current) {
        try {
          const photo = await camera.current.takePhoto({});
          const rawPath = photo?.path ?? '';
          if (rawPath) {
            const uri = rawPath.startsWith('file://') ? rawPath : `file://${rawPath}`;
            framePathsRef.current.push(uri);
            const newCount = framePathsRef.current.length;
            setCapturedCount(newCount);
            console.log(`[ML] frame captured ${newCount}/${MAX_BATCH_FRAMES} (last-chance)`);
          }
        } catch {}
      }

      // LOG: totals before sending
      console.log(
        `[ML] Finalizing upload: total captured=${framePathsRef.current.length}, ` +
          `MAX_BATCH_FRAMES=${MAX_BATCH_FRAMES}`
      );

      const { json, sentCount, capturedCount: capCount } = await uploadBatch(
        framePathsRef.current
      );

      // LOG: after success
      console.log(
        `[ML] Upload complete: captured=${capCount}, sent=${sentCount}. ` +
          `Server says: ${JSON.stringify(json)}`
      );

      await cleanupPhotos();

      Alert.alert('Success', `Registered ${fullName} on ML.`, [
  {
    text: 'OK',
    onPress: async () => {
      // persist flags so AddEmployee reads them on focus
      await AsyncStorage.mergeItem(
        DRAFT_KEY,
        JSON.stringify({ videoRecorded: true, registeredOnML: true })
      );
      // tell AddEmployee to restore instead of clearing
      await AsyncStorage.setItem(RESTORE_FLAG_KEY, '1');

      // go back to the existing AddEmployee instance
      navigation.goBack();
    },
  },
]);
    } catch (e: any) {
  console.error('Batch upload error', e);
  Alert.alert('Registration Failed', e?.message ?? 'Could not upload photos.');

  // mark that a capture happened, but ML didn’t register
  await AsyncStorage.mergeItem(
    DRAFT_KEY,
    JSON.stringify({ videoRecorded: true, registeredOnML: false })
  );
  await AsyncStorage.setItem(RESTORE_FLAG_KEY, '1');

  // return to the same AddEmployee screen
  navigation.goBack();
} finally {
      setBusy(false);
      framePathsRef.current = [];
      setCapturedCount(0);
    }
  }, [uploadBatch, cleanupPhotos, fullName, navigation]);

  // ===== Capture session controls =====
  const startCapture = useCallback(async () => {
    if (!device || !cameraReady || !hasPermission) {
      Alert.alert(
        'Camera Not Ready',
        'Please ensure camera permission is granted and camera is initialized.'
      );
      return;
    }
    if (!empId || !fullName) {
      Alert.alert('Missing Info', 'Employee Name & ID are required before recording.');
      return;
    }

    try {
      setRecording(true);
      setBusy(false);
      framePathsRef.current = [];
      setCapturedCount(0);

      // prompts UI timers
      setPromptIndex(0);
      setPromptCountdown(PROMPT_DURATION_MS / 1000);

      timersRef.current.tick = setInterval(() => {
        setPromptCountdown((s) => (s <= 1 ? PROMPT_DURATION_MS / 1000 : s - 1));
      }, 1000);

      let idx = 0;
      timersRef.current.prompt = setInterval(() => {
        idx += 1;
        if (idx < totalPrompts) setPromptIndex(idx);
      }, PROMPT_DURATION_MS);

      // total session timeout → finalize
      timersRef.current.whole = setTimeout(() => {
        stopCapture();
      }, totalDurationMs);

      // NOTE: startFrameLoop is now started by the `useEffect([recording])` fix above
      console.log(
        `[ML] Capture session started for empId=${empId ?? 'N/A'}, name="${
          fullName ?? ''
        }". Target frames=${MAX_BATCH_FRAMES}`
      );
    } catch (e: any) {
      console.error('startCapture error', e);
      setRecording(false);
      clearTimers();
      Alert.alert('Error', e?.message ?? 'Unable to start.');
    }
  }, [device, cameraReady, hasPermission, empId, fullName, totalPrompts, totalDurationMs]);

  const stopCapture = useCallback(async () => {
    clearTimers();
    console.log(
      `[ML] Capture session stopping. Frames captured so far=${framePathsRef.current.length}`
    );
    try {
      await finalizeUpload();
    } finally {
      setRecording(false);
    }
  }, [finalizeUpload]);

  const disabledStart = !device || !hasPermission || !cameraReady || recording || busy;

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => {
            if (recording || busy) return;
            navigation.goBack();
          }}
        >
          <Icon name="chevron-left" type="font-awesome" size={16} color="#E5E7EB" />
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Face Registration</Text>
        <View style={{ width: 72 }} />
      </View>

      <View style={s.cameraBox}>
        {!hasPermission ? (
          <View style={s.center}>
            <ActivityIndicator size="large" />
            <Text style={s.hint}>Waiting for camera permission…</Text>
            {!!permissionAsked && (
              <TouchableOpacity
                onPress={() => openSettings()}
                style={[s.mainBtn, { marginTop: 12 }]}
              >
                <Text style={s.mainBtnTxt}>Open Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : !device ? (
          <View style={s.center}>
            <ActivityIndicator size="large" />
            <Text style={s.hint}>Loading camera device…</Text>
          </View>
        ) : (
          <>
            <Camera
              ref={camera}
              style={s.camera}
              device={device}
              format={format}
              isActive={true}
              photo={true}
              video={false}
              audio={false}
              onInitialized={() => setCameraReady(true)}
              onError={(err) => {
                console.error('Camera error', err);
                Alert.alert('Camera error', err?.message ?? 'Unknown error');
              }}
            />
            {/* Overlay prompt (NO frame counters in UI) */}
            <View style={s.overlay}>
              {recording ? (
                <>
                  <View style={s.promptPill}>
                    <Text style={s.promptTxt}>{FACE_PROMPTS[promptIndex]}</Text>
                  </View>
                  <Text style={s.countdown}>{promptCountdown}s</Text>
                </>
              ) : (
                <Text style={s.readyTxt}>
                  We’ll guide you through:{'\n'}
                  {FACE_PROMPTS.join(' • ')}
                </Text>
              )}
            </View>
          </>
        )}
      </View>

      <View style={s.controls}>
        {!recording ? (
          <TouchableOpacity
            style={[s.mainBtn, disabledStart && { opacity: 0.5 }]}
            disabled={disabledStart}
            onPress={startCapture}
          >
            <Icon name="video-camera" type="font-awesome" size={18} color="#0B1220" />
            <Text style={s.mainBtnTxt}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.stopBtn} onPress={stopCapture}>
            <Icon name="stop" type="font-awesome" size={16} color="#0B1220" />
            <Text style={s.stopBtnTxt}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>

      {busy && (
        <View style={s.loadingCover}>
          <ActivityIndicator size="large" />
          <Text style={s.loadingTxt}>Uploading…</Text>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0B1220' },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#111827',
  },
  backTxt: { color: '#E5E7EB', fontWeight: '800', fontSize: 12 },
  title: { color: '#F8FAFC', fontWeight: '800', fontSize: 14 },

  cameraBox: { flex: 1 },
  camera: { flex: 1 },

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    pointerEvents: 'none',
  },
  promptPill: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(14,165,233,0.2)',
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  promptTxt: {
    color: '#E0F2FE',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  countdown: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  readyTxt: {
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '700',
  },

  controls: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    gap: 12,
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7DD3FC',
    borderWidth: 6,
    borderColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
  },
  mainBtnTxt: { color: '#0B1220', fontWeight: '900', fontSize: 16 },

  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FCD34D',
    borderWidth: 4,
    borderColor: '#1E293B',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  stopBtnTxt: { color: '#0B1220', fontWeight: '900' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { color: '#E5E7EB', fontWeight: '700' },

  loadingCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,18,32,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingTxt: { color: '#E5E7EB', fontWeight: '800' },
});

export default RecordFaceVideoScreen;
