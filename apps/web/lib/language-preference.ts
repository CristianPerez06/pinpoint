import type { LanguagePreference } from '@pinpoint/wording'

/**
 * Where the chosen language is kept, and why it is a cookie.
 *
 * For the reason the ground is (`theme-preference.ts`): the **server** has to be
 * able to read it. Every word on the first frame is written by a server render,
 * and a choice the server cannot see is a page drawn in one language and then
 * redrawn in another — which `day-wording.ts` records as a hydration mismatch
 * that left the calendar as dead markup, and would here be the same defect with
 * a larger surface.
 *
 * Read once per server render and nowhere else. The client never reads this for
 * live state — the provider holds that — so there is exactly one reader.
 */
export const LANGUAGE_COOKIE = 'pp-language'

/** A year. The preference is not a session and re-asking every week is noise. */
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

/**
 * The cookie as a `document.cookie` assignment.
 *
 * `SameSite=Lax` for the reason the ground's is: a shared trip link followed
 * from a chat application should open in the language its reader chose, and
 * this value authorises nothing.
 */
export function languageCookieAssignment(preference: LanguagePreference): string {
  return `${LANGUAGE_COOKIE}=${preference}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`
}
