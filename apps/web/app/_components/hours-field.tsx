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
import { message, type Message } from '@pinpoint/wording'
import { useId } from 'react'

import { useLanguage, useSay } from '@/app/_components/language'

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
  /** A name, like every other field's refusal; resolved where it is drawn. */
  error?: Message
}) {
  const labelId = useId()
  const language = useLanguage()
  const say = useSay()
  const [open, close] = draft.range
  const hint = rangeHint(draft.range)
  const days = describeDays(language, draft.days)
  const week = WEEKDAY_WORDING[language]

  return (
    <div className={styles.field} role="group" aria-labelledby={labelId}>
      <span id={labelId} className={styles.label}>
        {say(message('placeField.hours'))}
      </span>

      <div className={styles.days}>
        {WEEK.map((day) => (
          <button
            key={day}
            type="button"
            className={styles.day}
            aria-pressed={draft.days.includes(day)}
            aria-label={week[day].name}
            title={week[day].name}
            onClick={() => onChange(toggleDay(draft, day))}
          >
            {week[day].letter}
          </button>
        ))}
      </div>

      <p className={styles.hint}>
        {say(days ?? message('hoursField.empty'))}
      </p>

      {draft.days.length > 0 ? (
        <div className={styles.rangeBlock}>
          <div className={styles.range}>
            <TimeInput
              value={open}
              label={say(message('hoursField.opens'))}
              onChange={(value) => onChange({ ...draft, range: [value, close] })}
            />
            <span className={styles.to}>{say(message('hoursField.to'))}</span>
            <TimeInput
              value={close}
              label={say(message('hoursField.closes'))}
              onChange={(value) => onChange({ ...draft, range: [open, value] })}
            />
          </div>
          {hint ? <span className={styles.nextDay}>{say(hint)}</span> : null}
        </div>
      ) : null}

      {error ? (
        <span role="alert" className={styles.error}>
          {say(error)}
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
