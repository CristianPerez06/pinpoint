import { describe, expect, it } from 'vitest'

import { isFiltered, type MarkerFilter, matchesFilter, NO_FILTER } from './marker-filter'

const ANA = 'member-ana'
const BEN = 'member-ben'
const CHO = 'member-cho'

const unvisited = { visited: false }
const visited = { visited: true }

const wants = (memberId: string) => ({ memberId, interested: true })
const declines = (memberId: string) => ({ memberId, interested: false })

const wantedBy = (...members: string[]): MarkerFilter => ({
  interest: { kind: 'wanted-by', members },
  visited: 'any',
})

const UNANSWERED: MarkerFilter = {
  interest: { kind: 'unanswered' },
  visited: 'any',
}

describe('matchesFilter — who wants to go', () => {
  it('shows everything when nothing is being asked', () => {
    expect(matchesFilter(unvisited, [], NO_FILTER)).toBe(true)
    expect(matchesFilter(visited, [declines(ANA)], NO_FILTER)).toBe(true)
  })

  it('selects a place both named people want', () => {
    // The question the product exists to answer.
    expect(matchesFilter(unvisited, [wants(ANA), wants(BEN)], wantedBy(ANA, BEN)))
      .toBe(true)
  })

  it('does not select a place only one of the named people wants', () => {
    // Naming two people asks for the places they agree on. Getting back what
    // either of them wants would be a different question and a much longer list.
    expect(matchesFilter(unvisited, [wants(ANA)], wantedBy(ANA, BEN))).toBe(false)
    expect(
      matchesFilter(unvisited, [wants(ANA), declines(BEN)], wantedBy(ANA, BEN)),
    ).toBe(false)
  })

  it('does not select a place a named person has not answered', () => {
    // This is the unclaimed-member case: a trip whose second person has never
    // signed in can never satisfy a question naming them, and that has to be a
    // pinned fact rather than something discovered while wondering why a pile is
    // empty. Unticking them is the way out, which is why they are tickable.
    expect(matchesFilter(unvisited, [wants(ANA)], wantedBy(ANA, BEN))).toBe(false)
    expect(matchesFilter(unvisited, [wants(ANA)], wantedBy(ANA))).toBe(true)
  })

  it('asks about one person without regard to anybody else', () => {
    const interest = [wants(ANA), declines(BEN)]

    expect(matchesFilter(unvisited, interest, wantedBy(ANA))).toBe(true)
    expect(matchesFilter(unvisited, interest, wantedBy(BEN))).toBe(false)
  })

  it('asks about a subset of a larger trip', () => {
    // The reason members are named rather than counted: on a trip of three, "do
    // all of us want this" is a much weaker question than "do these two want
    // this", and only the second is worth asking.
    const interest = [wants(ANA), wants(BEN), declines(CHO)]

    expect(matchesFilter(unvisited, interest, wantedBy(ANA, BEN))).toBe(true)
    expect(matchesFilter(unvisited, interest, wantedBy(ANA, BEN, CHO))).toBe(false)
  })

  it('does not count a declining member as wanting to go', () => {
    expect(matchesFilter(unvisited, [declines(ANA)], wantedBy(ANA))).toBe(false)
  })

  it('ignores records belonging to somebody not named', () => {
    // A member who has left should not still be casting a vote. This used to
    // need its own rule and a separate list of the trip's members; asking the
    // question about named people is what makes it fall out.
    const withStranger = [wants(ANA), wants(BEN), declines('member-who-left')]
    expect(matchesFilter(unvisited, withStranger, wantedBy(ANA, BEN))).toBe(true)
  })

  it('selects nothing when the question names nobody', () => {
    // "Every named member wants this" is vacuously true of no names, which would
    // put the whole trip in the pile that is supposed to mean agreement. The
    // control cannot produce this state; the guard is for whatever else might.
    expect(matchesFilter(unvisited, [], wantedBy())).toBe(false)
    expect(matchesFilter(unvisited, [wants(ANA)], wantedBy())).toBe(false)
  })
})

describe('matchesFilter — nobody has answered', () => {
  it('selects only markers with no records at all', () => {
    expect(matchesFilter(unvisited, [], UNANSWERED)).toBe(true)
    expect(matchesFilter(unvisited, [wants(ANA)], UNANSWERED)).toBe(false)
  })

  it('does not treat "everybody declined" as "nobody has answered"', () => {
    // The distinction the whole triage pile rests on. A place the two of you
    // turned down is a decision that was made; one nobody has answered is a
    // decision still waiting, and it is the second the pile exists to surface.
    expect(matchesFilter(unvisited, [declines(ANA), declines(BEN)], UNANSWERED))
      .toBe(false)
  })

  it('counts a single declining answer as having been answered', () => {
    expect(matchesFilter(unvisited, [declines(ANA)], UNANSWERED)).toBe(false)
  })
})

describe('matchesFilter — visited', () => {
  it('narrows to places not yet seen', () => {
    const filter: MarkerFilter = { ...NO_FILTER, visited: 'unvisited' }
    expect(matchesFilter(unvisited, [], filter)).toBe(true)
    expect(matchesFilter(visited, [], filter)).toBe(false)
  })

  it('narrows to places already seen', () => {
    const filter: MarkerFilter = { ...NO_FILTER, visited: 'visited' }
    expect(matchesFilter(visited, [], filter)).toBe(true)
    expect(matchesFilter(unvisited, [], filter)).toBe(false)
  })

  it('combines with interest rather than replacing it', () => {
    const filter: MarkerFilter = {
      interest: { kind: 'wanted-by', members: [ANA, BEN] },
      visited: 'unvisited',
    }
    const wantedByBoth = [wants(ANA), wants(BEN)]

    expect(matchesFilter(unvisited, wantedByBoth, filter)).toBe(true)
    expect(matchesFilter(visited, wantedByBoth, filter)).toBe(false)
    expect(matchesFilter(unvisited, [wants(ANA)], filter)).toBe(false)
  })
})

describe('reachability', () => {
  it('shows a marker every member declined once the filter is cleared', () => {
    // Such a marker matches no question that can be asked — not "wanted by"
    // anybody, and not "nobody has answered", because declining is an answer.
    // Without an unfiltered view it would exist in the trip and be unreachable
    // through the interface, the same class of defect as a pin hidden underneath
    // another one.
    const declinedByAll = [declines(ANA), declines(BEN)]

    expect(matchesFilter(unvisited, declinedByAll, wantedBy(ANA))).toBe(false)
    expect(matchesFilter(unvisited, declinedByAll, wantedBy(BEN))).toBe(false)
    expect(matchesFilter(unvisited, declinedByAll, wantedBy(ANA, BEN))).toBe(false)
    expect(matchesFilter(unvisited, declinedByAll, UNANSWERED)).toBe(false)

    expect(matchesFilter(unvisited, declinedByAll, NO_FILTER)).toBe(true)
  })
})

describe('isFiltered', () => {
  it('reports an unfiltered view as unfiltered', () => {
    expect(isFiltered(NO_FILTER)).toBe(false)
  })

  it('reports either kind of narrowing', () => {
    expect(isFiltered(wantedBy(ANA))).toBe(true)
    expect(isFiltered(UNANSWERED)).toBe(true)
    expect(isFiltered({ ...NO_FILTER, visited: 'unvisited' })).toBe(true)
  })
})
