# Project Architecture

This document provides a high-level overview of the technical architecture of the Acoustic Harmony application.

## 1. Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Backend Logic**: Next.js Server Actions
- **Device Discovery**: [Bonjour/mDNS](https://github.com/bonjour-js/bonjour-service) via a separate Node.js service.

## 2. Directory Structure

The project follows a standard Next.js App Router structure. Here are the key directories and their purposes:

- **`/src/app`**: Contains all pages and layouts of the application.
  - **`/(app)`**: This is a route group that contains all the main application pages that share a common layout (`src/app/(app)/layout.tsx`). This layout includes the main sidebar and header.
  - **`/api`**: Contains API Route Handlers, specifically for the long-polling notification endpoint.
- **`/src/components`**: Contains all reusable React components.
  - **`/ui`**: Houses the ShadCN UI components. These are generally considered atomic and application-agnostic.
  - **App-specific components**: Components like `DeviceList.tsx`, `PlaybackControls.tsx`, etc., are at the root of `/src/components`. They are composed of smaller UI components and contain application-specific logic.
- **`/src/lib`**: Contains server-side logic, type definitions, and utility functions.
  - **`actions.ts`**: The core of the backend. It uses Server Actions to expose server-side logic securely to the client. All communication with devices and the database happens here.
  - **`db.ts` & `db.json`**: A simple file-based database for persisting application state (devices, playlists, etc.).
  - **`discovery-service.ts`**: A standalone Node.js server for discovering B&O devices on the network.
  - **`types.ts`**: A single source of truth for all TypeScript types used across the application.
- **`/public`**: For static assets like images or fonts.
- **`/docs`**: Contains all project documentation files in Markdown format.

## 3. Data Flow

1.  **Client (React Components)**: A user interacts with a component (e.g., clicks the "Play" button).
2.  **State Management (`AcousticHarmonyApp.tsx`)**: The component calls an action handler provided by the `AppContext`.
3.  **Server Action (`actions.ts`)**: The action handler in `AcousticHarmonyApp.tsx` calls the corresponding Server Action from `src/lib/actions.ts`.
4.  **Backend Logic**: The Server Action executes the required logic:
    - It might call the B&O device's HTTP API.
    - It might read from or write to the `db.json` file.
5.  **Response**: The Server Action returns a result (or an error) to the client.
6.  **State Update**: The client-side action handler receives the result and updates the global state in `AcousticHarmonyApp.tsx`.
7.  **UI Re-render**: React re-renders any components whose props have changed as a result of the state update.

## 4. Real-time Updates (Notifications)

Real-time updates for playback state (volume, progress, etc.) are handled via a long-polling mechanism:

1.  The `AcousticHarmonyApp` component initiates a `fetch` request to the Next.js API route at `/api/notifications/[ip]`.
2.  This API route acts as a proxy and establishes a long-polling connection to the B&O device's `/BeoNotify/Notifications` endpoint.
3.  When the device sends a notification, the API route receives it and sends it back as the response to the client's `fetch` request.
4.  The client receives the notification data, updates the global state, and immediately initiates a new long-polling request to wait for the next event.
5.  This loop continues as long as a device is selected, providing near real-time state synchronization.
