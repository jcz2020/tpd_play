/**
 * @fileoverview This file defines the Music Library page.
 * It is responsible for displaying all the tracks that have been
 * discovered by scanning the local music folders configured in the settings.
 * @module app/(app)/library/page
 */

import { MusicLibrary } from "@/components/MusicLibrary";

export default function LibraryPage() {
    return <MusicLibrary />;
}
