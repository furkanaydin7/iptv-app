import { Channel, ChannelGroup } from '../types';

export class M3UParser {
  static parseM3U(content: string): Channel[] {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const channels: Channel[] = [];
    
    let currentChannel: Partial<Channel> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('#EXTINF:')) {
        // Parse channel info
        const match = line.match(/#EXTINF:(-?\d+(?:\.\d+)?)\s*(?:tvg-id="([^"]*)")?\s*(?:tvg-name="([^"]*)")?\s*(?:tvg-logo="([^"]*)")?\s*(?:group-title="([^"]*)")?\s*,(.*)$/);
        
        if (match) {
          const [, , tvgId, , logo, group, name] = match;
          
          currentChannel = {
            id: `${Date.now()}-${Math.random()}`,
            name: name?.trim() || 'Unknown Channel',
            tvgId: tvgId || undefined,
            logo: logo || undefined,
            group: group || 'Ungrouped',
          };
        }
      } else if (line.startsWith('http://') || line.startsWith('https://')) {
        // This is a stream URL
        if (currentChannel.name) {
          currentChannel.url = line;
          channels.push(currentChannel as Channel);
          currentChannel = {};
        }
      }
    }
    
    return channels;
  }
  
  static groupChannels(channels: Channel[]): ChannelGroup[] {
    const groups: { [key: string]: Channel[] } = {};
    
    channels.forEach(channel => {
      const groupName = channel.group || 'Ungrouped';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(channel);
    });
    
    return Object.keys(groups).map(name => ({
      name,
      channels: groups[name],
    }));
  }
  
  static async fetchM3UFromUrl(url: string): Promise<Channel[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch M3U: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      return this.parseM3U(content);
    } catch (error) {
      console.error('Error fetching M3U playlist:', error);
      throw error;
    }
  }
  
  static validateM3UUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}