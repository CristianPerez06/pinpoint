'use client'

import {
  type InterestFilter,
  isFiltered,
  type MarkerFilter,
  NO_FILTER,
} from '@pinpoint/core'

import styles from './filter-bar.module.css'

/**
 * Narrowing a trip to the places worth looking at.
 *
 * Built as a second labelled selector of the same construction as the city
 * picker, which is the point rather than a convenience: two controls that narrow
 * the same trip should not be two different kinds of control, and the city bar
 * already solved the label-plus-select shape at this type scale.
 *
 * It decides nothing. What each choice selects lives in `@pinpoint/core` so the
 * map, the card and eventually the phone all agree; this file only says which
 * words go on which value.
 */

/**
 * The vocabulary is the roadmap's, written for two travellers, while the
 * predicate behind it is defined over however many members a trip has. A third
 * member makes "only one of you" read oddly without making it select the wrong
 * markers — which is the signal to revisit the wording, not the meaning.
 *
 * "No filter" rather than "Anyone" for the unfiltered choice. "Anyone" and
 * "Either of you" are the same words for a reader scanning a menu, and one of
 * them narrows the trip while the other does not — the one distinction in this
 * list that must not be missed.
 */
const INTEREST_LABELS: Record<InterestFilter, string> = {
  any: 'No filter',
  both: 'Both of you',
  either: 'Either of you',
  'only-one': 'Only one of you',
  nobody: 'Nobody yet',
}

const INTEREST_ORDER: readonly InterestFilter[] = [
  'any',
  'both',
  'either',
  'only-one',
  'nobody',
]

export function FilterBar({
  filter,
  onChange,
  shown,
  total,
}: {
  filter: MarkerFilter
  onChange: (filter: MarkerFilter) => void
  /** How many markers survive the filter, and how many the trip holds. */
  shown: number
  total: number
}) {
  const narrowed = isFiltered(filter)

  return (
    <div className={styles.bar}>
      <label className={styles.picker}>
        <span className={styles.label}>Who</span>
        <select
          value={filter.interest}
          onChange={(event) =>
            onChange({ ...filter, interest: event.target.value as InterestFilter })
          }
          className={styles.select}
        >
          {INTEREST_ORDER.map((choice) => (
            <option key={choice} value={choice}>
              {INTEREST_LABELS[choice]}
            </option>
          ))}
        </select>
      </label>

      {/*
        A toggle rather than a third selector. The specification asks for places
        already seen to be set aside; it does not ask for a visited-only view,
        and `VisitedFilter` can express one if a reason ever appears.
      */}
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
