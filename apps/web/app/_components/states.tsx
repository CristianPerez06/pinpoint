import type { ReactNode } from 'react'

import styles from './states.module.css'

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
 */

/**
 * Still loading. Deliberately says so in words as well as motion: an animation
 * alone is indistinguishable from a stalled one, and this is the state most
 * often mistaken for emptiness.
 */
export function LoadingState({
  what = 'the map',
  bare = false,
}: {
  what?: string
  /**
   * Do not paint a ground of your own; something behind this already has.
   *
   * Used where the wait happens inside the map's own area, which is painted
   * `map-land` so that the space reads as the map before the map arrives.
   * Left to itself this panel would paint `surface-muted` over that, and the
   * screen would be a bar of chrome above a band of chrome — which is the
   * thing giving the area the map's ground was meant to prevent.
   */
  bare?: boolean
}) {
  return (
    <div className={`${styles.panel} ${bare ? '' : styles.loading}`}>
      <span aria-hidden className={styles.spinner} />
      <p role="status" className={styles.message}>
        Loading {what}…
      </p>
    </div>
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
    <div className={`${styles.panel} ${styles.failed}`}>
      <p role="alert" className={styles.failedMessage}>
        {message}
      </p>
      {children}
    </div>
  )
}

/**
 * Correctly showing nothing. Not an error, and styled so it does not read as
 * one.
 */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.panel} ${styles.empty}`}>
      <p className={styles.message}>{children}</p>
    </div>
  )
}

/**
 * A note laid over the map without replacing it.
 *
 * Used for the two cases where the map itself is fine and only the markers are
 * in question: a trip with nothing on it, and a trip whose markers would not
 * load. Both keep the map, because the map is still true — the tiles arrived,
 * the camera is real, and hiding it would throw away the part that worked.
 *
 * `tone` is the entire difference between them, and it has to be a difference
 * a person notices without reading: quiet for "nothing here yet", red for
 * "this is broken".
 */
export function MapOverlayNote({
  tone = 'muted',
  children,
}: {
  tone?: 'muted' | 'danger'
  children: ReactNode
}) {
  const danger = tone === 'danger'

  return (
    <div
      role={danger ? 'alert' : 'status'}
      className={`${styles.note} ${danger ? styles.noteDanger : ''}`}
    >
      {children}
    </div>
  )
}
