'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { caveat } from '../fonts';

type PolaroidSpec = {
  src: string;
  alt: string;      // short description line
  caption?: string; // handwritten caption
};

const PHOTOS: PolaroidSpec[] = [
  { src: '/photos/era-1.jpg', alt: 'Also my first public duet with you! 🎤', caption: 'Our First Event in Japan! ✈️' },
  { src: '/photos/era-2.jpg', alt: 'You finally changed your phone!', caption: 'Iphone 16 Pro 📱' },
  { src: '/photos/era-3.jpg', alt: 'Thank you for always letting me know youre there', caption: 'Soul Pics 📷' },
  { src: '/photos/era-4.jpg', alt: 'In this world full of changes, I\'ll be your constant', caption: 'Graduation 🎓' },
];

function Polaroid({
  src,
  alt,
  caption,
  className,
  sizes = '160px',
}: PolaroidSpec & { className?: string; sizes?: string }) {
  return (
    <figure
      className={[
        'select-none',
        'bg-white rounded-[3px] ring-1 ring-[#d2b48c]/50',
        'shadow-[6px_7px_0_#c7b08a]',
        'p-2 pb-4 flex flex-col items-center',
        'relative',
        className ?? '',
      ].join(' ')}
    >
      <div className="tape absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-3 rotate-[-4deg]" />
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-[2px]">
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </div>
      {caption ? (
        <figcaption className={`${caveat.className} mt-1 text-sm text-[#5c4033]`}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function PhotoPage() {
  const [input, setInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const [showInitial, setShowInitial] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [fadeOutAll, setFadeOutAll] = useState(false);

  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsVisible, setCongratsVisible] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timeouts = useRef<number[]>([]);
  const router = useRouter();

  // TODO: replace with your real final answer
  const correctAnswer = '1432';

  const setT = (cb: () => void, ms: number) => {
    const id = window.setTimeout(cb, ms);
    timeouts.current.push(id);
    return id;
  };

  useEffect(() => {
    setShowInitial(true);
    setT(() => inputRef.current?.focus(), 120);
    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isError && !isShaking) inputRef.current?.focus();
  }, [isError, isShaking]);

  // Success flow: fast page fade → mount/in-animate congrats card
  useEffect(() => {
    if (!isCorrect) return;
    setT(() => {
      setFadeOutAll(true);
      setT(() => {
        setShowCongrats(true);
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

  const restart = () => router.push('/');

  const appear = (v: boolean) =>
    `transition-all ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`;

  return (
    <div className="min-h-screen bg-kraft-css">
      {/* === QUESTION FLOW (kept vertically centered on mobile) === */}
      {!showCongrats && (
        <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
          <div className="max-w-3xl w-full space-y-6">
            <div className={`${appear(showInitial && !fadeOutAll)} text-center`}>
              <h1 className={`${caveat.className} text-4xl sm:text-6xl font-bold text-[#5c4033] leading-tight`}>
                Every picture tells a story, but together they tell a timeline
              </h1>
              <h2 className={`${caveat.className} mt-1 text-2xl sm:text-3xl text-[#6b4f3a] leading-snug`}>
                Snap into focus 📷
              </h2>
            </div>

            <div className={`${appear(showInitial && !fadeOutAll)} delay-150`}>
              <div
                className="
                  relative bg-paper-card-css rounded-xl p-6 sm:p-8 min-h-[200px]
                  flex flex-col items-center justify-center
                  ring-1 ring-[#d2b48c]/60
                  shadow-[10px_12px_0_#c7b08a] sm:shadow-[12px_14px_0_#c7b08a] md:shadow-[14px_16px_0_#c7b08a]
                "
              >
                <div className="tape pointer-events-none absolute -top-4 left-6 w-20 h-5 rotate-[-8deg]" />
                <div className="text-center w-full max-w-lg">
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#5c4033] mb-6">
                    What’s the answer to this final photo riddle?
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
                      className={[
                        'w-full px-4 py-3 border-2 rounded-lg text-lg',
                        'focus:outline-none transition-all duration-300 bg-transparent',
                        'placeholder-[#9c8063] text-[#5c4033]',
                        isError ? 'border-red-500' : 'border-[#e0cda9] focus:border-[#c49a6c]',
                        isShaking ? 'animate-shake' : '',
                        isCorrect ? 'opacity-50 cursor-not-allowed' : '',
                      ].join(' ')}
                    />
                    {isError && (
                      <p className="text-red-600 text-sm" role="alert" aria-live="polite">
                        Close, but not quite—try again!
                      </p>
                    )}
                  </form>
                </div>
              </div>
            </div>

            <div className={`${appear(showInitial && !fadeOutAll)} delay-300 text-center`}>
              <p className="text-sm sm:text-base text-[#6b4f3a] leading-relaxed">
                💡 Hint: Read the numbers as time intended them to be read
              </p>
            </div>
          </div>
        </div>
      )}

      {/* === CONGRATS SECTION ===
           On mobile this is near the top, and EVERYTHING (message + photos) lives INSIDE the card.
           The page (not an overlay) scrolls naturally.
      */}
      {showCongrats && (
        <div className="p-4 sm:p-8">
          <section className={`${appear(congratsVisible)} duration-700`}>
            <div className="max-w-3xl mx-auto">
              <div
                className="
                  relative bg-paper-card-css rounded-2xl pt-12 p-6 sm:p-10
                  ring-1 ring-[#d2b48c]/60
                  shadow-[18px_20px_0_#c7b08a]
                  text-center
                "
              >
                {/* Tapes (space reserved by pt-12 so they won't clip) */}
                <div className="tape pointer-events-none absolute -top-6 left-10 w-40 h-7 rotate-[-7deg]" />
                <div className="tape pointer-events-none absolute -top-7 right-10 w-48 h-7 rotate-[5deg]" />

                <div className="text-5xl sm:text-6xl mb-4">🎉🎂🎉</div>
                <h2 className={`${caveat.className} text-4xl sm:text-5xl font-bold text-[#2f6f3e] mb-4`}>
                  Happy Birthday, Era!
                </h2>

                <div className="mx-auto max-w-xl">
                  <p className="text-[#5c4033] text-base sm:text-lg leading-relaxed">
                    You did it!! Thank you for playing along and making it this far!
                    I hope this little puzzle was fun for you to solve as much as it was fun for me to make!
                    I literally spent sleepless nights on this so feedback would be highly appreciated HAHA!
                  </p>
                  <p className="text-[#5c4033] text-base sm:text-lg leading-relaxed mt-3">
                    Anyway... I've already told you a lot of things from my scuffed grad speech and my novel length telegram messages.
                    So this time around, I thought that it would be nice for everyone to say something as well 
                    cause they care about you too hehe! I know the road ahead is tough but I hope the memories we share can give you a happiness boost when you need it! 
                  </p>
                </div>

                {/* Photos live INSIDE the card now; single unified page scroll */}
                <div className="mt-10 space-y-6">
                  {PHOTOS.map((ph, i) => {
                    const reversed = i % 2 === 1;
                    return (
                      <div
                        key={ph.src}
                        className={[
                          'flex items-center gap-4 sm:gap-6',
                          // On small screens: alternate left/right
                          reversed ? 'flex-row-reverse text-right' : 'flex-row',
                        ].join(' ')}
                      >
                        <div className="w-36 sm:w-44 shrink-0 mx-auto sm:mx-0">
                          <Polaroid {...ph} sizes="(min-width:640px) 176px, 144px" />
                        </div>
                        <div className={['flex-1', reversed ? 'text-right' : 'text-left'].join(' ')}>
                          <div className={`${caveat.className} text-2xl text-[#5c4033]`}>{ph.caption}</div>
                          <p className="text-sm sm:text-base text-[#6b4f3a] leading-relaxed mt-1">{ph.alt}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
