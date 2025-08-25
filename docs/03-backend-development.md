# Backend Development Guide

This document outlines the server-side architecture of the Acoustic Harmony application.

## 1. Server Actions

The backend is built exclusively using **Next.js Server Actions**. There is no traditional REST or GraphQL API.

- **Location**: All server-side logic accessible by the client is located in **`src/lib/actions.ts`**.
- **`'use server';`**: This directive at the top of the file marks all exported functions as Server Actions. This allows them to be imported and called directly from client components.
- **Security**: Next.js automatically handles the security layer, ensuring that Server Actions are executed securely on the server, not in the client's browser. Data is serialized and deserialized automatically.

### Key Responsibilities of `actions.ts`

- **Device Communication**: Contains all logic for making HTTP requests to the B&O devices' local APIs (e.g., getting playback state, setting volume).
- **Database Operations**: Handles all reading from and writing to the `db.json` file via the `getDb` and `saveDb` utility functions.
- **Filesystem Operations**: Manages tasks like scanning music folders from the local filesystem.

When adding a new backend feature, you should almost always add a new exported `async` function to `src/lib/actions.ts`.

## 2. Database

The application uses a simple, file-based JSON database for persistence.

- **File**: `src/lib/db.json`
- **Purpose**: Stores application data that needs to persist between server restarts, such as:
  - The list of configured devices.
  - User-created playlists.
  - Paths to local music folders.
  - The cached list of discovered music tracks.
- **Utilities**: The `src/lib/db.ts` file contains two helper functions:
  - `getDb()`: Reads and parses the `db.json` file.
  - `saveDb(data)`: Stringifies and writes the provided data object back to the `db.json` file.

**Note**: This is a very basic database solution. For a production application with multiple users or more complex data needs, this should be replaced with a more robust database system like PostgreSQL, MySQL, or a cloud-based solution like Firestore.

## 3. Device Discovery Service

Because Bonjour/mDNS device discovery is a long-running, asynchronous process, it does not fit well within the standard request-response lifecycle of a web server. To solve this, a separate, standalone Node.js service is used.

- **File**: `src/lib/discovery-service.ts`
- **Purpose**: To continuously scan the local network for B&O devices advertising the `_beoremote._tcp` service.
- **Execution**: This service is **not** part of the main Next.js application. It must be run as a separate process using the command: `npm run discover`.
- **Communication**:
  1. The discovery service runs an Express server on `http://localhost:9003`.
  2. It has a single endpoint: `/discover`.
  3. When the main Next.js application needs to find devices (e.g., in the "Add Device" dialog), it makes an HTTP GET request to `http://localhost:9003/discover`.
  4. The discovery service returns a JSON array of the devices it has found so far.

This architecture decouples the long-running discovery process from the main web application, improving stability and performance.
