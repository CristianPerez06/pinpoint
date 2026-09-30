import { describe, expect, it } from 'vitest'

import {
  doneWaiting,
  isWaiting,
  keepWaiting,
  readWaiting,
  waitAlso,
  type WaitingTap,
} from './waiting'

const visited = (markerId: string, value: boolean): WaitingTap => ({
  kind: 'visited',
  markerId,
  visited: value,
})

const interest = (
  markerId: string,
  memberId: string,
  interested: boolean | null,
): WaitingTap => ({ kind: 'interest', markerId, memberId, interested })

describe('waitAlso', () => {
  it('keeps taps in the order they were made', () => {
    const queue = [visited('a', true), interest('b', 'me', true)].reduce(waitAlso, [])

    expect(queue).toEqual([visited('a', true), interest('b', 'me', true)])
  })

  it('keeps only the last choice about the same thing, where the first stood', () => {
    const queue = [
      visited('a', true),
      interest('b', 'me', true),
      visited('a', false),
    ].reduce(waitAlso, [])

    expect(queue).toEqual([visited('a', false), interest('b', 'me', true)])
  })

  it('treats visited and interest on one place as different things', () => {
    const queue = [visited('a', true), interest('a', 'me', false)].reduce(waitAlso, [])

    expect(queue).toHaveLength(2)
  })

  it('treats two members on one place as different things', () => {
    const queue = [interest('a', 'me', true), interest('a', 'you', null)].reduce(
      waitAlso,
      [],
    )

    expect(queue).toHaveLength(2)
  })
})

describe('doneWaiting and isWaiting', () => {
  it('removes a sent tap and reports nothing waiting for it', () => {
    const queue = [visited('a', true), interest('b', 'me', null)].reduce(waitAlso, [])
    const after = doneWaiting(queue, visited('a', true))

    expect(isWaiting(queue, { kind: 'visited', markerId: 'a' })).toBe(true)
    expect(isWaiting(after, { kind: 'visited', markerId: 'a' })).toBe(false)
    expect(isWaiting(after, { kind: 'interest', markerId: 'b', memberId: 'me' })).toBe(true)
  })
})

describe('readWaiting', () => {
  it('reads back what keepWaiting wrote', () => {
    const queue = [visited('a', true), interest('b', 'me', null)]

    expect(readWaiting(keepWaiting(queue))).toEqual(queue)
  })

  it('reads anything unreadable as an empty queue', () => {
    expect(readWaiting(null)).toEqual([])
    expect(readWaiting('{')).toEqual([])
    expect(readWaiting(JSON.stringify({ v: 2, queue: [] }))).toEqual([])
  })

  it('leaves out entries this build does not know', () => {
    const text = JSON.stringify({
      v: 1,
      queue: [visited('a', true), { kind: 'rename', markerId: 'b', name: 'x' }],
    })

    expect(readWaiting(text)).toEqual([visited('a', true)])
  })
})
