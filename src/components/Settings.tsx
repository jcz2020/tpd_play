"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Device } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface SettingsProps {
    device?: Device;
}

export function Settings({ device }: SettingsProps) {
    const { toast } = useToast();

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Saved",
            description: `Settings for ${device?.name} have been updated.`,
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Device Settings</CardTitle>
                <CardDescription>
                    Configure playback settings for the selected device.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {device ? (
                     <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="device-ip">Device IP Address</Label>
                            <Input id="device-ip" defaultValue={device.ip} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dlna-source">DLNA Source</Label>
                            <Input id="dlna-source" placeholder="dlna://..." defaultValue="dlna://192.168.1.100:8200" />
                        </div>
                        <Button type="submit" className="w-full">Save Settings</Button>
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
