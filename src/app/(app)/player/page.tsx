"use client";
import { PlaybackControls } from "@/components/PlaybackControls";

export default function PlayerPage() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-md">
                <PlaybackControls />
            </div>
        </div>
    );
}
