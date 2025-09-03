import { Channel } from '../types';
import {
  XtreamCredentials,
  XtreamAuthResponse,
  XtreamCategory,
  XtreamChannel,
  ParsedXtreamResult
} from '../types/xtream';
import { Platform } from 'react-native';
import { IOSNetworkHelper } from './iosNetworkHelper';

export class XtreamCodesClient {
  private credentials: XtreamCredentials;
  private baseUrl: string;
  private streamBaseUrl: string; // Separate URL für Streams
  private workingUserAgent: string = 'IPTV-App/1.0 (iOS) Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15';

  constructor(credentials: XtreamCredentials) {
    this.credentials = credentials;
    
    // Normalize and validate the server URL
    let url = credentials.serverUrl.replace(/\s+/g, '').trim();
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    
    // Intelligente URL-Normalisierung für verschiedene Xtream-Server-Formate
    this.baseUrl = this.normalizeXtreamUrl(url);
    
    // Separate Stream-Base-URL ohne player_api.php
    this.streamBaseUrl = this.getStreamBaseUrl(url);
    
    console.log('🔧 Normalized API base URL:', this.baseUrl);
    console.log('🔧 Stream base URL:', this.streamBaseUrl);
    console.log('🔧 Original URL:', credentials.serverUrl);
  }

  private getStreamBaseUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Für Streams immer nur die Basis-URL (Protokoll + Host + Port) verwenden
      return urlObj.origin;
    } catch (error) {
      console.error('Failed to parse stream base URL:', error);
      return url.replace(/\/.*$/, ''); // Fallback: alles nach dem Hostname entfernen
    }
  }

  private normalizeXtreamUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Verschiedene Xtream-Server-Formate erkennen und normalisieren
      const pathname = urlObj.pathname;
      
      // Fall 1: URL enthält bereits player_api.php - behalte sie
      if (pathname.includes('player_api.php')) {
        return urlObj.origin + pathname.replace(/\/player_api\.php.*$/, '/player_api.php');
      }
      
      // Fall 2: URL enthält get.php - konvertiere zu player_api.php
      if (pathname.includes('get.php')) {
        return urlObj.origin + pathname.replace(/\/get\.php.*$/, '/player_api.php');
      }
      
      // Fall 3: URL enthält /c/ - entferne es und füge player_api.php hinzu
      if (pathname.includes('/c/')) {
        return urlObj.origin + pathname.replace(/\/c\/.*$/, '/player_api.php');
      }
      
      // Fall 4: Standard-Fall - füge player_api.php hinzu
      const cleanPath = pathname.replace(/\/+$/, ''); // Entferne trailing slashes
      return urlObj.origin + cleanPath + '/player_api.php';
      
    } catch (error) {
      console.warn('⚠️ URL parsing failed, using fallback normalization:', error);
      
      // Fallback: Einfache String-Manipulation
      let normalized = url;
      
      // Entferne nur problematische Suffixe, aber behalte wichtige Pfade
      const problematicSuffixes = ['/c/', '/'];
      for (const suffix of problematicSuffixes) {
        if (normalized.endsWith(suffix) && !normalized.includes('player_api.php') && !normalized.includes('get.php')) {
          normalized = normalized.slice(0, -suffix.length);
        }
      }
      
      // Füge player_api.php hinzu wenn nicht vorhanden
      if (!normalized.includes('player_api.php') && !normalized.includes('get.php')) {
        normalized = normalized.replace(/\/+$/, '') + '/player_api.php';
      }
      
      return normalized;
    }
  }

  // Neue Methode: Teste alternative Ports und Protokolle
  private async testAlternativeEndpoints(): Promise<string | null> {
    console.log('🔄 Testing alternative endpoints...');
    
    try {
      const originalUrl = new URL(this.credentials.serverUrl);
      const hostname = originalUrl.hostname;
      
      // Alternative Ports und Protokolle testen
      const alternatives = [
        { protocol: 'http', port: '8080' },
        { protocol: 'http', port: '80' },
        { protocol: 'https', port: '443' },
        { protocol: 'https', port: '8443' },
        { protocol: 'http', port: '8000' },
        { protocol: 'http', port: '8888' },
      ];
      
      for (const alt of alternatives) {
        const testUrl = `${alt.protocol}://${hostname}:${alt.port}/player_api.php`;
        
        try {
          console.log(`🌐 Testing alternative: ${testUrl}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(testUrl, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'User-Agent': 'IPTV-App/1.0 (iOS)',
              'Accept': '*/*'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok || response.status === 404) {
            console.log(`✅ Alternative endpoint found: ${testUrl} (${response.status})`);
            return testUrl;
          }
          
        } catch (error) {
          console.log(`❌ Alternative failed: ${testUrl}`);
          continue;
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Alternative endpoint testing failed:', error);
      return null;
    }
  }

  private async testServerReachability(): Promise<void> {
    console.log('🔍 Testing server reachability...');
    
    // Beginne mit den User-Agents, die definitiv funktionieren
    const priorityUserAgents = [
      'VLC/3.0.0 LibVLC/3.0.0',
      'IPTV Smarters Pro'
    ];
    
    try {
      // Teste nur den Haupt-Endpunkt mit funktionierenden User-Agents
      for (const userAgent of priorityUserAgents) {
        try {
          console.log(`🌐 Testing with User-Agent: ${userAgent}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          // Teste eine echte API-Anfrage statt HEAD
          const testUrl = this.buildUrl('get_account_info');
          console.log(`🔗 Test URL: ${testUrl}`);
          
          const response = await fetch(testUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': userAgent,
              'Accept': 'application/json'
            }
          });
        
          clearTimeout(timeoutId);
          
          console.log(`📥 Response: ${response.status} ${response.statusText} with User-Agent: ${userAgent}`);
          
          // Bei jeder Antwort (auch 401/403) ist der Server erreichbar
          if (response.status !== 520) {
            console.log(`✅ Found working User-Agent: ${userAgent}`);
            this.workingUserAgent = userAgent;
            return; // Server ist erreichbar
          } else {
            console.log(`❌ User-Agent blocked: ${userAgent} (HTTP 520)`);
          }
          
        } catch (error) {
          console.log(`❌ Test failed with User-Agent ${userAgent}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue; // Nächsten User-Agent testen
        }
      }
      
      // Alle Tests fehlgeschlagen - versuche alternative Endpunkte
      console.log('🔄 All primary endpoints failed, trying alternatives...');
      const alternativeUrl = await this.testAlternativeEndpoints();
      
      if (alternativeUrl) {
        console.log(`✅ Found working alternative: ${alternativeUrl}`);
        this.baseUrl = alternativeUrl;
        return;
      }
      
      // Alle Tests fehlgeschlagen
      throw new Error(`Server unreachable: Unable to connect to any endpoint of "${this.credentials.serverUrl}". The server might be blocking our requests or the URL might be incorrect. Try using a different IPTV app to verify the server is working.`);
      
    } catch (error) {
      console.error('❌ Server reachability test failed:', error);
      throw error;
    }
  }

  // XMLHttpRequest-basierte HTTP-Anfrage für iOS-Kompatibilität
  private async fetchWithXHR(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Timeout nach 30 Sekunden (länger für echte Geräte)
      xhr.timeout = 30000;
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log(`✅ XHR Success: ${xhr.status} ${xhr.statusText}`);
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (parseError) {
            console.log('📄 XHR Response (non-JSON):', xhr.responseText.substring(0, 200));
            reject(new Error(`Invalid JSON response: ${parseError}`));
          }
        } else {
          console.log(`❌ XHR Error: ${xhr.status} ${xhr.statusText}`);
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
      
      try {
        console.log(`🌐 XHR Opening: ${url}`);
        xhr.open('GET', url, true);
        
        // Headers setzen - wichtig für iOS Geräte
        xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
        xhr.setRequestHeader('User-Agent', this.workingUserAgent);
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.setRequestHeader('Pragma', 'no-cache');
        // Zusätzliche Headers für iOS
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
        
        console.log(`🤖 XHR User-Agent: ${this.workingUserAgent}`);
        console.log('📤 XHR Sending request...');
        
        xhr.send();
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildUrl(action: string, params: Record<string, string | number> = {}): string {
    // Verwende die bereits normalisierte baseUrl direkt
    const url = new URL(this.baseUrl);
    url.searchParams.set('username', this.credentials.username);
    url.searchParams.set('password', this.credentials.password);
    url.searchParams.set('action', action);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value.toString());
    });
    
    const finalUrl = url.toString();
    console.log(`🔗 Built URL for action "${action}":`, finalUrl);
    return finalUrl;
  }

  async authenticate(): Promise<XtreamAuthResponse> {
    return this.authenticateWithRetry(3); // 3 Versuche
  }

  private async authenticateWithRetry(maxRetries: number): Promise<XtreamAuthResponse> {
    console.log('🔧 Using VLC User-Agent for sky1001eu.xyz compatibility...');
    this.workingUserAgent = 'VLC/3.0.0 LibVLC/3.0.0';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔗 Xtream authentication attempt ${attempt}/${maxRetries}...`);
        
        const url = this.buildUrl('get_account_info');
        
        console.log('📡 Server URL:', this.credentials.serverUrl);
        console.log('👤 Username:', this.credentials.username);
        console.log('🌐 Full API URL:', url);
        console.log('🤖 Using User-Agent:', this.workingUserAgent);
        
        console.log('📤 Sending authentication request...');
        
        let response: Response;
        let data: any;
        
        // Auf iOS immer XMLHttpRequest verwenden für bessere Kompatibilität
        if (Platform.OS === 'ios') {
          console.log('📱 iOS detected - using optimized XMLHttpRequest');
          
          // Validiere URL vor der Anfrage
          const validation = IOSNetworkHelper.validateServerUrl(url);
          if (!validation.valid) {
            throw new Error(validation.error || 'Invalid server URL');
          }
          
          data = await IOSNetworkHelper.performIOSRequest(url, this.workingUserAgent);
          console.log('✅ iOS XMLHttpRequest successful');
          return data as XtreamAuthResponse;
        }
        
        // Für andere Plattformen normale fetch API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 15000); // 15 seconds timeout für Xtream
        
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': this.workingUserAgent,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log(`📥 Fetch Response status: ${response.status} ${response.statusText}`);
        console.log(`🌐 Response headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        
        data = await response.json();
        
        console.log(`📥 Final response status: ${response.status} ${response.statusText}`);
        console.log('📋 Response data:', JSON.stringify(data, null, 2));
        
        if (data.user_info?.auth !== 1) {
          throw new Error(`Authentication failed: ${data.user_info?.message || 'Invalid credentials'}`);
        }
        
        console.log(`✅ Authentication successful on attempt ${attempt}`);
        return data;
        
    } catch (error) {
        console.error(`❌ Authentication error on attempt ${attempt}:`, error);
        
        // Bei bestimmten Fehlern nicht erneut versuchen
        if (error instanceof Error && (
          error.message.includes('Invalid username or password') ||
          error.message.includes('Access denied') ||
          error.message.includes('account may be suspended') ||
          error.message.includes('Authentication failed')
        )) {
          throw error; // Sofort werfen, keine Wiederholung
        }
        
        // Bei Netzwerk-Fehlern erneut versuchen
        const isRetryableError = error instanceof Error && (
          error.name === 'AbortError' ||
          error.message.includes('Network request failed') ||
          error.message.includes('timeout') ||
          error.message.includes('Server Error') ||
          error.message.includes('Server is temporarily unavailable')
        );
        
        if (isRetryableError && attempt < maxRetries) {
          console.log(`⏳ Retrying Xtream authentication in 3 seconds... (${maxRetries - attempt} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        
        // Alle Versuche fehlgeschlagen oder nicht-retryable Fehler
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error(`Connection timeout: Server ${this.credentials.serverUrl} took too long to respond (all ${maxRetries} attempts failed).`);
          }
          if (error.message.includes('Network request failed')) {
            throw new Error(`Network error: Unable to connect to ${this.credentials.serverUrl} after ${maxRetries} attempts. Check server URL and internet connection.`);
          }
          throw new Error(`Failed to authenticate after ${maxRetries} attempts: ${error.message}`);
        }
        throw new Error(`Failed to authenticate after ${maxRetries} attempts: Unknown error`);
      }
    }
    
    // Fallback (sollte nie erreicht werden)
    throw new Error(`Failed to authenticate after ${maxRetries} attempts: All retry attempts failed`);
  }

  async getLiveCategories(): Promise<XtreamCategory[]> {
    const url = this.buildUrl('get_live_categories');
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': this.workingUserAgent,
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const categories = await response.json();
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('Failed to fetch live categories:', error);
      return [];
    }
  }

  async getLiveStreams(categoryId?: string): Promise<XtreamChannel[]> {
    const params: Record<string, string | number> = {};
    if (categoryId) {
      params.category_id = categoryId;
    }
    const url = this.buildUrl('get_live_streams', params);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': this.workingUserAgent,
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const streams = await response.json();
      return Array.isArray(streams) ? streams : [];
    } catch (error) {
      console.error('Failed to fetch live streams:', error);
      return [];
    }
  }

  async getAllChannels(): Promise<ParsedXtreamResult> {
    const errors: string[] = [];
    const channels: Channel[] = [];
    
    try {
      // First authenticate
      await this.authenticate();
      
      // Get categories for better organization
      const categories = await this.getLiveCategories();
      const categoryMap = new Map(
        categories.map(cat => [cat.category_id, cat.category_name])
      );
      
      // Get all live streams
      const streams = await this.getLiveStreams();
      
      if (streams.length === 0) {
        errors.push('No live streams found');
        return { channels, errors };
      }
      
      // Convert Xtream channels to our Channel format
      streams.forEach((stream) => {
        try {
          // Try different Xtream live stream URL formats based on stream type
          let streamUrl: string;
          
          // Method 1: Standard live stream format - verwende streamBaseUrl
          if (stream.stream_type === 'live') {
            streamUrl = `${this.streamBaseUrl}/live/${this.credentials.username}/${this.credentials.password}/${stream.stream_id}.ts`;
          } 
          // Method 2: Alternative format for some providers
          else if (stream.direct_source && stream.direct_source.startsWith('http')) {
            streamUrl = stream.direct_source;
          }
          // Method 3: HLS format
          else {
            streamUrl = `${this.streamBaseUrl}/live/${this.credentials.username}/${this.credentials.password}/${stream.stream_id}.m3u8`;
          }
          
          console.log(`Stream ${stream.stream_id} (${stream.name}): ${streamUrl}`);
          
          const channel: Channel = {
            id: `xtream_${stream.stream_id}`,
            name: stream.name || `Channel ${stream.stream_id}`,
            url: streamUrl,
            logo: stream.stream_icon || undefined,
            category: categoryMap.get(stream.category_id) || 'Uncategorized'
          };
          
          channels.push(channel);
        } catch (error) {
          errors.push(`Failed to parse stream ${stream.stream_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
      
      return { channels, errors };
      
    } catch (error) {
      errors.push(`Failed to fetch channels: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { channels, errors };
    }
  }

  getStreamUrl(streamId: number): string {
    return `${this.streamBaseUrl}/live/${this.credentials.username}/${this.credentials.password}/${streamId}.ts`;
  }

  // Static method to validate Xtream credentials format
  static validateCredentials(credentials: XtreamCredentials): string[] {
    const errors: string[] = [];
    
    if (!credentials.serverUrl?.trim()) {
      errors.push('Server URL is required');
    } else {
      try {
        new URL(credentials.serverUrl);
      } catch {
        errors.push('Invalid server URL format');
      }
    }
    
    if (!credentials.username?.trim()) {
      errors.push('Username is required');
    }
    
    if (!credentials.password?.trim()) {
      errors.push('Password is required');
    }
    
    return errors;
  }

  // Test connection method
  static async testConnection(credentials: XtreamCredentials): Promise<{ success: boolean; error?: string; info?: XtreamAuthResponse }> {
    const validationErrors = this.validateCredentials(credentials);
    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(', ') };
    }
    
    try {
      const client = new XtreamCodesClient(credentials);
      const authInfo = await client.authenticate();
      return { success: true, info: authInfo };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }
}
