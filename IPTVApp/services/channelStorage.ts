import AsyncStorage from '@react-native-async-storage/async-storage';
import { Channel } from '../types';
import { XtreamCredentials } from '../types/xtream';

const CHANNELS_KEY = 'iptv_channels';
const M3U_URLS_KEY = 'iptv_m3u_urls';
const XTREAM_SOURCES_KEY = 'iptv_xtream_sources';

export interface StoredM3USource {
  id: string;
  name: string;
  url: string;
  addedAt: number;
  lastUpdated?: number;
}

export interface StoredXtreamSource {
  id: string;
  name: string;
  credentials: XtreamCredentials;
  addedAt: number;
  lastUpdated?: number;
  accountInfo?: {
    username: string;
    expDate: string;
    status: string;
    maxConnections: string;
  };
}

export class ChannelStorage {
  static async getChannels(): Promise<Channel[]> {
    try {
      const channelsJson = await AsyncStorage.getItem(CHANNELS_KEY);
      if (!channelsJson) return [];
      return JSON.parse(channelsJson);
    } catch (error) {
      console.error('Failed to load channels:', error);
      return [];
    }
  }

  static async saveChannels(channels: Channel[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
    } catch (error) {
      console.error('Failed to save channels:', error);
      throw new Error('Failed to save channels');
    }
  }

  static async addChannels(newChannels: Channel[]): Promise<void> {
    const existingChannels = await this.getChannels();
    
    // Remove duplicates based on URL
    const existingUrls = new Set(existingChannels.map(ch => ch.url));
    const uniqueNewChannels = newChannels.filter(ch => !existingUrls.has(ch.url));
    
    const allChannels = [...existingChannels, ...uniqueNewChannels];
    await this.saveChannels(allChannels);
  }

  static async clearChannels(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CHANNELS_KEY);
    } catch (error) {
      console.error('Failed to clear channels:', error);
      throw new Error('Failed to clear channels');
    }
  }

  static async getM3USources(): Promise<StoredM3USource[]> {
    try {
      const sourcesJson = await AsyncStorage.getItem(M3U_URLS_KEY);
      if (!sourcesJson) return [];
      return JSON.parse(sourcesJson);
    } catch (error) {
      console.error('Failed to load M3U sources:', error);
      return [];
    }
  }

  static async addM3USource(source: Omit<StoredM3USource, 'id' | 'addedAt'>): Promise<StoredM3USource> {
    const sources = await this.getM3USources();
    
    // Check if URL already exists
    const existingSource = sources.find(s => s.url === source.url);
    if (existingSource) {
      throw new Error('This M3U URL is already added');
    }

    const newSource: StoredM3USource = {
      ...source,
      id: Date.now().toString(),
      addedAt: Date.now()
    };

    sources.push(newSource);
    
    try {
      await AsyncStorage.setItem(M3U_URLS_KEY, JSON.stringify(sources));
      return newSource;
    } catch (error) {
      console.error('Failed to save M3U source:', error);
      throw new Error('Failed to save M3U source');
    }
  }

  static async removeM3USource(id: string): Promise<void> {
    const sources = await this.getM3USources();
    const updatedSources = sources.filter(s => s.id !== id);
    
    try {
      await AsyncStorage.setItem(M3U_URLS_KEY, JSON.stringify(updatedSources));
    } catch (error) {
      console.error('Failed to remove M3U source:', error);
      throw new Error('Failed to remove M3U source');
    }
  }

  static async updateM3USource(id: string, updates: Partial<StoredM3USource>): Promise<void> {
    const sources = await this.getM3USources();
    const sourceIndex = sources.findIndex(s => s.id === id);
    
    if (sourceIndex === -1) {
      throw new Error('M3U source not found');
    }

    sources[sourceIndex] = { ...sources[sourceIndex], ...updates };
    
    try {
      await AsyncStorage.setItem(M3U_URLS_KEY, JSON.stringify(sources));
    } catch (error) {
      console.error('Failed to update M3U source:', error);
      throw new Error('Failed to update M3U source');
    }
  }

  // Xtream Codes methods
  static async getXtreamSources(): Promise<StoredXtreamSource[]> {
    try {
      const sourcesJson = await AsyncStorage.getItem(XTREAM_SOURCES_KEY);
      if (!sourcesJson) return [];
      return JSON.parse(sourcesJson);
    } catch (error) {
      console.error('Failed to load Xtream sources:', error);
      return [];
    }
  }

  static async addXtreamSource(source: Omit<StoredXtreamSource, 'id' | 'addedAt'>): Promise<StoredXtreamSource> {
    const sources = await this.getXtreamSources();
    
    // Check if server URL and username combination already exists
    const existingSource = sources.find(s => 
      s.credentials.serverUrl === source.credentials.serverUrl && 
      s.credentials.username === source.credentials.username
    );
    if (existingSource) {
      throw new Error('This Xtream account is already added');
    }

    const newSource: StoredXtreamSource = {
      ...source,
      id: Date.now().toString(),
      addedAt: Date.now()
    };

    sources.push(newSource);
    
    try {
      await AsyncStorage.setItem(XTREAM_SOURCES_KEY, JSON.stringify(sources));
      return newSource;
    } catch (error) {
      console.error('Failed to save Xtream source:', error);
      throw new Error('Failed to save Xtream source');
    }
  }

  static async removeXtreamSource(id: string): Promise<void> {
    const sources = await this.getXtreamSources();
    const updatedSources = sources.filter(s => s.id !== id);
    
    try {
      await AsyncStorage.setItem(XTREAM_SOURCES_KEY, JSON.stringify(updatedSources));
    } catch (error) {
      console.error('Failed to remove Xtream source:', error);
      throw new Error('Failed to remove Xtream source');
    }
  }

  static async updateXtreamSource(id: string, updates: Partial<StoredXtreamSource>): Promise<void> {
    const sources = await this.getXtreamSources();
    const sourceIndex = sources.findIndex(s => s.id === id);
    
    if (sourceIndex === -1) {
      throw new Error('Xtream source not found');
    }

    sources[sourceIndex] = { ...sources[sourceIndex], ...updates };
    
    try {
      await AsyncStorage.setItem(XTREAM_SOURCES_KEY, JSON.stringify(sources));
    } catch (error) {
      console.error('Failed to update Xtream source:', error);
      throw new Error('Failed to update Xtream source');
    }
  }

  // Clear all sources and channels
  static async clearAllSources(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CHANNELS_KEY),
        AsyncStorage.removeItem(M3U_URLS_KEY),
        AsyncStorage.removeItem(XTREAM_SOURCES_KEY)
      ]);
    } catch (error) {
      console.error('Failed to clear all sources:', error);
      throw new Error('Failed to clear all sources');
    }
  }
}