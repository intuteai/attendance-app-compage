import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Video, { VideoRef } from 'react-native-video'; // Import VideoRef type
import { Icon } from 'react-native-elements';
import { styles } from './dashboard.styles';

// Define the type for the navigation stack
type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { videoPaths?: string[] };
};

// Use NativeStackScreenProps to get both navigation and route props
type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation, route }: Props) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const videoRef = useRef<VideoRef>(null); // Use VideoRef type for the ref

  // Use dummy videos if no video paths are passed; otherwise, use the passed video paths
  const videoPaths = route.params?.videoPaths || [];
  const videos = videoPaths.length > 0
    ? videoPaths.map((path, index) => ({ id: String(index), title: `Recording ${index + 1}`, path }))
    : [
        { id: '1', title: 'Driver Recording 1', path: 'path/to/video1' },
        { id: '2', title: 'Driver Recording 2', path: 'path/to/video2' },
        { id: '3', title: 'Driver Recording 3', path: 'path/to/video3' },
        { id: '4', title: 'Driver Recording 4', path: 'path/to/video4' },
      ];

  const renderVideoItem = ({ item }: { item: { id: string; title: string; path: string } }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => {
        setSelectedVideo(item.path);
        setError(null);
        setIsPaused(false);
      }}
    >
      <Text style={styles.videoText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Videos</Text>

      {selectedVideo ? (
        <>
          <View style={{ width: '100%', height: height * 0.5, backgroundColor: '#000' }}>
            <Video
              ref={videoRef}
              source={{ uri: selectedVideo }}
              style={{ width: '100%', height: '100%' }}
              controls={true}
              paused={isPaused}
              resizeMode="contain"
              onError={(error) => {
                console.error('Video playback error:', error);
                setError('Failed to play video. It might be corrupted or inaccessible.');
              }}
              onLoad={() => setError(null)}
              onEnd={() => setIsPaused(true)}
            />
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setIsPaused((prev) => !prev)}
            >
              <Icon
                name={isPaused ? 'play' : 'pause'}
                type="font-awesome"
                size={20}
                color="#FFF"
              />
              <Text style={styles.controlButtonText}>{isPaused ? 'Play' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                setSelectedVideo(null);
                setError(null);
                setIsPaused(false);
              }}
            >
              <Icon name="arrow-left" type="font-awesome" size={20} color="#FFF" />
              <Text style={styles.controlButtonText}>Back to List</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            renderItem={renderVideoItem}
            contentContainerStyle={styles.list}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
            <Text style={styles.backText}>Back to Home</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default DashboardScreen;