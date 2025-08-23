
import { promises as fs } from 'fs';
import path from 'path';
import type { Device, Playlist, MusicFolder, Track } from './types';

interface DbData {
    devices: Device[];
    playlists: Playlist[];
    musicFolders: MusicFolder[];
    tracks: Track[];
}

// Path to the JSON file that acts as our database
const dbPath = path.resolve(process.cwd(), 'src/lib/db.json');

// Ensure the database file exists
async function ensureDbFileExists() {
    try {
        await fs.access(dbPath);
    } catch (error) {
        // If the file doesn't exist, create it with a default structure
        const defaultDb: DbData = {
            devices: [],
            playlists: [],
            musicFolders: [],
            tracks: [],
        };
        await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2), 'utf-8');
    }
}

// Reads the entire database from the JSON file
export async function getDb(): Promise<DbData> {
    await ensureDbFileExists();
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    try {
        const data = JSON.parse(fileContent);
        // Ensure all top-level keys exist
        if (!data.tracks) data.tracks = [];
        if (!data.devices) data.devices = [];
        if (!data.playlists) data.playlists = [];
        if (!data.musicFolders) data.musicFolders = [];
        return data;
    } catch (e) {
        console.error("Error parsing db.json, returning default db.", e);
        return { devices: [], playlists: [], musicFolders: [], tracks: [] };
    }
}

// Writes the entire database to the JSON file
export async function saveDb(data: DbData): Promise<void> {
    await ensureDbFileExists();
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}
