"use client";

import { Playlist } from "./Playlist";
import { useAppContext } from "./AcousticHarmonyApp";

export function MediaManagement() {
    const { state, actions } = useAppContext();
    
    return (
        <Playlist
            playlists={state.playlists}
            availableTracks={state.availableTracks}
            onSave={actions.handleSavePlaylist}
            onDelete={actions.handleDeletePlaylist}
        />
    )
}
