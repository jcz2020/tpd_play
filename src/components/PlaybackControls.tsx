
"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pause, Play, Rewind, FastForward, Volume2, VolumeX, Music, Disc, Bluetooth, AudioLines, Library, Radio, WifiOff, Shuffle, Repeat, Repeat1 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "./AcousticHarmonyApp";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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
  const { handleTogglePlay, handleSeek, handleVolumeChange, handleSourceChange, handlePlayModeChange, handleNextTrack, handlePrevTrack } = actions;
  
  const device = state.devices.find(d => d.id === state.selectedDeviceId);

  const [isMuted, setIsMuted] = React.useState(false);
  const lastVolumeRef = React.useRef(playbackState.volume);

  const handleMuteToggle = () => {
    if (isMuted) {
        handleVolumeChange([lastVolumeRef.current]);
        setIsMuted(false);
    } else {
        lastVolumeRef.current = playbackState.volume;
        handleVolumeChange([0]);
        setIsMuted(true);
    }
  }

  React.useEffect(() => {
    setIsMuted(playbackState.volume === 0);
  }, [playbackState.volume])


  const isDeviceOnline = !!device?.online;
  const isLocalSource = playbackState.source === 'local';
  const trackDuration = track?.duration ?? 0;
  const currentProgress = Math.min(playbackState.progress, trackDuration);
  
  const sourceInfo = availableSources.find(s => s.id === playbackState.source)
  const CurrentSourceIcon = sourceIcons[sourceInfo?.type ?? 'local'] || Music;

  const PlayModeIcon = {
    'sequential': Repeat,
    'repeat-list': Repeat,
    'repeat-one': Repeat1,
    'shuffle': Shuffle,
  }[playbackState.playMode];

  const nextPlayMode = () => {
    const modes = ['sequential', 'repeat-list', 'repeat-one', 'shuffle'];
    const currentIndex = modes.indexOf(playbackState.playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    handlePlayModeChange(modes[nextIndex] as any);
  }
  
  const isPlaying = playbackState.state === 'playing';

  return (
    <TooltipProvider>
    <Card className={cn("border-none shadow-none bg-transparent w-full")}>
      <CardHeader className="text-center">
        <h2 className="text-xl font-semibold">{device?.name ?? "No Device Selected"}</h2>
        <p className="text-sm text-muted-foreground">
          {isDeviceOnline ? (track ? `Playing on ${device.ip}` : "Ready to play") : "Device is offline"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
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

        <div className="text-center w-full min-h-[4rem] pt-4">
          <h3 className="text-2xl font-semibold tracking-tight">{track?.title ?? "Nothing playing"}</h3>
          <p className="text-sm text-muted-foreground mt-1">{track?.artist ?? "—"}</p>
        </div>

        <div className="w-full max-w-sm space-y-2">
            <div className="px-1">
            <Slider
                value={[currentProgress]}
                max={trackDuration}
                step={1}
                onValueChange={handleSeek}
                disabled={!isDeviceOnline || !track || !isLocalSource}
                aria-label="Track progress"
            />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>{formatTime(currentProgress)}</span>
                <span>{formatTime(trackDuration)}</span>
            </div>
        </div>

        <div className="flex items-center justify-center space-x-2 w-full py-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!isDeviceOnline || !track || !isLocalSource} className="w-12 h-12 text-muted-foreground hover:text-foreground">
                        <Shuffle className={cn(playbackState.playMode === 'shuffle' && 'text-primary')} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Shuffle</p></TooltipContent>
            </Tooltip>

          <Button variant="ghost" size="icon" disabled={!isDeviceOnline || !track || !isLocalSource} className="w-12 h-12" onClick={handlePrevTrack}>
            <Rewind className="h-6 w-6" />
          </Button>
          <Button 
            size="lg" 
            className="rounded-full w-20 h-20 shadow-lg bg-primary hover:bg-primary/90 transition-all scale-100 hover:scale-105 active:scale-100" 
            onClick={handleTogglePlay} 
            disabled={!isDeviceOnline || !track}
            aria-label={isPlaying ? "Pause" : "Play"}
            >
            {isPlaying ? <Pause className="h-8 w-8 fill-primary-foreground" /> : <Play className="h-8 w-8 fill-primary-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" disabled={!isDeviceOnline || !track || !isLocalSource} className="w-12 h-12" onClick={handleNextTrack}>
            <FastForward className="h-6 w-6" />
          </Button>
          
          <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!isDeviceOnline || !track || !isLocalSource} className="w-12 h-12 text-muted-foreground hover:text-foreground" onClick={nextPlayMode}>
                         <PlayModeIcon className={cn((playbackState.playMode === 'repeat-list' || playbackState.playMode === 'repeat-one') && 'text-primary')} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{playbackState.playMode.replace('-', ' ')}</p></TooltipContent>
            </Tooltip>
        </div>

        <div className="flex items-center space-x-3 w-full max-w-sm pt-2">
          <Button variant="ghost" size="icon" onClick={handleMuteToggle} disabled={!isDeviceOnline} className="text-muted-foreground hover:text-foreground">
            {playbackState.volume === 0 ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            value={[playbackState.volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
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
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}

    