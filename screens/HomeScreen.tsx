import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel, ChannelGroup, PlaylistSource, AppSettings } from '../types';
import { M3UParser } from '../services/M3UParser';
import { AuthService } from '../services/AuthService';
import { StorageService } from '../services/StorageService';
import { BackgroundAudioService } from '../services/BackgroundAudioService';
import ChannelList from '../components/ChannelList';
import AddPlaylistModal from '../components/AddPlaylistModal';

interface HomeScreenProps {
  onChannelSelect: (channel: Channel) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onChannelSelect }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<ChannelGroup[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);
  const [currentView, setCurrentView] = useState<'all' | 'favorites' | 'recent'>('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [savedChannels, savedSettings] = await Promise.all([
        StorageService.getChannels(),
        StorageService.getSettings(),
      ]);

      setChannels(savedChannels);
      setSettings(savedSettings);
      setGroups(M3UParser.groupChannels(savedChannels));
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleAddPlaylist = async (source: PlaylistSource) => {
    setIsLoading(true);
    try {
      let newChannels: Channel[] = [];

      if (source.type === 'url' && source.url) {
        newChannels = await M3UParser.fetchM3UFromUrl(source.url);
      } else if (source.type === 'credentials' && source.username && source.password && source.serverUrl) {
        const credentials = {
          username: source.username,
          password: source.password,
          serverUrl: AuthService.formatServerUrl(source.serverUrl),
        };
        
        newChannels = await AuthService.getXtreamCodesChannels(credentials);
        await StorageService.saveCredentials(credentials);
      }

      if (newChannels.length > 0) {
        const updatedChannels = [...channels, ...newChannels];
        setChannels(updatedChannels);
        setGroups(M3UParser.groupChannels(updatedChannels));
        
        await StorageService.saveChannels(updatedChannels);
        
        const sources = await StorageService.getPlaylistSources();
        await StorageService.savePlaylistSources([...sources, source]);
        
        Alert.alert(
          'Success',
          `Added ${newChannels.length} channels from playlist`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Warning', 'No channels found in the playlist');
      }
    } catch (error) {
      console.error('Error adding playlist:', error);
      Alert.alert(
        'Error',
        'Failed to load playlist. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelSelect = async (channel: Channel) => {
    try {
      if (settings) {
        await StorageService.addToRecentChannels(channel);
        
        // Update local recent channels
        const updatedSettings = { ...settings };
        updatedSettings.recentChannels = updatedSettings.recentChannels.filter(c => c.id !== channel.id);
        updatedSettings.recentChannels.unshift(channel);
        updatedSettings.recentChannels = updatedSettings.recentChannels.slice(0, 20);
        setSettings(updatedSettings);
      }
      
      onChannelSelect(channel);
    } catch (error) {
      console.error('Error selecting channel:', error);
      onChannelSelect(channel);
    }
  };

  const handleToggleFavorite = async (channelId: string) => {
    if (!settings) return;

    try {
      if (settings.favoriteChannels.includes(channelId)) {
        await StorageService.removeFromFavorites(channelId);
        const updatedSettings = {
          ...settings,
          favoriteChannels: settings.favoriteChannels.filter(id => id !== channelId),
        };
        setSettings(updatedSettings);
      } else {
        await StorageService.addToFavorites(channelId);
        const updatedSettings = {
          ...settings,
          favoriteChannels: [...settings.favoriteChannels, channelId],
        };
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const getFilteredChannels = (): Channel[] => {
    if (!settings) return channels;

    switch (currentView) {
      case 'favorites':
        return channels.filter(channel => settings.favoriteChannels.includes(channel.id));
      case 'recent':
        return settings.recentChannels;
      default:
        return channels;
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all channels, playlists, and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              setChannels([]);
              setGroups([]);
              setSettings({
                enableBackgroundPlayback: true,
                autoplay: false,
                volume: 1.0,
                favoriteChannels: [],
                recentChannels: [],
              });
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  if (channels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="tv-outline" size={64} color="#666" />
        <Text style={styles.emptyTitle}>Welcome to IPTV App</Text>
        <Text style={styles.emptyText}>
          Get started by adding your first playlist
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddPlaylistModal(true)}
          disabled={isLoading}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>
            {isLoading ? 'Loading...' : 'Add Playlist'}
          </Text>
        </TouchableOpacity>

        <AddPlaylistModal
          visible={showAddPlaylistModal}
          onClose={() => setShowAddPlaylistModal(false)}
          onAddPlaylist={handleAddPlaylist}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IPTV</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddPlaylistModal(true)}
            disabled={isLoading}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={clearAllData}>
            <Ionicons name="settings-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, currentView === 'all' && styles.activeTab]}
          onPress={() => setCurrentView('all')}
        >
          <Ionicons
            name="list"
            size={16}
            color={currentView === 'all' ? '#007AFF' : '#666'}
          />
          <Text
            style={[styles.tabText, currentView === 'all' && styles.activeTabText]}
          >
            All Channels ({channels.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, currentView === 'favorites' && styles.activeTab]}
          onPress={() => setCurrentView('favorites')}
        >
          <Ionicons
            name="heart"
            size={16}
            color={currentView === 'favorites' ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              currentView === 'favorites' && styles.activeTabText,
            ]}
          >
            Favorites ({settings?.favoriteChannels.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, currentView === 'recent' && styles.activeTab]}
          onPress={() => setCurrentView('recent')}
        >
          <Ionicons
            name="time"
            size={16}
            color={currentView === 'recent' ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              currentView === 'recent' && styles.activeTabText,
            ]}
          >
            Recent ({settings?.recentChannels.length || 0})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Channel List */}
      <ChannelList
        channels={getFilteredChannels()}
        groups={groups}
        favoriteChannels={settings?.favoriteChannels || []}
        onChannelSelect={handleChannelSelect}
        onToggleFavorite={handleToggleFavorite}
        showGrouped={currentView === 'all'}
      />

      <AddPlaylistModal
        visible={showAddPlaylistModal}
        onClose={() => setShowAddPlaylistModal(false)}
        onAddPlaylist={handleAddPlaylist}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HomeScreen;