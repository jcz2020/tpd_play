# API Reference

This document provides a reference for the "API" of the Acoustic Harmony application. Since the application uses Next.js Server Actions, the "API" consists of the functions exported from `src/lib/actions.ts` and the data types defined in `src/lib/types.ts`.

---

## Data Types (`src/lib/types.ts`)

### `Device`
Represents a configured B&O device.
```ts
interface Device {
  id: string;       // Unique identifier
  name: string;     // User-friendly name (e.g., "Living Room Speaker")
  ip: string;       // IP address of the device
  online: boolean;  // Online status
}
```

### `Track`
Represents a single audio track.
```ts
interface Track {
  id: string;            // Unique identifier
  title: string;
  artist: string;
  albumArtUrl: string;
  duration: number;      // Duration in seconds
  path?: string;         // Optional local filesystem path
}
```

### `PlaybackState`
Represents the complete, real-time state of a device's playback.
```ts
interface PlaybackState {
    state: 'playing' | 'paused' | 'stopped' | 'buffering';
    progress: number;      // Progress in seconds
    volume: number;        // Volume from 0 to 100
    source: string;        // ID of the active source
    playMode: 'sequential' | 'repeat-list' | 'repeat-one' | 'shuffle';
    track: Track | null;   // The currently playing track
}
```

### `Source`
Represents an available playback source on a device.
```ts
interface Source {
  id: string;
  name: string;
  type: string; // e.g., 'spotify', 'line-in'
}
```

*(Other types like `Playlist`, `Schedule`, etc. are also defined in this file.)*

---

## Server Actions (`src/lib/actions.ts`)

Below are the primary functions that the client application can call.

### Device Management

- **`getDevices(): Promise<Device[]>`**
  - Retrieves all saved devices from the database and checks their current online status.

- **`addDevice(device: NewDevice): Promise<Device>`**
  - Adds a new device to the database. `NewDevice` is like `Device` but without `id` and `online`.

- **`deleteDevice(deviceId: string): Promise<{success: boolean}>`**
  - Deletes a device from the database by its ID.

- **`discoverDevices(): Promise<Omit<Device, 'id' | 'online'>[]>`**
  - Communicates with the local discovery service to find new devices on the network.

### Playback Control

- **`getAvailableSources(deviceId: string, ip: string): Promise<Source[]>`**
  - Fetches the list of available playback sources (e.g., Spotify, TV) for a specific device.

- **`getPlaybackState(deviceId: string, ip: string): Promise<PlaybackState>`**
  - Fetches the complete current playback status from a device.

- **`setPlaybackState(deviceId: string, ip: string, state: 'playing' | 'paused'): Promise<void>`**
  - Sends a command to the device to either play or pause.

- **`setVolume(deviceId: string, ip: string, volume: number): Promise<void>`**
  - Sets the device's volume (0-100).

- **`seekTo(deviceId: string, ip: string, progress: number): Promise<void>`**
  - Seeks the currently playing track to a specific time (in seconds).

- **`nextTrack(deviceId: string, ip: string): Promise<void>`**
- **`previousTrack(deviceId: string, ip: string): Promise<void>`**
  - Skips to the next or previous track in the play queue.

- **`changeSource(deviceId: string, ip: string, sourceId: string): Promise<void>`**
  - Changes the active input source on the device.

- **`setPlayMode(deviceId: string, ip: string, mode: PlayMode): Promise<void>`**
  - Sets the playback mode (e.g., 'shuffle', 'repeat-list').

### Music Library

- **`getMusicFolders(): Promise<MusicFolder[]>`**
  - Retrieves the configured list of local music folder paths.

- **`saveMusicFolders(folders: MusicFolder[]): Promise<void>`**
  - Saves the list of music folder paths to the database.

- **`getAvailableTracks(): Promise<Track[]>`**
  - Retrieves all tracks that have been discovered from the database.

- **`scanMusicFolders(): Promise<{ success: boolean, message: string, count: number }>`**
  - Triggers a scan of the configured music folders on the server to find audio files.
