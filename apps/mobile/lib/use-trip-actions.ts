import type { FieldErrors, IsoDay, Trip, TripMember } from '@pinpoint/core'
import { fetchTrips, inviteMember, removeMember, updateTrip } from '@pinpoint/data'
import { message, type Message } from '@pinpoint/wording'
import { useState } from 'react'

import { supabase } from '@/lib/supabase'
import type { Query } from '@/lib/use-query'

/**
 * Everything the trip's own sheet does, for whichever screen is wearing it.
 *
 * It lives here because there are two of those screens now. These writes were
 * inside `trip-workspace.tsx` while the map was the only thing showing a trip's
 * name, and copying them onto the calendar would have meant two renames, two
 * archives and two opinions about where a restored trip goes back in the list —
 * which agree on the day they are written and not afterwards. The laptop reached
 * the same conclusion first, in `apps/web/app/_components/use-trip-actions.ts`.
 *
 * **What is not here is the state.** Each screen keeps its own lists and hands
 * them in, because each reads them through its own `useQuery` and that is how a
 * re-read reaches them. Moving ownership here would put one screen's freshness
 * behind another screen's hook for no gain. What moved is the writes.
 *
 * The one thing genuinely different between the screens is where choosing a trip
 * goes, and that is not here either: on this platform choosing a trip is a
 * `setState` above both screens (`lib/trip-choice.tsx`) rather than an address,
 * so each screen passes the chosen id on and decides for itself whether to stay.
 */
export interface TripActionsInput {
  /** The trip being looked at. Only this one can be renamed, dated or archived. */
  trip: Trip
  /** The trips this screen is showing, and the way it changes them. */
  trips: Query<Trip>
  /** The members list, which an invitation appends to. */
  members: Pick<Query<TripMember>, 'set'>
  /**
   * A refusal with no field to land on, said wherever this screen says such
   * things — and `null` to take back whatever it last said.
   *
   * Every write below is optimistic, so this is the only thing that can explain
   * a change that went back. Each of them clears first: a refusal still on screen
   * from the previous attempt would otherwise read as this one's answer.
   *
   * A name rather than a sentence, resolved only where it is drawn, so a refusal
   * already on screen follows the language when it changes instead of staying
   * in the one it was said in.
   */
  report: (problem: Message | null) => void
}

export interface TripActions {
  /** Archived trips, or null while nobody has asked for them. */
  archived: readonly Trip[] | null
  renameTrip: (name: string) => Promise<void>
  setTripDates: (dates: {
    startsOn: IsoDay | null
    endsOn: IsoDay | null
  }) => Promise<FieldErrors>
  setTripArchived: (tripId: string, value: boolean) => Promise<void>
  revealArchived: () => Promise<void>
  invite: (
    displayName: string,
    email: string,
  ) => Promise<{ field: string; reason: Message } | null>
  /** Take back an invitation nobody has claimed. Resolves to a named refusal, or null. */
  removeInvitation: (member: TripMember) => Promise<Message | null>
}

export function useTripActions({
  trip,
  trips,
  members,
  report,
}: TripActionsInput): TripActions {

  /**
   * Archived trips, once somebody asks. Null until then.
   *
   * Null rather than an empty array, because "nobody has asked" and "there are
   * none" are different answers and only one of them is worth a row saying so.
   *
   * Deliberately not part of `trips`. That list is what the switcher offers and
   * archived trips are the ones it must not, so keeping them apart is what makes
   * it impossible for a reveal to leak one back into the sheet.
   */
  const [archived, setArchived] = useState<readonly Trip[] | null>(null)

  /**
   * Renaming the trip, into the one place the trips are held.
   *
   * Each screen resolves the trip it is showing out of that list, so writing
   * here is what makes the header, the trips sheet and the picker follow at once
   * — they all read the same rows and there is no second copy for one of them to
   * be showing.
   */
  async function renameTrip(name: string) {
    report(null)

    const previous = trips.rows
    trips.set((rows) =>
      rows.map((each) => (each.id === trip.id ? { ...each, name } : each)),
    )

    const outcome = await updateTrip(supabase, trip.id, { name })
    if (!outcome.ok) {
      trips.set(() => previous)
      report(
        outcome.kind === 'rejected'
          ? outcome.reason
          : message('tripActions.renameFailed'),
      )
      return
    }
    const saved = outcome.data
    trips.set((rows) => rows.map((each) => (each.id === saved.id ? saved : each)))
  }

  /**
   * Set, change or clear the dates the trip runs between.
   *
   * Both dates go in one write, because the rule that an end date may not fall
   * before the start is about the pair. Sending them one at a time would make a
   * legal pair unreachable: moving a trip a week later would have to pass
   * through a moment where the new start is after the old end.
   *
   * Returns the offending field rather than reporting it, because "the end date
   * cannot be before the start date" belongs against the field it is about. A
   * refusal with no field still goes to `report`.
   */
  async function setTripDates(dates: {
    startsOn: IsoDay | null
    endsOn: IsoDay | null
  }): Promise<FieldErrors> {
    report(null)

    const previous = trips.rows
    trips.set((rows) =>
      rows.map((each) => (each.id === trip.id ? { ...each, ...dates } : each)),
    )

    const outcome = await updateTrip(supabase, trip.id, dates)
    if (!outcome.ok) {
      trips.set(() => previous)
      if (outcome.kind === 'invalid-input') return outcome.fieldErrors
      report(
        outcome.kind === 'rejected'
          ? outcome.reason
          : message('tripActions.datesFailed'),
      )
      return {}
    }

    const saved = outcome.data
    trips.set((rows) => rows.map((each) => (each.id === saved.id ? saved : each)))
    return {}
  }

  /**
   * Archive a trip, or put one back.
   *
   * The same write as a rename underneath — one column on one row — so it takes
   * the same shape here: say it happened, and put it back if the database
   * refuses. What it does not do is ask first. Archiving is reversible by any
   * member, and a confirmation on a reversible action trains people to dismiss
   * confirmations on the ones that are not.
   *
   * Dropping the trip from the list is what moves the person off one they just
   * archived: the resolver upstream falls through to the first remaining trip —
   * or to the no-trips state, which is the screen where a first trip is made.
   * That fall-through already existed for a trip left behind by other means;
   * archiving simply arrives at it by a new route.
   *
   * A restore is asked for again rather than written, because the row being put
   * back is not in the list to be edited — it is in the archived reveal, which
   * this list has never held.
   */
  async function setTripArchived(tripId: string, value: boolean) {
    report(null)

    const outcome = await updateTrip(supabase, tripId, { archived: value })
    if (!outcome.ok) {
      report(
        outcome.kind === 'rejected'
          ? outcome.reason
          : message(value ? 'tripActions.archiveFailed' : 'tripActions.restoreFailed'),
      )
      return
    }
    // Dropped rather than kept in step: the reveal is re-read from the database
    // the next time it is asked for, so a restored trip cannot linger in it.
    setArchived(null)

    if (value) trips.set((rows) => rows.filter((each) => each.id !== tripId))
    else void trips.refetch({ force: true })
  }

  /**
   * Archived trips, once somebody asks. Null until then.
   *
   * A read rather than a write, and treated like one anyway: the press has to
   * be answered. Until this returned, the row was unchanged and pressing it
   * again fired a second fetch — the clearest press-that-does-nothing in either
   * application. What fills the gap while it loads is a separate question.
   */
  async function revealArchived() {
    report(null)

    const state = await fetchTrips(supabase, { includeArchived: true })
    if (state.status === 'failed') {
      report(state.reason)
      return
    }
    const all = state.status === 'ready' ? state.data : []
    setArchived(all.filter((each) => each.archived))
  }

  /**
   * Add somebody to the trip.
   *
   * Returns the offending field rather than setting a message here, because the
   * sheet that called it is what has to mark it up — a duplicate address is a
   * fact about the email box, not about the trip.
   */
  async function invite(displayName: string, email: string) {
    const outcome = await inviteMember(supabase, {
      tripId: trip.id,
      displayName,
      email,
    })

    if (!outcome.ok) {
      if (outcome.kind === 'invalid-input') {
        // A field error with no field is not supposed to happen — every schema
        // here paths its issues — so the fallback names the generic refusal
        // rather than inventing a sentence for a case nothing produces.
        const refused = Object.entries(outcome.fieldErrors)[0]
        return refused === undefined
          ? { field: '_', reason: message('member.inviteFailed') }
          : { field: refused[0], reason: refused[1] }
      }
      return { field: '_', reason: outcome.reason }
    }

    members.set((rows) => [...rows, outcome.data])
    return null
  }

  /**
   * Take back an invitation nobody has claimed.
   *
   * Not optimistic, and the reason is the one refusal that matters: that person
   * signed in while the sheet was open, so the row is a membership now and the
   * delete matched nothing. Taking it off the list first would hide somebody
   * who is genuinely on the trip.
   */
  async function removeInvitation(member: TripMember) {
    const outcome = await removeMember(supabase, member.id)
    if (!outcome.ok) {
      return outcome.kind === 'invalid-input'
        ? message('member.removeFailed')
        : outcome.reason
    }

    members.set((rows) => rows.filter((each) => each.id !== member.id))
    return null
  }

  return {
    archived,
    renameTrip,
    setTripDates,
    setTripArchived,
    revealArchived,
    invite,
    removeInvitation,
  }
}
