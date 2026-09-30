import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { COLOUR } from '@pinpoint/tokens'
import { describe, expect, it } from 'vitest'

import { SPLASH_SPHERE_WIDTH } from './geometry'

/**
 * `app.json` cannot import a constant, so the still launch image's size and
 * grounds are written there as literals. These are what hold them to the
 * values the animated opening draws with.
 */
const appJson = JSON.parse(readFileSync(join(__dirname, '..', '..', 'app.json'), 'utf8'))

function splashConfig() {
  const entry = appJson.expo.plugins.find(
    (plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  )
  if (!entry) throw new Error('app.json does not configure expo-splash-screen')
  return entry[1]
}

describe('the still launch image', () => {
  it('is drawn at the size the animated opening starts from', () => {
    expect(splashConfig().imageWidth).toBe(SPLASH_SPHERE_WIDTH)
  })

  it('sits on the ground of each appearance', () => {
    const config = splashConfig()
    expect(config.backgroundColor).toBe(COLOUR.ground.light)
    expect(config.dark.backgroundColor).toBe(COLOUR.ground.dark)
  })
})
