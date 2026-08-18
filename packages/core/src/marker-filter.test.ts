import { describe, expect, it } from 'vitest'

import {
  type InterestQuantifier,
  isFiltered,
  type MarkerFilter,
  matchesFilter,
  NO_FILTER,
} from './marker-filter'

const ANA = 'member-ana'
const BEN = 'member-ben'
const CHO = 'member-cho'
const PAIR = [ANA, BEN]

const unvisited = { visited: false }
const visited = { visited: true }

const wants = (memberId: string) => ({ memberId, interested: true })
const declines = (memberId: string) => ({ memberId, interested: false })

/** Asked of both members of a two-person trip, which is the common case. */
const ofBoth = (quantifier: InterestQuantifier): MarkerFilter => ({
  interest: { members: PAIR, quantifier },
  visited: 'any',
})

const asking = (
  members: readonly string[],
  quantifier: InterestQuantifier,
): MarkerFilter => ({ interest: { members, quantifier }, visited: 'any' })

describe('matchesFilter — who wants to go', () => {
  it('shows everything when nothing is being asked', () => {
    expect(matchesFilter(unvisited, [], NO_FILTER)).toBe(true)
    expect(matchesFilter(visited, [declines(ANA)], NO_FILTER)).toBe(true)
  })

  it('ignores who is selected while the quantifier asks nothing', () => {
    // Unfiltered has to mean unfiltered even with people ticked, because the
    // control leaves them ticked while the menu returns to "Anyone".
    expect(matchesFilter(unvisited, [], asking(PAIR, 'unfiltered'))).toBe(true)
  })

  it('selects a marker every chosen member wants under "all"', () => {
    expect(matchesFilter(unvisited, [wants(ANA), wants(BEN)], ofBoth('all'))).toBe(
      true,
    )
  })

  it('does not select a marker one member has not answered under "all"', () => {
    // This is the unclaimed-member case: a trip whose second person has never
    // signed in can never satisfy "all of them", and that has to be a pinned
    // fact rather than something discovered while wondering why a pile is empty.
    expect(matchesFilter(unvisited, [wants(ANA)], ofBoth('all'))).toBe(false)
  })

  it('selects on any single yes under "at least one"', () => {
    expect(matchesFilter(unvisited, [wants(ANA)], ofBoth('at-least-one'))).toBe(true)
    expect(
      matchesFilter(unvisited, [wants(ANA), declines(BEN)], ofBoth('at-least-one')),
    ).toBe(true)
  })

  it('does not count a declining member as interest under "at least one"', () => {
    expect(
      matchesFilter(unvisited, [declines(ANA), declines(BEN)], ofBoth('at-least-one')),
    ).toBe(false)
  })

  it('selects exactly one yes under "exactly one"', () => {
    expect(
      matchesFilter(unvisited, [wants(ANA), declines(BEN)], ofBoth('exactly-one')),
    ).toBe(true)
    // Undecided is not a no, but it is not a yes either — one yes is one yes.
    expect(matchesFilter(unvisited, [wants(ANA)], ofBoth('exactly-one'))).toBe(true)
    expect(
      matchesFilter(unvisited, [wants(ANA), wants(BEN)], ofBoth('exactly-one')),
    ).toBe(false)
  })

  it('selects only markers nobody has answered under "none"', () => {
    expect(matchesFilter(unvisited, [], ofBoth('none'))).toBe(true)
  })

  it('does not treat "everybody declined" as "nobody yet"', () => {
    // The distinction the whole triage pile rests on. A place the two of you
    // turned down is a decision that was made; one nobody has answered is a
    // decision still waiting, and it is the second the pile exists to surface.
    expect(matchesFilter(unvisited, [declines(ANA), declines(BEN)], ofBoth('none')))
      .toBe(false)
  })

  it('ignores records belonging to somebody who is not being asked about', () => {
    // A member who has left should not still be casting a vote. This used to
    // need its own rule and a separate list of the trip's members; asking the
    // question about named people is what makes it fall out.
    const withStranger = [wants(ANA), wants(BEN), wants('member-who-left')]
    expect(matchesFilter(unvisited, withStranger, ofBoth('all'))).toBe(true)
    expect(matchesFilter(unvisited, [wants('member-who-left')], ofBoth('none'))).toBe(
      true,
    )
  })
})

describe('matchesFilter — asking about a subset', () => {
  // The reason the model is a set plus a quantifier rather than four named
  // choices: on a trip of three, "do we all want this" is a much weaker question
  // than "do these two want this", and only one of them is worth asking.
  const trio = [ANA, BEN, CHO]

  it('asks about the chosen members and no others', () => {
    const interest = [wants(ANA), wants(BEN), declines(CHO)]

    expect(matchesFilter(unvisited, interest, asking([ANA, BEN], 'all'))).toBe(true)
    expect(matchesFilter(unvisited, interest, asking(trio, 'all'))).toBe(false)
  })

  it('asks about one member without regard to anybody else', () => {
    const interest = [wants(ANA), declines(BEN), declines(CHO)]

    expect(matchesFilter(unvisited, interest, asking([ANA], 'all'))).toBe(true)
    expect(matchesFilter(unvisited, interest, asking([BEN], 'all'))).toBe(false)
  })

  it('finds silence from a subset while others have answered', () => {
    const interest = [wants(ANA)]

    expect(matchesFilter(unvisited, interest, asking([BEN, CHO], 'none'))).toBe(true)
    expect(matchesFilter(unvisited, interest, asking(trio, 'none'))).toBe(false)
  })

  it('counts disagreement within the chosen members only', () => {
    const interest = [wants(ANA), wants(BEN), declines(CHO)]

    expect(matchesFilter(unvisited, interest, asking([ANA, CHO], 'exactly-one'))).toBe(
      true,
    )
    expect(matchesFilter(unvisited, interest, asking([ANA, BEN], 'exactly-one'))).toBe(
      false,
    )
  })

  it('reproduces each of the two-traveller questions as the whole-trip case', () => {
    // The four choices the product started with are this model asked about
    // everybody. Pinned, because they are the ones the specification names and
    // the ones a reader will check first.
    const wantedByBoth = [wants(ANA), wants(BEN)]
    const wantedByOne = [wants(ANA), declines(BEN)]

    expect(matchesFilter(unvisited, wantedByBoth, ofBoth('all'))).toBe(true)
    expect(matchesFilter(unvisited, wantedByOne, ofBoth('at-least-one'))).toBe(true)
    expect(matchesFilter(unvisited, wantedByOne, ofBoth('exactly-one'))).toBe(true)
    expect(matchesFilter(unvisited, [], ofBoth('none'))).toBe(true)
  })
})

describe('matchesFilter — asking about nobody', () => {
  it('selects nothing rather than everything', () => {
    // "All of them" and "none of them" are both vacuously true of an empty set,
    // which would fill the agreement pile and the silence pile with every marker
    // on the trip. Selecting nothing keeps the state visible: the view says no
    // places match, which is what was actually asked for.
    for (const quantifier of ['all', 'at-least-one', 'exactly-one', 'none'] as const) {
      expect(matchesFilter(unvisited, [], asking([], quantifier))).toBe(false)
      expect(matchesFilter(unvisited, [wants(ANA)], asking([], quantifier))).toBe(false)
    }
  })

  it('still shows everything when the quantifier asks nothing', () => {
    expect(matchesFilter(unvisited, [wants(ANA)], asking([], 'unfiltered'))).toBe(true)
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
      interest: { members: PAIR, quantifier: 'all' },
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
    // Such a marker matches none of the quantifiers, so without an unfiltered
    // view it would exist in the trip and be unreachable through the interface —
    // the same class of defect as a pin hidden underneath another.
    const declinedByAll = [declines(ANA), declines(BEN)]

    for (const quantifier of ['all', 'at-least-one', 'exactly-one', 'none'] as const) {
      expect(matchesFilter(unvisited, declinedByAll, ofBoth(quantifier))).toBe(false)
    }

    expect(matchesFilter(unvisited, declinedByAll, NO_FILTER)).toBe(true)
  })
})

describe('isFiltered', () => {
  it('reports an unfiltered view as unfiltered', () => {
    expect(isFiltered(NO_FILTER)).toBe(false)
  })

  it('reports a view unfiltered even with members selected', () => {
    // The control keeps everybody ticked while the menu sits on "Anyone", so
    // this is the state a trip actually opens in once anything is touched.
    expect(isFiltered(asking(PAIR, 'unfiltered'))).toBe(false)
  })

  it('reports either kind of narrowing', () => {
    expect(isFiltered(ofBoth('all'))).toBe(true)
    expect(isFiltered({ ...NO_FILTER, visited: 'unvisited' })).toBe(true)
  })
})
