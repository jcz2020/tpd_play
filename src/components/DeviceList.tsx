
"use client";

/**
 * @fileoverview This component renders the list of available devices in the sidebar.
 * It allows users to select a device to control, add new devices via a dialog,
 * and delete existing devices.
 */

import type { Device } from "@/lib/types";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from "@/components/ui/sidebar";
import { Speaker, PlusCircle, MoreVertical, Trash2 } from "lucide-react";
import { AddDeviceDialog } from "./AddDeviceDialog";
import { Separator } from "./ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAppContext } from "./AcousticHarmonyApp";

interface DeviceListProps {
  devices: Device[];
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string) => void;
}

export function DeviceList({ devices, selectedDeviceId, onSelectDevice }: DeviceListProps) {
  const { actions } = useAppContext();
  
  const handleDelete = (e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();
    actions.handleDeleteDevice(deviceId);
  }

  return (
    <div className="p-2 flex flex-col h-full">
        <div className="flex-1">
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuAction showOnHover>
                                <MoreVertical />
                            </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                            <DropdownMenuItem onClick={(e) => handleDelete(e, device.id)} className="text-destructive">
                                <Trash2 />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </div>
        <Separator className="my-2" />
        <div className="mt-auto">
            <AddDeviceDialog>
                <SidebarMenuButton
                    className="w-full justify-start"
                    tooltip={{ children: "Add a new device", side: 'right', align: 'center' }}
                >
                    <PlusCircle />
                    <span>Add Device</span>
                </SidebarMenuButton>
            </AddDeviceDialog>
        </div>
    </div>
  );
}
