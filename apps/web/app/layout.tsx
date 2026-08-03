import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'pinpoint',
  description: 'A map you can drop markers on.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// No styling by design. The skeleton exists to prove workspace resolution, and
// the styling strategy is specified but deliberately unbuilt — see
// openspec/specs/styling once this change is archived.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
