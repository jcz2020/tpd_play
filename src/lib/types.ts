
export interface NewDevice {
  name: string;
  ip: string;
}

export interface Device extends NewDevice {
  id: string;
  online: boolean;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  duration: number; // in seconds
}

export type ScheduleAction = 'on' | 'off';

export interface Schedule {
  id: string;
  deviceId: string;
  time: string; // HH:mm format
  action: ScheduleAction;
  playlist: string;
  enabled: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

export interface MusicFolder {
  id: string;
  path: string;
}

export interface Source {
  id: string;
  name: string;
  type: string; // e.g., 'spotify', 'line-in', 'dlna'
}

export type PlayMode = 'sequential' | 'repeat-list' | 'repeat-one' | 'shuffle';

export interface PlaybackState {
    isPlaying: boolean;
    progress: number;
    volume: number;
    source: string;
    playMode: PlayMode;
}
