import { say as resolve } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import { formatSize } from './data-size'

const say = (language: 'en' | 'es', bytes: number, approximate = false) =>
  resolve(language, formatSize(language, bytes, approximate))

describe('formatSize', () => {
  it('writes whole megabytes above ten', () => {
    expect(say('en', 96_400_000)).toBe('96 MB')
  })

  it('keeps a tenth under ten megabytes', () => {
    expect(say('en', 4_230_000)).toBe('4.2 MB')
    expect(say('es', 4_230_000)).toBe('4,2 MB')
  })

  it('never says nothing for something that exists', () => {
    expect(say('en', 1_000)).toBe('0.1 MB')
  })

  it('moves to gigabytes at a thousand megabytes', () => {
    expect(say('en', 1_320_000_000)).toBe('1.3 GB')
  })

  it('says an estimate is one', () => {
    expect(say('en', 96_000_000, true)).toBe('about 96 MB')
    expect(say('es', 96_000_000, true)).toBe('unos 96 MB')
  })
})
