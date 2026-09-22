import { message } from '@pinpoint/wording'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { requireUser } from '@/lib/auth/guards'
import { serverSay } from '@/lib/language'

import { AccountRow, SettingsScreen } from './settings-screen'

export async function generateMetadata(): Promise<Metadata> {
  const say = await serverSay()
  return { title: say(message('settings.documentTitle')) }
}

/**
 * Settings, drawn at once, with the address streamed in where it goes.
 *
 * The page does not wait for the account. Only the account's row does, behind
 * its own boundary, and everything around it — the way back and the choice of
 * appearance and of language — is on the first paint and live from it.
 *
 * Deliberately not a `loading.tsx`. A route's loading file is a fallback for the
 * whole page, and on a full load React does not attach behaviour to a fallback
 * whose boundary is still waiting: its controls would be drawn, look usable, and
 * do nothing, without saying so. A boundary around the one part that waits keeps
 * the rest of the screen outside it, so the rest of the screen works.
 *
 * `requireUser` still turns a signed-out visitor away, from inside the row: they
 * see this screen's frame for as long as the check takes, then the sign-in page.
 */
export default function SettingsPage() {
  return (
    <SettingsScreen
      accountRow={
        <Suspense fallback={<AccountRow account={null} />}>
          <SignedInAccountRow />
        </Suspense>
      }
    />
  )
}

async function SignedInAccountRow() {
  const user = await requireUser()
  return <AccountRow account={{ email: user.email ?? null }} />
}
