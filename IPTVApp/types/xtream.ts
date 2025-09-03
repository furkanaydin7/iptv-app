export interface XtreamCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface XtreamAuthResponse {
  user_info: {
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
  };
  server_info: {
    url: string;
    port: string;
    https_port: string;
    server_protocol: string;
    rtmp_port: string;
    timezone: string;
    timestamp_now: number;
    time_now: string;
  };
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamChannel {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  is_adult: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface XtreamStreamInfo {
  info: {
    tmdb_id: string;
    name: string;
    o_name: string;
    cover: string;
    screenshot: string;
    genre: string;
    cast: string;
    director: string;
    releasedate: string;
    episode_run_time: string;
    youtube_trailer: string;
    tmdb_rating: string;
    country: string;
    bitrate: number;
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    custom_sid: string;
    direct_source: string;
  };
}

export interface ParsedXtreamResult {
  channels: import('../types').Channel[];
  errors: string[];
}