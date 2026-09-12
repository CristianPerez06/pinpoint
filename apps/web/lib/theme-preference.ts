import type { ThemePreference } from '@pinpoint/tokens'

/**
 * Where the chosen ground is kept, and why it is a cookie.
 *
 * Not for durability — `localStorage` survives a reload just as well. It is a
 * cookie because the **server** has to be able to read it.
 *
 * Today the wrong-ground flash is small and confined: the map starts light
 * while the chrome around it is already dark, because the cascade gets the
 * chrome right without any JavaScript running at all. Add a stored choice and
 * that inverts — the cascade no longer knows the whole answer, so whatever the
 * server writes onto `<html>` becomes the first frame of the *entire* page
 * rather than of one component. A store the server cannot read does not leave
 * the flash where it is; it promotes it from the map to the interface.
 *
 * Read once per server render and nowhere else. The client never reads this for
 * live state — the provider holds that — so there is exactly one reader, which
 * is what stops the cascade and the map from being able to disagree.
 */
export const THEME_COOKIE = 'pp-theme'

/** A year. The preference is not a session and re-asking every week is noise. */
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

/**
 * What `<html>` should carry, or null for no attribute at all.
 *
 * The absence of the attribute is the system case — see the generated
 * stylesheet's own header. An attribute present with the value `"system"` would
 * have to be excluded by hand in every selector the derivation writes, so this
 * returns null and the caller omits it.
 */
export function themeAttribute(preference: ThemePreference): 'light' | 'dark' | null {
  return preference === 'system' ? null : preference
}

/**
 * The cookie as a `document.cookie` assignment.
 *
 * Written by the client on change rather than through a server action. A server
 * action would round-trip a theme toggle, and a theme toggle that waits on the
 * network is a theme toggle that stutters — the cookie exists to make the *next*
 * server render correct, not to carry the current one.
 *
 * `SameSite=Lax` rather than `Strict`: a person following a shared trip link
 * from a chat application should land on the ground they chose, and this value
 * is a display preference rather than anything that authorises a request.
 */
export function themeCookieAssignment(preference: ThemePreference): string {
  return `${THEME_COOKIE}=${preference}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`
}
