'use client'

import { COLOUR, RADIUS, SPACE } from '@pinpoint/tokens'
import { useEffect } from 'react'

import { FailedState } from '@/app/_components/states'

/**
 * The last line of defence: something threw where nothing was expected to.
 *
 * This is not where a failed query lands — `@pinpoint/data` returns failure
 * rather than throwing, and the page renders that itself with the trip's name
 * still on screen. What reaches here is the unanticipated kind: a renderer that
 * could not start, a bug. So it says less and offers the one thing that
 * sometimes helps.
 *
 * Must be a client component; that is Next's contract for an error boundary.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Nowhere to send this yet. Without the log the digest is the only trace,
    // and a digest alone cannot be debugged.
    console.error(error)
  }, [error])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
      }}
    >
      <FailedState message="Something went wrong loading the map.">
        <button
          type="button"
          onClick={reset}
          style={{
            border: `1px solid ${COLOUR.danger}`,
            borderRadius: RADIUS.sm,
            background: COLOUR.surface,
            color: COLOUR.danger,
            padding: `${SPACE.xs}px ${SPACE.md}px`,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </FailedState>
    </div>
  )
}
