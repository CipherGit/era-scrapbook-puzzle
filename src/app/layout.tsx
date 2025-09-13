import './globals.css'
import type { Metadata } from 'next'
import { nunito } from './fonts'   // ✅ from fonts.ts (server-safe)

export const metadata: Metadata = {
  title: 'Scrapbook Puzzle Adventure',
  description: 'A cute scrapbook-style puzzle',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Body uses Nunito by default */}
      <body className={nunito.className}>{children}</body>
    </html>
  )
}
