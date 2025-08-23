
/**
 * @fileoverview This file provides simple utility functions for reading from and writing to
 * a local JSON file (`db.json`) that acts as a simple text-based database. This is used
 * for persisting application state like devices, playlists, etc., across server restarts.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Device, Playlist, MusicFolder, Track } from './types';

/**
 * Defines the structure of the data stored in the JSON database file.
 */
interface DbData {
    devices: Device[];
    playlists: Playlist[];
    musicFolders: MusicFolder[];
    tracks: Track[];
}

// Path to the JSON file that acts as our database
const dbPath = path.resolve(process.cwd(), 'src/lib/db.json');

/**
 * Ensures the database file exists at the specified path. If it doesn't,
 * it creates the file with a default, empty structure.
 */
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

/**
 * Reads the entire database from the JSON file.
 * It ensures the file exists and handles potential parsing errors.
 * @returns A promise that resolves to the database data.
 */
export async function getDb(): Promise<DbData> {
    await ensureDbFileExists();
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    try {
        const data = JSON.parse(fileContent);
        // Ensure all top-level keys exist to prevent runtime errors
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

/**
 * Writes the entire provided data object to the JSON database file.
 * @param data The data object to save.
 */
export async function saveDb(data: DbData): Promise<void> {
    await ensureDbFileExists();
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}
