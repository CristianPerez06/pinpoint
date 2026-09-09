'use client'

import {
  type PlaceCandidate,
  type SearchBias,
  type SearchResult,
  searchPlaces,
} from '@pinpoint/geocode'
import { markerTypeOf } from '@pinpoint/map'
import { type CSSProperties, useEffect, useState } from 'react'

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

export type PlaceSearchProps =
  | { waiting: true }
  | ({ waiting?: false } & PlaceSearchLiveProps)

/**
 * The field, before there is anywhere for a result to go.
 *
 * Search needs nothing fetched in order to draw — the geocoder is its own
 * service and the query is typed. It is still inert, because choosing a result
 * opens the capture form against a trip that has not arrived, so the act this
 * begins cannot finish. That is the rule the specification states: inert until
 * the act can complete, not until the data lands.
 *
 * The same `<input>` with the same class, so the field keeps its width and its
 * place in the bar. `readOnly` rather than `disabled`, for the reason
 * `DESIGN.md` gives about the attribute: it stays reachable and is announced as
 * unavailable rather than vanishing from the tab order.
 */
export function PlaceSearch(props: PlaceSearchProps) {
  if (props.waiting) {
    return (
      <div className={styles.wrap}>
        <input
          type="search"
          value=""
          readOnly
          aria-disabled="true"
          placeholder="Search for a place…"
          aria-label="Search for a place"
          className={styles.input}
        />
      </div>
    )
  }
  return <PlaceSearchLive {...props} />
}

function PlaceSearchLive({
  biasRef,
  onChoose,
}: PlaceSearchLiveProps) {
  return <PlaceSearchInner biasRef={biasRef} onChoose={onChoose} />
}

export type PlaceSearchLiveProps = {
  /**
   * Read at query time rather than passed as a value, because the bias follows
   * the map and the selected city — and re-running the search every time
   * somebody nudged the map would be exactly the request storm the quiet period
   * exists to prevent.
   */
  biasRef: { current: () => SearchBias | undefined }
  onChoose: (candidate: PlaceCandidate) => void
}

function PlaceSearchInner({ biasRef, onChoose }: PlaceSearchLiveProps) {
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

  /**
   * Whether a request is actually on its way.
   *
   * A fact about the network, deliberately kept out of `result`'s derivation
   * below — which stays exactly as it was, for the reason `answer`'s own
   * comment gives. The two answer different questions and neither can answer the
   * other's: `answer`'s stamp knows whether what is shown corresponds to what
   * is typed, and only the timer knows whether anything has been asked.
   *
   * That distinction is the whole point. A request goes out `QUIET_PERIOD_MS`
   * after typing stops, so from the first keystroke until then the box is in a
   * state that reads as searching while nothing has been asked at all — and
   * that interval is unbounded, because it lasts as long as somebody keeps
   * typing. Anything claiming "this is nearly here" is false for most of the
   * time it would be on screen.
   */
  const [asking, setAsking] = useState(false)

  const trimmed = query.trim()
  const result = answer?.query === trimmed ? answer.result : null

  useEffect(() => {
    if (trimmed === '') return

    const controller = new AbortController()

    const timer = setTimeout(() => {
      setAsking(true)
      void searchPlaces(browserFetch, trimmed, {
        bias: biasRef.current(),
        signal: controller.signal,
      }).then((outcome) => {
        // A superseded query is dropped rather than displayed. The query that
        // superseded it is already showing as in progress, and reporting this
        // one would flash a stale answer on the way past.
        if (outcome.status === 'aborted') return
        setAsking(false)
        setAnswer({ query: trimmed, result: outcome })
      })
    }, QUIET_PERIOD_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
      // Whatever was on its way is not any more, and the effect that replaces
      // this one starts its own quiet period before asking again.
      setAsking(false)
    }
  }, [trimmed, biasRef])

  /**
   * The answer to the previous query, kept while a newer one is outstanding.
   *
   * Only when it found something. A stale `No matches` or a stale failure has
   * nothing worth keeping and would be read as the answer to what is now typed,
   * which is the thing the specification forbids; a list of places is different,
   * because every row still says truthfully what it is and choosing one still
   * gives the place named on it.
   *
   * What must never happen is this outliving the answer that supersedes it, so
   * it is derived from `answer` rather than stored — when a new answer lands it
   * matches the stamp, `result` stops being null, and this is null by
   * construction rather than by anybody remembering to clear it.
   */
  const pending =
    trimmed !== '' && result === null && answer?.result.status === 'ready'
      ? answer.result.candidates
      : null

  const candidates =
    result?.status === 'ready' ? result.candidates : (pending ?? [])

  /**
   * Nothing to say, so nothing is drawn.
   *
   * The panel used to open on the first keystroke, sized to the words
   * `Searching…`, and jump wider when rows arrived — up to about 180px of it,
   * because `.results` is `width: max-content` over a `min-width` of the field.
   * Waiting until there is something real to hold means the panel's first
   * appearance is already the width it keeps.
   *
   * An empty box closes it outright, whatever was found last. Choosing a
   * candidate clears the field and that is what dismisses the list — `answer`
   * outlives the query it answered, so without this the list a moment ago was
   * chosen from would stay open underneath an empty field.
   */
  const showing = trimmed !== '' && (result !== null || pending !== null || asking)

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

      {showing ? (
        <div className={styles.results}>
          {/*
            Above the list rather than in place of it, and outside the box that
            scrolls — `.scroll` carries the height cap, so a message inside it
            would slide away from the rows it is describing.

            Only once something has been asked. During the quiet period there is
            nothing to report, and the dimmed list below is already saying the
            true thing: what you are reading does not answer what you have now
            typed.
          */}
          {asking ? <Note role="status">Searching…</Note> : null}

          <div className={styles.scroll}>
          {result?.status === 'failed' ? (
            /* Never phrased as "no matches". Rephrasing a query at a service
               that is down is a way to spend five minutes learning nothing. */
            <Note role="alert" tone="danger">
              {result.message} You can still add a place by dropping a pin.
            </Note>
          ) : result?.status === 'empty' ? (
            <Note role="status">No matches. Try fewer words, or drop a pin.</Note>
          ) : candidates.length === 0 ? (
            /*
              Only once something has been asked. `showing` already withholds the
              whole panel through the quiet period, so this is the same rule
              stated where it is read rather than inferred two branches away.
            */
            asking ? (
              <Shells />
            ) : null
          ) : (
            <ul
              className={`${styles.list} ${pending !== null ? styles.superseded : ''}`}
              /*
                The list is still the previous query's answer. Marked rather
                than removed: every row says truthfully what it is, and taking
                them away is taking away the thing search exists to produce, one
                keystroke into refining it.
              */
              aria-busy={pending !== null || undefined}
            >
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
        </div>
      ) : null}
    </div>
  )
}

/**
 * The shape of the list that is coming, standing where it will stand.
 *
 * Built from `.candidate` itself rather than from a layout of its own, so it
 * picks up the 700px breakpoint the real row picks up — one line with the meta
 * on the right above it, two lines under one glyph below it — and cannot drift
 * from the thing it is standing in for. That is the entire trick, and it is why
 * the widths below are the only numbers here.
 *
 * `aria-hidden` on the group and nothing choosable inside it. A screen reader
 * gets the `Searching…` above, which is a sentence; three empty rows are not,
 * and grey blocks read as content that happens to be blank — the reading this
 * whole state exists to prevent.
 */
function Shells() {
  return (
    <ul className={styles.list} aria-hidden>
      {SHELL_ROWS.map((row) => (
        <li key={row.width}>
          <div
            className={`${styles.candidate} ${styles.shell}`}
            /*
              Handed over as custom properties rather than as a width, so the
              stylesheet picks between them at the breakpoint instead of having
              to override an inline rule it cannot outrank.
            */
            style={
              {
                '--shell-name-width': row.width,
                '--shell-name-share': row.share,
                '--shell-meta-width': row.meta,
              } as CSSProperties
            }
          >
            <span className={`${styles.glyph} ${styles.block}`} />
            <span className={styles.name}>
              <span className={`${styles.block} ${styles.blockName}`} />
            </span>
            <span className={styles.meta}>
              <span className={`${styles.block} ${styles.blockMeta}`} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Three rows, and three widths that are not the same.
 *
 * Three rather than eight. `DEFAULT_LIMIT` is a ceiling the geocoder rarely
 * reaches for a specific name — one to three is the ordinary answer — and a
 * panel that grows into its content reads better than one that collapses out of
 * it.
 *
 * Names of equal length read as a table rather than as a list of places, which
 * is the one thing this must not look like. In pixels rather than percentages
 * because above 700px `.name` is sized by its content, so a percentage would be
 * a share of nothing; these widths are what the panel is as wide as while it
 * waits.
 */
const SHELL_ROWS = [
  { width: '196px', share: '70%', meta: '54px' },
  { width: '268px', share: '88%', meta: '38px' },
  { width: '152px', share: '54%', meta: '66px' },
] as const

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
      style={{ backgroundColor: `var(--pp-pin-${definition.id})` }}
      aria-hidden
      title={definition.label}
    >
      <MarkerGlyph icon={definition.icon} size={14} />
    </span>
  )
}
