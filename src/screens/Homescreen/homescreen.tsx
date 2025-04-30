import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import RNFS from 'react-native-fs'; // Import react-native-fs for file management
import { styles } from '../Homescreen/homescreen.styles';

// Define the type for the navigation stack
type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { videoPaths?: string[] };
};

// Define the navigation prop type
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [permissionAsked, setPermissionAsked] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState<'on' | 'off'>('off');
  const [videoPaths, setVideoPaths] = useState<string[]>([]); // Store video paths

  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === cameraPosition);

  // Load saved video paths on component mount
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const videoDir = `${RNFS.DocumentDirectoryPath}/recordedVideos`;
        const exists = await RNFS.exists(videoDir);
        if (!exists) {
          await RNFS.mkdir(videoDir);
        }
        const files = await RNFS.readdir(videoDir);
        const videoFiles = files
          .filter((file) => file.endsWith('.mp4'))
          .map((file) => `${videoDir}/${file}`);
        setVideoPaths(videoFiles);
      } catch (error) {
        console.error('Error loading videos:', error);
        Alert.alert('Error', 'Failed to load saved videos.');
      }
    };
    loadVideos();
  }, []);

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
          Alert.alert('Permission Denied', 'Camera and Microphone access are required.');
        }
      } else if (cameraStatus === RESULTS.BLOCKED || micStatus === RESULTS.BLOCKED) {
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
  const handlePermissionRequest = async (option: 'allow' | 'onlyThisTime' | 'deny') => {
    setShowPermissionModal(false);
    if (option === 'deny') {
      setPermissionAsked(true);
      return;
    }
    await requestSystemPermissions();
    await checkPermissions();
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
        const videoDir = `${RNFS.DocumentDirectoryPath}/recordedVideos`;
        const exists = await RNFS.exists(videoDir);
        if (!exists) {
          await RNFS.mkdir(videoDir);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = `${videoDir}/video-${timestamp}.mp4`;

        await camera.current?.startRecording({
          fileType: 'mp4', // Ensure MP4 format
          videoCodec: 'h264', // Use H.264 for compatibility
          onRecordingFinished: async (video: VideoFile) => {
            try {
              // Move the recorded video to the desired location
              await RNFS.moveFile(video.path, filePath);
              console.log('Recording saved to:', filePath);
              Alert.alert('Recording Saved', `Saved to: ${filePath}`);
              setVideoPaths((prev) => [...prev, filePath]); // Add new video path
              setRecording(false);
            } catch (error) {
              console.error('Error saving video:', error);
              Alert.alert('Error', 'Failed to save video.');
              setRecording(false);
            }
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

  // Toggle camera position
  const toggleCameraPosition = () => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Toggle torch
  const toggleTorch = () => {
    setTorch((prev) => (prev === 'on' ? 'off' : 'on'));
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
                <Icon name="mic" type="font-awesome" size={40} color="#00AEEF" style={styles.modalIcon} />
                <Text style={styles.modalTitle}>Allow adas_system to record audio?</Text>
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
        <TouchableOpacity style={styles.card} onPress={handleStartRecording} activeOpacity={0.8} disabled={!hasPermission}>
          <Icon name="video" size={40} color="#1F2937" style={{ marginBottom: 10 }} />
          <Text style={styles.cardTitle}>{hasPermission ? 'Start Recording' : 'Permissions Required'}</Text>
          <Text style={styles.cardSubtitle}>
            {hasPermission ? "Monitor driver's drowsiness in real-time" : 'Please grant permissions'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.card, { marginTop: 20 }]}
          onPress={() => navigation.navigate('Dashboard', { videoPaths })}
          activeOpacity={0.8}
        >
          <Icon name="dashboard" size={40} color="#1F2937" style={{ marginBottom: 10 }} />
          <Text style={styles.cardTitle}>Dashboard</Text>
          <Text style={styles.cardSubtitle}>Go to your dashboard and settings</Text>
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

  // Render camera view with controls
  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        torch={torch}
        onInitialized={() => setCameraReady(true)}
        onError={(error) => {
          console.error('Camera Error:', error);
          Alert.alert('Camera Error', error.message);
        }}
      />
      <View style={styles.controlOverlay}>
        <Text style={styles.title}>Driver Safety System</Text>
        <View style={styles.controlPanel}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraPosition} activeOpacity={0.8}>
            <Icon name="camera-switch" size={30} color="#FFF" />
            <Text style={styles.controlButtonText}>Switch Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={toggleTorch} activeOpacity={0.8}>
            <Icon name="flash" size={30} color="#FFF" />
            <Text style={styles.controlButtonText}>{torch === 'on' ? 'Turn Off Torch' : 'Turn On Torch'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleStartRecording} activeOpacity={0.8}>
            <Icon name={recording ? 'stop' : 'video'} size={40} color="#FFF" style={{ marginBottom: 10 }} />
            <Text style={styles.actionButtonText}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
            <Text style={styles.actionButtonSubtitle}>
              {recording ? 'Recording in progress' : "Monitor driver's drowsiness in real-time"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Dashboard', { videoPaths })}
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