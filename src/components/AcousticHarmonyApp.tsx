
"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DeviceList } from "@/components/DeviceList";
import type { Device, Schedule, Track, Playlist as PlaylistType, MusicFolder, PlaybackState, Source, PlayMode, NewDevice } from "@/lib/types";
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
} from "@/lib/actions";

export interface AppState {
    devices: Device[];
    selectedDeviceId: string | null;
    schedules: Schedule[];
    track: Track | null;
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
  const [track, setTrack] = React.useState<Track | null>(null);
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
        const initialDevices = await getDevices();
        setDevices(initialDevices);
        if (initialDevices.length > 0) {
            const savedState = localStorage.getItem('acousticHarmonyState');
            if (savedState) {
                const { selectedDeviceId: savedDeviceId } = JSON.parse(savedState);
                if (savedDeviceId && initialDevices.find(d => d.id === savedDeviceId)) {
                    setSelectedDeviceId(savedDeviceId);
                    return;
                }
            }
            setSelectedDeviceId(initialDevices[0].id);
        }
    }
    loadInitialData();
  }, [])

  // Load state from localStorage on initial render
  React.useEffect(() => {
    try {
        const savedState = localStorage.getItem('acousticHarmonyState');
        if (savedState) {
            const { playbackState: savedPlayback, selectedPlaylistId: savedPlaylistId, selectedDeviceId: savedDeviceId } = JSON.parse(savedState);
            if (savedPlayback) setPlaybackState(prev => ({ ...prev, ...savedPlayback }));
            if (savedPlaylistId) handleSelectPlaylist(savedPlaylistId, true);
            if (savedDeviceId) setSelectedDeviceId(savedDeviceId);
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

  // Fetch available sources when device changes
  React.useEffect(() => {
    if (!selectedDevice || !selectedDevice.online) {
      setAvailableSources([]);
      return;
    }

    const fetchSources = async () => {
      try {
        const sources = await getAvailableSources(selectedDevice.id, selectedDevice.ip);
        setAvailableSources(sources);
        
        const isCurrentSourceValid = sources.some(s => s.id === playbackState.source);
        
        if (!isCurrentSourceValid && sources.length > 0) {
            handleSourceChange(sources[0].id);
        } else if (!isCurrentSourceValid) {
            handleSourceChange('local');
        }

      } catch (error) {
        toast({ variant: "destructive", title: "Failed to get sources" });
        setAvailableSources([]);
      }
    };
    fetchSources();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice]);

  // Poll for playback state
  React.useEffect(() => {
    const pollPlaybackState = async () => {
        if (selectedDevice?.online) {
            try {
                const state = await getPlaybackState(selectedDevice.id, selectedDevice.ip);
                setPlaybackState(state);
                setTrack(state.track);
            } catch (error) {
                console.error("Failed to poll playback state", error);
            }
        }
    };

    const intervalId = setInterval(pollPlaybackState, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [selectedDevice]);


  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setPlaybackState({
        state: "stopped",
        progress: 0,
        volume: 50,
        source: 'local',
        playMode: 'sequential',
        track: null,
    });
    setTrack(null);
  };

  const handleTogglePlay = async () => {
    if (!selectedDevice?.online) return;
    const newState = playbackState.state === 'playing' ? 'paused' : 'playing';
    try {
        await setDevicePlaybackState(selectedDevice.id, selectedDevice.ip, newState);
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
    if (!selectedDevice?.online || !track) return;
    const newProgress = value[0];
    setPlaybackState(prev => ({ ...prev, progress: newProgress }));
    try {
        await seekTo(selectedDevice.id, selectedDevice.ip, newProgress);
    } catch (error) {
        toast({ variant: "destructive", title: "Seek failed" });
    }
  }

  const handleVolumeChange = async (value: number[]) => {
    if (!selectedDevice?.online) return;
    const newVolume = value[0];
    setPlaybackState(prev => ({ ...prev, volume: newVolume }));
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
        setPlaybackState(prev => ({ ...prev, source }));
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to change source" });
    }
  }

  const handlePlayModeChange = async (mode: PlayMode) => {
    if (!selectedDevice) return;
    try {
        await setDevicePlayMode(selectedDevice.id, selectedDevice.ip, mode);
        setPlaybackState(prev => ({ ...prev, playMode: mode }));
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
            setTrack(tracksInPlaylist[0]);
            // In a real app, you would now tell the device to play this playlist
        } else {
            setTrack(null);
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
        setTrack(selectedTrack);
        setPlaybackState(p => ({...p, state: 'playing', progress: 0}));
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
        setTrack(null);
      }
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
  }

  const state: AppState = {
    devices,
    selectedDeviceId,
    schedules,
    track,
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

    