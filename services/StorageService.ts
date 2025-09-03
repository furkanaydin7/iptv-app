import AsyncStorage from '@react-native-async-storage/async-storage';
import { Channel, PlaylistSource, AppSettings, UserCredentials } from '../types';

export class StorageService {
  private static readonly KEYS = {
    CHANNELS: '@iptv_channels',
    PLAYLIST_SOURCES: '@iptv_playlist_sources',
    SETTINGS: '@iptv_settings',
    CREDENTIALS: '@iptv_credentials',
    FAVORITES: '@iptv_favorites',
    RECENT_CHANNELS: '@iptv_recent_channels',
  };

  static async saveChannels(channels: Channel[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.CHANNELS, JSON.stringify(channels));
    } catch (error) {
      console.error('Error saving channels:', error);
      throw error;
    }
  }

  static async getChannels(): Promise<Channel[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.CHANNELS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading channels:', error);
      return [];
    }
  }

  static async savePlaylistSources(sources: PlaylistSource[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.PLAYLIST_SOURCES, JSON.stringify(sources));
    } catch (error) {
      console.error('Error saving playlist sources:', error);
      throw error;
    }
  }

  static async getPlaylistSources(): Promise<PlaylistSource[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.PLAYLIST_SOURCES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading playlist sources:', error);
      return [];
    }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  static async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.SETTINGS);
      return data ? JSON.parse(data) : {
        enableBackgroundPlayback: true,
        autoplay: false,
        volume: 1.0,
        favoriteChannels: [],
        recentChannels: [],
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        enableBackgroundPlayback: true,
        autoplay: false,
        volume: 1.0,
        favoriteChannels: [],
        recentChannels: [],
      };
    }
  }

  static async saveCredentials(credentials: UserCredentials): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.CREDENTIALS, JSON.stringify(credentials));
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  }

  static async getCredentials(): Promise<UserCredentials | null> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.CREDENTIALS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading credentials:', error);
      return null;
    }
  }

  static async addToFavorites(channelId: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.favoriteChannels.includes(channelId)) {
        settings.favoriteChannels.push(channelId);
        await this.saveSettings(settings);
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  static async removeFromFavorites(channelId: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings.favoriteChannels = settings.favoriteChannels.filter(id => id !== channelId);
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  static async addToRecentChannels(channel: Channel): Promise<void> {
    try {
      const settings = await this.getSettings();
      
      // Remove if already exists
      settings.recentChannels = settings.recentChannels.filter(c => c.id !== channel.id);
      
      // Add to beginning
      settings.recentChannels.unshift(channel);
      
      // Keep only last 20 items
      settings.recentChannels = settings.recentChannels.slice(0, 20);
      
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error adding to recent channels:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(this.KEYS));
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}