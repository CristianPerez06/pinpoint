import { markerSchema } from '@pinpoint/core'
import { ATTRIBUTION, DEFAULT_STYLE, fitBounds, styleUrl } from '@pinpoint/map'
import { createPinpointClient } from '@pinpoint/supabase'
import { ScrollView, Text, View } from 'react-native'

import { config } from '@/lib/config'

/**
 * The walking skeleton.
 *
 * This screen exists to prove one thing: Metro resolves and transpiles
 * workspace packages shipped as TypeScript source. That is a different question
 * from whether Next can — the two bundlers have different resolution rules, and
 * only one of them is exercised by the web app.
 *
 * The numbers below come from the same `fitBounds` the web app calls, on the
 * same input. Matching output is the portability claim, demonstrated rather
 * than asserted.
 *
 * `createPinpointClient` is imported as a value (so Metro must resolve and
 * bundle it) but deliberately not called: constructing a real client opens a
 * realtime connection, which a shell has no reason to do.
 */
const SAMPLE_MARKERS = [
  { lng: 139.7671, lat: 35.6812 },
  { lng: 135.5023, lat: 34.6937 },
  { lng: 130.4017, lat: 33.5904 },
]

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
      <Text style={{ width: 90 }}>{label}</Text>
      <Text style={{ flex: 1 }}>{value}</Text>
    </View>
  )
}

export default function Index() {
  const camera = fitBounds(SAMPLE_MARKERS)

  const validated = markerSchema.safeParse({
    id: '00000000-0000-4000-8000-000000000000',
    tripId: '00000000-0000-4000-8000-000000000001',
    name: 'Sample',
    note: null,
    lng: SAMPLE_MARKERS[0]!.lng,
    lat: SAMPLE_MARKERS[0]!.lat,
    createdAt: new Date(0).toISOString(),
  })

  const clientFactoryReady = typeof createPinpointClient === 'function'
  const configured = config.supabase.url.length > 0

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>pinpoint</Text>
      <Text>Workspace skeleton — no map yet.</Text>

      <View>
        <Text style={{ fontWeight: '600', marginBottom: 6 }}>@pinpoint/map</Text>
        <Row label="markers" value={String(SAMPLE_MARKERS.length)} />
        <Row
          label="center"
          value={`${camera.center.lng.toFixed(4)}, ${camera.center.lat.toFixed(4)}`}
        />
        <Row label="zoom" value={camera.zoom.toFixed(3)} />
        <Row label="style" value={`${DEFAULT_STYLE} — ${styleUrl()}`} />
      </View>

      <View>
        <Text style={{ fontWeight: '600', marginBottom: 6 }}>@pinpoint/core</Text>
        <Row label="schema" value={validated.success ? 'parses' : 'rejects'} />
      </View>

      <View>
        <Text style={{ fontWeight: '600', marginBottom: 6 }}>
          @pinpoint/supabase
        </Text>
        <Row label="factory" value={clientFactoryReady ? 'resolved' : 'missing'} />
        <Row label="config" value={configured ? 'loaded' : 'empty'} />
      </View>

      <Text style={{ fontSize: 11, opacity: 0.6 }}>{ATTRIBUTION}</Text>
    </ScrollView>
  )
}
