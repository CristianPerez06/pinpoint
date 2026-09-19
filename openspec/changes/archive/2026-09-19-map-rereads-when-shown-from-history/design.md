## Context

The map (`app/(map)/page.tsx`) and the Calendar (`app/calendar/page.tsx`) read their five
lists on the server and hand them to a client screen, which holds each one in
`useRows` (`apps/web/lib/use-rows.ts`). `useRows` stamps the mount as the moment the list
was last read, because on a normal visit the server has just read it.

Going back or forward in history doesn't ask the server again. Next's client router
rebuilds the page from the payload it saved the first time. The screen mounts again with
those first-visit props, `useRows` stamps the mount as a fresh read, and
`useVisibleAgain` never fires because the tab never went hidden. Nothing re-reads, so the
screen shows the lists as they were when it was first opened.

`BackToMap` (`app/settings/back.tsx`) uses `router.back()` on purpose, to keep `?trip=`
and `?city=`. That choice stays.

## Goals / Non-Goals

**Goals:** a screen rebuilt from history re-reads its lists once, silently, keeping what is
on screen until the answer arrives. The same mechanism covers the map and the Calendar.

**Non-Goals:** making history navigation fetch from the server (`staleTimes` does not apply
to back and forward, and a refresh would hand new props to state initialisers that have
already run). No change on the phone.

## Decisions

**Tell a rebuilt mount from a first one by a token the server issues per render.** Each
page passes a `readId` (a random id made while the server renders) to its screen. A
module-level `Set` in `lib/` remembers every `readId` a screen has mounted with. It lives
for as long as the tab does, which is exactly as long as the router's saved payloads do.
A mount whose `readId` is already in the set is a copy rebuilt from history. A new
server render always brings a new id, and a full reload clears both the set and the saved
payloads together.

Chosen over a server timestamp compared against `Date.now()`. That compares two clocks,
and a laptop a few minutes off would re-read on every visit or never. The id is used only
for equality, so no clock is involved.

**Guard the check against React's development double mount with a ref.** Strict Mode runs
a mount effect, cleans it up, and runs it again on the same instance. Without a guard, the
second run would find the id it just added and re-read on every visit in development. A
`useRef` survives that double run and is new on a real remount, so the check runs once per
instance.

**A rebuilt mount re-reads past the freshness floor, and says nothing.** The mount has
already stamped each list as read — it is the same mount either way — so the re-read asks
for `{ force: true }`, which is what the floor is told to ignore. Forcing is not the same
as asking by hand: `rereadEverything` reports nothing on its own, and only the control
somebody presses adds a message on failure. So the rebuilt mount gets a read that ignores
the floor and stays silent, which is what the spec asks of it. `useRows` is left alone;
each screen gains the hook and one effect.

## Risks / Trade-offs

- [For a moment after going back, the old details are visible] → accepted. The spec forbids
  a loading state on a re-read, and the answer normally arrives in well under a second.
- [A payload the router evicted is fetched fresh, and gets a new id] → correct by
  construction: it really is a new read, so it is not treated as a rebuild.
- [`router.refresh()` elsewhere reuses the mounted instance] → unaffected. There is no
  remount, so no check runs; the existing behaviour stands.
