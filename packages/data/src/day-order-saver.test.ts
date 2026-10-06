import type { DayOrder } from '@pinpoint/core'
import { message } from '@pinpoint/wording'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDayOrderSaver } from './day-order-saver'
import { rejected, type WriteOutcome, wrote } from './write-outcome'

const DAY = '2026-04-03'

function setUp(answer: (ids: readonly string[]) => WriteOutcome<DayOrder>) {
  const save = vi.fn((day: string, ids: readonly string[]) => Promise.resolve(answer(ids)))
  const onSettled = vi.fn()
  const onChange = vi.fn()
  const saver = createDayOrderSaver({ save, onSettled, onChange })
  return { saver, save, onSettled, onChange }
}

describe('createDayOrderSaver', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('saves a burst of changes once, a second after the last, with the final order', async () => {
    const { saver, save } = setUp((ids) => wrote({ day: DAY, markerIds: ids }))

    saver.change(DAY, ['b', 'a', 'c'])
    await vi.advanceTimersByTimeAsync(600)
    saver.change(DAY, ['c', 'b', 'a'])
    await vi.advanceTimersByTimeAsync(600)
    saver.change(DAY, ['c', 'a', 'b'])
    await vi.advanceTimersByTimeAsync(999)
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(DAY, ['c', 'a', 'b'])
  })

  it('shows the new order until the save settles, then lets go of it', async () => {
    const { saver, onSettled } = setUp((ids) => wrote({ day: DAY, markerIds: ids }))

    saver.change(DAY, ['b', 'a'])
    expect(saver.pending().get(DAY)).toEqual(['b', 'a'])

    await vi.advanceTimersByTimeAsync(1000)
    expect(saver.pending().has(DAY)).toBe(false)
    expect(onSettled).toHaveBeenCalledWith(DAY, { ok: true, data: { day: DAY, markerIds: ['b', 'a'] } })
  })

  it('lets go of a failed order too, so the last saved one shows again, and says so', async () => {
    const failure = rejected<DayOrder>(message('calendar.orderNotSaved'))
    const { saver, onSettled } = setUp(() => failure)

    saver.change(DAY, ['b', 'a'])
    await vi.advanceTimersByTimeAsync(1000)

    expect(saver.pending().has(DAY)).toBe(false)
    expect(onSettled).toHaveBeenCalledWith(DAY, failure)
  })

  it('saves straight away when the day is left', async () => {
    const { saver, save } = setUp((ids) => wrote({ day: DAY, markerIds: ids }))

    saver.change(DAY, ['b', 'a'])
    saver.flush()

    expect(save).toHaveBeenCalledWith(DAY, ['b', 'a'])
    await vi.advanceTimersByTimeAsync(5000)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('keeps a change made while an earlier save is on its way', async () => {
    let finish: (outcome: WriteOutcome<DayOrder>) => void = () => {}
    const save = vi.fn(
      () => new Promise<WriteOutcome<DayOrder>>((resolve) => (finish = resolve)),
    )
    const saver = createDayOrderSaver({ save, onSettled: vi.fn(), onChange: vi.fn() })

    saver.change(DAY, ['b', 'a'])
    await vi.advanceTimersByTimeAsync(1000)
    saver.change(DAY, ['a', 'b'])
    finish(wrote({ day: DAY, markerIds: ['b', 'a'] }))
    await vi.advanceTimersByTimeAsync(0)

    expect(saver.pending().get(DAY)).toEqual(['a', 'b'])
  })

  it('saves each day on its own', async () => {
    const { saver, save } = setUp((ids) => wrote({ day: DAY, markerIds: ids }))

    saver.change(DAY, ['a'])
    saver.change('2026-04-04', ['b'])
    await vi.advanceTimersByTimeAsync(1000)

    expect(save).toHaveBeenCalledTimes(2)
  })
})
