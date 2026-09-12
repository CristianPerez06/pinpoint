import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import type { ReactNode } from 'react'

import { COLOUR, parseThemePreference, type ThemePreference } from '@pinpoint/tokens'

import { ThemePreferenceProvider } from '@/app/_components/theme-preference'
import { figtree } from '@/app/fonts'
import { THEME_COOKIE, themeAttribute } from '@/lib/theme-preference'

import './globals.css'

export const metadata: Metadata = {
  title: 'pinpoint',
  description: 'A map you can drop markers on.',
}

/** The chosen ground, read before anything is rendered. */
async function storedPreference(): Promise<ThemePreference> {
  return parseThemePreference((await cookies()).get(THEME_COOKIE)?.value)
}

/**
 * The browser's own furniture, dressed to match the page under it.
 *
 * `colorScheme` tells the browser the document handles both grounds; `themeColor`
 * says which colour each of them is, so the address bar is the app's ground
 * rather than the browser's guess at one. Two entries rather than one for the
 * same reason every colour token is a pair — a single value would be a light bar
 * over a dark page on one of the two themes.
 *
 * This is the one place both grounds can be stated. `manifest.ts` names a single
 * colour because the manifest has no media query, and says so.
 *
 * WHY THIS IS A FUNCTION AND NOT A CONSTANT
 *
 * The pair above is chosen between *by the browser*, using the system
 * preference — which is right until somebody forces a ground, and then produces
 * the exact mismatch the pair exists to prevent: a dark address bar over a page
 * that was told to be light. A forced choice therefore has to collapse both
 * fields to the single value it chose, and only the server knows what that is.
 *
 * The cost is that reading a cookie here makes the root layout dynamic, and with
 * it every page beneath. Accepted deliberately rather than discovered later:
 * this application is entirely behind authentication and already reads cookies
 * on every request to resolve the session, so there was no static page to lose.
 * Worth revisiting if a public, unauthenticated page is ever added.
 */
export async function generateViewport(): Promise<Viewport> {
  const forced = themeAttribute(await storedPreference())

  return {
    themeColor:
      forced === null
        ? [
            { media: '(prefers-color-scheme: light)', color: COLOUR.ground.light },
            { media: '(prefers-color-scheme: dark)', color: COLOUR.ground.dark },
          ]
        : COLOUR.ground[forced],
    width: 'device-width',
    initialScale: 1,
    colorScheme: forced ?? 'light dark',
    /**
     * The page draws to the edges of the glass, and clears the hardware itself.
     *
     * Without this the browser insets the whole document above the home indicator
     * and `env(safe-area-inset-*)` answers `0px` — so the declarations that clear
     * it are present, correct, and do nothing, which is the worst version of this
     * to debug. With it the insets become real numbers and every edge the
     * application draws on has to say what it does about them.
     *
     * Document-wide, so it is not a phone-layout setting. It is also why the
     * laptop bar takes horizontal safe-area padding: width alone sends a phone
     * held in landscape to that bar, and the notch is on its side there.
     */
    viewportFit: 'cover',
  }
}

/**
 * `figtree.variable`, not `figtree.className`.
 *
 * The class sets `font-family` on <html>, and the body rule in `globals.css`
 * overrides it for everything inside — leaving the text to match the face only
 * through CSS's case-insensitive family lookup, and dropping the metric-matched
 * fallback `next/font` generates to stop the page reflowing when the real file
 * lands. As a custom property it composes instead of competing.
 *
 * `data-theme` carries what the person *chose*, not the ground that was
 * resolved, and is absent entirely when they have chosen nothing — which is the
 * case the generated stylesheet's media query already handles correctly on its
 * own. Putting a resolved ground here instead would make JavaScript responsible
 * for the interface's theme on every visit, and `tokens.css` is explicit that a
 * browser theme belongs in the cascade.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const preference = await storedPreference()

  return (
    <html
      lang="en"
      className={figtree.variable}
      data-theme={themeAttribute(preference) ?? undefined}
    >
      <body>
        <ThemePreferenceProvider initial={preference}>{children}</ThemePreferenceProvider>
      </body>
    </html>
  )
}
