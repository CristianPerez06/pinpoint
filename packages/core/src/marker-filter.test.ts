import { describe, expect, it } from 'vitest'

import { isFiltered, matchesFilter, NO_FILTER, type MarkerFilter } from './marker-filter'

const ANA = 'member-ana'
const BEN = 'member-ben'
const BOTH_MEMBERS = [ANA, BEN]

const unvisited = { visited: false }
const visited = { visited: true }

const wants = (memberId: string) => ({ memberId, interested: true })
const declines = (memberId: string) => ({ memberId, interested: false })

const by = (interest: MarkerFilter['interest']): MarkerFilter => ({
  interest,
  visited: 'any',
})

describe('matchesFilter — who wants to go', () => {
  it('shows everything when nothing is being asked', () => {
    expect(matchesFilter(unvisited, [], BOTH_MEMBERS, NO_FILTER)).toBe(true)
    expect(matchesFilter(visited, [declines(ANA)], BOTH_MEMBERS, NO_FILTER)).toBe(true)
  })

  it('selects a marker every member wants under "both"', () => {
    const interest = [wants(ANA), wants(BEN)]
    expect(matchesFilter(unvisited, interest, BOTH_MEMBERS, by('both'))).toBe(true)
  })

  it('does not select a marker one member has not answered under "both"', () => {
    // This is the unclaimed-member case: a trip whose second person has never
    // signed in can never satisfy "both", and that has to be a pinned fact
    // rather than something discovered while wondering why the pile is empty.
    const interest = [wants(ANA)]
    expect(matchesFilter(unvisited, interest, BOTH_MEMBERS, by('both'))).toBe(false)
  })

  it('never satisfies "both" on a trip with no members', () => {
    // "Every member wants to go" is vacuously true of nobody, which would put
    // every marker into a pile that is supposed to mean agreement.
    expect(matchesFilter(unvisited, [], [], by('both'))).toBe(false)
  })

  it('selects on any single yes under "either"', () => {
    expect(matchesFilter(unvisited, [wants(ANA)], BOTH_MEMBERS, by('either'))).toBe(true)
    expect(
      matchesFilter(unvisited, [wants(ANA), declines(BEN)], BOTH_MEMBERS, by('either')),
    ).toBe(true)
  })

  it('does not count a declining member as interest under "either"', () => {
    const interest = [declines(ANA), declines(BEN)]
    expect(matchesFilter(unvisited, interest, BOTH_MEMBERS, by('either'))).toBe(false)
  })

  it('selects exactly one yes under "only-one"', () => {
    expect(
      matchesFilter(unvisited, [wants(ANA), declines(BEN)], BOTH_MEMBERS, by('only-one')),
    ).toBe(true)
    // Undecided is not a no, but it is not a yes either — one yes is one yes.
    expect(matchesFilter(unvisited, [wants(ANA)], BOTH_MEMBERS, by('only-one'))).toBe(true)
    expect(
      matchesFilter(unvisited, [wants(ANA), wants(BEN)], BOTH_MEMBERS, by('only-one')),
    ).toBe(false)
  })

  it('selects only markers nobody has answered under "nobody"', () => {
    expect(matchesFilter(unvisited, [], BOTH_MEMBERS, by('nobody'))).toBe(true)
  })

  it('does not treat "everybody declined" as "nobody yet"', () => {
    // The distinction the whole triage pile rests on. A place the two of you
    // turned down is a decision that was made; one nobody has answered is a
    // decision still waiting, and it is the second the pile exists to surface.
    const interest = [declines(ANA), declines(BEN)]
    expect(matchesFilter(unvisited, interest, BOTH_MEMBERS, by('nobody'))).toBe(false)
  })

  it('ignores records belonging to somebody who is not a member', () => {
    // A member who has left should not still be casting a vote — and counting
    // them would make "both" unsatisfiable in a way nobody could see.
    const interest = [wants(ANA), wants(BEN), wants('member-who-left')]
    expect(matchesFilter(unvisited, interest, BOTH_MEMBERS, by('both'))).toBe(true)
    expect(matchesFilter(unvisited, [wants('member-who-left')], BOTH_MEMBERS, by('nobody')))
      .toBe(true)
  })
})

describe('matchesFilter — visited', () => {
  it('narrows to places not yet seen', () => {
    const filter: MarkerFilter = { interest: 'any', visited: 'unvisited' }
    expect(matchesFilter(unvisited, [], BOTH_MEMBERS, filter)).toBe(true)
    expect(matchesFilter(visited, [], BOTH_MEMBERS, filter)).toBe(false)
  })

  it('narrows to places already seen', () => {
    const filter: MarkerFilter = { interest: 'any', visited: 'visited' }
    expect(matchesFilter(visited, [], BOTH_MEMBERS, filter)).toBe(true)
    expect(matchesFilter(unvisited, [], BOTH_MEMBERS, filter)).toBe(false)
  })

  it('combines with interest rather than replacing it', () => {
    const filter: MarkerFilter = { interest: 'both', visited: 'unvisited' }
    const wantedByBoth = [wants(ANA), wants(BEN)]

    expect(matchesFilter(unvisited, wantedByBoth, BOTH_MEMBERS, filter)).toBe(true)
    expect(matchesFilter(visited, wantedByBoth, BOTH_MEMBERS, filter)).toBe(false)
    expect(matchesFilter(unvisited, [wants(ANA)], BOTH_MEMBERS, filter)).toBe(false)
  })
})

describe('reachability', () => {
  it('shows a marker every member declined once the filter is cleared', () => {
    // Such a marker matches none of the four named choices, so without an
    // unfiltered view it would exist in the trip and be unreachable through the
    // interface — the same class of defect as a pin hidden underneath another.
    const declinedByAll = [declines(ANA), declines(BEN)]

    for (const interest of ['both', 'either', 'only-one', 'nobody'] as const) {
      expect(matchesFilter(unvisited, declinedByAll, BOTH_MEMBERS, by(interest))).toBe(false)
    }

    expect(matchesFilter(unvisited, declinedByAll, BOTH_MEMBERS, NO_FILTER)).toBe(true)
  })
})

describe('isFiltered', () => {
  it('reports an unfiltered view as unfiltered', () => {
    expect(isFiltered(NO_FILTER)).toBe(false)
  })

  it('reports either kind of narrowing', () => {
    expect(isFiltered({ interest: 'both', visited: 'any' })).toBe(true)
    expect(isFiltered({ interest: 'any', visited: 'unvisited' })).toBe(true)
  })
})
