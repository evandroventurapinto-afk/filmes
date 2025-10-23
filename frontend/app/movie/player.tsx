import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/store/themeStore';
import { watchHistoryApi } from '../../src/utils/api';

const { width, height } = Dimensions.get('window');

export default function PlayerScreen() {
  const { videoUrl, title, movieId } = useLocalSearchParams<{
    videoUrl: string;
    title: string;
    movieId: string;
  }>();
  const router = useRouter();
  const { theme } = useThemeStore();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => {
      StatusBar.setHidden(false);
      // Save watch progress
      if (status && movieId) {
        const progress = (status.positionMillis / status.durationMillis) * 100;
        watchHistoryApi.updateWatchHistory(movieId, progress).catch(console.error);
      }
    };
  }, [status, movieId]);

  useEffect(() => {
    if (showControls) {
      resetControlsTimer();
    }
  }, [showControls]);

  const resetControlsTimer = () => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = async (seconds: number) => {
    if (videoRef.current && status) {
      const newPosition = status.positionMillis + seconds * 1000;
      await videoRef.current.setPositionAsync(newPosition);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={toggleControls}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onPlaybackStatusUpdate={(status) => setStatus(status)}
          onLoad={() => setLoading(false)}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}

        {/* Controls */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={28} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSeek(-10)}
              >
                <Ionicons name="play-back" size={40} color="#FFF" />
                <Text style={styles.seekText}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.playButton]}
                onPress={togglePlayPause}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={50}
                  color="#FFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSeek(10)}
              >
                <Ionicons name="play-forward" size={40} color="#FFF" />
                <Text style={styles.seekText}>10s</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            {status && (
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>
                  {formatTime(status.positionMillis)}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(status.positionMillis / status.durationMillis) * 100}%`,
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.timeText}>
                  {formatTime(status.durationMillis)}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: height,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 20,
  },
  seekText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  timeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});