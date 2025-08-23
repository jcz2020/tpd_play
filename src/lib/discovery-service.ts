
'use server';

import express from 'express';
import cors from 'cors';
import Bonjour from 'bonjour-service';
import type { RemoteInfo } from 'bonjour-service';
import type { Device } from './types';

const app = express();
const port = 9003;

app.use(cors());

// In-memory cache for discovered devices to avoid re-scanning on every request
let discoveredDevices: Device[] = [];
let isScanning = false;

const findBeoDevices = () => {
    if (isScanning) {
        console.log('Scan already in progress.');
        return;
    }

    console.log('Starting network scan for B&O devices...');
    isScanning = true;
    discoveredDevices = []; // Clear previous results

    const bonjour = new Bonjour();
    const browser = bonjour.find({ type: 'beoremote' }, (service: RemoteInfo) => {
        console.log('Found a device:', service.name, '@', service.addresses);
        if (service.fqdn && service.addresses) {
            const device: Device = {
                id: service.fqdn.replace(/\.$/, ''), // Use fully qualified domain name as unique ID
                name: service.name,
                ip: service.addresses.find(addr => addr.includes('.')) || service.addresses[0], // Prefer IPv4
                online: true,
            };
            // Avoid duplicates
            if (!discoveredDevices.find(d => d.id === device.id)) {
                discoveredDevices.push(device);
                console.log('Added device to list:', device);
            }
        }
    });

    // Stop scanning after a reasonable timeout
    setTimeout(() => {
        browser.stop();
        bonjour.destroy();
        isScanning = false;
        console.log(`Scan finished. Found ${discoveredDevices.length} devices.`);
    }, 10000); // Scan for 10 seconds
};

// Immediately start a scan on service startup
findBeoDevices();

app.get('/discover', (req, res) => {
    console.log('Received request on /discover endpoint.');
    // Optionally, trigger a new scan if the cache is old or empty
    if (!isScanning && discoveredDevices.length === 0) {
        console.log('Device cache is empty, triggering a new scan.');
        findBeoDevices();
    }
    res.json(discoveredDevices);
});

app.listen(port, () => {
    console.log(`Discovery service listening on http://localhost:${port}`);
    console.log('This service scans your local network to find B&O devices.');
});
