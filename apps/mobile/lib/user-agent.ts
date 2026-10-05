import Constants from 'expo-constants'

/**
 * Who is asking, as the outside services' usage policies ask to be told.
 *
 * Nominatim refuses to be called by a stock HTTP library's `User-Agent`, and
 * OSRM asks for a valid one; the one React Native sends names the networking
 * stack rather than this app. A browser page cannot set this header and is
 * identified by its `Referer` instead; a phone has no `Referer`, so it says its
 * name. Read from the app's own config so a version bump or a new identifier
 * cannot leave it stale.
 *
 * Here rather than beside place search, because routing sends it too.
 */
export const USER_AGENT = `Pinpoint/${Constants.expoConfig?.version ?? '0'} (${
  Constants.expoConfig?.ios?.bundleIdentifier ??
  Constants.expoConfig?.android?.package ??
  'pinpoint'
})`
