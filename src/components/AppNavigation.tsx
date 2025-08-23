"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";
import { Music, ListMusic, Library, Settings, CalendarClock } from "lucide-react";

const NAV_ITEMS = [
    { href: "/player", label: "Player", icon: Music },
    { href: "/media", label: "Media", icon: ListMusic },
    { href: "/library", label: "Music Library", icon: Library },
    { href: "/schedules", label: "Schedules", icon: CalendarClock },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNavigation() {
    const pathname = usePathname();

    return (
        <div className="p-2">
            <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref legacyBehavior>
                            <SidebarMenuButton
                                isActive={pathname.startsWith(item.href)}
                                tooltip={{ children: item.label, side: 'right', align: 'center' }}
                            >
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </div>
    );
}
