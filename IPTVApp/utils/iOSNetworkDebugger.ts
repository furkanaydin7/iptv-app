import { Platform } from 'react-native';

export class IOSNetworkDebugger {
  static logNetworkEnvironment() {
    if (Platform.OS !== 'ios') return;
    
    console.log('📱 === iOS Network Environment ===');
    console.log('🔧 Platform:', Platform.OS, Platform.Version);
    console.log('⚙️ Is Debug:', __DEV__);
    console.log('🌐 Network State: Checking...');
    
    // Teste eine einfache HTTP-Anfrage zu einem bekannten Dienst
    this.testBasicConnectivity();
  }
  
  static async testBasicConnectivity() {
    try {
      console.log('🔍 Testing basic connectivity...');
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ Basic HTTP connectivity: OK');
        const data = await response.json();
        console.log('📋 HTTP test response:', data);
      } else {
        console.log('❌ Basic HTTP connectivity: FAILED -', response.status);
      }
    } catch (error) {
      console.log('❌ Basic HTTP connectivity: ERROR -', error);
    }
  }
  
  static async testM3UUrl(url: string) {
    if (Platform.OS !== 'ios') return true;
    
    console.log('🧪 === Testing M3U URL on iOS ===');
    console.log('🔗 URL:', url);
    
    try {
      // Test URL validity
      new URL(url);
      console.log('✅ URL format: Valid');
      
      // Test reachability with minimal request (kürzerer Timeout für HEAD-Request)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 Sekunden für HEAD
      
      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD to test reachability without downloading content
        signal: controller.signal,
        headers: {
          'User-Agent': 'IPTV-App/1.0 (iOS)',
          'Accept': '*/*'
        }
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Reachability test:', response.status, response.statusText);
      console.log('📏 Content-Length:', response.headers.get('content-length') || 'unknown');
      console.log('📄 Content-Type:', response.headers.get('content-type') || 'unknown');
      
      return response.ok;
      
    } catch (error) {
      console.log('❌ M3U URL test failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('⏰ HEAD request timed out - server may be very slow');
        } else if (error.message.includes('Network request failed')) {
          console.log('🌐 Network request failed - check internet connection and URL');
        }
      }
      
      // Bei HEAD-Fehlern trotzdem true zurückgeben, da manche Server HEAD nicht unterstützen
      console.log('⚠️ HEAD request failed, but continuing with GET request...');
      return true;
    }
  }
  
  // Neue Methode für chunked Download bei großen M3U Dateien
  static async downloadM3UWithProgress(url: string, onProgress?: (progress: number) => void): Promise<string> {
    console.log('🔄 === Chunked M3U Download ===');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 Minuten für große Dateien
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'User-Agent': 'IPTV-App/1.0 (iOS) Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      console.log('📥 Starting chunked download, total size:', total, 'bytes');
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        if (total > 0 && onProgress) {
          const progress = (receivedLength / total) * 100;
          onProgress(progress);
          console.log(`📊 Download progress: ${progress.toFixed(1)}%`);
        }
      }
      
      // Combine chunks into single string
      const concatenated = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        concatenated.set(chunk, position);
        position += chunk.length;
      }
      
      const content = new TextDecoder('utf-8').decode(concatenated);
      console.log('✅ Download completed, content length:', content.length);
      
      return content;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  // Alternative Download-Methode mit XMLHttpRequest für iOS
  static async downloadM3UWithXHR(url: string): Promise<string> {
    console.log('🔄 === XMLHttpRequest M3U Download ===');
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Timeout nach 2 Minuten
      xhr.timeout = 120000;
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ XHR Download completed, content length:', xhr.responseText.length);
          resolve(xhr.responseText);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        console.log('❌ XHR Network error');
        reject(new Error('XMLHttpRequest network error'));
      };
      
      xhr.ontimeout = () => {
        console.log('⏰ XHR Timeout');
        reject(new Error('XMLHttpRequest timeout'));
      };
      
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          console.log(`📊 XHR Download progress: ${progress.toFixed(1)}%`);
        }
      };
      
      try {
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Accept', '*/*');
        xhr.setRequestHeader('User-Agent', 'IPTV-App/1.0 (iOS) Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.send();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  static logFetchError(error: any, url: string) {
    if (Platform.OS !== 'ios') return;
    
    console.log('🐛 === iOS Fetch Error Debug ===');
    console.log('🔗 Failed URL:', url);
    console.log('❌ Error type:', typeof error);
    console.log('❌ Error name:', error?.name);
    console.log('❌ Error message:', error?.message);
    console.log('❌ Error stack:', error?.stack?.substring(0, 300));
    
    // iOS-spezifische Error-Codes
    if (error?.message?.includes('NSURLError')) {
      console.log('🍎 iOS NSURLError detected - this is an iOS-specific network error');
    }
    
    if (error?.code) {
      console.log('📊 Error code:', error.code);
    }
  }
}
