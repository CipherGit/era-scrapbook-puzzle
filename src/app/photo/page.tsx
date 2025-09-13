// src/app/photo/page.tsx
'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { caveat } from '../fonts'; // Caveat from src/app/fonts.ts

export default function PhotoChallengePage() {
  const [input, setInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const [showInitial, setShowInitial] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [fadeOutAll, setFadeOutAll] = useState(false);

  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsVisible, setCongratsVisible] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutsRef = useRef<number[]>([]);
  const router = useRouter();

  // TODO: set your actual answer here
  const correctAnswer = 'PLACEHOLDER';
  // TODO: where to go next after this page
  const nextRoute = '/final';

  const setT = (cb: () => void, ms: number) => {
    const id = window.setTimeout(cb, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  // Initial mount: reveal + focus, and prefetch the next page
  useEffect(() => {
    setShowInitial(true);
    setT(() => inputRef.current?.focus(), 120);
    router.prefetch(nextRoute);
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [router, nextRoute]);

  // Re-focus after an error resets
  useEffect(() => {
    if (!isError && !isShaking) inputRef.current?.focus();
  }, [isError, isShaking]);

  // Correct answer flow: fast fade-out, then smooth congrats fade-in
  useEffect(() => {
    if (!isCorrect) return;
    setT(() => {
      setFadeOutAll(true);
      setT(() => {
        setShowCongrats(true);
        // ensure the card mounts at opacity-0 then animates to 100
        setT(() => setCongratsVisible(true), 20);
      }, 250);
    }, 150);
  }, [isCorrect]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;

    if (val.toLowerCase() === correctAnswer.toLowerCase()) {
      setIsCorrect(true);
    } else {
      setIsError(true);
      setIsShaking(true);
      setT(() => {
        setIsShaking(false);
        setIsError(false);
        setInput('');
        inputRef.current?.focus();
      }, 600);
    }
  };

  const goNext = () => {
    setCongratsVisible(false);
    setT(() => {
      setShowCongrats(false);
      router.push(nextRoute); // change nextRoute to your actual next page
    }, 300);
  };

  return (
    <div className="relative min-h-screen bg-kraft-css p-4 sm:p-8 flex items-center justify-center overflow-x-hidden">
      <div className="max-w-2xl mx-auto space-y-6 w-full">

        {/* Header */}
        <div
          className={`text-center transition-all duration-600 ${
            showInitial
              ? !fadeOutAll
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-5'
              : 'opacity-0 translate-y-5'
          }`}
        >
          <h1 className={`${caveat.className} text-4xl sm:text-6xl font-bold text-[#5c4033] leading-tight`}>
            Photo Clue Challenge
          </h1>
          <h2 className={`${caveat.className} mt-1 text-2xl sm:text-3xl text-[#6b4f3a] leading-snug`}>
            Ready your lens 📷
          </h2>
        </div>

        {/* Question Card (top-left tape; responsive offset shadow) */}
        <div
          className={`transition-all duration-600 ${
            showInitial
              ? !fadeOutAll
                ? 'opacity-100 translate-y-0 delay-150'
                : 'opacity-0 translate-y-5'
              : 'opacity-0 translate-y-5'
          }`}
        >
          <div
            className="
              relative bg-paper-card-css rounded-xl p-6 sm:p-8 min-h-[200px]
              flex flex-col items-center justify-center
              ring-1 ring-[#d2b48c]/60
              shadow-[8px_10px_0_#c7b08a] sm:shadow-[10px_12px_0_#c7b08a] md:shadow-[12px_14px_0_#c7b08a]
            "
          >
            {/* small tape (top-left only) */}
            <div className="tape pointer-events-none absolute -top-4 left-6 w-20 h-5 rotate-[-8deg]" />

            <div className="text-center w-full max-w-md">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#5c4033] mb-6">
                {/* TODO: Replace with your actual prompt/question */}
                What’s the answer to this photo riddle?
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer and press Enter"
                  disabled={isCorrect}
                  aria-invalid={isError || undefined}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none transition-all duration-300 bg-transparent placeholder-[#9c8063] text-[#5c4033] ${
                    isError ? 'border-red-500' : 'border-[#e0cda9] focus:border-[#c49a6c]'
                  } ${isShaking ? 'animate-shake' : ''} ${isCorrect ? 'opacity-50 cursor-not-allowed' : ''}`}
                />

                {isError && (
                  <p className="text-red-600 text-sm" role="alert" aria-live="polite">
                    Nope—try again!
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div
          className={`text-center transition-all duration-600 ${
            showInitial
              ? !fadeOutAll
                ? 'opacity-100 translate-y-0 delay-300'
                : 'opacity-0 translate-y-5'
              : 'opacity-0 translate-y-5'
          }`}
        >
          <p className="text-sm sm:text-base text-[#6b4f3a] leading-relaxed">
            {/* TODO: Replace with your real hint */}
            💡 Hint: Your hint goes here! (e.g., “Think about reflections… or zoom into corners.”)
          </p>
        </div>

        {/* Congrats Card — centered, no dark backdrop, slow fade/scale in */}
        {showCongrats && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div
              className={`transition-opacity transition-transform duration-800 ease-out ${
                congratsVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
              }`}
            >
              <div
                className="
                  relative bg-paper-card-css rounded-xl p-6 sm:p-8 max-w-md mx-auto
                  ring-1 ring-[#d2b48c]/60
                  shadow-[16px_18px_0_#c7b08a]
                "
              >
                {/* big tapes */}
                <div className="tape pointer-events-none absolute -top-6 left-10 w-40 h-7 rotate-[-8deg]" />
                <div className="tape pointer-events-none absolute -top-7 right-10 w-48 h-7 rotate-[6deg]" />

                <div className="text-center">
                  <div className="text-4xl sm:text-6xl mb-4">🎉📷🎉</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2f6f3e] mb-4">
                    Nice shot!
                  </h2>
                  <p className="text-[#5c4033] mb-6">
                    Placeholder success message. Replace with something sweet &amp; specific.
                  </p>

                  <button
                    type="button"
                    onClick={goNext}
                    className="px-6 py-3 bg-[#6b4f3a] hover:bg-[#5c4033] text-[#fffaf0] font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#c49a6c] focus:ring-offset-2 focus:ring-offset-[#f4e1c6]"
                  >
                    Continue
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
