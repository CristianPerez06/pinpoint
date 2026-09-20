## Context

See `proposal.md` — Why. Three things shape the approach:

- `packages/core/src/day-wording.ts` already exists and already pins its locale, with a
  written record of the failure that made it do so. This change extends it rather than
  introducing anything new.
- Both trip switchers already receive `Trip[]`, which carries `startsOn` and `endsOn`.
  Showing the dates needs no new read and no new prop threading.
- The calendar's opening day is currently decided in a `useState` initialiser inside a
  client component, which Next.js runs **twice** — once while preparing the HTML and once
  in the browser during hydration. Measured on 20 September 2026 with the server moved to
  Pacific time: React reported `Hydration failed because the server rendered text didn't
  match the client`, naming the day headings and both arrow labels, then discarded the
  calendar and rebuilt it. It recovered — the arrows worked afterwards — so this is a
  wrong day briefly shown and a tree needlessly rebuilt, not the dead screen the original
  report feared.

## Goals / Non-Goals

**Goals:**

- One definition of how a day and a stretch of days are written, reachable from both
  applications.
- A trip's dates visible where trips are chosen, on both platforms.
- The calendar's opening day settled once, before the screen is drawn.

**Non-Goals:**

- Replacing the browser's `<input type="date">` (#145). Decided separately.
- Translating anything (#45). The wording stays English and stays in one place.
- Changing which day the calendar opens on. The rule is unchanged; only *whose* clock
  decides "today" is being made explicit.
- Offering a trip's dates for editing from the trip list. They stay read-only there.

## Decisions

### The range wording lives in `day-wording.ts`, as one function over two nullable days

`formatDayRange(from: IsoDay | null, to: IsoDay | null): string | null` — one call
covering all five outcomes, returning `null` for a trip with neither date so the caller
renders nothing.

The alternative was three functions (`formatDayRange`, `formatDayFrom`, `formatDayUntil`)
with each caller choosing between them. Rejected: that hands the half-dated rule to every
caller, which is exactly the divergence this change exists to remove. One function means
the laptop and the phone cannot disagree about what a trip with only a start date reads
like, because neither of them decides.

The two private copies in `filter-bar.tsx` and `filter-sheet.tsx` are deleted and call
this instead. They pass a run's first and last day.

### The year is always shown, including in the filter's week headings

This is the one place the new wording is visibly *different* rather than merely shared,
so it was measured rather than assumed. Today the filter's week headings read
`3 Apr – 9 Apr`. Under the new rule they read `3–9 Apr 2026` — one character *shorter*,
because collapsing the repeated month pays for the year. A heading crossing a month grows
by five characters: `28 Sept – 3 Oct` becomes `28 Sept – 3 Oct 2027`.

The alternative was to make the year optional, so the filter could omit it while the trip
menu showed it. Rejected: that is two wordings wearing one name, and the next surface
that needs a range has to decide which it is. A rule with a switch in it is the thing that
drifts.

### The trip *rows* get dates; the bar's own label does not

The closed button in the chrome bar keeps showing the trip's name alone. Two reasons: the
bar is already tight at narrow widths — which is the open subject of #122 and #127, and
this change should not add to it — and the current trip's dates are already one row away
under `Trip dates`. The problem #148 describes is telling trips *apart*, which only
arises where they are listed together.

### The screen commits to a day only where no clock can disagree, and waits otherwise

`apps/web/app/calendar/page.tsx` is a server component and already has the trip. It asks
`dayToPrepareWith`, which applies the opening rule to yesterday, today and tomorrow and
answers only when all three agree — time zones span UTC−12 to UTC+14, so a reader's
calendar day is never more than one day either side of the server's. Where they agree the
day is passed down and drawn immediately; where they do not, the prop is null and the
screen draws its existing waiting state until the browser supplies the day.

A first attempt passed the server's own answer down unconditionally. That removed the
hydration mismatch but kept the defect underneath it: for a dateless trip the server's
today went into the HTML, painted, and was swapped a moment later. Measured on
20 September 2026 with the server at UTC+14, the served HTML contained
`Saturday 19 September` and the reader's browser then showed the 20th. The waiting state
is what makes "no other day is shown first" true rather than nearly true, and it costs
nothing for the common case: a trip in the future or the past still renders its start date
on the server.

The reader's own today is then read through `useSyncExternalStore`, whose third argument
is the value to use while the HTML is prepared and hydrated and whose second is the value
to use once the page is the reader's. The two renders therefore match by construction, and
moving to the reader's day is an ordinary re-render rather than a repair. It preserves the
decision recorded in `marker-day.ts` that today means the device's today — somebody in
Kyōto at nine in the morning means the day it is there.

A day the reader has stepped to is separate state (`chosen`), so the opening day and a
chosen day cannot overwrite one another. A day named in the address seeds `chosen`,
because it is a fixed string no clock can disagree about.

Three alternatives were considered:

- **A mount effect calling `setDay`** — written first, and rejected on contact with
  `react-hooks/set-state-in-effect`, which is right: it repairs state React has already
  committed, and it needs a guard so that a late re-render does not take back a day
  somebody has since stepped to. The shape above makes that case impossible instead of
  guarding against it.
- **`suppressHydrationWarning`** — silences the message and leaves the wrong day on
  screen. It treats the console line as the defect, and the console line was only ever
  the symptom.
- **Render the calendar only after mounting** — no mismatch, but the screen arrives empty
  and fills in, which is worse than the flash it replaces and throws away the
  server-rendered HTML the page already pays for.

### Dropping the comma is a change to a pinned test, and that is the point

`formatDayFull` returns `Friday, 3 April 2026` because that is what `en-GB` gives, and a
test currently pins it. The comma goes, the test changes with it, and the note in
`day-wording.ts` records that the wording is now chosen rather than inherited — so the
next person to see the two forms differ finds out it was deliberate.

## Risks / Trade-offs

- **The filter's week headings change wording, days after shipping.** → It is the same
  information, one character shorter in the common case, and the alternative is leaving
  two copies of a formatter in place to avoid touching them. The change is covered by the
  validation tasks on both platforms.
- **A long trip name beside a long range could still crowd a narrow menu.** → The spec
  fixes the priority — the dates are shown in full and the name trims — and the mock was
  built at the menu's narrowest width with the worst pairing in it. Checked by looking, on
  both platforms, rather than by a test.
- **The correcting effect is a second render on a cold load for readers in another
  timezone.** → It replaces a *whole-tree* rebuild with a single state update, so it is
  strictly less work than today.
- **`formatDayRange` returning `null` invites a caller to render an empty element.** →
  The requirement says a dateless trip shows its name alone, and both call sites are
  covered by a scenario; the return type makes the empty case impossible to ignore
  silently.
