

"use server";

import type { Device, NewDevice, PlaybackState, PlayMode, Source, Track, MusicFolder, PlayState } from "./types";
import { getDb, saveDb } from "./db";
import { randomUUID } from "crypto";
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import musicMetadata from 'music-metadata';


const beoApi = {
    get: async (ip: string, path: string) => {
      const url = `http://${ip}:8080/${path}`;
      console.log(`BEO_API GET: ${url}`);
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          console.error(`API GET request to ${url} failed with status ${response.status}`);
          return {}; 
        }
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

async function checkDeviceOnline(ip: string): Promise<boolean> {
    try {
        const res = await fetch(`http://${ip}:8080/BeoDevice`, { cache: 'no-store', signal: AbortSignal.timeout(1000) });
        return res.ok;
    } catch {
        return false;
    }
}

export async function getDevices(): Promise<Device[]> {
  const db = await getDb();
  const devicesWithOnlineStatus = await Promise.all(db.devices.map(async (d) => {
    const isOnline = await checkDeviceOnline(d.ip);
    return { ...d, online: isOnline };
  }));
  return devicesWithOnlineStatus;
}

export async function addDevice(device: NewDevice): Promise<Device> {
    const db = await getDb();
    const existingDevice = db.devices.find(d => d.ip === device.ip);
    if (existingDevice) {
        const isOnline = await checkDeviceOnline(existingDevice.ip);
        return { ...existingDevice, online: isOnline };
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
    return [];
  }
}

export async function getAvailableSources(deviceId: string, ip: string): Promise<Source[]> {
    console.log(`Fetching available sources for device ${deviceId} at ${ip}...`);
    try {
        const data = await beoApi.get(ip, 'BeoZone/Zone/Sources');
        if (!data || !data.sources) {
            console.warn(`No sources data received from ${ip}`);
            return [];
        }
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
      const [streamData, volumeData] = await Promise.all([
        beoApi.get(ip, 'BeoZone/Zone/Stream'),
        beoApi.get(ip, 'BeoDevice/settings/volume')
      ]);

      const apiTrack = streamData?.track;
      let track: Track | null = null;

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
    await beoApi.post(ip, 'BeoZone/Zone/ActiveSource', { id: sourceId });
}

export async function setPlayMode(deviceId: string, ip: string, mode: PlayMode): Promise<void> {
    const shuffle = mode === 'shuffle';
    await beoApi.put(ip, 'BeoZone/Zone/Player/playQueue', { shuffle });
}

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
        return { success: true, message: "未配置音乐文件夹。", count: 0 };
    }

    const allTracks: Track[] = [];
    const supportedExtensions = ['.mp3', '.flac', '.wav', '.m4a'];
    let filesScanned = 0;
    let metadataErrors = 0;

    for (const folder of folders) {
        if (!folder.path) continue;
        try {
            const dirents = await fs.readdir(folder.path, { withFileTypes: true, recursive: true });
            for (const dirent of dirents) {
                const filePath = path.join(folder.path, dirent.name);
                if (dirent.isFile() && supportedExtensions.includes(path.extname(dirent.name).toLowerCase())) {
                    filesScanned++;
                    try {
                        const metadata = await musicMetadata.parseFile(filePath);
                        const track: Track = {
                            id: `local-${randomUUID()}`,
                            title: metadata.common.title ?? path.basename(filePath),
                            artist: metadata.common.artist ?? '未知艺术家',
                            albumArtUrl: 'https://placehold.co/300x300.png', 
                            duration: metadata.format.duration ?? 0,
                            path: filePath,
                        };
                        allTracks.push(track);
                    } catch (metaError) {
                        console.warn(`无法解析文件元数据: ${filePath}`, metaError);
                        metadataErrors++;
                    }
                }
            }
        } catch (readError) {
            console.error(`无法读取目录 ${folder.path}:`, readError);
            return { success: false, message: `读取文件夹失败: ${folder.path}。请检查路径和权限。`, count: 0 };
        }
    }

    db.tracks = allTracks;
    await saveDb(db);
    
    let message = `扫描完成。共找到 ${allTracks.length} 首曲目。`;
    if (metadataErrors > 0) {
        message += ` 有 ${metadataErrors} 个文件元数据解析失败。`;
    }

    console.log(message);
    return { success: true, message, count: allTracks.length };
}


export async function getUserHomeDir(): Promise<string> {
    return os.homedir();
}
