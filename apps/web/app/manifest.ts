import type { MetadataRoute } from 'next'

import { COLOUR } from '@pinpoint/tokens'

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
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'pinpoint',
    short_name: 'pinpoint',
    description: 'A map you can drop markers on.',
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
