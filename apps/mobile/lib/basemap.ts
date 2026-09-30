import {
  pinnedStyle,
  styleUrl,
  themeStyle,
  type StreetEdition,
  type StyleDocument,
} from '@pinpoint/map'
import type { ThemeMode } from '@pinpoint/tokens'
import { message, type Message } from '@pinpoint/wording'
import { useEffect, useState } from 'react'

import { readKeptText, writeNow } from '@/lib/kept'

/**
 * A style fetch that failed for a reason worth telling the person.
 *
 * It carries a name rather than a sentence because the reason is drawn inside
 * one, and a sentence fixed at the moment of failure would stay in that
 * language after the person changed it. `Error.message` is left to developers.
 */
class BasemapFailure extends Error {
  constructor(readonly reason: Message) {
    super('the map style could not be fetched')
    this.name = 'BasemapFailure'
  }
}

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

/** The name the last fetched style document is kept under on the phone. */
const KEPT_STYLE = 'style'

function keptStyle(): StyleDocument | null {
  const text = readKeptText(KEPT_STYLE)
  if (text === null) return null
  try {
    const document: unknown = JSON.parse(text)
    return typeof document === 'object' && document !== null
      ? (document as StyleDocument)
      : null
  } catch {
    return null
  }
}

function fetchStyleDocument(): Promise<StyleDocument> {
  cached ??= fetch(styleUrl())
    .then((response) => {
      if (!response.ok) {
        throw new BasemapFailure(message('map.styleRefused', { status: response.status }))
      }
      return response.json() as Promise<StyleDocument>
    })
    .then((document) => {
      writeNow(KEPT_STYLE, JSON.stringify(document))
      return document
    })
    .catch((cause: unknown) => {
      // Cleared so a later attempt can succeed — a cached rejection would make
      // one flaky request permanent for the life of the process, which on a
      // phone is a great deal longer than a page load.
      cached = null

      // With no signal, the document kept from the last fetch draws the map
      // instead (`offline-use`). It is the untransformed one, so a change of
      // ground offline still repaints it.
      const kept = keptStyle()
      if (kept !== null) return kept
      throw cause
    })

  return cached
}

/**
 * The untransformed style document, fetched once, or the kept one offline.
 *
 * What a download pins to its edition and hands to the renderer's offline
 * packs (`lib/offline-map.ts`) — the same document the map draws from, so the
 * two ask for the same fonts and icons.
 */
export function styleDocument(): Promise<StyleDocument> {
  return fetchStyleDocument()
}

export interface BasemapState {
  /** The document to hand the renderer, or null while it is being fetched. */
  style: StyleDocument | null
  /**
   * What went wrong, if anything, as a name to resolve where it is drawn. Never
   * both this and a style.
   */
  error: Message | null
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
export function useThemedBasemap(
  mode: ThemeMode,
  /** The edition to pin to, null for none, or undefined while not yet known. */
  edition: StreetEdition | null | undefined = null,
): BasemapState {
  const [state, setState] = useState<BasemapState>({ style: null, error: null })

  useEffect(() => {
    let live = true
    if (edition === undefined) return

    fetchStyleDocument().then(
      (document) => {
        // A trip with a download draws the edition it downloaded, online too:
        // following the tile index would lose it the week after
        // (`offline-use`).
        const streets = edition === null ? document : pinnedStyle(document, edition)
        if (live) setState({ style: themeStyle(streets, mode), error: null })
      },
      (cause: unknown) => {
        if (!live) return
        setState({
          style: null,
          error:
            cause instanceof BasemapFailure ? cause.reason : message('map.styleFailedReason'),
        })
      },
    )

    return () => {
      live = false
    }
  }, [mode, edition])

  return state
}
