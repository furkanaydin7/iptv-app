// Test-URLs für M3U-Download-Tests
export const TEST_M3U_URLS = [
  // Kleine Test-Playlist
  'https://iptv-org.github.io/iptv/index.m3u',
  
  // Öffentliche Test-Playlist
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/de.m3u',
  
  // Einfache Test-URL
  'https://httpbin.org/response-headers?content-type=application/vnd.apple.mpegurl',
  
  // Deine problematische URL
  'http://ip.sltv.be:8080/get.php?username=23TSUDEJBH&password=5aSWmZzyox&type=m3u_plus&output=ts'
];

// Test-URLs für verschiedene Xtream-Server-Formate
export const TEST_XTREAM_URLS = [
  // Standard-Format
  'http://example.com:8080',
  
  // Mit player_api.php
  'http://example.com:8080/player_api.php',
  
  // Mit get.php (sollte zu player_api.php konvertiert werden)
  'http://example.com:8080/get.php',
  
  // Mit /c/ Pfad
  'http://example.com:8080/c/',
  
  // Mit Port und Pfad
  'http://example.com:8080/iptv/',
  
  // HTTPS-Format
  'https://example.com:8443',
  
  // Ohne Port
  'http://example.com',
  
  // Mit trailing slash
  'http://example.com:8080/',
];

export const TEST_URLS_BY_SIZE = {
  small: 'https://iptv-org.github.io/iptv/index.m3u',
  medium: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/de.m3u',
  large: 'http://ip.sltv.be:8080/get.php?username=23TSUDEJBH&password=5aSWmZzyox&type=m3u_plus&output=ts'
};

export async function testAllM3UUrls() {
  console.log('🧪 === Testing All M3U URLs ===');
  
  for (const url of TEST_M3U_URLS) {
    console.log(`\n🔗 Testing: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'IPTV-App/1.0 (iOS)',
          'Accept': '*/*'
        }
      });
      
      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      console.log(`📏 Content-Length: ${response.headers.get('content-length') || 'unknown'}`);
      console.log(`📄 Content-Type: ${response.headers.get('content-type') || 'unknown'}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }
}

export function testXtreamUrlNormalization() {
  console.log('🧪 === Testing Xtream URL Normalization ===');
  
  // Importiere XtreamCodesClient für Tests
  const { XtreamCodesClient } = require('./xtreamClient');
  
  for (const testUrl of TEST_XTREAM_URLS) {
    console.log(`\n🔗 Original URL: ${testUrl}`);
    
    try {
      // Erstelle temporäre Credentials für URL-Test
      const testCredentials = {
        serverUrl: testUrl,
        username: 'test',
        password: 'test'
      };
      
      const client = new XtreamCodesClient(testCredentials);
      console.log(`✅ Normalized: ${client.baseUrl}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }
}
