import { UserCredentials, Channel } from '../types';

export interface XtreamCodesResponse {
  user_info?: {
    username: string;
    password: string;
    message: string;
    auth: number;
    status: string;
    exp_date: string;
    is_trial: string;
    active_cons: string;
    created_at: string;
    max_connections: string;
    allowed_output_formats: string[];
  };
}

export interface XtreamCodesCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamCodesChannel {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export class AuthService {
  static async authenticateXtreamCodes(credentials: UserCredentials): Promise<XtreamCodesResponse> {
    const { username, password, serverUrl } = credentials;
    
    // Clean up server URL
    const cleanUrl = serverUrl.replace(/\/$/, '');
    const authUrl = `${cleanUrl}/player_api.php?username=${username}&password=${password}`;
    
    try {
      const response = await fetch(authUrl);
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.user_info || data.user_info.auth !== 1) {
        throw new Error('Invalid credentials or account not active');
      }
      
      return data;
    } catch (error) {
      console.error('Xtream Codes authentication error:', error);
      throw error;
    }
  }
  
  static async getXtreamCodesChannels(credentials: UserCredentials): Promise<Channel[]> {
    const { username, password, serverUrl } = credentials;
    const cleanUrl = serverUrl.replace(/\/$/, '');
    
    try {
      // First authenticate
      await this.authenticateXtreamCodes(credentials);
      
      // Get live TV channels
      const channelsUrl = `${cleanUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
      const response = await fetch(channelsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.status} ${response.statusText}`);
      }
      
      const channelsData: XtreamCodesChannel[] = await response.json();
      
      // Get categories for grouping
      const categoriesUrl = `${cleanUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
      const categoriesResponse = await fetch(categoriesUrl);
      
      let categories: XtreamCodesCategory[] = [];
      if (categoriesResponse.ok) {
        categories = await categoriesResponse.json();
      }
      
      // Create a map of category IDs to names
      const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.category_id] = cat.category_name;
        return acc;
      }, {} as { [key: string]: string });
      
      // Convert to our Channel format
      const channels: Channel[] = channelsData.map(channel => ({
        id: channel.stream_id.toString(),
        name: channel.name,
        url: `${cleanUrl}/live/${username}/${password}/${channel.stream_id}.m3u8`,
        logo: channel.stream_icon || undefined,
        group: categoryMap[channel.category_id] || 'Ungrouped',
        tvgId: channel.epg_channel_id || undefined,
      }));
      
      return channels;
    } catch (error) {
      console.error('Error fetching Xtream Codes channels:', error);
      throw error;
    }
  }
  
  static validateCredentials(credentials: Partial<UserCredentials>): boolean {
    return !!(credentials.username && credentials.password && credentials.serverUrl);
  }
  
  static formatServerUrl(url: string): string {
    // Remove trailing slash and ensure proper format
    let cleanUrl = url.trim().replace(/\/$/, '');
    
    // Add protocol if missing
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'http://' + cleanUrl;
    }
    
    return cleanUrl;
  }
}