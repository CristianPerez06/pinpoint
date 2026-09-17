/**
 * What a read of trip data is currently doing, or what it produced.
 *
 * Four cases, and the reason there are four rather than three is the whole
 * point of this file. A trip with no markers and a trip whose markers have not
 * arrived render identically — an empty map — and so does a trip whose query
 * failed. "You have not saved anything yet" and "this is broken" are not the
 * same message, and a person cannot tell them apart on their own.
 *
 * Collapsing `empty` into `ready` with an empty array is the mistake this shape
 * exists to prevent: every caller then has to remember to check `.length`, and
 * the one that forgets shows "nothing here yet" while a request is in flight.
 *
 * This is the half worth sharing between platforms. Forgetting the failed
 * branch, spinning forever because a state never resolves, showing emptiness
 * during a load — those are logic bugs, they are identical on web and native,
 * and they all live here. The spinner is not where things go wrong, which is
 * why no component is shared: each application renders these four states in its
 * own idiom, from the same token values.
 */
export type QueryState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'empty' }
  | { status: 'failed'; message: string }

/**
 * What a query function can return. `loading` is a state a caller holds before
 * the promise settles, never something a settled promise resolves to — a
 * function cannot return "still working".
 */
export type SettledQueryState<T> = Exclude<QueryState<T>, { status: 'loading' }>

/**
 * What a re-read did, reported to whoever asked for it.
 *
 * Three cases rather than a boolean, because "did not read" and "tried and
 * failed" are different answers and only one of them is worth saying out loud.
 * A trigger nobody pressed ignores all three; a control somebody pressed cares
 * about exactly one.
 *
 * `declined` covers both ways a read can not happen: the floor below said it
 * was too soon, and the answer arrived for a screen that had moved on. Neither
 * is a failure and neither is worth reporting. It cannot come back from a
 * forced read, which is the only kind a person asks for — so the control that
 * reports a failure never has to explain a read that did not happen.
 *
 * Shared because both applications hold the same three answers behind different
 * machinery: web reads a list per hook, the phone holds a query per list. What
 * a re-read *did* is the same question on either.
 */
export type ReadOutcome = 'read' | 'declined' | 'failed'

export const LOADING: QueryState<never> = { status: 'loading' }

/** A non-empty result. Prefer `readyOrEmpty` for anything list-shaped. */
export function ready<T>(data: T): SettledQueryState<T> {
  return { status: 'ready', data }
}

export function empty(): SettledQueryState<never> {
  return { status: 'empty' }
}

export function failed(message: string): SettledQueryState<never> {
  return { status: 'failed', message }
}

/**
 * Route a list to `ready` or `empty` so no caller has to remember which one an
 * empty array means.
 */
export function readyOrEmpty<T>(rows: readonly T[]): SettledQueryState<readonly T[]> {
  return rows.length === 0 ? empty() : ready(rows)
}

/**
 * How long a list stays fresh enough not to be read again.
 *
 * The floor belongs to the **list**, not to whatever asked. There is more than
 * one trigger — coming back to the application, opening the surface that shows a
 * list — and a floor held beside each listener lets a return read the trips and
 * the trips sheet read them again two seconds later, because neither knows the
 * other ran.
 *
 * This is not a cache and nothing here stores an answer. It declines to read;
 * what stays on screen is what was already there. A cache's job is to answer
 * with something older than the truth, which is the defect this whole mechanism
 * exists to fix.
 *
 * Ten seconds because what it defends against is flapping — a tab switched to
 * and away, a phone unlocked and immediately locked, a sheet opened straight
 * after a return. All of those sit well inside it, and somebody who leaves to
 * read a message and comes back to keep planning sits well outside it.
 *
 * A read a person explicitly asked for ignores this. Somebody pressed
 * something, and a control that declines because a read happened eight seconds
 * ago is a control that looks broken.
 */
export const FRESH_FOR_MS = 10_000
