import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel, ChannelGroup } from '../types';

interface ChannelListProps {
  channels: Channel[];
  groups: ChannelGroup[];
  favoriteChannels: string[];
  onChannelSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  showGrouped?: boolean;
}

const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  groups,
  favoriteChannels,
  onChannelSelect,
  onToggleFavorite,
  showGrouped = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const filteredChannels = useMemo(() => {
    let filtered = channels;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        channel =>
          channel.name.toLowerCase().includes(query) ||
          (channel.group && channel.group.toLowerCase().includes(query))
      );
    }

    // Filter by selected group
    if (selectedGroup) {
      filtered = filtered.filter(channel => channel.group === selectedGroup);
    }

    return filtered;
  }, [channels, searchQuery, selectedGroup]);

  const groupNames = useMemo(() => {
    return groups.map(group => group.name).sort();
  }, [groups]);

  const renderChannelItem = ({ item }: { item: Channel }) => {
    const isFavorite = favoriteChannels.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.channelItem}
        onPress={() => onChannelSelect(item)}
      >
        {item.logo ? (
          <Image source={{ uri: item.logo }} style={styles.channelLogo} />
        ) : (
          <View style={styles.placeholderLogo}>
            <Ionicons name="tv" size={20} color="#666" />
          </View>
        )}

        <View style={styles.channelInfo}>
          <Text style={styles.channelName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.group && (
            <Text style={styles.channelGroup} numberOfLines={1}>
              {item.group}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => onToggleFavorite(item.id)}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? "#ff4757" : "#666"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderGroupItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.groupItem,
        selectedGroup === item && styles.selectedGroupItem,
      ]}
      onPress={() => setSelectedGroup(selectedGroup === item ? null : item)}
    >
      <Text
        style={[
          styles.groupText,
          selectedGroup === item && styles.selectedGroupText,
        ]}
      >
        {item}
      </Text>
      <Text style={styles.groupCount}>
        {groups.find(g => g.name === item)?.channels.length || 0}
      </Text>
    </TouchableOpacity>
  );

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedGroup(null);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels or groups..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {(searchQuery || selectedGroup) && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Group Filter */}
      {showGrouped && groupNames.length > 0 && (
        <View style={styles.groupsContainer}>
          <FlatList
            data={groupNames}
            renderItem={renderGroupItem}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupsList}
          />
        </View>
      )}

      {/* Active Filters */}
      {(selectedGroup || searchQuery) && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Active filters:</Text>
          {selectedGroup && (
            <View style={styles.filterTag}>
              <Text style={styles.filterText}>Group: {selectedGroup}</Text>
              <TouchableOpacity onPress={() => setSelectedGroup(null)}>
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          {searchQuery && (
            <View style={styles.filterTag}>
              <Text style={styles.filterText}>Search: "{searchQuery}"</Text>
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>
          {filteredChannels.length} channel{filteredChannels.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Channel List */}
      <FlatList
        data={filteredChannels}
        renderItem={renderChannelItem}
        keyExtractor={item => item.id}
        style={styles.channelsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="tv-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No channels found</Text>
            {searchQuery && (
              <Text style={styles.emptySubtext}>
                Try adjusting your search or clearing filters
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  groupsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedGroupItem: {
    backgroundColor: '#007AFF',
  },
  groupText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  selectedGroupText: {
    color: '#fff',
  },
  groupCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  filtersTitle: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginVertical: 2,
  },
  filterText: {
    fontSize: 12,
    color: '#1976d2',
    marginRight: 4,
  },
  resultHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultCount: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  channelsList: {
    flex: 1,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  channelLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  placeholderLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  channelGroup: {
    fontSize: 12,
    color: '#666',
  },
  favoriteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default ChannelList;