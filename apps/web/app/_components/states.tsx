import { COLOUR, RADIUS, SPACE } from '@pinpoint/tokens'
import type { CSSProperties, ReactNode } from 'react'

/**
 * The three things a screen can be doing other than showing a map: still
 * loading, broken, or correctly showing nothing.
 *
 * These are web components and they stay web components. The mobile app renders
 * the same three states from the same token values in its own idiom, and does
 * NOT import anything from here — sharing rendered markup is precisely what the
 * `styling` spec forbids, and a shared spinner is the rule's subject rather
 * than a shortcut past it.
 *
 * What is shared is the half that carries the bugs: the four-state result from
 * `@pinpoint/data`. Forgetting the failed branch, spinning forever, showing
 * "nothing saved yet" while a request is in flight — those are logic bugs,
 * identical on both platforms, and none of them live in a spinner.
 *
 * Styling is inline because this app has no styling system yet and inventing
 * one is a different change. Every value comes from `@pinpoint/tokens`; nothing
 * here writes a colour of its own.
 */

const panel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: `${SPACE.sm}px`,
  padding: `${SPACE.xl}px`,
  textAlign: 'center',
  color: COLOUR.text,
}

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...panel, ...style }}>{children}</div>
}

/**
 * Still loading. Deliberately says so in words as well as motion: an animation
 * alone is indistinguishable from a stalled one, and this is the state most
 * often mistaken for emptiness.
 */
export function LoadingState({ what = 'the map' }: { what?: string }) {
  return (
    <Panel style={{ backgroundColor: COLOUR.surfaceMuted }}>
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          borderRadius: RADIUS.pill,
          border: `2px solid ${COLOUR.border}`,
          borderTopColor: COLOUR.textMuted,
          animation: 'pinpoint-spin 0.8s linear infinite',
        }}
      />
      <p role="status" style={{ color: COLOUR.textMuted }}>
        Loading {what}…
      </p>
      {/* A keyframe has to exist somewhere and this app has no stylesheet. */}
      <style>{'@keyframes pinpoint-spin { to { transform: rotate(360deg) } }'}</style>
    </Panel>
  )
}

/**
 * Broken. Never phrased as emptiness — "you have not saved anything yet" and
 * "this is broken" are not the same message, and nobody can tell them apart
 * from an empty map on their own.
 */
export function FailedState({
  message,
  children,
}: {
  message: string
  children?: ReactNode
}) {
  return (
    <Panel
      style={{
        backgroundColor: COLOUR.dangerSurface,
        border: `1px solid ${COLOUR.danger}`,
        borderRadius: `${RADIUS.md}px`,
      }}
    >
      <p role="alert" style={{ color: COLOUR.danger, fontWeight: 600 }}>
        {message}
      </p>
      {children}
    </Panel>
  )
}

/**
 * Correctly showing nothing. Not an error, and styled so it does not read as
 * one.
 */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Panel style={{ backgroundColor: COLOUR.surface }}>
      <p style={{ color: COLOUR.textMuted }}>{children}</p>
    </Panel>
  )
}
