import { Platform } from 'react-native';

export class StreamUrlHelper {
  /**
   * Optimiert Stream-URLs für iOS-Geräte
   */
  static optimizeStreamUrlForIOS(originalUrl: string): string {
    if (Platform.OS !== 'ios') {
      return originalUrl;
    }

    console.log('🎬 Optimizing stream URL for iOS:', originalUrl);

    try {
      const url = new URL(originalUrl);
      
      // Für Xtream-URLs: Versuche alternative Formate
      if (originalUrl.includes('/live/') && originalUrl.includes('.ts')) {
        // Konvertiere .ts zu .m3u8 für bessere iOS-Kompatibilität
        const m3u8Url = originalUrl.replace('.ts', '.m3u8');
        console.log('🎬 iOS: Converting .ts to .m3u8 format:', m3u8Url);
        return m3u8Url;
      }
      
      // Für HLS-Streams: Stelle sicher, dass kein Port-Problem besteht
      if (originalUrl.includes('.m3u8')) {
        console.log('🎬 iOS: HLS stream detected, keeping original format');
        return originalUrl;
      }
      
      // Für direkte HTTP-Streams
      if (url.protocol === 'http:' && url.port) {
        console.log('🎬 iOS: HTTP stream with port detected');
        return originalUrl;
      }
      
      return originalUrl;
    } catch (error) {
      console.error('🎬 Error optimizing stream URL:', error);
      return originalUrl;
    }
  }

  /**
   * Testet die Erreichbarkeit einer Stream-URL
   */
  static async testStreamAccessibility(streamUrl: string): Promise<{
    accessible: boolean;
    status?: number;
    error?: string;
  }> {
    try {
      console.log('🧪 Testing stream accessibility:', streamUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(streamUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'VLC/3.0.0 LibVLC/3.0.0',
          'Accept': '*/*',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log('🧪 Stream test result:', response.status, response.statusText);
      
      return {
        accessible: response.ok || response.status === 404, // 404 kann bei HLS normal sein
        status: response.status
      };
    } catch (error) {
      console.error('🧪 Stream test failed:', error);
      return {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generiert alternative Stream-URLs für Fallback
   */
  static getAlternativeStreamUrls(originalUrl: string): string[] {
    const alternatives: string[] = [originalUrl];
    
    try {
      // Korrigiere fehlerhafte Xtream-URLs
      if (originalUrl.includes('/player_api.phplive/')) {
        const correctedUrl = originalUrl.replace('/player_api.phplive/', '/live/');
        alternatives.unshift(correctedUrl); // Setze korrigierte URL an den Anfang
        
        // Auch .m3u8 Version der korrigierten URL
        if (correctedUrl.includes('.ts')) {
          alternatives.push(correctedUrl.replace('.ts', '.m3u8'));
        }
      }
      
      if (originalUrl.includes('/live/') && originalUrl.includes('.ts')) {
        // .ts zu .m3u8
        alternatives.push(originalUrl.replace('.ts', '.m3u8'));
        
        // Versuche auch ohne Extension
        const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('.'));
        alternatives.push(baseUrl);
        alternatives.push(baseUrl + '.ts');
        alternatives.push(baseUrl + '.m3u8');
      }
      
      if (originalUrl.includes('.m3u8')) {
        // .m3u8 zu .ts
        alternatives.push(originalUrl.replace('.m3u8', '.ts'));
      }
      
    } catch (error) {
      console.error('🎬 Error generating alternative URLs:', error);
    }
    
    // Entferne Duplikate
    return [...new Set(alternatives)];
  }

  /**
   * Versucht alle alternativen URLs und gibt die erste funktionierende zurück
   */
  static async findWorkingStreamUrl(originalUrl: string): Promise<string> {
    const alternatives = this.getAlternativeStreamUrls(originalUrl);
    
    console.log('🔍 Testing stream alternatives:', alternatives);
    
    for (const url of alternatives) {
      const test = await this.testStreamAccessibility(url);
      if (test.accessible) {
        console.log('✅ Working stream URL found:', url);
        return this.optimizeStreamUrlForIOS(url);
      } else {
        console.log(`❌ Stream URL failed: ${url} - ${test.error || 'Status: ' + test.status}`);
      }
    }
    
    console.log('⚠️ No working stream URL found, returning original');
    return this.optimizeStreamUrlForIOS(originalUrl);
  }

  /**
   * Detaillierte Analyse warum ein Stream nicht funktioniert
   */
  static async analyzeStreamIssues(streamUrl: string, channelName?: string): Promise<{
    issues: string[];
    suggestions: string[];
    codecIssues: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const codecIssues: string[] = [];
    
    try {
      // URL-Format prüfen
      const url = new URL(streamUrl);
      
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        issues.push('Ungültiges Protokoll: ' + url.protocol);
        suggestions.push('Verwende http:// oder https://');
      }
      
      // HEVC/H.265 Codec-Erkennung
      const isHEVC = this.detectHEVCStream(streamUrl, channelName);
      if (isHEVC) {
        codecIssues.push('HEVC (H.265) Codec erkannt - kann zu Video-Problemen auf iOS führen');
        suggestions.push('HEVC-Streams: WebView-Player verwenden für bessere Kompatibilität');
        suggestions.push('Alternative: Suche nach H.264-Version desselben Kanals');
      }
      
      // Stream-Format erkennen
      if (streamUrl.includes('.ts')) {
        suggestions.push('TS-Stream: Versuche .m3u8 Format für bessere Kompatibilität');
      }
      
      if (streamUrl.includes('.m3u8')) {
        suggestions.push('HLS-Stream: Sollte auf iOS gut funktionieren');
      }
      
      // Erreichbarkeit testen
      const accessibility = await this.testStreamAccessibility(streamUrl);
      if (!accessibility.accessible) {
        issues.push('Stream nicht erreichbar: ' + (accessibility.error || 'Status ' + accessibility.status));
        suggestions.push('Prüfe Internetverbindung und Server-Status');
      }
      
    } catch (error) {
      issues.push('URL-Parsing-Fehler: ' + (error instanceof Error ? error.message : 'Unknown error'));
      suggestions.push('Prüfe URL-Format');
    }
    
    return { issues, suggestions, codecIssues };
  }

  /**
   * Erkennt problematische Video-Codecs basierend auf URL und Kanalnamen
   */
  static detectProblematicCodec(streamUrl: string, channelName?: string): {
    hasIssue: boolean;
    codec?: string;
    reason?: string;
  } {
    if (!channelName) return { hasIssue: false };
    
    const codecIndicators = [
      // HEVC/H.265 - sehr häufig problematisch
      { patterns: ['HEVC', 'H.265', 'H265', 'hevc', 'h.265', 'h265'], codec: 'HEVC', reason: 'HEVC wird oft nicht nativ unterstützt' },
      // 4K/UHD - oft problematische Codecs
      { patterns: ['4K', '4k', 'UHD', 'uhd', '2160p'], codec: '4K/UHD', reason: '4K-Streams verwenden oft problematische Codecs' },
      // FHD/HD - können auch problematisch sein
      { patterns: ['FHD', 'fhd', '1080p', 'HD+'], codec: 'FHD/HD+', reason: 'Hochauflösende Streams können Codec-Probleme haben' },
      // VP9/AV1 - moderne Codecs
      { patterns: ['VP9', 'vp9', 'AV1', 'av1'], codec: 'VP9/AV1', reason: 'Moderne Codecs werden nicht immer unterstützt' },
      // Spezielle Encoding-Indikatoren
      { patterns: ['x264', 'x265', 'H264', 'H265'], codec: 'x264/x265', reason: 'Spezielle Encoding-Parameter können problematisch sein' }
    ];
    
    const lowerChannelName = channelName.toLowerCase();
    
    for (const indicator of codecIndicators) {
      const hasPattern = indicator.patterns.some(pattern => 
        lowerChannelName.includes(pattern.toLowerCase())
      );
      
      if (hasPattern) {
        return {
          hasIssue: true,
          codec: indicator.codec,
          reason: indicator.reason
        };
      }
    }
    
    return { hasIssue: false };
  }

  /**
   * Legacy-Funktion für HEVC-Erkennung
   */
  static detectHEVCStream(streamUrl: string, channelName?: string): boolean {
    const result = this.detectProblematicCodec(streamUrl, channelName);
    return result.hasIssue && result.codec === 'HEVC';
  }

  /**
   * Prüft ob ein Stream WebView verwenden sollte (erweitert für alle problematischen Codecs)
   */
  static shouldUseWebViewForStream(streamUrl: string, channelName?: string): boolean {
    // Spezielle URLs die immer WebView brauchen
    if (streamUrl.includes('ip.sltv.be')) {
      return true;
    }
    
    // Codec-basierte Erkennung - aber nur für sehr problematische
    const codecResult = this.detectProblematicCodec(streamUrl, channelName);
    return codecResult.hasIssue && (codecResult.codec === 'HEVC' || codecResult.codec === 'VP9/AV1');
  }

  /**
   * Analysiert einen Stream und gibt Empfehlungen
   */
  static analyzeStreamForPlayer(streamUrl: string, channelName?: string): {
    recommendWebView: boolean;
    reason?: string;
    codec?: string;
    shouldTryNativeFirst: boolean;
  } {
    const codecResult = this.detectProblematicCodec(streamUrl, channelName);
    
    if (codecResult.hasIssue) {
      // Nur bei sehr problematischen Codecs direkt WebView empfehlen
      const directWebView = codecResult.codec === 'HEVC' || codecResult.codec === 'VP9/AV1';
      
      return {
        recommendWebView: directWebView,
        reason: codecResult.reason,
        codec: codecResult.codec,
        shouldTryNativeFirst: !directWebView
      };
    }
    
    return { 
      recommendWebView: false, 
      shouldTryNativeFirst: true 
    };
  }
}
