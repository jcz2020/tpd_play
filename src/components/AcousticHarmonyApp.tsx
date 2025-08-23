
"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { DeviceList } from "@/components/DeviceList";
import { PlaybackControls } from "@/components/PlaybackControls";
import { Scheduling } from "@/components/Scheduling";
import { Settings } from "@/components/Settings";
import { MediaManagement } from "@/components/MediaManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Device, Schedule, Track, Playlist as PlaylistType, MusicFolder } from "@/lib/types";
import { Speaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

function AppHeader() {
  const { isMobile } = useSidebar();
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 backdrop-blur-sm sticky top-0 z-30">
        {isMobile && <SidebarTrigger />}
        <div className="flex items-center gap-2">
            <Speaker className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Acoustic Harmony</h1>
        </div>
    </header>
  );
}

export default function AcousticHarmonyApp() {
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


  return (
    <SidebarProvider>
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
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-screen flex-col">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <Tabs defaultValue="player" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
                        <TabsTrigger value="player">Player</TabsTrigger>
                        <TabsTrigger value="media">Media Management</TabsTrigger>
                        <TabsTrigger value="schedules">Schedules</TabsTrigger>
                    </TabsList>
                    <TabsContent value="player" className="mt-6">
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <PlaybackControls 
                                    device={selectedDevice}
                                    track={track}
                                    playbackState={playbackState}
                                    onTogglePlay={handleTogglePlay}
                                    onProgressChange={handleProgressChange}
                                    onVolumeChange={handleVolumeChange}
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <Settings 
                                    device={selectedDevice}
                                    musicFolders={musicFolders}
                                    onMusicFoldersChange={handleMusicFoldersChange}
                                />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="media" className="mt-6">
                        <MediaManagement
                            playlists={playlists}
                            availableTracks={availableTracks}
                            onSavePlaylist={handleSavePlaylist}
                            onDeletePlaylist={handleDeletePlaylist}
                        />
                    </TabsContent>
                    <TabsContent value="schedules" className="mt-6">
                        <Scheduling
                            schedules={schedules}
                            devices={devices}
                            onSave={handleSaveSchedule}
                            onDelete={handleDeleteSchedule}
                            onToggle={handleToggleSchedule}
                        />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
