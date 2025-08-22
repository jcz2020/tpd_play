"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Device } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";
import { useState } from "react";
import { Loader2, FolderScan } from "lucide-react";

interface SettingsProps {
    device?: Device;
}

export function Settings({ device }: SettingsProps) {
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Saved",
            description: `Settings for ${device?.name} have been updated.`,
        });
    }

    const handleScan = () => {
        setIsScanning(true);
        toast({
            title: "Scanning folder",
            description: "This may take a few moments...",
        });
        // This is where you would call your backend to scan the folder.
        // For now, we'll just simulate it.
        setTimeout(() => {
            setIsScanning(false);
            toast({
                title: "Scan Complete",
                description: "Found 150 new tracks.",
            });
        }, 3000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                    Manage your application and device settings.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Music Library</h3>
                    <div className="space-y-2">
                        <Label htmlFor="music-folder">Local Music Folder</Label>
                        <div className="flex gap-2">
                            <Input id="music-folder" placeholder="/path/to/your/music" />
                            <Button onClick={handleScan} disabled={isScanning} variant="outline" size="icon">
                                {isScanning ? <Loader2 className="animate-spin" /> : <FolderScan />}
                                <span className="sr-only">Scan Folder</span>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter the absolute path to your music folder and scan for tracks.
                        </p>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <h3 className="font-medium text-foreground">DLNA Services</h3>
                     <div className="space-y-2">
                        <Label>Discovered Devices</Label>
                        <div className="border rounded-md p-3 min-h-[80px] bg-muted/50">
                            <p className="text-sm text-muted-foreground">No DLNA devices found on the network yet. The backend service will need to be implemented to discover them.</p>
                        </div>
                    </div>
                </div>
                
                <Separator />
                
                {device ? (
                     <form onSubmit={handleSave} className="space-y-4">
                        <h3 className="font-medium text-foreground">Device: {device.name}</h3>
                        <div className="space-y-2">
                            <Label htmlFor="device-ip">Device IP Address</Label>
                            <Input id="device-ip" defaultValue={device.ip} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dlna-source">DLNA Source</Label>
                            <Input id="dlna-source" placeholder="dlna://..." defaultValue="dlna://192.168.1.100:8200" />
                        </div>
                        <Button type="submit" className="w-full">Save Device Settings</Button>
                    </form>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        Select a device to see its settings.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
