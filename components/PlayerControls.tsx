import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Slider } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../types';

interface PlayerControlsProps {
  isPlaying: boolean;
  volume: number;
  channel: Channel;
  onPlayPause: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  volume,
  channel,
  onPlayPause,
  onStop,
  onVolumeChange,
  onFullscreenToggle,
  isFullscreen,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.channelInfo}>
          <Text style={styles.channelName} numberOfLines={1}>
            {channel.name}
          </Text>
          {channel.group && (
            <Text style={styles.channelGroup} numberOfLines={1}>
              {channel.group}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={onFullscreenToggle}
        >
          <Ionicons 
            name={isFullscreen ? "contract" : "expand"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        <View style={styles.mainControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onPlayPause}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onStop}
          >
            <Ionicons 
              name="stop" 
              size={32} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>

        {/* Volume Control */}
        <View style={styles.volumeContainer}>
          <Ionicons 
            name={volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"} 
            size={20} 
            color="#fff" 
          />
          <Slider
            style={styles.volumeSlider}
            value={volume}
            minimumValue={0}
            maximumValue={1}
            onValueChange={onVolumeChange}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbStyle={styles.sliderThumb}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  channelInfo: {
    flex: 1,
    marginRight: 20,
  },
  channelName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  channelGroup: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlButton: {
    padding: 10,
    marginHorizontal: 15,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeSlider: {
    width: 120,
    height: 40,
    marginLeft: 10,
  },
  sliderThumb: {
    backgroundColor: '#fff',
    width: 20,
    height: 20,
  },
});

export default PlayerControls;