export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
}

export interface ChannelGroup {
  name: string;
  channels: Channel[];
}

export interface PlaylistSource {
  type: 'url' | 'credentials';
  url?: string;
  username?: string;
  password?: string;
  serverUrl?: string;
}

export interface UserCredentials {
  username: string;
  password: string;
  serverUrl: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isBuffering: boolean;
}

export interface AppSettings {
  enableBackgroundPlayback: boolean;
  autoplay: boolean;
  volume: number;
  favoriteChannels: string[];
  recentChannels: Channel[];
}