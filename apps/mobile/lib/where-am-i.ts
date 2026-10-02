import { type Fix, locate, type LocationPermission, type WhereAmIStatus } from '@pinpoint/map'
import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

import { useActiveAgain } from '@/lib/use-active-again'

/** Where the dot is drawn, and what "where am I" last concluded (`device-location`). */
export interface WhereAmI {
  status: WhereAmIStatus
  /** The latest position, kept through a later failure so the dot stays where it was. */
  fix: Fix | null
  /**
   * One press. Resolves with the position found, or `null`, so the caller can
   * move the camera — which is the map's to do, not this hook's.
   */
  locate: () => Promise<Fix | null>
  /** Clears a refused or not-found status, for dismissing its note. */
  dismiss: () => void
  /**
   * What asking would get, read without asking (`nearby-places`). Re-read on
   * every return to the foreground, so a permission changed in Settings is
   * known by the time the person is back.
   */
  permission: LocationPermission
}

function permissionOf(response: Location.LocationPermissionResponse): LocationPermission {
  if (response.granted) return 'granted'
  // iOS will not ask a second time once refused; Android may, and until it
  // stops offering the question there is still something to offer.
  return response.status === Location.PermissionStatus.DENIED && !response.canAskAgain
    ? 'refused'
    : 'unknown'
}

function fixOf(position: Location.LocationObject): Fix {
  return {
    lng: position.coords.longitude,
    lat: position.coords.latitude,
    accuracy: position.coords.accuracy ?? null,
  }
}

/**
 * The phone's position, asked for on the first press and followed after it.
 *
 * Nothing here runs until `locate` is called, so opening the app never asks.
 * After the first success a watch keeps `fix` current for as long as the app is
 * in the foreground: it stops when the app goes to the background and starts
 * again when it comes back. Nothing is persisted — a new launch starts `idle`,
 * and the position never leaves this hook except to be drawn.
 */
export function useWhereAmI(): WhereAmI {
  const [status, setStatus] = useState<WhereAmIStatus>('idle')
  const [fix, setFix] = useState<Fix | null>(null)
  const [permission, setPermission] = useState<LocationPermission>('unknown')

  /** Whether a position has been found this session, so a return resumes the watch. */
  const following = useRef(false)
  const watch = useRef<Location.LocationSubscription | null>(null)
  const finding = useRef(false)

  const stopWatching = useCallback(() => {
    watch.current?.remove()
    watch.current = null
  }, [])

  const startWatching = useCallback(async () => {
    if (watch.current) return
    try {
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (position) => setFix(fixOf(position)),
      )
      // Backgrounded while the subscription was being set up: the listener
      // below has already run and found nothing to stop.
      if (AppState.currentState !== 'active') {
        subscription.remove()
        return
      }
      watch.current = subscription
    } catch {
      // Permission withdrawn in Settings since the last fix. The dot stays where
      // it was; the next press asks again and says what happened.
    }
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background') stopWatching()
    })
    return () => {
      subscription.remove()
      stopWatching()
    }
  }, [stopWatching])

  const readPermission = useCallback(async () => {
    try {
      setPermission(permissionOf(await Location.getForegroundPermissionsAsync()))
    } catch {
      setPermission('unknown')
    }
  }, [])

  useEffect(() => {
    let live = true
    Location.getForegroundPermissionsAsync()
      .then((response) => {
        if (live) setPermission(permissionOf(response))
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])

  useActiveAgain(() => {
    void readPermission()
    if (following.current) void startWatching()
  })

  const press = useCallback(async () => {
    // One attempt at a time: the control is busy, and a second press while it
    // is would start a second wait that could land after the first.
    if (finding.current) return null
    finding.current = true
    setStatus('finding')

    const outcome = await locate({
      askPermission: async () => (await Location.requestForegroundPermissionsAsync()).granted,
      currentPosition: async () =>
        fixOf(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })),
    })

    finding.current = false
    setStatus(outcome.status)
    void readPermission()
    if (outcome.status !== 'found') return null

    setFix(outcome.fix)
    following.current = true
    void startWatching()
    return outcome.fix
  }, [startWatching, readPermission])

  const dismiss = useCallback(() => {
    setStatus((current) => (current === 'refused' || current === 'notFound' ? 'idle' : current))
  }, [])

  return { status, fix, locate: press, dismiss, permission }
}
