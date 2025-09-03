import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Channel } from '../types';
import { ChannelStorage } from '../services/channelStorage';

interface HomeScreenProps {
  onChannelSelect: (channel: Channel) => void;
  onOpenSettings: () => void;
}

const SAMPLE_CHANNELS: Channel[] = [
  {
    id: '1',
    name: 'Big Buck Bunny (Test Stream)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Test',
  },
  {
    id: '2',
    name: 'Sintel (Test Stream)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'Test',
  },
  {
    id: '3',
    name: 'Apple HLS Test Stream',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    category: 'Test HLS',
  },
];

export default function HomeScreen({ onChannelSelect, onOpenSettings }: HomeScreenProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const storedChannels = await ChannelStorage.getChannels();
      const channelData = storedChannels.length === 0 ? SAMPLE_CHANNELS : storedChannels;
      setChannels(channelData);
      setFilteredChannels(channelData);
    } catch (error) {
      console.error('Failed to load channels:', error);
      // Fallback to sample channels on error
      setChannels(SAMPLE_CHANNELS);
      setFilteredChannels(SAMPLE_CHANNELS);
    } finally {
      setLoading(false);
    }
  };

  // Filter channels based on search query
  const filterChannels = (query: string) => {
    if (!query.trim()) {
      setFilteredChannels(channels);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = channels.filter(channel => 
      channel.name.toLowerCase().includes(lowercaseQuery) ||
      (channel.category && channel.category.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredChannels(filtered);
  };

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    filterChannels(text);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredChannels(channels);
  };

  const renderChannelItem = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={styles.channelItem}
      onPress={() => onChannelSelect(item)}
    >
      <Text style={styles.channelName}>{item.name}</Text>
      {item.category && (
        <Text style={styles.channelCategory}>{item.category}</Text>
      )}
    </TouchableOpacity>
  );

  // Define item layout for better scrollToIndex performance  
  // Channel item = padding(32) + marginBottom(8) + content(~40) = ~80px
  const ITEM_HEIGHT = 80;
  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading channels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IPTV Channels ({filteredChannels.length}/{channels.length})</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
          <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Suche nach Kanälen oder Kategorie..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {channels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No channels available</Text>
          <Text style={styles.emptySubText}>
            Add M3U sources in Settings to get started
          </Text>
          <TouchableOpacity style={styles.settingsLinkButton} onPress={onOpenSettings}>
            <Text style={styles.settingsLinkButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      ) : filteredChannels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Keine Kanäle gefunden</Text>
          <Text style={styles.emptySubText}>
            Keine Kanäle entsprechen Ihrer Suche "{searchQuery}"
          </Text>
          <TouchableOpacity style={styles.settingsLinkButton} onPress={clearSearch}>
            <Text style={styles.settingsLinkButtonText}>Suche zurücksetzen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredChannels}
          renderItem={renderChannelItem}
          keyExtractor={(item) => item.id}
          style={styles.channelList}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={(info) => {
            console.log('ScrollToIndex failed:', info);
            // Fallback to manual scroll with corrected height
            const offset = info.index * ITEM_HEIGHT;
            flatListRef.current?.scrollToOffset({
              offset,
              animated: false
            });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 8,
  },
  clearButton: {
    padding: 8,
    marginLeft: 8,
  },
  clearButtonText: {
    color: '#999',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  settingsButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  settingsLinkButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsLinkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  channelList: {
    flex: 1,
  },
  channelItem: {
    backgroundColor: '#333',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  channelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  channelCategory: {
    fontSize: 14,
    color: '#999',
  },
});
