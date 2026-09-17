'use client'

import type { FieldErrors, Trip, TripMember } from '@pinpoint/core'
import { fetchTrips, inviteMember, updateTrip } from '@pinpoint/data'
import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useState } from 'react'

import type { TripBarLiveProps } from '@/app/_components/trip-bar'
import type { createClient } from '@/lib/supabase/client'

/**
 * Everything the trip's own menu does, for whichever screen is wearing the bar.
 *
 * It lives here because there are two of those screens now. The writes were
 * inside the workspace when the map was the only thing carrying `TripBar`, and
 * copying them onto the calendar would have meant two renames, two archives and
 * two definitions of what order a restored trip goes back into the list in —
 * which agree on the day they are written and not afterwards.
 *
 * **What is not here is the state.** Each screen keeps its own list of trips and
 * its own list of members, and hands the setters in. That is deliberate: the map
 * holds both through `useRows`, which is how a re-read reaches them, and moving
 * ownership here would have put the map's freshness machinery behind a second
 * component for no reason. What moved is only the writes, unchanged.
 *
 * The two things that genuinely differ by screen are addresses, and both are
 * asked for rather than assumed: where choosing a trip goes, and where
 * archiving the open one leaves to.
 */
export type TripActionsInput = {
  supabase: ReturnType<typeof createClient>
  /** The trip being looked at. Only this one can be renamed or archived. */
  trip: Trip
  trips: readonly Trip[]
  setTrips: Dispatch<SetStateAction<readonly Trip[]>>
  setMembers: Dispatch<SetStateAction<readonly TripMember[]>>
  /**
   * A refusal with no field to land on, said wherever this screen says such
   * things — and `null` to take back whatever it last said.
   *
   * Every write below is optimistic, so this is the only thing that can explain
   * a change that went back. Each of them clears first: a refusal still on
   * screen from the previous attempt would otherwise read as this one's answer.
   */
  report: (message: string | null) => void
  /** Where choosing a trip from the switcher goes. */
  addressOfTrip: (tripId: string) => string
  /** Where archiving the open trip leaves to, once the write succeeds. */
  addressAfterArchive: string
}

/** The positions of `TripBar` that are the same on every screen. */
export type TripActions = Pick<
  TripBarLiveProps,
  | 'onSelect'
  | 'onRename'
  | 'onSetDates'
  | 'archived'
  | 'onRevealArchived'
  | 'onArchive'
  | 'onRestore'
  | 'onInvite'
>

export function useTripActions({
  supabase,
  trip,
  trips,
  setTrips,
  setMembers,
  report,
  addressOfTrip,
  addressAfterArchive,
}: TripActionsInput): TripActions {
  const router = useRouter()

  /**
   * Archived trips, once somebody asks. Null until then.
   *
   * Null rather than an empty array, because "nobody has asked" and "there are
   * none" are different answers and only one of them is worth a line saying so.
   *
   * Deliberately not part of `trips`. That list is what the switcher offers and
   * archived trips are the ones it must not, so keeping them apart is what makes
   * it impossible for a reveal to leak one back into the menu.
   */
  const [archived, setArchived] = useState<readonly Trip[] | null>(null)

  /**
   * Move to another trip.
   *
   * A navigation rather than a state change, because everything scoped to a
   * trip was fetched on the server for one. Reaching for the URL means the
   * server re-reads the new trip, and it means the choice survives a reload and
   * can be linked.
   *
   * **Where it navigates to is the screen's answer, not this file's**, and both
   * of them drop everything scoped to the trip being left: the map's address
   * carries no city, and the calendar's carries no day. A city id belongs to the
   * trip it was created under and a day from one trip means nothing in another.
   */
  function selectTrip(nextTripId: string) {
    if (nextTripId === trip.id) return
    router.replace(addressOfTrip(nextTripId))
    router.refresh()
  }

  /**
   * Renaming the trip, into the one place the trips are held.
   *
   * The name shown in the bar is resolved out of that list, so writing here is
   * what makes the name and the picker follow together. They used to be two
   * values, and a rename reported success while leaving the old name in the
   * picker.
   */
  async function renameTrip(name: string) {
    report(null)

    const previous = trips
    setTrips((rows) =>
      rows.map((each) => (each.id === trip.id ? { ...each, name } : each)),
    )

    const outcome = await updateTrip(supabase, trip.id, { name })
    if (!outcome.ok) {
      setTrips(previous)
      report(
        outcome.kind === 'rejected' ? outcome.message : 'Could not rename this trip.',
      )
      return
    }
    const saved = outcome.data
    setTrips((rows) => rows.map((each) => (each.id === saved.id ? saved : each)))
  }

  /**
   * Set or clear the dates a trip runs between.
   *
   * Optimistic like the rename above, and refused the same way — except that
   * this write has a rejection somebody can act on. An end before a start is a
   * field error, so it is handed back to the control that asked rather than
   * turned into a message over the screen, where it would sit a long way from
   * the field it is about.
   *
   * Nothing else is touched. The dates decide which day the calendar opens on
   * and no marker's own day follows them.
   */
  async function setTripDates(dates: {
    startsOn: string | null
    endsOn: string | null
  }): Promise<FieldErrors> {
    report(null)

    const previous = trips
    setTrips((rows) =>
      rows.map((each) => (each.id === trip.id ? { ...each, ...dates } : each)),
    )

    const outcome = await updateTrip(supabase, trip.id, dates)
    if (!outcome.ok) {
      setTrips(previous)
      if (outcome.kind === 'invalid-input') return outcome.fieldErrors
      report(
        outcome.kind === 'rejected' ? outcome.message : 'Could not save these dates.',
      )
      return {}
    }

    const saved = outcome.data
    setTrips((rows) => rows.map((each) => (each.id === saved.id ? saved : each)))
    return {}
  }

  /**
   * Archived trips, once somebody asks.
   *
   * A read rather than a write, and treated like one anyway: the press has to be
   * answered. Returned rather than fired and forgotten, so the row that started
   * it can stay on screen and say so until it settles — until the phone did
   * that, pressing again simply sent a second one.
   *
   * A failure reports rather than leaving the row to spring back with no
   * explanation, which is the same reason every optimistic write here reports
   * its own refusal.
   */
  async function revealArchived() {
    report(null)

    const state = await fetchTrips(supabase, { includeArchived: true })
    if (state.status === 'failed') {
      report(state.message)
      return false
    }

    const all = state.status === 'ready' ? state.data : []
    setArchived(all.filter((each) => each.archived))
    return true
  }

  /**
   * Archive the trip being looked at.
   *
   * Optimistic, by the same rule as renaming it: one column on one row,
   * reversible, and the outcome can be drawn before it is confirmed. So the trip
   * leaves the list at once and goes back exactly as it was if the database
   * refuses.
   *
   * Only the trip being viewed can be archived, which is why this takes no
   * argument. Archiving one from the switcher would mean removing a trip the
   * person is not looking at, from a list they opened to move between them.
   *
   * It does not ask first. Archiving is reversible by any member, and a
   * confirmation on a reversible act trains people to dismiss confirmations on
   * the ones that are not.
   *
   * What it does *not* do here is move off the trip — see `archiveAndLeave`.
   * Dropping the row from `trips` is not enough on this platform, and the reason
   * is written there rather than in two places.
   */
  async function archiveTrip() {
    report(null)

    const previous = trips
    setTrips((rows) => rows.filter((each) => each.id !== trip.id))

    const outcome = await updateTrip(supabase, trip.id, { archived: true })
    if (!outcome.ok) {
      setTrips(previous)
      report(
        outcome.kind === 'rejected' ? outcome.message : 'Could not archive this trip.',
      )
      return false
    }

    return true
  }

  /**
   * Archive the trip being viewed, and stop showing it.
   *
   * **The second half is not the first half's consequence on this platform, and
   * that is the whole reason this function exists.** The phone drops the trip
   * from its list and lets its resolver fall through to the next one. Here the
   * trip is resolved on the server from the URL, and each screen then holds
   *
   *     const trip = trips.find((each) => each.id === initialTrip.id) ?? initialTrip
   *
   * whose fallback is deliberate: it is what stops the screen emptying out from
   * under somebody when a re-read shows that *another member* archived the trip
   * they are looking at. So dropping the row from `trips` changes nothing
   * visible — the name and everything under it keep rendering, which is the one
   * thing the requirement forbids by name. Reach for the state change first and
   * it will look like it worked.
   *
   * `replace` plus `refresh` is the pair `selectTrip` already uses. The map is
   * where this leaves to from either screen: the server re-reads the trips with
   * archived excluded and resolves the first remaining one, or renders the
   * screen for somebody with no trips — where a first trip is made, and from
   * which the archive is reachable again the moment there is one. The calendar
   * has no such screen; it can only say there is no trip to show a calendar for.
   *
   * Only on success. A refused archive that navigated would remount the screen —
   * both are keyed by the trip — and take the refusal with it, so somebody would
   * be moved to another trip and told nothing about why the one they asked about
   * is still there.
   */
  async function archiveAndLeave() {
    if (!(await archiveTrip())) return

    router.replace(addressAfterArchive)
    router.refresh()
  }

  /**
   * Put an archived trip back.
   *
   * The same write with the flag inverted, so the same answer: optimistic, and
   * per row. The trip is offered again at once, inserted in the order
   * `fetchTrips` returns rather than appended — otherwise the switcher shows a
   * restored trip out of sequence until some later read happens to correct it —
   * and taken back out exactly as it was if the database refuses.
   *
   * **The archived row it came from stays until the write settles**, and that is
   * the half worth explaining, because removing it at once is what this did
   * first and it looked right. The optimistic change belongs to the switcher:
   * that list is what "restored" means. The archived list is a transient view of
   * one read, and the row in it is *the control that started the write* — so
   * taking it out on the press destroys the only thing on screen that can say
   * the round trip has not finished. `Putting back…` was written, shipped, and
   * could never once have been rendered; it was found by throttling the
   * connection and watching for it.
   *
   * So the trip is briefly in both lists, and that reads correctly: it is in the
   * switcher because it is back, and it is still on the archived page saying it
   * is on its way. The row goes when the answer does.
   *
   * The list is **not** dropped to null when this settles, which is what the
   * phone does and what this also did first. The phone can: its reveal collapses
   * back to a single row, so a null list renders as "ask again". Here the reveal
   * is a page that stays open and a null list on it renders as *Nothing
   * archived.* — so restoring one of three announced that there were none while
   * two were still sitting in the database. The next press of `Archived trips`
   * re-reads it, so nothing goes stale anywhere somebody can see.
   */
  async function restoreTrip(tripId: string) {
    report(null)

    const restoring = archived?.find((each) => each.id === tripId)
    // Nothing to put back. Only reachable if the list changed underneath the
    // press, and doing nothing is the right answer to that.
    if (!restoring) return

    const previousTrips = trips
    setTrips((rows) => inTripOrder([...rows, { ...restoring, archived: false }]))

    const outcome = await updateTrip(supabase, tripId, { archived: false })
    if (!outcome.ok) {
      setTrips(previousTrips)
      report(
        outcome.kind === 'rejected' ? outcome.message : 'Could not restore this trip.',
      )
      return
    }

    const saved = outcome.data
    setTrips((rows) => rows.map((each) => (each.id === saved.id ? saved : each)))
    setArchived((current) => current?.filter((each) => each.id !== saved.id) ?? null)
  }

  /**
   * Add somebody to the trip.
   *
   * Returns the offending field rather than reporting here, because the form
   * that called it is the thing that has to mark it up — a duplicate address is
   * a fact about the email box, not about the trip.
   */
  async function invite(displayName: string, email: string) {
    const outcome = await inviteMember(supabase, {
      tripId: trip.id,
      displayName,
      email,
    })

    if (!outcome.ok) {
      if (outcome.kind === 'invalid-input') {
        const [field, message] = Object.entries(outcome.fieldErrors)[0] ?? [
          '_',
          'Could not add that person.',
        ]
        return { field, message }
      }
      return { field: '_', message: outcome.message }
    }

    setMembers((current) => [...current, outcome.data])
    return null
  }

  return {
    onSelect: selectTrip,
    onRename: renameTrip,
    onSetDates: setTripDates,
    archived,
    onRevealArchived: revealArchived,
    onArchive: archiveAndLeave,
    onRestore: restoreTrip,
    onInvite: invite,
  }
}

/**
 * The order `fetchTrips` returns trips in: oldest first, ties broken by id.
 *
 * Restated here because a restored trip is put back into the list by hand
 * rather than by re-reading it, and a list that is sorted by the database on
 * every read but appended to locally is one that silently disagrees with itself
 * until the next read.
 */
function inTripOrder(rows: readonly Trip[]): readonly Trip[] {
  return [...rows].sort((a, b) =>
    a.createdAt === b.createdAt
      ? a.id.localeCompare(b.id)
      : a.createdAt.localeCompare(b.createdAt),
  )
}
