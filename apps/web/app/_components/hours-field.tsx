'use client'

import {
  daysNotApart,
  describeDays,
  type HoursDraft,
  type HoursRange,
  normaliseTime,
  rangeHint,
  rejoinDay,
  setDayApart,
  toggleDay,
  WEEK,
  WEEKDAY_WORDING,
  type Weekday,
} from '@pinpoint/core'
import { Plus, X } from 'lucide-react'
import { useId, useState } from 'react'

import styles from './hours-field.module.css'

/**
 * The days a place is open and at what times (#176).
 *
 * A row of day letters, then — once a day is on — the usual hours for every
 * open day, and any day set apart with hours of its own. What is stored is one
 * week, per day; "usual" and "set apart" are how the form lets somebody enter
 * that week without typing Tuesday's hours five times, and the conversion both
 * ways lives in `@pinpoint/core` so the phone makes the same one.
 *
 * Times are typed, not picked. The browser's own time box follows the
 * computer's region, so a laptop set to the US would show `9:00 PM` for a
 * product that writes `21:00` everywhere else.
 */
export function HoursField({
  draft,
  onChange,
  error,
}: {
  draft: HoursDraft
  onChange: (draft: HoursDraft) => void
  error?: string
}) {
  const labelId = useId()
  const [choosingDay, setChoosingDay] = useState(false)
  const candidates = daysNotApart(draft)

  return (
    <div className={styles.field} role="group" aria-labelledby={labelId}>
      <span id={labelId} className={styles.label}>
        Hours (optional)
      </span>

      <div className={styles.days}>
        {WEEK.map((day) => (
          <button
            key={day}
            type="button"
            className={styles.day}
            aria-pressed={draft.days.includes(day)}
            aria-label={WEEKDAY_WORDING[day].name}
            title={WEEKDAY_WORDING[day].name}
            onClick={() => onChange(toggleDay(draft, day))}
          >
            {WEEKDAY_WORDING[day].letter}
          </button>
        ))}
      </div>

      <p className={styles.hint}>
        {describeDays(draft.days) ??
          "Leave empty if you don't know. Pick the days it opens to add hours."}
      </p>

      {draft.days.length > 0 ? (
        <>
          <span className={styles.subhead}>Usual hours</span>
          <Ranges
            label="Usual hours"
            ranges={draft.usual}
            onChange={(usual) => onChange({ ...draft, usual })}
          />

          {draft.apart.length > 0 ? (
            <span className={styles.subhead}>Different on some days</span>
          ) : null}

          {draft.apart.map((entry) => {
            const name = WEEKDAY_WORDING[entry.day].name
            return (
              <div key={entry.day} className={styles.apart}>
                <div className={styles.apartHead}>
                  <span className={styles.apartDay}>{WEEKDAY_WORDING[entry.day].short}</span>
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`Give ${name} the usual hours`}
                    title={`Give ${name} the usual hours`}
                    onClick={() => onChange(rejoinDay(draft, entry.day))}
                  >
                    <X size={15} strokeWidth={2.2} />
                  </button>
                </div>
                <Ranges
                  label={name}
                  ranges={entry.ranges}
                  onChange={(ranges) =>
                    onChange({
                      ...draft,
                      apart: draft.apart.map((each) =>
                        each.day === entry.day ? { ...each, ranges } : each,
                      ),
                    })
                  }
                />
              </div>
            )
          })}

          {choosingDay && candidates.length > 0 ? (
            <div className={styles.choose} role="group" aria-label="Which day is different?">
              <span className={styles.hint}>Which day is different?</span>
              <div className={styles.chooseDays}>
                {candidates.map((day: Weekday) => (
                  <button
                    key={day}
                    type="button"
                    className={styles.chip}
                    onClick={() => {
                      onChange(setDayApart(draft, day))
                      setChoosingDay(false)
                    }}
                  >
                    {WEEKDAY_WORDING[day].short}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => setChoosingDay(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : candidates.length > 0 ? (
            <button
              type="button"
              className={draft.apart.length > 0 ? styles.chip : styles.link}
              onClick={() => setChoosingDay(true)}
            >
              {draft.apart.length > 0 ? (
                '+ Another day'
              ) : (
                <>
                  <Plus size={14} strokeWidth={2.2} />
                  Different on some days
                </>
              )}
            </button>
          ) : null}
        </>
      ) : null}

      {error ? (
        <span role="alert" className={styles.error}>
          {error}
        </span>
      ) : null}
    </div>
  )
}

/** One or two ranges, each a pair of typed times. */
function Ranges({
  label,
  ranges,
  onChange,
}: {
  /** Whose ranges these are, for the fields' accessible names. */
  label: string
  ranges: HoursRange[]
  onChange: (ranges: HoursRange[]) => void
}) {
  const set = (index: number, range: HoursRange) =>
    onChange(ranges.map((each, i) => (i === index ? range : each)))

  return (
    <div className={styles.ranges}>
      {ranges.map((range, index) => {
        const hint = rangeHint(range)
        const which = index === 0 ? label : `${label}, second set`
        return (
          <div key={index} className={styles.rangeBlock}>
            <div className={styles.range}>
              <TimeInput
                value={range[0]}
                label={`${which}, opens`}
                onChange={(value) => set(index, [value, range[1]])}
              />
              <span className={styles.to}>to</span>
              <TimeInput
                value={range[1]}
                label={`${which}, closes`}
                onChange={(value) => set(index, [range[0], value])}
              />
              {index > 0 ? (
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={`Remove ${which.toLowerCase()}`}
                  title="Remove"
                  onClick={() => onChange(ranges.filter((_, i) => i !== index))}
                >
                  <X size={15} strokeWidth={2.2} />
                </button>
              ) : null}
            </div>
            {hint ? <span className={styles.nextDay}>{hint}</span> : null}
          </div>
        )
      })}

      {ranges.length < 2 ? (
        <button
          type="button"
          className={styles.link}
          onClick={() => onChange([...ranges, ['', '']])}
        >
          <Plus size={14} strokeWidth={2.2} />
          Add a second range
        </button>
      ) : null}
    </div>
  )
}

/**
 * A time, typed. `9`, `930` and `9:30` all become `09:00`-shaped on leaving the
 * field; anything that is not a time is left as typed for the save to refuse,
 * because rewriting it would hide what the person actually entered.
 */
function TimeInput({
  value,
  label,
  onChange,
}: {
  value: string
  label: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={5}
      placeholder="00:00"
      aria-label={label}
      className={styles.time}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        const time = normaliseTime(value)
        if (time !== null && time !== value) onChange(time)
      }}
    />
  )
}
