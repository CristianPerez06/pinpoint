## Why

On the laptop, between 1024px and about 1108px wide, the bar stayed on one row and
squeezed the search field down to 156px, too narrow to use (#127). `DESIGN.md` derives the
wrap from what cannot shrink in the bar (868px, measured) plus a search field's floor
(240px), which puts it at 1108px, not 1024px.

## What Changes

- **The laptop bar splits into two rows from 1108px down**, instead of from 1024px. Trip,
  city and account stay on the first row; search, Drop, Filter and Nearby take the second.
  It is the same two-row bar as today, met 84px sooner, so the search field never drops
  below its floor.
- `DESIGN.md` § Responsive states 1108px and keeps the arithmetic behind it.

Decided with the user: wrap sooner, rather than keep 1024px and call it a chosen number.
The two-row bar was measured working at 720px and 760px (#122), so its arrangement is
kept as it is.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No specification names the width.

## Impact

- Web: `chrome-bar.module.css` and `trip-workspace.module.css` (the one media query each),
  and `DESIGN.md`.
