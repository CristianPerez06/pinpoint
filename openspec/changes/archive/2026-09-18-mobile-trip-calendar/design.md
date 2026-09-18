## Context

See `proposal.md` for why. What shapes the approach:

- Everything below the interface exists. `groupMarkersByDay`, `addDays`, `dayToOpenOn`
  and `dayShown` are in `@pinpoint/core`, tested, and used by the web calendar. The
  columns exist, the schemas carry the fields, `@pinpoint/data` reads and writes them.
- The phone has one signed-in screen holding the map, and one screen somebody *returns*
  from: `app/settings.tsx`, which draws its own header because the whole navigator runs
  with `headerShown: false`.
- **Which trip is being read lives in `app/index.tsx` state** and is deliberately not
  persisted (#128 holds that question). A second screen cannot see it.
- The phone's place sheets already exist and are the same components the map opens:
  `MarkerDetails` and `MarkerFormSheet`.
- The web calendar is the reference for arrangement, because the user asked for the
  phone to look like the web application at phone width.

## Goals / Non-Goals

**Goals:**

- One place decides which trip is being read, so both screens agree.
- The calendar reuses the phone's existing place sheets rather than drawing new ones.
- The trip's own menu behaves identically on both of the phone's screens, from one
  definition.

**Non-Goals:**

- Persisting the chosen trip across launches. That is #128, and `preferences.tsx`
  deliberately left the question of an archived trip or a revoked membership to whoever
  adds the key.
- Sharing the marker writes between the phone's two screens. Web does not either, and
  the reason is recorded under Decisions.
- Any change to `@pinpoint/data` or `@pinpoint/map`, and any new behaviour in
  `@pinpoint/core` beyond the day's wording moving into it.

## Decisions

### The calendar is a pushed route, not a second mode of the workspace

`app/calendar.tsx`, pushed from the trip's sheet, with its own header.

The phone already has this shape: `settings.tsx` is a pushed route that draws its own
header and its own way back, and going back leaves the map screen mounted underneath —
so the renderer is not torn down, the camera is not re-framed, and returning costs
nothing. The stack also gives the edge-swipe back gesture for free, and it keeps the
specification's line — this screen is not a trip workspace — true in the code as well as
on screen.

The cost is that the calendar reads the five lists itself on arrival, the same five the
web calendar's page reads when it is navigated to. That is one round of reads when
somebody deliberately opens a screen, which is what the web already pays.

### Which trip is being read moves up one level, and is still not persisted

A small context provider mounted in `app/_layout.tsx` inside `SessionProvider`, holding
the chosen trip id for the session. Both `index.tsx` and `calendar.tsx` read it, and the
trip switcher on either writes it.

This is what makes the specification's two rules possible at all: choosing another trip
on the calendar has to show that trip's calendar, and going back then has to give the map
the trip now being read. With the choice held inside the map screen, the calendar cannot
see it and going back silently restores the trip the person had already left.

Deliberately session memory rather than `preferences.tsx`. Persisting it is a separate
behaviour with its own unanswered questions, and #128 is where they belong.

### The day field uses the platform's date picker

`@react-native-community/datetimepicker`, **pinned to 8.4.4**. Drawn as a field in the
form, styled like `TextField`, beside the city.

Pinned rather than taken from `npx expo install`, which chooses 9.1.0 for this SDK,
because 8.4.4 is the version that has actually been seen working in this application.
9.1.0 has not been shown to fail: it *appeared* to, drawn as "Unimplemented component",
but every one of those observations went through a stale second development build of
this project on the simulator (see `findings.md`), whose native binary predated the
picker. Moving to 9.x is therefore open rather than ruled out, and belongs with whoever
next runs `npx expo install` — which will propose it. The version is exact in
`package.json` so that happens deliberately rather than by accident.

`trip-calendar` forbids the date control raising *a panel of the product's own* over the
form, because the form is already raised over what the person was reading. A system
picker is not one — which is the same reasoning that let the web use the browser's own
`<input type="date">`, and it means this change does not wait on #145. The dependency is
free, needs no account and no key.

Two things the picker cannot do, which the field owns instead:

- **It cannot express "no day".** A date picker always has a date under it. So the field
  shows `No day yet` when the place has none, opens the picker on today when first
  pressed, and carries its own `Clear` — which is what satisfies the requirement that
  clearing returns the place to having no day rather than to a particular one.
- **It does not know the app's theme.** Somebody running the app dark on a light device
  would get a light picker. iOS takes `themeVariant`, so it is given the resolved theme
  rather than left to the system.

The alternative was drawing our own month grid: no dependency, but a keyboard-and-screen-
reader-correct date grid is a large thing to own, and it *would* be a panel of ours.

### The trip's menu writes are shared; the marker writes are not

`apps/mobile/lib/use-trip-actions.ts`, extracted from `trip-workspace.tsx` and used by
both screens — rename, create, invite, archive, restore, reveal archived, and setting the
trip's dates. Mirrors `apps/web/app/_components/use-trip-actions.ts`, which exists for
exactly this reason: two screens wearing the same trip menu would otherwise hold two
renames, two archives and two opinions about where a restored trip goes back in the list.
What differs by screen is asked for rather than assumed — where choosing a trip goes.

The marker writes — save, remove, visited, interest — stay per screen, as they do on web.
They are entangled with each screen's own sheet state and its own optimistic updates, and
the web made the same call for the same reason.

### The sheets are reused, and two of their props become optional

`MarkerDetails` already takes the same `Selection` shape the web's does, so the calendar
hands it one place wrapped the way web wraps it. `MarkerFormSheet` is reused for editing.
Two props stop being required:

- **Adjusting the position.** There is no map here to send somebody to, and no sight to
  frame. The web calendar omits it too. The control is simply not drawn when the caller
  offers no handler.
- **Creating a city.** A city is the map's business — this screen never shows where a city
  is — so the create affordance is not drawn either, and the list is whatever the trip
  holds.

The form's height callback exists so the map can offset its camera. There is no camera
here, so it is not passed.

### The day's wording moves into `@pinpoint/core`, and the web's copy goes

`packages/core/src/day-wording.ts` holds the three formats and the pinned locale: the
day, the day short, and the day named in full for a control that has to say where it
leads without being looked at. Both applications import them, `apps/web/lib/day.ts` is
deleted, and its call sites are repointed.

The precedent is `price.ts`, in that same package: it formats an amount with a currency,
pins its locale rather than asking the device, is imported by both applications' place
cards, and says why in its own words — both must produce the same string from the same
values, because a price that reads differently on the laptop and the phone is a bug
somebody spends an evening on. A day is the same kind of value. `apps/web/lib/day.ts`
argues the opposite, that wording is drawing and the phone will word a day in its own
idiom, and this change is where that is settled: the phone wants those exact three
strings, so the sentence was a prediction rather than a rule, and it was wrong.

Two things carried across rather than lost, because they are the reason the file exists:
why the locale is stated rather than left to the runtime — a runtime-default locale is
what broke hydration on web, and it presented as dead markup rather than as anything to
do with dates — and why it is `en-GB`.

Moving it also fixes something the web's copy never had. `price.ts` records that the data
behind `Intl` is thinner on a React Native runtime than in a browser, and it falls back
instead of throwing, because a formatter that throws while rendering takes the whole card
with it. The day formatters get the same guard, falling back to the `YYYY-MM-DD` string.
That is the phone's risk, and it is answered in the one place both applications read.

Not moved: the sentence that counts the places waiting for a day. That is interface copy
sitting in a component rather than a format derived from a value, and where this
product's strings should live is #45's question, not this change's.

## Risks / Trade-offs

- **A scrolling region inside a container sized to its children collapses** (`AGENTS.md`).
  The waiting pile and the day both scroll. → The screen is `flex: 1`, the body below the
  pinned day band is `flex: 1` with `minHeight: 0`, and the waiting list's cap is a
  fraction of the window rather than a size taken from its contents. The failure reads as
  a data problem, so it is checked on a trip with a long undated pile, not an empty one.
- **A native module means the development build has to be rebuilt.** Metro alone will not
  pick it up, and `expo run:ios` needs Xcode 26.6 or newer — 26.2 cannot build this app
  (`AGENTS.md`). → Rebuilding is a task, and the failure is named there so it is not
  diagnosed from scratch.
- **The phone's create-marker path documents itself as having no day control.**
  `newMarkerSchema` defaults `plannedOn` to null and says so in a comment naming the
  phone. The default stays correct for any caller that cannot express a day; the comment
  will be stale. → It is corrected as part of this change.
- **The calendar re-reads five lists when it is opened**, and again when the application
  comes back to the foreground — which `data-freshness` requires and `useActiveAgain`
  plus `useQuery`'s own freshness floor already implement. Accepted; it is what the web
  pays for the same screen.
- **Two screens can now both be showing a trip that was archived elsewhere.** The trip
  actions hook already leaves for the map after archiving, and the calendar does the same
  rather than inventing its own answer.
