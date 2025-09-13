import { Nunito, Caveat } from 'next/font/google'

export const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400','600','700'],
})

export const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400','700'], // ← add 400 so we can use font-normal
})
