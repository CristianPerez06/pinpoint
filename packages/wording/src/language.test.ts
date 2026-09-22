import { describe, expect, it } from 'vitest'

import { languageFor, parseLanguagePreference, requestedLanguages } from './language'

describe('parseLanguagePreference', () => {
  it('reads the three choices', () => {
    expect(parseLanguagePreference('system')).toBe('system')
    expect(parseLanguagePreference('en')).toBe('en')
    expect(parseLanguagePreference('es')).toBe('es')
  })

  it('follows the device for anything it does not recognise', () => {
    for (const stored of [null, undefined, '', 'de', 'ES', 'es-AR', 'english']) {
      expect(parseLanguagePreference(stored)).toBe('system')
    }
  })
})

describe('languageFor', () => {
  it('uses a chosen language whatever the device asks for', () => {
    expect(languageFor('es', ['en-US'])).toBe('es')
    expect(languageFor('en', ['es-AR', 'es'])).toBe('en')
  })

  it('follows the device to a language the product is offered in', () => {
    expect(languageFor('system', ['es-AR'])).toBe('es')
    expect(languageFor('system', ['es_ES'])).toBe('es')
    expect(languageFor('system', ['en-GB'])).toBe('en')
  })

  it('takes the first offered language in the device’s own order', () => {
    expect(languageFor('system', ['de-DE', 'es-MX', 'en'])).toBe('es')
    expect(languageFor('system', ['de-DE', 'en', 'es'])).toBe('en')
  })

  it('falls back to English for a device asking only for what is not offered', () => {
    expect(languageFor('system', ['de-DE', 'ja'])).toBe('en')
    expect(languageFor('system', [])).toBe('en')
  })
})

describe('requestedLanguages', () => {
  it('orders an Accept-Language header by weight', () => {
    expect(requestedLanguages('de;q=0.5, es-AR, en;q=0.8')).toEqual(['es-AR', 'en', 'de'])
  })

  it('drops the wildcard and anything refused outright', () => {
    expect(requestedLanguages('es;q=0, *, en')).toEqual(['en'])
  })

  it('reads nothing from an absent header', () => {
    expect(requestedLanguages(null)).toEqual([])
    expect(requestedLanguages('')).toEqual([])
  })
})
