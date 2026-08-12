import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { figtree } from '@/app/fonts'

import './globals.css'

export const metadata: Metadata = {
  title: 'pinpoint',
  description: 'A map you can drop markers on.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  /**
   * Tells the browser the document is designed for both grounds, so the
   * address bar and any surface it draws follow the theme rather than staying
   * light around a dark page.
   */
  colorScheme: 'light dark',
}

/**
 * `figtree.variable`, not `figtree.className`.
 *
 * The class sets `font-family` on <html>, and the body rule in `globals.css`
 * overrides it for everything inside — leaving the text to match the face only
 * through CSS's case-insensitive family lookup, and dropping the metric-matched
 * fallback `next/font` generates to stop the page reflowing when the real file
 * lands. As a custom property it composes instead of competing.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
      <body>{children}</body>
    </html>
  )
}
