import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { VideoView, useVideoPlayer, VideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import { Channel } from '../types';

interface PlayerScreenProps {
  channel: Channel | null;
  onBack: () => void;
  isPlayingInBackground?: boolean;
}

export default function PlayerScreen({ channel, onBack, isPlayingInBackground = false }: PlayerScreenProps) {
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [useWebViewPlayer, setUseWebViewPlayer] = useState<boolean>(
    channel?.url.includes('ip.sltv.be') ?? false
  );
  const [switchedToWebView, setSwitchedToWebView] = useState<boolean>(false);

  const streamUrl = channel ? channel.url : '';

  const player = useVideoPlayer(streamUrl, (player) => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    const subscription = player.addListener('statusChange', (status) => {
      if (status.error) {
        handleVideoError();
      }
      setIsBuffering(status.status === 'loading');
    });

    return () => {
      subscription?.remove();
    };
  }, [player]);

  const handleVideoError = () => {
    if (!switchedToWebView) {
      setUseWebViewPlayer(true);
      setSwitchedToWebView(true);
    }
  };

  const createHLSPlayerHTML = (url: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
      <style>
        html, body { margin: 0; padding: 0; background: #000; height: 100%; }
        video { width: 100%; height: 100%; object-fit: contain; background: #000; }
      </style>
    </head>
    <body>
      <video id="video" controls autoplay playsinline webkit-playsinline></video>
      <script>
        const video = document.getElementById('video');
        const src = '${url}';
        if (window.Hls && window.Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        }
      </script>
    </body>
    </html>`;

  if (!channel) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No channel selected</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back to Channels</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.channelTitle}>{channel.name}</Text>
      </View>

      <View style={styles.videoContainer}>
        {useWebViewPlayer ? (
          <WebView
            style={styles.video}
            source={{ html: createHLSPlayerHTML(streamUrl) }}
            allowsInlineMediaPlayback
            allowsPictureInPictureMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
          />
        ) : (
          <VideoView
            style={styles.video}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
            startsPictureInPictureAutomatically={false}
            nativeControls
            contentFit="contain"
          />
        )}

        {isBuffering && (
          <View style={styles.bufferingOverlay}>
            <Text style={styles.bufferingText}>Loading stream...</Text>
          </View>
        )}
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {player.playing ? 'Playing' : isBuffering ? 'Loading...' : 'Paused/Idle'}
        </Text>
        {isPlayingInBackground && (
          <Text style={[styles.categoryText, { color: '#ff9500', fontWeight: '600' }]}>🎵 Läuft im Hintergrund weiter</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, zIndex: 2, backgroundColor: '#000' },
  backButton: { backgroundColor: '#333', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginRight: 16 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  channelTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1 },
  videoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', margin: 16, borderRadius: 8, overflow: 'hidden' },
  video: { width: '100%', height: '100%' },
  bufferingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  bufferingText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusContainer: { padding: 16, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#333' },
  statusText: { color: '#fff', fontSize: 16, marginBottom: 8 },
  categoryText: { color: '#999', fontSize: 14 },
  errorText: { color: '#ff4444', fontSize: 16, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
});
