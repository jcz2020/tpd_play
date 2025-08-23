"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, Music } from "lucide-react";
import type { Playlist as PlaylistType, Track } from "@/lib/types";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";

interface PlaylistProps {
    playlists: PlaylistType[];
    availableTracks: Track[];
    onSave: (playlist: PlaylistType) => void;
    onDelete: (playlistId: string) => void;
}

const playlistSchema = z.object({
    name: z.string().min(1, "Playlist name is required."),
    trackIds: z.array(z.string()).min(1, "Please select at least one track."),
});

type PlaylistFormValues = z.infer<typeof playlistSchema>;

export function Playlist({ playlists, availableTracks, onSave, onDelete }: PlaylistProps) {
    const [open, setOpen] = React.useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = React.useState<PlaylistType | null>(null);

    const form = useForm<PlaylistFormValues>({
        resolver: zodResolver(playlistSchema),
        defaultValues: {
            name: "",
            trackIds: [],
        },
    });

    React.useEffect(() => {
        if (selectedPlaylist) {
            form.reset({
                name: selectedPlaylist.name,
                trackIds: selectedPlaylist.trackIds,
            });
        } else {
            form.reset({
                name: "",
                trackIds: [],
            });
        }
    }, [selectedPlaylist, form]);

    const handleOpenDialog = (playlist: PlaylistType | null = null) => {
        setSelectedPlaylist(playlist);
        setOpen(true);
    };

    const onSubmit = (data: PlaylistFormValues) => {
        const playlistData: PlaylistType = {
            id: selectedPlaylist?.id || Date.now().toString(),
            name: data.name,
            trackIds: data.trackIds,
        };
        onSave(playlistData);
        form.reset();
        setOpen(false);
        setSelectedPlaylist(null);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Playlists</CardTitle>
                    <CardDescription>
                        Create and manage your music playlists.
                    </CardDescription>
                </div>
                <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setSelectedPlaylist(null); }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            New Playlist
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{selectedPlaylist ? "Edit" : "Create"} Playlist</DialogTitle>
                            <DialogDescription>
                                {selectedPlaylist ? "Modify your playlist below." : "Build a new playlist from your available tracks."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Playlist Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Chill Vibes" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="trackIds"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Tracks</FormLabel>
                                            <ScrollArea className="h-64 rounded-md border p-4">
                                                {availableTracks.length > 0 ? availableTracks.map((track) => (
                                                    <FormField
                                                        key={track.id}
                                                        control={form.control}
                                                        name="trackIds"
                                                        render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={track.id}
                                                                className="flex flex-row items-start space-x-3 space-y-0 py-2"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(track.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                            ? field.onChange([...(field.value || []), track.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                (value) => value !== track.id
                                                                                )
                                                                            )
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal w-full">
                                                                    <div className="flex justify-between">
                                                                        <span>{track.title}</span>
                                                                        <span className="text-muted-foreground text-xs">{track.artist}</span>
                                                                    </div>
                                                                </FormLabel>
                                                            </FormItem>
                                                            )
                                                        }}
                                                    />
                                                )) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                        <Music className="w-12 h-12 mb-2" />
                                                        <p>No tracks found.</p>
                                                        <p className="text-xs">Scan your music folder in Settings.</p>
                                                    </div>
                                                )}
                                            </ScrollArea>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit">Save Playlist</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Playlist Name</TableHead>
                            <TableHead>Tracks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {playlists.map((playlist) => (
                            <TableRow key={playlist.id} onClick={() => handleOpenDialog(playlist)} className="cursor-pointer">
                                <TableCell className="font-medium">{playlist.name}</TableCell>
                                <TableCell>{playlist.trackIds.length}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(playlist.id); }}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete playlist</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {playlists.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No playlists yet. Create one to get started.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
