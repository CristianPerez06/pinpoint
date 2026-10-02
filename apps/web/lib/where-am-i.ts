'use client'

import {
  type Fix,
  locate,
  LOCATE_TIMEOUT_MS,
  type LocationPermission,
  LocationRefused,
  type WhereAmIStatus,
} from '@pinpoint/map'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useVisibleAgain } from '@/lib/use-visible-again'

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
   * What asking would get, read without asking (`nearby-places`). Follows the
   * browser's own change event, so allowing the site from the address bar is
   * known at once. `unknown` where the browser cannot say for geolocation.
   */
  permission: LocationPermission
}

function permissionOf(state: PermissionState): LocationPermission {
  return state === 'granted' ? 'granted' : state === 'denied' ? 'refused' : 'unknown'
}

function fixOf(position: GeolocationPosition): Fix {
  return {
    lng: position.coords.longitude,
    lat: position.coords.latitude,
    accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
  }
}

/**
 * Whether the browser has already been told no for this site.
 *
 * Asked before the position call so a second press after a refusal answers at
 * once rather than after the call fails. Where the Permissions API cannot
 * answer for geolocation, the position call still reports the refusal — this
 * only saves the wait.
 */
async function notRefused(): Promise<boolean> {
  try {
    const state = await navigator.permissions.query({ name: 'geolocation' })
    return state.state !== 'denied'
  } catch {
    return true
  }
}

function currentPosition(): Promise<Fix> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(fixOf(position)),
      // A browser has no permission request of its own: its prompt and its
      // refusal both arrive through this call, so the refusal is named here for
      // `locate` to tell apart from a position that never came.
      (error) =>
        reject(error.code === error.PERMISSION_DENIED ? new LocationRefused() : error),
      { enableHighAccuracy: true, timeout: LOCATE_TIMEOUT_MS, maximumAge: 0 },
    )
  })
}

/**
 * The browser's position, asked for on the first press and followed after it.
 *
 * The laptop half of what `apps/mobile/lib/where-am-i.ts` does on the phone,
 * with the same shape so the map and the notes read the same fields. Nothing
 * runs until `locate` is called. After the first success a watch keeps `fix`
 * current while the tab is visible; it stops when the tab is hidden and starts
 * again when it is shown. Nothing is stored.
 */
export function useWhereAmI(): WhereAmI {
  const [status, setStatus] = useState<WhereAmIStatus>('idle')
  const [fix, setFix] = useState<Fix | null>(null)
  const [permission, setPermission] = useState<LocationPermission>('unknown')

  const following = useRef(false)
  const watch = useRef<number | null>(null)
  const finding = useRef(false)

  const stopWatching = useCallback(() => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current)
    watch.current = null
  }, [])

  const startWatching = useCallback(() => {
    if (watch.current !== null || document.visibilityState !== 'visible') return
    watch.current = navigator.geolocation.watchPosition(
      (position) => setFix(fixOf(position)),
      // A watch that fails leaves the dot where it last was. The next press
      // asks again and says what happened.
      () => {},
      { enableHighAccuracy: true, maximumAge: 0 },
    )
  }, [])

  useEffect(() => {
    function onChange() {
      if (document.visibilityState === 'hidden') stopWatching()
    }
    document.addEventListener('visibilitychange', onChange)
    return () => {
      document.removeEventListener('visibilitychange', onChange)
      stopWatching()
    }
  }, [stopWatching])

  useEffect(() => {
    let live = true
    let status: PermissionStatus | null = null
    const onChange = () => {
      if (status) setPermission(permissionOf(status.state))
    }
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((result) => {
        if (!live) return
        status = result
        setPermission(permissionOf(result.state))
        result.addEventListener('change', onChange)
      })
      .catch(() => {})
    return () => {
      live = false
      status?.removeEventListener('change', onChange)
    }
  }, [])

  useVisibleAgain(() => {
    if (following.current) startWatching()
  })

  const press = useCallback(async () => {
    if (finding.current) return null
    finding.current = true
    setStatus('finding')

    const outcome = await locate({ askPermission: notRefused, currentPosition })

    finding.current = false
    setStatus(outcome.status)
    // A browser that cannot answer the permission query still learns the answer
    // here, so the sheet stops offering a question that has been settled.
    if (outcome.status === 'found') setPermission('granted')
    if (outcome.status === 'refused') setPermission('refused')
    if (outcome.status !== 'found') return null

    setFix(outcome.fix)
    following.current = true
    startWatching()
    return outcome.fix
  }, [startWatching])

  const dismiss = useCallback(() => {
    setStatus((current) => (current === 'refused' || current === 'notFound' ? 'idle' : current))
  }, [])

  return { status, fix, locate: press, dismiss, permission }
}
