
"use client";

/**
 * @fileoverview This component defines a dialog for adding new devices.
 * It provides two methods for adding a device: automatic discovery via network
 * scanning and manual entry of the device's name and IP address.
 */

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useAppContext } from "./AcousticHarmonyApp";
import type { NewDevice } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal } from "lucide-react";


const manualAddSchema = z.object({
    name: z.string().min(1, "Device name is required."),
    ip: z.string().ip({ message: "Please enter a valid IP address." }),
});

type ManualAddFormValues = z.infer<typeof manualAddSchema>;

export function AddDeviceDialog({ children }: { children: React.ReactNode }) {
    const { actions } = useAppContext();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [isScanning, setIsScanning] = React.useState(false);
    const [scanError, setScanError] = React.useState<string | null>(null);
    const [isConnectionError, setIsConnectionError] = React.useState(false);
    const [discoveredDevices, setDiscoveredDevices] = React.useState<NewDevice[]>([]);

    const form = useForm<ManualAddFormValues>({
        resolver: zodResolver(manualAddSchema),
        defaultValues: {
            name: "",
            ip: "",
        },
    });

    const handleScan = async () => {
        setIsScanning(true);
        setScanError(null);
        setIsConnectionError(false);
        setDiscoveredDevices([]);
        try {
            const foundDevices = await actions.handleDiscoverDevices();
            if (foundDevices.length === 0) {
                setScanError("No new devices found. Ensure they are on the same network and the local discovery service is running.");
            }
            setDiscoveredDevices(foundDevices);
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || "An unknown error occurred.";
            if (errorMessage.includes('ECONNREFUSED') || errorMessage.toLowerCase().includes('failed to fetch')) {
                setScanError("Failed to connect to the discovery service.");
                setIsConnectionError(true);
            } else {
                setScanError(errorMessage);
            }
        } finally {
            setIsScanning(false);
        }
    };

    const handleAddFromDiscovery = (device: NewDevice) => {
        actions.handleAddDevice({ name: device.name, ip: device.ip });
        // Optimistically remove from discovered list
        setDiscoveredDevices(prev => prev.filter(d => d.ip !== device.ip));
        // Close dialog if it was the last one
        if (discoveredDevices.length === 1) {
            setOpen(false);
        }
    }
    
    const onManualSubmit = (data: ManualAddFormValues) => {
        actions.handleAddDevice(data);
        form.reset();
        setOpen(false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            // Automatically scan when dialog opens
            handleScan();
        } else {
            // Reset state when closing
            setIsScanning(false);
            setDiscoveredDevices([]);
            setScanError(null);
            setIsConnectionError(false);
            form.reset();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Device</DialogTitle>
                    <DialogDescription>
                        Scan your network for B&O devices or add one manually.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="discover">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="discover">Discover</TabsTrigger>
                        <TabsTrigger value="manual">Manual</TabsTrigger>
                    </TabsList>
                    <TabsContent value="discover" className="mt-4">
                        <div className="space-y-4">
                            <Button onClick={handleScan} disabled={isScanning} className="w-full">
                                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isScanning ? "Scanning..." : "Scan Again"}
                            </Button>
                            {isConnectionError && (
                                <Alert variant="destructive">
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>Connection Error</AlertTitle>
                                    <AlertDescription>
                                        Could not connect to the discovery service. Please ensure it's running in a separate terminal with the command:
                                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold mt-2 block">
                                            npm run discover
                                        </code>
                                    </AlertDescription>
                                </Alert>
                            )}
                            <ScrollArea className="h-60 rounded-md border">
                                <div className="p-4">
                                {isScanning && discoveredDevices.length === 0 && (
                                    <div className="flex justify-center items-center h-full">
                                        <p className="text-muted-foreground">Searching for devices...</p>
                                    </div>
                                )}
                                {!isScanning && discoveredDevices.length === 0 && (
                                    <div className="flex justify-center items-center h-full text-center">
                                        <p className="text-sm text-muted-foreground p-4">
                                            {scanError && !isConnectionError ? scanError : 'No new devices found. Try scanning again.'}
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                {discoveredDevices.map((device, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                        <div>
                                            <p className="font-medium">{device.name}</p>
                                            <p className="text-sm text-muted-foreground">{device.ip}</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => handleAddFromDiscovery(device)}>
                                            <Plus className="mr-2 h-4 w-4" /> Add
                                        </Button>
                                    </div>
                                ))}
                                </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </TabsContent>
                    <TabsContent value="manual" className="mt-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onManualSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Device Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Living Room Speaker" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="ip"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IP Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., 192.168.1.100" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit">Add Device</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
