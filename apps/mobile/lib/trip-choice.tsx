import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Which trip is being read, for as long as the application is running.
 *
 * WHY THIS IS NOT IN A SCREEN ANY MORE
 *
 * It was `useState` inside `app/index.tsx`, which was correct while the map was
 * the only signed-in screen: the choice belonged to the screen that offered it.
 * The calendar is a second screen that shows one trip, and a choice held inside
 * the map cannot be read by it — so the calendar would have had to be told which
 * trip by whoever pushed it, and choosing a different trip from the calendar
 * could not have reached back into the map at all. Going back would then have
 * restored the trip somebody had just left, silently, which is the failure
 * `trip-calendar` states as a requirement rather than leaving to be discovered.
 *
 * One fact, one owner, above both screens.
 *
 * WHY IT IS STILL NOT REMEMBERED BETWEEN LAUNCHES
 *
 * Deliberately session memory, not `lib/preferences.tsx`. Persisting it is a
 * different behaviour with its own unanswered questions — what a stored id means
 * once that trip is archived, or once the membership behind it is revoked — and
 * `preferences.tsx` says in as many words that whoever adds the key answers them.
 * That is #128, and this is not it.
 *
 * WHY NULL IS A VALUE RATHER THAN A GAP
 *
 * Null means "whichever trip is first", resolved against the list every time it
 * is read rather than seeded from a query. Seeding state from a query result is
 * the pattern the React linter rejected in the interest change: a later read can
 * replace a choice somebody has just made. Nothing here copies the list, so
 * nothing here can go stale against it.
 */
interface TripChoiceState {
  /** The trip chosen, or null for "whichever the list gives first". */
  chosenTripId: string | null
  chooseTrip: (tripId: string) => void
}

const Context = createContext<TripChoiceState | null>(null)

export function TripChoiceProvider({ children }: { children: ReactNode }) {
  const [chosenTripId, setChosenTripId] = useState<string | null>(null)

  const value = useMemo(
    () => ({ chosenTripId, chooseTrip: setChosenTripId }),
    [chosenTripId],
  )

  return <Context value={value}>{children}</Context>
}

/**
 * Throws outside the provider rather than defaulting to null.
 *
 * A plausible fallback here would be two screens each holding their own idea of
 * which trip is open, which is the exact defect this file exists to remove —
 * and it would look like it worked until somebody switched trips.
 */
export function useTripChoice(): TripChoiceState {
  const state = useContext(Context)
  if (state === null) {
    throw new Error('useTripChoice used outside TripChoiceProvider')
  }
  return state
}
