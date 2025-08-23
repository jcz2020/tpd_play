
'use server';

/**
 * @fileoverview This script runs a standalone Express server that uses Bonjour/mDNS
 * to discover B&O devices on the local network. The main Next.js application
 * queries this service to get a list of discoverable devices. This is implemented
 * as a separate service because Bonjour discovery is a long-running process that
 * doesn't fit well within the Next.js request-response lifecycle.
 *
 * To run this service, use the command: `npm run discover`
 */

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

/**
 * Uses Bonjour to scan the local network for devices advertising the _beoremote._tcp service.
 * The scan runs for 10 seconds and caches the results.
 */
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

/**
 * API endpoint to retrieve the cached list of discovered devices.
 * If the cache is empty, it can trigger a new scan.
 */
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
