
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MusicFolder } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";
import * as React from "react";
import { Loader2, FolderSync, PlusCircle, Trash2 } from "lucide-react";
import { useAppContext } from "./AcousticHarmonyApp";

export function Settings() {
    const { state, actions } = useAppContext();
    const { musicFolders } = state;
    const { handleMusicFoldersChange, handleScanMusicFolders } = actions;

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

    const handleScan = async () => {
        setIsScanning(true);
        toast({
            title: "Scanning music folders...",
            description: "This may take a few moments depending on the library size.",
        });
        
        const result = await handleScanMusicFolders();

        setIsScanning(false);
        toast({
            variant: result.success ? "default" : "destructive",
            title: result.success ? "Scan Complete" : "Scan Failed",
            description: result.message,
        });
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
                            <Button onClick={handleScan} disabled={isScanning} variant="outline" size="sm" type="button">
                                {isScanning ? <Loader2 className="animate-spin mr-2" /> : <FolderSync className="mr-2 h-4 w-4" />}
                                Scan All
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>Local Music Folders</Label>
                            <p className="text-sm text-muted-foreground">
                                Add the absolute paths to your local music folders. The app needs read access to these directories.
                            </p>
                            <div className="space-y-2">
                                {localFolders.map((folder) => (
                                    <div key={folder.id} className="flex gap-2">
                                        <Input 
                                            placeholder="/path/to/your/music" 
                                            value={folder.path}
                                            onChange={(e) => handleFolderChange(folder.id, e.target.value)}
                                        />
                                        <Button onClick={() => handleRemoveFolder(folder.id)} variant="ghost" size="icon" type="button">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove folder</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleAddFolder} variant="outline" size="sm" className="mt-2" type="button">
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Add Folder
                            </Button>
                        </div>
                    </div>

                    <Separator />
                    
                    <Button type="submit" className="w-full">Save Settings</Button>
                </CardContent>
            </form>
        </Card>
    );
}
