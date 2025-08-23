
"use server";

import type { Device, NewDevice, PlaybackState, PlayMode, Source, Track } from "./types";
import { getDb, saveDb } from "./db";
import { randomUUID } from "crypto";

// This is a mock API client. In a real application, this would be a proper
// library for interacting with the B&O API.
const beoApi = {
    get: async (ip: string, path: string) => {
      // In a real app, you'd add error handling, headers, etc.
      const url = `http://${ip}:8080/${path}`;
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          console.error(`API GET request to ${url} failed with status ${response.status}`);
          return {}; 
        }
        const data = await response.json();
        return data;
      } catch (e) {
        console.error(`API GET request to ${url} failed:`, e);
        return {};
      }
    },
    post: async (ip: string, path: string, body: any = {}) => {
      const url = `http://${ip}:8080/${path}`;
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
        if (!data || !data.sources) {
            console.warn(`No sources data received from ${ip}`);
            return [];
        }
        return Object.entries(data.sources).map(([id, source]: [string, any]) => ({
            id: source.id ?? id,
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

      // Check for empty or invalid responses
      if (Object.keys(streamData).length === 0 && Object.keys(volumeData).length === 0) {
        throw new Error("Failed to get any valid data from device.");
      }
      
      const apiTrack = streamData.track;
      let track: Track | null = null;
      if (apiTrack && apiTrack.title) {
        track = {
            id: apiTrack.id ?? randomUUID(),
            title: apiTrack.title,
            artist: apiTrack.artist ?? 'Unknown Artist',
            albumArtUrl: apiTrack.art?.url || 'https://placehold.co/300x300.png',
            duration: apiTrack.duration ?? 0,
        };
      }
      
      return {
        state: streamData.state ?? "stopped",
        progress: streamData.progress ?? 0,
        volume: volumeData.level ?? 50,
        source: streamData.source?.id ?? "local",
        playMode: streamData.playMode?.shuffle ? 'shuffle' : 'sequential',
        track: track,
      };
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

export async function setPlayMode(deviceId: string, ip: string, mode: PlayMode): Promise<void> {
    const shuffle = mode === 'shuffle';
    await beoApi.put(ip, 'BeoZone/Zone/Player/playQueue', { shuffle });
}
