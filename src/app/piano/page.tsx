// src/app/piano/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
// @ts-ignore
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import { Sampler, start, loaded, context } from 'tone';
import { caveat } from '../fonts'; // Caveat (400/700) from src/app/fonts.ts

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
  const [windowWidth, setWindowWidth] = useState<number>(600);

  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false); // flip right after loading
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

  // timeouts cleanup
  const timeouts = useRef<number[]>([]);
  const pushTimeout = (cb: () => void, ms: number) => {
    const id = window.setTimeout(cb, ms);
    timeouts.current.push(id);
    return id;
  };

  // responsive width
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pianoWidth = useMemo(() => {
    const padding = 64;
    const maxWidth = Math.min(windowWidth - padding, 500);
    return Math.max(maxWidth, 280);
  }, [windowWidth]);

  // note range & shortcuts
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

  // init audio; reveal content AFTER loading completes
  useEffect(() => {
    let mounted = true;

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

      // loading finished
      setIsLoading(false);

      // next tick: flip showContent so existing sections can animate from opacity-0 -> 100
      requestAnimationFrame(() => setShowContent(true));
    };

    initializeSampler();

    return () => {
      mounted = false;
      timeouts.current.forEach((id) => clearTimeout(id));
      timeouts.current = [];
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
    if (context.state !== 'running') {
      try {
        await start();
      } catch {
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
      } catch {}

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
      pushTimeout(() => {
        setFadeOutAll(true);
        pushTimeout(() => {
          setIsWon(true);
          pushTimeout(() => setShowWinContent(true), 20);
        }, 1000);
      }, 500);
    }, 800);
  };

  const playNote = async (midiNumber: number) => {
    if (!samplerRef.current || isPlayingBack) return;

    if (context.state !== 'running') {
      try {
        await start();
        setAudioInitialized(true);
      } catch {
        return;
      }
    }

    const attrs = MidiNumbers.getAttributes(midiNumber);
    const noteName = `${attrs.pitchName}${attrs.octave}`;
    const pitchOnly = attrs.pitchName;

    try {
      samplerRef.current.triggerAttack(noteName);
    } catch {}

    const expected = TARGET_SEQUENCE[playedNotes.length];

    if (pitchOnly === expected) {
      const newNotes = [...playedNotes, pitchOnly];
      setPlayedNotes(newNotes);
      if (newNotes.length === TARGET_SEQUENCE.length) handleWin();
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
    } catch {}
  };

  const renderNoteLabel = ({ midiNumber, isAccidental }: any) => {
    if (!showHints || isPlayingBack || isWon) return null;
    const attrs = MidiNumbers.getAttributes(midiNumber);
    return (
      <span
        style={{
          color: isAccidental ? 'white' : 'black',
          fontSize: pianoWidth < 400 ? '10px' : '12px',
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
    return 'text-[#5c4033]';
  };

  // helper: returns classes for visible vs hidden state
  const appear = (visible: boolean) =>
    `transition-all ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`;

  const showNow = showContent && !fadeOutAll; // once content is allowed to show, and not fading out

  return (
    <div className="relative min-h-screen bg-kraft-css p-4 sm:p-8 flex items-center justify-center overflow-x-hidden">
      <div className="max-w-2xl mx-auto space-y-6 w-full">

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-[#f4e1c6]/90 z-50">
            <div className="bg-paper-card-css rounded-xl p-8 text-center max-w-md mx-4 ring-1 ring-[#d2b48c]/60 shadow-[10px_12px_0_#c7b08a]">
              <div className="flex items-center justify-center gap-3 text-[#6b4f3a] mb-4">
                <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xl font-semibold">Loading Piano Sounds</span>
              </div>
              <p className="text-[#6b4f3a] mb-2">Preparing your musical adventure...</p>
              <p className="text-sm text-[#9c8063]">This may take a moment</p>
            </div>
          </div>
        )}

        {/* Header (Caveat) — perfectly centered two lines */}
        <div className={`${appear(showNow)} duration-500 flex justify-center`} aria-hidden={!showNow}>
          <div className="inline-block text-center">
            <span className={`${caveat.className} block text-4xl sm:text-6xl font-bold text-[#5c4033] leading-tight`}>
              ASK for the KEY
            </span>
            <span className={`${caveat.className} block text-4xl sm:text-6xl font-bold text-[#5c4033] leading-tight`}>
              within the Pages!
            </span>
          </div>
        </div>

        {/* Sequence Card */}
        <div className={`${appear(showNow)} duration-700 delay-300`} aria-hidden={!showNow}>
          <div
            className="
              relative bg-paper-card-css rounded-xl p-6 min-h-[100px]
              flex items-center justify-center
              ring-1 ring-[#d2b48c]/60
              shadow-[8px_10px_0_#c7b08a] sm:shadow-[10px_12px_0_#c7b08a] md:shadow-[12px_14px_0_#c7b08a]
            "
          >
            {/* small corner tape */}
            <div className="tape pointer-events-none absolute -top-4 left-6 w-20 h-5 rotate-[-8deg]" />
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
                    <span className="text-[#9c8063] text-xl">Your sequence will appear here...</span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Piano Card */}
        <div className={`${appear(showNow)} duration-1000 delay-700`} aria-hidden={!showNow}>
          <div
            className="
              relative bg-paper-card-css rounded-xl py-6 sm:py-12 px-4 sm:px-6
              ring-1 ring-[#d2b48c]/60
              shadow-[8px_10px_0_#c7b08a] sm:shadow-[10px_12px_0_#c7b08a] md:shadow-[12px_14px_0_#c7b08a]
            "
          >
            {/* small corner tape */}
            <div className="tape pointer-events-none absolute -top-4 left-6 w-20 h-5 rotate-[-8deg]" />
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

        {/* Instructions */}
        {!isWon && (
          <div className={`${appear(showNow)} duration-700 delay-1000 text-center`} aria-hidden={!showNow}>
            <p className="text-sm sm:text-base text-[#6b4f3a] mb-4 leading-relaxed">
              {isPlayingBack ? (
                '🎵 Playing back your success!'
              ) : (
                <>
                  🔊 Click on the keys to play
                  <br />
                  and make sure to turn on your audio!
                </>
              )}
            </p>
          </div>
        )}

        {/* Show Hints */}
        {!isWon && !isPlayingBack && (
          <div className={`${appear(showNow)} duration-700 delay-1200 text-center`} aria-hidden={!showNow}>
            <button
              onClick={() => setShowHints((v) => !v)}
              className={`px-3 sm:px-4 py-2 rounded-2xl font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base ${
                showHints
                  ? 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-400'
                  : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400'
              }`}
              aria-pressed={showHints}
              aria-label={showHints ? 'Hide note labels' : 'Show note labels'}
              disabled={!showNow}
            >
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </button>
            <p className="text-xs sm:text-sm text-[#9c8063] mt-2">Toggle between keyboard shortcuts and note names!</p>
          </div>
        )}

        {/* Win screen */}
        {isWon && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div
              className={`bg-paper-card-css rounded-2xl p-6 sm:p-8 max-w-md mx-auto ring-1 ring-[#d2b48c]/60
                          shadow-[12px_14px_0_#c7b08a] sm:shadow-[14px_16px_0_#c7b08a] md:shadow-[16px_18px_0_#c7b08a]
                          text-center transition-all duration-1000 relative
                          ${showWinContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'}`}
            >
              <div className="tape pointer-events-none absolute -top-6 left-10 w-40 h-7 rotate-[-8deg]" />
              <div className="tape pointer-events-none absolute -top-7 right-10 w-48 h-7 rotate-[6deg]" />
              <div className="text-4xl sm:text-6xl mb-4">🎉🥬🎉</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2f6f3e] mb-4">Congratulations!</h2>
              <p className="text-sm sm:text-base text-[#5c4033] mb-6">
                You successfully played the secret sequence and spelled &quot;CABBAGE&quot;!
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
