import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { VideoView, useVideoPlayer, VideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import { Channel } from '../types';
import { StreamUrlHelper } from '../utils/streamUrlHelper';

interface PlayerScreenProps {
  channel: Channel | null;
  onBack: () => void;
  isPlayingInBackground?: boolean;
}

export default function PlayerScreen({ channel, onBack, isPlayingInBackground = false }: PlayerScreenProps) {
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [useWebViewPlayer, setUseWebViewPlayer] = useState<boolean>(
    (channel?.url.includes('ip.sltv.be') ?? false) || 
    StreamUrlHelper.shouldUseWebViewForStream(channel?.url || '', channel?.name)
  );
  const [switchedToWebView, setSwitchedToWebView] = useState<boolean>(false);
  const [optimizedStreamUrl, setOptimizedStreamUrl] = useState<string>('');
  const [codecWarning, setCodecWarning] = useState<string>('');
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);

  const originalStreamUrl = channel ? channel.url : '';
  const streamUrl = optimizedStreamUrl || originalStreamUrl;

  const player = useVideoPlayer(streamUrl, (player) => {
    player.loop = false;
    player.play();
  });

  // Optimiere Stream-URL beim Laden des Channels
  useEffect(() => {
    if (originalStreamUrl) {
      console.log('🎬 PlayerScreen: Original Stream URL:', originalStreamUrl);
      console.log('🎬 PlayerScreen: Channel:', JSON.stringify(channel, null, 2));
      
      // Analysiere Stream für Player-Empfehlung
      const streamAnalysis = StreamUrlHelper.analyzeStreamForPlayer(originalStreamUrl, channel?.name);
      if (streamAnalysis.recommendWebView) {
        setCodecWarning(`⚠️ ${streamAnalysis.codec || 'Problematischer Codec'}: Verwendet WebView-Player für bessere Kompatibilität`);
        console.log(`🎬 Problematic codec detected (${streamAnalysis.codec}), using WebView player:`, streamAnalysis.reason);
        setUseWebViewPlayer(true);
      } else if (!streamAnalysis.shouldTryNativeFirst) {
        setCodecWarning(`ℹ️ ${streamAnalysis.codec || 'Codec'} erkannt: Teste zuerst nativen Player`);
        console.log(`🎬 Potentially problematic codec (${streamAnalysis.codec}), but trying native first`);
      }
      
      // Optimiere URL für iOS und teste Erreichbarkeit
      StreamUrlHelper.findWorkingStreamUrl(originalStreamUrl)
        .then(optimizedUrl => {
          console.log('🎬 PlayerScreen: Optimized Stream URL:', optimizedUrl);
          setOptimizedStreamUrl(optimizedUrl);
        })
        .catch(error => {
          console.error('🎬 PlayerScreen: Failed to optimize stream URL:', error);
          setOptimizedStreamUrl(originalStreamUrl);
        });
    }
  }, [originalStreamUrl, channel]);

  useEffect(() => {
    const subscription = player.addListener('statusChange', (status) => {
      console.log('🎬 Player Status Change:', status);
      if (status.error) {
        console.error('🎬 Player Error:', status.error);
        
        // Spezifische Fehlerbehandlung für Video-Codec-Probleme
        const errorMessage = status.error.message || '';
        if (errorMessage.includes('Failed to load') || 
            errorMessage.includes('not found') || 
            errorMessage.includes('unsupported') ||
            errorMessage.includes('codec') ||
            errorMessage.includes('format')) {
          console.log('🎬 Detected video codec/format issue, switching to WebView');
          setHasVideoError(true);
          setCodecWarning('⚠️ Video-Codec-Problem: Wechsle zu WebView-Player');
        }
        
        handleVideoError();
      }
      setIsBuffering(status.status === 'loading');
    });

    return () => {
      subscription?.remove();
    };
  }, [player]);

  const handleVideoError = () => {
    console.error('🎬 Video Error - switching to WebView player');
    console.log('🎬 Original URL:', originalStreamUrl);
    console.log('🎬 Optimized URL:', optimizedStreamUrl);
    
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
        html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
        video { width: 100%; height: 100%; object-fit: contain; background: #000; }
        .error-msg { color: #ff4444; text-align: center; padding: 20px; font-family: Arial; background: rgba(0,0,0,0.8); }
        .debug-info { position: absolute; top: 10px; left: 10px; color: #fff; font-size: 10px; background: rgba(0,0,0,0.7); padding: 5px; border-radius: 3px; max-width: 80%; z-index: 1000; }
        .loading { color: #fff; text-align: center; padding: 20px; font-family: Arial; }
      </style>
    </head>
    <body>
      <div id="loading" class="loading">🔄 Stream wird geladen...</div>
      <video id="video" controls autoplay playsinline webkit-playsinline muted style="display: none;"></video>
      <div id="error-msg" class="error-msg" style="display: none;"></div>
      <div id="debug-info" class="debug-info"></div>
      
      <script>
        const video = document.getElementById('video');
        const errorMsg = document.getElementById('error-msg');
        const loading = document.getElementById('loading');
        const debugInfo = document.getElementById('debug-info');
        const src = '${url}';
        
        let playerAttempt = 0;
        let hasShownVideo = false;
        
        function updateDebug(message) {
          console.log('🎬 WebView:', message);
          debugInfo.innerHTML += message + '<br>';
          // Halte nur die letzten 5 Zeilen
          const lines = debugInfo.innerHTML.split('<br>');
          if (lines.length > 5) {
            debugInfo.innerHTML = lines.slice(-5).join('<br>');
          }
        }
        
        function showError(message) {
          loading.style.display = 'none';
          video.style.display = 'none';
          errorMsg.textContent = message;
          errorMsg.style.display = 'block';
          updateDebug('❌ ERROR: ' + message);
        }
        
        function showVideo() {
          if (!hasShownVideo) {
            loading.style.display = 'none';
            video.style.display = 'block';
            hasShownVideo = true;
            updateDebug('✅ Video wird angezeigt');
            // Versuche Autoplay nach kurzer Verzögerung
            setTimeout(() => {
              video.muted = false;
              video.play().catch(e => updateDebug('⚠️ Autoplay failed: ' + e.message));
            }, 1000);
          }
        }
        
        updateDebug('🔗 Stream: ' + src.substring(0, 60) + '...');
        
        // Video Event Listeners
        video.onloadedmetadata = () => {
          updateDebug('📊 Video: ' + video.videoWidth + 'x' + video.videoHeight);
          showVideo();
        };
        
        video.oncanplay = () => updateDebug('▶️ Bereit zum Abspielen');
        video.onplaying = () => updateDebug('🎬 Spielt ab');
        video.onwaiting = () => updateDebug('⏳ Puffert...');
        
        video.onerror = function(e) {
          const error = video.error;
          let errorText = 'Video-Fehler';
          if (error) {
            switch(error.code) {
              case 1: errorText = 'Abgebrochen'; break;
              case 2: errorText = 'Netzwerk-Fehler'; break;
              case 3: errorText = 'Codec-Fehler (HEVC?)'; break;
              case 4: errorText = 'Format nicht unterstützt'; break;
            }
          }
          updateDebug('❌ Video Error: ' + errorText);
          
          // Versuche alternative Player-Strategien
          if (playerAttempt === 0) {
            updateDebug('🔄 Versuche direkten Stream...');
            playerAttempt++;
            video.src = src;
            return;
          }
          
          showError(errorText + ' - Codec möglicherweise nicht unterstützt');
        };
        
        // Prüfe Stream-Typ und wähle beste Strategie
        const isTransportStream = src.includes('.ts') && !src.includes('.m3u8');
        const isM3U8 = src.includes('.m3u8');
        
        updateDebug('🔍 Typ: ' + (isTransportStream ? 'TS' : isM3U8 ? 'HLS' : 'Direkt'));
        
        function tryHLSPlayer() {
          if (window.Hls && window.Hls.isSupported()) {
            updateDebug('🔧 Verwende HLS.js');
            const hls = new Hls({ 
              debug: false,
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 30,
              maxBufferLength: 60,
              enableSoftwareAES: true,
              forceKeyFrameOnDiscontinuity: true,
              // Erweiterte Codec-Unterstützung
              fLoader: undefined,
              pLoader: undefined,
              xhrSetup: function(xhr, url) {
                xhr.setRequestHeader('User-Agent', 'VLC/3.0.0 LibVLC/3.0.0');
              }
            });
            
            hls.on(Hls.Events.MANIFEST_LOADED, function(event, data) {
              updateDebug('📄 Manifest: ' + data.levels.length + ' Levels');
            });
            
            hls.on(Hls.Events.ERROR, function(event, data) {
              updateDebug('❌ HLS: ' + data.type + ' - ' + data.details);
              if (data.fatal) {
                switch(data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    updateDebug('🌐 Netzwerk-Fehler - versuche Recovery...');
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    updateDebug('🎬 Media-Fehler - versuche Recovery...');
                    hls.recoverMediaError();
                    break;
                  default:
                    if (playerAttempt === 0) {
                      updateDebug('🔄 HLS failed - versuche direkten Player...');
                      playerAttempt++;
                      video.src = src;
                    } else {
                      showError('Stream kann nicht abgespielt werden: ' + data.details);
                    }
                    break;
                }
              }
            });
            
            hls.loadSource(src);
            hls.attachMedia(video);
            
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            updateDebug('🍎 Nativer HLS-Support');
            video.src = src;
          } else {
            updateDebug('⚠️ Kein HLS-Support - versuche direkten Player');
            video.src = src;
          }
        }
        
        // Starte Player basierend auf Stream-Typ
        if (isTransportStream) {
          updateDebug('⚡ Transport Stream - direkter Player');
          video.src = src;
        } else {
          tryHLSPlayer();
        }
        
        // Timeout für Ladevorgang
        setTimeout(() => {
          if (!hasShownVideo) {
            updateDebug('⏰ Timeout - Stream lädt zu lange');
            if (playerAttempt === 0 && !isTransportStream) {
              updateDebug('🔄 Timeout - versuche direkten Player...');
              playerAttempt++;
              video.src = src;
            }
          }
        }, 15000);
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
        <TouchableOpacity 
          style={[styles.backButton, styles.playerToggleButton]} 
          onPress={() => {
            const newPlayerType = !useWebViewPlayer;
            setUseWebViewPlayer(newPlayerType);
            setSwitchedToWebView(true);
            setHasVideoError(false);
            console.log(`🎬 Manual player switch to: ${newPlayerType ? 'WebView' : 'Native'}`);
            if (newPlayerType) {
              setCodecWarning('🔄 Manuell zu WebView-Player gewechselt');
            } else {
              setCodecWarning('');
            }
          }}
        >
          <Text style={styles.backButtonText}>
            {useWebViewPlayer ? '📱' : '🌐'}
          </Text>
        </TouchableOpacity>
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
        
        {codecWarning && (
          <Text style={[styles.categoryText, { color: '#ff9500', fontWeight: '600', marginTop: 8 }]}>{codecWarning}</Text>
        )}
        
        {/* Debug-Informationen für Entwicklung */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Original URL: {originalStreamUrl.substring(0, 50)}...</Text>
            <Text style={styles.debugText}>Optimized URL: {streamUrl.substring(0, 50)}...</Text>
            <Text style={styles.debugText}>Player: {useWebViewPlayer ? 'WebView' : 'Native'}</Text>
            <Text style={styles.debugText}>Switched to WebView: {switchedToWebView ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Has Video Error: {hasVideoError ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Stream Type: {streamUrl.includes('.m3u8') ? 'HLS' : streamUrl.includes('.ts') ? 'TS' : 'Other'}</Text>
          </View>
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
  playerToggleButton: { marginRight: 0, marginLeft: 16, backgroundColor: '#555' },
  videoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', margin: 16, borderRadius: 8, overflow: 'hidden' },
  video: { width: '100%', height: '100%' },
  bufferingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  bufferingText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusContainer: { padding: 16, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#333' },
  statusText: { color: '#fff', fontSize: 16, marginBottom: 8 },
  categoryText: { color: '#999', fontSize: 14 },
  errorText: { color: '#ff4444', fontSize: 16, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  debugContainer: { marginTop: 8, padding: 8, backgroundColor: '#222', borderRadius: 4 },
  debugText: { color: '#888', fontSize: 12, fontFamily: 'monospace', marginBottom: 2 },
});
