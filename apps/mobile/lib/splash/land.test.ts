import { describe, expect, it } from 'vitest'

import { isLand, LAND_HEIGHT, LAND_WIDTH, landMask, landPixels } from './land'

const mask = landMask()

describe('the continents mask', () => {
  it('expands to exactly one value per pixel', () => {
    expect(mask.length).toBe(LAND_WIDTH * LAND_HEIGHT)
  })

  it('has land where land is', () => {
    expect(isLand(mask, -34.6, -58.4)).toBe(true) // Buenos Aires
    expect(isLand(mask, 23, 13)).toBe(true) // the Sahara
    expect(isLand(mask, 35.7, 139.7)).toBe(true) // Tokyo
  })

  it('has sea where sea is', () => {
    expect(isLand(mask, 0, -150)).toBe(false) // the middle of the Pacific
    expect(isLand(mask, -30, -20)).toBe(false) // the South Atlantic
  })

  it('writes the texture south first', () => {
    const pixels = landPixels(mask, '#B8741A')
    // Antarctica's bottom row is land; it must be the texture's first row.
    const firstRowHasLand = pixels.slice(0, LAND_WIDTH * 4).some((v, i) => i % 4 === 3 && v === 255)
    expect(firstRowHasLand).toBe(true)
    // The Arctic Ocean at the pole is sea; the texture's last row must be empty.
    const lastRow = pixels.slice((LAND_HEIGHT - 1) * LAND_WIDTH * 4)
    expect(lastRow.every((v, i) => i % 4 !== 3 || v === 0)).toBe(true)
  })
})
