// src/app/piano/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
// If you haven't added a type shim for react-piano, consider adding one (see earlier message).
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import { Sampler, start, loaded, context } from 'tone';
import { caveat } from '../fonts';
import { useRouter } from 'next/navigation';

const TARGET_SEQUENCE = ['C', 'A', 'B', 'B', 'A', 'G', 'E']; // CABBAGE

const SAMPLE_URLS: Record<string, string> = {
  C3: 'https://tonejs.github.io/audio/salamander/C3.mp3',
  'D#3': 'https://tonejs.github.io/audio/salamander/Ds3.mp3',
  'F#3': 'https://tonejs.github.io/audio/salamander/Fs3.mp3',
  A3: 'https://tonejs.github.io/audio/salamander/A3.mp3',
  C4: 'https://tonejs.github.io/audio/salamander/C4.mp3',
};

export default function PianoPage() {
  const samplerRef = useRef<Sampler | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(600);

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

  const router = useRouter();
  const APPEND_ON_ERROR = true;

  const timeouts = useRef<number[]>([]);
  const pushTimeout = (cb: () => void, ms: number) => {
    const id = window.setTimeout(cb, ms);
    timeouts.current.push(id);
    return id;
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    router.prefetch('/photo'); // prefetch next challenge route
    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  const pianoWidth = useMemo(() => {
    const padding = 64;
    const maxWidth = Math.min(windowWidth - padding, 500);
    return Math.max(maxWidth, 280);
  }, [windowWidth]);

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

      setIsLoading(false);
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

  const renderNoteLabel = ({
    midiNumber,
    isAccidental,
  }: {
    midiNumber: number;
    isAccidental: boolean;
  }) => {
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

  const appear = (visible: boolean) =>
    `transition-all ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`;
  const showNow = showContent && !fadeOutAll;

  // Scrolling note strip (no total length revealed)
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!stripRef.current) return;
    stripRef.current.scrollTo({ left: stripRef.current.scrollWidth, behavior: 'smooth' });
  }, [playedNotes.length]);

  const renderSequenceStrip = () => {
    const hasNotes = playedNotes.length > 0;

    return (
      <div className={`w-full max-w-md mx-auto ${isError ? 'animate-shake' : ''}`}>
        <div
          ref={stripRef}
          className={`relative overflow-x-auto no-scrollbar rounded-full px-3 sm:px-4 py-2 sm:py-3
                      border-2 ${isError ? 'border-red-400' : 'border-dashed border-[#e0cda9]'}
                      bg-transparent`}
          style={{ scrollBehavior: 'smooth' }}
          aria-live="polite"
        >
          <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap">
            {hasNotes ? (
              playedNotes.map((note, idx) => (
                <span
                  key={`${note}-${idx}`}
                  className="inline-flex items-center justify-center px-2 sm:px-3 h-8 sm:h-9 rounded-full
                             border border-[#c49a6c] bg-white/70 text-[#5c4033] text-sm sm:text-base font-bold
                             shadow-[2px_3px_0_#c7b08a] animate-fade-in-note select-none"
                >
                  {note}
                </span>
              ))
            ) : (
              <span className="text-[#9c8063] text-sm sm:text-base select-none">
                Tap the keys to begin <span aria-hidden>♪</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Next challenge navigation (matches home page congrats behavior)
  const goNext = () => {
    setShowWinContent(false);
    pushTimeout(() => {
      router.push('/photo'); // ← change if your next route differs
    }, 300);
  };

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

        {/* Header (Caveat) — centered two lines */}
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

        {/* Sequence Card (tape) */}
        <div className={`${appear(showNow)} duration-700 delay-300`} aria-hidden={!showNow}>
          <div
            className="
              relative bg-paper-card-css rounded-xl p-6 min-h-[100px]
              flex flex-col items-center justify-center
              ring-1 ring-[#d2b48c]/60
              shadow-[8px_10px_0_#c7b08a] sm:shadow-[10px_12px_0_#c7b08a] md:shadow-[12px_14px_0_#c7b08a]
            "
          >
            {/* small corner tape */}
            <div className="tape pointer-events-none absolute -top-4 left-6 w-20 h-5 rotate-[-8deg]" />
            <div
              className={`w-full text-center transition-all duration-300 ${
                isFadingOut ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              } ${getDisplayColor()}`}
            >
              {renderSequenceStrip()}
            </div>
          </div>
        </div>

        {/* Piano Card (NO tape) */}
        <div className={`${appear(showNow)} duration-1000 delay-700`} aria-hidden={!showNow}>
          <div
            className="
              relative bg-paper-card-css rounded-xl py-6 sm:py-12 px-4 sm:px-6
              ring-1 ring-[#d2b48c]/60
              shadow-[8px_10px_0_#c7b08a] sm:shadow-[10px_12px_0_#c7b08a] md:shadow-[12px_14px_0_#c7b08a]
            "
          >
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
                '🎵 Cabbage Song'
              ) : (
                <>🔊 Make sure to turn on your audio!</>
              )}
            </p>
          </div>
        )}

        {/* Show Hints — scrapbook-styled chip */}
        {!isWon && !isPlayingBack && (
          <div className={`${appear(showNow)} duration-700 delay-1200 text-center`} aria-hidden={!showNow}>
            <button
              onClick={() => setShowHints((v) => !v)}
              aria-pressed={showHints}
              title={showHints ? 'Hide note labels' : 'Show note labels'}
              className={[
                // shared
                'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold',
                'transition-all select-none focus:outline-none',
                'border-2 shadow-[4px_5px_0_#c7b08a]',
                'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_4px_0_#c7b08a]',
                'focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#f4e1c6]',
                // states
                showHints
                  ? 'bg-[#2f6f3e] text-[#fffaf0] border-[#2f6f3e] hover:brightness-105 focus:ring-[#9bd2a3]'
                  : 'bg-white/80 text-[#5c4033] border-[#c49a6c] hover:shadow-[6px_7px_0_#c7b08a] focus:ring-[#c49a6c]',
                'text-sm sm:text-base',
              ].join(' ')}
              disabled={!showNow}
            >
              {/* icon */}
              {showHints ? (
                // eye-off
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-[1px]"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.64-1.49 1.6-2.86 2.79-4.03M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.2 11.2 0 0 1-2.34 3.38M1 1l22 22" />
                  <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                </svg>
              ) : (
                // eye
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-[1px]"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </button>
          </div>
        )}

        {/* Win screen — styles matched to home page + next challenge button */}
        {isWon && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div
              className={`transition-opacity transition-transform duration-800 ease-out ${
                showWinContent ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
              }`}
            >
              <div
                className="
                  relative bg-paper-card-css rounded-xl p-6 sm:p-8 max-w-md mx-auto
                  ring-1 ring-[#d2b48c]/60
                  shadow-[16px_18px_0_#c7b08a]
                "
              >
                {/* big tapes (match home dialog look) */}
                <div className="tape pointer-events-none absolute -top-6 left-10 w-40 h-7 rotate-[-8deg]" />
                <div className="tape pointer-events-none absolute -top-7 right-10 w-48 h-7 rotate-[6deg]" />

                <div className="text-center">
                  <div className="text-4xl sm:text-6xl mb-4">🎉🥬🎉</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2f6f3e] mb-4">Correct!</h2>
                  <p className="text-[#5c4033] mb-6">
                    I wanted to give you a musical puzzle too! This was supposed to be a bass guitar but it&apos;s a lot
                    more complex to do. As for why cabbage... cause veggies... and it&apos;s long enough HAHA!
                  </p>

                  <button
                    type="button"
                    onClick={goNext}
                    className="px-6 py-3 bg-[#6b4f3a] hover:bg-[#5c4033] text-[#fffaf0] font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#c49a6c] focus:ring-offset-2 focus:ring-offset-[#f4e1c6]"
                  >
                    Continue to the next challenge 📷
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
