import { describe, expect, it } from 'vitest'

import { askInTurn, type Attempt, type Outcome } from './in-turn'

const ready = (value: string): Attempt<string> => async () => ({ kind: 'ready', value })
const none: Attempt<string> = async () => ({ kind: 'none' })
const refused: Attempt<string> = async () => ({ kind: 'failed' })
const throws: Attempt<string> = async () => {
  throw new Error('network')
}
/** Never answers on its own; settles as failed when the deadline aborts it. */
const silent: Attempt<string> = (signal) =>
  new Promise<Outcome<string>>((resolve) =>
    signal.addEventListener('abort', () => resolve({ kind: 'failed' })),
  )

describe('askInTurn', () => {
  it('takes the first answer', async () => {
    expect(await askInTurn([ready('stadia'), ready('fossgis')], 1000)).toEqual({
      kind: 'ready',
      value: 'stadia',
    })
  })

  it('asks the next service when one refuses or fails', async () => {
    expect(await askInTurn([refused, ready('fossgis')], 1000)).toEqual({
      kind: 'ready',
      value: 'fossgis',
    })
    expect(await askInTurn([throws, ready('fossgis')], 1000)).toEqual({
      kind: 'ready',
      value: 'fossgis',
    })
  })

  it('lets "no way" stand without asking the next', async () => {
    let asked = false
    const next: Attempt<string> = async () => {
      asked = true
      return { kind: 'ready', value: 'fossgis' }
    }
    expect(await askInTurn([none, next], 1000)).toEqual({ kind: 'none' })
    expect(asked).toBe(false)
  })

  it('gives up when the one deadline passes', async () => {
    let asked = false
    const next: Attempt<string> = async () => {
      asked = true
      return { kind: 'ready', value: 'fossgis' }
    }
    expect(await askInTurn([silent, next], 20)).toEqual({ kind: 'failed' })
    expect(asked).toBe(false)
  })

  it('fails when every service fails', async () => {
    expect(await askInTurn([refused, throws], 1000)).toEqual({ kind: 'failed' })
  })
})
