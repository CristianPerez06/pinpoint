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
  interest: { kind: 'anyone' },
  visited: 'any',
}

/** Whether anything is being hidden, so a narrowed view can say that it is. */
export function isFiltered(filter: MarkerFilter): boolean {
  return filter.interest.kind !== 'anyone' || filter.visited !== 'any'
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
 * two, and it does not move when a trip gains members. That is the point: the
 * number has to mean the same thing on a trip of two and a trip of ten.
 */
export function activeFilterCount(filter: MarkerFilter): number {
  return (
    (filter.interest.kind !== 'anyone' ? 1 : 0) +
    (filter.visited !== 'any' ? 1 : 0)
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
