export interface Device {
  id: string;
  name: string;
  ip: string;
  online: boolean;
}

export interface Track {
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
