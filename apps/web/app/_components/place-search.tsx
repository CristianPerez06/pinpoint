'use client'

import {
  type PlaceCandidate,
  type SearchBias,
  type SearchResult,
  searchPlaces,
} from '@pinpoint/geocode'
import { markerTypeOf } from '@pinpoint/map'
import { COLOUR, RADIUS, SPACE } from '@pinpoint/tokens'
import { useEffect, useState } from 'react'

/**
 * Finding a place by name.
 *
 * The geocoder's public instance throttles heavy use and gives no availability
 * guarantee, so this asks for as little as it can: one request after typing
 * pauses rather than one per keystroke, and every superseded request is
 * cancelled rather than left to land.
 *
 * The three states this renders are the point. Searching, matching nothing, and
 * being unable to search look the same on a blank list and mean completely
 * different things — only one of them means the person should try other words.
 */

/**
 * How long typing must pause before a request goes out.
 *
 * Long enough that a typed word is one request rather than six; short enough
 * that it does not feel like a submit button. Tuned by using it.
 */
const QUIET_PERIOD_MS = 300

/**
 * `fetch` wrapped rather than passed directly.
 *
 * A bare `globalThis.fetch` detached from its receiver throws "Illegal
 * invocation" in a browser. The package takes a function, so wrapping it here
 * costs nothing and removes the question.
 */
const browserFetch = (url: string, init?: { signal?: AbortSignal }) =>
  fetch(url, init)

export function PlaceSearch({
  biasRef,
  onChoose,
}: {
  /**
   * Read at query time rather than passed as a value, because the bias follows
   * the map and the selected city — and re-running the search every time
   * somebody nudged the map would be exactly the request storm the quiet period
   * exists to prevent.
   */
  biasRef: { current: () => SearchBias | undefined }
  onChoose: (candidate: PlaceCandidate) => void
}) {
  const [query, setQuery] = useState('')
  /**
   * The last answer, stamped with the query it answered.
   *
   * Stamped rather than stored bare, because that is what lets "still searching"
   * be *derived* — it is simply the state of having no answer for what is
   * currently typed. Tracking it as its own flag means two pieces of state that
   * can disagree, and the render where they do is a box claiming to have found
   * nothing before it has looked.
   */
  const [answer, setAnswer] = useState<{ query: string; result: SearchResult } | null>(
    null,
  )

  const trimmed = query.trim()
  const result = answer?.query === trimmed ? answer.result : null
  const searching = trimmed !== '' && result === null

  useEffect(() => {
    if (trimmed === '') return

    const controller = new AbortController()

    const timer = setTimeout(() => {
      void searchPlaces(browserFetch, trimmed, {
        bias: biasRef.current(),
        signal: controller.signal,
      }).then((outcome) => {
        // A superseded query is dropped rather than displayed. The query that
        // superseded it is already showing as in progress, and reporting this
        // one would flash a stale answer on the way past.
        if (outcome.status === 'aborted') return
        setAnswer({ query: trimmed, result: outcome })
      })
    }, QUIET_PERIOD_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, biasRef])

  const candidates =
    result?.status === 'ready' ? result.candidates : ([] as PlaceCandidate[])

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 420 }}>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for a place…"
        aria-label="Search for a place"
        style={{
          boxSizing: 'border-box',
          width: '100%',
          padding: `${SPACE.xs}px ${SPACE.sm}px`,
          border: `1px solid ${COLOUR.border}`,
          borderRadius: RADIUS.sm,
          backgroundColor: COLOUR.surface,
          color: COLOUR.text,
          fontSize: 14,
          fontFamily: 'inherit',
        }}
      />

      {trimmed !== '' ? (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: SPACE.xs,
            maxHeight: 320,
            overflowY: 'auto',
            backgroundColor: COLOUR.surface,
            border: `1px solid ${COLOUR.border}`,
            borderRadius: RADIUS.md,
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.18)',
            zIndex: 4,
          }}
        >
          {searching ? (
            <Note role="status">Searching…</Note>
          ) : result?.status === 'failed' ? (
            /* Never phrased as "no matches". Rephrasing a query at a service
               that is down is a way to spend five minutes learning nothing. */
            <Note role="alert" tone="danger">
              {result.message} You can still add a place by dropping a pin.
            </Note>
          ) : result?.status === 'empty' ? (
            <Note role="status">No matches. Try fewer words, or drop a pin.</Note>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {candidates.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChoose(candidate)
                      // Clearing the box is what dismisses the list; there is
                      // nothing else to close.
                      setQuery('')
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: SPACE.sm,
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: COLOUR.text,
                      padding: `${SPACE.sm}px ${SPACE.md}px`,
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  >
                    <span aria-hidden>{markerTypeOf(candidate.typeGuess).icon}</span>
                    <span>{candidate.name}</span>
                    {candidate.context ? (
                      <span
                        style={{
                          marginLeft: 'auto',
                          color: COLOUR.textMuted,
                          fontSize: 12,
                        }}
                      >
                        {candidate.context}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Note({
  children,
  role,
  tone = 'muted',
}: {
  children: React.ReactNode
  role: 'status' | 'alert'
  tone?: 'muted' | 'danger'
}) {
  return (
    <p
      role={role}
      style={{
        margin: 0,
        padding: `${SPACE.sm}px ${SPACE.md}px`,
        fontSize: 13,
        color: tone === 'danger' ? COLOUR.danger : COLOUR.textMuted,
      }}
    >
      {children}
    </p>
  )
}
