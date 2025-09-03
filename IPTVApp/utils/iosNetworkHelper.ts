import { Platform } from 'react-native';

/**
 * iOS-spezifische Netzwerk-Hilfsklasse für Xtream-Verbindungen
 */
export class IOSNetworkHelper {
  /**
   * Führt eine iOS-optimierte Netzwerkanfrage durch
   */
  static async performIOSRequest(url: string, userAgent: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Längerer Timeout für echte Geräte
      xhr.timeout = 45000; // 45 Sekunden
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (parseError) {
            // Manche Server geben HTML statt JSON zurück
            if (xhr.responseText.includes('<html') || xhr.responseText.includes('<!DOCTYPE')) {
              reject(new Error('Server returned HTML instead of JSON. Check server URL and credentials.'));
            } else {
              reject(new Error(`Invalid JSON response: ${parseError}`));
            }
          }
        } else if (xhr.status === 401) {
          reject(new Error('Authentication failed. Please check username and password.'));
        } else if (xhr.status === 404) {
          reject(new Error('API endpoint not found. Please check server URL.'));
        } else if (xhr.status === 0) {
          reject(new Error('Network request failed. Check internet connection and server availability.'));
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        // Detaillierte Fehlerbehandlung für iOS
        const errorMessage = this.getDetailedNetworkError(xhr, url);
        reject(new Error(errorMessage));
      };
      
      xhr.ontimeout = () => {
        reject(new Error('Request timeout. The server took too long to respond.'));
      };
      
      try {
        xhr.open('GET', url, true);
        
        // Wichtige Headers für iOS
        xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
        xhr.setRequestHeader('User-Agent', userAgent);
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
        
        xhr.send();
      } catch (error) {
        reject(new Error(`Failed to send request: ${error}`));
      }
    });
  }
  
  /**
   * Erstellt eine detaillierte Fehlermeldung basierend auf iOS-Netzwerkfehlern
   */
  private static getDetailedNetworkError(xhr: XMLHttpRequest, url: string): string {
    const urlObj = new URL(url);
    const isHTTPS = urlObj.protocol === 'https:';
    const isLocalNetwork = this.isLocalNetworkAddress(urlObj.hostname);
    
    if (xhr.status === 0) {
      if (isHTTPS) {
        return 'SSL/TLS connection failed. The server certificate may be invalid or self-signed.';
      } else if (isLocalNetwork) {
        return 'Local network connection failed. Ensure the device is on the same network as the server.';
      } else {
        return 'Network connection failed. Check internet connectivity and firewall settings.';
      }
    }
    
    return 'Unknown network error occurred.';
  }
  
  /**
   * Prüft ob eine Adresse im lokalen Netzwerk ist
   */
  private static isLocalNetworkAddress(hostname: string): boolean {
    return hostname.startsWith('192.168.') || 
           hostname.startsWith('10.') || 
           hostname.startsWith('172.') ||
           hostname === 'localhost' ||
           hostname.endsWith('.local');
  }
  
  /**
   * Validiert die Server-URL vor der Anfrage
   */
  static validateServerUrl(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      
      // Prüfe auf gültige Protokolle
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'Invalid protocol. Use http:// or https://' };
      }
      
      // Warnung bei unsicheren Verbindungen
      if (urlObj.protocol === 'http:' && Platform.OS === 'ios') {
        console.warn('⚠️ Using insecure HTTP connection on iOS. Consider using HTTPS.');
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }
}
