import type { MetadataRoute } from 'next'

import { COLOUR } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'

import { serverSay } from '@/lib/language'

/**
 * What an installed copy of the site is called and what it looks like before it
 * has drawn anything.
 *
 * It exists for the icons more than for installation. Without a manifest,
 * Android has nothing to put on a home screen but a screenshot of the page and
 * a shrunken favicon, and the icon it does pick is masked to whatever shape the
 * launcher uses — which is why the two entries below are the square-to-the-edge
 * drawing rather than `icon.svg`'s rounded tile. `maskable` is declared beside
 * `any` because both are true of them: the drop is small enough to survive the
 * launcher's crop, and the tile is a complete icon if nothing crops it.
 *
 * WHY THESE COLOURS ARE THE LIGHT ONES AND NOT A PAIR
 *
 * Every other colour in this repository is chosen twice, once against each
 * ground. A manifest cannot express that — the fields are single values, and
 * they are read at install time by a launcher that is not asking a browser
 * anything about the person's theme. So this file states the light ground and
 * `layout.tsx` states both, through the `theme-color` meta that *is* allowed a
 * media query. The two are not in competition: this one dresses the splash
 * screen an installed copy shows before the first paint, that one dresses the
 * browser's own furniture around a page already rendering.
 *
 * The description is in the language of whoever asked for the manifest, read
 * from their cookie and their browser as every page is — an install is the one
 * moment it is shown, and it is shown to them.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const say = await serverSay()
  return {
    name: say(message('app.name')),
    short_name: say(message('app.name')),
    description: say(message('app.description')),
    start_url: '/',
    display: 'standalone',
    background_color: COLOUR.ground.light,
    theme_color: COLOUR.ground.light,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
