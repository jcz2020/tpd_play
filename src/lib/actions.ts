
"use server";

import type { Device, Source } from "./types";

// This is a mock function. In a real application, this would use a library 
// like 'node-ssdp' or a custom implementation to scan the local network
// for DLNA/UPnP devices and filter for B&O products.
export async function discoverDevices(): Promise<Device[]> {
  console.log("Simulating network scan for B&O devices...");

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate finding a few devices
  const mockDiscoveredDevices: Device[] = [
    {
      id: 'd-1',
      name: 'Beosound Stage',
      ip: '192.168.1.150',
      online: true
    },
    {
        id: 'd-2',
        name: 'Beoplay A9',
        ip: '192.168.1.152',
        online: true
    },
    {
        id: 'd-3',
        name: 'Beosound Emerge',
        ip: '192.168.1.145',
        online: true
    }
  ];

  console.log(`Discovered ${mockDiscoveredDevices.length} devices.`);
  
  // In a real scenario, you would probably want to filter out devices
  // that are already added to the user's list.
  return mockDiscoveredDevices;
}


// This is a mock function. In a real application, this would make a GET request
// to the device's IP address: `http://${ip}/BeoZone/Zone/Sources`
export async function getAvailableSources(deviceId: string, ip: string): Promise<Source[]> {
    console.log(`Fetching available sources for device ${deviceId} at ${ip}...`);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Based on the device, we can return different mock sources.
    // This simulates different devices having different capabilities.
    const mockSources: Source[] = [
        { id: "local", name: "Local Library", type: 'local'},
        { id: "spotify", name: "Spotify", type: "spotify" },
        { id: "line-in", name: "Line-In", type: "line-in" },
        { id: "bluetooth", name: "Bluetooth", type: "bluetooth" },
    ];

    if (deviceId.includes('2') || deviceId === 'd-1') { // Mock BeoPlay A9 or Stage having more sources
        mockSources.push({ id: "tidal", name: "Tidal", type: "tidal" });
        mockSources.push({ id: "deezer", name: "Deezer", type: "deezer" });
    }

    console.log(`Found ${mockSources.length} sources for device ${deviceId}.`);
    return mockSources;
}
