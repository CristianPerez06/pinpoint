import { z } from 'zod'

import { currencyCodeSchema } from './currency'
import { refusal } from './field-errors'
// The bound is stated once, in the module that owns day arithmetic, and again
// by the database's own check. Not a third time here.
import { MAX_RUN_DAYS } from './marker-day'
import { markerTypeSchema } from './marker-type'
import { openingHoursSchema } from './opening-hours'

/**
 * A place someone wants to go.
 *
 * `lng`/`lat` are named to match what the map layer consumes, so a `Marker`
 * structurally satisfies `LngLat` from `@pinpoint/map` without this package
 * depending on it — the map package sits at the base of the graph and takes no
 * workspace dependencies.
 *
 * Optional fields are nullable rather than absent. A marker with no note holds
 * `null`, never `''` — the two are indistinguishable in a form and very
 * distinguishable in a query.
 */
export const markerSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  /** Null means unassigned, which is a valid resting state, not a gap to fill. */
  cityId: z.uuid(refusal('place.cityNotOnList')).nullable(),
  name: z
    .string()
    .min(1, refusal('place.needsName'))
    .max(200, refusal('place.nameTooLong')),
  note: z.string().max(2000, refusal('place.noteTooLong')).nullable(),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  type: markerTypeSchema,
  /** Where the place was found — the answer to "why did we save this?". */
  link: z
    .url(refusal('place.linkMalformed'))
    .max(2000, refusal('place.linkTooLong'))
    .nullable(),
  /** In US dollars, always. Zero is a free place; null is a price nobody has entered. */
  price: z.number().nonnegative(refusal('place.priceNegative')).nullable(),
  /**
   * The price as it was seen in the second currency of the place's city — a
   * menu in yen — or null. Typed, never converted from `price` or into it.
   *
   * Never 0: a place whose only cost is 0 in any currency is free, which is
   * `price = 0`. Always beside the code it was typed in, so the database can
   * tell a yen amount from a won one and clear it when the city's currency
   * changes, the city is removed, or the place moves to another city.
   */
  localPrice: z
    .number()
    // Covers 0 as well as a negative, because `positive()` refuses both. A
    // place that costs nothing is `Free`, which is `price = 0` and no local
    // amount at all — so the message names the control that says so rather
    // than leaving somebody to guess why zero is not a price.
    .positive(refusal('place.priceNegativeWithFree'))
    .nullable(),
  /** The currency `localPrice` is in. Set exactly when `localPrice` is. */
  localCurrency: currencyCodeSchema.nullable(),
  /**
   * The day this place is planned for, or null while that is undecided.
   *
   * A calendar date and never an instant. A timestamp is a different day
   * depending on where it is read, so a place put on Thursday at home would
   * come back as Wednesday once somebody is standing in Kyōto — which is
   * exactly when this has to be right. `createdAt` and `updatedAt` below are
   * correctly instants; they record moments rather than days somebody chose.
   *
   * Independent of `cityId` in both directions. A city and a day are two
   * groupings of one set of places, sitting beside each other rather than one
   * inside the other, so neither derives, defaults or constrains the other —
   * a day trip that crosses a city boundary is an ordinary thing to plan.
   *
   * Also independent of the trip's own dates, which may be absent and are not
   * a boundary. A place dated a day either side of the trip is somebody's
   * decision, not an error.
   */
  plannedOn: z.iso.date(refusal('place.dayMalformed')).nullable(),
  /**
   * The last day of a run, or null for a place planned for a single day.
   *
   * Where it is set, the place is planned for every day from `plannedOn`
   * through this one, both included — a hotel booked the 3rd to the 6th is one
   * place on four days, rather than four places or one that disappears after
   * the first night.
   *
   * Null is the ordinary state and means one day, not "unknown": every place
   * saved before runs existed has it, and none of them needs migrating.
   *
   * **Never equal to `plannedOn`.** A single day has one representation, and
   * the write path normalises an equal pair to null so that nothing reading a
   * day has to handle two. The database refuses the pair outright as a backstop.
   *
   * Not validated against `plannedOn` here — that is `newMarkerSchema` and
   * `markerPatchSchema`'s job, below, because reads and writes want different
   * strictness. A stored pair that somehow breaks the rules must still parse
   * and render; `runOfDays` in `marker-day.ts` reads such a pair as a single
   * day rather than failing.
   */
  plannedUntil: z.iso.date(refusal('place.lastDayMalformed')).nullable(),
  /**
   * The days the place is open and at what times, or null while nobody has
   * entered them — which is never the same as closed. See `opening-hours.ts`.
   */
  hours: openingHoursSchema.nullable(),
  /** Shared by the whole trip: travelling companions visit a place together. */
  visited: z.boolean(),
  createdAt: z.iso.datetime(),
  /**
   * When this place was last changed, maintained by the database.
   *
   * Read as the version an edit is based on: a save states the value it started
   * from, and one that no longer matches is refused rather than applied. It is
   * deliberately absent from `markerPatchSchema` below — a precondition of a
   * write is not a field somebody edits, and accepting it there would let a
   * caller assert the very thing the check exists to verify.
   */
  updatedAt: z.iso.datetime(),
})

export type Marker = z.infer<typeof markerSchema>

/**
 * Fields a client supplies when dropping a marker.
 *
 * `visited` is absent: a marker is not visited when it is saved, and the
 * database owns that default.
 */
/**
 * The fields a client may write, before either schema puts its own gloss on
 * them.
 *
 * Named once and derived from twice, so a field added to a marker is writable
 * on creation and editable afterwards without anybody remembering to do both.
 * What each of the two does with `plannedOn` differs, and that is the only
 * reason this exists separately.
 *
 * Exported for `refusal-messages.test.ts`, which walks the fields a person can
 * be shown a refusal about. It reads this rather than either schema below
 * because both of those end in a transform, which leaves them pipes with no
 * fields to walk — and both derive from this, so there is nothing the walk
 * could miss by starting here.
 */
export const writableMarkerFields = markerSchema.pick({
  tripId: true,
  cityId: true,
  name: true,
  note: true,
  lng: true,
  lat: true,
  type: true,
  link: true,
  price: true,
  localPrice: true,
  localCurrency: true,
  plannedOn: true,
  plannedUntil: true,
  hours: true,
})

/**
 * A last day needs a first one, must fall after it, and may not run longer than
 * a year.
 *
 * Beside `localPriceComesWithCurrency` because it is the same shape of problem:
 * a pair the database refuses, said first in the client's own voice and naming
 * the field somebody can see.
 *
 * Reads `undefined` as "not mentioned", which is what an absent key means in a
 * patch. A form that sends both keys every time — which both of ours do — never
 * reaches that branch; a caller patching only the last day of a place whose
 * first day is already stored does, and is told to send both rather than being
 * silently allowed to write a run with no beginning.
 */
function runOfDaysIsValid(
  value: { plannedOn?: string | null; plannedUntil?: string | null },
  ctx: z.RefinementCtx,
) {
  const until = value.plannedUntil
  if (until === undefined || until === null) return

  const from = value.plannedOn
  if (from === undefined || from === null) {
    ctx.addIssue({
      code: 'custom',
      path: ['plannedUntil'],
      message: refusal('place.lastDayNeedsFirst'),
    })
    return
  }

  // `YYYY-MM-DD` compares chronologically as text, which is why these are
  // strings — see `marker-day.ts`.
  if (until <= from) {
    ctx.addIssue({
      code: 'custom',
      path: ['plannedUntil'],
      message: refusal('place.lastDayBeforeFirst'),
    })
    return
  }

  if (daysApart(from, until) > MAX_RUN_DAYS) {
    ctx.addIssue({
      code: 'custom',
      path: ['plannedUntil'],
      message: refusal('place.spanTooLong'),
    })
  }
}

/**
 * Whole days between two `YYYY-MM-DD` strings.
 *
 * Through `Date.UTC` on the parts rather than by parsing the string: both ends
 * are read the same way, so the difference is exact and carries none of the
 * zone behaviour of `new Date('2026-04-03')`. Nothing here is displayed, so UTC
 * is safe — it is arithmetic on two labels, not a moment.
 */
function daysApart(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  return (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000
}

/**
 * A last day equal to the first is recorded as absent.
 *
 * Runs before the refinement above, so "the 3rd to the 3rd" is a place planned
 * for one day rather than a refusal — a person who sets a run and then pulls it
 * back to a single day has said something ordinary, and the form should take it.
 * Only a pair that cannot be read as one day is refused.
 */
function collapseSingleDay<T extends { plannedOn?: string | null; plannedUntil?: string | null }>(
  value: T,
): T {
  if (value.plannedUntil != null && value.plannedUntil === value.plannedOn) {
    return { ...value, plannedUntil: null }
  }
  return value
}

/**
 * A local price and its currency come as a pair. The database refuses one
 * without the other, and this says so first, naming the price field.
 */
function localPriceComesWithCurrency(
  value: { localPrice?: number | null; localCurrency?: string | null },
  ctx: z.RefinementCtx,
) {
  const hasPrice = value.localPrice !== undefined && value.localPrice !== null
  const hasCurrency = value.localCurrency !== undefined && value.localCurrency !== null
  if (hasPrice !== hasCurrency) {
    ctx.addIssue({
      code: 'custom',
      path: ['localPrice'],
      message: refusal('place.localPriceNeedsCurrency'),
    })
  }
}

/**
 * Fields a client supplies when dropping a marker.
 *
 * `visited` is absent: a marker is not visited when it is saved, and the
 * database owns that default.
 *
 * `plannedOn` is defaulted rather than merely nullable, unlike the three other
 * optional fields. Those are absent-as-null because the form that writes them
 * has a control for every one, so it always has something to send.
 *
 * Both applications offer a day now, so neither relies on this default any
 * longer — and it stays anyway. A client that cannot express a day is a client
 * whose places have no day, which is the ordinary case rather than a caller
 * being careless, and the failure it prevents is not hypothetical: requiring the
 * key made every save from the phone fail validation the moment this field was
 * added, in the window before the phone had a control.
 *
 * What has changed since is who the four defaults answer for. `createMarker`
 * names `NewMarker` now rather than taking `unknown`, so neither application can
 * reach them: both are typechecked against this schema and must supply every
 * field, and leaving one out stops the build instead of the save. The defaults
 * are for the caller the compiler never sees — a script, a test, anything
 * reaching the data layer from outside — which is the population they were
 * always written for. Deleting them would take the runtime gate with them and
 * leave the build as the only thing checking, which is the mistake in the other
 * direction.
 */
export const newMarkerSchema = writableMarkerFields.extend({
  plannedOn: markerSchema.shape.plannedOn.default(null),
  // And again: a client that cannot express a run of days is a client whose
  // places are each planned for one day, which is nearly all of them.
  plannedUntil: markerSchema.shape.plannedUntil.default(null),
  // Defaulted for the same reason as `plannedOn`: a client that cannot express
  // hours yet is a client whose places have none, not one whose saves fail.
  hours: markerSchema.shape.hours.default(null),
  // And again: a client that predates local prices is one whose places have none.
  localPrice: markerSchema.shape.localPrice.default(null),
  localCurrency: markerSchema.shape.localCurrency.default(null),
})
  // Collapse before refining, so "the 3rd to the 3rd" is one day rather than a
  // refusal. The order is the decision; reversed, it would reject it.
  .transform(collapseSingleDay)
  .superRefine(localPriceComesWithCurrency)
  .superRefine(runOfDaysIsValid)

export type NewMarker = z.infer<typeof newMarkerSchema>

/**
 * What may be changed about a marker after it exists.
 *
 * Derived from the shared field list rather than written out again, so the two
 * cannot drift.
 *
 * Deliberately **not** derived from `newMarkerSchema`, which is where it used
 * to come from. A default survives `.partial()`: an absent key in a patch means
 * "leave this alone", so inheriting `plannedOn`'s default would have cleared
 * the day of every place edited by anything that did not mention one — the
 * phone's every edit, for a start. The two schemas want opposite things from
 * the same absent key, which is the whole reason the field list above is
 * separate from either.
 *
 * `tripId` is dropped: every access rule in the product resolves to the trip a
 * row belongs to, so an edit that could move a marker between trips would be an
 * edit that could move it out of reach. `visited` is absent for the same reason
 * it is absent from creation — it is recorded by marking a place visited, not by
 * editing a form.
 */
export const markerPatchSchema = writableMarkerFields
  .omit({ tripId: true })
  .partial()
  .transform(collapseSingleDay)
  .superRefine(localPriceComesWithCurrency)
  .superRefine(runOfDaysIsValid)

export type MarkerPatch = z.infer<typeof markerPatchSchema>

/**
 * The fields of a place the surface around the form already knows, as opposed
 * to the ones a person fills in.
 *
 * The trip is whichever one is open, and the position arrives from the map or
 * from a search result before the form is raised. Nobody types any of them, and
 * a form holding them would be a second place they could be wrong.
 *
 * Stated as the exclusions rather than as the fields a person types, and the
 * direction is the point. Every field not named here is one somebody can be
 * shown a refusal about, so a field added to a place joins that set on its own —
 * which is what `refusal-messages.test.ts` relies on to notice a new field that
 * was given no message of its own. A list of the fields that need one would
 * default a new field to needing nothing, which is the case the test exists for.
 */
export const MARKER_SURFACE_FIELDS = ['tripId', 'lng', 'lat'] as const

/**
 * The fields of a place a person fills in, as opposed to the ones the surface
 * around them already knows.
 *
 * Derived from `NewMarker` rather than written out, and that is the whole point
 * of it existing. Both applications build their capture form from this one list,
 * so a field added to a marker is a field both of them stop compiling without —
 * in the change that adds it, rather than in whichever application somebody
 * remembered. Written out by hand it was two lists, and the day a field reached
 * only one of them every save from the phone was refused.
 *
 * Note which type it derives from: `NewMarker` is what the schema produces,
 * after its defaults have been applied, so every field is present here. The type
 * the schema *accepts* would mark the four defaulted fields optional and let a
 * form go on compiling with one of them dropped, which is the failure above.
 */
export type MarkerFormValues = Omit<NewMarker, (typeof MARKER_SURFACE_FIELDS)[number]>
