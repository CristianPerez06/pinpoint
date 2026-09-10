'use client'

import {
  activeFilterCount,
  type InterestFilter,
  isFiltered,
  type MarkerFilter,
  NO_FILTER,
  type TripMember,
} from '@pinpoint/core'

import { SlidersHorizontal } from 'lucide-react'

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

function FilterBarLive({
  filter,
  onChange,
  members,
  ownMemberId,
  open,
  onOpen,
}: FilterBarLiveProps) {
  const nameOf = (member: TripMember) =>
    member.id === ownMemberId ? 'You' : member.displayName

  const chosen =
    filter.interest.kind === 'wanted-by' ? filter.interest.members : []

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

  const narrowed = isFiltered(filter)
  const active = activeFilterCount(filter)

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
      onOpen={onOpen}
    >
      <p className={styles.heading}>Wanted by</p>

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

      <hr className={styles.divide} />

      {/*
        In here now rather than beside the trigger, because the trigger
        declares. The specification permits exactly this separation and no wider
        a one: the control that declares the narrowing must also be the one that
        reveals the way out of it, and reaching it must cost a single deliberate
        act. Opening the thing that says `9 of 17` is that act.
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
