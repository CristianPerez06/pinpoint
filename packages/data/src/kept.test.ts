import { describe, expect, it } from 'vitest'

import { keepList, readKeptList } from './kept'

describe('readKeptList', () => {
  it('reads back what keepList wrote', () => {
    const kept = { readAt: 1_790_000_000_000, rows: [{ id: 'a', name: 'Kinkaku-ji' }] }

    expect(readKeptList(keepList(kept))).toEqual(kept)
  })

  it('keeps an empty list as empty rather than absent', () => {
    expect(readKeptList(keepList({ readAt: 1, rows: [] }))).toEqual({ readAt: 1, rows: [] })
  })

  it('treats a missing file as no copy', () => {
    expect(readKeptList(null)).toBeNull()
    expect(readKeptList(undefined)).toBeNull()
    expect(readKeptList('')).toBeNull()
  })

  it('treats a truncated write as no copy', () => {
    const whole = keepList({ readAt: 1, rows: [{ id: 'a' }] })

    expect(readKeptList(whole.slice(0, whole.length - 3))).toBeNull()
  })

  it('treats another shape as no copy', () => {
    expect(readKeptList('[]')).toBeNull()
    expect(readKeptList('"text"')).toBeNull()
    expect(readKeptList(JSON.stringify({ v: 2, readAt: 1, rows: [] }))).toBeNull()
    expect(readKeptList(JSON.stringify({ v: 1, readAt: 'yesterday', rows: [] }))).toBeNull()
    expect(readKeptList(JSON.stringify({ v: 1, readAt: 1, rows: {} }))).toBeNull()
  })
})
