'use client'
import { useEffect, useState } from 'react'
// @ts-ignore
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano'
import 'react-piano/dist/styles.css'
import { Sampler, start, loaded, context } from 'tone'

export default function PianoPage() {
  const [sampler, setSampler] = useState<Sampler | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [playedNotes, setPlayedNotes] = useState<string[]>([])
  const [isError, setIsError] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)

  // The target sequence: C-A-B-B-A-G-E for "CABBAGE"
  const targetSequence = ['C', 'A', 'B', 'B', 'A', 'G', 'E']

  // Show content after component mounts
  useEffect(() => {
    setShowContent(true)
  }, [])

  // Initialize Tone.js sampler with piano samples
  useEffect(() => {
    const initializeSampler = async () => {
      // Create a sampler with piano samples
      const pianoSampler = new Sampler({
        urls: {
          C3: "https://tonejs.github.io/audio/salamander/C3.mp3",
          "D#3": "https://tonejs.github.io/audio/salamander/Ds3.mp3",
          "F#3": "https://tonejs.github.io/audio/salamander/Fs3.mp3",
          A3: "https://tonejs.github.io/audio/salamander/A3.mp3",
          C4: "https://tonejs.github.io/audio/salamander/C4.mp3",
        },
        release: 1,
        baseUrl: "",
      }).toDestination()

      // Wait for samples to load
      await loaded()
      setSampler(pianoSampler)
      
      // Add a delay before showing the piano for smoother animation
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    }

    initializeSampler()

    // Cleanup
    return () => {
      if (sampler) {
        sampler.dispose()
      }
    }
  }, [])

  // Changed to C3-C4 (one octave)
  const firstNote = MidiNumbers.fromNote('c3')
  const lastNote = MidiNumbers.fromNote('c4')

  const playNote = async (midiNumber: number) => {
    if (sampler && context.state !== 'running') {
      await start()
    }
    
    if (sampler) {
      const noteAttributes = MidiNumbers.getAttributes(midiNumber)
      const noteName = `${noteAttributes.pitchName}${noteAttributes.octave}`
      const noteOnly = noteAttributes.pitchName // Just the note letter (C, D, E, etc.)
      
      sampler.triggerAttack(noteName)
      
      // Check if this note matches the expected next note in sequence
      const expectedNote = targetSequence[playedNotes.length]
      
      if (noteOnly === expectedNote) {
        // Correct note! Add it to the sequence
        setPlayedNotes(prev => [...prev, noteOnly])
      } else {
        // Wrong note! Add it, flash red, then fade out and reset
        setPlayedNotes(prev => [...prev, noteOnly])
        setIsError(true)
        
        // Start fade out after showing error
        setTimeout(() => {
          setIsFadingOut(true)
        }, 700) // Show red for 0.7 seconds
        
        // Complete reset after fade out
        setTimeout(() => {
          setIsError(false)
          setIsFadingOut(false)
          setPlayedNotes([])
        }, 1000) // Total 1 second (0.7s red + 0.3s fade out)
      }
      
      console.log('Playing note:', noteOnly)
    }
  }

  const stopNote = (midiNumber: number) => {
    if (sampler) {
      const noteAttributes = MidiNumbers.getAttributes(midiNumber)
      const noteName = `${noteAttributes.pitchName}${noteAttributes.octave}`
      sampler.triggerRelease(noteName)
    }
  }

  // Check if current sequence is correct so far
  const isSequenceCorrect = playedNotes.length > 0 && 
    playedNotes.every((note, index) => note === targetSequence[index])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className={`text-4xl font-bold text-gray-800 mb-8 transition-all duration-800 ${
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}>
        Play the Piano!
      </h1>
      
      {/* Loading message */}
      <div className={`text-xl text-gray-600 transition-all duration-500 absolute ${
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="animate-pulse">Loading piano sounds...</div>
      </div>

      {/* Piano container */}
      <div className={`bg-white rounded-lg shadow-2xl px-8 py-16 transition-all duration-1000 delay-700 ${
        !isLoading && showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}>
        <div style={{ width: '600px', height: '200px' }}>
          <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={playNote}
            stopNote={stopNote}
            width={600}
            disabled={isLoading}
          />
        </div>
      </div>
      
      {/* Notes display */}
      <div className={`mt-8 text-center transition-all duration-800 delay-1000 ${
        !isLoading && showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}>
        <div className={`text-4xl font-bold mb-4 min-h-[3rem] transition-all duration-300 ${
          isFadingOut 
            ? 'opacity-0 transform translate-y-2' 
            : 'opacity-100 transform translate-y-0'
        } ${
          isError ? 'text-red-500' : isSequenceCorrect ? 'text-green-600' : 'text-gray-800'
        }`}>
          {playedNotes.map((note, index) => (
            <span 
              key={`${note}-${index}`}
              className="inline-block animate-fade-in-note"
              style={{ animationDelay: `${index * 50}ms` }} // Changed from 100ms to 50ms
            >
              {note}
            </span>
          ))}
        </div>
        
        <p className="text-gray-600">
          Click the keys to play!
        </p>
      </div>
    </div>
  )
}