
"use server";

import type { Device, NewDevice, PlaybackState, Source } from "./types";
import { getDb, saveDb } from "./db";
import { randomUUID } from "crypto";

// This is a mock API client. In a real application, this would be a proper
// library for interacting with the B&O API.
const beoApi = {
    get: async (ip: string, path: string) => {
      // In a real app, you'd add error handling, headers, etc.
      const response = await fetch(`http://${ip}/${path}`, { cache: 'no-store' });
      if (!response.ok) {
        // A real app would have more robust error handling
        console.error(`API GET request to http://${ip}/${path} failed with status ${response.status}`);
        // Return a default/empty state on failure to prevent crashes
        return {}; 
      }
      try {
        const data = await response.json();
        return data;
      } catch (e) {
        console.error(`Failed to parse JSON from http://${ip}/${path}`);
        return {};
      }
    },
    post: async (ip: string, path: string, body: any = {}) => {
      const response = await fetch(`http://${ip}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!response.ok) {
        console.error(`API POST request to http://${ip}/${path} failed with status ${response.status}`);
      }
      return response;
    },
    put: async (ip: string, path: string, body: any = {}) => {
        const response = await fetch(`http://${ip}/${path}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store',
        });
        if (!response.ok) {
          console.error(`API PUT request to http://${ip}/${path} failed with status ${response.status}`);
        }
        return response;
      },
  };

// --- Device Management ---

export async function getDevices(): Promise<Device[]> {
  const db = await getDb();
  // In a real app, you might ping each device to check its online status
  const devicesWithOnlineStatus = db.devices.map(d => ({...d, online: true}));
  return devicesWithOnlineStatus;
}

export async function addDevice(device: NewDevice): Promise<Device> {
    const db = await getDb();
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
    return [];
  }
}

// --- Playback Control ---

export async function getAvailableSources(deviceId: string, ip: string): Promise<Source[]> {
    console.log(`Fetching available sources for device ${deviceId} at ${ip}...`);
    try {
        const data = await beoApi.get(ip, 'BeoZone/Zone/Sources');
        // The real API returns a complex object. We need to map it to our Source type.
        // This is a simplified mapping based on potential B&O API structure.
        return Object.entries(data.sources ?? {}).map(([id, source]: [string, any]) => ({
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
      const data = await beoApi.get(ip, 'BeoZone/Zone/Stream');
      const volumeData = await beoApi.get(ip, 'BeoDevice/settings/volume');
      
      return {
        state: data.state ?? "stopped",
        progress: data.progress ?? 0,
        volume: volumeData.level ?? 50,
        source: data.source?.id ?? "local",
        playMode: data.playMode ?? 'sequential', // This needs mapping from the real API
        track: data.track ? {
            id: data.track.id,
            title: data.track.title,
            artist: data.track.artist,
            albumArtUrl: data.track.albumArtUrl ?? 'https://placehold.co/300x300.png',
            duration: data.track.duration ?? 0,
        } : null,
      };
    } catch (error) {
      console.error(`Failed to get playback state for ${ip}`, error);
      // Return a sensible default state on error
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
    await beoApi.put(ip, 'BeoZone/Zone/Player/progress', { progress });
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
    await beoApi.post(ip, 'BeoZone/Zone/ActiveSource', { id: sourceId });
}

export async function setPlayMode(deviceId: string, ip: string, mode: string): Promise<void> {
    // The real B&O API might have a different path and payload for this
    await beoApi.put(ip, 'BeoZone/Zone/Player/playMode', { mode });
}

    