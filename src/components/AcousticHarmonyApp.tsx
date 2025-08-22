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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Device, Schedule, Track } from "@/lib/types";
import { Speaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialDevices: Device[] = [
  { id: "1", name: "B&O A9 Gen 2 (Living Room)", ip: "192.168.1.10", online: true },
  { id: "2", name: "Beosound Level (Kitchen)", ip: "192.168.1.12", online: true },
  { id: "3", name: "Beosound Emerge (Office)", ip: "192.168.1.15", online: false },
  { id: "4", name: "Beoplay A1 (Patio)", ip: "192.168.1.20", online: true },
];

const initialSchedules: Schedule[] = [
    { id: '1', deviceId: '1', time: '07:00', action: 'on', playlist: 'Morning Jazz', enabled: true },
    { id: '2', deviceId: '1', time: '23:00', action: 'off', playlist: '', enabled: true },
    { id: '3', deviceId: '2', time: '18:00', action: 'on', playlist: 'Dinner Party Mix', enabled: false },
];

const initialTrack: Track = {
  title: "Horizon's Whisper",
  artist: "AuraPulse",
  albumArtUrl: "https://placehold.co/300x300.png",
  duration: 245,
};

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
  const [devices, setDevices] = React.useState<Device[]>(initialDevices);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | null>(initialDevices.find(d => d.online)?.id ?? null);
  const [schedules, setSchedules] = React.useState<Schedule[]>(initialSchedules);
  const [track, setTrack] = React.useState<Track>(initialTrack);
  const [playbackState, setPlaybackState] = React.useState({
    isPlaying: false,
    progress: 60, // in seconds
    volume: 75,
  });

  const { toast } = useToast();

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
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
                    <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                        <TabsTrigger value="player">Player</TabsTrigger>
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
                                <Settings device={selectedDevice}/>
                            </div>
                        </div>
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
