import { z } from 'zod'

import { currencyCodeSchema } from './currency'
import { refusal } from './field-errors'

/**
 * A coarse grouping of markers within a trip — the spreadsheet tab.
 *
 * A city belongs to one trip and is never shared between trips: two trips
 * visiting the same place each get their own record, so renaming one never
 * reaches the other. The duplicated name costs nothing.
 *
 * Cities answer "which day are we doing?". The finer question — what is close
 * enough to bundle into one outing — is answered by the map, not by a field.
 *
 * The name is whatever the person chose for a group of nearby places. It is
 * usually a real city, and nothing depends on it being one — no lookup resolves
 * it to a position, because the markers filed under it already say where the
 * group is.
 */
export const citySchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  name: z
    .string()
    .min(1, refusal('city.needsName'))
    .max(120, refusal('city.nameTooLong')),
  /**
   * An optional second currency beside US dollars, or null for none. Places
   * filed here can also hold a price in it. See `currency.ts`.
   */
  currency: currencyCodeSchema.nullable(),
  createdAt: z.iso.datetime(),
})

export type City = z.infer<typeof citySchema>

/**
 * The fields of a city the surface already knows. The trip is whichever one is
 * open; a person types the name and picks the currency.
 *
 * Stated as the exclusions for the reason `MARKER_SURFACE_FIELDS` gives: every
 * field not named here must carry a refusal message of its own, so a field
 * added to a city joins that set without anybody remembering to say so.
 */
export const CITY_SURFACE_FIELDS = ['tripId'] as const

export const newCitySchema = citySchema
  .pick({
    tripId: true,
    name: true,
  })
  .extend({
    // Most cities have none, and a caller that does not mention it wants none.
    currency: citySchema.shape.currency.default(null),
  })

export type NewCity = z.infer<typeof newCitySchema>

/**
 * What may be changed about a city after it exists.
 *
 * A city is usually created mid-flow while saving a place, with whatever was
 * known at that moment. Without this, a name typed in a hurry would be
 * permanent.
 *
 * `tripId` is absent deliberately: moving a city between trips would strand
 * every marker filed under it on the wrong side of the boundary all access
 * resolves to.
 */
export const cityPatchSchema = citySchema
  .pick({ name: true, currency: true })
  .partial()

export type CityPatch = z.infer<typeof cityPatchSchema>

/**
 * What a city selection is set to when it means "the places no city holds".
 *
 * A city id is a uuid, so no real city can ever collide with this. It travels
 * in the web application's URL as `?city=unassigned`, which is why it reads as
 * a word rather than as a symbol nobody could guess the meaning of.
 *
 * `null` already means something else and could not be reused: it is *all
 * places*, the whole trip, which is a wider view rather than a narrower one.
 * Three states, three values.
 */
export const UNASSIGNED_CITY = 'unassigned'

/**
 * Which of a trip's markers a city selection means.
 *
 * Here rather than in either application by the same rule as `marker-filter.ts`:
 * two implementations of "the unassigned ones" would eventually disagree, and
 * the disagreement would surface as a row counting four places and a map drawing
 * three. That reads as a data problem and would not be one.
 *
 * ## This answers where to point the camera. It does not hide anything.
 *
 * Every caller uses it for two jobs — framing the map, and biasing place search
 * — and none of them narrows the drawn set with it. That set is decided by
 * `matchesFilter` alone, and selecting a city must never reach it.
 *
 * `marker-filtering` said otherwise for as long as it existed: that selecting
 * the unassigned group showed the unfiled places "and places filed under a city
 * are not". No application ever did it, and the requirement has been corrected
 * rather than implemented, for two reasons worth keeping.
 *
 * A city here is a name somebody chose for a cluster of places, not a
 * geographical fact — nothing resolves a city name to a position — so hiding
 * everything filed under a different name can hide a place that is genuinely
 * around the corner, which is the question the product exists to answer. That
 * was measured rather than argued: on a real six-city trip, framing on the
 * largest city puts seven of a neighbouring city's eight places on screen,
 * because the two are about as far apart as the larger one's own places are
 * spread. And where a city's places do not reach its neighbours, framing has
 * already narrowed the view without hiding anything.
 *
 * The other reason is that this control declares nothing. Narrowing from here
 * would hide places with nothing on screen saying so and no way back, which is
 * the failure `marker-filtering` exists to prevent. Being filed under *no* city
 * is still a thing worth narrowing to — it is a state of the record rather than
 * a location — and it is offered by the filter, where a control says that it
 * has narrowed the view and offers the way out.
 */
export function markersSelectedBy<M extends { readonly cityId: string | null }>(
  selection: string | null,
  markers: readonly M[],
): readonly M[] {
  if (selection === null) return markers
  if (selection === UNASSIGNED_CITY)
    return markers.filter((marker) => marker.cityId === null)
  return markers.filter((marker) => marker.cityId === selection)
}
