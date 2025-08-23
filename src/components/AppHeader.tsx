"use client";

import { Speaker } from "lucide-react";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";

export function AppHeader() {
  const { isMobile } = useSidebar();
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 backdrop-blur-sm sticky top-0 z-30">
        {isMobile && <SidebarTrigger />}
        <div className="flex items-center gap-2">
            <Speaker className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Acoustic Harmony</h1>
        </div>
    </header>
  );
}
