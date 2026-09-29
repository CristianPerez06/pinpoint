## Why

Somebody who forgets their password is locked out of Pinpoint, and the only way back in
today is a manual reset in the Supabase dashboard by whoever has access to it (#226).
That works between two people who know each other. It stops working with invitations,
because an invited person has no relationship with whoever holds the dashboard.

## What Changes

- Sign-in on both the laptop and the phone gets a **`Forgot password?`** link.
- It opens a screen asking for the email address. Sending it always goes on to the next
  screen, whether or not an account exists for that address, so the screen never reveals
  who has an account.
- An email arrives with a **6-digit code**. It's in **Spanish only** for now.
- The next screen asks for that code. A wrong or expired code says so. **`Send it again`**
  unlocks 60 seconds after the last code was sent.
- The right code opens a screen to choose a new password, typed twice. It uses the same
  rules and the same messages as creating an account.
- After saving, the person is signed out and lands on sign-in with a note saying the
  password was updated. They sign in with the new one, and the old one no longer works.
  This matches what Grana does.
- The new-password screen only opens after entering a code. Reaching it any other way,
  for instance from an old bookmark, shows a screen saying so, with a way to start again.
- Every submit button says what it's doing and can't be pressed twice. The screens work
  in both themes, and on the phone they work with the keyboard up.
- Every sentence on these screens is in English and Spanish.

Not being done:
- **No email service.** Supabase's built-in one sends only to members of the project's
  team, at 2 emails an hour. That's enough to build and test with, but not enough for
  real users. Setting up Resend, emails in each person's own language, and checking that
  the email reaches someone outside the team all move to #78.
- **No link in the email.** The code is typed into the app, so the phone needs no link
  that opens the app.
- **No password change while signed in.** That's #49, which will reuse the new-password
  form built here.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `auth`: a new requirement for resetting a forgotten password with an emailed code:
  asking for the code without revealing who has an account, entering it, choosing a new
  password under the sign-up rules, and landing back on sign-in. It also covers the
  new-password screen refusing anyone who didn't enter a code.
- `product-wording`: the rule that says what is not a named sentence (what a person
  typed, the map's attribution) gains the reset email. It's written into Supabase's
  template in Spanish only, until #78.

## Impact

- `@pinpoint/core`: the rules for the email, code and new-password forms. The new
  password reuses the sign-up rules. The code length and the 60-second wait are defined
  once for both apps.
- `@pinpoint/auth`: four shared operations. They ask for a code, check it, save the new
  password, and tell whether the current session came from a code.
- `@pinpoint/supabase`: names for two more failures: a wrong or expired code, and a new
  password identical to the old one.
- `@pinpoint/wording`: the sentences for three screens and the sign-in note, in both
  languages.
- `apps/web`: three new screens under `/forgot-password`, plus the link and note on
  sign-in.
- `apps/mobile`: three new screens, plus the link and note on sign-in.
- `supabase/config.toml` and `supabase/templates/`: Grana's two emails (reset password, and
  confirm sign-up, which stays unused while confirmations are off), in Spanish, with the
  code, in Pinpoint's colours. The same templates, subjects and 6-digit length have to be
  set by hand in the hosted project's dashboard.
- No database change.
