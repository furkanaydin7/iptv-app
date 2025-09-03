import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, AppState, AppStateStatus } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';
import { Channel } from './types';
import HomeScreen from './screens/HomeScreen';
import PlayerScreen from './screens/PlayerScreen';
import SettingsScreen from './screens/SettingsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'player' | 'settings'>('home');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isPlayingInBackground, setIsPlayingInBackground] = useState(false);
  const appState = useRef(AppState.currentState);

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setCurrentScreen('player');
  };

  const handleBack = () => {
    setCurrentScreen('home');
    setSelectedChannel(null);
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleBackFromSettings = () => {
    setCurrentScreen('home');
  };

  // Audio-Session für Hintergrund-Wiedergabe konfigurieren
  useEffect(() => {
    const configureAudioSession = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
        });
        console.log('✅ Audio-Session für Hintergrund-Wiedergabe konfiguriert (expo-audio)');
      } catch (error) {
        console.error('❌ Fehler bei Audio-Session-Konfiguration:', error);
      }
    };

    configureAudioSession();
  }, []);

  // App-State-Listener für Hintergrund-Verwaltung
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App kommt aus dem Hintergrund zurück');
        setIsPlayingInBackground(false);
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('📱 App geht in den Hintergrund');
        if (currentScreen === 'player' && selectedChannel) {
          console.log('🎵 Audio läuft im Hintergrund weiter für:', selectedChannel.name);
          setIsPlayingInBackground(true);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [currentScreen, selectedChannel]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000" />
      
      {currentScreen === 'home' ? (
        <HomeScreen onChannelSelect={handleChannelSelect} onOpenSettings={handleOpenSettings} />
      ) : currentScreen === 'player' ? (
        <PlayerScreen 
          channel={selectedChannel} 
          onBack={handleBack}
          isPlayingInBackground={isPlayingInBackground}
        />
      ) : (
        <SettingsScreen onBack={handleBackFromSettings} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
