import { Channel } from '../types';
import { IOSNetworkDebugger } from './iOSNetworkDebugger';

export interface ParsedM3UResult {
  channels: Channel[];
  errors: string[];
}

export async function parseM3UFromUrl(url: string): Promise<ParsedM3UResult> {
  return parseM3UFromUrlWithRetry(url, 3); // Bis zu 3 Versuche
}

async function parseM3UFromUrlWithRetry(url: string, maxRetries: number): Promise<ParsedM3UResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[M3U] 🔄 Attempt ${attempt}/${maxRetries} for URL: ${url}`);
      
      // Nur beim ersten Versuch das vollständige Debugging durchführen
      if (attempt === 1) {
        IOSNetworkDebugger.logNetworkEnvironment();
      }
      
      // Sanitize common formatting issues (spaces/newlines inside the URL)
      const cleanUrl = url.replace(/\s+/g, '').trim();
      console.log('[M3U] 🌐 Fetching URL:', cleanUrl);
      console.log('[M3U] 📱 Platform: iOS Device');
      console.log('[M3U] 🔗 Original URL:', url);
      
      // Teste URL-Erreichbarkeit nur beim ersten Versuch
      if (attempt === 1) {
        const isReachable = await IOSNetworkDebugger.testM3UUrl(cleanUrl);
        if (!isReachable) {
          console.warn('[M3U] ⚠️ URL may not be reachable, but continuing with full request...');
        }
      }

      // Basic validation to provide actionable errors early
      try {
        // eslint-disable-next-line no-new
        new URL(cleanUrl);
      } catch {
        throw new Error('Invalid M3U URL format');
      }

      // Add a manual timeout and friendly headers (some providers block default UA)
      // Erhöhe Timeout für iOS, aber verkürze bei wiederholten Versuchen
      const controller = new AbortController();
      const timeoutDuration = attempt === 1 ? 60000 : 30000; // Erster Versuch 60s, weitere 30s
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

          let content: string;
      
      // Bei wiederholten Versuchen, verwende alternative Download-Strategien
      if (attempt > 1) {
        console.log(`[M3U] 🔄 Using alternative download strategy for retry ${attempt}...`);
        clearTimeout(timeoutId); // Cancel timeout für alternative downloads
        
        if (attempt === 2) {
          // 2. Versuch: Chunked download
          content = await IOSNetworkDebugger.downloadM3UWithProgress(cleanUrl);
        } else {
          // 3. Versuch: XMLHttpRequest
          content = await IOSNetworkDebugger.downloadM3UWithXHR(cleanUrl);
        }
      } else {
        // Normaler Download für ersten Versuch
        const response = await fetch(cleanUrl, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
            'User-Agent': 'IPTV-App/1.0 (iOS) Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('[M3U] ✅ Response received:', response.status, response.statusText);
        console.log('[M3U] 📄 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        content = await response.text();
      }
      console.log('[M3U] 📝 Content length:', content.length, 'characters');
      console.log('[M3U] 🔍 Content preview:', content.substring(0, 200));
      console.log(`[M3U] ✅ Successfully fetched M3U on attempt ${attempt}`);
      return parseM3UContent(content);
      
    } catch (error) {
      console.error(`[M3U] Fetch error on attempt ${attempt}:`, error);
      
      // Detailliertes iOS-Debugging beim ersten Versuch
      if (attempt === 1) {
        IOSNetworkDebugger.logFetchError(error, url);
      }
      
      // Bei verschiedenen Fehlertypen erneut versuchen
      const isRetryableError = error instanceof Error && (
        error.name === 'AbortError' || 
        error.message.includes('Network request failed') ||
        error.message.includes('timeout') ||
        error.message.includes('XMLHttpRequest network error') ||
        error.message.includes('XMLHttpRequest timeout')
      );
      
      if (isRetryableError && attempt < maxRetries) {
        console.log(`[M3U] ⏳ Retrying in 2 seconds... (${maxRetries - attempt} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 Sekunden warten
        continue; // Nächster Versuch
      }
      
      // Alle Versuche fehlgeschlagen
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // iOS-spezifische Fehlermeldungen
        if (errorMessage.includes('Network request failed')) {
          errorMessage = 'Netzwerk-Fehler: iOS kann die M3U-URL nicht erreichen. Mögliche Ursachen: Server blockiert iOS, Firewall, oder Netzwerk-Problem.';
        } else if (error.name === 'AbortError') {
          errorMessage = 'Zeitüberschreitung: Server antwortet nicht rechtzeitig (alle 3 Versuche fehlgeschlagen).';
        } else if (errorMessage.includes('XMLHttpRequest network error')) {
          errorMessage = 'XMLHttpRequest-Fehler: iOS-Netzwerk-Stack kann die Verbindung nicht herstellen.';
        } else if (errorMessage.includes('NSURLErrorDomain')) {
          errorMessage = 'iOS Netzwerk-Fehler: ' + errorMessage;
        }
      }
      
      return {
        channels: [],
        errors: [`Failed to fetch M3U from ${url} after ${maxRetries} attempts: ${errorMessage}`]
      };
    }
  }
  
  // Fallback (sollte nie erreicht werden)
  return {
    channels: [],
    errors: [`Failed to fetch M3U from ${url}: All retry attempts failed`]
  };
}

export function parseM3UContent(content: string): ParsedM3UResult {
  // Normalize BOM and line endings to be tolerant to various providers
  const normalized = content
    .replace(/^\uFEFF/, '') // strip UTF-8 BOM if present
    .replace(/\r\n?/g, '\n'); // convert CRLF/CR to LF
  const lines = normalized.split('\n').map(line => line.trim());
  const channels: Channel[] = [];
  const errors: string[] = [];
  
  if (!lines[0]?.toUpperCase().startsWith('#EXTM3U')) {
    errors.push('Invalid M3U file: Missing #EXTM3U header');
    return { channels, errors };
  }

  let currentChannel: Partial<Channel> = {};
  let channelIndex = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse channel info line
      try {
        const info = parseExtInf(line);
        currentChannel = {
          id: `channel_${channelIndex++}`,
          name: info.name,
          logo: info.logo,
          category: info.group
        };
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
        continue;
      }
    } else if (line.startsWith('http')) {
      // Stream URL
      if (currentChannel.name) {
        channels.push({
          id: currentChannel.id || `channel_${channelIndex++}`,
          name: currentChannel.name,
          url: line,
          logo: currentChannel.logo,
          category: currentChannel.category
        });
        currentChannel = {};
      } else {
        errors.push(`Line ${i + 1}: Stream URL without channel info`);
      }
    }
    // Ignore other comment lines
  }

  return { channels, errors };
}

function parseExtInf(line: string): { name: string; logo?: string; group?: string } {
  // Format: #EXTINF:duration,title
  // Extended format may include tvg-logo="..." group-title="..."
  
  const match = line.match(/#EXTINF:([^,]*),(.*)$/);
  if (!match) {
    throw new Error('Invalid EXTINF format');
  }

  const attributes = match[1];
  const title = match[2].trim();

  if (!title) {
    throw new Error('Missing channel title');
  }

  // Extract logo from attributes
  const logoMatch = attributes.match(/tvg-logo="([^"]*)"/);
  const logo = logoMatch ? logoMatch[1] : undefined;

  // Extract group from attributes
  const groupMatch = attributes.match(/group-title="([^"]*)"/);
  const group = groupMatch ? groupMatch[1] : undefined;

  return {
    name: title,
    logo,
    group
  };
}
