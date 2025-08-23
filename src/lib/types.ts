
/**
 * @fileoverview This file contains all the core TypeScript type definitions and interfaces
 * used throughout the Acoustic Harmony application. It serves as a single source of
 * truth for the data structures that are passed between the client, server, and database.
 */

/**
 * Represents a new device being added, before it has been assigned a unique ID.
 */
export interface NewDevice {
  name: string;
  ip: string;
}

/**
 * Represents a B&O device that has been added to the application.
 */
export interface Device extends NewDevice {
  id: string;
  online: boolean;
}

/**
 * Represents a single audio track in the music library.
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  duration: number; // in seconds
  path?: string; // The absolute file path, if it's a local file
}

/**
 * Represents the possible actions for a scheduled task.
 */
export type ScheduleAction = 'on' | 'off';

/**
 * Represents a single scheduled task for a device.
 */
export interface Schedule {
  id: string;
  deviceId: string;
  time: string; // HH:mm format
  action: ScheduleAction;
  playlist: string;
  enabled: boolean;
}

/**
 * Represents a user-created playlist.
 */
export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

/**
 * Represents a single folder path to be scanned for music.
 */
export interface MusicFolder {
  id: string;
  path: string;
}

/**
 * Represents an available playback source on a device (e.g., Spotify, TV, Bluetooth).
 */
export interface Source {
  id: string;
  name: string;
  type: string; // e.g., 'spotify', 'line-in', 'dlna'
}

/**
 * Represents the different play modes available.
 */
export type PlayMode = 'sequential' | 'repeat-list' | 'repeat-one' | 'shuffle';

/**
 * Represents the various playback states of a device.
 */
export type PlayState = 'playing' | 'paused' | 'stopped' | 'buffering';

/**
 * Represents the complete, real-time playback state of a device.
 */
export interface PlaybackState {
    state: PlayState;
    progress: number; // Playback progress in seconds
    volume: number; // Volume level from 0 to 100
    source: string; // The ID of the currently active source
    playMode: PlayMode;
    track: Track | null; // The currently playing track, or null if none
}
