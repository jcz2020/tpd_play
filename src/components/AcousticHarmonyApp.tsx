
"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DeviceList } from "@/components/DeviceList";
import type { Device, Schedule, Track, Playlist as PlaylistType, MusicFolder } from "@/lib/types";
import { Speaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "./AppHeader";
import { AppNavigation } from "./AppNavigation";
import { discoverDevices } from "@/lib/actions";

const MOCK_DEVICES: Device[] = [
    { id: '1', name: 'Living Room Speaker', ip: '192.168.1.100', online: true },
    { id: '2', name: 'Bedroom Speaker', ip: '192.168.1.101', online: false },
    { id: '3', name: 'Kitchen Speaker', ip: '192.168.1.102', online: true },
];

const MOCK_TRACKS: Track[] = [
    { id: 't1', title: 'Bohemian Rhapsody', artist: 'Queen', albumArtUrl: 'https://placehold.co/300x300.png', duration: 355 },
    { id: 't2', title: 'Stairway to Heaven', artist: 'Led Zeppelin', albumArtUrl: 'https://placehold.co/300x300.png', duration: 482 },
    { id: 't3', title: 'Hotel California', artist: 'Eagles', albumArtUrl: 'https://placehold.co/300x300.png', duration: 391 },
    { id: 't4', title: 'Smells Like Teen Spirit', artist: 'Nirvana', albumArtUrl: 'https://placehold.co/300x300.png', duration: 301 },
    { id: 't5', title: 'Billie Jean', artist: 'Michael Jackson', albumArtUrl: 'https://placehold.co/300x300.png', duration: 294 },
];


export interface AppState {
    devices: Device[];
    selectedDeviceId: string | null;
    schedules: Schedule[];
    track: Track | null;
    playlists: PlaylistType[];
    availableTracks: Track[];
    musicFolders: MusicFolder[];
    playbackState: {
        isPlaying: boolean;
        progress: number;
        volume: number;
    };
}

export type AppActions = {
    handleSelectDevice: (deviceId: string) => void;
    handleTogglePlay: () => void;
    handleProgressChange: (value: number[]) => void;
    handleVolumeChange: (value: number[]) => void;
    handleSaveSchedule: (schedule: Omit<Schedule, 'id'>) => void;
    handleDeleteSchedule: (scheduleId: string) => void;
    handleToggleSchedule: (scheduleId: string, enabled: boolean) => void;
    handleSavePlaylist: (playlist: PlaylistType) => void;
    handleDeletePlaylist: (playlistId: string) => void;
    handleMusicFoldersChange: (folders: MusicFolder[]) => void;
    handleAddDevice: (device: Omit<Device, 'id' | 'online'>) => void;
    handleDiscoverDevices: () => Promise<Device[]>;
};


export const AppContext = React.createContext<{ state: AppState, actions: AppActions } | null>(null);

export const useAppContext = () => {
    const context = React.useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};

export default function AcousticHarmonyApp({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = React.useState<Device[]>(MOCK_DEVICES);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | null>(MOCK_DEVICES[0]?.id ?? null);
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [track, setTrack] = React.useState<Track | null>(MOCK_TRACKS[0]);
  const [playlists, setPlaylists] = React.useState<PlaylistType[]>([]);
  const [availableTracks, setAvailableTracks] = React.useState<Track[]>(MOCK_TRACKS);
  const [musicFolders, setMusicFolders] = React.useState<MusicFolder[]>([ { id: '1', path: '/Users/me/Music' } ]);
  const [playbackState, setPlaybackState] = React.useState({
    isPlaying: false,
    progress: 60, 
    volume: 75,
  });

  const { toast } = useToast();

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  React.useEffect(() => {
    if (!selectedDevice || !selectedDevice.online) {
      return;
    }

    const abortController = new AbortController();
    const signal = abortController.signal;
    let isMounted = true;

    const fetchNotifications = async () => {
        while (isMounted) {
            try {
                // In a real app, you would use the device's IP. 
                // We will use a placeholder API for demonstration.
                // The B&O endpoint is /BeoNotify, but we use a mock service.
                const url = `https://jsonplaceholder.typicode.com/posts/${(Math.floor(Math.random() * 100) + 1)}?_=${Date.now()}`;
                
                const response = await fetch(url, { signal });
                
                if (!response.ok) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                await response.json();
                
                if (signal.aborted) break;

                // Simulate different notification types
                const randomNotificationType = Math.random();
                if (randomNotificationType < 0.33) {
                    // Simulate volume change
                    const newVolume = Math.floor(Math.random() * 101);
                    console.log('Received volume notification:', newVolume);
                    setPlaybackState(prev => ({ ...prev, volume: newVolume }));
                } else if (randomNotificationType < 0.66) {
                    // Simulate progress change
                    const newProgress = Math.floor(Math.random() * (track?.duration ?? 300));
                    const newIsPlaying = Math.random() > 0.5;
                    console.log('Received progress notification:', { progress: newProgress, isPlaying: newIsPlaying });
                    setPlaybackState(prev => ({ ...prev, progress: newProgress, isPlaying: newIsPlaying }));
                } else {
                    // Simulate track change
                    const newTrack = MOCK_TRACKS[Math.floor(Math.random() * MOCK_TRACKS.length)];
                    console.log('Received nowPlaying notification:', newTrack.title);
                    setTrack(newTrack);
                }


            } catch (error) {
                if (signal.aborted) {
                    console.log('Notification fetch aborted.');
                    break;
                }
                console.error("Notification stream error:", error);
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    };

    fetchNotifications();

    return () => {
        isMounted = false;
        abortController.abort("Component unmounted or dependency changed");
    };
}, [selectedDeviceId, selectedDevice, track?.duration]);


  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    const device = devices.find(d => d.id === deviceId);
    if (device && device.online) {
        // Reset state for new device
        setPlaybackState({ isPlaying: false, progress: 0, volume: 75 });
        setTrack(MOCK_TRACKS[0] ?? null);
    } else {
        setTrack(null);
    }
  };

  const handleTogglePlay = () => {
    if (!selectedDevice?.online) {
        toast({
            variant: "destructive",
            title: "Device Offline",
            description: `${selectedDevice?.name} is currently offline.`,
        });
        return;
    }
    setPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleProgressChange = (value: number[]) => {
    setPlaybackState(prev => ({ ...prev, progress: value[0] }));
  }

  const handleVolumeChange = (value: number[]) => {
    setPlaybackState(prev => ({ ...prev, volume: value[0] }));
  }

  const handleSaveSchedule = (schedule: Omit<Schedule, 'id'>) => {
    setSchedules(prev => [...prev, { ...schedule, id: Date.now().toString() }]);
    toast({
        title: "Schedule Saved",
        description: `Your new schedule for ${schedule.time} has been added.`,
    });
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    toast({
        title: "Schedule Deleted",
        description: "The schedule has been removed.",
    });
  };
  
  const handleToggleSchedule = (scheduleId: string, enabled: boolean) => {
    setSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, enabled } : s));
  };
  
  const handleSavePlaylist = (playlist: PlaylistType) => {
    setPlaylists(prev => {
        const existing = prev.find(p => p.id === playlist.id);
        if (existing) {
            return prev.map(p => p.id === playlist.id ? playlist : p);
        }
        return [...prev, playlist];
    });
    toast({
        title: "Playlist Saved",
        description: `Playlist "${playlist.name}" has been saved.`,
    });
  };

  const handleDeletePlaylist = (playlistId: string) => {
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      toast({
          title: "Playlist Deleted",
          description: "The playlist has been removed.",
      });
  };
  
  const handleMusicFoldersChange = (folders: MusicFolder[]) => {
    setMusicFolders(folders);
    toast({
        title: "Music Folders Updated",
        description: "Your music folder list has been saved.",
    });
  }

  const handleAddDevice = (device: Omit<Device, 'id' | 'online'>) => {
    const newDevice: Device = {
        ...device,
        id: Date.now().toString(),
        online: true, // Assume online when added
    };
    setDevices(prev => [...prev, newDevice]);
    setSelectedDeviceId(newDevice.id);
    toast({
        title: "Device Added",
        description: `${device.name} has been added to your devices.`,
    });
  };

  const handleDiscoverDevices = async () => {
    return await discoverDevices();
  }

  const state: AppState = {
    devices,
    selectedDeviceId,
    schedules,
    track,
    playlists,
    availableTracks,
    musicFolders,
    playbackState,
  };

  const actions: AppActions = {
    handleSelectDevice,
    handleTogglePlay,
    handleProgressChange,
    handleVolumeChange,
    handleSaveSchedule,
    handleDeleteSchedule,
    handleToggleSchedule,
    handleSavePlaylist,
    handleDeletePlaylist,
    handleMusicFoldersChange,
    handleAddDevice,
    handleDiscoverDevices
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      <Sidebar side="left" className="border-r" collapsible="icon">
        <SidebarHeader>
           <div className="flex items-center gap-2 p-2">
                <Speaker className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">Acoustic Harmony</span>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <DeviceList 
                devices={devices} 
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={handleSelectDevice}
            />
            <AppNavigation />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-screen flex-col">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
        </div>
      </SidebarInset>
    </AppContext.Provider>
  );
}
