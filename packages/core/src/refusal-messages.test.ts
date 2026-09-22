import { ENGLISH, ENGLISH_LANGUAGE, message, say, type MessageKey } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { signInSchema, signUpSchema } from './auth'
import { CITY_SURFACE_FIELDS, newCitySchema } from './city'
import { MARKER_SURFACE_FIELDS, markerPatchSchema, writableMarkerFields } from './marker'
import { openingHoursSchema } from './opening-hours'
import { newTripSchema, TRIP_SURFACE_FIELDS, tripPatchSchema } from './trip'
import { newTripMemberSchema, TRIP_MEMBER_SURFACE_FIELDS } from './trip-member'

/**
 * Every refusal a person can be shown is a sentence somebody wrote.
 *
 * A validation rule written without a message falls through to zod's own
 * wording — `Too small: expected number to be >0` — which describes the rule
 * that was broken in the vocabulary of the thing enforcing it. That is not the
 * same act as telling somebody what is wrong with what they typed, and this
 * repository already refuses to let the *browser* answer a form for the same
 * reason. The position was written down for one of them and not the other, so
 * the dollar price read like a system error from the day prices were added
 * until somebody put a currency code beside it a year later.
 *
 * A default is what arrives when nobody decides, so intent is not enough: this
 * walks every field a person can fill in and fails when one of them would
 * answer in a voice nobody chose.
 */

/** A record a person fills in, and the fields of it the surface supplies. */
const RECORDS = [
  { name: 'a place', schema: writableMarkerFields, surface: MARKER_SURFACE_FIELDS },
  { name: 'a new trip', schema: newTripSchema, surface: TRIP_SURFACE_FIELDS },
  { name: 'a trip being edited', schema: tripPatchSchema, surface: TRIP_SURFACE_FIELDS },
  { name: 'a city', schema: newCitySchema, surface: CITY_SURFACE_FIELDS },
  { name: 'an invitation', schema: newTripMemberSchema, surface: TRIP_MEMBER_SURFACE_FIELDS },
  // Signing in and up are forms too, and every field of both is typed.
  { name: 'signing in', schema: signInSchema, surface: [] },
  { name: 'signing up', schema: signUpSchema, surface: [] },
] as const satisfies readonly {
  name: string
  schema: z.ZodObject
  surface: readonly string[]
}[]

/*
 * Reading a rule off a schema means reading zod's own structures, which are not
 * a public API and may move between versions. `agrees with what a person is
 * actually shown` below is the guard on that: it checks this walk against what
 * zod really says when it parses, so a version that moves the ground fails
 * loudly here rather than walking nothing and reporting everything fine.
 */
interface ZodInternals {
  _zod?: { def?: ZodDef }
}

interface ZodDef {
  type?: string
  format?: string
  check?: string
  error?: unknown
  checks?: unknown[]
  innerType?: unknown
}

function defOf(schema: unknown): ZodDef | undefined {
  return (schema as ZodInternals)?._zod?.def
}

/** Look through `.nullable()`, `.optional()` and `.default()` to the rule underneath. */
function unwrap(schema: unknown): unknown {
  let current = schema
  for (let depth = 0; depth < 10; depth += 1) {
    const def = defOf(current)
    if (!def) return current
    if (
      def.type === 'nullable' ||
      def.type === 'optional' ||
      def.type === 'default' ||
      def.type === 'prefault'
    ) {
      current = def.innerType
      continue
    }
    return current
  }
  return current
}

function messageOf(error: unknown): string | null {
  if (typeof error === 'string') return error
  if (typeof error === 'function') {
    const said = (error as (issue: unknown) => unknown)({})
    return typeof said === 'string' ? said : null
  }
  return null
}

/** One entry per stated rule on a field: what it is, and what it says. */
function statedRules(field: unknown): { rule: string; message: string | null }[] {
  const inner = unwrap(field)
  const def = defOf(inner)
  if (!def) return []

  const rules: { rule: string; message: string | null }[] = []

  // A format — url, uuid, email, a calendar date — carries its message on the
  // field itself rather than in the list of checks below.
  if (def.format) rules.push({ rule: def.format, message: messageOf(def.error) })

  for (const check of def.checks ?? []) {
    const checkDef = defOf(check)
    if (!checkDef) continue
    /*
     * A refinement on a whole record writes a message per issue it raises
     * rather than one for the rule — `openingHoursSchema` says four different
     * things — so there is no single message here to demand. Those records
     * carry their own tests; what this file owns is the fields.
     */
    if (def.type === 'object' && checkDef.check === 'custom') continue
    rules.push({ rule: String(checkDef.check), message: messageOf(checkDef.error) })
  }

  return rules
}

function personFacingFields(record: (typeof RECORDS)[number]) {
  const shape = record.schema.shape as Record<string, unknown>
  // Widened because a trip's list is empty, and `readonly []` narrows the
  // argument of `includes` to `never`. The declaration being empty is the
  // point of it — see `TRIP_SURFACE_FIELDS`.
  const surface: readonly string[] = record.surface
  return Object.entries(shape).filter(([key]) => !surface.includes(key))
}

describe('every field a person fills in answers in our own words', () => {
  for (const record of RECORDS) {
    for (const [field, schema] of personFacingFields(record)) {
      const rules = statedRules(schema)
      if (rules.length === 0) continue

      it(`${record.name}: ${field}`, () => {
        const unwritten = rules.filter((r) => r.message === null).map((r) => r.rule)
        expect(
          unwritten,
          `${field} on ${record.name} would answer in zod's words for: ${unwritten.join(', ')}`,
        ).toEqual([])
      })
    }
  }

  it('is looking at something', () => {
    // A walk that finds nothing passes every assertion above. This is the
    // floor: if a zod upgrade changes the shape being read, the count falls
    // and this fails before the silence can be mistaken for success.
    const counted = RECORDS.flatMap((record) =>
      personFacingFields(record).flatMap(([, schema]) => statedRules(schema)),
    )
    expect(counted.length).toBeGreaterThanOrEqual(20)
  })
})

/**
 * What a schema's message slot holds is a **name**, and the name resolves.
 *
 * This used to assert directly that the slot held a sentence. It cannot any
 * more — the slot holds `trip.needsName` — but the thing it was protecting is
 * unchanged and is now checked one step further along: the name is one the
 * catalogue knows, and what the catalogue has behind it is a sentence somebody
 * wrote. A key that is a typo fails here as loudly as an unwritten rule does
 * above, which is the failure the old assertion could not have seen at all.
 */
describe('every message is a name, and every name is a sentence', () => {
  const everyMessage = RECORDS.flatMap((record) =>
    personFacingFields(record).flatMap(([field, schema]) =>
      statedRules(schema)
        .filter((rule) => rule.message !== null)
        .map((rule) => ({ where: `${record.name}: ${field} (${rule.rule})`, said: rule.message! })),
    ),
  )

  for (const { where, said } of everyMessage) {
    it(where, () => {
      expect(
        Object.prototype.hasOwnProperty.call(ENGLISH, said),
        `${where} names "${said}", which the catalogue does not hold`,
      ).toBe(true)

      const sentence = say(ENGLISH_LANGUAGE, message(said as MessageKey))
      expect(sentence, `${where} does not end in a full stop`).toMatch(/\.$/)
      expect(sentence[0], `${where} does not begin with a capital`).toBe(
        sentence[0].toUpperCase(),
      )
    })
  }
})

describe('the walk agrees with what a person is actually shown', () => {
  /*
   * The honesty check. Parsing with an error map of our own makes every
   * message zod would have written by default come back as a sentinel, so what
   * a person would really see is observable without knowing zod's wording. If
   * the walk above and this disagree, the walk has stopped reading what it
   * thinks it is reading.
   */
  const UNWRITTEN = '__zod_would_have_answered_this_one__'

  function whatAPersonSees(schema: z.ZodObject, value: unknown): string[] {
    const result = schema.safeParse(value, {
      error: () => UNWRITTEN,
    } as Parameters<typeof schema.safeParse>[1])
    return result.success ? [] : result.error.issues.map((issue) => issue.message)
  }

  it('calls an unwritten rule unwritten, and a written one written', () => {
    const fixture = z.object({
      written: z.string().min(1, 'This one was written.'),
      unwritten: z.string().min(1),
    })

    const walked = Object.fromEntries(
      Object.entries(fixture.shape).map(([field, schema]) => [
        field,
        statedRules(schema).every((rule) => rule.message !== null),
      ]),
    )
    expect(walked).toEqual({ written: true, unwritten: false })

    const seen = whatAPersonSees(fixture, { written: '', unwritten: '' })
    expect(seen).toContain('This one was written.')
    expect(seen).toContain(UNWRITTEN)
  })

  it('finds nothing unwritten in a real refusal', () => {
    // The case from the issue: a price of -5 in both currencies.
    const seen = whatAPersonSees(writableMarkerFields, {
      tripId: '00000000-0000-4000-8000-000000000000',
      cityId: null,
      name: '',
      note: null,
      lng: 0,
      lat: 0,
      type: 'food',
      link: 'not a link',
      price: -5,
      localPrice: -5,
      localCurrency: null,
      plannedOn: 'the third',
      plannedUntil: null,
      hours: null,
    })

    expect(seen.length).toBeGreaterThan(0)
    expect(seen).not.toContain(UNWRITTEN)
  })
})

describe('a rule about the whole record answers the same way', () => {
  /*
   * The walk above reads rules stated on a field. A rule about a record as a
   * whole — the opening hours, a run of days, an end date before its start —
   * raises its own issues while parsing, with a message per issue, so there is
   * nothing static to read and these have to be provoked.
   *
   * Listed by hand, which is the honest limit: a new record-level rule is not
   * caught by this the way a new field is caught above. It is here because
   * leaving the five wordings in `opening-hours.ts` to review alone is how the
   * price came to read the way it did.
   */
  const PROVOCATIONS: { what: string; schema: z.ZodType; value: unknown }[] = [
    {
      what: 'hours with no day open',
      schema: openingHoursSchema,
      value: {},
    },
    {
      what: 'hours entered as a range that is not a time',
      schema: openingHoursSchema,
      value: { mon: [['morning', 'evening']] },
    },
    {
      what: 'hours with only one of the two times',
      schema: openingHoursSchema,
      value: { mon: [['09:00', '']] },
    },
    {
      what: 'a last day with no day to start from',
      schema: markerPatchSchema,
      value: { plannedUntil: '2026-04-06' },
    },
    {
      what: 'a last day before the first',
      schema: markerPatchSchema,
      value: { plannedOn: '2026-04-06', plannedUntil: '2026-04-03' },
    },
    {
      what: 'a run longer than a year',
      schema: markerPatchSchema,
      value: { plannedOn: '2026-04-03', plannedUntil: '2028-04-03' },
    },
    {
      what: 'a local price with no currency',
      schema: markerPatchSchema,
      value: { localPrice: 3800, localCurrency: null },
    },
    {
      what: 'a trip ending before it starts',
      schema: tripPatchSchema,
      value: { startsOn: '2026-04-10', endsOn: '2026-04-03' },
    },
  ]

  for (const { what, schema, value } of PROVOCATIONS) {
    it(what, () => {
      const result = schema.safeParse(value)
      expect(result.success, `${what} was accepted, so it says nothing`).toBe(false)
      const said = result.success ? [] : result.error.issues.map((issue) => issue.message)
      expect(said.length).toBeGreaterThan(0)
      // Each issue names a message; the sentence is one step further along.
      for (const named of said) {
        expect(
          Object.prototype.hasOwnProperty.call(ENGLISH, named),
          `"${named}" is not a name the catalogue holds`,
        ).toBe(true)
        const sentence = say(ENGLISH_LANGUAGE, message(named as MessageKey))
        expect(sentence, `"${sentence}" does not end in a full stop`).toMatch(/\.$/)
        expect(sentence[0], `"${sentence}" does not begin with a capital`).toBe(
          sentence[0].toUpperCase(),
        )
      }
    })
  }
})

describe('one mistake has one answer', () => {
  it('says the same thing about an email address wherever it is typed', () => {
    const complain = (schema: z.ZodObject, value: unknown) => {
      const result = schema.safeParse(value)
      return result.success
        ? null
        : (result.error.issues.find((issue) => issue.path[0] === 'email')?.message ?? null)
    }

    const signingIn = complain(signInSchema, { email: 'not an address', password: 'x' })
    const signingUp = complain(signUpSchema, {
      email: 'not an address',
      password: 'abcdefgh1',
      confirmPassword: 'abcdefgh1',
    })
    const inviting = complain(newTripMemberSchema, {
      tripId: '00000000-0000-4000-8000-000000000000',
      displayName: 'Sam',
      email: 'not an address',
    })

    expect(signingIn).not.toBeNull()
    expect(signingUp).toBe(signingIn)
    expect(inviting).toBe(signingIn)
  })
})
