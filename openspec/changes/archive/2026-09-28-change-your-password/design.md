## Context

#226 left the building blocks: `newPasswordShape` and `refusal` in `@pinpoint/core`,
`AuthOutcome` and `setNewPassword` in `@pinpoint/auth`, and a `NewPasswordForm` on each app,
built to be reused here. It also left one per-app setting that hides "Forgot password?" until
an email service is connected.

## Decisions

**Checking the current password is a sign-in.** `changePassword` reads the account's address
with `getUser()`, then calls `signInWithPassword` with that address and the current password.
`invalid_credentials` becomes a field error on `currentPassword` (`password.currentWrong`), not
a form error, because the spec asks each failure to name its field. Then it calls
`updateUser({ password })`, then `signOut({ scope: 'others' })`. That last call ends every
session except this one, including the session the check just replaced.
Supabase's own `current_password` option on `updateUser` is not used. It only works with a
project-wide setting (`UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD`), and nobody here has
checked whether that setting also blocks the reset, which changes a password with no current
one. A failure of the final `signOut` is swallowed: the password has changed, and reporting
the change as failed would be the bigger lie.

**One setting for both.** `passwordReset` becomes `passwordChanges`
(`NEXT_PUBLIC_PASSWORD_CHANGES` / `EXPO_PUBLIC_PASSWORD_CHANGES`). The spec ties the change
control to the reset being offered, and one setting makes it impossible to switch on one
without the other. Nothing live has the old name set, since it is off everywhere, so
renaming costs nothing.

**The form.** Each app's `NewPasswordForm` gains `askCurrent`, which draws a
current-password field above the other two. On the laptop the settings form uses a server
action that returns a notice instead of redirecting. On the phone, `onSucceeded` lets settings
close the form and show the notice. The phone's settings screen gets the same bare
`KeyboardAvoidingView` the auth screens use, so three fields stay reachable with the keyboard
up.
