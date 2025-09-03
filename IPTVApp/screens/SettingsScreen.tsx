import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { ChannelStorage, StoredM3USource, StoredXtreamSource } from '../services/channelStorage';
import { parseM3UFromUrl } from '../utils/m3uParser';
import { XtreamCodesClient } from '../utils/xtreamClient';
import { XtreamCredentials } from '../types/xtream';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  // UI state
  const [activeTab, setActiveTab] = useState<'m3u' | 'xtream'>('m3u');
  const [loading, setLoading] = useState(false);
  const [loadingSources, setLoadingSources] = useState(true);

  // M3U state
  const [m3uUrl, setM3uUrl] = useState('');
  const [m3uSourceName, setM3uSourceName] = useState('');
  const [m3uSources, setM3uSources] = useState<StoredM3USource[]>([]);

  // Xtream state
  const [xtreamName, setXtreamName] = useState('');
  const [xtreamServer, setXtreamServer] = useState('');
  const [xtreamUsername, setXtreamUsername] = useState('');
  const [xtreamPassword, setXtreamPassword] = useState('');
  const [xtreamSources, setXtreamSources] = useState<StoredXtreamSource[]>([]);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const [m3uData, xtreamData] = await Promise.all([
        ChannelStorage.getM3USources(),
        ChannelStorage.getXtreamSources()
      ]);
      setM3uSources(m3uData);
      setXtreamSources(xtreamData);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoadingSources(false);
    }
  };

  // M3U Functions
  const handleAddM3U = async () => {
    if (!m3uUrl.trim()) {
      Alert.alert('Error', 'Please enter an M3U URL');
      return;
    }

    if (!m3uSourceName.trim()) {
      Alert.alert('Error', 'Please enter a name for this source');
      return;
    }

    setLoading(true);

    try {
      const parseResult = await parseM3UFromUrl(m3uUrl.trim());
      
      if (parseResult.channels.length === 0) {
        Alert.alert(
          'No Channels Found',
          parseResult.errors.length > 0 
            ? `Failed to parse M3U: ${parseResult.errors.join(', ')}`
            : 'No valid channels found in the M3U file'
        );
        return;
      }

      const newSource = await ChannelStorage.addM3USource({
        name: m3uSourceName.trim(),
        url: m3uUrl.trim()
      });

      await ChannelStorage.addChannels(parseResult.channels);
      setM3uSources(prev => [...prev, newSource]);

      setM3uUrl('');
      setM3uSourceName('');

      Alert.alert(
        'Success',
        `Added ${parseResult.channels.length} channels from "${m3uSourceName}"`
      );

    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add M3U source'
      );
    } finally {
      setLoading(false);
    }
  };

  // Xtream Functions
  const handleTestXtream = async () => {
    if (!xtreamServer.trim() || !xtreamUsername.trim() || !xtreamPassword.trim()) {
      Alert.alert('Error', 'Please fill in all Xtream Codes fields first');
      return;
    }

    const credentials: XtreamCredentials = {
      serverUrl: xtreamServer.trim(),
      username: xtreamUsername.trim(),
      password: xtreamPassword.trim()
    };

    setLoading(true);

    try {
      const testResult = await XtreamCodesClient.testConnection(credentials);

      if (!testResult.success) {
        Alert.alert('Connection Failed', testResult.error || 'Unable to connect to Xtream server');
        return;
      }

      Alert.alert(
        'Connection Successful!',
        `Account: ${testResult.info?.user_info.username}\nStatus: ${testResult.info?.user_info.status}\nExpires: ${new Date(parseInt(testResult.info?.user_info.exp_date || '0') * 1000).toLocaleDateString()}`
      );

    } catch (error) {
      console.error('Xtream test connection error:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide user-friendly error messages
        if (errorMessage.includes('Network request failed')) {
          errorMessage = `Cannot reach server "${xtreamServer}". Please check:\n• Server URL is correct\n• Internet connection is working\n• Server is online`;
        } else if (errorMessage.includes('timeout')) {
          errorMessage = `Server timeout. Please check:\n• Server URL is correct\n• Server is responding\n• Internet connection is stable`;
        }
      }
      
      Alert.alert('Test Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddXtream = async () => {
    if (!xtreamName.trim()) {
      Alert.alert('Error', 'Please enter a name for this source');
      return;
    }

    if (!xtreamServer.trim() || !xtreamUsername.trim() || !xtreamPassword.trim()) {
      Alert.alert('Error', 'Please fill in all Xtream Codes fields');
      return;
    }

    const credentials: XtreamCredentials = {
      serverUrl: xtreamServer.trim(),
      username: xtreamUsername.trim(),
      password: xtreamPassword.trim()
    };

    setLoading(true);

    try {
      // Test connection first
      const testResult = await XtreamCodesClient.testConnection(credentials);
      
      if (!testResult.success) {
        Alert.alert('Connection Failed', testResult.error || 'Unable to connect to Xtream server');
        return;
      }

      // Get channels
      const client = new XtreamCodesClient(credentials);
      const channelsResult = await client.getAllChannels();

      if (channelsResult.channels.length === 0) {
        Alert.alert(
          'No Channels Found',
          channelsResult.errors.length > 0 
            ? `Failed to fetch channels: ${channelsResult.errors.join(', ')}`
            : 'No live channels found in this Xtream account'
        );
        return;
      }

      // Create account info from test result
      const accountInfo = testResult.info ? {
        username: testResult.info.user_info.username,
        expDate: testResult.info.user_info.exp_date,
        status: testResult.info.user_info.status,
        maxConnections: testResult.info.user_info.max_connections
      } : undefined;

      const newSource = await ChannelStorage.addXtreamSource({
        name: xtreamName.trim(),
        credentials,
        accountInfo
      });

      await ChannelStorage.addChannels(channelsResult.channels);
      setXtreamSources(prev => [...prev, newSource]);

      // Clear form
      setXtreamName('');
      setXtreamServer('');
      setXtreamUsername('');
      setXtreamPassword('');

      Alert.alert(
        'Success',
        `Added ${channelsResult.channels.length} channels from "${xtreamName}"`
      );

    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add Xtream source'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshM3USource = async (source: StoredM3USource) => {
    setLoading(true);
    try {
      const parseResult = await parseM3UFromUrl(source.url);
      
      if (parseResult.channels.length === 0) {
        Alert.alert('Error', 'No channels found in the updated M3U file');
        return;
      }

      await ChannelStorage.addChannels(parseResult.channels);
      await ChannelStorage.updateM3USource(source.id, { lastUpdated: Date.now() });
      
      setM3uSources(prev => prev.map(s => 
        s.id === source.id ? { ...s, lastUpdated: Date.now() } : s
      ));

      Alert.alert('Success', `Updated ${parseResult.channels.length} channels`);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh source');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshXtreamSource = async (source: StoredXtreamSource) => {
    setLoading(true);
    try {
      const client = new XtreamCodesClient(source.credentials);
      const channelsResult = await client.getAllChannels();
      
      if (channelsResult.channels.length === 0) {
        Alert.alert('Error', 'No channels found in the updated Xtream account');
        return;
      }

      await ChannelStorage.addChannels(channelsResult.channels);
      await ChannelStorage.updateXtreamSource(source.id, { lastUpdated: Date.now() });
      
      setXtreamSources(prev => prev.map(s => 
        s.id === source.id ? { ...s, lastUpdated: Date.now() } : s
      ));

      Alert.alert('Success', `Updated ${channelsResult.channels.length} channels`);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh Xtream source');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveM3USource = (source: StoredM3USource) => {
    Alert.alert(
      'Remove M3U Source',
      `Are you sure you want to remove "${source.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChannelStorage.removeM3USource(source.id);
              setM3uSources(prev => prev.filter(s => s.id !== source.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove source');
            }
          }
        }
      ]
    );
  };

  const handleRemoveXtreamSource = (source: StoredXtreamSource) => {
    Alert.alert(
      'Remove Xtream Source',
      `Are you sure you want to remove "${source.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChannelStorage.removeXtreamSource(source.id);
              setXtreamSources(prev => prev.filter(s => s.id !== source.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove source');
            }
          }
        }
      ]
    );
  };

  const handleClearAllSources = () => {
    Alert.alert(
      'Clear All Sources',
      'Are you sure you want to remove all sources and channels? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChannelStorage.clearAllSources();
              setM3uSources([]);
              setXtreamSources([]);
              Alert.alert('Success', 'All sources and channels have been removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear sources');
            }
          }
        }
      ]
    );
  };

  const renderM3UItem = ({ item }: { item: StoredM3USource }) => (
    <View style={styles.sourceItem}>
      <View style={styles.sourceHeader}>
        <Text style={styles.sourceName}>{item.name}</Text>
        <Text style={styles.sourceDate}>
          Added: {new Date(item.addedAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.sourceUrl} numberOfLines={1}>
        {item.url}
      </Text>
      {item.lastUpdated && (
        <Text style={styles.sourceDate}>
          Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
        </Text>
      )}
      <View style={styles.sourceActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.refreshButton]}
          onPress={() => handleRefreshM3USource(item)}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemoveM3USource(item)}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderXtreamItem = ({ item }: { item: StoredXtreamSource }) => (
    <View style={styles.sourceItem}>
      <View style={styles.sourceHeader}>
        <Text style={styles.sourceName}>{item.name}</Text>
        <Text style={styles.sourceDate}>
          Added: {new Date(item.addedAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.sourceUrl} numberOfLines={1}>
        {item.credentials.username}@{item.credentials.serverUrl}
      </Text>
      {item.accountInfo && (
        <View style={styles.accountInfo}>
          <Text style={styles.accountInfoText}>
            Status: {item.accountInfo.status} | Expires: {new Date(parseInt(item.accountInfo.expDate) * 1000).toLocaleDateString()}
          </Text>
        </View>
      )}
      {item.lastUpdated && (
        <Text style={styles.sourceDate}>
          Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
        </Text>
      )}
      <View style={styles.sourceActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.refreshButton]}
          onPress={() => handleRefreshXtreamSource(item)}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemoveXtreamSource(item)}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>IPTV Sources</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'm3u' && styles.activeTab]}
          onPress={() => setActiveTab('m3u')}
        >
          <Text style={[styles.tabText, activeTab === 'm3u' && styles.activeTabText]}>
            M3U Playlists
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'xtream' && styles.activeTab]}
          onPress={() => setActiveTab('xtream')}
        >
          <Text style={[styles.tabText, activeTab === 'xtream' && styles.activeTabText]}>
            Xtream Codes
          </Text>
        </TouchableOpacity>
      </View>

      {/* M3U Tab */}
      {activeTab === 'm3u' && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add M3U Playlist</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Source name (e.g., My IPTV Provider)"
              placeholderTextColor="#666"
              value={m3uSourceName}
              onChangeText={setM3uSourceName}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="M3U URL (http://example.com/playlist.m3u)"
              placeholderTextColor="#666"
              value={m3uUrl}
              onChangeText={setM3uUrl}
              multiline
              autoCapitalize="none"
              keyboardType="url"
              editable={!loading}
            />
            
            <TouchableOpacity
              style={[styles.addButton, loading && styles.disabledButton]}
              onPress={handleAddM3U}
              disabled={loading}
            >
              {loading ? (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <ActivityIndicator color="#fff" />
                  <Text style={[styles.addButtonText, {marginLeft: 8}]}>Loading M3U...</Text>
                </View>
              ) : (
                <Text style={styles.addButtonText}>Add M3U Source</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>M3U Sources ({m3uSources.length})</Text>
            </View>

            {loadingSources ? (
              <ActivityIndicator style={styles.loader} color="#007AFF" />
            ) : m3uSources.length === 0 ? (
              <Text style={styles.emptyText}>No M3U sources added yet</Text>
            ) : (
              <FlatList
                data={m3uSources}
                renderItem={renderM3UItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        </>
      )}

      {/* Xtream Tab */}
      {activeTab === 'xtream' && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Xtream Codes Account</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Source name (e.g., My IPTV Provider)"
              placeholderTextColor="#666"
              value={xtreamName}
              onChangeText={setXtreamName}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Server URL (http://example.com:8080)"
              placeholderTextColor="#666"
              value={xtreamServer}
              onChangeText={setXtreamServer}
              autoCapitalize="none"
              keyboardType="url"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#666"
              value={xtreamUsername}
              onChangeText={setXtreamUsername}
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={xtreamPassword}
              onChangeText={setXtreamPassword}
              secureTextEntry
              editable={!loading}
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.testButton, loading && styles.disabledButton]}
                onPress={handleTestXtream}
                disabled={loading}
              >
                <Text style={styles.testButtonText}>Test Connection</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addButton, styles.addButtonFlex, loading && styles.disabledButton]}
                onPress={handleAddXtream}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Add Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Xtream Sources ({xtreamSources.length})</Text>
            </View>

            {loadingSources ? (
              <ActivityIndicator style={styles.loader} color="#007AFF" />
            ) : xtreamSources.length === 0 ? (
              <Text style={styles.emptyText}>No Xtream sources added yet</Text>
            ) : (
              <FlatList
                data={xtreamSources}
                renderItem={renderXtreamItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        </>
      )}

      {/* Clear All Button */}
      {(m3uSources.length > 0 || xtreamSources.length > 0) && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAllSources}
            disabled={loading}
          >
            <Text style={styles.clearAllButtonText}>Clear All Sources</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonFlex: {
    flex: 1,
  },
  testButton: {
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearAllButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    margin: 20,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  sourceItem: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  sourceDate: {
    color: '#999',
    fontSize: 12,
  },
  sourceUrl: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  accountInfo: {
    backgroundColor: '#222',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  accountInfoText: {
    color: '#999',
    fontSize: 12,
  },
  sourceActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  removeButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
