// src/types/react-piano.d.ts (or wherever you keep it)
import * as React from 'react';

declare module 'react-piano' {
  export interface NoteRange {
    first: number;
    last: number;
  }

  export interface PianoProps {
    noteRange: NoteRange;
    playNote: (midiNumber: number) => void;
    stopNote: (midiNumber: number) => void;

    /** Canvas width in px */
    width?: number;

    /** Disable interaction */
    disabled?: boolean;

    /** Keyboard mapping helpers */
    keyboardShortcuts?: any;

    /** Key width/height ratio */
    keyWidthToHeight?: number;

    /**
     * Custom label renderer for a key.
     * `isActive` is optional so your function can ignore it without TS errors.
     */
    renderNoteLabel?: (props: {
      midiNumber: number;
      isAccidental: boolean;
      isActive?: boolean;
    }) => React.ReactNode;

    /**
     * MIDI numbers to visually highlight (e.g., guided playback).
     * Many versions support this at runtime but the types omit it — we add it here.
     */
    activeNotes?: number[];
  }

  export const Piano: React.FC<PianoProps>;

  export class MidiNumbers {
    static fromNote(note: string): number;
    static getAttributes(midiNumber: number): {
      note: string;
      pitchName: string;
      octave: number;
      isAccidental: boolean;
    };
  }

  export class KeyboardShortcuts {
    static create(config: {
      firstNote: number;
      lastNote: number;
      keyboardConfig: any;
    }): any;

    static HOME_ROW: any;
  }
}

declare module 'react-piano/dist/styles.css';