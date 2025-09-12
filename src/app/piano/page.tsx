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
  const [isWon, setIsWon] = useState(false)
  const [isPlayingBack, setIsPlayingBack] = useState(false)
  const [activePlaybackNote, setActivePlaybackNote] = useState<number | null>(null)
  const [fadeOutAll, setFadeOutAll] = useState(false)

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

  const playSequence = async (notes: string[], delay: number = 500) => {
    for (let i = 0; i < notes.length; i++) {
      if (!sampler) return
      
      const noteWithOctave = `${notes[i]}3`
      const midiNumber = MidiNumbers.fromNote(noteWithOctave.toLowerCase())
      
      console.log(`Playing note: ${noteWithOctave}, MIDI: ${midiNumber}`)
      
      // Highlight the key
      setActivePlaybackNote(midiNumber)
      
      // Play the note
      sampler.triggerAttackRelease(noteWithOctave, '4n')
      
      if (i < notes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // Clear the highlight after the sequence
    setTimeout(() => {
      setActivePlaybackNote(null)
    }, 200)
  }

  const handleWin = async () => {
    setIsPlayingBack(true)
    
    // Wait a moment, then play back the sequence
    setTimeout(async () => {
      await playSequence(TARGET_SEQUENCE)
      
      // After playback, fade out everything first
      setTimeout(() => {
        setFadeOutAll(true)
        // Then show congratulations after everything fades out
        setTimeout(() => {
          setIsWon(true)
        }, 1000)
      }, 500)
    }, 800)
  }

  const playNote = async (midiNumber: number) => {
    if (!sampler || isPlayingBack) return
    
    if (context.state !== 'running') await start()
    
    const noteAttributes = MidiNumbers.getAttributes(midiNumber)
    const noteName = `${noteAttributes.pitchName}${noteAttributes.octave}`
    const noteOnly = noteAttributes.pitchName
    
    sampler.triggerAttack(noteName)
    
    const expectedNote = TARGET_SEQUENCE[playedNotes.length]
    
    if (noteOnly === expectedNote) {
      const newNotes = [...playedNotes, noteOnly]
      setPlayedNotes(newNotes)
      
      // Check for win condition
      if (newNotes.length === TARGET_SEQUENCE.length) {
        handleWin()
      }
    } else {
      setPlayedNotes(prev => [...prev, noteOnly])
      handleError()
    }
  }

  const stopNote = (midiNumber: number) => {
    if (!sampler || isPlayingBack) return
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
        showContent && !fadeOutAll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
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
        !isLoading && showContent && !fadeOutAll ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
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
            activeNotes={activePlaybackNote ? [activePlaybackNote] : []}
          />
        </div>
      </div>
      
      {/* Game display */}
      {!isWon && (
        <div className={`mt-8 text-center transition-all duration-800 delay-1000 ${
          !isLoading && showContent && !fadeOutAll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
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
          
          <p className="text-gray-600 mb-4">
            {isPlayingBack ? 'Playing back your success!' : 'Click the keys to play!'}
          </p>

          {/* Hints toggle */}
          {!isPlayingBack && (
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
          )}
        </div>
      )}

      {/* Win screen */}
      {isWon && (
        <div className="mt-8 text-center animate-fade-in-note">
          <div className="bg-green-100 rounded-lg p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-green-800 mb-4">
              Congratulations!
            </h2>
            <p className="text-green-700 mb-6">
              You successfully played the secret sequence and spelled "CABBAGE"!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}