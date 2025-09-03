import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { keepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { Channel, PlaybackState } from '../types';
import PlayerControls from './PlayerControls';

interface VideoPlayerProps {
  channel: Channel | null;
  onPlaybackStateChange?: (state: PlaybackState) => void;
  enableBackgroundPlayback?: boolean;
  autoplay?: boolean;
  volume?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  onPlaybackStateChange,
  enableBackgroundPlayback = true,
  autoplay = false,
  volume = 1.0,
}) => {
  const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<Video>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (channel && autoplay) {
      playVideo();
    }
  }, [channel, autoplay]);

  useEffect(() => {
    if ('isLoaded' in status && status.isLoaded) {
      const playbackState: PlaybackState = {
        isPlaying: status.isPlaying || false,
        currentTime: status.positionMillis || 0,
        duration: status.durationMillis || 0,
        volume: status.volume || volume,
        isBuffering: status.isBuffering || false,
      };
      
      onPlaybackStateChange?.(playbackState);
      
      // Keep screen awake when playing
      if (status.isPlaying) {
        keepAwake();
      } else {
        deactivateKeepAwake();
      }
    }
  }, [status, onPlaybackStateChange, volume]);

  useEffect(() => {
    // Configure audio session for background playback
    if (enableBackgroundPlayback) {
      configureAudioSession();
    }
    
    return () => {
      deactivateKeepAwake();
    };
  }, [enableBackgroundPlayback]);

  const configureAudioSession = async () => {
    try {
      // This would be configured differently in a production app
      // For now, we'll handle it in the audio service
    } catch (error) {
      console.error('Error configuring audio session:', error);
    }
  };

  const playVideo = async () => {
    if (videoRef.current && channel) {
      try {
        await videoRef.current.loadAsync(
          { uri: channel.url },
          {
            shouldPlay: true,
            isLooping: false,
            volume: volume,
          },
          false
        );
      } catch (error) {
        console.error('Error loading video:', error);
        Alert.alert(
          'Playback Error',
          'Could not load the video stream. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const pauseVideo = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.pauseAsync();
      } catch (error) {
        console.error('Error pausing video:', error);
      }
    }
  };

  const stopVideo = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.unloadAsync();
        deactivateKeepAwake();
      } catch (error) {
        console.error('Error stopping video:', error);
      }
    }
  };

  const setVolume = async (newVolume: number) => {
    if (videoRef.current) {
      try {
        await videoRef.current.setVolumeAsync(newVolume);
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }
  };

  const handlePlayPause = async () => {
    if ('isLoaded' in status && status.isLoaded) {
      if (status.isPlaying) {
        await pauseVideo();
      } else {
        await videoRef.current?.playAsync();
      }
    } else if (channel) {
      await playVideo();
    }
  };

  const handleStop = async () => {
    await stopVideo();
  };

  const handleVolumeChange = async (newVolume: number) => {
    await setVolume(newVolume);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleVideoPress = () => {
    if (showControls) {
      setShowControls(false);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      showControlsTemporarily();
    }
  };

  if (!channel) {
    return (
      <View style={styles.emptyContainer}>
        {/* Empty state - could add a placeholder here */}
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <Video
        ref={videoRef}
        style={[styles.video, isFullscreen && styles.fullscreenVideo]}
        source={{ uri: channel.url }}
        useNativeControls={false}
        resizeMode={ResizeMode.CONTAIN}
        onPlaybackStatusUpdate={setStatus}
        onTouchStart={handleVideoPress}
      />
      
      {showControls && (
        <PlayerControls
          isPlaying={'isLoaded' in status && status.isLoaded ? status.isPlaying || false : false}
          volume={volume}
          channel={channel}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onVolumeChange={handleVolumeChange}
          onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
          isFullscreen={isFullscreen}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  video: {
    flex: 1,
  },
  fullscreenVideo: {
    width: screenHeight,
    height: screenWidth,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoPlayer;