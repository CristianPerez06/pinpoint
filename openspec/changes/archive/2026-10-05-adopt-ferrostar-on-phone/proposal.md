## Why

Following a route on the move — the map keeping up with where the person is, the next
turn shown, a new route found when they wander off — is what #279 asks for, and it is a
different job from calculating a route once, which is all the phone does today (#276,
#281). Ferrostar, Stadia Maps' free and open-source navigation kit, does that job and is
built for the same routing software Stadia runs and the same map library the phone
already draws with. Before #279 can be designed around it, it has to be shown to work in
Pinpoint's phone app at all (#282).

## What Changes

- **Nothing changes for the person using the app.** This is groundwork. No button, no
  screen and no wording reaches anyone who installs Pinpoint. Starting a route, what
  happens on arrival, what happens with the screen locked and how leaving the route is
  told to the person all stay open in #279.
- Ferrostar's tracking part is built into the phone app. Its own map screen is **not**
  used: the map stays Pinpoint's, so the look, both themes and both languages stay
  Pinpoint's (decided in exploring #282).
- Ferrostar's phone packages are not yet published by Stadia, so they are built from
  Stadia's tagged release by a script kept in this repository and installed as ready-made
  archives. Nobody installing the workspace needs the tools to build them. When Stadia
  publishes the packages, the archives are swapped for the published ones (decided in
  exploring #282).
- A trial screen, reachable only in development builds by a link, follows a route on
  Pinpoint's map: the position moves along the line, the next turn is shown, and leaving
  the route brings a new one.
- The outcome — Ferrostar works, or why it does not and which alternative was chosen — is
  recorded on #279.

Not done here: anything #279 decides, the laptop (following a route is a phone activity),
spoken instructions, following with the screen locked, and asking FOSSGIS when Stadia does
not answer during a trip.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `monorepo-structure`: adds how a third-party native package that is not published is
  brought into the workspace — built by a committed script from a pinned upstream release,
  installed as a ready-made archive, never needing its build tools to install — and that a
  screen built to try something out cannot be reached in a build anyone installs.

## Impact

- `apps/mobile`: two new dependencies (Ferrostar's core and its generated bindings), a
  trial screen, and a development build rebuilt for the new native code. iOS and Android.
- `.github/scripts/`: the script that builds the archives. It needs Rust, Stadia's binding
  generator and the Android NDK, on the one machine that runs it.
- A GitHub release on this repository holds the archives. The repository is public, so CI
  installs them with no credentials.
- Stadia's free allowance: every return to the route is one more request. Checked against
  the allowance as part of the work.
- No shared package changes, and none may depend on Ferrostar.
