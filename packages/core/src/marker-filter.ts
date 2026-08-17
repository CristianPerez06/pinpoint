import type { MarkerInterest } from './marker-interest'

/**
 * Which markers a trip is narrowed to, and what each choice means.
 *
 * The definitions live here rather than in either application because they are
 * facts about markers and members, not about drawing. The map and the list both
 * need them, and a list draws no map — so `@pinpoint/map` would be the wrong
 * home even though the map is the most visible consumer.
 *
 * Two implementations of "both" would eventually disagree, and the disagreement
 * would surface as a place appearing on a laptop and missing on a phone. That
 * reads as a data problem and would not be one.
 */

/**
 * Who wants to go.
 *
 * The names are the vocabulary the roadmap uses, written for two travellers,
 * while the meanings below are defined over however many members a trip has. A
 * third member makes `only-one` read oddly; it does not make it return the wrong
 * markers, which is the property worth protecting.
 */
export type InterestFilter = 'any' | 'both' | 'either' | 'only-one' | 'nobody'

export type VisitedFilter = 'any' | 'unvisited' | 'visited'

export interface MarkerFilter {
  readonly interest: InterestFilter
  readonly visited: VisitedFilter
}

/**
 * The state a trip opens in.
 *
 * Named rather than written as a literal at each call site, because "unfiltered"
 * is a guarantee the specification makes — every marker stays reachable — and a
 * guarantee is easier to keep when it has one definition.
 */
export const NO_FILTER: MarkerFilter = { interest: 'any', visited: 'any' }

/** Whether anything is being hidden, so a narrowed view can say that it is. */
export function isFiltered(filter: MarkerFilter): boolean {
  return filter.interest !== 'any' || filter.visited !== 'any'
}

/**
 * Whether one marker survives the filter.
 *
 * `memberIds` is a parameter rather than something this reaches for: "every
 * member has recorded interest" cannot be decided without knowing how many
 * members there are, and a pure function has to be told.
 *
 * Records belonging to somebody who is not a member of the trip are ignored. A
 * member who has left should not still be casting a vote, and counting them
 * would make `both` unsatisfiable in a way nobody could see.
 */
export function matchesFilter(
  marker: { readonly visited: boolean },
  interest: readonly Pick<MarkerInterest, 'memberId' | 'interested'>[],
  memberIds: readonly string[],
  filter: MarkerFilter,
): boolean {
  return matchesInterest(interest, memberIds, filter.interest) &&
    matchesVisited(marker, filter.visited)
}

function matchesInterest(
  interest: readonly Pick<MarkerInterest, 'memberId' | 'interested'>[],
  memberIds: readonly string[],
  choice: InterestFilter,
): boolean {
  if (choice === 'any') return true

  const recorded = interest.filter((record) => memberIds.includes(record.memberId))
  const wanted = recorded.filter((record) => record.interested).length

  switch (choice) {
    case 'both':
      // Guarded against a trip with no members, where "every member wants to go"
      // is vacuously true and would put every marker in a pile that is supposed
      // to mean agreement.
      return memberIds.length > 0 && wanted === memberIds.length
    case 'either':
      return wanted > 0
    case 'only-one':
      return wanted === 1
    case 'nobody':
      // The absence of every record, not "everybody declined". A marker the two
      // of you have turned down is a decision that was made; one nobody has
      // answered is a decision still waiting. Collapsing them would bury the
      // second inside the first, and the second is the whole point of the pile.
      return recorded.length === 0
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
