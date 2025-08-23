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
import { Switch } from "@/components/ui/switch";
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
  } from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import { useAppContext } from "./AcousticHarmonyApp";
import type { Schedule } from "@/lib/types";

const scheduleSchema = z.object({
    deviceId: z.string().min(1, "Please select a device."),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
    action: z.enum(["on", "off"]),
    playlist: z.string().optional(),
    enabled: z.boolean(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export function Scheduling() {
    const { state, actions } = useAppContext();
    const { schedules, devices } = state;
    const { handleSaveSchedule: onSave, handleDeleteSchedule: onDelete, handleToggleSchedule: onToggle } = actions;
    
    const [open, setOpen] = React.useState(false);

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            deviceId: "",
            time: "",
            action: "on",
            playlist: "",
            enabled: true,
        },
    });

    const onSubmit = (data: ScheduleFormValues) => {
        const scheduleData = {
            ...data,
            playlist: data.playlist ?? "",
        };
        onSave(scheduleData);
        form.reset();
        setOpen(false);
    };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Schedules</CardTitle>
            <CardDescription>
                Manage automated tasks for your speakers.
            </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    New Schedule
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Schedule</DialogTitle>
                    <DialogDescription>
                        Set up a new automated task for one of your devices.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="deviceId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Device</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a device" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {devices.filter(d => d.online).map(device => (
                                                <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="action"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Action</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="on">Turn On</SelectItem>
                                            <SelectItem value="off">Turn Off</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="playlist"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Playlist (if turning on)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Morning Jazz" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Save Schedule</Button>
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
              <TableHead>Device</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Playlist</TableHead>
              <TableHead className="text-center">Enabled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => {
              const device = devices.find(d => d.id === schedule.deviceId);
              return (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{device?.name ?? "Unknown Device"}</TableCell>
                  <TableCell>{schedule.time}</TableCell>
                  <TableCell className="capitalize">{schedule.action}</TableCell>
                  <TableCell>{schedule.playlist || "N/A"}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={schedule.enabled}
                      onCheckedChange={(checked) => onToggle(schedule.id, checked)}
                      aria-label="Toggle schedule"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onDelete(schedule.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete schedule</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {schedules.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
                No schedules yet.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
