"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Pause, Play, Rewind, FastForward, Volume2, VolumeX, Music } from "lucide-react";
import type { Device, Track } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlaybackControlsProps {
  device?: Device;
  track: Track | null;
  playbackState: {
    isPlaying: boolean;
    progress: number;
    volume: number;
  };
  onTogglePlay: () => void;
  onProgressChange: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function PlaybackControls({
  device,
  track,
  playbackState,
  onTogglePlay,
  onProgressChange,
  onVolumeChange
}: PlaybackControlsProps) {

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
  const trackDuration = track?.duration ?? 0;

  return (
    <Card className={cn(!isDeviceOnline && "bg-muted/50")}>
      <CardHeader>
        <CardTitle>{device?.name ?? "No Device Selected"}</CardTitle>
        <CardDescription>
          {isDeviceOnline ? (track ? `Now playing on ${device.ip}` : "Ready to play") : "Device is offline"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="relative w-full max-w-xs aspect-square">
            {track?.albumArtUrl ? (
                <Image
                    src={track.albumArtUrl}
                    alt={track.title}
                    fill
                    className={cn("rounded-lg object-cover shadow-lg", !isDeviceOnline && "grayscale")}
                    data-ai-hint="album cover"
                />
            ) : (
                <div className={cn("rounded-lg flex items-center justify-center bg-muted", !isDeviceOnline && "grayscale")}>
                    <Music className="w-24 h-24 text-muted-foreground" />
                </div>
            )}
        </div>

        <div className="text-center w-full min-h-[48px]">
          <h3 className="text-2xl font-semibold tracking-tight">{track?.title ?? "Nothing playing"}</h3>
          <p className="text-muted-foreground">{track?.artist ?? "—"}</p>
        </div>

        <div className="w-full space-y-2">
          <Slider
            value={[playbackState.progress]}
            max={trackDuration}
            step={1}
            onValueChange={onProgressChange}
            disabled={!isDeviceOnline || !track}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(playbackState.progress)}</span>
            <span>{formatTime(trackDuration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4 w-full">
          <Button variant="ghost" size="icon" disabled={!isDeviceOnline || !track}>
            <Rewind className="h-6 w-6" />
          </Button>
          <Button size="lg" className="rounded-full w-16 h-16" onClick={onTogglePlay} disabled={!isDeviceOnline || !track}>
            {playbackState.isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
          </Button>
          <Button variant="ghost" size="icon" disabled={!isDeviceOnline || !track}>
            <FastForward className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 w-full max-w-xs">
          <Button variant="ghost" size="icon" onClick={handleMuteToggle} disabled={!isDeviceOnline}>
            {playbackState.volume === 0 ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            value={[playbackState.volume]}
            max={100}
            step={1}
            onValueChange={onVolumeChange}
            disabled={!isDeviceOnline}
          />
        </div>
      </CardContent>
    </Card>
  );
}
