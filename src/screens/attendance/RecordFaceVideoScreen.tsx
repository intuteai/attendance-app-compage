import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  BackHandler,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';

import { Camera, useCameraDevice, VideoFile } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { openSettings } from 'react-native-permissions';
import RNFS from 'react-native-fs';
import { Icon } from 'react-native-elements';
import { CommonActions } from '@react-navigation/native';

// =====================================================
// CONFIG
// =====================================================
const VPS_FRAMES_UPLOAD_URL = ''; // e.g. 'https://your-vps/upload-frames' (REQUIRED to really upload)
const FRAME_INTERVAL_MS = 500;     // capture frame every 0.5s
const PROMPT_DURATION_MS = 10_000; // 10s per prompt

const FACE_PROMPTS: ReadonlyArray<string> = [
  'Look straight',
  'Turn left',
  'Turn right',
  'Look up',
  'Look down',
  'Smile',
];
// =====================================================

type Props = NativeStackScreenProps<RootStackParamList, 'RecordFaceVideo'>;

const RecordFaceVideoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { empId, fullName } = route.params;

  const isFocused = useIsFocused();
  const front = useCameraDevice('front');
  const back = useCameraDevice('back');
  const device = front ?? back;

  const camera = useRef<Camera>(null);

  // permissions
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // camera/recording flags
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false); // generic "processing" cover

  // prompts
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptCountdown, setPromptCountdown] = useState(PROMPT_DURATION_MS / 1000);

  // frame loop
  const [isSendingFrame, setIsSendingFrame] = useState(false);
  const framesSentRef = useRef(0);
  const [framesSent, setFramesSent] = useState(0); // mirror for UI re-render

  // timers (for cleanup)
  const timersRef = useRef<{
    tick?: NodeJS.Timeout;
    prompt?: NodeJS.Timeout;
    whole?: NodeJS.Timeout;
    frame?: NodeJS.Timeout;
  }>({});

  const totalPrompts = FACE_PROMPTS.length;
  const totalDurationMs = totalPrompts * PROMPT_DURATION_MS;

  // output dir for temp photos
  const outputDir = useMemo(
    () =>
      Platform.select({
        ios: `${RNFS.CachesDirectoryPath}/face_${Date.now()}`,
        android: `${RNFS.CachesDirectoryPath}/face_${Date.now()}`,
      })!,
    []
  );

  // ================= Permissions =================
  const checkPermissions = useCallback(async () => {
  try {
    const cam = await Camera.requestCameraPermission();         // returns 'granted' | 'denied' | ...
    const mic = await Camera.requestMicrophonePermission();     // same type
    setHasPermission(cam === 'granted' && mic === 'granted');
  } catch (e) {
    setHasPermission(false);
  } finally {
    setPermissionAsked(true);
  }
}, []);

  useEffect(() => {
    if (!permissionAsked) checkPermissions();
  }, [permissionAsked, checkPermissions]);

  // prevent back during recording/busy
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (recording || busy) return true;
      return false;
    });
    return () => sub.remove();
  }, [recording, busy]);

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // ================= Helpers =================
  const clearTimers = () => {
    const t = timersRef.current;
    if (t.tick) clearInterval(t.tick);
    if (t.prompt) clearInterval(t.prompt);
    if (t.whole) clearTimeout(t.whole);
    if (t.frame) clearInterval(t.frame);
    timersRef.current = {};
  };

  const startPromptTimers = useCallback(() => {
    setPromptIndex(0);
    setPromptCountdown(PROMPT_DURATION_MS / 1000);

    // per-second countdown
    timersRef.current.tick = setInterval(() => {
      setPromptCountdown((s) => (s <= 1 ? PROMPT_DURATION_MS / 1000 : s - 1));
    }, 1000);

    // advance prompt every PROMPT_DURATION_MS
    let idx = 0;
    timersRef.current.prompt = setInterval(() => {
      idx += 1;
      if (idx < totalPrompts) {
        setPromptIndex(idx);
      }
    }, PROMPT_DURATION_MS);

    // stop after all prompts
    timersRef.current.whole = setTimeout(() => {
      stopRecording();
    }, totalDurationMs);
  }, [totalDurationMs]);

  // upload a single frame to VPS
  const uploadFrameToVPS = useCallback(
    async (filePath: string, prompt: string, ts: number) => {
      if (!VPS_FRAMES_UPLOAD_URL) {
        // No server configured: just sim success
        return true;
      }
      const form = new FormData();
      form.append('employeeId', empId);
      form.append('fullName', fullName);
      form.append('prompt', prompt);
      form.append('timestampMs', String(ts));
      form.append('frame', {
        uri: filePath.startsWith('file://') ? filePath : `file://${filePath}`,
        name: `frame_${ts}.jpg`,
        type: 'image/jpeg',
      } as any);

      const res = await fetch(VPS_FRAMES_UPLOAD_URL, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`VPS upload failed: ${res.status}${t ? ` - ${t}` : ''}`);
      }
      return true;
    },
    [empId, fullName]
  );

  // capture & send current frame (throttled by FRAME_INTERVAL_MS)
  const captureAndSendFrame = useCallback(async () => {
    if (!camera.current || !recording || isSendingFrame) return;

    setIsSendingFrame(true);
    let photoPath: string | null = null;

    try {
      // takePhoto works while recording on recent VisionCamera versions
      const photo = await camera.current.takePhoto({});
      const rawPath = photo?.path ?? '';
      if (!rawPath) throw new Error('No frame path');
      photoPath = rawPath.startsWith('file://') ? rawPath : `file://${rawPath}`;

      // ensure dir exists (first time)
      await RNFS.mkdir(outputDir).catch(() => {});

      // move/rename to our temp dir
      const ts = Date.now();
      const fileDest = `${outputDir}/f_${ts}.jpg`;
      await RNFS.moveFile(photoPath.replace('file://', ''), fileDest);

      // upload to VPS with current prompt metadata
      await uploadFrameToVPS(`file://${fileDest}`, FACE_PROMPTS[promptIndex], ts);

      framesSentRef.current += 1;
      setFramesSent(framesSentRef.current);
    } catch (e) {
      // Log and keep going; don't break recording for a single frame failure
      console.warn('Frame capture/upload error:', e);
    } finally {
      setIsSendingFrame(false);
    }
  }, [recording, isSendingFrame, outputDir, promptIndex, uploadFrameToVPS]);

  const startFrameLoop = useCallback(() => {
    // fire immediately so we don't wait for first interval
    captureAndSendFrame();
    // then every FRAME_INTERVAL_MS
    timersRef.current.frame = setInterval(() => {
      captureAndSendFrame();
    }, FRAME_INTERVAL_MS);
  }, [captureAndSendFrame]);

  // ================= Record controls =================
  const startRecording = useCallback(async () => {
    if (!device || !cameraReady || !hasPermission) {
      Alert.alert('Camera Not Ready', 'Please ensure camera & mic permissions are granted.');
      return;
    }
    if (!empId || !fullName) {
      Alert.alert('Missing Info', 'Employee Name & ID are required before recording.');
      return;
    }

    try {
      setRecording(true);
      setBusy(false);
      framesSentRef.current = 0;
      setFramesSent(0);

      await camera.current?.startRecording({
        fileType: 'mp4',
        videoCodec: 'h264',
        onRecordingFinished: async (video: VideoFile) => {
          // Frames have already been sent live. Clean up video and temp dir, then return.
          try {
            if (video?.path) {
              await RNFS.unlink(video.path).catch(() => {});
            }
            // optional: cleanup temp frames directory
            try { await RNFS.unlink(outputDir); } catch {}
          } catch {}
          Alert.alert('Done', 'Face video & live frames captured successfully.', [
            {
              text: 'OK',
              onPress: () => {
  // Pop back to the existing AddEmployee route and merge the param
  navigation.navigate(
    'AddEmployee',
    { videoDone: true },       // 👈 param your AddEmployee can now read
    { merge: true, pop: true } // 👈 don't push; pop to existing + merge
  );
},
            },
          ]);
        },
        onRecordingError: (error) => {
          console.error('Recording error', error);
          setRecording(false);
          clearTimers();
          Alert.alert('Recording Error', error?.message ?? 'Failed to record.');
        },
      });

      // start prompts + frame loop
      startPromptTimers();
      startFrameLoop();
    } catch (e: any) {
      console.error('startRecording error', e);
      setRecording(false);
      clearTimers();
      Alert.alert('Error', e?.message ?? 'Unable to start recording.');
    }
  }, [cameraReady, device, hasPermission, empId, fullName, navigation, startPromptTimers, startFrameLoop, outputDir]);

  const stopRecording = useCallback(async () => {
    try {
      clearTimers();
      await camera.current?.stopRecording();
      setRecording(false);
      setBusy(true); // brief cover until onRecordingFinished fires
      // onRecordingFinished will navigate back with success flag
    } catch {
      setBusy(false);
    }
  }, []);

  // ================= UI =================
  const disabledStart = !isFocused || !device || !hasPermission || !cameraReady || recording || busy;

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

        <Text style={s.title}>Face Video</Text>
        <View style={{ width: 72 }} />
      </View>

      <View style={s.cameraBox}>
        {!hasPermission ? (
          <View style={s.center}>
            <ActivityIndicator size="large" />
            <Text style={s.hint}>Waiting for camera & mic permission…</Text>
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
              isActive={isFocused}
              photo={true}   // IMPORTANT: allow takePhoto while recording
              video={true}
              audio={true}
              onInitialized={() => setCameraReady(true)}
              onError={(err) => {
                console.error('Camera error', err);
                Alert.alert('Camera error', err?.message ?? 'Unknown error');
              }}
            />
            {/* Overlay prompt */}
            <View style={s.overlay}>
              {recording ? (
                <>
                  <View style={s.promptPill}>
                    <Text style={s.promptTxt}>{FACE_PROMPTS[promptIndex]}</Text>
                  </View>
                  <Text style={s.countdown}>{promptCountdown}s</Text>
                  <Text style={s.sentTxt}>Frames sent: {framesSent}</Text>
                </>
              ) : (
                <Text style={s.readyTxt}>
                  We’ll guide you through:
                  {'\n'}{FACE_PROMPTS.join(' • ')}
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
            onPress={startRecording}
          >
            <Icon name="video-camera" type="font-awesome" size={18} color="#0B1220" />
            <Text style={s.mainBtnTxt}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.stopBtn} onPress={stopRecording}>
            <Icon name="stop" type="font-awesome" size={16} color="#0B1220" />
            <Text style={s.stopBtnTxt}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>

      {(busy || !permissionAsked) && (
        <View style={s.loadingCover}>
          <ActivityIndicator size="large" />
          <Text style={s.loadingTxt}>{busy ? 'Finalizing…' : 'Preparing…'}</Text>
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
    left: 0, right: 0, top: 0, bottom: 0,
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
  sentTxt: {
    marginBottom: 18,
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 12,
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