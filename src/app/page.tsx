'use client'
import { useState, FormEvent, useEffect, useRef } from 'react'

export default function Home() {
  const [input, setInput] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [showInitial, setShowInitial] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const correctAnswer = "42" // Change this to whatever answer you want

  // Trigger the initial fade-in and focus after component mounts
  useEffect(() => {
    setShowInitial(true)
    // Focus the input after a short delay to ensure it's visible
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  // Re-focus input after error state resets
  useEffect(() => {
    if (!isError && !isShaking) {
      inputRef.current?.focus()
    }
  }, [isError, isShaking])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (input.trim()) {
      if (input.trim().toLowerCase() === correctAnswer.toLowerCase()) {
        setIsCorrect(true)
      } else {
        setIsError(true)
        setIsShaking(true)
        // Reset everything after shake animation
        setTimeout(() => {
          setIsShaking(false)
          setIsError(false)
          setInput('')
        }, 600)
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      {/* Question and Input */}
      <div className={`flex flex-col items-center gap-6 transition-all duration-600 ${
        isCorrect 
          ? 'opacity-0 -translate-y-5' 
          : showInitial 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-5'
      }`}>
        <h1 className="text-4xl font-bold text-gray-800">
          What is the answer?
        </h1>
        
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter the answer and press Enter"
            autoFocus
            className={`px-4 py-2 border-2 rounded-lg text-lg focus:outline-none transition-all duration-300 ${
              isError 
                ? 'border-red-500 text-red-600 placeholder-red-400' 
                : 'border-gray-300 focus:border-blue-500'
            } ${isShaking ? 'animate-shake' : ''}`}
          />
        </form>
      </div>

      {/* Success Message */}
      <div className={`absolute transition-all duration-600 delay-300 ${
        isCorrect 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-5'
      }`}>
        <h1 className="text-4xl font-bold text-green-600">
          You got it right!
        </h1>
      </div>
    </div>
  )
}