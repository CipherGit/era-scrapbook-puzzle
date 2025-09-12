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
          C4: "https://tonejs.github.io/audio/salamander/C4.mp3",
          "D#4": "https://tonejs.github.io/audio/salamander/Ds4.mp3",
          "F#4": "https://tonejs.github.io/audio/salamander/Fs4.mp3",
          A4: "https://tonejs.github.io/audio/salamander/A4.mp3",
          C5: "https://tonejs.github.io/audio/salamander/C5.mp3",
          "D#5": "https://tonejs.github.io/audio/salamander/Ds5.mp3",
          "F#5": "https://tonejs.github.io/audio/salamander/Fs5.mp3",
          A5: "https://tonejs.github.io/audio/salamander/A5.mp3",
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

  const firstNote = MidiNumbers.fromNote('c4')
  const lastNote = MidiNumbers.fromNote('c6')
  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote: firstNote,
    lastNote: lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  })

  const playNote = async (midiNumber: number) => {
    if (sampler && context.state !== 'running') {
      await start()
    }
    
    if (sampler) {
      const noteAttributes = MidiNumbers.getAttributes(midiNumber)
      const noteName = `${noteAttributes.pitchName}${noteAttributes.octave}`
      sampler.triggerAttack(noteName)
      console.log('Playing note:', noteName)
    }
  }

  const stopNote = (midiNumber: number) => {
    if (sampler) {
      const noteAttributes = MidiNumbers.getAttributes(midiNumber)
      const noteName = `${noteAttributes.pitchName}${noteAttributes.octave}`
      sampler.triggerRelease(noteName)
    }
  }

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

      {/* Piano container - always present */}
      <div className={`bg-white rounded-lg shadow-2xl p-6 transition-all duration-1000 delay-700 ${
        !isLoading && showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}>
        <div style={{ width: '800px', height: '200px' }}>
          <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={playNote}
            stopNote={stopNote}
            width={800}
            keyboardShortcuts={keyboardShortcuts}
            disabled={isLoading} // Disable interaction while loading
          />
        </div>
      </div>
      
      <p className={`mt-6 text-gray-600 text-center transition-all duration-800 delay-1000 ${
        !isLoading && showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}>
        <>
          Click the keys or use your keyboard to play!<br />
          <span className="text-sm">Keyboard shortcuts: A S D F G H J K L</span>
        </>
      </p>
    </div>
  )
}