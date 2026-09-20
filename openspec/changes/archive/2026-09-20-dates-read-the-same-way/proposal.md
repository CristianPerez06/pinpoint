## Why

A day is written several different ways in this product, and a trip's dates are not
written anywhere a person can see them at a glance.

The calendar says `Friday 3 April` on screen and a screen reader hears
`Friday, 3 April 2026` — the same day, one with a comma and one without, because that is
what `en-GB` happens to return rather than because anybody chose it. Two private copies
of a "stretch of days" wording have since appeared, one in each application's filter,
written the same but owned by nobody. And the trip menu — the one place where all of
somebody's trips are visible at once — shows only names, so two visits to the same city
read as the same word twice.

Separately, the calendar can open on the wrong day. When a trip carries no dates the
opening day falls through to "today", which is worked out once on the server and again in
the reader's browser. Those disagree for several hours of every day for anybody away from
the server's timezone — which is most people using a travel app while travelling. This
was reproduced: the reader is shown yesterday for a moment, the page throws its whole
calendar away and rebuilds it, and then the correct day appears with nothing having said
anything was wrong.

## What Changes

- **A stretch of days gets one shared wording**, used by the trip menu and by the
  filter's week headings, replacing the two private copies. `9–26 Oct 2026` where a range
  sits in one month, `28 Sept – 3 Oct 2027` where it crosses one, `28 Dec 2026 –
  3 Jan 2027` where it crosses a year.
- **The spoken form of a day loses its comma**, so `Friday 3 April 2026` matches the
  `Friday 3 April` on screen. This is the one wording that differs today.
- **A trip that carries dates shows them beside its name** wherever a person's trips are
  listed — the laptop's trip menu and the phone's trip sheet. A trip with a start and no
  end reads `From 14 Nov 2026`; an end and no start reads `Until 8 Mar 2027`; a trip with
  neither shows nothing at all, not a placeholder.
- **The calendar opens on the reader's own today, and is never briefly shown somebody
  else's.** The day is settled before the screen is drawn rather than worked out twice in
  two places that can disagree.

Not in this change, and recorded as decided rather than forgotten:

- **The browser's own date control stays as it is (#145).** Replacing it is a real
  decision with a real cost — a hand-built month grid has to be driven by keyboard and
  announced to a screen reader — and it is worth taking on its own rather than riding
  along here. The consequence is accepted and written down below: a date control supplied
  by the platform words the date its own way, and that is the one surface the shared
  wording does not reach.
- **Translating the product (#45).** The wording stays English and stays stated in one
  place, which is what lets a translation pick it up later as one argument rather than
  hunting for it.

## Capabilities

### New Capabilities

None. Every rule here belongs to a capability that already exists.

### Modified Capabilities

- `trip-calendar`: two requirements change, and one is added.
  - **Added** — how a day is worded, stated once for both applications, in the way
    `map-rendering` already states how a place's hours are worded. It fixes the forms, it
    names the comma decision, and it records the platform's own date control as the
    accepted exception.
  - **Modified** — *A trip's places can be read one day at a time*: the existing opening
    rule says which day, but never says **whose** today it means. It now says: the
    reader's own, and never one computed somewhere the reader is not.
- `trips`: one requirement changes.
  - **Modified** — *A person chooses which of their trips they are viewing*: where trips
    are listed, a trip carrying dates shows them, so the list can be read for when as
    well as for what.

## Impact

- `packages/core/src/day-wording.ts` — the comma, and a new shared wording for a stretch
  of days.
- `apps/web/app/_components/filter-bar.tsx` and
  `apps/mobile/components/filter-sheet.tsx` — each drops its private copy of that wording.
- `apps/web/app/_components/trip-bar.tsx` and `apps/mobile/components/trip-sheet.tsx` —
  the trip rows gain dates.
- `apps/web/app/_components/trip-calendar.tsx` and `apps/web/app/calendar/page.tsx` — the
  opening day is settled once rather than worked out on both sides.
- No new dependency, and nothing is added to `@pinpoint/map`.
