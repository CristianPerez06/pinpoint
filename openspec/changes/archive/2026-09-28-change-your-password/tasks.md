## 1. Rules and operation

- [x] 1.1 Add `changePasswordSchema` to `packages/core/src/auth.ts` (`currentPassword` refused as `password.currentMissing`, plus `newPasswordShape` and the match). Export it and its type. Verify with tests in `auth.test.ts`.
- [x] 1.2 Add `changePassword` to `packages/auth/src/operations.ts`: validate, `getUser`, check with `signInWithPassword` (wrong → field error `password.currentWrong`), `updateUser`, then `signOut({ scope: 'others' })`. Verify with tests in `operations.test.ts`: invalid input calls nothing, a wrong current password changes nothing, and success signs out only the other sessions.

## 2. Words

- [x] 2.1 Add `password.currentMissing`, `password.currentWrong`, `changePassword.open`, `changePassword.note`, `changePassword.current` and `changePassword.done` in English and Spanish (impersonal). Update the snapshot. Verify with `pnpm check:wording`.

## 3. The setting

- [x] 3.1 Rename `passwordReset` to `passwordChanges` (`*_PASSWORD_CHANGES`) in both config modules and `.env.example` files, and in sign-in. Verify with typecheck and lint.

## 4. The laptop

- [x] 4.1 Give `NewPasswordForm` an `askCurrent` field and a notice. Add `changePasswordAction`, and a `ChangePassword` control under the account row in settings, shown only when the setting is on.

## 5. The phone

- [x] 5.1 Give the phone's `NewPasswordForm` `askCurrent` and `onSucceeded`. Add a `ChangePassword` control under the account card in `settings.tsx`, shown only when the setting is on, and put the screen in a bare `KeyboardAvoidingView`.

## 6. Checking it

- [x] 6.1 `pnpm verify` passes (bar the archive check before archiving) and `openspec validate change-your-password --strict` passes.
- [x] 6.2 On the laptop against the local stack, in both languages and themes:
  - A wrong current password.
  - Rule failures.
  - A successful change keeping this session.
  - Another session of the same account ended.
  - The new password working and the old one refused.
  - The control hidden with the setting off.
- [x] 6.3 The same on the phone, with the keyboard up. Also a change on the phone signing out the laptop.
