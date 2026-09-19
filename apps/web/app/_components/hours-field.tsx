'use client'

import {
  describeDays,
  type HoursDraft,
  normaliseTime,
  rangeHint,
  toggleDay,
  WEEK,
  WEEKDAY_WORDING,
} from '@pinpoint/core'
import { useId } from 'react'

import styles from './hours-field.module.css'

/**
 * The days a place is open and at what times (#176, #190).
 *
 * A row of day letters, then — once a day is on — one opening and one closing
 * time for every open day. What is stored is one week, per day; the conversion
 * both ways lives in `@pinpoint/core` so the phone makes the same one.
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
  const [open, close] = draft.range
  const hint = rangeHint(draft.range)

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
        <div className={styles.rangeBlock}>
          <div className={styles.range}>
            <TimeInput
              value={open}
              label="Opens"
              onChange={(value) => onChange({ ...draft, range: [value, close] })}
            />
            <span className={styles.to}>to</span>
            <TimeInput
              value={close}
              label="Closes"
              onChange={(value) => onChange({ ...draft, range: [open, value] })}
            />
          </div>
          {hint ? <span className={styles.nextDay}>{hint}</span> : null}
        </div>
      ) : null}

      {error ? (
        <span role="alert" className={styles.error}>
          {error}
        </span>
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
