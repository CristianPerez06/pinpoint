import { Stack } from 'expo-router'

import { SessionProvider } from '@/lib/session'

// No styling by design — see openspec/specs/styling.
export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack />
    </SessionProvider>
  )
}
