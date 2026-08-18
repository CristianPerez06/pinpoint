import type { MarkerInterest } from './marker-interest'

/**
 * Which markers a trip is narrowed to, and what each choice means.
 *
 * The definitions live here rather than in either application because they are
 * facts about markers and members, not about drawing. The map and the list both
 * need them, and a list draws no map — so `@pinpoint/map` would be the wrong
 * home even though the map is the most visible consumer.
 *
 * Two implementations of "both of you want to go" would eventually disagree, and
 * the disagreement would surface as a place appearing on a laptop and missing on
 * a phone. That reads as a data problem and would not be one.
 */

/**
 * How the chosen members combine.
 *
 * Separating *who is being asked about* from *how many of them must want it* is
 * what lets one control answer a two-person trip and a six-person one. The
 * questions a pair of travellers actually asks — do we both want this, does
 * either of us, do we disagree, has neither of us looked at it — are this
 * quantifier applied to every member. The same four questions asked of a subset
 * are what a larger trip needs, and they arrive for free rather than as four
 * more named choices.
 *
 * `unfiltered` is a member of this set rather than a separate flag because the
 * control offers it in the same menu, and a state the interface can reach has to
 * be a state the model can hold.
 */
export type InterestQuantifier =
  | 'unfiltered'
  | 'all'
  | 'at-least-one'
  | 'exactly-one'
  | 'none'

export interface InterestFilter {
  /**
   * Whose answers are being asked about.
   *
   * Records belonging to anybody outside this set are ignored, which is what
   * keeps a member who has left the trip from still casting a vote. That used to
   * need its own rule; now it falls out of asking the question about named
   * people.
   */
  readonly members: readonly string[]
  readonly quantifier: InterestQuantifier
}

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
export const NO_FILTER: MarkerFilter = {
  interest: { members: [], quantifier: 'unfiltered' },
  visited: 'any',
}

/** Whether anything is being hidden, so a narrowed view can say that it is. */
export function isFiltered(filter: MarkerFilter): boolean {
  return filter.interest.quantifier !== 'unfiltered' || filter.visited !== 'any'
}

/**
 * Whether one marker survives the filter.
 *
 * The trip's membership is not a parameter, unlike the version this replaces.
 * The filter names the members it is asking about, so "have all of them recorded
 * interest" can be decided from the question itself — and a question about
 * nobody in particular is no longer answerable by accident.
 */
export function matchesFilter(
  marker: { readonly visited: boolean },
  interest: readonly Pick<MarkerInterest, 'memberId' | 'interested'>[],
  filter: MarkerFilter,
): boolean {
  return (
    matchesInterest(interest, filter.interest) &&
    matchesVisited(marker, filter.visited)
  )
}

function matchesInterest(
  interest: readonly Pick<MarkerInterest, 'memberId' | 'interested'>[],
  filter: InterestFilter,
): boolean {
  if (filter.quantifier === 'unfiltered') return true

  /*
   * A question asked about nobody selects nothing, rather than everything.
   *
   * Three of the four quantifiers already answer false over an empty set, but
   * `all` and `none` are both vacuously true of nobody — which would put every
   * marker in a pile that is supposed to mean agreement, or every marker in the
   * one that is supposed to mean silence.
   *
   * Selecting nothing rather than quietly falling back to unfiltered is the
   * choice that stays visible: the view says no places match, which is what has
   * actually been asked for, instead of the filter appearing to switch itself
   * off while the control still reads as set.
   */
  if (filter.members.length === 0) return false

  const recorded = interest.filter((record) =>
    filter.members.includes(record.memberId),
  )
  const wanted = recorded.filter((record) => record.interested).length

  switch (filter.quantifier) {
    case 'all':
      return wanted === filter.members.length
    case 'at-least-one':
      return wanted > 0
    case 'exactly-one':
      return wanted === 1
    case 'none':
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
