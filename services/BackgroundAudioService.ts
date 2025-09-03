import { Audio } from 'expo-av';
import { Channel } from '../types';

export class BackgroundAudioService {
  private static sound: Audio.Sound | null = null;
  private static currentChannel: Channel | null = null;

  static async initializeAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error initializing audio:', error);
      throw error;
    }
  }

  static async playChannel(channel: Channel): Promise<void> {
    try {
      // Stop current playback if any
      await this.stop();

      // Initialize audio mode for background playback
      await this.initializeAudio();

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: channel.url },
        {
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.currentChannel = channel;
    } catch (error) {
      console.error('Error playing channel in background:', error);
      throw error;
    }
  }

  static async pause(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.pauseAsync();
      } catch (error) {
        console.error('Error pausing background audio:', error);
        throw error;
      }
    }
  }

  static async resume(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.playAsync();
      } catch (error) {
        console.error('Error resuming background audio:', error);
        throw error;
      }
    }
  }

  static async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
        this.sound = null;
        this.currentChannel = null;
      } catch (error) {
        console.error('Error stopping background audio:', error);
        throw error;
      }
    }
  }

  static async setVolume(volume: number): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.setVolumeAsync(volume);
      } catch (error) {
        console.error('Error setting background audio volume:', error);
        throw error;
      }
    }
  }

  static getCurrentChannel(): Channel | null {
    return this.currentChannel;
  }

  static async getStatus(): Promise<any> {
    if (this.sound) {
      try {
        return await this.sound.getStatusAsync();
      } catch (error) {
        console.error('Error getting background audio status:', error);
        return null;
      }
    }
    return null;
  }

  private static onPlaybackStatusUpdate = (status: any) => {
    if (status.error) {
      console.error('Background playback error:', status.error);
    }
    
    if (status.didJustFinish) {
      console.log('Background playback finished');
      // Could implement auto-advance to next channel here
    }
  };

  static async isPlaying(): Promise<boolean> {
    const status = await this.getStatus();
    return status?.isLoaded && status?.isPlaying;
  }

  static async switchToVideoMode(channel: Channel): Promise<void> {
    // This method would be called when switching from audio-only to video playback
    // Stop background audio and let the video player take over
    if (this.currentChannel?.id === channel.id) {
      await this.stop();
    }
  }

  static async switchToAudioMode(channel: Channel): Promise<void> {
    // This method would be called when switching from video to audio-only playback
    await this.playChannel(channel);
  }
}