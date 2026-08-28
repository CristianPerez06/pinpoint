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
  /**
   * The page draws to the edges of the glass, and clears the hardware itself.
   *
   * Without this the browser insets the whole document above the home indicator
   * and `env(safe-area-inset-*)` answers `0px` — so the declarations that clear
   * it are present, correct, and do nothing, which is the worst version of this
   * to debug. With it the insets become real numbers and every edge the
   * application draws on has to say what it does about them.
   *
   * Document-wide, so it is not a phone-layout setting. It is also why the
   * laptop bar takes horizontal safe-area padding: width alone sends a phone
   * held in landscape to that bar, and the notch is on its side there.
   */
  viewportFit: 'cover',
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
