import { describe, expect, it } from 'vitest'

import { ENGLISH } from './english'
import {
  ENGLISH_LANGUAGE,
  LANGUAGES,
  message,
  say,
  SPANISH_LANGUAGE,
  type Message,
  type MessageKey,
} from './say'
import { SPANISH } from './spanish'

describe('say', () => {
  it('resolves a sentence that stands on its own', () => {
    expect(say(ENGLISH_LANGUAGE, message('place.saveFailed'))).toBe('Could not save this place.')
  })

  it('places a value into the sentence that has a gap for it', () => {
    expect(say(ENGLISH_LANGUAGE, message('city.nameTaken', { name: 'Kyoto Day 2' }))).toBe(
      'This trip already has a city called “Kyoto Day 2”.',
    )
  })

  it('places a value that is not the whole sentence', () => {
    expect(say(ENGLISH_LANGUAGE, message('member.takeBackQuestion', { name: 'Cristian' }))).toBe(
      "Take back Cristian's invitation?",
    )
  })

  /**
   * The values stay out of the sentence until the sentence is chosen.
   *
   * This is the property the whole shape exists for: a message carries the city
   * beside the name rather than joined into it, so that the language deciding
   * where the city goes in the sentence has not already been decided by whoever
   * reported the refusal.
   */
  it('carries its values rather than a finished sentence', () => {
    expect(message('city.nameTaken', { name: 'Osaka' })).toEqual({
      key: 'city.nameTaken',
      values: { name: 'Osaka' },
    })
  })

  it('refuses a name that does not exist, a missing value and a value with nowhere to go', () => {
    // @ts-expect-error no such name
    message('place.doesNotExist')
    // @ts-expect-error this sentence has a gap that has to be filled
    message('city.nameTaken')
    // @ts-expect-error this sentence has nowhere to put a value
    message('place.saveFailed', { name: 'Osaka' })
  })
})

/**
 * Every sentence, as a table.
 *
 * Nothing in a typecheck can tell whether the sentence now behind
 * `place.saveFailed` is the one `MARKER_SAVE_FAILED_MESSAGE` used to hold, and
 * the constant it came from is deleted in the same change. This is what makes
 * the move reviewable — a table in the diff rather than eighty deletions spread
 * across four packages — and what makes a later rewording show up as a reworded
 * line rather than as nothing at all.
 */
/**
 * A message for every name, with every gap filled by a value that could not be
 * mistaken for part of a sentence — so a test can tell a sentence that placed
 * its value from one that dropped it.
 */
function everyMessage(): Message[] {
  return (Object.keys(ENGLISH) as MessageKey[]).map((key) =>
    typeof ENGLISH[key] === 'string'
      ? { key }
      : {
          key,
          values: new Proxy({}, { get: (_, name) => `‹${String(name)}›` }) as Record<
            string,
            string
          >,
        },
  )
}

describe('every name in every language', () => {
  it('resolves to a sentence of its own, not a blank and not its name', () => {
    for (const language of LANGUAGES) {
      for (const named of everyMessage()) {
        const text = say(language, named)
        expect(text, `${language} ${named.key}`).not.toBe('')
        expect(text, `${language} ${named.key}`).not.toBe(named.key)
      }
    }
  })

  it('holds exactly the names English holds', () => {
    expect(Object.keys(SPANISH).sort()).toEqual(Object.keys(ENGLISH).sort())
  })

  it('places every value a sentence has a gap for, in both languages', () => {
    for (const named of everyMessage()) {
      if (named.values === undefined) continue
      const english = say(ENGLISH_LANGUAGE, named).match(/‹\w+›/g)?.sort()
      const spanish = say(SPANISH_LANGUAGE, named).match(/‹\w+›/g)?.sort()
      expect(spanish, named.key).toEqual(english)
    }
  })

  it('resolves the same name to each language’s own sentence', () => {
    expect(say(SPANISH_LANGUAGE, message('city.nameTaken', { name: 'Kyoto Day 2' }))).toBe(
      'Este viaje ya tiene una ciudad llamada “Kyoto Day 2”.',
    )
  })
})

/**
 * The sentences that name the person reading them in English, in Spanish.
 *
 * The Spanish is impersonal, so none of these may address anybody: no
 * possessive `tu`/`su` pointing at the reader, and no imperative ending in the
 * voseo or tuteo forms. Asserted as the sentences themselves rather than a
 * pattern, because what makes a sentence a statement is not something a regex
 * can see.
 */
describe('the Spanish never addresses the person', () => {
  it('states the fact where the English says "your"', () => {
    expect(SPANISH['password.missing']).toBe('Falta la contraseña.')
    expect(SPANISH['trip.loadFailed']).toBe('No se pudieron cargar los viajes.')
    expect(SPANISH['place.conflict']).toBe(
      'Alguien más cambió este lugar mientras se estaba editando. No se perdió nada de lo escrito: al abrirlo de nuevo se ve su versión.',
    )
  })
})

describe('the Spanish catalogue', () => {
  it('says what it says', () => {
    expect(tableOf(SPANISH)).toMatchSnapshot()
  })
})

describe('the English catalogue', () => {
  it('says what it says', () => {
    const table = (Object.keys(ENGLISH) as MessageKey[])
      .map((key) => {
        const entry = ENGLISH[key]
        const text =
          typeof entry === 'string'
            ? entry
            : // Rendered with its gaps named, so the snapshot shows the shape of
              // the sentence rather than a sample of somebody's data.
              entry(
                new Proxy(
                  {},
                  { get: (_, name) => `{${String(name)}}` },
                ) as never,
              )
        return `${key}\n  ${text}`
      })
      .join('\n')

    expect(table).toMatchSnapshot()
  })

  it('has an entry for every marker type', () => {
    for (const id of [
      'place',
      'temple',
      'culture',
      'nature',
      'food',
      'shopping',
      'stay',
      'transport',
    ]) {
      expect(ENGLISH).toHaveProperty(`markerType.${id}`)
    }
  })
})

function tableOf(catalogue: typeof SPANISH): string {
  return (Object.keys(catalogue) as MessageKey[])
    .map((key) => {
      const entry = catalogue[key] as string | ((values: never) => string)
      const text =
        typeof entry === 'string'
          ? entry
          : entry(new Proxy({}, { get: (_, name) => `{${String(name)}}` }) as never)
      return `${key}\n  ${text}`
    })
    .join('\n')
}
