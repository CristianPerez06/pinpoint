import { resolveTheme, type Theme, type ThemeMode } from '@pinpoint/tokens'
import { useColorScheme } from 'react-native'

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
  // `useColorScheme` answers null while the system preference is unknown —
  // briefly at launch, and permanently on a device with no preference set.
  // Light is the right answer to "no opinion".
  return useColorScheme() === 'dark' ? 'dark' : 'light'
}

export function useTheme(): Theme {
  return resolveTheme(useThemeMode())
}
