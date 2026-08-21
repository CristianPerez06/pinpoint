## Why

Every control on the phone sits in the strip a thumb cannot reach one-handed. That
was tolerable while the phone only *showed* a map — you look, you do not touch —
and it becomes wrong with the next change, whose whole premise is standing
somewhere holding the phone in one hand.

It is also out of room. The header carries a dot, a wordmark, the trip name, a
filter control and Sign out, and at 375pt it is close to full before anything is
added. Mobile capture needs a city selector, a search box and a drop-a-pin
control — roughly four hundred points of new controls into about fifty points of
spare. No arrangement of one row survives that, so the strip is the wrong answer
rather than a small one.

This change adds no capability. It builds the shell the next one lands in.

```
now                                    after
┌────────────────────────────┐         ┌────────────────────────────┐
│ ● pinpoint Japan ⟨Clr⟩[Fil]│ Sign out│ ● Japan                 ☰  │
├────────────────────────────┤         ├────────────────────────────┤
│                            │         │                            │
│            map             │         │            map             │
│                            │         │                            │
│                            │         │                            │
│                            │         │ [Filter] ⟨Clear⟩           │
└────────────────────────────┘         └────────────────────────────┘
  everything out of reach                rare things stay up top,
                                         frequent ones come to the thumb
```

## What Changes

**The frequent controls move to a row at the bottom.**

- The filter control and `Clear` leave the header for a row at the bottom of the
  screen, within a thumb's reach.
- **One row, not two tiers.** A bar with a chip row above it is the shape this ends
  up in once search and drop-a-pin exist, and neither exists yet — a bar holding a
  single button is unreviewable and eats height for nothing. Mobile capture splits
  the row it will own.
- The row is **not rendered while a marker is selected.** `MarkerDetails` occupies
  the bottom of the screen already, and reading a place is not narrowing a trip.

**The header keeps only what is rare, and one thing that is not a control.**

- Sign out moves into a sheet opened by a `☰` in the header. The sheet holds
  nothing else today, which is the point: it is where account and trip-level things
  go, so they stop competing for the row that matters. Trip switching and inviting
  land there later.
- The wordmark is replaced by the trip name. Inside the pinpoint application the
  word `pinpoint` says nothing the person does not know, and the dot beside it is
  already the mark — a pin reduced to the point it names. `Japan` says which trip,
  which becomes a real question once more than one can exist.

**Nothing about what a filter selects changes.** `matchesFilter`, `isFiltered` and
`NO_FILTER` are untouched, and so is the rule that `Clear` is permanent and its
state is the declaration. That rule survives the move intact, which is the whole
reason the last change specified a rule rather than a layout.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `marker-filtering`: amends **A narrowed view declares that it is narrowed**. The
  requirement says the declaration rides on a control that is always present. This
  change conceals that control whenever a marker is selected, which the current
  wording does not allow for and should not be left to interpretation.

  The rule being added is that the declaration and the way out are concealed
  **together or not at all**. Hiding both is honest — the narrowing is not visible,
  so nothing claims a filtered trip is a whole one. Hiding only the way out would
  leave somebody able to see that places are missing with no means of getting them
  back, which is the failure the requirement exists to prevent.

## Impact

One application. No shared code, no dependencies, no migration.

- `apps/mobile/components/trip-workspace.tsx` — the header loses the wordmark, the
  filter control, `Clear` and Sign out; gains `☰` and the trip name. A new bottom
  row holds the filter control and `Clear`, and is not rendered while a marker is
  selected.
- `apps/mobile/components/trip-map.tsx` — the attribution's bottom offset has to
  clear the new row. It already computes two cases; this change keeps it at two
  rather than adding a third, which is the practical reason the row hides rather
  than sharing the space.
- A new menu sheet component for the `☰`, holding Sign out.

Nothing under `packages/` changes. The web application is untouched: the same shape
at a narrow browser window is the roadmap's **Responsive web** item, deliberately
after mobile capture so it ports a shape that has been used rather than guessed.

**A limit worth naming.** The bottom row will hold two controls until mobile capture
arrives. That is thin, and it is the correct thin: the alternative is inventing
positions for controls that do not exist and discovering they were wrong when they
do.
