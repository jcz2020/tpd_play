
"use client"

import * as React from "react";
import { useAppContext } from "./AcousticHarmonyApp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Music } from "lucide-react";

export function NowPlayingList() {
    const { state, actions } = useAppContext();
    const { nowPlaying, playlists, selectedPlaylistId, playbackState } = state;
    const { handleSelectPlaylist, handleSelectTrack } = actions;

    const isLocalSource = playbackState.source === 'local';

    if (!isLocalSource) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Now Playing</CardTitle>
                    <CardDescription>External source selected. Playlist unavailable.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-5/6 text-muted-foreground">
                    <Music className="w-16 h-16 mb-4" />
                    <p>Select 'Local Library' as the source to view playlists.</p>
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Now Playing</CardTitle>
                <CardDescription>Select a playlist to begin.</CardDescription>
                <div className="pt-4">
                    <Select onValueChange={handleSelectPlaylist} value={selectedPlaylistId ?? ""}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a playlist..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Playlists</SelectLabel>
                                {playlists.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                                {playlists.length === 0 && <p className="text-xs text-muted-foreground p-2">No playlists created yet.</p>}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-2 pr-4">
                        {nowPlaying.map((t) => (
                            <div 
                                key={t.id} 
                                className={cn(
                                    "flex items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-muted",
                                    t.id === playbackState.track?.id && "bg-primary/20 hover:bg-primary/30"
                                )}
                                onClick={() => handleSelectTrack(t.id)}
                            >
                                <Image 
                                    src={t.albumArtUrl} 
                                    alt={t.title} 
                                    width={40} 
                                    height={40} 
                                    className="rounded"
                                    unoptimized
                                />
                                <div className="flex-1 truncate">
                                    <p className={cn("font-medium", t.id === playbackState.track?.id && "text-primary-foreground")}>{t.title}</p>
                                    <p className="text-sm text-muted-foreground">{t.artist}</p>
                                </div>
                            </div>
                        ))}
                         {nowPlaying.length === 0 && selectedPlaylistId && (
                            <div className="text-center text-muted-foreground py-8">
                                This playlist is empty. Add tracks in the Media tab.
                            </div>
                        )}
                        {nowPlaying.length === 0 && !selectedPlaylistId && (
                            <div className="text-center text-muted-foreground py-8">
                                Please select a playlist above.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
