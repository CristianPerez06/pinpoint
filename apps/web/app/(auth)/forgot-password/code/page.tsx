import { message } from '@pinpoint/wording'
import { redirect } from 'next/navigation'

import { redirectIfAuthenticated } from '@/lib/auth/guards'
import { serverSay } from '@/lib/language'

import { AuthCard } from '../../_components/auth-card'
import { CodeForm } from './code-form'

/**
 * Enter the emailed code.
 *
 * Reached from the request screen with the address in the query string. Without
 * one there is nothing to check a code against, so it goes back a step rather
 * than drawing a form that cannot succeed.
 */
export default async function ResetCodePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  await redirectIfAuthenticated()
  const { email } = await searchParams
  if (!email) redirect('/forgot-password')
  const say = await serverSay()

  return (
    <AuthCard
      brand={say(message('app.name'))}
      title={say(message('reset.codeTitle'))}
      subtitle={say(message('reset.codeSent', { email }))}
    >
      <CodeForm email={email} />
    </AuthCard>
  )
}
