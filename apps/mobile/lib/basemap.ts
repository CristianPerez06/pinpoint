import { styleUrl, themeStyle, type StyleDocument } from '@pinpoint/map'
import type { ThemeMode } from '@pinpoint/tokens'
import { useEffect, useState } from 'react'

/**
 * Fetching the style document, so the shared transformation can repaint it.
 *
 * This used to be unnecessary here, and the trip map's comment said so with
 * some satisfaction: `mapStyle` takes a URL, so the same `styleUrl()` web used
 * went straight in, with no fetching and no per-platform patching. That was
 * true and is no longer, for a reason that has nothing to do with platforms —
 * OpenFreeMap publishes no dark style, and its light one is cool where this
 * interface is warm.
 *
 * The important part survived intact: both platforms still fetch the same
 * document and pass it through the same shared function, so there is still one
 * style source rather than two. Only the number of steps changed.
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
      // one flaky request permanent for the life of the process, which on a
      // phone is a great deal longer than a page load.
      cached = null
      throw cause
    })

  return cached
}

export interface BasemapState {
  /** The document to hand the renderer, or null while it is being fetched. */
  style: StyleDocument | null
  /** What went wrong, if anything. Never both this and a style. */
  error: string | null
}

/**
 * The themed style for a ground, refetched only when the ground changes.
 *
 * Returns the failure rather than throwing it or falling back to the
 * untransformed document. A light map inside a dark interface reads as a bug,
 * and a map with no style at all is a blank canvas with correctly-placed pins
 * over it — which is the exact symptom of a defect already fixed once here,
 * from an entirely different cause.
 */
export function useThemedBasemap(mode: ThemeMode): BasemapState {
  const [state, setState] = useState<BasemapState>({ style: null, error: null })

  useEffect(() => {
    let live = true

    fetchStyleDocument().then(
      (document) => {
        if (live) setState({ style: themeStyle(document, mode), error: null })
      },
      (cause: unknown) => {
        if (!live) return
        setState({
          style: null,
          error:
            cause instanceof Error ? cause.message : 'the map style could not be loaded',
        })
      },
    )

    return () => {
      live = false
    }
  }, [mode])

  return state
}
