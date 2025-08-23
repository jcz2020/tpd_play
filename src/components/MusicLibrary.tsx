"use client"

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
import { PlusCircle, Search } from "lucide-react";
import type { Track } from "@/lib/types";
import { useState } from "react";
import Image from "next/image";

interface MusicLibraryProps {
    tracks: Track[];
}

function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function MusicLibrary({ tracks }: MusicLibraryProps) {
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
                            <TableHead>Duration</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                                <TableCell>{formatTime(track.duration)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <PlusCircle className="h-4 w-4" />
                                        <span className="sr-only">Add to playlist</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filteredTracks.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No tracks found{searchTerm ? ' for your search' : ''}.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
