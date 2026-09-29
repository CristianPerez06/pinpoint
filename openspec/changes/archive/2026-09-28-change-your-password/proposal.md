## Why

A password set at sign-up can never be changed (#49). The forgotten-password reset (#226) is
now in place, so a signed-in person can be offered a change without the risk of locking
themselves out with no way back.

## What Changes

- Settings → **Account** gets a **`Change password`** control on the laptop and the phone.
  It opens a form under the address: current password, new password, and the new one
  typed again.
- A wrong current password, a new password that breaks the rules, and a mismatched
  repeat each say which one it was, in the same words as sign-up.
- Saving keeps the person signed in on the device they're using, signs them out
  everywhere else, and tells them so.
- The submit button says what it's doing and can't be pressed twice. The form works in both
  themes, and on the phone with the keyboard up.
- Every sentence is in English and Spanish.
- **Hidden on the live apps, like the reset.** The per-app setting that hides "Forgot
  password?" now covers both, and is renamed to `*_PASSWORD_CHANGES`. Offering a change
  where a forgotten password can't be reset would let someone lock themselves out for good.
  Switching both on comes with Resend, in its own ticket.

Not being done:
- No email telling the person their password changed.
- No change of email address.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `auth`: a new requirement for changing a password while signed in.

## Impact

- `@pinpoint/core`: `changePasswordSchema` (current password plus the shared new-password
  rules).
- `@pinpoint/auth`: `changePassword`. It re-checks the current password, saves the new one,
  and signs out the other devices.
- `@pinpoint/wording`: the control, the current-password field and its two refusals, and the
  confirmation, in both languages.
- `apps/web/app/settings` and `apps/mobile/app/settings.tsx`: the control and the form. Both
  reuse the new-password form from #226, with a current-password field added.
- `apps/*/lib/config.ts` and `.env.example`: the setting is renamed and covers both.
- No database change.
