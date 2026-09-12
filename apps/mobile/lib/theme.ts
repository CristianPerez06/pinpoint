import { resolveMode, resolveTheme, type Theme, type ThemeMode } from '@pinpoint/tokens'
import { useColorScheme } from 'react-native'

import { usePreferences } from '@/lib/preferences'

/**
 * Which ground this device is drawing on, and the literals for it.
 *
 * Web needs almost none of this: its representation is a stylesheet and the
 * cascade does the choosing, so components there never learn which theme is
 * active. React Native has no cascade — every colour is a value passed to a
 * style object — so on this platform the theme has to be a hook.
 *
 * That asymmetry is the `styling` spec working as intended rather than a gap:
 * the same token values, each platform applying them in its own idiom, and no
 * shared styling runtime between them.
 */
export function useThemeMode(): ThemeMode {
  const { theme } = usePreferences()

  // `useColorScheme` answers null while the system preference is unknown —
  // briefly at launch, and permanently on a device with no preference set.
  // Light is the right answer to "no opinion".
  const device: ThemeMode = useColorScheme() === 'dark' ? 'dark' : 'light'

  /*
   * The device is asked on every render even when the answer is about to be
   * discarded, because `useColorScheme` is a hook and cannot be called
   * conditionally. That is not waste worth avoiding: it also means the
   * subscription to the system appearance stays live while somebody is on a
   * forced ground, so switching back to "follow the device" is correct
   * immediately rather than on the next appearance change.
   */
  return resolveMode(theme, device)
}

export function useTheme(): Theme {
  return resolveTheme(useThemeMode())
}
