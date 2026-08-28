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

import { Menu } from '@/app/_components/ui'

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
    */
    return (
      <Menu
        name="Filter"
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
 * A glyph and a word, both fixed, plus a count that can only exist once a
 * filter has been applied. That is why the waiting form of this control shows
 * the real label rather than a placeholder: there is nothing here that has to
 * be waited for, and a block standing in its place would be inventing a
 * question nobody asked.
 */
function FilterLabel({ narrowed, active }: { narrowed: boolean; active: number }) {
  return (
        <>
          {/*
            A glyph, and only where the control is standing in the bar at the
            bottom as one of three equals.

            Sliders rather than a funnel: a funnel says "narrow a list", and
            sliders says "options you can change", which is what this opens.
            The phone chose the same glyph for the same reason.

            Drawn at every width and hidden by the cascade above the phone's,
            for the reason the drop control's two labels already record — a
            glyph carries no state, so rendering both spellings costs nothing
            that branching would.
          */}
          <SlidersHorizontal aria-hidden className={styles.glyph} />
          Filter
          {narrowed ? <span className={styles.count}>{active}</span> : null}
        </>
  )
}
