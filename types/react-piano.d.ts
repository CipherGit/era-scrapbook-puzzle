// src/types/react-piano.d.ts
declare module 'react-piano' {
  import * as React from 'react';

  export interface PianoProps {
    noteRange: { first: number; last: number };
    playNote: (midiNumber: number) => void;
    stopNote: (midiNumber: number) => void;
    width: number;
    disabled?: boolean;
    keyboardShortcuts?: any;
    renderNoteLabel?: (args: { midiNumber: number; isAccidental: boolean }) => React.ReactNode;
    activeNotes?: number[];
  }

  export const Piano: React.ComponentType<PianoProps>;

  export const MidiNumbers: {
    fromNote: (note: string) => number;
    getAttributes: (midiNumber: number) => { pitchName: string; octave: number };
  };

  export const KeyboardShortcuts: {
    create: (opts: { firstNote: number; lastNote: number; keyboardConfig: any }) => any;
    HOME_ROW: any;
  };
}
