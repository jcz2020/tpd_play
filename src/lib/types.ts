export interface Device {
  id: string;
  name: string;
  ip: string;
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
