import { isTravelMode, type LngLat } from '@pinpoint/map'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { lazy, Suspense } from 'react'

/**
 * Following a route with Ferrostar, under Pinpoint's own map — the trial #282
 * asked for, and the base #279 builds on.
 *
 * Development builds only (`monorepo-structure`): anywhere else it sends the
 * person to the map before drawing anything, and nothing in the app links here.
 * Open it with
 *
 *   xcrun simctl openurl booted "pinpoint://dev/follow?to=<lng>,<lat>&mode=walk"
 *
 * Ferrostar does the tracking — where the person is along the line, the next
 * turn, noticing they have left the route and asking for a new one. Everything
 * drawn is ours. Its map package is not installed.
 *
 * The camera follows the position here because a trial is easier to watch that
 * way. That is not a decision for #279.
 *
 * Ferrostar itself is in `components/follow-trial.tsx`, loaded only when this
 * screen opens; this file must not import it.
 */
const FollowTrial = lazy(() => import('@/components/follow-trial'))

export default function FollowTrialRoute() {
  const { to, mode } = useLocalSearchParams<{ to?: string; mode?: string }>()
  if (!__DEV__) return <Redirect href="/" />
  return (
    <Suspense fallback={null}>
      <FollowTrial to={pointOf(to)} mode={isTravelMode(mode) ? mode : 'walk'} />
    </Suspense>
  )
}

/** `lng,lat` from the link, or null for anything else. */
function pointOf(value: string | undefined): LngLat | null {
  const [lng, lat] = (value ?? '').split(',').map(Number)
  return Number.isFinite(lng) && Number.isFinite(lat) ? { lng: lng!, lat: lat! } : null
}
