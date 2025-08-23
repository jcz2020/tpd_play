"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Playlist } from "./Playlist";
import { MusicLibrary } from "./MusicLibrary";
import type { Playlist as PlaylistType, Track } from "@/lib/types";

interface MediaManagementProps {
    playlists: PlaylistType[];
    availableTracks: Track[];
    onSavePlaylist: (playlist: PlaylistType) => void;
    onDeletePlaylist: (playlistId: string) => void;
}

export function MediaManagement({ playlists, availableTracks, onSavePlaylist, onDeletePlaylist }: MediaManagementProps) {
    return (
        <Tabs defaultValue="playlists" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
                <TabsTrigger value="library">Music Library</TabsTrigger>
            </TabsList>
            <TabsContent value="playlists" className="mt-6">
                <Playlist
                    playlists={playlists}
                    availableTracks={availableTracks}
                    onSave={onSavePlaylist}
                    onDelete={onDeletePlaylist}
                />
            </TabsContent>
            <TabsContent value="library" className="mt-6">
                <MusicLibrary tracks={availableTracks} />
            </TabsContent>
        </Tabs>
    )
}
