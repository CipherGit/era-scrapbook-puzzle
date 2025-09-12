'use client'
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano'
import 'react-piano/dist/styles.css'

export default function PianoPage() {
  // Define the range of piano keys (C4 to C6)
  const firstNote = MidiNumbers.fromNote('c4')
  const lastNote = MidiNumbers.fromNote('c6')
  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote: firstNote,
    lastNote: lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  })

  // This function will be called when a note is played
  const playNote = (midiNumber: number) => {
    // For now, we'll just log the note
    console.log('Playing note:', midiNumber)
    // We'll add actual audio later
  }

  const stopNote = (midiNumber: number) => {
    console.log('Stopping note:', midiNumber)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 animate-fade-in">
        Play the Piano!
      </h1>
      
      <div className="bg-white rounded-lg shadow-2xl p-6 animate-fade-in">
        <Piano
          noteRange={{ first: firstNote, last: lastNote }}
          playNote={playNote}
          stopNote={stopNote}
          width={800}
          keyboardShortcuts={keyboardShortcuts}
        />
      </div>
      
      <p className="mt-6 text-gray-600 text-center animate-fade-in">
        Click the keys or use your keyboard to play!<br />
        <span className="text-sm">Keyboard shortcuts: A S D F G H J K L</span>
      </p>
    </div>
  )
}