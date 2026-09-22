'use client'

import { message, type LanguagePreference, type Message } from '@pinpoint/wording'
import { Check, Languages, Monitor } from 'lucide-react'

import { useLanguagePreference, useSay } from '@/app/_components/language'

import styles from './settings.module.css'

/**
 * The three languages, in the shape the three grounds already have.
 *
 * Following the device is kept as a choice of its own for the reason it is kept
 * beside Appearance: a stored language cannot be told apart from a device that
 * happens to agree with it, and without the first option there is no way back
 * to having chosen nothing.
 *
 * Each language is named in itself — `English`, `Español` — whatever the page is
 * drawn in. Somebody who landed here in a language they cannot read is looking
 * for the name of their own, and that is the one word they will recognise.
 */
const OPTIONS: ReadonlyArray<{
  value: LanguagePreference
  label: Message
  note: Message
  Glyph: typeof Monitor
}> = [
  {
    value: 'system',
    label: message('settings.followDevice'),
    note: message('language.systemNote'),
    // The glyph Appearance gives the same words, so the two read as one idea.
    Glyph: Monitor,
  },
  {
    value: 'en',
    label: message('language.english'),
    note: message('language.englishNote'),
    Glyph: Languages,
  },
  {
    value: 'es',
    label: message('language.spanish'),
    note: message('language.spanishNote'),
    Glyph: Languages,
  },
]

/**
 * Choosing takes effect at once and everywhere on the page: the provider writes
 * the cookie, then changes its state and refreshes the route in one transition,
 * so the words drawn here and the words the server drew arrive together.
 */
export function Language() {
  const { preference, choose } = useLanguagePreference()
  const say = useSay()

  return (
    <div
      className={styles.options}
      role="radiogroup"
      aria-label={say(message('settings.language'))}
    >
      {OPTIONS.map(({ value, label, note, Glyph }) => {
        const selected = preference === value

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => choose(value)}
            className={styles.option}
            // The same three marks of selection as Appearance; see there.
            data-selected={selected ? 'true' : undefined}
          >
            <Glyph aria-hidden className={styles.optionGlyph} />
            <span className={styles.optionText}>
              {/*
                `lang` on a language's own name, so a screen reader reading a
                Spanish page says `English` as English rather than spelling it
                out in Spanish.
              */}
              <span
                className={styles.optionLabel}
                lang={value === 'system' ? undefined : value}
              >
                {say(label)}
              </span>
              <span className={styles.optionNote}>{say(note)}</span>
            </span>
            {selected ? <Check aria-hidden className={styles.optionTick} /> : null}
          </button>
        )
      })}
    </div>
  )
}
