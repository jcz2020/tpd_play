"use client";

import type { Device } from "@/lib/types";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Speaker } from "lucide-react";

interface DeviceListProps {
  devices: Device[];
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string) => void;
}

export function DeviceList({ devices, selectedDeviceId, onSelectDevice }: DeviceListProps) {
  return (
    <div className="p-2">
        <SidebarMenu>
            {devices.map((device) => (
            <SidebarMenuItem key={device.id}>
                <SidebarMenuButton
                    onClick={() => onSelectDevice(device.id)}
                    isActive={selectedDeviceId === device.id}
                    tooltip={{ children: device.name, side: 'right', align: 'center' }}
                >
                    <div className="flex items-center gap-3 w-full">
                        <Speaker />
                        <span className="truncate flex-1">{device.name}</span>
                        <div className={`h-2.5 w-2.5 rounded-full ${device.online ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
            ))}
        </SidebarMenu>
    </div>
  );
}
