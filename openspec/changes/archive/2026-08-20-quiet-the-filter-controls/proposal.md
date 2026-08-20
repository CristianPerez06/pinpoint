## Why

Narrowing a trip currently makes the interface grow. Ticking a member changes the
closed control's label from `Anyone` to `Ana and You`, and a `Showing 7 of 23`
strip with a `Clear` button materialises beside it — so everything to its right
shifts, and the toolbar reflows. The controls announce their own state loudly
enough that the state becomes the loudest thing in a bar that sits above the map.

A ticked checkbox is a state anybody can read. The interface does not need to
narrate it back.

Same trip, same filter, in the toolbar that sits above the map:

```
now       [Kyoto ▾] Wanted by [Ana and You ▾] [☑ Hide visited] Showing 7 of 23 ⟨Clear⟩ [Search…] [+ Drop a pin]
after     [Kyoto ▾] [Wanted by ▾] [☑ Hide visited]                              ⟨Clear⟩
          [ Search for a place…                                        ] [+ Drop a pin]
```

## What Changes

**The declaration moves onto a control that is always there.**

- The `Showing N of M` count is removed from both applications.
- The web filter control stops naming who is selected. `summarise()` is deleted
  and the closed control reads `Wanted by` at all times; the `Wanted by` label and
  the button collapse into one control, since the button no longer says anything
  the label did not.
- `Clear` becomes permanent on both platforms — always rendered, always in the
  same place, live only when a filter is applied. **Its enabled state is how a
  narrowed view declares that it is narrowed.** Nothing appears, nothing
  disappears, and nothing moves.
- The mobile narrowed strip below the header is deleted. `Clear` moves up into
  the header row that already exists, beside the filter control, which costs no
  vertical space over the map. `summariseFilter()` is deleted with it and the
  control reads `Filter` at all times.

**The web toolbar splits into two deliberate rows.**

- Row one narrows — city, who wants to go, hide visited, clear.
- Row two adds — place search and drop a pin, which are the two ways to create a
  marker and today sit at opposite ends of the bar with a filter between them.
- The toolbar is `flex-wrap: wrap` today, so it is *already* one row or two
  depending on viewport width and how long the trip's city names are. This makes
  the row count a decision rather than an accident.

**Not changing.** The map overlay's "No places match this filter" and its inline
way out stay exactly as they are — that is the zero-match dead end, it is
required, and it is not the thing that appears and disappears in the toolbar.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `marker-filtering`: amends **A narrowed view declares that it is narrowed**.
  The requirement already says a narrowed view SHALL indicate that fact and SHALL
  offer clearing from where the narrowing is visible, and both remain true. What
  it does not say — and what this change decides — is *how*: the declaration is
  carried by a control that is present whether or not a filter is applied, by a
  change in that control's state rather than by its appearance; and it is not
  carried by colour alone. Without this written down, the count comes back.

  The second half has a precedent in force: `map-rendering` already requires that
  a visited marker is drawn as visited **without changing its colour**. This is
  that decision applied to a control instead of a marker.

## Impact

Two applications, no shared code, no dependencies, no migration.

- `apps/web/app/_components/filter-bar.tsx` — `summarise()` deleted; the `shown`
  and `total` props deleted with the count; the conditional `.narrowed` block
  becomes an unconditional `Clear`.
- `apps/web/app/_components/filter-bar.module.css` — `.narrowed`, `.count` and
  the label rules go; `.clear` gains a disabled-looking inert state.
- `apps/web/app/_components/trip-workspace.tsx` — toolbar JSX splits into two
  rows; stops passing `shown`/`total`.
- `apps/web/app/_components/trip-workspace.module.css` — `.toolbar` stops being
  one wrapping row.
- `apps/mobile/components/trip-workspace.tsx` — narrowed strip and its styles
  deleted; `Clear` added to the header row.
- `apps/mobile/components/filter-sheet.tsx` — the sheet's conditional `Clear` and
  `summariseFilter()` deleted.

Nothing under `packages/` changes. `matchesFilter`, `isFiltered` and `NO_FILTER`
are untouched — what a filter *selects* is not in question here, only how the
fact that one is applied is shown.

**A cost worth naming.** With the closed control no longer summarising, seeing
*who* is selected requires opening it. That is accepted: the ticks are the state,
and the trips this is built for have two or three people, where "a filter is on"
is the fact worth carrying in the bar and "which two" is one press away.
