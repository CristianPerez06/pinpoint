## Why

Changing the password on one device signs every other device out and says so — but a
phone only finds out when its access pass runs out, up to an hour later. Until then it
keeps showing the trips, so "Other devices were signed out" is false on a phone for up
to an hour (#230). People often change a password because a phone was lost or borrowed,
which is exactly when that hour matters.

## What Changes

- The phone asks whether its session is still good when it is opened, when it comes back
  to the front, and every 5 minutes while it is open.
- When the answer is that the session was ended, the phone goes to sign-in within those
  5 minutes.
- A phone that finds out this way forgets everything it kept, the same as pressing Sign
  out: the trips kept for use with no signal, the taps waiting to be sent, and which trip
  was open. Decided with the user: a phone cut off by a password change should not keep
  showing trips to whoever is holding it. The cost is that "visited" or "want to go" taps
  made with no signal and not yet sent are lost.
- No signal, or any answer other than "this session was ended", changes nothing: the
  person stays signed in and nothing is forgotten.

Not done:

- The sign-in screen does not say *why* the person was signed out. The service does not
  report a reason, and a note would need one.
- The laptop is not touched. It already checks with the server on every page.
- No new way to end other sessions. Changing the password stays the only one.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auth`: a new requirement — the phone notices, within minutes, a session ended from
  another device, and goes to sign-in.
- `offline-use`: *Signing out removes what the phone kept about the person* also covers
  a session ended from another device.

## Impact

- `packages/auth` — one shared operation that asks the service whether the session still
  stands.
- `apps/mobile` — the check (on launch, on return to the front, every 5 minutes), and the
  forgetting when the session ends without the button being pressed. The comment on
  `lib/sign-out.ts` that says forgetting is tied to the button only is rewritten.
- No new dependency, nothing on the laptop, no database change.
