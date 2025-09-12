'use client'
import { useEffect, useState } from 'react'
// @ts-ignore
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano'
import 'react-piano/dist/styles.css'
import { Sampler, start, loaded, context } from 'tone'

const TARGET_SEQUENCE = ['C', 'A', 'B', 'B', 'A', 'G', 'E']
const SAMPLE_URLS = {
  C3: "https://tonejs.github.io/audio/salamander/C3.mp3",
  "D#3": "https://tonejs.github.io/audio/salamander/Ds3.mp3", 
  "F#3": "https://tonejs.github.io/audio/salamander/Fs3.mp3",
  A3: "https://tonejs.github.io/audio/salamander/A3.mp3",
  C4: "https://tonejs.github.io/audio/salamander/C4.mp3",
}

export default function PianoPage() {
  const [sampler, setSampler] = useState<Sampler | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [playedNotes, setPlayedNotes] = useState<string[]>([])
  const [isError, setIsError] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [showHints, setShowHints] = useState(false)

  const firstNote = MidiNumbers.fromNote('c3')
  const lastNote = MidiNumbers.fromNote('c4')
  
  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote,
    lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  })

  const isSequenceCorrect = playedNotes.length > 0 && 
    playedNotes.every((note, index) => note === TARGET_SEQUENCE[index])

  // Initialize audio and animations
  useEffect(() => {
    setShowContent(true)
    
    const initializeSampler = async () => {
      const pianoSampler = new Sampler({
        urls: SAMPLE_URLS,
        release: 1,
        baseUrl: "",
      }).toDestination()

      await loaded()
      setSampler(pianoSampler)
      setTimeout(() => setIsLoading(false), 500)
    }

    initializeSampler()
    return () => sampler?.dispose()
  }, [])

  const handleError = () => {
    setIsError(true)
    setTimeout(() => setIsFadingOut(true), 700)
    setTimeout(() => {
      setIsError(false)
      setIsFadingOut(false)
      setPlayedNotes([])
    }, 1000)
  }

  const playNote = async (midiNumber: number) => {
    if (!sampler) return
    
    if (context.state !== 'running') await start()
    
    const noteAttributes = MidiNumbers.getAttributes(midiNumber)
    const noteName = `${noteAttributes.pitchName}${noteAttributes.octave}`
    const noteOnly = noteAttributes.pitchName
    
    sampler.triggerAttack(noteName)
    
    const expectedNote = TARGET_SEQUENCE[playedNotes.length]
    
    if (noteOnly === expectedNote) {
      setPlayedNotes(prev => [...prev, noteOnly])
    } else {
      setPlayedNotes(prev => [...prev, noteOnly])
      handleError()
    }
  }

  const stopNote = (midiNumber: number) => {
    if (!sampler) return
    const noteAttributes = MidiNumbers.getAttributes(midiNumber)
    const noteName = `${noteAttributes.pitchName}${noteAttributes.octave}`
    sampler.triggerRelease(noteName)
  }

  const renderNoteLabel = ({ midiNumber, isAccidental }: any) => {
    if (!showHints) return null
    
    const noteAttributes = MidiNumbers.getAttributes(midiNumber)
    return (
      <span style={{ 
        color: isAccidental ? 'white' : 'black',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {noteAttributes.pitchName}
      </span>
    )
  }

  const getDisplayColor = () => {
    if (isError) return 'text-red-500'
    if (isSequenceCorrect) return 'text-green-600'
    return 'text-gray-800'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className={`text-4xl font-bold text-gray-800 mb-8 transition-all duration-800 ${
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}>
        Play the Piano!
      </h1>
      
      {/* Loading message */}
      {isLoading && (
        <div className="text-xl text-gray-600 animate-pulse absolute">
          Loading piano sounds...
        </div>
      )}

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
            keyboardShortcuts={keyboardShortcuts}
            renderNoteLabel={renderNoteLabel}
          />
        </div>
      </div>
      
      {/* Game display */}
      <div className={`mt-8 text-center transition-all duration-800 delay-1000 ${
        !isLoading && showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}>
        {/* Notes sequence */}
        <div className={`text-4xl font-bold mb-4 min-h-[3rem] transition-all duration-300 ${
          isFadingOut ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
        } ${getDisplayColor()}`}>
          {playedNotes.map((note, index) => (
            <span 
              key={`${note}-${index}`}
              className="inline-block animate-fade-in-note"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {note}
            </span>
          ))}
        </div>
        
        <p className="text-gray-600 mb-4">Click the keys to play!</p>

        {/* Hints toggle */}
        <div>
          <button
            onClick={() => setShowHints(!showHints)}
            className={`px-4 py-2 rounded font-semibold transition duration-200 ${
              showHints 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Toggle between keyboard shortcuts and note names!
          </p>
        </div>
      </div>
    </div>
  )
}