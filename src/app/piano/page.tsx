'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
// @ts-ignore
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import { Sampler, start, loaded, context } from 'tone';

const TARGET_SEQUENCE = ['C', 'A', 'B', 'B', 'A', 'G', 'E']; // CABBAGE

// Minimal roots; Tone.Sampler will pitch-shift others.
const SAMPLE_URLS: Record<string, string> = {
  C3: 'https://tonejs.github.io/audio/salamander/C3.mp3',
  'D#3': 'https://tonejs.github.io/audio/salamander/Ds3.mp3',
  'F#3': 'https://tonejs.github.io/audio/salamander/Fs3.mp3',
  A3: 'https://tonejs.github.io/audio/salamander/A3.mp3',
  C4: 'https://tonejs.github.io/audio/salamander/C4.mp3',
};

export default function PianoPage() {
  const [sampler, setSampler] = useState<Sampler | null>(null);
  const samplerRef = useRef<Sampler | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(600); // Default fallback

  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [playedNotes, setPlayedNotes] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [activePlaybackNote, setActivePlaybackNote] = useState<number | null>(null);
  const [fadeOutAll, setFadeOutAll] = useState(false);
  const [showWinContent, setShowWinContent] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const APPEND_ON_ERROR = true;

  // Track timeouts to clear on unmount
  const timeouts = useRef<number[]>([]);
  const pushTimeout = (cb: () => void, ms: number) => {
    const id = window.setTimeout(cb, ms);
    timeouts.current.push(id);
    return id;
  };

  // Handle window resize for responsive piano
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Calculate piano width based on screen size and orientation
  const pianoWidth = useMemo(() => {
    // Always use constrained width approach
    const padding = 64; // Account for container padding + piano container padding
    const maxWidth = Math.min(windowWidth - padding, 500); // Reduced max width for better constraint
    return Math.max(maxWidth, 280); // Minimum 280px for usability
  }, [windowWidth]);

  // Piano range & shortcuts
  const firstNote = useMemo(() => MidiNumbers.fromNote('c3'), []);
  const lastNote = useMemo(() => MidiNumbers.fromNote('c4'), []);
  const keyboardShortcuts = useMemo(
    () =>
      KeyboardShortcuts.create({
        firstNote,
        lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
      }),
    [firstNote, lastNote]
  );

  const isSequenceCorrect =
    playedNotes.length > 0 &&
    playedNotes.every((note, index) => note === TARGET_SEQUENCE[index]);

  // Initialize audio and entrance animations
  useEffect(() => {
    let mounted = true;

    setShowContent(true);

    const initializeSampler = async () => {
      const pianoSampler = new Sampler({
        urls: SAMPLE_URLS,
        release: 1,
        baseUrl: '',
      }).toDestination();

      await loaded();
      if (!mounted) {
        pianoSampler.dispose();
        return;
      }

      samplerRef.current = pianoSampler;
      setSampler(pianoSampler);
      pushTimeout(() => setIsLoading(false), 500);
    };

    initializeSampler();

    return () => {
      mounted = false;
      // Clear pending timeouts
      timeouts.current.forEach((id) => clearTimeout(id));
      timeouts.current = [];
      // Dispose sampler
      samplerRef.current?.dispose();
      samplerRef.current = null;
    };
  }, []);

  const handleError = () => {
    setIsError(true);
    pushTimeout(() => setIsFadingOut(true), 700);
    pushTimeout(() => {
      setIsError(false);
      setIsFadingOut(false);
      setPlayedNotes([]);
    }, 1000);
  };

  const playSequence = async (notes: string[], delay = 500) => {
    // Ensure audio context is running
    if (context.state !== 'running') {
      try {
        await start();
      } catch (error) {
        console.warn('Failed to start audio context for sequence:', error);
        return;
      }
    }

    for (let i = 0; i < notes.length; i++) {
      if (!samplerRef.current) return;

      const noteWithOctave = `${notes[i]}3`;
      const midiNumber = MidiNumbers.fromNote(noteWithOctave.toLowerCase());

      setActivePlaybackNote(midiNumber);
      
      try {
        samplerRef.current.triggerAttackRelease(noteWithOctave, '4n');
      } catch (error) {
        console.warn('Failed to play sequence note:', error);
      }

      if (i < notes.length - 1) {
        await new Promise((resolve) => {
          const id = window.setTimeout(resolve, delay);
          timeouts.current.push(id);
        });
      }
    }

    pushTimeout(() => setActivePlaybackNote(null), 200);
  };

  const handleWin = async () => {
    setIsPlayingBack(true);

    pushTimeout(async () => {
      await playSequence(TARGET_SEQUENCE);

      // Fade out the piano/UI
      pushTimeout(() => {
        setFadeOutAll(true);

        // After piano fade (matches duration-1000 on the piano container)
        pushTimeout(() => {
          setIsWon(true);
          // Tiny delay so the win box mounts at opacity-0 then transitions to opacity-100
          pushTimeout(() => setShowWinContent(true), 20);
        }, 1000);
      }, 500);
    }, 800);
  };

  const playNote = async (midiNumber: number) => {
    if (!samplerRef.current || isPlayingBack) return;

    // Ensure audio context is running on first interaction
    if (context.state !== 'running') {
      try {
        await start();
        setAudioInitialized(true);
      } catch (error) {
        console.warn('Failed to start audio context:', error);
        return;
      }
    }

    const attrs = MidiNumbers.getAttributes(midiNumber);
    const noteName = `${attrs.pitchName}${attrs.octave}`; // e.g., "C3"
    const pitchOnly = attrs.pitchName; // e.g., "C"

    try {
      samplerRef.current.triggerAttack(noteName);
    } catch (error) {
      console.warn('Failed to play note:', error);
    }

    const expected = TARGET_SEQUENCE[playedNotes.length];

    if (pitchOnly === expected) {
      const newNotes = [...playedNotes, pitchOnly];
      setPlayedNotes(newNotes);
      if (newNotes.length === TARGET_SEQUENCE.length) {
        handleWin();
      }
    } else {
      if (APPEND_ON_ERROR) setPlayedNotes((prev) => [...prev, pitchOnly]);
      handleError();
    }
  };

  const stopNote = (midiNumber: number) => {
    if (!samplerRef.current || isPlayingBack) return;
    const attrs = MidiNumbers.getAttributes(midiNumber);
    const noteName = `${attrs.pitchName}${attrs.octave}`;
    try {
      samplerRef.current.triggerRelease(noteName);
    } catch (error) {
      console.warn('Failed to stop note:', error);
    }
  };

  const renderNoteLabel = ({ midiNumber, isAccidental }: any) => {
    // Hide hints during playback and after win
    if (!showHints || isPlayingBack || isWon) return null;
    const attrs = MidiNumbers.getAttributes(midiNumber);
    return (
      <span
        style={{
          color: isAccidental ? 'white' : 'black',
          fontSize: pianoWidth < 400 ? '10px' : '12px', // Smaller font on mobile
          fontWeight: 'bold',
          userSelect: 'none',
        }}
      >
        {attrs.pitchName}
      </span>
    );
  };

  const getDisplayColor = () => {
    if (isError) return 'text-red-500';
    if (isSequenceCorrect) return 'text-green-600';
    return 'text-gray-800';
  };

  return (
    <div className="relative min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-2xl mx-auto space-y-6 w-full">
        
        {/* 1. Header Text - First to appear (2 lines) */}
        <div
          className={`text-center transition-all duration-700 ${
            showContent && !fadeOutAll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 leading-tight">
            ASK for the KEY<br />within the Pages!
          </h1>
        </div>

        {/* 2. Note Sequence Card - Second to appear */}
        <div
          className={`transition-all duration-700 delay-300 ${
            showContent && !fadeOutAll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 min-h-[100px] flex items-center justify-center">
            {!isWon ? (
              <div
                className={`text-center transition-all duration-300 ${
                  isFadingOut ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                } ${getDisplayColor()}`}
              >
                <div className="text-3xl sm:text-4xl font-bold mb-2 min-h-[3rem] flex items-center justify-center">
                  {playedNotes.length > 0 ? (
                    playedNotes.map((note, index) => (
                      <span
                        key={`${note}-${index}`}
                        className="inline-block transition-opacity duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {note}
                        {index < playedNotes.length - 1 ? <span className="mx-1 text-gray-400">·</span> : null}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xl">Your sequence will appear here...</span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Loading message overlay */}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 z-50">
            <div className="text-lg sm:text-xl text-gray-600 animate-pulse">Loading piano sounds...</div>
          </div>
        )}

        {/* 3. Piano - Third to appear (with card effects) */}
        <div
          className={`transition-all duration-1000 delay-700 ${
            !isLoading && showContent && !fadeOutAll
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95'
          }`}
        >
          <div className="bg-white rounded-xl shadow-lg py-6 sm:py-12 px-4 sm:px-6">
            <div className="flex justify-center">
              <div style={{ width: pianoWidth, height: pianoWidth < 400 ? 150 : 200 }}>
                <Piano
                  noteRange={{ first: firstNote, last: lastNote }}
                  playNote={playNote}
                  stopNote={stopNote}
                  width={pianoWidth}
                  disabled={isLoading}
                  keyboardShortcuts={keyboardShortcuts}
                  renderNoteLabel={renderNoteLabel}
                  activeNotes={activePlaybackNote ? [activePlaybackNote] : []}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Instructions - Fourth to appear (2 lines with emoji) */}
        {!isWon && (
          <div
            className={`text-center transition-all duration-700 delay-1000 ${
              !isLoading && showContent && !fadeOutAll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
              {isPlayingBack 
                ? '🎵 Playing back your success!' 
                : (
                  <>
                    🔊 Click on the keys to play<br />
                    and make sure to turn on your audio!
                  </>
                )
              }
            </p>
          </div>
        )}

        {/* 5. Show Hints Button - Fifth to appear */}
        {!isWon && !isPlayingBack && (
          <div
            className={`text-center transition-all duration-700 delay-1200 ${
              !isLoading && showContent && !fadeOutAll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            <button
              onClick={() => setShowHints((v) => !v)}
              className={`px-3 sm:px-4 py-2 rounded-2xl font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base ${
                showHints
                  ? 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-400'
                  : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400'
              }`}
              aria-pressed={showHints}
              aria-label={showHints ? 'Hide note labels' : 'Show note labels'}
            >
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </button>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Toggle between keyboard shortcuts and note names!
            </p>
          </div>
        )}

        {/* Win screen — centered overlay; fades in after piano fades out */}
        {isWon && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div
              className={`bg-green-100 rounded-2xl p-6 sm:p-8 max-w-md mx-auto shadow-2xl text-center transition-all duration-1000 ${
                showWinContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
              }`}
            >
              <div className="text-4xl sm:text-6xl mb-4">🎉🥬🎉</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-green-800 mb-4">Congratulations!</h2>
              <p className="text-sm sm:text-base text-green-700 mb-6">
                You successfully played the secret sequence and spelled &quot;CABBAGE&quot;!
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}