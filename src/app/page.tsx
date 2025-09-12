'use client'
import { useState, FormEvent, useEffect } from 'react'

export default function Home() {
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showInitial, setShowInitial] = useState(false)

  // Trigger the initial fade-in after component mounts
  useEffect(() => {
    setShowInitial(true)
  }, [])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (name.trim()) {
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      {/* Question and Input */}
      <div className={`flex flex-col items-center gap-6 transition-all duration-600 ${
        submitted 
          ? 'opacity-0 -translate-y-5' 
          : showInitial 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-5'
      }`}>
        <h1 className="text-4xl font-bold text-gray-800">
          What is your name?
        </h1>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name and press Enter"
            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
          />
        </form>
      </div>

      {/* Greeting */}
      <div className={`absolute transition-all duration-600 delay-300 ${
        submitted 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-5'
      }`}>
        <h1 className="text-4xl font-bold text-green-600">
          Hello, {name}!
        </h1>
      </div>
    </div>
  )
}