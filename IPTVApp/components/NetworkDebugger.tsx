import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { IOSNetworkHelper } from '../utils/iosNetworkHelper';
import { XtreamCodesClient } from '../utils/xtreamClient';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export const NetworkDebugger: React.FC = () => {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);

  const addLog = (level: DebugLog['level'], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, level, message }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testConnection = async () => {
    if (!serverUrl || !username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    clearLogs();

    addLog('info', `Platform: ${Platform.OS} ${Platform.Version}`);
    addLog('info', `Testing connection to: ${serverUrl}`);

    try {
      // Test 1: URL validation
      addLog('info', 'Validating URL format...');
      const validation = IOSNetworkHelper.validateServerUrl(serverUrl);
      if (!validation.valid) {
        addLog('error', `URL validation failed: ${validation.error}`);
        return;
      }
      addLog('success', 'URL format is valid');

      // Test 2: Basic connectivity
      addLog('info', 'Testing basic connectivity...');
      const testUrl = `${serverUrl}/player_api.php?username=${username}&password=${password}&action=get_account_info`;
      
      if (Platform.OS === 'ios') {
        addLog('info', 'Using iOS-optimized XMLHttpRequest...');
        try {
          const data = await IOSNetworkHelper.performIOSRequest(testUrl, 'VLC/3.0.0 LibVLC/3.0.0');
          addLog('success', 'iOS request successful!');
          addLog('info', `Response: ${JSON.stringify(data).substring(0, 100)}...`);
        } catch (error) {
          addLog('error', `iOS request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Test 3: Xtream client test
      addLog('info', 'Testing with Xtream client...');
      const result = await XtreamCodesClient.testConnection({
        serverUrl,
        username,
        password
      });

      if (result.success) {
        addLog('success', 'Xtream connection successful!');
        if (result.info) {
          addLog('info', `Account: ${result.info.user_info.username}`);
          addLog('info', `Status: ${result.info.user_info.status}`);
          addLog('info', `Expiry: ${new Date(parseInt(result.info.user_info.exp_date) * 1000).toLocaleDateString()}`);
        }
      } else {
        addLog('error', `Xtream connection failed: ${result.error}`);
      }

    } catch (error) {
      addLog('error', `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getLogColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#2196F3';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Debugger</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Server URL (e.g., http://example.com:8080)"
          value={serverUrl}
          onChangeText={setServerUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testConnection}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Test Connection</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <View key={index} style={styles.logEntry}>
            <Text style={[styles.logTimestamp, { color: getLogColor(log.level) }]}>
              [{log.timestamp}]
            </Text>
            <Text style={[styles.logMessage, { color: getLogColor(log.level) }]}>
              {log.message}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  clearButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logEntry: {
    marginBottom: 8,
  },
  logTimestamp: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
