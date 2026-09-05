import { distanceKm } from '@pinpoint/map'

/**
 * Which of a trip's cities a place belongs to, decided from the place itself.
 *
 * Here rather than in either application for the reason `marker-filter.ts`
 * gives: two implementations would eventually disagree, and the disagreement
 * would surface as one temple filed under Kyoto on a laptop and under Nara on a
 * phone. That reads as a data problem and would not be one.
 *
 * The whole rule rests on a decision `city.ts` records: a city has no position.
 * *"No lookup resolves it to a position, because the markers filed under it
 * already say where the group is."* So "where is Kyoto" is only answerable as
 * "where are the places filed under Kyoto", and a city with nothing filed under
 * it is not answerable at all.
 */

/**
 * How near a city's places a place has to be for that city to claim it.
 *
 * **Floored by measurement and chosen above that floor.** The distinction
 * matters and is not pedantry. Measured against the live trip before any of this
 * was written: a place sits within 4.61 km of the nearest other place in its own
 * city, and 360.78 km from the nearest place in a different one. The
 * distributions do not overlap, which is what establishes that a threshold
 * exists at all — but they are so far apart that any value between about 5 km
 * and 360 km behaves identically on that data.
 *
 * So the readings set a floor and did not choose the number. 15 km is roughly
 * three times the observed maximum, so a city whose places are more spread than
 * any measured still holds together, and it is comfortably below the ~35 km that
 * separates two cities close enough to be day trips of one another, so neither
 * can reach into the other.
 *
 * That boundary case is absent from the only trip there is to measure, and this
 * wants revisiting against a trip whose cities are near each other. Calling the
 * number "measured" would let a later reader believe it had been tested.
 */
export const CITY_CLAIM_KM = 15

/**
 * A place being filed, seen only as where it is and what its city was called.
 *
 * `city` is optional rather than nullable so that a bare position satisfies this
 * without asserting anything it does not know — pointing at the map produces no
 * city name, and `undefined` and `null` mean the same thing here.
 */
export interface PlaceBeingFiled {
  readonly lng: number
  readonly lat: number
  readonly city?: string | null
}

/** A marker, seen only as a position and the city it is filed under. */
export interface FiledPlace {
  readonly cityId: string | null
  readonly lng: number
  readonly lat: number
}

/** A city, seen only as its identity and its name. */
export interface NamedCity {
  readonly id: string
  readonly name: string
}

/**
 * What the trip's cities had to say about a place.
 *
 * One closed value rather than a city-or-null, because there are three outcomes
 * and only two of them are "we know". A caller handed `null` has to infer from
 * somewhere else whether that means *nowhere near anything* or *near two things
 * at once*, and the second is the case it will get wrong.
 *
 * `none` carries the name to offer creating. It is carried here rather than left
 * to the caller so that one invariant has one home: a city is never offered
 * under a name the trip already holds, because a name the trip holds was matched
 * above and returned as `one`.
 */
export type CityClaim<C extends NamedCity = NamedCity> =
  | { readonly kind: 'one'; readonly city: C }
  | { readonly kind: 'several'; readonly cities: readonly C[] }
  | { readonly kind: 'none'; readonly offer: string | null }

/**
 * Case, surrounding whitespace and accents folded away — and nothing else.
 *
 * Deliberately not fuzzy. A city somebody named "Kyoto days" does not match
 * "Kyoto", and "京都" does not match either; both fall through to position, which
 * is the right answer rather than a shortfall. Anything looser starts filing
 * places under cities on the strength of a shared prefix.
 */
function normalized(name: string): string {
  return name
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * How far a place is from a city's nearest marker, or null if it has none.
 *
 * Nearest marker rather than the centre of them. A city is *"whatever the person
 * chose for a group of nearby places"*, so the honest test is "is this near the
 * places already in that group", which nearest-marker measures literally. The
 * centre — one point, stable, already computed for search bias — fails where a
 * city's markers are spread or fall in two clusters, putting its own edge eight
 * kilometres from itself and a bimodal city's centre in empty ground between the
 * two halves.
 */
function nearestKm(
  place: PlaceBeingFiled,
  cityId: string,
  markers: readonly FiledPlace[],
): number | null {
  let nearest: number | null = null

  for (const marker of markers) {
    if (marker.cityId !== cityId) continue
    const km = distanceKm(place, marker)
    if (nearest === null || km < nearest) nearest = km
  }

  return nearest
}

/**
 * The city a place belongs to, or the honest absence of one.
 *
 * **The name is asked first.** "Which city is this place in" is the question
 * being asked and the geocoding service answers it directly; proximity to a
 * trip's own markers is a proxy for the same answer. Where the direct answer is
 * in hand, preferring the proxy is strange — a trip holding a city called Nara
 * and a service reporting the place is in Nara is not a coincidence to be
 * overruled because the other Nara places happen to be filed further away.
 *
 * The name half is also load-bearing defensively, which is what settled the
 * order. A city created in the list before anything is filed under it holds no
 * markers, so it claims nothing by position, so a place plainly inside it would
 * reach the `none` branch and be offered *"create Nara"* on a trip that already
 * has Nara — two cities of one name, produced by the feature meant to prevent
 * exactly that.
 *
 * The name cannot be the whole rule either: it misses "Kyoto days", misses
 * "京都", and across most of a large metropolitan area the service answers with
 * the ward rather than the city. Those misses are ordinary, and they fall
 * through to position, which is why both halves exist.
 *
 * Cities are not ranked and the nearest is not preferred. Each either claims the
 * place or does not. Picking the closest of two claimants would reproduce the
 * defect this exists to remove at a lower rate — still confident, still silent,
 * still sometimes wrong — and a rule that is wrong rarely is harder to distrust
 * than one that is wrong often.
 */
export function cityClaiming<C extends NamedCity>(
  place: PlaceBeingFiled,
  cities: readonly C[],
  markers: readonly FiledPlace[],
): CityClaim<C> {
  const reported = place.city?.trim() ?? ''

  if (reported !== '') {
    const key = normalized(reported)
    const named = cities.filter((city) => normalized(city.name) === key)

    // Two cities of one name is a trip this feature exists to prevent making,
    // not one it can rule out having been handed. Choosing between them by list
    // order would be choosing on somebody's behalf, so it goes to the branch
    // that says so.
    if (named.length === 1) return { kind: 'one', city: named[0]! }
    if (named.length > 1) return { kind: 'several', cities: named }
  }

  const claiming = cities.filter((city) => {
    const km = nearestKm(place, city.id, markers)
    // A city with no markers claims nothing, because there is nothing to measure
    // from. Transient — it ends with that city's first marker — and it fails
    // toward "say so" rather than toward a wrong city.
    return km !== null && km <= CITY_CLAIM_KM
  })

  if (claiming.length === 1) return { kind: 'one', city: claiming[0]! }
  if (claiming.length > 1) return { kind: 'several', cities: claiming }

  // Reaching here means no city of the reported name exists on this trip: one
  // would have been returned above, whatever the distance. So offering the name
  // cannot produce a second city under it.
  return { kind: 'none', offer: reported === '' ? null : reported }
}

/**
 * What the form says about where it filed a place, when it says anything.
 *
 * `offer` is a city name to create, prefilled into the path the form already
 * has for that. Null when there is nothing to name — a position pointed at on
 * the map, or a service that reported no city — in which case the message says
 * only what is true and the field is left empty.
 */
export interface CityNotice {
  readonly message: string
  readonly offer: string | null
}

/** `a`, `a and b`, `a, b and c`. */
function listed(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/**
 * The sentence a claim is worth, or nothing at all.
 *
 * The words live here, beside the rule, for the reason the rule itself does:
 * two of them would drift, and a laptop and a phone explaining the same filing
 * differently is worse than either wording. `@pinpoint/geocode` already keeps
 * `SEARCH_FAILED_MESSAGE` on the same argument.
 *
 * **Returning null is a requirement, not an omission.** A place near the city
 * being worked in says nothing at all — no badge, no confirmation, no note. It
 * is the ordinary case, it is the one no test here can observe, and a form that
 * remarks on every save is noise that buries the three times a trip this
 * matters.
 *
 * `workingIn` is the city selected, or null for the whole trip. With nothing
 * selected there is no city being worked in, so every filled-in city is
 * announced — which is also the honest thing to do, since that view used to
 * leave a place unfiled and now does not.
 */
export function cityNoticeFor<C extends NamedCity>(
  claim: CityClaim<C>,
  workingIn: string | null,
): CityNotice | null {
  switch (claim.kind) {
    case 'one':
      if (claim.city.id === workingIn) return null
      return {
        message: `Filed under ${claim.city.name}, which is where this place is.`,
        offer: null,
      }

    case 'several':
      return {
        message: `More than one city is near enough to hold this: ${listed(
          claim.cities.map((city) => city.name),
        )}. Choose one.`,
        offer: null,
      }

    case 'none':
      return {
        message:
          claim.offer === null
            ? 'Not near any city on this trip. Choose one, or leave it unassigned.'
            : `Not near any city on this trip. This place is in ${claim.offer}.`,
        offer: claim.offer,
      }
  }
}
