## Context

Sign-in and sign-up already follow a single shape. `@pinpoint/core` validates the input,
`@pinpoint/auth` takes a client and returns an `AuthOutcome`, `@pinpoint/supabase` turns
a Supabase error code into an `AuthFailure`, and each app only collects input and draws the
outcome. The laptop's forms are server actions (`app/_actions/auth.ts`) over a
cookie-backed client. The phone calls the same operations with its own client, and
`SessionProvider` follows the session through `onAuthStateChange`.

The reset follows `grana-v3`: `resetPasswordForEmail` sends a code (the template shows
`{{ .Token }}` and no link), `verifyOtp({ type: 'recovery' })` establishes a session, and
`updateUser({ password })` then `signOut()` finishes it. We follow Grana's shape, not its
files.

## Goals / Non-Goals

**Goals:** reset works the same on both apps through shared operations; the new-password
screen can tell a code session from any other session; the "new password, twice" form can
be reused by #49.

**Non-Goals:** an email service, localised email, email styling (#78); changing the
password while signed in (#49).

## Decisions

**Four operations in `@pinpoint/auth`, in the existing shape.**
- `requestPasswordReset(client, { email })` validates and calls `resetPasswordForEmail`.
  It returns `succeeded` for any address. Supabase already answers the same for an
  unknown one, and an error from it (a rate limit, a mail failure) says nothing about
  whether the account exists, so it is surfaced as usual.
- `verifyResetCode(client, { email, code })` calls `verifyOtp` with `type: 'recovery'`,
  then `claimTripMemberships`, the way `signIn` does. The spec calls a verified code an
  authentication, and leaving the claim to each app is the arrangement `signIn`'s comment
  warns about.
- `setNewPassword(client, { password, confirmPassword })` validates, calls `updateUser`,
  then `signOut`.
- `isResetSession(client)` asks `client.auth.getClaims()` and answers whether `amr`
  contains `otp`. `getClaims` verifies the token (supabase-js 2.111 has it), so neither
  app decodes a JWT by hand the way Grana's two copies of `hasRecoveryClaim` do. This
  product signs in with nothing else that produces `otp`, so `otp` means "came from a
  code".

**Schemas in `@pinpoint/core`.** `resetRequestSchema` (email), `resetCodeSchema` (email
plus exactly `RESET_CODE_LENGTH` digits), and `newPasswordSchema`. The last one is the
`password` / `confirmPassword` part of `signUpSchema`, lifted into its own object so that
sign-up is built from it and cannot drift from it. `RESET_CODE_LENGTH = 6` and
`RESEND_CODE_AFTER_SECONDS = 60` live beside `MIN_PASSWORD_LENGTH`, with a comment naming
the Supabase setting each one has to match.

**Two new failures.** `otp_expired` becomes `code-invalid`, one name for wrong, expired
and used, as the spec asks. `same_password` becomes `same-password`. Everything else goes
through the existing mapping, which already covers `over_email_send_rate_limit` and
`weak_password`.

**Laptop routes.** `/forgot-password` asks for the email, `/forgot-password/code?email=…`
takes the code, and `/forgot-password/new` sets the password. The first two call
`redirectIfAuthenticated()`. The code screen's action verifies and then `redirect`s to
`/forgot-password/new`, so the redirect guard on the screen it just left never runs
against the new session. `/forgot-password/new` is a server component that checks
`isResetSession` with the server client before it renders a form. Its action ends with
`redirect('/login?reset=done')`, and the sign-in page reads that parameter to show the
note. Keeping the email in the query string follows Grana. It is the address the person
just typed, on their own screen.

**Phone routes and the stack.** `forgot-password.tsx`, `reset-code.tsx` and
`new-password.tsx`, beside `login.tsx`. Sign-in **replaces** itself with
`forgot-password`, and each step replaces the one before, instead of pushing. This matters:
`login.tsx` redirects to `/` as soon as a session exists. If it were still mounted
underneath when the code is verified, it would pull the person off the new-password
screen into the app. The same concern means the code screen has no session redirect of its
own after it starts verifying: it guards on `session && !verifying`, the way sign-in
guards on `!submitting`. "Back to sign-in" replaces to `/login`, and success replaces to
`/login?reset=done`.

**One card for the phone's reset screens.** Sign-in and sign-up each carry the same
`KeyboardAvoidingView` / `ScrollView` / card layout, copied on purpose: `signup.tsx`
records the decision to keep the pair copied, so that either can change without reading
the other. That decision stands. The three reset screens are a set of their own, so they
share one copy in `components/auth-screen.tsx` (wordmark, title, subtitle, form error,
children), keeping the keyboard comments. That makes one more copy of the layout instead
of three.

**The reusable form.** `NewPasswordForm` on each app takes the action or submit function
and the labels. #49 can then mount it with its own operation.

**The emails.** Copied from `grana-v3`'s `supabase/templates/`: `reset-password.html`,
and `confirm-signup.html` beside it, with the same structure and the Spanish made
impersonal. They're drawn in the light theme's colours from `@pinpoint/tokens`, written
in as literals because email can't read custom properties. `config.toml` wires both.
The confirmation email is dormant: confirmations are off, and no screen accepts its
code. The hosted project doesn't read `config.toml`, so each subject and body, and the
OTP length, are pasted into the dashboard by hand. That is a task, done by the user.

**The link is behind a setting until Resend.** New free projects on Supabase's built-in
email can't edit their templates (June 2026), so the live reset email carries a link and
no code. The user's decision: test locally, and hide the link on the live apps until
Resend is connected (#78). Each app's config module gains one optional publishable flag,
`NEXT_PUBLIC_PASSWORD_RESET` / `EXPO_PUBLIC_PASSWORD_RESET`, which is on only when set to
`on`. Sign-in draws the link only then. The screens themselves stay reachable by address,
because hiding the way in is enough and #78 then only has to set the flag.

## Risks / Trade-offs

- [The hosted project's OTP length isn't 6 (Grana's is 8)] → a code the form refuses as
  too long. The task that sets the template also checks the length, and the form's
  length comes from one constant.
- [Supabase's built-in email allows 2 an hour on the hosted project] → `Send it again`
  can reach the limit while testing there. It shows `auth.rateLimited`, which is
  accurate. Local testing goes through the local inbox, where the limit doesn't apply.
- [A person who verifies a code and then leaves stays signed in without a new password]
  → accepted. They proved they read the email, which is the same proof the reset asks
  for, and the claim already ran.
- [The phone's stack order is easy to break later] → the replace-not-push rule is written
  in a comment on sign-in's link, and checking it on the running app is a task.
