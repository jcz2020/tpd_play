"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Device, MusicFolder } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";
import * as React from "react";
import { Loader2, FolderSync, PlusCircle, Trash2 } from "lucide-react";
import { useAppContext } from "./AcousticHarmonyApp";

export function Settings() {
    const { state, actions } = useAppContext();
    const { musicFolders, devices, selectedDeviceId } = state;
    const { handleMusicFoldersChange } = actions;
    const device = devices.find(d => d.id === selectedDeviceId);

    const { toast } = useToast();
    const [isScanning, setIsScanning] = React.useState(false);
    const [localFolders, setLocalFolders] = React.useState<MusicFolder[]>(musicFolders);

    React.useEffect(() => {
        setLocalFolders(musicFolders);
    }, [musicFolders]);

    const handleFolderChange = (id: string, path: string) => {
        setLocalFolders(prev => prev.map(f => f.id === id ? { ...f, path } : f));
    };

    const handleAddFolder = () => {
        setLocalFolders(prev => [...prev, { id: Date.now().toString(), path: '' }]);
    };

    const handleRemoveFolder = (id: string) => {
        setLocalFolders(prev => prev.filter(f => f.id !== id));
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        handleMusicFoldersChange(localFolders.filter(f => f.path.trim() !== ''));
    }

    const handleScan = () => {
        setIsScanning(true);
        toast({
            title: "Scanning all music folders",
            description: "This may take a few moments...",
        });
        // This is where you would call your backend to scan the folders.
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
            <form onSubmit={handleSaveChanges}>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>
                        Manage your application and device settings.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-foreground">Music Library</h3>
                            <Button onClick={handleScan} disabled={isScanning} variant="outline" size="sm">
                                {isScanning ? <Loader2 className="animate-spin mr-2" /> : <FolderSync className="mr-2" />}
                                Scan All
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>Local Music Folders</Label>
                            <div className="space-y-2">
                                {localFolders.map((folder) => (
                                    <div key={folder.id} className="flex gap-2">
                                        <Input 
                                            placeholder="/path/to/your/music" 
                                            value={folder.path}
                                            onChange={(e) => handleFolderChange(folder.id, e.target.value)}
                                        />
                                        <Button onClick={() => handleRemoveFolder(folder.id)} variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove folder</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleAddFolder} variant="outline" size="sm" className="mt-2">
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Add Folder
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {device ? (
                        <div className="space-y-4">
                            <h3 className="font-medium text-foreground">Device: {device.name}</h3>
                            <div className="space-y-2">
                                <Label htmlFor="device-ip">Device IP Address</Label>
                                <Input id="device-ip" defaultValue={device.ip} disabled />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-4">
                            Select a device to see its settings.
                        </div>
                    )}

                    <Button type="submit" className="w-full">Save Settings</Button>
                </CardContent>
            </form>
        </Card>
    );
}
