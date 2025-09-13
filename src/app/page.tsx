'use client'
import { useState, FormEvent, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [input, setInput] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [showInitial, setShowInitial] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [fadeOutAll, setFadeOutAll] = useState(false)

  // Congrats mounting + animated visibility
  const [showCongrats, setShowCongrats] = useState(false)        // mounted?
  const [congratsVisible, setCongratsVisible] = useState(false)  // entering/exiting animation

  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutsRef = useRef<number[]>([])
  const router = useRouter()

  const correctAnswer = 'Esther'

  // helper to register timeouts and clean them up
  const setT = (cb: () => void, ms: number) => {
    const id = window.setTimeout(cb, ms)
    timeoutsRef.current.push(id)
    return id
  }

  // initial mount
  useEffect(() => {
    setShowInitial(true)
    setT(() => inputRef.current?.focus(), 100)
    router.prefetch('/piano')

    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id))
      timeoutsRef.current = []
    }
  }, [router])

  // re-focus after error clears
  useEffect(() => {
    if (!isError && !isShaking) inputRef.current?.focus()
  }, [isError, isShaking])

  // correct answer flow: FAST fade-out, SLOWER fade-in
  useEffect(() => {
    if (!isCorrect) return

    setT(() => {
      setFadeOutAll(true) // start fast fade-out

      setT(() => {
        setShowCongrats(true)              // mount centered card (hidden)
        setT(() => setCongratsVisible(true), 20) // next-tick -> animate in
      }, 250)
    }, 150)
  }, [isCorrect])

  const navigateToPiano = () => {
    // smooth exit of the card, then unmount & navigate
    setCongratsVisible(false)
    setT(() => {
      setShowCongrats(false)
      router.push('/piano')
    }, 300) // matches ~duration-300 for exit
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
    <div className="relative min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-2xl mx-auto space-y-6 w-full">

        {/* Header (fast fade-out) */}
        <div
          className={`text-center transition-all duration-500 ${
            showInitial
              ? !fadeOutAll
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-5'
              : 'opacity-0 translate-y-5'
          }`}
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 leading-tight">
            Hey Era! Welcome to your <br /> ✨ Scrapbook Puzzle Adventure ✨
          </h1>
        </div>

        {/* Main Card (fast fade-out) */}
        <div
          className={`transition-all duration-500 ${
            showInitial
              ? !fadeOutAll
                ? 'opacity-100 translate-y-0 delay-150'
                : 'opacity-0 translate-y-5'
              : 'opacity-0 translate-y-5'
          }`}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 min-h-[200px] flex flex-col items-center justify-center">
            <div className="text-center w-full max-w-md">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-6">
                What is the answer?
              </h2>

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
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none transition-all duration-300 ${
                    isError
                      ? 'border-red-500 text-red-600 placeholder-red-400 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500 bg-white'
                  } ${isShaking ? 'animate-shake' : ''} ${
                    isCorrect ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />

                {isError && (
                  <p
                    id={errorId}
                    role="alert"
                    aria-live="polite"
                    className="text-red-500 text-sm"
                  >
                    That&apos;s not quite right. Try again!
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Instructions (fast fade-out) */}
        <div
          className={`text-center transition-all duration-500 ${
            showInitial
              ? !fadeOutAll
                ? 'opacity-100 translate-y-0 delay-300'
                : 'opacity-0 translate-y-5'
              : 'opacity-0 translate-y-5'
          }`}
        >
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            💡 Hint: Caesar would&apos;ve loved <br /> to celebrate your birthday!
          </p>
        </div>

        {/* Centered Congrats (no backdrop). Slower fade/scale-in, fast-ish exit */}
        {showCongrats && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            // Keep it accessible even without a backdrop
            role="dialog"
            aria-modal="true"
            aria-labelledby="congrats-title"
          >
            <div
              className={`transition-opacity transition-transform duration-700 ease-out ${
                congratsVisible
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 translate-y-2'
              }`}
            >
              <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-4xl sm:text-6xl mb-4">🎉✨🎉</div>
                  <h2
                    id="congrats-title"
                    className="text-2xl sm:text-3xl font-bold text-green-600 mb-4"
                  >
                    Correct!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    You know sometimes, I still find it weird to call you Esther HAHA!
                  </p>

                  <button
                    type="button"
                    onClick={navigateToPiano}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
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
