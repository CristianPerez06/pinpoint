import { FONT_FAMILY } from '@pinpoint/tokens'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { View } from 'react-native'

import { SessionProvider } from '@/lib/session'
import { useTheme } from '@/lib/theme'

/**
 * Nothing renders until the typeface has loaded.
 *
 * Not politeness. React Native resolves a font family at the moment a `Text`
 * mounts, and a family that is not registered yet falls back to the system face
 * — permanently, for that element. Rendering the app first and the font second
 * gives a screen where some text is Figtree and some is San Francisco, with no
 * error anywhere to say so.
 *
 * The key is the shared token rather than a literal, so the name this registers
 * under and the name every style asks for cannot drift apart. `pnpm check:fonts`
 * asserts the file itself is the family that token names.
 */
export default function RootLayout() {
  const [loaded, error] = useFonts({
    [FONT_FAMILY]: require('../assets/fonts/Figtree.ttf'),
  })

  if (!loaded && !error) return <Blank />

  return (
    <SessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider>
  )
}

/**
 * The ground, and nothing else.
 *
 * Deliberately not a spinner: this is a few frames at launch, and a spinner
 * that appears and vanishes reads as a stutter. Painting the theme's ground
 * makes the transition into the app invisible instead.
 *
 * `error` is treated as loaded above rather than blocking. A font that will not
 * load is a broken build, and refusing to render the app leaves somebody
 * staring at a blank screen with no way to find out why — the text renders in a
 * fallback face, which is wrong but usable, and the check in CI is what stops
 * it reaching anyone.
 */
function Blank() {
  const theme = useTheme()
  return <View style={{ flex: 1, backgroundColor: theme.colour.ground }} />
}
