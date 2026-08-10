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
