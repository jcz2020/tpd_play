/**
 * @fileoverview This file defines the Schedules page.
 * This page allows users to view, create, and manage scheduled
 * tasks for their devices, such as turning them on or off at a specific time.
 * @module app/(app)/schedules/page
 */

import { Scheduling } from "@/components/Scheduling";

export default function SchedulesPage() {
    return <Scheduling />;
}
