import { markerSchema } from '@pinpoint/core'
import { ATTRIBUTION, DEFAULT_STYLE, fitBounds, styleUrl } from '@pinpoint/map'
import { createPinpointClient } from '@pinpoint/supabase'

import { config } from '@/lib/config'

/**
 * The walking skeleton.
 *
 * There is no map here on purpose. What this page proves is that all three
 * workspace packages resolve and transpile through Next as TypeScript source,
 * and that configuration is validated before anything uses it. Rendering an
 * actual map is a later change.
 *
 * The same derivation runs on mobile against the same package — that is the
 * portability claim, exercised rather than asserted.
 */
const SAMPLE_MARKERS = [
  { lng: 139.7671, lat: 35.6812 },
  { lng: 135.5023, lat: 34.6937 },
  { lng: 130.4017, lat: 33.5904 },
]

export default function Home() {
  const camera = fitBounds(SAMPLE_MARKERS)

  // Exercises @pinpoint/core: a parse failure here would fail the render.
  const validated = markerSchema.safeParse({
    id: '00000000-0000-4000-8000-000000000000',
    tripId: '00000000-0000-4000-8000-000000000001',
    name: 'Sample',
    note: null,
    lng: SAMPLE_MARKERS[0]!.lng,
    lat: SAMPLE_MARKERS[0]!.lat,
    createdAt: new Date(0).toISOString(),
  })

  // Exercises @pinpoint/supabase and the validated config together.
  const client = createPinpointClient({
    url: config.supabase.url,
    publishableKey: config.supabase.publishableKey,
  })
  const clientReady = typeof client.from === 'function'

  return (
    <main>
      <h1>pinpoint</h1>
      <p>Workspace skeleton — no map yet.</p>

      <h2>@pinpoint/map</h2>
      <dl>
        <dt>markers</dt>
        <dd>{SAMPLE_MARKERS.length}</dd>
        <dt>center</dt>
        <dd>
          {camera.center.lng.toFixed(4)}, {camera.center.lat.toFixed(4)}
        </dd>
        <dt>zoom</dt>
        <dd>{camera.zoom.toFixed(3)}</dd>
        <dt>style</dt>
        <dd>
          {DEFAULT_STYLE} — {styleUrl()}
        </dd>
      </dl>

      <h2>@pinpoint/core</h2>
      <p>marker schema parses sample: {validated.success ? 'yes' : 'no'}</p>

      <h2>@pinpoint/supabase</h2>
      <p>client constructed: {clientReady ? 'yes' : 'no'}</p>

      <footer>
        <small>{ATTRIBUTION}</small>
      </footer>
    </main>
  )
}
