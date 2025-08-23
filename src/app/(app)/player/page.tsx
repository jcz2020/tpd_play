
"use client";
import { NowPlayingList } from "@/components/NowPlayingList";
import { PlaybackControls } from "@/components/PlaybackControls";

export default function PlayerPage() {
    return (
        <div className="flex h-full gap-8">
            <div className="w-1/3">
              <NowPlayingList />
            </div>
            <div className="w-2/3">
                <div className="flex items-center justify-center h-full">
                    <div className="w-full max-w-md">
                        <PlaybackControls />
                    </div>
                </div>
            </div>
        </div>
    );
}
