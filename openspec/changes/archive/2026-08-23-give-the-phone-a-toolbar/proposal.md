## Why

The phone's bottom row is four text pills of equal weight — `Search`, `Drop`, `Filter`,
`Clear` — each outlined in a border that only appears once a finger is already on it. At
rest it is four soft lozenges, and the diagnosis from the person who uses it was that it
"looks unfinished". Not cluttered, not badly ordered, not hard to reach. **Unfinished.**

That is a precise complaint and it has a precise cause. The controls are built to be
quiet at rest, which is right on a screen where the pins must stay the loudest thing —
but quiet was taken all the way to absent, and a control that draws nothing until it is
touched does not read as a control. The same row is also a shape nobody recognises: four
small text pills across the bottom of a map is neither a tab bar nor a toolbar, so it
reads as a prototype of one.

The hamburger has the opposite problem. It holds six unrelated things — switch trip,
rename, new trip, People, Cities, sign out — as a flat list of text rows, with rename and
create expanding inline. It is where everything went that had nowhere else to go.

```
now     ( Search ) ( Drop ) ( Filter )   Clear          ← four text pills, borders on touch
        ☰ → switch · rename · new · People · Cities · sign out

after     ⌕          ⊕          ▤                       ← three icon buttons, equal weight
        Search     Drop      Filter
        ● Japan ˅ → trips: switch · new · rename · People · Cities · archive
        ☰ → your account · sign out
```

## What Changes

**The bottom row becomes a toolbar of three.**

- `Search`, `Drop` and `Filter`, each an icon above its own label, filling the row in
  equal thirds. They weigh the same: no one of the three is drawn as primary.
- The icons are `search`, `map-pin-plus` and `sliders-horizontal` from the icon set
  already in both applications. Not a funnel for filter — a funnel says *narrow a list*,
  and sliders says *options you can change*, which is what this one opens.
- Each behaves exactly as it does today: `Search` opens the search sheet, `Drop` starts
  the drop sight with no sheet at all, `Filter` opens the filter sheet.

**`Clear` moves inside the filter sheet, and the Filter button declares the narrowing.**

- The way out stops being a fourth control in the row and becomes a full-width button at
  the end of the sheet's filters, inert until something is actually hidden.
- The Filter button carries the declaration instead: the accent, plus a dot above the
  icon. Two signals, so it survives a greyscale screen and a colour-blind reader.
- This is a real change to a settled rule and is amended rather than quietly broken —
  see *Capabilities*.

**The trip name in the header becomes the way into trips.**

- `Japan` gains a caret and opens a trips sheet: the trips you belong to, with the
  current one ticked and each row's place count beside it; tapping a row switches.
- Below the list: `New trip`, then, for the trip being viewed, `Rename`, `People`,
  `Cities`, and `Archive trip`.
- `People` and `Cities` move here from the hamburger, because both belong to a trip
  rather than to the person. The filter sheet does not take them: it holds what narrows
  the map and nothing else, so its name stays an honest promise.

**A trip can be archived.** The only new capability here. `trips.archived` has existed
since the initial migration and there is no delete policy on any table, because removing
a trip was already settled as archiving; `tripPatchSchema` simply never let anything set
it. **No migration.**

**The hamburger keeps the account and nothing else** — the member's display name, their
email, and `Sign out`. There is no first and last name to show: a member has one
`displayName` they chose, up to 60 characters.

**Not changing.** The map, capture, the marker form, the drop sight, the header's dot,
and the whole web application. The filter stays a list of people to tick — the fixed
Both / Either / Only-one-of-you vocabulary is not being revisited.

## Capabilities

### New Capabilities

None. `trips` gains a requirement; no capability is added.

### Modified Capabilities

- `marker-filtering`: amends **A narrowed view declares that it is narrowed**.

  The requirement currently binds the declaration and the way out together: the
  indication is carried by a permanent control, clearing is available "from where the
  narrowing is visible", and where the controls are concealed both are concealed at once.
  That was written when one control did both jobs.

  This change separates them deliberately. The declaration stays permanently visible on
  a control that is always in the row; the way out moves one tap away, inside what that
  control opens. Both halves of the original intent survive — you can always tell you are
  narrowed, and you can always get out — but the wording as it stands would not permit
  it, and a rule contradicted in silence is worse than one amended out loud.

- `trips`: adds **A trip can be archived**.

  The schema predicted this and the code says so in as many words: `archived` is
  "modelled and deliberately not writable yet… archiving is the answer to 'delete a
  trip' and is its own change". This is that change, arriving with somewhere to put it.

  Archiving is reversible by design. A one-way trapdoor would recreate the failure the
  initial schema went out of its way to avoid — a trip that exists and cannot be reached
  or removed.

## Impact

One application and two packages. No dependencies, no migration, no change to any
row-level security policy.

- `packages/core/src/trip.ts` — `tripPatchSchema` accepts `archived`.
- `packages/data/src/` — a write for archiving and unarchiving; the trips read learns to
  exclude archived trips unless asked for them.
- `apps/mobile/components/trip-workspace.tsx` — the bottom row becomes the toolbar; the
  header's trip name becomes a control; `Clear` leaves the row.
- `apps/mobile/components/filter-sheet.tsx` — gains `Clear` at the end of its filters.
- `apps/mobile/components/menu-sheet.tsx` — reduced to the account block and `Sign out`;
  its trip switching, rename, create, People and Cities move out.
- `apps/mobile/components/trip-sheet.tsx` — new. The trips list and everything about the
  trip being viewed.
- `apps/mobile/components/marker-icon.tsx` — three toolbar glyphs added to the record.

Nothing under `packages/map`, `packages/geocode` or `packages/supabase` changes, and the
web application is untouched. The `styling` requirements landed in
`2026-08-23-hold-the-contrast-floor` apply in full: every toolbar state clears the text
contrast floor, and any control that fills with the accent letters itself in
`inkOnAccent`.

**A design mock was built and reviewed before this was written**, at real phone width in
both themes, using the real tokens, the real typeface, the real icons and the real
seeded data. Three things were decided by looking at it rather than by arguing about it:
all three tools weigh the same, the merged filter-and-trips sheet was too long and had to
split, and the trip name is a better door to trips than a fourth icon in a row that
should stay at three.
