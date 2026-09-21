## Why

`#105`: somebody installs the phone application, has no account, and the only screen they
can reach says *"Accounts are created on the web app."* There is nowhere to go. They have
to find a laptop, or be told to.

**The absence is specified, not accidental.** `openspec/specs/auth/spec.md` says
`SHALL NOT`, with a reason attached: *accounts are created once, and the mobile application
exists to be used during a trip rather than to onboard*. Three files repeat the same
sentence in prose. So this is not a missing feature that nobody got to; it is a decision,
and the change is the decision being reversed. The maintainer has reversed it.

**The same reversal has already happened once in this repository, on the same argument.**
`2026-08-21-mobile-capture` deleted *"Capture is offered by the web application only"* and
recorded why:

> The asymmetry was justified on the grounds that planning happens at a laptop […] The
> first half was never tested […] The second half was tested by the mobile interest change
> and came back cheaper than claimed.

Both halves hold again here, and the second is stronger than it was there. `marker-capture`
went on to state the rule positively — *"An application SHALL NOT be the only place a
capability of this specification can be exercised. Either application SHALL be sufficient
on its own"* — and that rule binds `marker-capture` only. Auth is the last specification
that still carries the laptop-first premise, and sign-up is the last thing the phone cannot
do.

**Cheaper than that one, because nothing below the screen has to be built.** `signUp` in
`packages/auth/src/operations.ts` already validates against the shared `signUpSchema`,
already handles the duplicate-address case, and already claims pending invitations. It
takes a client as its argument precisely so either application can call it. The mobile app
constructs the client it needs and calls `signIn` with it today. This change adds a second
caller, not a second implementation — no file under `packages/` changes.

**The ticket's open question is answered, and the answer is that there is no hole.** It
asks whether an account created on the phone could end up unable to claim an invitation.
It cannot: `claimTripMemberships` runs inside `signUp` *and* inside `signIn`
(`packages/auth/src/operations.ts`), which is the fix the archived
`guarantee-invitation-claiming` change made after exactly that defect shipped. A phone-made
account claims at creation, and again at every later sign-in. The invited person is in fact
the case this change serves best — the invitation arrives on a phone.

## What Changes

- **A sign-up screen on the phone**, `apps/mobile/app/signup.tsx`: email, password, repeat
  password, submitting to `signUp` from `@pinpoint/auth`. It is a copy of `app/login.tsx`
  with a third field and a different call, including the `session && !submitting` guard —
  that hold exists because the auth listener sets the session the moment credentials are
  accepted, while the claim is still in flight, and sign-up claims for the same reason
  sign-in does.

- **A route between the two screens, in both directions.** The login screen's footnote
  *"Accounts are created on the web app."* becomes a link to sign-up; the sign-up screen
  carries one back. This is the application's first navigation of any kind — every route
  today arrives by `<Redirect>`, nothing imports `Link` or `useRouter`, and `_layout.tsx`
  sets `headerShown: false`, so there is no system back arrow to fall back on. The link
  back is load-bearing, not symmetry.

- **One sentence about the address, on both platforms.** Web's sign-up page says *"Use the
  address you were invited at — it is what links you to your trip"*, which is written for
  an invited person and leaves somebody signing up cold wondering what invitation they
  missed. Both screens get: *"If you were invited, use the address the invitation went to —
  it is what links you to your trip."* The instruction that has consequences survives; the
  person it does not apply to reads the conditional and moves on.

- **The specification, and the prose that repeats it.** The requirement's second paragraph
  and the scenario *"The mobile application offers no sign-up"* both go. So do the three
  comments stating the rule in English — `apps/mobile/app/login.tsx`'s header, the same
  claim in `apps/web/app/(auth)/signup/page.tsx`, and the login footnote — plus a fourth
  that is collateral: `apps/mobile/components/ui.tsx` describes login as *"the login
  screen, which carries its own fields"*, which stops being singular.

- **What is deliberately not done.** Sign-up does not use `TextField` from
  `components/ui.tsx`, and does not extend it to fit: that component takes no
  `secureTextEntry` and no `autoComplete`, so a password field needs both added to a
  component four other forms already use. Login carries its own fields for the same reason
  it always has, and sign-up sits beside it carrying its own. Extracting the card chrome
  the two screens share is a refactor of two files that work, and is not this change.

- **No test.** `apps/mobile` has no test runner and no test file. The rule this screen
  enforces is `signUpSchema`, which is tested in `packages/core/src/auth.test.ts` — that is
  what makes "web and mobile agree on what is valid" true, and it is true before this
  change and unchanged by it. What is genuinely untested here is the screen, and testing a
  screen on this platform is a change of its own.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auth`: the requirement *A person creates an account with an email and a password*
  currently restricts account creation to web and asserts, in its own scenario, that no
  route creating an account exists on mobile. Both go. The delta replaces the restriction
  with the parity rule stated positively, and replaces the scenario with what the phone now
  does — including reaching sign-up from sign-in and returning, because with
  `headerShown: false` a screen with no way back is reachable and stranding.

## Impact

- `apps/mobile/app/signup.tsx` — new. The only new file.
- `apps/mobile/app/login.tsx` — footnote becomes a link; header comment rewritten. The
  screen's behaviour is otherwise untouched.
- `apps/mobile/components/ui.tsx` — one sentence in a docstring. No code.
- `apps/web/app/(auth)/signup/page.tsx` — subtitle replaced, header comment rewritten.
- `openspec/specs/auth/spec.md` — via the delta.
- No change to `packages/auth`, `packages/core`, `packages/supabase`, or any other package.
  `signUp` and `signUpSchema` are called as they stand. If this change touches a file under
  `packages/`, something has gone wrong.
- No new dependency. `expo-router` already ships `Link`; it has simply never been imported.
- Closes `#105`.
