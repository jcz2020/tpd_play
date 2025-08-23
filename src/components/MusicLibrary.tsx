
"use client"

/**
 * @fileoverview This component displays the user's entire music library in a searchable,
 * sortable table. It shows tracks that have been discovered by the backend scanning
 * process from the folders specified in the Settings.
 */

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useAppContext } from "./AcousticHarmonyApp";

/**
 * Formats a duration from seconds into a "m:ss" string.
 * @param seconds The duration in seconds.
 * @returns The formatted time string.
 */
function formatTime(seconds: number) {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function MusicLibrary() {
    const { state } = useAppContext();
    const { availableTracks: tracks } = state;
    const [searchTerm, setSearchTerm] = useState("");
    
    const filteredTracks = tracks.filter(track => 
        track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Music Library</CardTitle>
                <CardDescription>
                    Browse all available tracks from your local folders. Found {tracks.length} tracks.
                </CardDescription>
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by title or artist..." 
                        className="pl-8 w-full max-w-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Artwork</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Artist</TableHead>
                            <TableHead className="text-right">Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTracks.map((track) => (
                            <TableRow key={track.id}>
                                <TableCell>
                                    <Image 
                                        src={track.albumArtUrl}
                                        alt={track.title}
                                        width={40}
                                        height={40}
                                        className="rounded-md"
                                        unoptimized
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{track.title}</TableCell>
                                <TableCell>{track.artist}</TableCell>
                                <TableCell className="text-right">{formatTime(track.duration)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {tracks.length > 0 && filteredTracks.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No tracks found for your search.
                    </div>
                )}
                 {tracks.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No tracks in the library. Go to Settings to scan your music folders.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
