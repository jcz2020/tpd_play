
"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DeviceList } from "@/components/DeviceList";
import type { Device, Schedule, Track, Playlist as PlaylistType, MusicFolder, PlaybackState, Source, PlayMode } from "@/lib/types";
import { Speaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "./AppHeader";
import { AppNavigation } from "./AppNavigation";
import { discoverDevices, getAvailableSources } from "@/lib/actions";

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
    isPlaying: false,
    progress: 0,
    volume: 75,
    source: 'local',
    playMode: 'sequential',
  });
  const [isLoaded, setIsLoaded] = React.useState(false);


  const { toast } = useToast();

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  // Load state from localStorage on initial render
  React.useEffect(() => {
    try {
        const savedState = localStorage.getItem('acousticHarmonyState');
        if (savedState) {
            const { playbackState: savedPlayback, selectedPlaylistId: savedPlaylistId } = JSON.parse(savedState);
            if (savedPlayback) setPlaybackState(prev => ({ ...prev, ...savedPlayback }));
            if (savedPlaylistId) handleSelectPlaylist(savedPlaylistId, true);
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
                progress: playbackState.progress,
            },
            selectedPlaylistId: selectedPlaylistId,
        };
        localStorage.setItem('acousticHarmonyState', JSON.stringify(stateToSave));
    } catch (error) {
        console.error("Failed to save state to localStorage", error);
    }
}, [playbackState.volume, playbackState.source, playbackState.playMode, selectedPlaylistId, isLoaded, playbackState.progress]);


  React.useEffect(() => {
    if (!selectedDevice || !selectedDevice.online) {
      setAvailableSources([]);
      return;
    }

    const fetchSources = async () => {
      try {
        const sources = await getAvailableSources(selectedDevice.id, selectedDevice.ip);
        setAvailableSources(sources);
        if (!sources.find(s => s.id === playbackState.source)) {
            handleSourceChange(sources[0]?.id ?? 'local');
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Failed to get sources" });
        setAvailableSources([]);
      }
    };
    fetchSources();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedDeviceId, selectedDevice?.online]);

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    const device = devices.find(d => d.id === deviceId);
    if (device && device.online) {
        setPlaybackState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
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
    if (!track && nowPlaying.length > 0) {
        setTrack(nowPlaying[0]);
    }
    setPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleNextTrack = () => {
    if (!track || nowPlaying.length === 0) return;
    const currentIndex = nowPlaying.findIndex(t => t.id === track.id);
    let nextIndex;

    switch (playbackState.playMode) {
        case 'shuffle':
            nextIndex = Math.floor(Math.random() * nowPlaying.length);
            break;
        case 'repeat-one':
            nextIndex = currentIndex;
            break;
        case 'repeat-list':
            nextIndex = (currentIndex + 1) % nowPlaying.length;
            break;
        case 'sequential':
        default:
            nextIndex = currentIndex + 1;
            if (nextIndex >= nowPlaying.length) {
                setPlaybackState(prev => ({...prev, isPlaying: false}));
                return; // Stop at the end of the list
            }
            break;
    }
    setTrack(nowPlaying[nextIndex]);
    setPlaybackState(p => ({...p, progress: 0}));
  }

  const handlePrevTrack = () => {
      if (!track || nowPlaying.length === 0) return;
      const currentIndex = nowPlaying.findIndex(t => t.id === track.id);
      let prevIndex = (currentIndex - 1 + nowPlaying.length) % nowPlaying.length;
      if (playbackState.playMode === 'shuffle') {
        prevIndex = Math.floor(Math.random() * nowPlaying.length);
      }
      setTrack(nowPlaying[prevIndex]);
      setPlaybackState(p => ({...p, progress: 0}));
  }

  const handleProgressChange = (value: number[]) => {
    setPlaybackState(prev => ({ ...prev, progress: value[0] }));
  }

  const handleVolumeChange = (value: number[]) => {
    setPlaybackState(prev => ({ ...prev, volume: value[0] }));
  }

  const handleSourceChange = (source: string) => {
    setPlaybackState(prev => ({ ...prev, source, isPlaying: false, progress: 0 }));
    const sourceName = availableSources.find(s => s.id === source)?.name || source;
    toast({
        title: "Source Changed",
        description: `Switched to ${sourceName}.`,
    });

    if (source !== 'local') {
        setTrack({
            id: `ext-${source}`,
            title: `Playing from ${sourceName}`,
            artist: 'External Source',
            albumArtUrl: 'https://placehold.co/300x300.png',
            duration: 0,
        });
        setNowPlaying([]);
    } else {
        if(selectedPlaylistId) {
            handleSelectPlaylist(selectedPlaylistId);
        } else {
            setTrack(null);
            setNowPlaying([]);
        }
    }
  }

  const handlePlayModeChange = (mode: PlayMode) => {
    setPlaybackState(prev => ({ ...prev, playMode: mode }));
    toast({
        title: "Playback Mode Changed",
        description: `Mode set to ${mode.replace('-', ' ')}.`,
    })
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
            setPlaybackState(p => ({...p, isPlaying: !silent, progress: 0}));
        } else {
            setTrack(null);
            setPlaybackState(p => ({...p, isPlaying: false, progress: 0}));
        }
        if (!silent) {
            toast({ title: `Playlist "${playlist.name}" selected` });
        }
    }
  }

  const handleSelectTrack = (trackId: string) => {
    const selectedTrack = nowPlaying.find(t => t.id === trackId);
    if (selectedTrack) {
        setTrack(selectedTrack);
        setPlaybackState(p => ({...p, isPlaying: true, progress: 0}));
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

    // If the currently selected playlist was just updated, refresh the nowPlaying list
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

  const handleAddDevice = (device: Omit<Device, 'id' | 'online'>) => {
    const newDevice: Device = {
        ...device,
        id: Date.now().toString(),
        online: true, 
    };
    setDevices(prev => [...prev, newDevice]);
    setSelectedDeviceId(newDevice.id);
    toast({
        title: "Device Added",
        description: `${device.name} has been added to your devices.`,
    });
  };

  const handleDeleteDevice = (deviceId: string) => {
    const deletedDevice = devices.find(d => d.id === deviceId);
    if (!deletedDevice) return;

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
    handleProgressChange,
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
