import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Camera, useCameraDevices, PhotoFile } from 'react-native-vision-camera';
import { Icon } from 'react-native-elements';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { styles } from '../Homescreen/homescreen.styles';
import { RootStackParamList } from '../../../navigation/types'
import { useIsFocused } from '@react-navigation/native';
// ======= CONFIG: set your VPS endpoint here =======
const VPS_UPLOAD_URL = 'https://YOUR_VPS_UPLOAD_ENDPOINT/upload';
// ================================================



type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;


const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
const isFocused = useIsFocused();
  const camera = useRef<Camera>(null);

  // In your setup, devices is an array
  const devices = useCameraDevices();
  const device = Array.isArray(devices)
    ? devices.find((d) => d.position === 'front')
    : undefined;

  // ---- Permissions (Camera only; no microphone needed) ----
  const checkPermissions = async () => {
    try {
      let cameraStatus;

      if (Platform.OS === 'android') {
        cameraStatus = await check(PERMISSIONS.ANDROID.CAMERA);
      } else {
        cameraStatus = await check(PERMISSIONS.IOS.CAMERA);
      }

      if (cameraStatus === RESULTS.GRANTED) {
        const cameraPermission = await Camera.getCameraPermissionStatus();
        if (cameraPermission === 'granted') {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          setShowPermissionModal(true);
        }
      } else {
        setHasPermission(false);
        setShowPermissionModal(true);
      }
      setPermissionAsked(true);
    } catch (error) {
      console.error('Permission check error:', error);
      Alert.alert('Error', 'Failed to check permissions.');
    }
  };

  const requestSystemPermissions = async () => {
    try {
      let cameraStatus;

      if (Platform.OS === 'android') {
        cameraStatus = await request(PERMISSIONS.ANDROID.CAMERA);
      } else {
        cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
      }

      if (cameraStatus === RESULTS.GRANTED) {
        const cameraPermission = await Camera.requestCameraPermission();
        if (cameraPermission === 'granted') {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          Alert.alert('Permission Denied', 'Camera access is required.');
        }
      } else if (cameraStatus === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Blocked',
          'Camera access is blocked. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openSettings() },
          ]
        );
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions.');
    }
  };

  const handlePermissionRequest = async (option: 'allow' | 'onlyThisTime' | 'deny') => {
    setShowPermissionModal(false);
    if (option === 'deny') {
      setPermissionAsked(true);
      return;
    }
    await requestSystemPermissions();
    await checkPermissions();
  };

  // ---- Capture + Upload (no video recording) ----
  const handleCaptureImage = async () => {
    if (!device || !cameraReady) {
      Alert.alert('Camera not ready', 'Please wait until the camera is ready...');
      return;
    }

    if (!hasPermission) {
      await checkPermissions();
      return;
    }

    try {
      setCapturing(true);

      // Keep takePhoto options minimal to match your typings
      const photo: PhotoFile | undefined = await camera.current?.takePhoto({});

      if (!photo?.path) {
        setCapturing(false);
        Alert.alert('Error', 'Failed to capture image.');
        return;
      }

      setImagePaths((prev) => [...prev, photo.path]);

      const fileUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      const filename = `frame-${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;

      const form = new FormData();
      // RN's FormData file typing is loose; cast as any to satisfy TS
      form.append(
        'file',
        {
          uri: fileUri,
          name: filename,
          type: 'image/jpeg',
        } as any
      );

      const res = await fetch(VPS_UPLOAD_URL, {
        method: 'POST',
        // Let RN set the multipart boundary automatically
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Upload failed (${res.status}): ${text}`);
      }

      Alert.alert('Uploaded', 'Frame captured and sent to server.');
    } catch (error: any) {
      console.error('Capture/Upload error:', error);
      Alert.alert('Upload Error', error?.message ?? 'Failed to upload image.');
    } finally {
      setCapturing(false);
    }
  };

  useEffect(() => {
    if (!permissionAsked) {
      checkPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Early UI returns ----
  if (!permissionAsked || !hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mark your Attendance</Text>
        {!hasPermission && (
          <Modal
            transparent
            visible={showPermissionModal}
            animationType="fade"
            onRequestClose={() => setShowPermissionModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Icon name="camera" type="font-awesome" size={40} color="#00AEEF" style={styles.modalIcon} />
                <Text style={styles.modalTitle}>Allow adas_system to use the camera?</Text>
                <Text style={styles.modalSubtitle}>While using the app</Text>
                <TouchableOpacity style={styles.modalButton} onPress={() => handlePermissionRequest('allow')}>
                  <Text style={styles.modalButtonText}>WHILE USING THE APP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={() => handlePermissionRequest('onlyThisTime')}>
                  <Text style={styles.modalButtonText}>ONLY THIS TIME</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={() => handlePermissionRequest('deny')}>
                  <Text style={styles.modalButtonText}>DON'T ALLOW</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        <TouchableOpacity
          style={styles.card}
          onPress={handleCaptureImage}
          activeOpacity={0.8}
          disabled={!hasPermission}
        >
          <Icon name="camera" size={40} color="#1F2937" style={{ marginBottom: 10 }} />
          <Text style={styles.cardTitle}>{hasPermission ? 'Capture Image' : 'Permissions Required'}</Text>
          <Text style={styles.cardSubtitle}>
            {hasPermission ? 'Capture a frame and send to server' : 'Please grant camera permission'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { marginTop: 20 }]}
          onPress={() => navigation.navigate('Dashboard', { imagePaths })}
          activeOpacity={0.8}
        >
          <Icon name="dashboard" size={40} color="#1F2937" style={{ marginBottom: 10 }} />
          <Text style={styles.cardTitle}>Dashboard</Text>
          <Text style={styles.cardSubtitle}>Go to your dashboard and settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1F2937" />
        <Text style={styles.text}>Loading Camera...</Text>
      </View>
    );
  }

  // ---- Main camera view (front camera, photo only) ----
  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        photo={true}
        onInitialized={() => setCameraReady(true)}
        onError={(error) => {
          console.error('Camera Error:', error);
          Alert.alert('Camera Error', error.message);
        }}
      />

      <View style={styles.controlOverlay}>
        <Text style={styles.title}>Mark Your Attendance</Text>

        <View style={styles.controlPanel}>
          {/* Always front camera; removed switch + torch */}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCaptureImage}
            activeOpacity={0.8}
            disabled={capturing}
          >
            <Icon name="camera" size={40} color="#FFF" style={{ marginBottom: 10 }} />
            <Text style={styles.actionButtonText}>
              {capturing ? 'Capturing...' : 'Capture Image'}
            </Text>
            <Text style={styles.actionButtonSubtitle}>
              {capturing ? 'Processing & uploading' : 'Send current frame to server'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Dashboard', { imagePaths })}
            activeOpacity={0.8}
          >
            <Icon name="dashboard" size={40} color="#FFF" style={{ marginBottom: 10 }} />
            <Text style={styles.actionButtonText}>Dashboard</Text>
            <Text style={styles.actionButtonSubtitle}>Go to your dashboard and settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default HomeScreen;
