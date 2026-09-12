'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

import styles from './settings.module.css'

/**
 * The way back, and why it is not a link to `/`.
 *
 * The workspace holds two things in the address — which trip, and which city is
 * being worked in (`trip-workspace.tsx`, reading `?trip=` and `?city=`). A
 * `<Link href="/">` discards both: somebody who was looking at Kyoto opens
 * Settings, comes back, and is in whichever city the trip defaults to, with
 * nothing on screen to say that it happened or that they did it.
 *
 * `router.back()` reverses the step that left instead, so the address it returns
 * to is the one it came from. This is the first screen in either application
 * that a person *returns* from rather than one that replaces what came before —
 * sign-in and sign-up are a lateral pair nobody goes back from — which is why
 * the distinction has not had to be made until now.
 *
 * A person who arrived at `/settings` by typing it has no history to go back to.
 * `router.back()` on an empty history does nothing at all, so the fallback is a
 * real one rather than a courtesy.
 */
export function BackToMap() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        // `length <= 1` means this document is the first entry in its own
        // history: nothing to go back to, so going back would strand somebody
        // on a screen whose only exit does nothing when pressed.
        if (window.history.length > 1) router.back()
        else router.push('/')
      }}
      className={styles.back}
    >
      <ArrowLeft aria-hidden className={styles.backGlyph} />
      Back to the map
    </button>
  )
}
