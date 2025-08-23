
"use server";

import type { Device, NewDevice, PlaybackState, PlayMode, Source, Track, MusicFolder, PlayState } from "./types";
import { getDb, saveDb } from "./db";
import { randomUUID } from "crypto";
import { promises as fs } from 'fs';
import path from 'path';
import * as mm from 'music-metadata';

// This is a mock API client. In a real application, this would be a proper
// library for interacting with the B&O API.
const beoApi = {
    get: async (ip: string, path: string) => {
      // In a real app, you'd add error handling, headers, etc.
      const url = `http://${ip}:8080/${path}`;
      console.log(`BEO_API GET: ${url}`);
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          console.error(`API GET request to ${url} failed with status ${response.status}`);
          // Return an empty object for consistency in failure cases
          return {}; 
        }
        // Handle cases where the response body might be empty
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      } catch (e) {
        console.error(`API GET request to ${url} failed:`, e);
        return {};
      }
    },
    post: async (ip: string, path: string, body: any = {}) => {
      const url = `http://${ip}:8080/${path}`;
      console.log(`BEO_API POST: ${url}`, body);
      try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store',
          });
          if (!response.ok) {
            console.error(`API POST request to ${url} failed with status ${response.status}`);
          }
          return response;
      } catch (e) {
        console.error(`API POST request to ${url} failed:`, e);
        return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
      }
    },
    put: async (ip: string, path: string, body: any = {}) => {
        const url = `http://${ip}:8080/${path}`;
        console.log(`BEO_API PUT: ${url}`, body);
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                cache: 'no-store',
            });
            if (!response.ok) {
                console.error(`API PUT request to ${url} failed with status ${response.status}`);
            }
            return response;
        } catch (e) {
            console.error(`API PUT request to ${url} failed:`, e);
            return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
        }
    },
  };

// --- Device Management ---

export async function getDevices(): Promise<Device[]> {
  const db = await getDb();
  // For now, assume devices are online. A real app might ping them.
  const devicesWithOnlineStatus = await Promise.all(db.devices.map(async (d) => {
    try {
      // A simple check to see if the device is responsive.
      const res = await fetch(`http://${d.ip}:8080/BeoDevice`, { cache: 'no-store', signal: AbortSignal.timeout(1000) });
      return { ...d, online: res.ok };
    } catch {
      return { ...d, online: false };
    }
  }));
  return devicesWithOnlineStatus;
}

export async function addDevice(device: NewDevice): Promise<Device> {
    const db = await getDb();
    // Check if device with the same IP already exists
    const existingDevice = db.devices.find(d => d.ip === device.ip);
    if (existingDevice) {
        return existingDevice;
    }
    const newDevice: Device = { ...device, id: randomUUID(), online: true };
    db.devices.push(newDevice);
    await saveDb(db);
    return newDevice;
}

export async function deleteDevice(deviceId: string): Promise<{success: boolean}> {
    const db = await getDb();
    const initialLength = db.devices.length;
    db.devices = db.devices.filter(d => d.id !== deviceId);
    if (db.devices.length < initialLength) {
        await saveDb(db);
        return { success: true };
    }
    return { success: false };
}

export async function discoverDevices(): Promise<Omit<Device, 'id' | 'online'>[]> {
  console.log("Attempting to scan for B&O devices via local discovery service...");
  try {
    const response = await fetch('http://localhost:9003/discover', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Local discovery service responded with status: ${response.status}`);
    }
    const devices = await response.json();
    console.log(`Discovered ${devices.length} devices.`);
    return devices;
  } catch (error) {
    console.error("Could not connect to the local discovery service. Is it running?", error);
    // Return an empty array on error so the UI can handle it gracefully.
    return [];
  }
}

// --- Playback Control ---

export async function getAvailableSources(deviceId: string, ip: string): Promise<Source[]> {
    console.log(`Fetching available sources for device ${deviceId} at ${ip}...`);
    try {
        const data = await beoApi.get(ip, 'BeoZone/Zone/Sources');
        if (!data || !data.sources) {
            console.warn(`No sources data received from ${ip}`);
            return [];
        }
        // The sources are in a nested object, so we need to extract them.
        return Object.values(data.sources).map((source: any) => ({
            id: source.id,
            name: source.friendlyName,
            type: source.type,
        }));
    } catch (error) {
      console.error(`Could not fetch sources for ${ip}:`, error);
      return [];
    }
}


export async function getPlaybackState(deviceId: string, ip: string): Promise<PlaybackState> {
    try {
      // Fetch both stream and volume data in parallel for efficiency
      const [streamData, volumeData] = await Promise.all([
        beoApi.get(ip, 'BeoZone/Zone/Stream'),
        beoApi.get(ip, 'BeoDevice/settings/volume')
      ]);

      const apiTrack = streamData?.track;
      let track: Track | null = null;

      // Only create a track object if we have a title from the API
      if (apiTrack && apiTrack.title) {
        track = {
            id: apiTrack.id ?? randomUUID(),
            title: apiTrack.title,
            artist: apiTrack.artist ?? 'Unknown Artist',
            albumArtUrl: apiTrack.art?.url || `https://placehold.co/300x300.png?text=${encodeURIComponent(apiTrack.title)}`,
            duration: apiTrack.duration ?? 0,
        };
      }
      
      const playbackState: PlaybackState = {
        state: (streamData?.state as PlayState) ?? "stopped",
        progress: streamData?.progress ?? 0,
        volume: volumeData?.speaker?.level ?? 50,
        source: streamData?.source?.id ?? "local",
        playMode: streamData?.playMode?.shuffle ? 'shuffle' : 'sequential',
        track: track,
      };
      return playbackState;

    } catch (error) {
      console.error(`Failed to get playback state for ${ip}:`, error);
      // Return a sensible default "offline" or "error" state
      return {
        state: "stopped",
        progress: 0,
        volume: 50,
        source: 'local',
        playMode: 'sequential',
        track: null,
      };
    }
}

export async function setPlaybackState(deviceId: string, ip: string, state: 'playing' | 'paused'): Promise<void> {
    const command = state === 'playing' ? 'play' : 'pause';
    await beoApi.post(ip, `BeoZone/Zone/Player/${command}`);
}

export async function seekTo(deviceId: string, ip: string, progress: number): Promise<void> {
    // The API expects the progress in seconds, ensure it's a whole number.
    await beoApi.put(ip, 'BeoZone/Zone/Player/progress', { progress: Math.round(progress) });
}

export async function setVolume(deviceId: string, ip: string, volume: number): Promise<void> {
    await beoApi.put(ip, 'BeoDevice/settings/volume', { level: volume });
}

export async function nextTrack(deviceId: string, ip: string): Promise<void> {
    await beoApi.post(ip, 'BeoZone/Zone/Player/forward');
}

export async function previousTrack(deviceId: string, ip: string): Promise<void> {
    await beoApi.post(ip, 'BeoZone/Zone/Player/backward');
}

export async function changeSource(deviceId: string, ip: string, sourceId: string): Promise<void> {
    // The API expects the source ID in the body for the POST request
    await beoApi.post(ip, 'BeoZone/Zone/ActiveSource', { id: sourceId });
}

export async function setPlayMode(deviceId: string, ip: string, mode: PlayMode): Promise<void> {
    const shuffle = mode === 'shuffle';
    // Repeat modes are more complex and might require a different endpoint or payload
    // For now, we only support shuffle on/off
    await beoApi.put(ip, 'BeoZone/Zone/Player/playQueue', { shuffle });
}


// --- Music Library Management ---
export async function getMusicFolders(): Promise<MusicFolder[]> {
    const db = await getDb();
    return db.musicFolders ?? [];
}

export async function saveMusicFolders(folders: MusicFolder[]): Promise<void> {
    const db = await getDb();
    db.musicFolders = folders;
    await saveDb(db);
}

export async function getAvailableTracks(): Promise<Track[]> {
    const db = await getDb();
    return db.tracks ?? [];
}

export async function scanMusicFolders(): Promise<{ success: boolean, message: string, count: number }> {
    console.log("Starting music folder scan...");
    const db = await getDb();
    const folders = db.musicFolders;

    if (!folders || folders.length === 0) {
        return { success: false, message: "No music folders configured.", count: 0 };
    }

    const supportedExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a'];
    let allTracks: Track[] = [];
    let filesScanned = 0;

    for (const folder of folders) {
        if (!folder.path) continue;
        try {
            console.log(`Scanning folder: ${folder.path}`);
            const dirents = await fs.readdir(folder.path, { withFileTypes: true, recursive: true });
            for (const dirent of dirents) {
                const filePath = path.join(folder.path, dirent.name);
                if (dirent.isFile() && supportedExtensions.includes(path.extname(filePath).toLowerCase())) {
                    filesScanned++;
                    try {
                       const metadata = await mm.parseFile(filePath);
                       const track: Track = {
                            id: randomUUID(),
                            title: metadata.common.title ?? path.basename(filePath),
                            artist: metadata.common.artist ?? 'Unknown Artist',
                            albumArtUrl: 'https://placehold.co/100x100.png', // Placeholder, could be extracted if available
                            duration: metadata.format.duration ?? 0,
                            path: filePath,
                       };
                       allTracks.push(track);
                    } catch (err) {
                        console.warn(`Could not parse metadata for ${filePath}:`, err);
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning folder ${folder.path}:`, error);
            return { success: false, message: `Error scanning folder: ${folder.path}. Please check if the path is correct and accessible.`, count: 0 };
        }
    }

    db.tracks = allTracks;
    await saveDb(db);

    console.log(`Scan complete. Found ${allTracks.length} tracks from ${filesScanned} files.`);
    return { success: true, message: `Scan complete. Found ${allTracks.length} tracks.`, count: allTracks.length };
}
