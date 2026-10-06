import type { DayOrder, IsoDay } from '@pinpoint/core'
import { createDayOrderSaver, type WriteOutcome } from '@pinpoint/data'
import {
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'

/**
 * Putting a day in order on this screen: what to show, and a way to change it.
 *
 * The timing is `createDayOrderSaver`'s — a second after the last change, one
 * save per day, at once on leaving the day or the calendar. This binds it to
 * the screen: a changed day is shown from the change until its save settles,
 * whatever a re-read brings in meanwhile; a saved one becomes the stored row; a
 * failed one is let go of, so the last saved order shows again, and `onFailed`
 * says so.
 */
export function useDayOrdering({
  dayOrders,
  setDayOrders,
  save,
  onFailed,
  day,
}: {
  dayOrders: readonly DayOrder[]
  setDayOrders: (update: (rows: readonly DayOrder[]) => readonly DayOrder[]) => void
  /** Read once, so it must not change for the screen's lifetime. */
  save: (day: IsoDay, markerIds: readonly string[]) => Promise<WriteOutcome<DayOrder>>
  /** Read once, likewise. */
  onFailed: () => void
  /** The day being read. Leaving it saves whatever is waiting. */
  day: IsoDay | null
}) {
  const [version, changed] = useReducer((count: number) => count + 1, 0)

  /*
   * Made once. What it is given has to be stable for the screen's lifetime,
   * which it is: the calendar is remounted for each trip, so the trip a save
   * names cannot change under it, and the setters are stable.
   */
  const [saver] = useState(() =>
    createDayOrderSaver({
      save,
      onChange: changed,
      onSettled: (each, outcome) => {
        if (!outcome.ok) {
          onFailed()
          return
        }
        const saved = outcome.data
        setDayOrders((rows) =>
          rows.some((row) => row.day === each)
            ? rows.map((row) => (row.day === each ? saved : row))
            : [...rows, saved],
        )
      },
    }),
  )

  // Leaving the day, and leaving the calendar, save rather than discard.
  useEffect(() => {
    saver.flush()
  }, [saver, day])
  useEffect(() => () => saver.flush(), [saver])

  const shown = useMemo(() => {
    const pending = saver.pending()
    if (pending.size === 0) return dayOrders
    const kept = dayOrders.filter((row) => !pending.has(row.day))
    return [
      ...kept,
      ...[...pending].map(([each, markerIds]) => ({ day: each, markerIds })),
    ]
    // `version` is what says the pending orders have changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saver, dayOrders, version])

  return { dayOrders: shown, change: saver.change }
}
