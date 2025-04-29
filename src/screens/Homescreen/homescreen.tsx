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
import { Camera, useCameraDevices, VideoFile } from 'react-native-vision-camera';
import { Icon } from 'react-native-elements';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';
import { styles } from '../Homescreen/homescreen.styles';

const HomeScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [permissionAsked, setPermissionAsked] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');

  // Check current permission status
  const checkPermissions = async () => {
    try {
      let cameraStatus;
      let micStatus;

      if (Platform.OS === 'android') {
        cameraStatus = await check(PERMISSIONS.ANDROID.CAMERA);
        micStatus = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
      } else {
        cameraStatus = await check(PERMISSIONS.IOS.CAMERA);
        micStatus = await check(PERMISSIONS.IOS.MICROPHONE);
      }

      if (cameraStatus === RESULTS.GRANTED && micStatus === RESULTS.GRANTED) {
        const cameraPermission = await Camera.getCameraPermissionStatus();
        const microphonePermission = await Camera.getMicrophonePermissionStatus();

        if (cameraPermission === 'granted' && microphonePermission === 'granted') {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          setShowPermissionModal(true); // Show modal if VisionCamera permissions are missing
        }
      } else {
        setHasPermission(false);
        setShowPermissionModal(true); // Show modal if system permissions are missing
      }
      setPermissionAsked(true);
    } catch (error) {
      console.error('Permission check error:', error);
      Alert.alert('Error', 'Failed to check permissions.');
    }
  };

  // Request system and VisionCamera permissions
  const requestSystemPermissions = async () => {
    try {
      let cameraStatus;
      let micStatus;

      if (Platform.OS === 'android') {
        cameraStatus = await request(PERMISSIONS.ANDROID.CAMERA);
        micStatus = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      } else {
        cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
        micStatus = await request(PERMISSIONS.IOS.MICROPHONE);
      }

      if (cameraStatus === RESULTS.GRANTED && micStatus === RESULTS.GRANTED) {
        const cameraPermission = await Camera.requestCameraPermission();
        const microphonePermission = await Camera.requestMicrophonePermission();

        if (cameraPermission === 'granted' && microphonePermission === 'granted') {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          Alert.alert(
            'Permission Denied',
            'Camera and Microphone access are required.'
          );
        }
      } else if (
        cameraStatus === RESULTS.BLOCKED ||
        micStatus === RESULTS.BLOCKED
      ) {
        Alert.alert(
          'Permissions Blocked',
          'Camera and Microphone access are blocked. Please enable them in Settings.',
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

  // Handle user's permission choice
  const handlePermissionRequest = async (
    option: 'allow' | 'onlyThisTime' | 'deny'
  ) => {
    setShowPermissionModal(false); // Close modal immediately
    if (option === 'deny') {
      setPermissionAsked(true);
      return;
    }
    await requestSystemPermissions(); // Request permissions
    await checkPermissions(); // Update state based on result
  };

  // Start or stop recording
  const handleStartRecording = async () => {
    if (!device || !cameraReady) {
      Alert.alert('Camera not ready', 'Please wait until camera is ready...');
      return;
    }

    if (!hasPermission) {
      await checkPermissions();
      return;
    }

    try {
      if (!recording) {
        const options = { video: true, audio: true };
        await camera.current?.startRecording({
          ...options,
          onRecordingFinished: (video: VideoFile) => {
            console.log('Recording finished:', video.path);
            Alert.alert('Recording Saved', `Saved to: ${video.path}`);
            setRecording(false);
          },
          onRecordingError: (error) => {
            console.error('Recording error:', error);
            Alert.alert('Recording Error', error.message);
            setRecording(false);
          },
        });
        setRecording(true);
      } else {
        await camera.current?.stopRecording();
        setRecording(false);
      }
    } catch (error) {
      console.error('Error starting/stopping recording:', error);
      Alert.alert('Error', 'Failed to manage recording.');
      setRecording(false);
    }
  };

  // Initial permission check
  useEffect(() => {
    if (!permissionAsked) {
      checkPermissions();
    }
  }, []);

  // Render permission screen if permissions are not granted
  if (!permissionAsked || !hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Driver Safety System</Text>
        {!hasPermission && (
          <Modal
            transparent={true}
            visible={showPermissionModal}
            animationType="fade"
            onRequestClose={() => setShowPermissionModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Icon
                  name="mic"
                  type="font-awesome"
                  size={40}
                  color="#00AEEF"
                  style={styles.modalIcon}
                />
                <Text style={styles.modalTitle}>
                  Allow adas_system to record audio?
                </Text>
                <Text style={styles.modalSubtitle}>While using the app</Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handlePermissionRequest('allow')}
                >
                  <Text style={styles.modalButtonText}>
                    WHILE USING THE APP
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handlePermissionRequest('onlyThisTime')}
                >
                  <Text style={styles.modalButtonText}>ONLY THIS TIME</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handlePermissionRequest('deny')}
                >
                  <Text style={styles.modalButtonText}>DON'T ALLOW</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        <TouchableOpacity
          style={styles.card}
          onPress={handleStartRecording}
          activeOpacity={0.8}
          disabled={!hasPermission}
        >
          <Icon
            name="video"
            size={40}
            color="#1F2937"
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.cardTitle}>
            {hasPermission ? 'Start Recording' : 'Permissions Required'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {hasPermission
              ? "Monitor driver's drowsiness in real-time"
              : 'Please grant permissions'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render loading screen if no camera device
  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1F2937" />
        <Text style={styles.text}>Loading Camera...</Text>
      </View>
    );
  }

  // Render camera view
  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        onInitialized={() => setCameraReady(true)}
        onError={(error) => {
          console.error('Camera Error:', error);
          Alert.alert('Camera Error', error.message);
        }}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={handleStartRecording}
          activeOpacity={0.8}
        >
          <Icon
            name="video"
            size={40}
            color="#1F2937"
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.cardTitle}>
            {recording ? 'Stop Recording' : 'Start Recording'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {recording
              ? 'Recording in progress'
              : "Monitor driver's drowsiness in real-time"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;