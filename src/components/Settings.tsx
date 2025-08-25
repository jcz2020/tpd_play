

"use client";

/**
 * @fileoverview This component renders the main settings page for the application.
 * Currently, its primary function is to manage the list of local music folders
 * that the backend will scan to build the music library. It also provides a
 * button to trigger the scan manually.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MusicFolder } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";
import * as React from "react";
import { Loader2, FolderSync, PlusCircle, Trash2, Home } from "lucide-react";
import { useAppContext } from "./AcousticHarmonyApp";
import { getUserHomeDir } from "@/lib/actions";

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

    const handleUseHomeDir = async (id: string) => {
        try {
            const homeDir = await getUserHomeDir();
            handleFolderChange(id, homeDir);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "无法获取主目录",
                description: "无法从服务器获取主目录路径。",
            });
        }
    }

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        handleMusicFoldersChange(localFolders.filter(f => f.path.trim() !== ''));
    }

    const handleScan = async () => {
        setIsScanning(true);
        toast({
            title: "正在扫描音乐文件夹...",
            description: "这可能需要一些时间，具体取决于音乐库的大小。",
        });
        
        const result = await handleScanMusicFolders();

        setIsScanning(false);
        toast({
            variant: result.success ? "default" : "destructive",
            title: result.success ? "扫描完成" : "扫描失败",
            description: result.message,
        });
    };

    return (
        <Card>
            <form onSubmit={handleSaveChanges}>
                <CardHeader>
                    <CardTitle>设置</CardTitle>
                    <CardDescription>
                        管理您的应用和设备设置。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-foreground">音乐库</h3>
                            <Button onClick={handleScan} disabled={isScanning} variant="outline" size="sm" type="button">
                                {isScanning ? <Loader2 className="animate-spin mr-2" /> : <FolderSync className="mr-2 h-4 w-4" />}
                                扫描全部
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>本地音乐文件夹</Label>
                            <p className="text-sm text-muted-foreground">
                                添加您本地音乐文件夹的绝对路径。应用需要对这些目录的读取权限。
                            </p>
                            <div className="space-y-2">
                                {localFolders.map((folder) => (
                                    <div key={folder.id} className="flex gap-2 items-center">
                                        <Input 
                                            placeholder="/path/to/your/music" 
                                            value={folder.path}
                                            onChange={(e) => handleFolderChange(folder.id, e.target.value)}
                                        />
                                        <Button onClick={() => handleUseHomeDir(folder.id)} variant="outline" size="icon" type="button" title="使用主目录">
                                            <Home className="h-4 w-4" />
                                            <span className="sr-only">使用主目录</span>
                                        </Button>
                                        <Button onClick={() => handleRemoveFolder(folder.id)} variant="ghost" size="icon" type="button">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">移除文件夹</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleAddFolder} variant="outline" size="sm" className="mt-2" type="button">
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                添加文件夹
                            </Button>
                        </div>
                    </div>

                    <Separator />
                    
                    <Button type="submit" className="w-full">保存设置</Button>
                </CardContent>
            </form>
        </Card>
    );
}
