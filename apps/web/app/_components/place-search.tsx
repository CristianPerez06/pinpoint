'use client'

import {
  type PlaceCandidate,
  type SearchBias,
  type SearchResult,
  searchPlaces,
} from '@pinpoint/geocode'
import { markerTypeOf } from '@pinpoint/map'
import { useEffect, useState } from 'react'

import { MarkerGlyph } from '@/app/_components/marker-icon'

import styles from './place-search.module.css'

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

/**
 * Beyond this, a candidate is marked as far away.
 *
 * Chosen from a real list rather than from theory: running thirty-five Osaka
 * places through the geocoder, every correct match landed within 17 km and the
 * nearest wrong one was 270 km. Anything in that gap separates them.
 *
 * The mark means "not near where you are working", not "wrong". A Hiroshima
 * result while planning Osaka is 280 km and genuinely is far. And because this
 * only ever changes emphasis — nothing is filtered or reordered — being wrong
 * about the number costs a misplaced highlight and never a missing result.
 */
const FAR_AWAY_KM = 100

/**
 * A distance, at a precision that suits its size.
 *
 * Under 10 km a tenth matters, because that is the difference between the right
 * temple and the one across the river. At four figures it is noise.
 */
function formatDistance(km: number): string {
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString('en')} km`
}

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
    <div className={styles.wrap}>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for a place…"
        aria-label="Search for a place"
        className={styles.input}
      />

      {trimmed !== '' ? (
        <div
          className={styles.results}
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
            <ul className={styles.list}>
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
                    className={styles.candidate}
                  >
                    <Glyph candidate={candidate} />
                    <span className={styles.name}>{candidate.name}</span>

                    <span className={styles.meta}>
                      {candidate.context ? (
                        <span className={styles.context}>{candidate.context}</span>
                      ) : null}

                      {/*
                        The distance, which is the whole point. A query carrying
                        a note — "Parque Suigetsu", "Barrio Shinsekai" — matches
                        a real place of a similar name on another continent and
                        arrives looking exactly like a correct result. The name
                        cannot tell them apart; this can.

                        Shown, never used to filter. A place a few hundred
                        kilometres away is an ordinary thing to save.
                      */}
                      {candidate.distanceKm === null ? null : (
                        <span
                          className={`${styles.distance} ${
                            candidate.distanceKm > FAR_AWAY_KM ? styles.far : ''
                          }`}
                        >
                          {formatDistance(candidate.distanceKm)}
                        </span>
                      )}
                    </span>
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
      className={`${styles.note} ${tone === 'danger' ? styles.noteDanger : ''}`}
    >
      {children}
    </p>
  )
}

/**
 * The guessed type, drawn as the pin it would become.
 *
 * The guess is worth showing before anything is saved: it is what the form will
 * default to, and correcting it in the list is cheaper than noticing later that
 * a ramen shop is filed as a temple.
 */
function Glyph({ candidate }: { candidate: PlaceCandidate }) {
  const definition = markerTypeOf(candidate.typeGuess)

  return (
    <span
      className={styles.glyph}
      style={{ backgroundColor: `var(--pp-family-${definition.family})` }}
      aria-hidden
      title={definition.label}
    >
      <MarkerGlyph icon={definition.icon} size={14} />
    </span>
  )
}
