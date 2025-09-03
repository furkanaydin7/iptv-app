import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel, PlaybackState, AppSettings } from '../types';
import { StorageService } from '../services/StorageService';
import { BackgroundAudioService } from '../services/BackgroundAudioService';
import VideoPlayer from '../components/VideoPlayer';

interface PlayerScreenProps {
  channel: Channel | null;
  onBack: () => void;
}

const { width, height } = Dimensions.get('window');

const PlayerScreen: React.FC<PlayerScreenProps> = ({ channel, onBack }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    isBuffering: false,
  });
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (channel && settings) {
      setIsFavorite(settings.favoriteChannels.includes(channel.id));
    }
  }, [channel, settings]);

  const loadSettings = async () => {
    try {
      const savedSettings = await StorageService.getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handlePlaybackStateChange = (state: PlaybackState) => {
    setPlaybackState(state);
  };

  const handleToggleFavorite = async () => {
    if (!channel || !settings) return;

    try {
      if (isFavorite) {
        await StorageService.removeFromFavorites(channel.id);
        const updatedSettings = {
          ...settings,
          favoriteChannels: settings.favoriteChannels.filter(id => id !== channel.id),
        };
        setSettings(updatedSettings);
        setIsFavorite(false);
      } else {
        await StorageService.addToFavorites(channel.id);
        const updatedSettings = {
          ...settings,
          favoriteChannels: [...settings.favoriteChannels, channel.id],
        };
        setSettings(updatedSettings);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleToggleAudioMode = async () => {
    if (!channel) return;

    try {
      if (isAudioMode) {
        // Switch to video mode
        await BackgroundAudioService.switchToVideoMode(channel);
        setIsAudioMode(false);
      } else {
        // Switch to audio mode
        await BackgroundAudioService.switchToAudioMode(channel);
        setIsAudioMode(true);
      }
    } catch (error) {
      console.error('Error toggling audio mode:', error);
      Alert.alert('Error', 'Failed to switch playback mode');
    }
  };

  const formatTime = (milliseconds: number): string => {
    if (!milliseconds || milliseconds < 0) return '--:--';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  if (!channel) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="tv-outline" size={64} color="#666" />
        <Text style={styles.emptyText}>No channel selected</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.channelName} numberOfLines={1}>
            {channel.name}
          </Text>
          {channel.group && (
            <Text style={styles.channelGroup} numberOfLines={1}>
              {channel.group}
            </Text>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleToggleAudioMode}
          >
            <Ionicons
              name={isAudioMode ? "videocam" : "headset"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? "#ff4757" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Player */}
      {isAudioMode ? (
        <View style={styles.audioPlayerContainer}>
          <View style={styles.audioPlayerContent}>
            {channel.logo ? (
              <View style={styles.audioArtwork}>
                {/* In a real app, you would use Image component here */}
                <Ionicons name="musical-notes" size={48} color="#666" />
              </View>
            ) : (
              <View style={styles.audioArtwork}>
                <Ionicons name="radio" size={48} color="#666" />
              </View>
            )}
            
            <Text style={styles.audioChannelName} numberOfLines={2}>
              {channel.name}
            </Text>
            
            {channel.group && (
              <Text style={styles.audioChannelGroup} numberOfLines={1}>
                {channel.group}
              </Text>
            )}

            <View style={styles.audioControls}>
              <TouchableOpacity style={styles.audioControlButton}>
                <Ionicons name="play-skip-back" size={24} color="#333" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.audioPlayButton}>
                <Ionicons
                  name={playbackState.isPlaying ? "pause" : "play"}
                  size={32}
                  color="#fff"
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.audioControlButton}>
                <Ionicons name="play-skip-forward" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.audioInfo}>
              <Text style={styles.audioStatus}>
                {playbackState.isBuffering ? 'Buffering...' : 
                 playbackState.isPlaying ? 'Playing' : 'Paused'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <VideoPlayer
          channel={channel}
          onPlaybackStateChange={handlePlaybackStateChange}
          enableBackgroundPlayback={settings?.enableBackgroundPlayback}
          autoplay={settings?.autoplay}
          volume={settings?.volume}
        />
      )}

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <View style={styles.playbackInfo}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                playbackState.isPlaying && styles.playingIndicator,
                playbackState.isBuffering && styles.bufferingIndicator,
              ]}
            />
            <Text style={styles.statusText}>
              {playbackState.isBuffering
                ? 'Buffering...'
                : playbackState.isPlaying
                ? 'Playing'
                : 'Paused'}
            </Text>
          </View>
          
          <Text style={styles.modeText}>
            {isAudioMode ? 'Audio Mode' : 'Video Mode'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
  },
  backIconButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  channelGroup: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  audioPlayerContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    paddingTop: 100,
  },
  audioPlayerContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  audioArtwork: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e1e8ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  audioChannelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  audioChannelGroup: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  audioControlButton: {
    padding: 16,
    marginHorizontal: 16,
  },
  audioPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  audioInfo: {
    alignItems: 'center',
  },
  audioStatus: {
    fontSize: 14,
    color: '#666',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 30,
  },
  playbackInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginRight: 8,
  },
  playingIndicator: {
    backgroundColor: '#4CAF50',
  },
  bufferingIndicator: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
  },
  modeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlayerScreen;