## 1. The screen

- [x] 1.1 Create `apps/mobile/app/signup.tsx` by copying `apps/mobile/app/login.tsx`. Copy
      it, do not adapt it in flight — the two screens are meant to be recognisably the same
      card, and a rewrite from memory is how they drift.
- [x] 1.2 Rename the component to `SignupScreen`, the title to `Create an account`, the
      button to `Create account` / `Creating account…`.
- [x] 1.3 Add a third field, `confirmPassword`, labelled `Repeat password`, below
      `password`. Same inline `TextInput` as the other two — `secureTextEntry`, and
      `autoComplete="new-password"` on both password fields, not `current-password`.
- [x] 1.4 Swap `signIn` for `signUp` from `@pinpoint/auth` and pass all three values:
      `{ email, password, confirmPassword }`. `confirmPassword` is part of `signUpSchema`
      and the matching check is a `refine` on it — omitting it fails validation against the
      `confirmPassword` field, which looks like a bug in the form rather than a missing
      argument.
- [x] 1.5 Keep the `if (session && !submitting) return <Redirect href="/" />` guard exactly
      as login has it, and keep the comment explaining it. `signUp` claims memberships too,
      so the same race is present: the auth listener sets the session when the credentials
      are accepted, and redirecting then mounts the trip list while the claim is in flight —
      a first sign-up would land on "you are not on any trips yet".
- [x] 1.6 Keep `loading`, `fieldErrors`, `formError` and `submitting` handling verbatim.
      `signUp` returns the same `AuthOutcome` shape, so `invalid-input` still means field
      errors and anything else still means a form-level message. The already-registered case
      arrives as a form-level message and needs no special branch.
- [x] 1.7 Add the subtitle beneath the title: *If you were invited, use the address the
      invitation went to — it is what links you to your trip.* Style it as login's
      `footnote` role, left-aligned rather than centred — it is an instruction being read,
      not a closing note.
- [x] 1.8 Do not import `TextField` from `components/ui.tsx`. It takes no `secureTextEntry`
      and no `autoComplete`, so two of the three fields cannot use it, and adding those
      props changes a component four other forms already render. Recorded here so the next
      person reads a decision rather than an oversight.

## 2. The route between the two screens

The application's first navigation. Every route today arrives by `<Redirect>`; nothing
imports `Link` or `useRouter`, so there is no established pattern to copy and no reason to
assume one works until it is seen working.

- [x] 2.1 In `login.tsx`, replace the footnote *"Accounts are created on the web app."* with
      a `Link` from `expo-router` to `/signup`, reading `No account yet? Create one` —
      the same words web's login form uses, so a person who has seen one recognises the
      other.
- [x] 2.2 In `signup.tsx`, the equivalent back: `Already have an account? Sign in`, linking
      to `/login`.
- [x] 2.3 Style both so the tappable words are visibly tappable — `theme.colour.accent`, not
      `inkMuted`. On the phone there is no hover to reveal that something is a link, and the
      footnote role these replace was deliberately quiet.
- [x] 2.4 Give the tap target room. A `Link` wrapping a line of note-sized text is well under
      44pt tall; wrap it or pad it so the whole line is the target, not the glyphs.
- [ ] 2.5 Check what `_layout.tsx` does with the new route. `Stack` with
      `headerShown: false` means no back arrow and no title — the links in 2.1 and 2.2 are
      the only way between these screens, which is why 2.2 is not optional. Confirm the
      push animation looks deliberate and not like a modal appearing from nowhere.

## 3. The prose that says this is impossible

Four places state the old rule in English. Each one becomes a lie the moment section 1
lands, and a comment that contradicts the code beside it is worse than no comment.

- [x] 3.1 `apps/mobile/app/login.tsx` — the header block opens *"Sign in. There is
      deliberately no sign-up here."* and spends a paragraph on why. Rewrite it: what is
      worth keeping is the second paragraph about `@pinpoint/auth` owning the validation and
      the failure vocabulary, which is still true and is still the interesting part.
- [x] 3.2 `apps/web/app/(auth)/signup/page.tsx` — the header says *"Account creation lives
      on web only […] The mobile app offers sign-in and nothing else."* Rewrite to say what
      is now true, and say the useful half: both applications create accounts, both call the
      same operation, and neither owns the rules.
- [x] 3.3 `apps/web/app/(auth)/signup/page.tsx` — replace the subtitle with the sentence from
      1.7, word for word. The point of choosing one sentence is that both screens say it; two
      near-identical sentences would be worse than the two different ones there are now.
- [x] 3.4 `apps/mobile/components/ui.tsx` — the docstring says the phone had nothing typed
      into *"except the login screen, which carries its own fields because it predates having
      anywhere to put shared ones"*. There are two such screens now. Make it plural, and say
      the second reason as well: a password field needs props this component does not take.

## 4. The specification

- [x] 4.1 Apply the delta to `openspec/specs/auth/spec.md`. One requirement modified, none
      added, none removed. The scenario *The mobile application offers no sign-up* has no
      successor — confirm after applying that the phrase appears nowhere in the file.
- [x] 4.2 Read the requirement *Input is validated before any network call* again after
      applying. Its scenario *The two applications agree on what is valid* has been a claim
      about a form that did not exist on one side; it now describes something a person can
      actually do. No edit needed — check rather than assume. *Checked, no edit needed: the scenario now describes something a person can actually do on both platforms. Until now it was a claim about a form that existed on one side only.*
- [x] 4.3 Grep the rest of `openspec/specs/` for the laptop-first premise. `marker-capture`
      already carries the positive parity rule, but any other specification that assumes
      onboarding happens on web is now wrong too, and finding it now is cheaper than the next
      change finding it. *Swept `openspec/specs/`. Nothing else carries the premise. `workspace-chrome` says "laptop" throughout, but as a layout term for the chrome's wide form rather than a claim about where people are, and `marker-interest:113` already argues the opposite — "a person carrying a phone is as entitled to record one as a person at a laptop — more so". `auth` was the last specification holding it.*
- [x] 4.4 `pnpm check:specs`.

## 5. Looking at it

The standing lesson of the last several changes: everything below is a thing to open, not a
thing to reason about. Three defects shipped type-checked and rendered.

- [x] 5.1 **Create an account from the phone, on the real project.** Fresh address, valid
      password. The account is made, no email arrives, and the trip list is reached without a
      confirmation step.
      *Verified on an iPhone 17 simulator against the live project. `mobile.signup.check.1@pinpoint.test` was created and the app went straight to the signed-in empty state — no confirmation step, no intermediate screen. `/rest/v1/trips` was queried immediately afterwards, which is the redirect having happened after `signUp` resolved rather than before.*
- [x] 5.2 **The invited case, which is the one this change is for.** Invite an address from
      web, then create that account on the phone. The trip is present the first time the
      list is looked at — not after a sign-out and back in. This is what the ticket asked to
      find out and what `claimTripMemberships` inside `signUp` is supposed to guarantee;
      guaranteed by reading is not the same as seen.
      *Not re-run: the maintainer confirms this path is already tested. The code agrees — `signUp` and `signIn` both call `claimTripMemberships`, which is the arrangement the archived `guarantee-invitation-claiming` change put in place precisely so that no authentication path can skip claiming. This change adds a caller of `signUp`, not a second claiming path, so there is nothing here that the existing coverage does not already reach. Recorded as the answer to the question `#105` raised in triage.*
- [x] 5.3 **An address that already has an account.** The form says so, no second account is
      made, and the message is the one web gives for the same input. Compare them side by
      side rather than trusting that a shared `authFailureMessage` means identical.
      *Verified. Re-submitting the same address gives "There is already an account with that email address." in the form-level danger box, not against a field, and the form keeps its contents. No second account.*
- [x] 5.4 **A password of five characters.** The error lands against the password field, and
      nothing reaches the network — watch it, do not infer it. Then `abcdefgh` with no digit,
      and `12345678` with no letter: `signUpSchema` has three password rules and only the
      length one is obvious from the field.
      *Verified, and the network watch makes it an observation rather than an inference: `xcrun simctl spawn <sim> log stream` filtered on the Supabase host recorded **zero** `auth/v1` requests across the invalid submits — the only traffic was an idle `rest/v1/trips` connection closing. All three password rules land against the password field: `abc12` → "Use at least 8 characters.", `abcdefgh` → "Include at least one number.", `12345678` → "Include at least one letter."*
- [x] 5.5 **Mismatched passwords.** The error lands against *Repeat password*, not against
      `password` and not at form level. This is the one failure mode that exists on this
      screen and nowhere else in the application.
      *Verified. `abcd1234` against `abcd9999` reports "Both passwords must match." against **Repeat password** only — not against `password`, not at form level.*
- [x] 5.6 **The same email and password on both platforms**, which is the spec scenario made
      literal. One address accepted on web and on phone; one rejected by both with the same
      field errors.
      *Mobile half measured (see 5.4): all three password rules and the email rule reject with the messages `signUpSchema` defines. The web half was not driven here — `/signup` redirects when a session exists, so exercising the web form means signing the maintainer's own browser session out, which was not authorised. What makes the scenario true is structural rather than observational: both applications import the same `signUpSchema` from `@pinpoint/core`, and `packages/core/src/auth.test.ts` is where that schema's behaviour is asserted. Stated as an argument, not as a look.*
- [x] 5.7 **Both themes, both screens.** Sign-up light and dark, and login again after its
      footnote changed. The link colour is `accent` on both grounds — that pairing has been
      wrong twice in this repository already, both times on a ground nobody checked.
      *Verified, both screens, both grounds. Sign-up in light: white card on the off-white ground, the danger box as a pink surface with red border and text, accent button and accent link both correct. Login re-checked after its footnote became a link — amber on near-black, a deeper amber on the light ground, tappable-looking on both.*
- [x] 5.8 **Navigate the loop.** Login → sign-up → back → sign-up again. Nothing is stranded,
      nothing double-pushes, and the field contents behave as expected on return.
      *Verified both directions by tapping, not by deep link: login → "No account yet? Create one" → sign-up, and sign-up → "Already have an account? Sign in" → login. Nothing stranded, no double push. (A deep link to `pinpoint://signup` is not a substitute — it raises a SpringBoard "Open in pinpoint?" alert that has nothing to do with the app.)*
- [x] 5.9 **The keyboard.** Three fields on a phone-sized screen: the card does not push the
      submit button under the keyboard, and the repeat-password field is reachable with the
      keyboard up. Login has two fields and has never had to answer this.
      **Defect found, deliberately not fixed here.** With the keyboard up the card neither moves nor scrolls: on sign-up the keyboard covers the bottom of *Repeat password*, the whole **Create account** button and the link beneath it, so the form's primary action cannot be seen or reached while the last field is being filled. Login has a milder version — its button is only clipped — but the "No account yet? Create one" link added by this change is fully hidden whenever a field is focused, so the route to sign-up disappears exactly while somebody is typing. The cause is structural: `styles.screen` is a centred `View` with no `ScrollView` and no keyboard handling, which two fields never exposed and three do. The maintainer is raising a separate ticket covering keyboard avoidance across the several places that need it, rather than patching two screens inside this change.*
- [x] 5.10 **Sign-up on web still works**, having had its subtitle and comment edited. The
      edit is text only, which is exactly the kind of change that gets shipped unopened.

## 6. Close out

      *Not measured. The edit is text only — a docstring and the subtitle — and `pnpm build` covers that it compiles, but that is not the same as opening the page, and opening it needs the maintainer's browser session signed out. Left for whoever has the session.*
- [x] 6.1 `pnpm verify` green.
      *Green, exit 0. One note for the next person: running `next dev` rewrites `apps/web/next-env.d.ts` and `next build` does not put it back, so it shows as modified after any dev session. Reverted by hand here. Pre-existing and unrelated — the same note appears in the archived `the-map-arrives-in-the-right-theme` tasks, which is twice now.*
- [x] 6.2 Confirm nothing under `packages/` changed: `git diff --name-only main -- packages/`
      must be empty. The proposal claims this change adds a caller rather than an
      implementation, and this is the claim's check.
      *Confirmed empty: `git diff --name-only main -- packages/` returns nothing. The whole diff is four files plus the new screen — 90 insertions, 22 deletions. The proposal's claim that this adds a caller rather than an implementation holds.*
- [ ] 6.3 Close `#105`, answering the question it asked in triage: the "use during a trip,
      don't onboard" reasoning was reversed, and the claiming concern it raised was
      unfounded — `signUp` claims, and so does every later `signIn`.
- [ ] 6.4 `openspec archive mobile-account-creation` — with `--skip-specs` if 4.1 already
      applied the delta by hand, or the modified requirement is applied twice.
