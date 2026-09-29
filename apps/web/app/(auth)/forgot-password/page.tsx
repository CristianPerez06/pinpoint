import { message } from '@pinpoint/wording'

import { redirectIfAuthenticated } from '@/lib/auth/guards'
import { serverSay } from '@/lib/language'

import { AuthCard } from '../_components/auth-card'
import { RequestForm } from './request-form'

export default async function ForgotPasswordPage() {
  await redirectIfAuthenticated()
  const say = await serverSay()

  return (
    <AuthCard
      brand={say(message('app.name'))}
      title={say(message('reset.title'))}
      subtitle={say(message('reset.intro'))}
    >
      <RequestForm />
    </AuthCard>
  )
}
