import type { AuthOutcome } from '@pinpoint/auth'
import type { FieldErrors } from '@pinpoint/core'
import { authFailureMessage } from '@pinpoint/supabase'
import { message, type Message } from '@pinpoint/wording'
import { useState } from 'react'

import { AuthButton, AuthField } from '@/components/auth-screen'

/**
 * A new password, typed twice — and, when changing one, the current one first.
 *
 * Takes what to do with it rather than doing it, because it is drawn in two
 * places: at the end of a reset, and in settings, where a person who is signed
 * in changes theirs. The fields and their errors are the same both times; what
 * happens on submit is not, and only the change asks for the current password.
 *
 * The form-level refusal is handed up rather than drawn here, so the screen can
 * put it where every other screen's goes: above the form, under the title.
 */
export function NewPasswordForm({
  onSubmit,
  onRefused,
  askCurrent = false,
}: {
  onSubmit: (values: {
    currentPassword: string
    password: string
    confirmPassword: string
  }) => Promise<AuthOutcome>
  onRefused: (refusal: Message | null) => void
  askCurrent?: boolean
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    setFieldErrors({})
    onRefused(null)

    const outcome = await onSubmit({ currentPassword, password, confirmPassword })

    if (!outcome.ok) {
      if (outcome.kind === 'invalid-input') setFieldErrors(outcome.fieldErrors)
      else onRefused(authFailureMessage(outcome.failure))
      setSaving(false)
    }
    // On success `saving` stays on: the screen is about to be left, and a
    // button that came back to life for a moment would invite a second press.
  }

  return (
    <>
      {askCurrent ? (
        <AuthField
          label={message('changePassword.current')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoComplete="current-password"
          error={fieldErrors.currentPassword}
        />
      ) : null}
      <AuthField
        label={message('reset.newPassword')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        error={fieldErrors.password}
      />
      <AuthField
        label={message('auth.repeatPassword')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoComplete="new-password"
        error={fieldErrors.confirmPassword}
      />
      <AuthButton
        label={message('reset.save')}
        busyLabel={message('reset.saving')}
        busy={saving}
        onPress={submit}
      />
    </>
  )
}
