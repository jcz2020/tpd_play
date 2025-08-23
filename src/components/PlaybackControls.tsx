
"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pause, Play, Rewind, FastForward, Volume2, VolumeX, Music, Disc, Bluetooth, AudioLines, Library, Radio, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "./AcousticHarmonyApp";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const sourceIcons: { [key: string]: React.ElementType } = {
    local: Library,
    spotify: Disc,
    tidal: Disc,
    deezer: Disc,
    dlna: Radio,
    bluetooth: Bluetooth,
    "line-in": AudioLines
}

export function PlaybackControls() {
  const { state, actions } = useAppContext();
  const { track, playbackState, availableSources } = state;
  const { handleTogglePlay: onTogglePlay, handleProgressChange: onProgressChange, handleVolumeChange: onVolumeChange, handleSourceChange } = actions;
  
  const device = state.devices.find(d => d.id === state.selectedDeviceId);

  const [isMuted, setIsMuted] = React.useState(false);
  const lastVolumeRef = React.useRef(playbackState.volume);

  const handleMuteToggle = () => {
    if (isMuted) {
        onVolumeChange([lastVolumeRef.current]);
        setIsMuted(false);
    } else {
        lastVolumeRef.current = playbackState.volume;
        onVolumeChange([0]);
        setIsMuted(true);
    }
  }

  React.useEffect(() => {
    setIsMuted(playbackState.volume === 0);
  }, [playbackState.volume])


  const isDeviceOnline = !!device?.online;
  const isLocalSource = playbackState.source === 'local';
  const trackDuration = isLocalSource ? (track?.duration ?? 0) : 0;
  const currentProgress = isLocalSource ? Math.min(playbackState.progress, trackDuration) : 0;
  
  const sourceInfo = availableSources.find(s => s.id === playbackState.source)
  const CurrentSourceIcon = sourceIcons[sourceInfo?.type ?? 'local'] || Music;

  return (
    <Card className={cn("border-none shadow-none bg-transparent w-full")}>
      <CardHeader className="text-center">
        <CardTitle>{device?.name ?? "No Device Selected"}</CardTitle>
        <CardDescription>
          {isDeviceOnline ? (track ? `Playing on ${device.ip}` : "Ready to play") : "Device is offline"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="relative w-full max-w-xs aspect-square group">
            {track?.albumArtUrl ? (
                <Image
                    src={track.albumArtUrl}
                    alt={track.title ?? ''}
                    fill
                    className={cn("rounded-lg object-cover shadow-lg transition-all", !isDeviceOnline && "grayscale")}
                    data-ai-hint="album cover"
                    unoptimized
                />
            ) : (
                <div className={cn("rounded-lg flex items-center justify-center bg-muted aspect-square shadow-lg", !isDeviceOnline && "grayscale")}>
                    <Music className="w-24 h-24 text-muted-foreground" />
                </div>
            )}
             {!isDeviceOnline && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
                    <WifiOff className="w-16 h-16 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground font-semibold">Offline</p>
                </div>
            )}
        </div>

        <div className="text-center w-full min-h-[4rem]">
          <h3 className="text-2xl font-semibold tracking-tight">{track?.title ?? "Nothing playing"}</h3>
          <p className="text-sm text-muted-foreground mt-1">{track?.artist ?? "—"}</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
            <div className="space-y-2">
                <div className="px-1">
                <Slider
                    value={[currentProgress]}
                    max={trackDuration}
                    step={1}
                    onValueChange={onProgressChange}
                    disabled={!isDeviceOnline || !track || !isLocalSource}
                    aria-label="Track progress"
                />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>{isLocalSource ? formatTime(currentProgress) : '--:--'}</span>
                    <span>{isLocalSource ? formatTime(trackDuration) : '--:--'}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-center space-x-2 w-full">
          <Button variant="ghost" size="icon" disabled={!isDeviceOnline || !track || !isLocalSource} className="w-12 h-12">
            <Rewind className="h-6 w-6" />
          </Button>
          <Button 
            size="lg" 
            className="rounded-full w-20 h-20 shadow-lg bg-primary hover:bg-primary/90 transition-all scale-100 hover:scale-105 active:scale-100" 
            onClick={onTogglePlay} 
            disabled={!isDeviceOnline || !track}
            aria-label={playbackState.isPlaying ? "Pause" : "Play"}
            >
            {playbackState.isPlaying ? <Pause className="h-8 w-8 fill-primary-foreground" /> : <Play className="h-8 w-8 fill-primary-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" disabled={!isDeviceOnline || !track || !isLocalSource} className="w-12 h-12">
            <FastForward className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex items-center space-x-3 w-full max-w-sm pt-4">
          <Button variant="ghost" size="icon" onClick={handleMuteToggle} disabled={!isDeviceOnline} className="text-muted-foreground hover:text-foreground">
            {playbackState.volume === 0 ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            value={[playbackState.volume]}
            max={100}
            step={1}
            onValueChange={onVolumeChange}
            disabled={!isDeviceOnline}
            aria-label="Volume control"
          />
        </div>

        <div className="w-full max-w-sm pt-4 space-y-2">
            <Label htmlFor="source-select" className="px-1 text-muted-foreground">Source</Label>
            <Select value={playbackState.source} onValueChange={handleSourceChange} disabled={!isDeviceOnline || availableSources.length === 0}>
                <SelectTrigger id="source-select" className="w-full">
                    <div className="flex items-center gap-2">
                        <CurrentSourceIcon className="h-4 w-4" />
                        <SelectValue placeholder="Select a source" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {availableSources.map((source) => {
                        const Icon = sourceIcons[source.type] || Music;
                        return (
                        <SelectItem key={source.id} value={source.id}>
                            <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span>{source.name}</span>
                            </div>
                        </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>
        
        <Separator className="my-6 w-full max-w-sm"/>

        <div className="space-y-4 w-full max-w-sm">
            <h3 className="font-medium text-foreground text-center">DLNA Services</h3>
            <div className="border rounded-lg p-4 min-h-[80px] bg-background/50 flex items-center justify-center">
                <p className="text-sm text-muted-foreground text-center">No DLNA devices found on the network yet. The backend service will need to be implemented to discover them.</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

    