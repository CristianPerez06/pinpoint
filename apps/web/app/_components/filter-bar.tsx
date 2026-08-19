'use client'

import {
  type InterestFilter,
  isFiltered,
  type MarkerFilter,
  NO_FILTER,
  type TripMember,
} from '@pinpoint/core'
import { useEffect, useRef, useState } from 'react'

import styles from './filter-bar.module.css'

/**
 * Narrowing a trip to the places worth looking at.
 *
 * One list, whose entries are the people on the trip. Ticking two names asks for
 * the places they agree on, which is the question the product exists to answer —
 * not the places either of them wants, which is a different and much longer
 * list. The button says which it is, because the two readings are both plausible
 * and only one is right.
 *
 * A native `<select multiple>` would be the obvious control and is not usable:
 * it renders as a scrolling box that is always open, loses its selection to a
 * stray click, and cannot hold an entry that is not one of the people.
 *
 * It decides nothing. What each choice selects lives in `@pinpoint/core` so the
 * map, the card and eventually the phone all agree; this file only says which
 * words go on which value.
 */

export function FilterBar({
  filter,
  onChange,
  members,
  ownMemberId,
  shown,
  total,
}: {
  filter: MarkerFilter
  onChange: (filter: MarkerFilter) => void
  members: readonly TripMember[]
  /** So the reader is named the way the detail card names them. */
  ownMemberId: string | null
  /** How many markers survive the filter, and how many the trip holds. */
  shown: number
  total: number
}) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement | null>(null)

  /**
   * Closing the way a dropdown closes.
   *
   * Pointer down rather than click, so that pressing on the map both closes this
   * and reaches the map — a click listener here would fire after the map had
   * already decided what the press meant.
   */
  useEffect(() => {
    if (!open) return

    const dismiss = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

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

  return (
    <div className={styles.bar}>
      <div className={styles.picker} ref={wrapper}>
        <span className={styles.label}>Wanted by</span>

        <button
          type="button"
          onClick={() => setOpen((shown) => !shown)}
          aria-expanded={open}
          aria-haspopup="true"
          className={styles.select}
        >
          {summarise(filter.interest, members, nameOf)}
          <span aria-hidden className={styles.caret}>
            ▾
          </span>
        </button>

        {open ? (
          <div className={styles.menu} role="group" aria-label="Wanted by">
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
          </div>
        ) : null}
      </div>

      <label className={styles.toggle}>
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
        Said out loud whenever anything is hidden, and cleared from the same
        place. A filtered trip and a trip that lost its places look identical —
        fewer pins — and the difference is not one a person can recover alone.
      */}
      {isFiltered(filter) ? (
        <p className={styles.narrowed} role="status">
          <span className={styles.count}>
            Showing {shown} of {total}
          </span>
          <button
            type="button"
            onClick={() => onChange(NO_FILTER)}
            className={styles.clear}
          >
            Clear
          </button>
        </p>
      ) : null}
    </div>
  )
}

/**
 * What the closed control says.
 *
 * Names rather than a count, up to the point where the names stop fitting. "Two
 * people" answers a question nobody asked; the whole reason interest is stored
 * per member is that *which* of you is the interesting part.
 *
 * Two names are joined with "and" rather than a comma, because it is the word
 * that carries the meaning — the places you both want, not either of you.
 */
function summarise(
  interest: InterestFilter,
  members: readonly TripMember[],
  nameOf: (member: TripMember) => string,
): string {
  if (interest.kind === 'anyone') return 'Anyone'
  if (interest.kind === 'unanswered') return 'Nobody yet'

  const names = members
    .filter((member) => interest.members.includes(member.id))
    .map(nameOf)

  if (names.length === 0) return 'Anyone'
  if (names.length === 1) return names[0]!
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  if (names.length === members.length) return 'Everyone'
  return `${names.length} people`
}
