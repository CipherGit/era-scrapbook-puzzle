'use client'
import { useState, FormEvent, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { caveat } from './fonts' // Caveat (400/700) from src/app/fonts.ts

export default function Home() {
  const [input, setInput] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [showInitial, setShowInitial] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [fadeOutAll, setFadeOutAll] = useState(false)

  const [showCongrats, setShowCongrats] = useState(false)
  const [congratsVisible, setCongratsVisible] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutsRef = useRef<number[]>([])
  const router = useRouter()

  const correctAnswer = 'Esther'

  const setT = (cb: () => void, ms: number) => {
    const id = window.setTimeout(cb, ms)
    timeoutsRef.current.push(id)
    return id
  }

  useEffect(() => {
    setShowInitial(true)
    setT(() => inputRef.current?.focus(), 100)
    router.prefetch('/piano')
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [router])

  useEffect(() => {
    if (!isError && !isShaking) inputRef.current?.focus()
  }, [isError, isShaking])

  useEffect(() => {
    if (!isCorrect) return
    setT(() => {
      setFadeOutAll(true)
      setT(() => {
        setShowCongrats(true)
        setT(() => setCongratsVisible(true), 20)
      }, 250)
    }, 150)
  }, [isCorrect])

  const navigateToPiano = () => {
    setCongratsVisible(false)
    setT(() => {
      setShowCongrats(false)
      router.push('/piano')
    }, 300)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = input.trim()
    if (!value) return
    if (value.toLowerCase() === correctAnswer.toLowerCase()) {
      setIsCorrect(true)
    } else {
      setIsError(true)
      setIsShaking(true)
      setT(() => {
        setIsShaking(false)
        setIsError(false)
        setInput('')
      }, 600)
    }
  }

  const errorId = 'answer-error'

  return (
    <div className="relative min-h-screen p-4 sm:p-8 flex items-center justify-center bg-kraft-css">
      <div className="max-w-2xl mx-auto space-y-6 w-full">

        {/* Title + Sub-header */}
        <div
          className={`text-center transition-all duration-500 ${
            showInitial
              ? !fadeOutAll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              : 'opacity-0 translate-y-5'
          }`}
        >
          <h1 className={`${caveat.className} text-4xl sm:text-6xl font-bold text-[#5c4033] leading-tight`}>
            Scrapbook Puzzle Adventure
          </h1>
          <h2
            className={`${caveat.className} mt-1 text-[#6b4f3a] text-2xl sm:text-3xl font-normal leading-snug tracking-wide`}
          >
            Hey Era! Welcome in 👋
          </h2>
        </div>

        {/* Main Card (top-left tape only, responsive offset shadow) */}
        <div
          className={`transition-all duration-500 ${
            showInitial
              ? !fadeOutAll ? 'opacity-100 translate-y-0 delay-150' : 'opacity-0 translate-y-5'
              : 'opacity-0 translate-y-5'
          }`}
        >
          <div
            className="
              relative bg-paper-card-css rounded-xl p-6 sm:p-8 min-h-[220px]
              flex flex-col items-center justify-center
              ring-1 ring-[#d2b48c]/60
              shadow-[8px_10px_0_#c7b08a] sm:shadow-[10px_12px_0_#c7b08a] md:shadow-[12px_14px_0_#c7b08a]
            "
          >
            {/* small corner tape (top-left only) */}
            <div className="tape pointer-events-none absolute -top-4 left-6 w-20 h-5 rotate-[-8deg]" />

            <div className="text-center w-full max-w-md">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#5c4033] mb-6">
                What is the answer?
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter the answer and press Enter"
                  disabled={isCorrect}
                  aria-invalid={isError || undefined}
                  aria-describedby={isError ? errorId : undefined}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none transition-all duration-300 bg-transparent placeholder-[#9c8063] text-[#5c4033] ${
                    isError ? 'border-red-500' : 'border-[#e0cda9] focus:border-[#c49a6c]'
                  } ${isShaking ? 'animate-shake' : ''} ${isCorrect ? 'opacity-50 cursor-not-allowed' : ''}`}
                />

                {isError && (
                  <p id={errorId} role="alert" aria-live="polite" className="text-red-600 text-sm">
                    That&apos;s not quite right. Try again!
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div
          className={`text-center transition-all duration-500 ${
            showInitial
              ? !fadeOutAll ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-5'
              : 'opacity-0 translate-y-5'
          }`}
        >
          <p className="text-sm sm:text-base text-[#6b4f3a] leading-relaxed">
            💡 Hint: Caesar would&apos;ve loved <br /> to celebrate your birthday!
          </p>
        </div>

        {/* Centered Congrats (no backdrop). Slower fade/scale-in, responsive offset shadow) */}
        {showCongrats && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="congrats-title"
          >
            <div
              className={`transition-opacity transition-transform duration-800 ease-out ${
                congratsVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
              }`}
            >
              <div
                className="
                  relative bg-paper-card-css rounded-xl p-6 sm:p-8 max-w-md mx-auto
                  ring-1 ring-[#d2b48c]/60
                  shadow-[12px_14px_0_#c7b08a] sm:shadow-[14px_16px_0_#c7b08a] md:shadow-[16px_18px_0_#c7b08a]
                "
              >
                {/* big tapes */}
                <div className="tape pointer-events-none absolute -top-6 left-10 w-40 h-7 rotate-[-8deg]" />
                <div className="tape pointer-events-none absolute -top-7 right-10 w-48 h-7 rotate-[6deg]" />

                <div className="text-center">
                  <div className="text-4xl sm:text-6xl mb-4">🎉✨🎉</div>
                  <h2 id="congrats-title" className="text-2xl sm:text-3xl font-extrabold text-[#2f6f3e] mb-4">
                    Correct!
                  </h2>
                  <p className="text-[#5c4033] mb-6">
                    You know sometimes, I still find it weird to call you Esther HAHA!
                  </p>

                  <button
                    type="button"
                    onClick={navigateToPiano}
                    className="px-6 py-3 bg-[#6b4f3a] hover:bg-[#5c4033] text-[#fffaf0] font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#c49a6c] focus:ring-offset-2 focus:ring-offset-[#f4e1c6]"
                  >
                    Continue to your next challenge 🎵
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
