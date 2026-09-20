'use client'

import {
  activeFilterCount,
  dateOfDay,
  formatDayRange,
  formatDayShort,
  type InterestFilter,
  isFiltered,
  type IsoDay,
  type MarkerFilter,
  NO_FILTER,
  type TripMember,
} from '@pinpoint/core'
import { MARKER_TYPES } from '@pinpoint/map'

import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import { Menu, toolGlyphClass, toolLabelClass } from '@/app/_components/ui'

import styles from './filter-bar.module.css'

/**
 * Narrowing a trip to the places worth looking at.
 *
 * One list, whose entries are the people on the trip. Ticking two names asks for
 * the places they agree on, which is the question the product exists to answer —
 * not the places either of them wants, which is a different and much longer
 * list.
 *
 * ## What the closed control says, and what it does not
 *
 * It does **not** name who is ticked, and that is a decision rather than an
 * omission. A label listing people grows without bound — a trip may hold ten
 * members, and at that size the label is unreadable and the control changes
 * width every time the filter is used, which rearranges the bar that applied it.
 *
 * That second reason was right and this control did it anyway, by a shorter
 * route: `#87`. The trigger goes from 82.93px to 122.46px the moment a filter is
 * applied — the count, the dot `marked` brings, the two flex gaps those two
 * children add, and a heavier weight — and its own panel is positioned against
 * it, so the panel slid out from under whoever was choosing inside it. The width
 * is settled by `.filter` in `trip-workspace.module.css` now, which is the slot
 * `Drop` has always had; the measurements and what must be re-measured are
 * written there. A label naming people would still be unbounded, so nothing
 * above is softened — the bound is now enforced somewhere as well as argued for.
 *
 * What it says instead is how many of its questions are being asked:
 * `Filter · 1`. The number counts criteria rather than choices, so naming five
 * people is still one — and it is `1` for hiding visited places too.
 *
 * It counted matching markers first, as `15 of 17`, and that was worse for a
 * reason worth writing down: two bare numbers beside the word `Filter` have no
 * unit, so the obvious reading is that they count filters. They counted places.
 * A control whose most natural reading is wrong is not informative, it is
 * misleading, and the extra information was not worth the ambiguity — the map
 * itself already shows how much survives, and the note where the markers would
 * have been already says when nothing does.
 *
 * The count comes from `@pinpoint/core`, like every other thing a filter means,
 * so the laptop and the phone cannot report different numbers for one filter.
 *
 * **All of that is about the control in the bar, and it took this long to say
 * so.** Below 700px this control is not in a bar — it is a tool standing on the
 * bottom edge as one of three, which means a glyph above one line of words, and
 * a count is a second line rather than a longer first one. So the count is drawn
 * where there is a line for it and not where there is not; `marker-filtering`
 * makes it a MAY and now says explicitly that one rendering of a control may
 * carry it while another does not.
 *
 * What may **not** vary is the declaration itself. It is carried at every width
 * by the glyph recolouring, by a pip on that glyph, and — the part that was
 * missing everywhere, count or no count — by the trigger's own accessible name,
 * which says *"Filter this trip. Some places are hidden"* in words. The count
 * was never doing that job: `Filter · 1` read aloud is "Filter 1", which is the
 * same unitless number this comment already rejected, one digit shorter.
 *
 * `activeFilterCount` is therefore still called at every width, and is still
 * correct — the count is withheld by the cascade, not stopped being computed.
 * There is no dead code here to go looking for.
 *
 * Everything that narrows is in here, and so is the way out. That is what makes
 * the label honest and what the specification requires: the control that
 * declares the narrowing must be the one that reveals the way out of it.
 *
 * A native `<select multiple>` would be the obvious control and is not usable:
 * it renders as a scrolling box that is always open, loses its selection to a
 * stray click, and cannot hold an entry that is not one of the people.
 *
 * It decides nothing. What each choice selects lives in `@pinpoint/core` so the
 * map, the card and the phone all agree; this file only says which words go on
 * which value.
 */

export type FilterBarLiveProps = {
  filter: MarkerFilter
  onChange: (filter: MarkerFilter) => void
  members: readonly TripMember[]
  /** So the reader is named the way the detail card names them. */
  ownMemberId: string | null
  /**
   * The days this trip offers to be narrowed by, in order.
   *
   * Handed in rather than derived here, because deriving it needs every marker
   * on the trip and this control needs none of them otherwise. `daysOffered` in
   * `@pinpoint/core` is what produces it, so the phone's sheet is offered the
   * same set from the same rule.
   */
  days: readonly IsoDay[]
  /**
   * Whether this menu is the detour that is open.
   *
   * Held by the workspace with every other panel in the chrome. "Only one open
   * at a time" is a rule about the whole bar, and a component cannot enforce it
   * about panels it cannot see.
   */
  open: boolean
  onOpen: (open: boolean) => void
}

/**
 * Either this control has what it names, or it is waiting for it.
 *
 * A union rather than a bag of optionals, so the waiting form cannot be
 * rendered with half its handlers and the live form cannot be rendered
 * without them. There is nothing to pass while waiting, and the type says so.
 */
export type FilterBarProps =
  | { waiting: true }
  | ({ waiting?: false } & FilterBarLiveProps)

/**
 * Which question is open. One at a time, and none when the panel is first shown.
 *
 * The panel used to draw every choice of every question at once, which fitted
 * while there were two questions and stops fitting at five: ten members, eight
 * kinds and twenty-one days is about 1,240px of content in a panel capped near
 * 560px, so two thirds of it — including the way out — sits below the fold.
 * `marker-filtering` requires clearing to be reachable from where the narrowing
 * is declared, so the panel has to stop growing with the trip.
 */
type OpenQuestion = 'interest' | 'kind' | 'day'

/**
 * A list of words as a person would say it.
 *
 * Used only for what a collapsed row says it is set to, which is why it is
 * allowed to name members at all: the rule against naming them is about the
 * *trigger*, whose width would then follow its own state, and this sits inside
 * the panel at a settled width and truncates.
 */
function wordList(words: readonly string[]): string {
  if (words.length === 0) return ''
  if (words.length === 1) return words[0]
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

/**
 * Whole days between two of them.
 *
 * Through local midnights and rounded, because a day is not always twenty-four
 * hours long — a daylight-saving boundary makes one of them twenty-three, and
 * an unrounded division would put the day after it in the wrong week.
 */
function daysBetween(from: IsoDay, to: IsoDay): number {
  const ms = dateOfDay(to).getTime() - dateOfDay(from).getTime()
  return Math.round(ms / 86_400_000)
}

/**
 * The offered days, in seven-day runs from the first one.
 *
 * Runs rather than calendar weeks starting on a Monday, so a trip beginning on
 * a Saturday does not open with a two-day stub.
 *
 * Each run is **labelled by the days it covers, not by an ordinal**, and that
 * came from looking. `Week 1`, `Week 2`, `Week 3` read correctly on a trip of
 * consecutive days and lied on the live one, whose places sit on five days
 * scattered across two months: the group labelled `Week 2` began twenty-six
 * days after `Week 1`. Empty runs are dropped rather than drawn, so an ordinal
 * counts groups instead of weeks the moment a trip has a gap in it — and a
 * range cannot be wrong that way.
 */
function inWeeks(days: readonly IsoDay[]): readonly (readonly IsoDay[])[] {
  if (days.length === 0) return []
  const weeks: IsoDay[][] = []
  for (const day of days) {
    const index = Math.floor(daysBetween(days[0], day) / 7)
    ;(weeks[index] ??= []).push(day)
  }
  // Holes where a trip's places jump a month, which `daysOffered` permits.
  return weeks.filter((week) => week !== undefined)
}

/**
 * What a run of days is called: the stretch it covers, or the one day it holds.
 *
 * The wording is `@pinpoint/core`'s, not this file's. It used to be four lines
 * here and four identical lines in the other application, which is two answers
 * to one question waiting to drift apart — and a third was about to be written
 * for a trip's dates in the trip menu.
 */
function runLabel(run: readonly IsoDay[]): string {
  return formatDayRange(run[0], run[run.length - 1]) ?? run[0]
}

function FilterBarLive({
  filter,
  onChange,
  members,
  ownMemberId,
  days,
  open,
  onOpen,
}: FilterBarLiveProps) {
  const [question, setQuestion] = useState<OpenQuestion | null>(null)

  const nameOf = (member: TripMember) =>
    member.id === ownMemberId ? 'You' : member.displayName

  const chosen =
    filter.interest.kind === 'wanted-by' ? filter.interest.members : []
  const kinds = filter.kind.kind === 'one-of' ? filter.kind.kinds : []
  const chosenDays = filter.day.kind === 'on' ? filter.day.days : []

  function setInterest(interest: InterestFilter) {
    onChange({ ...filter, interest })
  }

  function toggleMember(memberId: string) {
    const next = chosen.includes(memberId)
      ? chosen.filter((id) => id !== memberId)
      : [...chosen, memberId]

    // Unticking the last person is a request to stop filtering, not a question
    // about nobody — which would correctly select nothing and read as broken.
    setInterest(
      next.length === 0 ? { kind: 'anyone' } : { kind: 'wanted-by', members: next },
    )
  }

  function toggleKind(id: string) {
    const next = kinds.includes(id)
      ? kinds.filter((kind) => kind !== id)
      : [...kinds, id]

    // Same shape as unticking the last person, opposite meaning: no kinds
    // chosen selects everything rather than nothing, because a place has
    // exactly one kind. Returning to `any` is what says so in one place.
    onChange({
      ...filter,
      kind: next.length === 0 ? { kind: 'any' } : { kind: 'one-of', kinds: next },
    })
  }

  function toggleDay(day: IsoDay) {
    const next = chosenDays.includes(day)
      ? chosenDays.filter((each) => each !== day)
      : [...chosenDays, day]

    onChange({
      ...filter,
      day: next.length === 0 ? { kind: 'any' } : { kind: 'on', days: next },
    })
  }

  const narrowed = isFiltered(filter)
  const active = activeFilterCount(filter)

  /*
   * What each collapsed row says it is set to.
   *
   * In words rather than as a count, which is the requirement: a row reading
   * `2` would be the same unitless number the trigger already rejected, one
   * level in. A member named here who has since left the trip resolves to
   * nothing and drops out, rather than showing an id.
   */
  const interestSaid =
    filter.interest.kind === 'unanswered'
      ? 'Nobody has answered'
      : filter.interest.kind === 'wanted-by'
        ? wordList(
            chosen
              .map((id) => members.find((member) => member.id === id))
              .filter((member) => member !== undefined)
              .map(nameOf),
          )
        : 'Anyone'

  const kindSaid =
    kinds.length === 0
      ? 'Any kind'
      : wordList(
          MARKER_TYPES.filter((type) => kinds.includes(type.id)).map(
            (type) => type.label,
          ),
        )

  const daySaid =
    filter.day.kind === 'undated'
      ? 'No day yet'
      : chosenDays.length === 0
        ? 'Any day'
        : wordList([...chosenDays].sort().map(formatDayShort))

  function section(
    id: OpenQuestion,
    name: string,
    said: string,
    set: boolean,
    body: React.ReactNode,
  ) {
    const isOpen = question === id
    return (
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHead}
          aria-expanded={isOpen}
          onClick={() => setQuestion(isOpen ? null : id)}
        >
          <span className={styles.sectionName}>{name}</span>
          <span className={set ? styles.sectionSaidSet : styles.sectionSaid}>
            {said}
          </span>
          <ChevronDown
            aria-hidden
            className={isOpen ? styles.chevronOpen : styles.chevron}
          />
        </button>
        {isOpen ? <div className={styles.sectionBody}>{body}</div> : null}
      </div>
    )
  }

  return (
    <Menu
      name="Filter"
      /*
        The narrowing, said in words, at every width.

        The phone's two sentences verbatim, from `Tool`'s own `hint` — one
        control across two platforms, so the wording is part of what makes it
        one. Verbatim also because both begin with `Filter`, which is the word
        the trigger shows: `aria-label` replaces the computed name rather than
        adding to it, so a string that dropped the word would leave somebody
        driving the page by voice unable to say what they can see.

        This is what replaces the count below the breakpoint, and it is a better
        answer than the count was at any width — read aloud, `Filter · 1` is
        "Filter 1", which is a bare number beside the word `Filter` and is the
        exact reading `marker-filtering` rejected `15 of 17` for.
      */
      hint={
        narrowed ? 'Filter this trip. Some places are hidden' : 'Filter this trip'
      }
      label={<FilterLabel narrowed={narrowed} active={active} />}
      marked={narrowed}
      align="end"
      open={open}
      /* Reopening shows the overview rather than whatever was last expanded:
         the rows are the point of the panel, and one of them standing open is
         a state nobody asked to return to. */
      onOpen={(next) => {
        if (!next) setQuestion(null)
        onOpen(next)
      }}
    >
      {section(
        'interest',
        'Wanted by',
        interestSaid,
        filter.interest.kind !== 'anyone',
        <>
          {/* The question this list is asking, because the two lists below it
              ask the opposite one and tick boxes do not say which is which. */}
          <p className={styles.heading}>Places all of them want</p>

          {members.map((member) => (
            <label key={member.id} className={styles.option}>
              <input
                type="checkbox"
                checked={chosen.includes(member.id)}
                onChange={() => toggleMember(member.id)}
                className={styles.checkbox}
              />
              <span>{nameOf(member)}</span>
            </label>
          ))}

          {/* Everybody ticked is one press rather than one per person, which
              on a two-person trip is the difference between the common case
              being easy and being merely possible. */}
          {members.length > 1 ? (
            <button
              type="button"
              onClick={() =>
                setInterest({
                  kind: 'wanted-by',
                  members: members.map((member) => member.id),
                })
              }
              className={styles.everyone}
            >
              Everyone
            </button>
          ) : null}

          <hr className={styles.divide} />

          {/*
            Not a person, so not one of the people. It is the triage pile — the
            set that is invisible in a spreadsheet — and it cannot combine with
            a name: "wanted by Ana, and also nobody has answered" has no
            meaning, so picking it clears the ticks rather than adding to them.
          */}
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={filter.interest.kind === 'unanswered'}
              onChange={(event) =>
                setInterest(
                  event.target.checked ? { kind: 'unanswered' } : { kind: 'anyone' },
                )
              }
              className={styles.checkbox}
            />
            <span>Nobody has answered yet</span>
          </label>
        </>,
      )}

      {section(
        'kind',
        'Kind of place',
        kindSaid,
        kinds.length > 0,
        <>
          {/*
            `any`, and it has to be said rather than shown.

            This list and the one above it are both tick boxes in one panel, and
            they compose oppositely: naming two people asks for the places they
            agree on, naming two kinds asks for either. A place has exactly one
            kind, so the other reading would always select nothing — but nobody
            discovers that by ticking, they discover an empty map.
          */}
          <p className={styles.heading}>Places of any of these</p>

          {MARKER_TYPES.map((type) => (
            <label key={type.id} className={styles.option}>
              <input
                type="checkbox"
                checked={kinds.includes(type.id)}
                onChange={() => toggleKind(type.id)}
                className={styles.checkbox}
              />
              <span
                aria-hidden
                className={styles.swatch}
                style={{ background: `var(--pp-pin-${type.id})` }}
              />
              <span>{type.label}</span>
            </label>
          ))}
        </>,
      )}

      {section(
        'day',
        'Day',
        daySaid,
        filter.day.kind !== 'any',
        <>
          <p className={styles.heading}>Places on any of these days</p>

          {days.length === 0 ? (
            /* A trip with no dates and nothing planned. Saying so beats an
               empty region, which reads as the list having failed to load. */
            <p className={styles.empty}>Nothing is planned for a day yet.</p>
          ) : (
            inWeeks(days).map((run) => (
              <div key={run[0]}>
                <p className={styles.week}>{runLabel(run)}</p>
                {run.map((day) => (
                  <label key={day} className={styles.option}>
                    <input
                      type="checkbox"
                      checked={chosenDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      className={styles.checkbox}
                    />
                    <span>{formatDayShort(day)}</span>
                  </label>
                ))}
              </div>
            ))
          )}

          <hr className={styles.divide} />

          {/*
            Not a day, so not one of the days — the same shape as the triage
            pile above, and the same reason. "Thursday, and also the ones with
            no day" is two questions wearing one answer, so choosing this clears
            the days rather than joining them.
          */}
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={filter.day.kind === 'undated'}
              onChange={(event) =>
                onChange({
                  ...filter,
                  day: event.target.checked ? { kind: 'undated' } : { kind: 'any' },
                })
              }
              className={styles.checkbox}
            />
            <span>No day yet</span>
          </label>
        </>,
      )}

      {/*
        The two plain choices and the way out, held on the panel's bottom edge.

        Sticky rather than merely last, and that came from looking: with a
        question expanded the panel scrolls, and `Clear` went below the fold —
        which is the thing `marker-filtering` forbids, arriving by the route the
        collapsing was supposed to close. The phone's sheet already keeps its
        foot outside the scroller for the same reason; this is the laptop's
        version of that.
      */}
      <div className={styles.foot}>
      {/*
        The only way this product narrows by city, and deliberately the only one.

        A city here is a name somebody chose for a cluster of places rather than
        a geographical fact, so hiding everything filed under a different name
        can hide a place that is genuinely around the corner. Being filed under
        *no* city is a state of the record instead, and hiding the places that
        have one says nothing false about what is near what. `city.ts` carries
        the measurement this rests on.

        A plain row rather than a section, because it is one choice and a row
        that expands to show a single tick box would be a worse version of it.
      */}
        <label className={styles.option}>
        <input
          type="checkbox"
          checked={filter.city === 'unfiled'}
          onChange={(event) =>
            onChange({ ...filter, city: event.target.checked ? 'unfiled' : 'any' })
          }
          className={styles.checkbox}
        />
        <span>Not filed under a city</span>
      </label>

      {/*
        In here now rather than beside the trigger, because the trigger
        declares. The specification permits exactly this separation and no wider
        a one: the control that declares the narrowing must also be the one that
        reveals the way out, and reaching it must cost a single deliberate act.
        Opening the thing that says `Filter · 2` is that act.
      */}
        <label className={styles.option}>
        <input
          type="checkbox"
          checked={filter.visited === 'unvisited'}
          onChange={(event) =>
            onChange({
              ...filter,
              visited: event.target.checked ? 'unvisited' : 'any',
            })
          }
          className={styles.checkbox}
        />
        <span>Hide visited</span>
      </label>

      {/*
        Inert via `aria-disabled` rather than the `disabled` attribute: a
        disabled button leaves the tab order and is skipped, so a reader who
        cannot see the styling would be told nothing at all — the colour-only
        failure this control exists to avoid, arriving through the back door.
      */}
        <button
          type="button"
          aria-disabled={!narrowed}
        onClick={() => {
          if (narrowed) onChange(NO_FILTER)
        }}
        className={styles.clear}
      >
          Clear the filter
        </button>
      </div>
    </Menu>
  )
}

/**
 * FilterBar, before and after its data.
 *
 * `waiting` is a variant of this control rather than a choice made by whoever
 * renders it, for the reason `write-feedback` gives about pending state: a flag
 * held by the screen cannot say *which* control it is about, and the control is
 * the only thing that knows what it looks like with nothing to show.
 *
 * The waiting form is the same `Menu` the live one renders. Only the label
 * differs, because the label is the part nobody knows yet.
 */
export function FilterBar(props: FilterBarProps) {
  if (props.waiting) {
    /*
      No placeholder, because nothing here is unknown.

      This trigger reads `Filter` — a glyph and a word, both fixed — and gains a
      count only once a filter has been applied, which cannot have happened
      before the trip has been read. So the waiting label *is* the loaded label,
      and standing a block in its place would be inventing a question. It also
      measured: a placeholder here was 33px wider than the word it replaced, and
      every control between it and the account moved when the data landed.

      Still true after the label grew a pip and a second spelling of its word,
      and worth having checked rather than assumed: both spellings are the same
      four letters, so neither state is wider than the other, and the pip is
      drawn only when narrowed — which, as above, cannot be the case yet.

      The last sentence of this comment used to read "the one thing that arrives
      with the data is the count, and it arrives into a row that is already the
      width of the word". That was the defect, written down as a reassurance:
      the row *was* the width of the word, the count did not fit inside it, and
      the row grew by 39.53px to take it. What makes the claim true is the slot
      the trigger now stands in — `.filter` in `trip-workspace.module.css`, cut
      to the narrowed width — so the count really does arrive into room that is
      already there. Not measured is not the same as not moving; this is what
      that distinction cost.
    */
    return (
      <Menu
        name="Filter"
        /* Nothing has been read, so nothing is narrowed, so it is the unnarrowed
           sentence. The control being unavailable is already announced by
           `aria-disabled` and is not this string's job. */
        hint="Filter this trip"
        label={<FilterLabel narrowed={false} active={0} />}
        align="end"
        open={false}
        onOpen={() => {}}
        disabled
      >
        {null}
      </Menu>
    )
  }
  return <FilterBarLive {...props} />
}

/**
 * What the filter's trigger says — which is the same thing whether or not the
 * trip has been read.
 *
 * A glyph and a word, both fixed, plus what a filter being applied adds: a pip
 * on the glyph, and a count. Neither can exist before the trip has been read, so
 * the waiting form of this control shows the real label rather than a
 * placeholder — there is nothing here that has to be waited for, and a block
 * standing in its place would be inventing a question nobody asked.
 *
 * **Every child here is drawn at every width, and the cascade decides which are
 * seen.** That is four elements in two pairs — the glyph's wrapper against the
 * word's laptop spelling, and the tool spelling against the count — and reading
 * this function is not enough to know what is on screen. What decides is the
 * 700px block in `filter-bar.module.css` and the `[role='toolbar']` rules in
 * `ui.module.css`. Above the breakpoint: the word, and the count if narrowed,
 * with `Menu`'s dot and caret after them. Below it: the glyph with its pip, and
 * the word beneath, and nothing else — because the bar draws its controls as a
 * column there, and anything else in this list would be another line.
 */
function FilterLabel({ narrowed, active }: { narrowed: boolean; active: number }) {
  return (
    <>
      {/*
        The glyph, and — where this control is a tool — the state sitting on it.

        Sliders rather than a funnel: a funnel says "narrow a list", and sliders
        says "options you can change", which is what this opens. The phone chose
        the same glyph for the same reason.

        The wrapper exists to be the thing the pip is positioned against, and it
        is the reason the pip is drawn here rather than by `Menu`. `Menu` draws
        the dot that declares a state, and it draws it after the whole label —
        correct in a row, and a line of its own in a column. Only this file knows
        there is a glyph to put it on, and `Menu` cannot reach inside a label it
        was handed.

        So the state is drawn *twice* in this control and the cascade picks one:
        `Menu`'s dot above the breakpoint, this pip below it, each hidden where
        the other is drawn. That is affordable for the same reason both spellings
        of the word below are — a dot carries no state, so drawing it twice costs
        bytes, where duplicating something a person types would cost correctness.
        `ui.module.css`'s `[role='toolbar'] .liveDot` is the other half of the
        pair; if a dot ever appears twice, those two rules have stopped agreeing
        about 700px.

        Everything here is drawn at every width and hidden by the cascade, never
        branched on a measured width — a branch needs the viewport in JavaScript,
        which is a subscription and a first paint in the wrong shape.
      */}
      <span className={styles.mark}>
        <SlidersHorizontal aria-hidden className={toolGlyphClass} />
        {narrowed ? <span aria-hidden className={styles.pip} /> : null}
      </span>

      {/*
        One word, spelled twice, because the two spellings are set differently
        rather than worded differently.

        In the bar it is the control's own type; as a tool it is `label` type at
        11px/600, which is what `Search` and `Drop` are set at. This control was
        the only one of the three that never took `toolLabel`, so its word came
        out at 13.5px beside two words at 11px — three equals, one of them
        lettered as though it outranked the others.

        Two elements and not one: `toolLabel` is `display: none` above the
        breakpoint, so a single span wearing it would leave the laptop trigger
        with no word at all, and giving one span both classes would put two
        `display` declarations of equal specificity in two stylesheets and let
        the bundler's ordering decide. `Drop` already answers this the same way.
      */}
      <span className={styles.wideLabel}>Filter</span>
      <span className={toolLabelClass}>Filter</span>

      {/*
        The count, in the bar only.

        `marker-filtering` makes it a MAY and now says so per rendering, which is
        this: there is no third line in a tool, and the tool's whole job is to
        be a glyph above one line of words. What the count was carrying — that
        the view is narrowed, and how much of it is being asked — is carried
        there by the pip and by the trigger's accessible name, which is a better
        place for it than a number whose unit has to be inferred.
      */}
      {narrowed ? <span className={styles.count}>{active}</span> : null}
    </>
  )
}
