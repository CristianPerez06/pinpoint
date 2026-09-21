import { describe, expect, it } from 'vitest'

import {
  activeFilterCount,
  type FilterableMarker,
  isFiltered,
  type MarkerFilter,
  matchesFilter,
  NO_FILTER,
} from './marker-filter'

const ANA = 'member-ana'
const BEN = 'member-ben'
const CHO = 'member-cho'

/**
 * A marker carrying nothing any question would select on, so that a test naming
 * one dimension is only ever about that dimension.
 */
const place = (over: Partial<FilterableMarker> = {}): FilterableMarker => ({
  visited: false,
  type: 'place',
  plannedOn: null,
  plannedUntil: null,
  cityId: 'city-kyoto',
  ...over,
})

const unvisited = place()
const visited = place({ visited: true })

const wants = (memberId: string) => ({ memberId, interested: true })
const declines = (memberId: string) => ({ memberId, interested: false })

const wantedBy = (...members: string[]): MarkerFilter => ({
  ...NO_FILTER,
  interest: { kind: 'wanted-by', members },
})

const UNANSWERED: MarkerFilter = {
  ...NO_FILTER,
  interest: { kind: 'unanswered' },
}

const ofKind = (...kinds: string[]): MarkerFilter => ({
  ...NO_FILTER,
  kind: { kind: 'one-of', kinds },
})

const onDays = (...days: string[]): MarkerFilter => ({
  ...NO_FILTER,
  day: { kind: 'on', days },
})

const UNDATED: MarkerFilter = { ...NO_FILTER, day: { kind: 'undated' } }
const UNFILED: MarkerFilter = { ...NO_FILTER, city: 'unfiled' }

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
      ...NO_FILTER,
      interest: { kind: 'wanted-by', members: [ANA, BEN] },
      visited: 'unvisited',
    }
    const wantedByBoth = [wants(ANA), wants(BEN)]

    expect(matchesFilter(unvisited, wantedByBoth, filter)).toBe(true)
    expect(matchesFilter(visited, wantedByBoth, filter)).toBe(false)
    expect(matchesFilter(unvisited, [wants(ANA)], filter)).toBe(false)
  })
})

describe('matchesFilter — kind of place', () => {
  it('narrows to one kind', () => {
    expect(matchesFilter(place({ type: 'food' }), [], ofKind('food'))).toBe(true)
    expect(matchesFilter(place({ type: 'temple' }), [], ofKind('food'))).toBe(false)
  })

  it('selects a place of any of the kinds chosen', () => {
    // The opposite of how naming members composes, and deliberately so: a place
    // has exactly one kind, so requiring both at once would select nothing.
    const filter = ofKind('food', 'temple')

    expect(matchesFilter(place({ type: 'food' }), [], filter)).toBe(true)
    expect(matchesFilter(place({ type: 'temple' }), [], filter)).toBe(true)
    expect(matchesFilter(place({ type: 'stay' }), [], filter)).toBe(false)
  })

  it('treats choosing no kind as not asking about kind', () => {
    // Where naming no members selects nothing, naming no kinds selects
    // everything. The two empties mean opposite things, which is why they are
    // different shapes rather than two arrays in one object.
    expect(matchesFilter(place({ type: 'food' }), [], ofKind())).toBe(true)
  })

  it('matches the kind a place is drawn as, not the string it stores', () => {
    // `castle` was retired into `culture`. A row still holding it draws as a
    // culture pin, so narrowing to culture has to select it — otherwise the
    // place you are looking at vanishes when you ask for what you can see.
    expect(matchesFilter(place({ type: 'castle' }), [], ofKind('culture'))).toBe(true)
    expect(matchesFilter(place({ type: 'castle' }), [], ofKind('place'))).toBe(false)
  })

  it('matches an unknown stored kind as the fallback it draws as', () => {
    const unknown = place({ type: 'something-nothing-has-ever-defined' })

    expect(matchesFilter(unknown, [], ofKind('place'))).toBe(true)
    expect(matchesFilter(unknown, [], ofKind('food'))).toBe(false)
  })
})

describe('matchesFilter — the day a place is planned for', () => {
  const thursday = place({ plannedOn: '2026-03-19' })
  const sunday = place({ plannedOn: '2026-03-22' })
  const someday = place({ plannedOn: null })

  /*
   * A hotel booked the 19th to the 22nd. The rule that a place matches when
   * *any* of its days is chosen was written into this file before a place
   * could carry more than one day, so that whatever added them would inherit
   * it rather than decide it a second time. These are that inheritance.
   */
  const hotel = place({ plannedOn: '2026-03-19', plannedUntil: '2026-03-22' })

  it('draws a place on the middle day of its run', () => {
    expect(matchesFilter(hotel, [], onDays('2026-03-20'))).toBe(true)
    expect(matchesFilter(hotel, [], onDays('2026-03-21'))).toBe(true)
  })

  it('draws a place on the first and last days of its run', () => {
    expect(matchesFilter(hotel, [], onDays('2026-03-19'))).toBe(true)
    expect(matchesFilter(hotel, [], onDays('2026-03-22'))).toBe(true)
  })

  it('does not draw it on a day outside its run', () => {
    expect(matchesFilter(hotel, [], onDays('2026-03-23'))).toBe(false)
  })

  it('draws it when any one of several chosen days falls in its run', () => {
    expect(matchesFilter(hotel, [], onDays('2026-03-01', '2026-03-21'))).toBe(true)
  })

  /*
   * A run has chosen its days like any other place, so it is not waiting for
   * one — the same boundary `groupMarkersByDay` keeps for the waiting pile.
   */
  it('does not count a place with a run among those waiting for a day', () => {
    expect(matchesFilter(hotel, [], UNDATED)).toBe(false)
  })

  it('narrows to one day', () => {
    const filter = onDays('2026-03-19')

    expect(matchesFilter(thursday, [], filter)).toBe(true)
    expect(matchesFilter(sunday, [], filter)).toBe(false)
    expect(matchesFilter(someday, [], filter)).toBe(false)
  })

  it('selects days that are not next to each other', () => {
    // The reason the days are a set rather than a stretch between two dates:
    // "Thursday and Sunday" is a question a range cannot ask.
    const filter = onDays('2026-03-19', '2026-03-22')

    expect(matchesFilter(thursday, [], filter)).toBe(true)
    expect(matchesFilter(sunday, [], filter)).toBe(true)
    expect(matchesFilter(place({ plannedOn: '2026-03-20' }), [], filter)).toBe(false)
  })

  it('singles out the places carrying no day, and only those', () => {
    expect(matchesFilter(someday, [], UNDATED)).toBe(true)
    expect(matchesFilter(thursday, [], UNDATED)).toBe(false)
  })

  it('treats choosing no day as not asking about the day', () => {
    expect(matchesFilter(thursday, [], onDays())).toBe(true)
    expect(matchesFilter(someday, [], onDays())).toBe(true)
  })

  it('shows a place on several days when any one of them is chosen', () => {
    // No place can carry more than one day yet. The rule is pinned here so that
    // whatever adds that inherits it rather than deciding it a second time —
    // #158 and #156 have to agree, and whichever runs second would otherwise be
    // the one that decides.
    const acrossThreeNights = ['2026-03-19', '2026-03-20', '2026-03-21']
    const matchesAnyOf = (days: readonly string[], chosen: MarkerFilter) =>
      days.some((day) => matchesFilter(place({ plannedOn: day }), [], chosen))

    expect(matchesAnyOf(acrossThreeNights, onDays('2026-03-20'))).toBe(true)
    expect(matchesAnyOf(acrossThreeNights, onDays('2026-03-25'))).toBe(false)
  })
})

describe('matchesFilter — places filed under no city', () => {
  it('narrows to the places no city holds', () => {
    expect(matchesFilter(place({ cityId: null }), [], UNFILED)).toBe(true)
    expect(matchesFilter(place({ cityId: 'city-kyoto' }), [], UNFILED)).toBe(false)
  })

  it('offers no way to narrow to a named city', () => {
    // Not an omission. A city is a name somebody chose for a cluster of places,
    // not a geographical fact, so hiding everything filed under a different name
    // can hide a place that is genuinely around the corner. Being filed under no
    // city is a state of the record instead, which is why only it is offered.
    const answers = [NO_FILTER.city, 'unfiled']
    expect(answers).not.toContain('city-kyoto')
  })
})

describe('matchesFilter — the questions compose', () => {
  it('requires every question to be satisfied at once', () => {
    const filter: MarkerFilter = {
      ...NO_FILTER,
      interest: { kind: 'wanted-by', members: [ANA] },
      visited: 'unvisited',
      kind: { kind: 'one-of', kinds: ['food'] },
      day: { kind: 'on', days: ['2026-03-19'] },
    }
    const lunch = place({ type: 'food', plannedOn: '2026-03-19' })

    expect(matchesFilter(lunch, [wants(ANA)], filter)).toBe(true)
    // Each of these fails exactly one of the four.
    expect(matchesFilter(lunch, [declines(ANA)], filter)).toBe(false)
    expect(matchesFilter({ ...lunch, visited: true }, [wants(ANA)], filter)).toBe(false)
    expect(matchesFilter({ ...lunch, type: 'temple' }, [wants(ANA)], filter)).toBe(false)
    expect(matchesFilter({ ...lunch, plannedOn: null }, [wants(ANA)], filter)).toBe(false)
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

  it('reports every kind of narrowing', () => {
    expect(isFiltered(wantedBy(ANA))).toBe(true)
    expect(isFiltered(UNANSWERED)).toBe(true)
    expect(isFiltered({ ...NO_FILTER, visited: 'unvisited' })).toBe(true)
    expect(isFiltered(ofKind('food'))).toBe(true)
    expect(isFiltered(onDays('2026-03-19'))).toBe(true)
    expect(isFiltered(UNDATED)).toBe(true)
    expect(isFiltered(UNFILED)).toBe(true)
  })
})

describe('activeFilterCount', () => {
  it('counts nothing on an unfiltered view', () => {
    expect(activeFilterCount(NO_FILTER)).toBe(0)
  })

  it('counts naming people as one question however many are named', () => {
    // The number describes what is being asked, not what was ticked to ask it.
    // "Which places do all of these people want" is one question whether it
    // names one person or ten, and a control reporting `10` would be reporting
    // the input.
    expect(activeFilterCount(wantedBy(ANA))).toBe(1)
    expect(activeFilterCount(wantedBy(ANA, BEN))).toBe(1)
    expect(activeFilterCount(wantedBy(ANA, BEN, CHO))).toBe(1)
  })

  it('counts the triage pile as the same one question', () => {
    // It replaces the names rather than joining them, so it is that criterion
    // seen from the other side and never an additional one.
    expect(activeFilterCount(UNANSWERED)).toBe(1)
  })

  it('counts hiding visited places separately', () => {
    expect(activeFilterCount({ ...NO_FILTER, visited: 'unvisited' })).toBe(1)
    expect(activeFilterCount({ ...wantedBy(ANA, BEN), visited: 'unvisited' })).toBe(2)
    expect(activeFilterCount({ ...UNANSWERED, visited: 'unvisited' })).toBe(2)
  })

  it('counts naming kinds and days as one question each', () => {
    // Same rule as naming people: the number is of questions, not of ticks, so
    // it means the same thing in the first week of a trip and in the last.
    expect(activeFilterCount(ofKind('food'))).toBe(1)
    expect(activeFilterCount(ofKind('food', 'temple', 'stay'))).toBe(1)
    expect(activeFilterCount(onDays('2026-03-19'))).toBe(1)
    expect(activeFilterCount(onDays('2026-03-19', '2026-03-20', '2026-03-22'))).toBe(1)
    expect(activeFilterCount(UNDATED)).toBe(1)
    expect(activeFilterCount(UNFILED)).toBe(1)
  })

  it('stays a single digit with every question asked at once', () => {
    // What lets the trigger keep the settled 124px slot `#87` gave it: a
    // control whose width follows its own state drags its own panel out from
    // under whoever is choosing inside it.
    const everything: MarkerFilter = {
      interest: { kind: 'wanted-by', members: [ANA, BEN, CHO] },
      visited: 'unvisited',
      kind: { kind: 'one-of', kinds: ['food', 'temple'] },
      day: { kind: 'on', days: ['2026-03-19', '2026-03-22'] },
      city: 'unfiled',
    }

    expect(activeFilterCount(everything)).toBe(5)
    expect(String(activeFilterCount(everything))).toHaveLength(1)
  })

  it('agrees with isFiltered about whether anything is being hidden', () => {
    // Two functions answering one question have to answer it the same way: a
    // control that declares a filter is on while the count reads zero would be
    // contradicting itself in the same breath.
    for (const filter of [
      NO_FILTER,
      wantedBy(ANA),
      UNANSWERED,
      { ...NO_FILTER, visited: 'unvisited' } as MarkerFilter,
      { ...wantedBy(ANA), visited: 'unvisited' } as MarkerFilter,
      ofKind('food'),
      onDays('2026-03-19'),
      UNDATED,
      UNFILED,
    ]) {
      expect(activeFilterCount(filter) > 0).toBe(isFiltered(filter))
    }
  })
})
