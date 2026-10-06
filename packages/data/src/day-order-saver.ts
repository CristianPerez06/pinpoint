import type { DayOrder, IsoDay } from '@pinpoint/core'
import { message } from '@pinpoint/wording'

import { rejected, type WriteOutcome } from './write-outcome'

/**
 * When a reordered day is saved, and what is shown until it is.
 *
 * The calendar's rule (`trip-calendar`, *A day's places can be put in order*):
 * a day's order is saved one second after its last change, as one save of the
 * whole day; leaving the day or the calendar saves at once rather than
 * discarding; and until the save settles the new order is what is shown,
 * whatever a re-read brings in meanwhile.
 *
 * Here rather than in either application because both need exactly this, and
 * timing rules written twice drift. It holds no rendering and no storage — only
 * timers — so it belongs with the reads and writes it schedules.
 */
export interface DayOrderSaver {
  /** A day's order has changed: show it, and save it a moment from now. */
  change(day: IsoDay, markerIds: readonly string[]): void
  /** Save every waiting day now — on leaving a day, or the calendar. */
  flush(): void
  /** The orders not yet saved, waiting or on their way, by day. */
  pending(): ReadonlyMap<IsoDay, readonly string[]>
}

export const DAY_ORDER_SAVE_AFTER_MS = 1000

export function createDayOrderSaver({
  save,
  onSettled,
  onChange,
  delayMs = DAY_ORDER_SAVE_AFTER_MS,
}: {
  save: (day: IsoDay, markerIds: readonly string[]) => Promise<WriteOutcome<DayOrder>>
  /** Told once a day's save has finished, either way. */
  onSettled: (day: IsoDay, outcome: WriteOutcome<DayOrder>) => void
  /** Told whenever what `pending` returns has changed. */
  onChange: () => void
  delayMs?: number
}): DayOrderSaver {
  const shown = new Map<IsoDay, readonly string[]>()
  const timers = new Map<IsoDay, ReturnType<typeof setTimeout>>()

  function send(day: IsoDay) {
    const timer = timers.get(day)
    if (timer !== undefined) clearTimeout(timer)
    timers.delete(day)

    const markerIds = shown.get(day)
    if (markerIds === undefined) return

    void save(day, markerIds).then(
      (outcome) => settle(day, markerIds, outcome),
      () => settle(day, markerIds, rejected(message('calendar.orderNotSaved'))),
    )
  }

  function settle(day: IsoDay, sent: readonly string[], outcome: WriteOutcome<DayOrder>) {
    // A change made while this save was on its way is newer than it, and is
    // still waiting for its own save — so it stays shown, whatever this one did.
    if (shown.get(day) === sent) {
      shown.delete(day)
      onChange()
    }
    onSettled(day, outcome)
  }

  return {
    change(day, markerIds) {
      shown.set(day, markerIds)
      const timer = timers.get(day)
      if (timer !== undefined) clearTimeout(timer)
      timers.set(day, setTimeout(() => send(day), delayMs))
      onChange()
    },
    flush() {
      for (const day of [...timers.keys()]) send(day)
    },
    pending() {
      return new Map(shown)
    },
  }
}
