
"use server";

import type { Device, NewDevice, Source } from "./types";
import { getDb, saveDb } from "./db";
import { randomUUID } from "crypto";

export async function getDevices(): Promise<Device[]> {
  const db = await getDb();
  // Here you could add logic to check the online status of each device
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


// This function now attempts to connect to a local backend service
// that is responsible for scanning the local network for devices.
export async function discoverDevices(): Promise<Omit<Device, 'id' | 'online'>[]> {
  console.log("Attempting to scan for B&O devices via local discovery service...");
  try {
    // This endpoint should be provided by a local helper service/backend
    // running on the user's machine.
    const response = await fetch('http://localhost:9003/discover', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Local discovery service responded with status: ${response.status}`);
    }
    const devices = await response.json();
    console.log(`Discovered ${devices.length} devices.`);
    return devices;
  } catch (error) {
    console.error("Could not connect to or parse response from the local discovery service:", error);
    // Return an empty array or re-throw to be handled by the caller.
    // Returning empty array to allow the UI to show a "not found" message.
    return [];
  }
}


// This is a mock function. In a real application, this would make a GET request
// to the device's IP address: `http://${ip}/BeoZone/Zone/Sources`
export async function getAvailableSources(deviceId: string, ip: string): Promise<Source[]> {
    console.log(`Fetching available sources for device ${deviceId} at ${ip}...`);

    // In a real implementation, you would use fetch() to make a network request
    // to the B&O device's local IP address.
    // Example:
    // try {
    //   const response = await fetch(`http://${ip}/BeoZone/Zone/Sources`);
    //   if (!response.ok) {
    //     throw new Error('Failed to fetch sources from device');
    //   }
    //   const data = await response.json();
    //   // ... process and return the sources
    // } catch (error) {
    //   console.error(`Could not fetch sources for ${ip}:`, error);
    //   return [];
    // }


    // For now, we return a default list of common sources as a placeholder.
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockSources: Source[] = [
        { id: "local", name: "Local Library", type: 'local'},
        { id: "spotify", name: "Spotify", type: "spotify" },
        { id: "line-in", name: "Line-In", type: "line-in" },
        { id: "bluetooth", name: "Bluetooth", type: "bluetooth" },
        { id: "tidal", name: "Tidal", type: "tidal" },
        { id: "deezer", name: "Deezer", type: "deezer" },
    ];

    console.log(`Returning mock sources for device ${deviceId}.`);
    return mockSources;
}
