# Frontend Development Guide

This document provides guidelines and an overview of the frontend architecture for developers working on the Acoustic Harmony application.

## 1. Core Principles

- **Component-Based**: The UI is built entirely from reusable React components.
- **Centralized State**: A single, top-level component (`AcousticHarmonyApp.tsx`) manages all application state and business logic.
- **Declarative UI**: Components receive state and action handlers as props and declaratively render the UI based on that state. They do not contain complex business logic themselves.

## 2. Component Structure

- **Pages (`src/app/(app)/*`)**: Each page component is simple. Its only job is to render the primary feature component for that route. For example, `src/app/(app)/player/page.tsx` renders the `<PlayerPage>` component.
- **Feature Components (`src/components/*.tsx`)**: These are the main components that compose a "page" or a major feature. Examples include `PlaybackControls`, `NowPlayingList`, and `Settings`. They are responsible for laying out the UI and connecting to the global state via the `useAppContext` hook.
- **UI Components (`src/components/ui/*.tsx`)**: These are the atomic building blocks from the [ShadCN UI](https://ui.shadcn.com/) library, such as `Button`, `Card`, `Dialog`, etc. They should remain generic and not contain any application-specific logic.

## 3. State Management

The application uses **React Context** for global state management.

- **`AcousticHarmonyApp.tsx`**: This is the most important component in the frontend. It acts as the "root" of the application's client-side logic.
  - It initializes and holds all application state (e.g., `devices`, `playbackState`, `playlists`).
  - It defines all action handlers (e.g., `handleTogglePlay`, `handleAddDevice`). These handlers are where client-side logic and calls to Server Actions happen.
  - It provides the `state` and `actions` to all child components via the `AppContext.Provider`.

- **`AppContext`**: This React Context object allows any component nested within `AcousticHarmonyApp` to access the global state and actions.

- **`useAppContext` Hook**: A custom hook that provides a convenient way for components to consume the `AppContext`.

**Example Workflow:**

1.  The `PlaybackControls` component needs to handle a volume change.
2.  It calls `const { actions } = useAppContext();` to get access to the action handlers.
3.  The volume slider's `onValueCommit` event calls `actions.handleVolumeChange(newVolume)`.
4.  The `handleVolumeChange` function (defined in `AcousticHarmonyApp.tsx`) optimistically updates the local state and then calls the `setVolume` Server Action to communicate the change to the device.

## 4. Styling

- **Tailwind CSS**: All styling is done using Tailwind CSS utility classes. Avoid writing custom CSS files where possible.
- **Theme**: Colors, fonts, and other design tokens are defined in `tailwind.config.ts` and `src/app/globals.css` using CSS variables. When styling, prefer using semantic color names like `bg-primary` or `text-muted-foreground` over hard-coded color values.
- **ShadCN UI**: When a new UI element is needed (e.g., a dropdown, a slider), first check if a suitable component exists in `src/components/ui`. Use and customize these components before creating a new one from scratch.
- **Icons**: The [Lucide React](https://lucide.dev/) library is used for icons.

## 5. Adding a New Feature

1.  **Define Types**: If the feature introduces new data, add the necessary type definitions to `src/lib/types.ts`.
2.  **Create Server Actions**: Add any required backend logic as new `async` functions in `src/lib/actions.ts`.
3.  **Update Global State**:
    - Add new state variables to the `AppState` interface and the `useState` hooks in `AcousticHarmonyApp.tsx`.
    - Add new action handlers to the `AppActions` type and implement them in `AcousticHarmonyApp.tsx`. These new handlers will call the Server Actions you just created.
4.  **Build Components**: Create the necessary feature and UI components for the new feature in the `src/components` directory.
5.  **Create Page**: Create a new page file in `src/app/(app)/` to render your new feature component.
6.  **Add Navigation**: Add a link to the new page in `src/components/AppNavigation.tsx`.
