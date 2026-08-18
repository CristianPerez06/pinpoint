'use client'

import {
  type InterestQuantifier,
  isFiltered,
  type MarkerFilter,
  NO_FILTER,
  type TripMember,
} from '@pinpoint/core'

import styles from './filter-bar.module.css'

/**
 * Narrowing a trip to the places worth looking at.
 *
 * Two questions, asked in the order they are answered: how much agreement is
 * being looked for, and among whom. Splitting them is what lets one control
 * serve a pair of travellers and a group — the questions a pair asks are these
 * quantifiers applied to everybody, and a group needs the same questions asked
 * of a subset.
 *
 * The names appear only once a quantifier has been chosen. Unfiltered is the
 * state a trip opens in and by far the most common one, and a row of ticked
 * boxes that change nothing is a control that has to be understood before it can
 * be ignored.
 *
 * It decides nothing. What each choice selects lives in `@pinpoint/core` so the
 * map, the card and eventually the phone all agree; this file only says which
 * words go on which value.
 */

/**
 * Phrased without pronouns, because the names are shown right beside them and
 * "both of you" would be wrong the moment somebody unticks themselves.
 *
 * "Anyone" reads as the absence of a question rather than as one of the answers,
 * which is what it is. The pair it must not be confused with is "At least one" —
 * one narrows the trip and the other does not, and these are the two words a
 * reader scanning the menu is most likely to conflate.
 */
const QUANTIFIER_LABELS: Record<InterestQuantifier, string> = {
  unfiltered: 'Anyone',
  all: 'All of them',
  'at-least-one': 'At least one',
  'exactly-one': 'Just one',
  none: 'None of them yet',
}

const QUANTIFIER_ORDER: readonly InterestQuantifier[] = [
  'unfiltered',
  'all',
  'at-least-one',
  'exactly-one',
  'none',
]

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
  const narrowed = isFiltered(filter)
  const { members: selected, quantifier } = filter.interest

  function setQuantifier(next: InterestQuantifier) {
    onChange({
      ...filter,
      interest: {
        quantifier: next,
        /*
         * Everybody, the first time a real question is asked. Revealing an
         * unticked list would mean the choice just made selects nothing, and the
         * whole-trip question is the one somebody almost always wants — it is
         * the only one a two-person trip has.
         */
        members:
          selected.length === 0 ? members.map((member) => member.id) : selected,
      },
    })
  }

  function toggleMember(memberId: string) {
    onChange({
      ...filter,
      interest: {
        quantifier,
        members: selected.includes(memberId)
          ? selected.filter((id) => id !== memberId)
          : [...selected, memberId],
      },
    })
  }

  return (
    <div className={styles.bar}>
      <label className={styles.picker}>
        <span className={styles.label}>Wanted by</span>
        <select
          value={quantifier}
          onChange={(event) =>
            setQuantifier(event.target.value as InterestQuantifier)
          }
          className={styles.select}
        >
          {QUANTIFIER_ORDER.map((choice) => (
            <option key={choice} value={choice}>
              {QUANTIFIER_LABELS[choice]}
            </option>
          ))}
        </select>
      </label>

      {quantifier === 'unfiltered' ? null : (
        <span className={styles.members}>
          {members.map((member) => (
            <label key={member.id} className={styles.member}>
              <input
                type="checkbox"
                checked={selected.includes(member.id)}
                onChange={() => toggleMember(member.id)}
                className={styles.checkbox}
              />
              <span>{member.id === ownMemberId ? 'You' : member.displayName}</span>
            </label>
          ))}
        </span>
      )}

      {/*
        Asking a question about nobody. It selects nothing, deliberately, and
        that is easier to act on than to work out — the alternative was silently
        behaving as unfiltered while the menu still read as set.
      */}
      {quantifier !== 'unfiltered' && selected.length === 0 ? (
        <span className={styles.hint} role="status">
          Pick at least one person
        </span>
      ) : null}

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
      {narrowed ? (
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
