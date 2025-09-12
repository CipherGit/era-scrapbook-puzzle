declare module 'react-piano' {
  export interface NoteRange {
    first: number;
    last: number;
  }

  export interface PianoProps {
    noteRange: NoteRange;
    playNote: (midiNumber: number) => void;
    stopNote: (midiNumber: number) => void;
    width?: number;
    keyboardShortcuts?: any;
    disabled?: boolean;
    keyWidthToHeight?: number;
    renderNoteLabel?: (props: { midiNumber: number; isActive: boolean; isAccidental: boolean }) => React.ReactNode;
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