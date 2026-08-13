'use client'

import { styleUrl, themeStyle, type StyleDocument } from '@pinpoint/map'
import type { ThemeMode } from '@pinpoint/tokens'

/**
 * Fetching the style document, so the shared transformation can repaint it.
 *
 * The URL used to go straight to MapLibre, which fetched it itself. It cannot
 * any more: OpenFreeMap publishes no dark style and its light one is cool where
 * this interface is warm, so the document has to be transformed before the
 * renderer sees it — and `@pinpoint/map` cannot fetch, because it declares no
 * third-party dependencies.
 *
 * That adds a request before the map can draw, and a failure mode that did not
 * exist. Both are accepted: the alternative is committing a patched document,
 * which pins the style at build time and loses every upstream fix.
 *
 * Cached for the session because the document does not change underneath a
 * page, and refetching it on every theme change would make toggling appearance
 * hit the network.
 */
let cached: Promise<StyleDocument> | null = null

function fetchStyleDocument(): Promise<StyleDocument> {
  cached ??= fetch(styleUrl())
    .then((response) => {
      if (!response.ok) {
        throw new Error(`the tile service answered ${response.status}`)
      }
      return response.json() as Promise<StyleDocument>
    })
    .catch((cause: unknown) => {
      // Cleared so a later attempt can succeed — a cached rejection would make
      // one flaky request permanent for the rest of the session.
      cached = null
      throw cause
    })

  return cached
}

/**
 * The style to hand the renderer, repainted for one ground.
 *
 * Rejects rather than falling back to the untransformed document. A half-themed
 * map — or a light map inside a dark interface — reads as a rendering bug, and
 * the failure this produces instead can at least say what happened.
 */
export async function themedBasemap(mode: ThemeMode): Promise<StyleDocument> {
  return themeStyle(await fetchStyleDocument(), mode)
}
