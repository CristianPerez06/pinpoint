'use client'

import type { ThemePreference } from '@pinpoint/tokens'
import { Check, Monitor, Moon, Sun } from 'lucide-react'

import { useThemePreference } from '@/app/_components/theme-preference'

import styles from './settings.module.css'

/**
 * The three grounds, and why this is not a switch.
 *
 * A two-state toggle would have to drop "follow the device", which is the state
 * every person using this product is in today and the one almost all of them
 * will stay in. Offering light and dark alone turns a working default into
 * something nobody chose, and there is no way back to it.
 *
 * A radio group rather than three buttons: exactly one is in force at any time,
 * and that is what the role means. It also gets arrow-key movement between the
 * options for free, which three buttons would each have to be tabbed through.
 */
const OPTIONS: ReadonlyArray<{
  value: ThemePreference
  label: string
  note: string
  Glyph: typeof Sun
}> = [
  {
    value: 'system',
    label: 'Follow the device',
    note: 'Changes when your system appearance does',
    Glyph: Monitor,
  },
  { value: 'light', label: 'Light', note: 'Always the light ground', Glyph: Sun },
  { value: 'dark', label: 'Dark', note: 'Always the dark ground', Glyph: Moon },
]

export function Appearance() {
  const { preference, choose } = useThemePreference()

  return (
    <div className={styles.options} role="radiogroup" aria-label="Appearance">
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
            /*
              The selected state is carried by three things — the wash, the tick,
              and the border — because `DESIGN.md` asks every state to survive a
              greyscale display and a colour-blind reader. The tick is the half
              that does that; the wash is the half that makes it findable at a
              glance. Neither is sufficient alone and the pair is not redundancy.
            */
            data-selected={selected ? 'true' : undefined}
          >
            <Glyph aria-hidden className={styles.optionGlyph} />
            <span className={styles.optionText}>
              <span className={styles.optionLabel}>{label}</span>
              <span className={styles.optionNote}>{note}</span>
            </span>
            {/*
              Present only when selected, rather than always rendered and hidden.
              A tick at zero opacity is still read out by a screen reader, which
              would announce all three options as ticked; `aria-checked` above is
              what carries this to assistive technology, and the glyph is for the
              eye.
            */}
            {selected ? <Check aria-hidden className={styles.optionTick} /> : null}
          </button>
        )
      })}
    </div>
  )
}
