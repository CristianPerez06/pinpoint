import type { LngLat } from './types'

/** A position as the device reports it, with its uncertainty in metres where known. */
export interface Fix extends LngLat {
  accuracy: number | null
}

/** How one press of "where am I" ended. `finding` and `idle` are the hook's, not this. */
export type LocateOutcome =
  | { status: 'found'; fix: Fix }
  | { status: 'refused' }
  | { status: 'notFound' }

/**
 * How long a press waits for a position before saying it could not find one
 * (`device-location`: an attempt ends after a bounded wait). Long enough for a
 * cold fix outdoors, short enough that indoors fails visibly rather than
 * spinning.
 */
export const LOCATE_TIMEOUT_MS = 15_000

/**
 * Thrown by a platform's `currentPosition` when it learns of a refusal only by
 * asking for a position — a browser has no separate permission request, so
 * its prompt and its refusal both arrive through the position call.
 */
export class LocationRefused extends Error {
  constructor() {
    super('location permission was refused')
    this.name = 'LocationRefused'
  }
}

/**
 * One attempt to find the person, with the platform handed in.
 *
 * Here rather than in either application because both make the same three
 * decisions and each hands in only its own platform — the phone's
 * `expo-location`, the laptop's `navigator.geolocation`. This package still
 * imports neither.
 *
 * Kept apart from the hooks so the decisions — which failure is a refusal and
 * which is a missing position, and that the wait is bounded — can be tested
 * without a device. The two failures are told apart because their fixes
 * differ: a refusal is undone in Settings, a missing position by trying again.
 *
 * `askPermission` asks only when the platform still can; once refused, the
 * platform answers without a prompt, which is what lets a later press show the
 * refusal again, and lets a permission granted since in Settings simply work.
 */
export async function locate(platform: {
  askPermission: () => Promise<boolean>
  currentPosition: () => Promise<Fix>
  timeoutMs?: number
}): Promise<LocateOutcome> {
  let granted: boolean
  try {
    granted = await platform.askPermission()
  } catch {
    return { status: 'notFound' }
  }
  if (!granted) return { status: 'refused' }

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), platform.timeoutMs ?? LOCATE_TIMEOUT_MS)
  })
  try {
    // A thrown position is "not found" too: location services switched off
    // arrive as an error, and the person's fix for that is the same as for
    // no signal — try again once it is on.
    const fix = await Promise.race([platform.currentPosition(), timeout])
    return fix === null ? { status: 'notFound' } : { status: 'found', fix }
  } catch (error) {
    return error instanceof LocationRefused ? { status: 'refused' } : { status: 'notFound' }
  } finally {
    clearTimeout(timer)
  }
}
