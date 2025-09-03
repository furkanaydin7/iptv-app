import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaylistSource } from '../types';

interface AddPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onAddPlaylist: (source: PlaylistSource) => void;
}

const AddPlaylistModal: React.FC<AddPlaylistModalProps> = ({
  visible,
  onClose,
  onAddPlaylist,
}) => {
  const [sourceType, setSourceType] = useState<'url' | 'credentials'>('url');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setUrl('');
    setUsername('');
    setPassword('');
    setServerUrl('');
    setSourceType('url');
  };

  const validateForm = (): boolean => {
    if (sourceType === 'url') {
      if (!url.trim()) {
        Alert.alert('Error', 'Please enter a valid M3U URL');
        return false;
      }
      try {
        const urlObj = new URL(url.trim());
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          throw new Error('Invalid protocol');
        }
      } catch {
        Alert.alert('Error', 'Please enter a valid URL starting with http:// or https://');
        return false;
      }
    } else {
      if (!username.trim() || !password.trim() || !serverUrl.trim()) {
        Alert.alert('Error', 'Please fill in all credential fields');
        return false;
      }
      try {
        let cleanUrl = serverUrl.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = 'http://' + cleanUrl;
        }
        new URL(cleanUrl);
      } catch {
        Alert.alert('Error', 'Please enter a valid server URL');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const source: PlaylistSource = sourceType === 'url'
        ? { type: 'url', url: url.trim() }
        : {
            type: 'credentials',
            username: username.trim(),
            password: password.trim(),
            serverUrl: serverUrl.trim(),
          };

      onAddPlaylist(source);
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to add playlist. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Playlist</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            <Text style={[styles.saveButtonText, isLoading && styles.disabledButtonText]}>
              {isLoading ? 'Adding...' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Source Type Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Playlist Source</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  sourceType === 'url' && styles.activeToggleButton,
                ]}
                onPress={() => setSourceType('url')}
              >
                <Ionicons
                  name="link"
                  size={20}
                  color={sourceType === 'url' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.toggleText,
                    sourceType === 'url' && styles.activeToggleText,
                  ]}
                >
                  M3U URL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  sourceType === 'credentials' && styles.activeToggleButton,
                ]}
                onPress={() => setSourceType('credentials')}
              >
                <Ionicons
                  name="key"
                  size={20}
                  color={sourceType === 'credentials' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.toggleText,
                    sourceType === 'credentials' && styles.activeToggleText,
                  ]}
                >
                  Login Credentials
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* URL Input */}
          {sourceType === 'url' && (
            <View style={styles.section}>
              <Text style={styles.label}>M3U Playlist URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/playlist.m3u"
                placeholderTextColor="#999"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={styles.helpText}>
                Enter the direct URL to your M3U playlist file
              </Text>
            </View>
          )}

          {/* Credentials Input */}
          {sourceType === 'credentials' && (
            <View style={styles.section}>
              <Text style={styles.label}>Server URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://yourserver.com or yourserver.com:8080"
                placeholderTextColor="#999"
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.helpText}>
                Enter your Xtream Codes API credentials provided by your IPTV service
              </Text>
            </View>
          )}

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={16} color="#007AFF" />
              <Text style={styles.infoText}>
                {sourceType === 'url'
                  ? 'M3U files contain channel information and stream URLs'
                  : 'Credentials are used with Xtream Codes API services'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={16} color="#007AFF" />
              <Text style={styles.infoText}>
                Your credentials are stored securely on your device
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButtonText: {
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  activeToggleButton: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeToggleText: {
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default AddPlaylistModal;