
"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DeviceList } from "@/components/DeviceList";
import type { Device, Schedule, Track, Playlist as PlaylistType, MusicFolder, PlaybackState, Source, PlayMode, NewDevice, PlayState } from "@/lib/types";
import { Speaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "./AppHeader";
import { AppNavigation } from "./AppNavigation";
import { 
    discoverDevices, 
    getAvailableSources, 
    getDevices, 
    addDevice, 
    deleteDevice,
    getPlaybackState,
    setPlaybackState as setDevicePlaybackState,
    seekTo,
    setVolume as setDeviceVolume,
    nextTrack,
    previousTrack,
    setPlayMode as setDevicePlayMode,
    changeSource,
    getMusicFolders,
    saveMusicFolders,
    getAvailableTracks,
    scanMusicFolders as scanDeviceMusicFolders
} from "@/lib/actions";

export interface AppState {
    devices: Device[];
    selectedDeviceId: string | null;
    schedules: Schedule[];
    playlists: PlaylistType[];
    nowPlaying: Track[];
    selectedPlaylistId: string | null;
    availableTracks: Track[];
    availableSources: Source[];
    musicFolders: MusicFolder[];
    playbackState: PlaybackState;
}

export type AppActions = {
    handleSelectDevice: (deviceId: string) => void;
    handleTogglePlay: () => void;
    handleNextTrack: () => void;
    handlePrevTrack: () => void;
    handleSeek: (value: number[]) => void;
    handleVolumeChange: (value: number[]) => void;
    handleSaveSchedule: (schedule: Omit<Schedule, 'id'>) => void;
    handleDeleteSchedule: (scheduleId: string) => void;
    handleToggleSchedule: (scheduleId: string, enabled: boolean) => void;
    handleSavePlaylist: (playlist: PlaylistType) => void;
    handleDeletePlaylist: (playlistId: string) => void;
    handleMusicFoldersChange: (folders: MusicFolder[]) => void;
    handleAddDevice: (device: NewDevice) => void;
    handleDiscoverDevices: () => Promise<Omit<Device, 'id' | 'online'>[]>;
    handleDeleteDevice: (deviceId: string) => void;
    handleSourceChange: (source: string) => void;
    handlePlayModeChange: (mode: PlayMode) => void;
    handleSelectPlaylist: (playlistId: string) => void;
    handleSelectTrack: (trackId: string) => void;
    handleScanMusicFolders: () => Promise<{ success: boolean, message: string, count: number }>;
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
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | null>(null);
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [playlists, setPlaylists] = React.useState<PlaylistType[]>([]);
  const [nowPlaying, setNowPlaying] = React.useState<Track[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = React.useState<string | null>(null);
  const [availableTracks, setAvailableTracks] = React.useState<Track[]>([]);
  const [availableSources, setAvailableSources] = React.useState<Source[]>([]);
  const [musicFolders, setMusicFolders] = React.useState<MusicFolder[]>([]);
  const [playbackState, setPlaybackState] = React.useState<PlaybackState>({
    state: "stopped",
    progress: 0,
    volume: 50,
    source: 'local',
    playMode: 'sequential',
    track: null,
  });
  const [isLoaded, setIsLoaded] = React.useState(false);

  const { toast } = useToast();

  const selectedDevice = React.useMemo(() => devices.find(d => d.id === selectedDeviceId), [devices, selectedDeviceId]);

  // Initial data loading
  React.useEffect(() => {
    const loadInitialData = async () => {
        const [
            initialDevices, 
            initialMusicFolders,
            initialTracks,
        ] = await Promise.all([
            getDevices(),
            getMusicFolders(),
            getAvailableTracks(),
        ]);
        
        setDevices(initialDevices);
        setMusicFolders(initialMusicFolders);
        setAvailableTracks(initialTracks);

        if (initialDevices.length > 0) {
            const savedState = localStorage.getItem('acousticHarmonyState');
            let deviceToSelect = initialDevices[0].id;
            if (savedState) {
                const { selectedDeviceId: savedDeviceId } = JSON.parse(savedState);
                if (savedDeviceId && initialDevices.find(d => d.id === savedDeviceId)) {
                    deviceToSelect = savedDeviceId;
                }
            }
            // We call handleSelectDevice to ensure all state is correctly initialized
            handleSelectDevice(deviceToSelect);
        }
    }
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load state from localStorage on initial render
  React.useEffect(() => {
    try {
        const savedState = localStorage.getItem('acousticHarmonyState');
        if (savedState) {
            const { playbackState: savedPlayback, selectedPlaylistId: savedPlaylistId, selectedDeviceId: savedDeviceId } = JSON.parse(savedState);
            if (savedPlayback) setPlaybackState(prev => ({ ...prev, ...savedPlayback }));
            if (savedPlaylistId) handleSelectPlaylist(savedPlaylistId, true);
            // Device selection is handled in the initial data loading effect
        }
    } catch (error) {
        console.error("Failed to load state from localStorage", error);
    }
    setIsLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state to localStorage whenever it changes
  React.useEffect(() => {
      if (!isLoaded) return;
      try {
          const stateToSave = {
              playbackState: {
                  volume: playbackState.volume,
                  source: playbackState.source,
                  playMode: playbackState.playMode,
              },
              selectedPlaylistId,
              selectedDeviceId,
          };
          localStorage.setItem('acousticHarmonyState', JSON.stringify(stateToSave));
      } catch (error) {
          console.error("Failed to save state to localStorage", error);
      }
  }, [playbackState.volume, playbackState.source, playbackState.playMode, selectedPlaylistId, selectedDeviceId, isLoaded]);

  // Fetch initial state and available sources when device changes
  React.useEffect(() => {
    if (!selectedDevice || !selectedDevice.online) {
      setAvailableSources([]);
      return;
    }

    const fetchInitialDataForDevice = async () => {
      try {
        // Get the full initial state first
        const initialState = await getPlaybackState(selectedDevice.id, selectedDevice.ip);
        setPlaybackState(initialState);

        // Then fetch available sources
        const sources = await getAvailableSources(selectedDevice.id, selectedDevice.ip);
        setAvailableSources(sources);
        
        // Ensure the current source is valid
        const isCurrentSourceValid = sources.some(s => s.id === initialState.source);
        if (!isCurrentSourceValid && sources.length > 0) {
            handleSourceChange(sources[0].id);
        } else if (!isCurrentSourceValid) {
            handleSourceChange('local');
        }

      } catch (error) {
        toast({ variant: "destructive", title: "Failed to get device info" });
        setAvailableSources([]);
        setPlaybackState({
            state: "stopped", progress: 0, volume: 50, source: 'local', playMode: 'sequential', track: null
        });
      }
    };
    
    fetchInitialDataForDevice();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice]);

  // Long-polling for real-time notifications
  React.useEffect(() => {
    if (!selectedDevice || !selectedDevice.online) {
        return;
    }

    const abortController = new AbortController();
    const signal = abortController.signal;

    const listenForNotifications = async () => {
        console.log(`Starting notification listener for ${selectedDevice.name}...`);
        while (!signal.aborted) {
            try {
                const response = await fetch(`/api/notifications/${selectedDevice.ip}`, { signal });

                if (!response.ok) {
                    if (signal.aborted) break;
                    console.error(`Notification request failed with status ${response.status}. Retrying in 5s.`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                const notification = await response.json();
                
                // Process the notification and update state
                if (notification.type === 'VOLUME') {
                    setPlaybackState(prev => ({...prev, volume: notification.data.speaker.level}));
                }
                if (notification.type === 'PROGRESS_INFORMATION') {
                    const apiTrack = notification.data.track;
                    let track: Track | null = null;
                    if (apiTrack && apiTrack.title) {
                        track = {
                            id: apiTrack.id ?? randomUUID(),
                            title: apiTrack.title,
                            artist: apiTrack.artist ?? 'Unknown Artist',
                            albumArtUrl: apiTrack.art?.url || 'https://placehold.co/300x300.png',
                            duration: apiTrack.duration ?? 0,
                            path: apiTrack.path ?? '',
                        };
                    }

                    setPlaybackState(prev => ({
                        ...prev, 
                        progress: notification.data.progress,
                        state: notification.data.state as PlayState,
                        track: track, // Update track directly from notification
                    }));
                }
                if (notification.type === 'SOURCE') {
                    setPlaybackState(prev => ({...prev, source: notification.data.primarySource.id}));
                }
                if (notification.type === 'PLAY_STATE') {
                    setPlaybackState(prev => ({
                        ...prev,
                        state: notification.data.state as PlayState,
                        playMode: notification.data.playQueue.shuffle ? 'shuffle' : 'sequential', // This might need adjustment
                    }));
                }

            } catch (error) {
                if (!signal.aborted) {
                    console.error("Error in notification listener:", error);
                    // Wait before retrying to avoid spamming requests on persistent failure
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }
        console.log(`Notification listener for ${selectedDevice.name} stopped.`);
    };

    listenForNotifications();

    return () => {
        console.log(`Aborting notification listener for ${selectedDevice.name}.`);
        abortController.abort();
    };
  }, [selectedDevice]);


  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    // Reset state for the new device, will be populated by effects
    setPlaybackState({
        state: "stopped", progress: 0, volume: 50, source: 'local', playMode: 'sequential', track: null,
    });
    setAvailableSources([]);
  };

  const handleTogglePlay = async () => {
    if (!selectedDevice?.online) return;
    const newState = playbackState.state === 'playing' ? 'paused' : 'playing';
    try {
        await setDevicePlaybackState(selectedDevice.id, selectedDevice.ip, newState);
        // The state will be updated by the notification listener, but we can do an optimistic update for responsiveness
        setPlaybackState(prev => ({...prev, state: newState}));
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to toggle play state" });
    }
  };

  const handleNextTrack = async () => {
    if (!selectedDevice?.online) return;
    try {
        await nextTrack(selectedDevice.id, selectedDevice.ip);
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to skip to next track" });
    }
  }

  const handlePrevTrack = async () => {
    if (!selectedDevice?.online) return;
    try {
        await previousTrack(selectedDevice.id, selectedDevice.ip);
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to go to previous track" });
    }
  }

  const handleSeek = async (value: number[]) => {
    if (!selectedDevice?.online || !playbackState.track) return;
    const newProgress = value[0];
    setPlaybackState(prev => ({ ...prev, progress: newProgress })); // Optimistic update
    try {
        await seekTo(selectedDevice.id, selectedDevice.ip, newProgress);
    } catch (error) {
        toast({ variant: "destructive", title: "Seek failed" });
    }
  }

  const handleVolumeChange = async (value: number[]) => {
    if (!selectedDevice?.online) return;
    const newVolume = value[0];
    setPlaybackState(prev => ({ ...prev, volume: newVolume })); // Optimistic update
    try {
        await setDeviceVolume(selectedDevice.id, selectedDevice.ip, newVolume);
    } catch (error) {
        // Don't toast on volume change to avoid being spammy
        console.error("Failed to set volume", error);
    }
  }

  const handleSourceChange = async (source: string) => {
    if (!selectedDevice) return;
    try {
        await changeSource(selectedDevice.id, selectedDevice.ip, source);
        setPlaybackState(prev => ({ ...prev, source, track: null, progress: 0 })); // Optimistic update & reset track
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to change source" });
    }
  }

  const handlePlayModeChange = async (mode: PlayMode) => {
    if (!selectedDevice) return;
    try {
        await setDevicePlayMode(selectedDevice.id, selectedDevice.ip, mode);
        setPlaybackState(prev => ({ ...prev, playMode: mode })); // Optimistic update
        toast({
            title: "Playback Mode Changed",
            description: `Mode set to ${mode.replace('-', ' ')}.`,
        })
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to set play mode" });
    }
  }

  const handleSelectPlaylist = (playlistId: string, silent = false) => {
    setSelectedPlaylistId(playlistId);
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
        const tracksInPlaylist = playlist.trackIds.map(trackId => 
            availableTracks.find(t => t.id === trackId)
        ).filter((t): t is Track => !!t);
        setNowPlaying(tracksInPlaylist);
        if (tracksInPlaylist.length > 0) {
            // In a real app, you would now tell the device to play this playlist
            setPlaybackState(prev => ({...prev, track: tracksInPlaylist[0]}));
        } else {
            setPlaybackState(prev => ({...prev, track: null}));
        }
        if (!silent) {
            toast({ title: `Playlist "${playlist.name}" selected` });
        }
    }
  }

  const handleSelectTrack = (trackId: string) => {
    if (!selectedDevice) return;
    const selectedTrack = nowPlaying.find(t => t.id === trackId);
    if (selectedTrack) {
        // Here you would tell the device to play this specific track from the current queue
        setPlaybackState(p => ({...p, track: selectedTrack, state: 'playing', progress: 0}));
    }
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
    let newPlaylists;
    const existing = playlists.find(p => p.id === playlist.id);
    if (existing) {
        newPlaylists = playlists.map(p => p.id === playlist.id ? playlist : p);
    } else {
        newPlaylists = [...playlists, playlist];
    }
    setPlaylists(newPlaylists);

    if (selectedPlaylistId === playlist.id) {
        const tracksInPlaylist = playlist.trackIds.map(trackId => 
            availableTracks.find(t => t.id === trackId)
        ).filter((t): t is Track => !!t);
        setNowPlaying(tracksInPlaylist);
    }

    toast({
        title: "Playlist Saved",
        description: `Playlist "${playlist.name}" has been saved.`,
    });
  };

  const handleDeletePlaylist = (playlistId: string) => {
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(null);
        setNowPlaying([]);
        setPlaybackState(prev => ({...prev, track: null}));
      }
      toast({
          title: "Playlist Deleted",
          description: "The playlist has been removed.",
      });
  };
  
  const handleMusicFoldersChange = async (folders: MusicFolder[]) => {
    await saveMusicFolders(folders);
    setMusicFolders(folders);
    toast({
        title: "Music Folders Updated",
        description: "Your music folder list has been saved.",
    });
  }

  const handleAddDevice = async (device: NewDevice) => {
    const newDevice = await addDevice(device);
    setDevices(prev => [...prev, newDevice]);
    setSelectedDeviceId(newDevice.id);
    toast({
        title: "Device Added",
        description: `${device.name} has been added to your devices.`,
    });
  };

  const handleDeleteDevice = async (deviceId: string) => {
    const deletedDevice = devices.find(d => d.id === deviceId);
    if (!deletedDevice) return;

    const result = await deleteDevice(deviceId);

    if (result.success) {
        setDevices(prev => {
            const newDevices = prev.filter(d => d.id !== deviceId);
            if (selectedDeviceId === deviceId) {
                setSelectedDeviceId(newDevices[0]?.id ?? null);
            }
            return newDevices;
        });

        toast({
            title: "Device Removed",
            description: `${deletedDevice.name} has been removed.`,
        });
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to remove ${deletedDevice.name}.`,
        });
    }
  };

  const handleDiscoverDevices = async () => {
    return await discoverDevices();
  };

  const handleScanMusicFolders = async () => {
    const result = await scanDeviceMusicFolders();
    if (result.success) {
        // Re-fetch tracks to update the UI
        const tracks = await getAvailableTracks();
        setAvailableTracks(tracks);
    }
    return result;
  }

  const state: AppState = {
    devices,
    selectedDeviceId,
    schedules,
    playlists,
    nowPlaying,
    selectedPlaylistId,
    availableTracks,
    availableSources,
    musicFolders,
    playbackState,
  };

  const actions: AppActions = {
    handleSelectDevice,
    handleTogglePlay,
    handleNextTrack,
    handlePrevTrack,
    handleSeek,
    handleVolumeChange,
    handleSaveSchedule,
    handleDeleteSchedule,
    handleToggleSchedule,
    handleSavePlaylist,
    handleDeletePlaylist,
    handleMusicFoldersChange,
    handleAddDevice,
    handleDiscoverDevices,
    handleDeleteDevice,
    handleSourceChange,
    handlePlayModeChange,
    handleSelectPlaylist,
    handleSelectTrack,
    handleScanMusicFolders,
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
