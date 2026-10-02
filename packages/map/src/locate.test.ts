import { describe, expect, it } from 'vitest'

import { locate, LocationRefused } from './locate'

const HERE = { lng: 135.773, lat: 35.001, accuracy: 12 }

describe('locate', () => {
  it('finds the position once permission is granted', async () => {
    const outcome = await locate({
      askPermission: async () => true,
      currentPosition: async () => HERE,
    })
    expect(outcome).toEqual({ status: 'found', fix: HERE })
  })

  it('reports a refusal without asking for a position', async () => {
    let asked = false
    const outcome = await locate({
      askPermission: async () => false,
      currentPosition: async () => {
        asked = true
        return HERE
      },
    })
    expect(outcome).toEqual({ status: 'refused' })
    expect(asked).toBe(false)
  })

  it('reports a position that fails to arrive as not found', async () => {
    const outcome = await locate({
      askPermission: async () => true,
      currentPosition: async () => {
        throw new Error('Location services are disabled')
      },
    })
    expect(outcome).toEqual({ status: 'notFound' })
  })

  it('gives up after the wait rather than spinning', async () => {
    const outcome = await locate({
      askPermission: async () => true,
      currentPosition: () => new Promise(() => {}),
      timeoutMs: 10,
    })
    expect(outcome).toEqual({ status: 'notFound' })
  })

  it('reports a refusal learned from the position call, as a browser gives it', async () => {
    const outcome = await locate({
      askPermission: async () => true,
      currentPosition: async () => {
        throw new LocationRefused()
      },
    })
    expect(outcome).toEqual({ status: 'refused' })
  })
})
