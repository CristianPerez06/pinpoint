import { markerTypeOf } from '@pinpoint/map'

import { type IsoDay, runOfDays } from './marker-day'
import type { MarkerInterest } from './marker-interest'

/**
 * Which markers a trip is narrowed to, and what each choice means.
 *
 * The definitions live here rather than in either application because they are
 * facts about markers and members, not about drawing. The map and the list both
 * need them, and a list draws no map — so `@pinpoint/map` would be the wrong
 * home even though the map is the most visible consumer.
 *
 * Two implementations of "wanted by both of us" would eventually disagree, and
 * the disagreement would surface as a place appearing on a laptop and missing on
 * a phone. That reads as a data problem and would not be one.
 *
 * ## Five questions, and two of them compose the other way
 *
 * `interest` asks for the places **every** named member wants. `kind` and `day`
 * ask for the places matching **any** of what is chosen. That is not an
 * oversight to be tidied up later: a place has exactly one kind, so requiring
 * every chosen kind at once would always select nothing, and two days are not
 * simultaneously true of a place either.
 *
 * The risk this creates is in the interface rather than here — two lists of tick
 * boxes in one panel are read as meaning the same thing — so the specification
 * requires the control to say which question it is asking in words. If that
 * wording ever goes, this comment is the record of why it was there.
 */

/**
 * Who has to want a place for it to be shown.
 *
 * Three states rather than a set plus a mode, because the states are mutually
 * exclusive and a shape that can hold two of them at once is a shape somebody
 * eventually puts two of them in. "Nobody has answered" is not a person, so it
 * cannot be one of the people.
 *
 * `wanted-by` means **every** named member has recorded interest, which is the
 * question this product exists to answer — the places we both want to go. Naming
 * two people and getting back the places either of them wants would be a
 * different question and a much longer list.
 */
export type InterestFilter =
  | { readonly kind: 'anyone' }
  | { readonly kind: 'wanted-by'; readonly members: readonly string[] }
  | { readonly kind: 'unanswered' }

export type VisitedFilter = 'any' | 'unvisited' | 'visited'

/**
 * Which kinds of place to show.
 *
 * A union rather than an array whose emptiness means "any", because the array
 * next door means the opposite when it is empty: naming no members selects
 * nothing, and naming no kinds would have to select everything. Two arrays in
 * one object with opposite empty-semantics is a question somebody has to answer
 * again every time they read this file.
 *
 * `one-of` because a place has exactly one kind. Requiring all of them — which
 * is what `wanted-by` does with members — would always select nothing.
 */
export type KindFilter =
  | { readonly kind: 'any' }
  | { readonly kind: 'one-of'; readonly kinds: readonly string[] }

/**
 * Which day's places to show.
 *
 * The same three-state shape as `InterestFilter`, for the same reason and with
 * the same middle case. `undated` is not a day, so it cannot be one of the days
 * — and it replaces a choice of days rather than joining it: "Thursday, and also
 * the ones with no day" is two questions wearing one answer.
 *
 * Days are `YYYY-MM-DD` strings throughout, never `Date`s — see `marker-day.ts`
 * for why that distinction is load-bearing rather than stylistic.
 */
export type DayFilter =
  | { readonly kind: 'any' }
  | { readonly kind: 'on'; readonly days: readonly IsoDay[] }
  | { readonly kind: 'undated' }

/**
 * Whether to show only the places filed under no city.
 *
 * Two states, because narrowing to a *named* city is deliberately not offered.
 * A city here is a name somebody chose for a cluster of places rather than a
 * geographical fact, so hiding everything filed under a different name can hide
 * a place that is genuinely around the corner — which is the question the
 * product exists to answer. Measured on a real six-city trip: framing on the
 * largest city puts seven of a neighbouring city's eight places on screen.
 *
 * Being filed under *no* city is different in kind. It is a state of the record
 * rather than a location, so hiding the places that do have one says nothing
 * false about what is near what.
 */
export type CityFilter = 'any' | 'unfiled'

export interface MarkerFilter {
  readonly interest: InterestFilter
  readonly visited: VisitedFilter
  readonly kind: KindFilter
  readonly day: DayFilter
  readonly city: CityFilter
}

/**
 * What a filter needs to know about a marker.
 *
 * Structural rather than `Marker` itself, so that anything carrying these five
 * fields can be asked — which is what lets the tests state a case in one line
 * instead of building a whole marker to ask about its day.
 */
export interface FilterableMarker {
  readonly visited: boolean
  readonly type: string
  readonly plannedOn: IsoDay | null
  readonly plannedUntil: IsoDay | null
  readonly cityId: string | null
}

/**
 * The state a trip opens in.
 *
 * Named rather than written as a literal at each call site, because "unfiltered"
 * is a guarantee the specification makes — every marker stays reachable — and a
 * guarantee is easier to keep when it has one definition.
 */
export const NO_FILTER: MarkerFilter = {
  interest: { kind: 'anyone' },
  visited: 'any',
  kind: { kind: 'any' },
  day: { kind: 'any' },
  city: 'any',
}

/** Whether anything is being hidden, so a narrowed view can say that it is. */
export function isFiltered(filter: MarkerFilter): boolean {
  return activeFilterCount(filter) > 0
}

/**
 * How many of the filter's questions are being asked at once.
 *
 * Here rather than in either interface, by the same rule as everything else in
 * this file: what a filter *means* is defined once so the map, the card and both
 * applications agree. A control that declares "2" on the laptop and "3" on the
 * phone for the same filter would be two answers to one question.
 *
 * It counts **criteria, not choices**. Naming five people is still one question
 * — "which places do all of these people want" — and answering it with `5` would
 * describe the input rather than the narrowing. `Nobody has answered yet`
 * replaces the names rather than joining them, so it is the same single
 * criterion seen from the other side.
 *
 * The ceiling is therefore the number of questions this filter can ask, which is
 * five, and it does not move when a trip gains members, kinds or days. That is
 * the point: the number has to mean the same thing on a trip of two and a trip
 * of ten, in its first week and in its last.
 *
 * Five and still one digit, which is what lets the trigger keep the settled
 * 124px slot `#87` gave it. A control whose width follows its own state drags
 * its own panel out from under whoever is choosing inside it.
 */
export function activeFilterCount(filter: MarkerFilter): number {
  return (
    (filter.interest.kind !== 'anyone' ? 1 : 0) +
    (filter.visited !== 'any' ? 1 : 0) +
    (filter.kind.kind !== 'any' ? 1 : 0) +
    (filter.day.kind !== 'any' ? 1 : 0) +
    (filter.city !== 'any' ? 1 : 0)
  )
}

/**
 * Whether one marker survives the filter.
 *
 * The trip's membership is not a parameter: the filter names the members it asks
 * about, so "have all of them recorded interest" can be decided from the
 * question itself. That also means a record belonging to somebody not named is
 * ignored, which is what stops a member who has left from still casting a vote.
 */
export function matchesFilter(
  marker: FilterableMarker,
  interest: readonly Pick<MarkerInterest, 'memberId' | 'interested'>[],
  filter: MarkerFilter,
): boolean {
  return (
    matchesInterest(interest, filter.interest) &&
    matchesVisited(marker, filter.visited) &&
    matchesKind(marker, filter.kind) &&
    matchesDay(marker, filter.day) &&
    matchesCity(marker, filter.city)
  )
}

function matchesInterest(
  interest: readonly Pick<MarkerInterest, 'memberId' | 'interested'>[],
  filter: InterestFilter,
): boolean {
  switch (filter.kind) {
    case 'anyone':
      return true

    case 'wanted-by': {
      /*
       * Naming nobody selects nothing, rather than everything. "Every named
       * member wants this" is vacuously true of no names, which would put the
       * whole trip in the pile that is supposed to mean agreement.
       *
       * The control does not produce this — unticking the last person returns it
       * to `anyone` — so this is the guard for the case where something else
       * does, not a state a person can reach.
       */
      if (filter.members.length === 0) return false

      return filter.members.every((memberId) =>
        interest.some(
          (record) => record.memberId === memberId && record.interested,
        ),
      )
    }

    case 'unanswered':
      /*
       * The absence of every record, not "everybody declined". A place the two
       * of you turned down is a decision that was made; one nobody has answered
       * is a decision still waiting, and it is the second this pile exists to
       * surface — the set that is invisible in a spreadsheet.
       */
      return interest.length === 0
  }
}

function matchesVisited(
  marker: { readonly visited: boolean },
  choice: VisitedFilter,
): boolean {
  switch (choice) {
    case 'any':
      return true
    case 'unvisited':
      return !marker.visited
    case 'visited':
      return marker.visited
  }
}

/**
 * Whether a marker is one of the kinds asked for.
 *
 * **Matched on the kind the marker is drawn as, never on its stored string.**
 * The column is unconstrained text: `markerTypeOf` resolves a retired
 * identifier to the type that replaced it and anything unknown to the fallback,
 * and never rejects. So a row holding `castle` draws as `culture`, and a row
 * holding a value nothing has ever defined draws as `place`.
 *
 * Comparing the raw string instead would make narrowing to the kind you can see
 * on the map hide the very place you were looking at — no error, no failing
 * test, and a result that reads as a data problem and is not one.
 *
 * Note what this deliberately does not do: `isMarkerType` in `@pinpoint/map`
 * answers the *write* question and is what `markerTypeSchema` refines on, and
 * it is not a type predicate on purpose. Reaching for it here, or making it one,
 * retypes `Marker.type` through every consumer of that schema.
 */
function matchesKind(marker: { readonly type: string }, filter: KindFilter): boolean {
  switch (filter.kind) {
    case 'any':
      return true
    case 'one-of': {
      /*
       * Choosing nothing selects everything, which is the opposite of what
       * naming no members does one question up. The control does not produce
       * this — unticking the last kind returns it to `any` — so it is the guard
       * for the case where something else does.
       */
      if (filter.kinds.length === 0) return true

      const drawnAs = markerTypeOf(marker.type).id
      return filter.kinds.includes(drawnAs)
    }
  }
}

/**
 * Whether a marker is planned for one of the days asked for.
 *
 * `on` matches **any** of the days, so two days that are not next to each other
 * can be asked for together — which is the whole reason the days are a set
 * rather than a stretch between two dates.
 *
 * A place planned for several days matches when any one of them is chosen. That
 * rule was written here before a place could carry more than one day, so that
 * whatever added them would inherit it rather than decide it a second time —
 * and it was: `runOfDays` below is the whole of that inheritance.
 */
function matchesDay(
  marker: {
    readonly plannedOn: IsoDay | null
    readonly plannedUntil: IsoDay | null
  },
  filter: DayFilter,
): boolean {
  switch (filter.kind) {
    case 'any':
      return true
    case 'on': {
      // As above: no days chosen is not a question, and asking it of a set that
      // cannot answer would empty the map.
      if (filter.days.length === 0) return true
      if (marker.plannedOn == null) return false
      return runOfDays(marker).some((day) => filter.days.includes(day))
    }
    case 'undated':
      // Still the first day alone: a place waiting for a day is one with no
      // day at all, and a run has chosen its days like any other place.
      return marker.plannedOn == null
  }
}

/**
 * Whether a marker is filed under no city.
 *
 * There is no counterpart for a named city, and that is the decision rather
 * than a gap — see `CityFilter`.
 */
function matchesCity(
  marker: { readonly cityId: string | null },
  choice: CityFilter,
): boolean {
  switch (choice) {
    case 'any':
      return true
    case 'unfiled':
      return marker.cityId == null
  }
}
