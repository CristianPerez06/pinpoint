## 1. Rules and failures

- [x] 1.1 In `packages/core/src/auth.ts`, lift `password` / `confirmPassword` and the match into `newPasswordSchema`, and build `signUpSchema` from it. Add `resetRequestSchema` (email), `resetCodeSchema` (email plus exactly `RESET_CODE_LENGTH` digits, refused as `code.invalidFormat`), `RESET_CODE_LENGTH = 6` and `RESEND_CODE_AFTER_SECONDS = 60`, each commented with the Supabase setting it must match. Export them. Verify with tests in `auth.test.ts`: sign-up still refuses what it refused before, a 5-digit or lettered code is refused, and `newPasswordSchema` reports a mismatch on `confirmPassword`.
- [x] 1.2 In `packages/supabase/src/auth-errors.ts`, add `code-invalid` (from `otp_expired`) and `same-password` (from `same_password`) to `AUTH_FAILURES`, `BY_CODE` and `BY_FAILURE`. Verify with `auth-errors.test.ts`.

## 2. Shared operations

- [x] 2.1 Add `requestPasswordReset`, `verifyResetCode` (calls `claimTripMemberships` on success), `setNewPassword` (update, then sign out) and `isResetSession` (`getClaims`, `amr` contains `otp`) to `packages/auth/src/operations.ts`. Export them from `index.ts`. Verify with tests in `operations.test.ts` using the existing fake client: invalid input never calls the service, the code check claims only on success, `setNewPassword` signs out only after a successful update, and `isResetSession` is false for a `password` session and for no session.

## 3. Words

- [x] 3.1 Add the names for the three screens, the sign-in link, the `Password updated` note, `Send it again` with its countdown, the invalid-link screen, `code.invalidFormat`, `auth.codeInvalid` and `auth.samePassword`, in `packages/wording/src/english.ts` and `spanish.ts` (Spanish impersonal). Update the `say.test.ts` snapshot. Verify with `pnpm check:wording`.
- [x] 3.2 In `AGENTS.md` § Words, add the auth email to what is **not** in `@pinpoint/wording`, pointing at #78. Verify the sentence matches the `product-wording` delta.

## 4. The email

- [x] 4.1 Copy `grana-v3`'s `reset-password.html` and `confirm-signup.html` into `supabase/templates/`: the same structure, impersonal Spanish, 6 digits, and the light theme's colours from `@pinpoint/tokens`. Wire both into `supabase/config.toml` (the confirmation stays dormant). Verify by reading the reset email when it arrives in 8.2.
- [x] 4.2 **Done by the user:** in the hosted project's dashboard, set the email OTP length to 6. The templates can't be edited there until an email service is connected (#78), which is why the link is hidden below. Verify the setting is saved.

## 5. The laptop

- [x] 5.1 Add `requestPasswordResetAction`, `verifyResetCodeAction` and `setNewPasswordAction` to `apps/web/app/_actions/auth.ts`, in the shape of `signInAction`. The code action redirects to `/forgot-password/new`, and the password action redirects to `/login?reset=done`.
- [x] 5.2 Add `/forgot-password` (email) and `/forgot-password/code` (code plus `Send it again` with its countdown), both behind `redirectIfAuthenticated()`, drawn with `auth.module.css`. Each has a link back to sign-in.
- [x] 5.3 Add `/forgot-password/new`: a server component that checks `isResetSession` with the server client and draws either `NewPasswordForm` or the "start again" screen. Build `NewPasswordForm` as its own component taking the action, so #49 can reuse it.
- [x] 5.4 On sign-in, add the `Forgot password?` link, and the `Password updated` note when `reset=done` is present.

## 6. The phone

- [x] 6.1 Add `components/auth-screen.tsx` for the three reset screens, carrying sign-in's card and keyboard layout and its comments. Leave `login.tsx` and `signup.tsx` on their own copies, as `signup.tsx` records. Verify by checking the reset screens with the keyboard up in 8.3.
- [x] 6.2 Add `app/forgot-password.tsx`, `app/reset-code.tsx` (with `Send it again` and its countdown) and `app/new-password.tsx` on `AuthScreen`. Each step `router.replace`s to the next, and "back to sign-in" replaces to `/login`. The code screen redirects on a session only when not verifying. The new-password screen checks `isResetSession` and draws `NewPasswordForm` or the "start again" screen.
- [x] 6.3 On sign-in, add a `Forgot password?` link that **replaces** sign-in (with the comment saying why), and the `Password updated` note from the `reset` param.

## 7. Hidden until Resend

- [x] 7.1 Add an optional `passwordReset` flag to `apps/web/lib/config.ts` (`NEXT_PUBLIC_PASSWORD_RESET`) and `apps/mobile/lib/config.ts` (`EXPO_PUBLIC_PASSWORD_RESET`), on only when set to `on`, and document it in each `.env.example`. Sign-in draws `Forgot password?` only when it is on. Verify the link is gone with the flag unset and present with it set.

## 8. Checking it

- [x] 8.1 `pnpm lint` and `pnpm verify` pass, and `openspec validate reset-a-forgotten-password --strict` passes.
- [x] 8.2 In the running laptop app, against the local stack, in English and Spanish, on both themes, walk every scenario in the `auth` delta:
  - The link from sign-in, and back.
  - A registered and an unknown address look identical.
  - A malformed address.
  - A wrong code.
  - `Send it again` counting down and then sending.
  - The right code landing on the new password.
  - Rule failures in sign-up's words.
  - Saving, landing on sign-in with the note, the new password working and the old one refused.
  - `/forgot-password/new` opened directly when signed out and when signed in with a password.
  - A signed-in visit to `/forgot-password`.
  - Buttons that say what they are doing and can't be pressed twice.
- [x] 8.3 The same walk in the running phone app. In addition:
  - Entering the code does **not** jump into the app. The new-password screen stays.
  - Each screen works with the keyboard up on a small phone.
  - A person invited while locked out sees the trip after resetting.
- [x] 8.4 On the laptop, reset a password that was set on the phone, and the other way round. Verify the new password signs in on both apps.
