## Why

`#87`: with the filter panel open on the laptop bar, applying the first filter moves the
panel out from under the pointer. The ticket calls the cause a hypothesis. It is now
measured, in the running application, and it is larger and more various than the ticket
assumed.

**The trigger grows 39.53px** — from 82.93px to 122.46px, a 48% jump — and the count is
under half of it:

| what arrives when `narrowed` turns true | px |
| --- | --- |
| `.count` — the `· 1` | 20.93 |
| `Menu`'s `liveDot` and its margin, via `marked={narrowed}` | 6.00 |
| **two further 6px flex gaps**, the button going from two visible children to four | 12.00 |
| `Filter` re-set at weight 600 by `.live` | 0.60 |

The two gaps are the second-largest term and are named in no ticket. They are also the
term with no element of its own: they are emergent from how many children happen to be
visible, so a fix that enumerates what to reserve space for has to know that counting
children is one of the things it is reserving for.

**What the reader sees depends on the width of the window**, which is why the ticket could
not settle whether the trigger moves or the row reflows. Both do. `.tools` is
`flex: 1 1 auto` and the filter is its last child, so whether the filter's right edge is
pinned depends on whether `.search` — `flex: 1 1 320px; max-width: 480px` — has any room
left to give. Measured:

| viewport | panel moves | search shrinks | spare room after the filter |
| --- | --- | --- | --- |
| 1400px | 39.54px | 0 | 92.95px |
| 1330px | 22.95px | 16.59px | 22.95px |
| 1150px | 0 | 39.54px | 0 |

- Above ~1347px the search field is pinned at its 480px maximum, the spare room sits
  *after* the filter, and the trigger grows rightward with the panel hanging off it.
- Between ~1307px and ~1347px the panel moves as far as the spare room allows and the
  search field absorbs the rest. Both symptoms at once.
- Below ~1307px the panel is steady and the search field and `Drop` shift left instead.

Both boundaries are set by `.search`'s `max-width`, not by anything about the filter,
which is why this reproduces on a large display and not on a small laptop.

**Clearing is the worse case, and it is the one nobody filed.** Removing the last filter
moves the panel back by the same 39.54px — and `Clear the filter` is a button *inside* the
panel, so pressing it guarantees the panel jumps out from under the pointer that just
pressed it. Applying a filter at least leaves the pointer on a checkbox by luck.

What is already correct and stays that way: `1` to `2` moves nothing (`tabular-nums` is
doing its job), naming a further member moves nothing and leaves the count at `2`
(criteria, not choices), every rendering below 700px is immune (no count, no inline dot,
and the panel is a full-width `position: fixed` sheet), and the phone application is
immune (a `Modal` anchored to the screen's bottom edge, with no relationship to the
trigger).

## What Changes

- **The filter gets a slot in the bar, the way `Drop` already has one.** A wrapper in
  `workspace-chrome.tsx` with a settled width, so the anchor the panel is positioned
  against has fixed edges and the label resizes inside them.

  This is the construction `.drop` uses, carrying the comment that predicted this defect:
  *"a control whose width follows its own state moves whatever sits after it. Here that is
  the filter."* The filter was the thing being protected and was never given the same
  protection itself.

- **The slot is sized to the narrowed state**, which is the widest the trigger gets:
  `activeFilterCount` returns at most 2, and `· 2` is the width of `· 1`, so the measured
  122.46px is the true maximum rather than the largest seen.

- **`workspace-chrome` gains a requirement.** Nothing in the specification says an open
  panel stays where it opened. *A panel opens beside the control that opened it* is
  satisfied by a panel that is beside its control at every instant while sliding across the
  screen, which is exactly what ships today. The rule actually being broken is unwritten,
  so this is a specification gap and not only a defect.

- **`marker-filtering` is not touched.** The count keeps saying what it says, where it says
  it. The fix is about the room the trigger occupies, not about what it is allowed to
  report — and the count turning out to be under half the movement is the evidence that
  changing it would not have fixed this.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace-chrome`: a panel raised from a control must stay where it opened, and a
  control that changes size in response to its own state must not move the panel or the
  controls beside it.

## Impact

- `apps/web/app/_components/workspace-chrome.tsx` — the filter gains a wrapping element,
  matching `.drop` and `.city`.
- `apps/web/app/_components/trip-workspace.module.css` — a `.filter` slot, and the rules
  that make the anchor and the trigger fill it.
- `apps/web/app/_components/filter-bar.tsx` — comments only. The file explains at length
  why the label cannot name people because *"the control changes width every time the
  filter is used, which rearranges the bar that applied it"*. That reasoning was right and
  the control did it anyway, by a different route; the file should say where the width is
  settled now.
- `openspec/specs/workspace-chrome/spec.md` — via the delta.
- **No change below 700px, and that is the risk rather than a note.** `.tools > *` sets
  `flex: 1 1 0` there, so the slot dissolves on its own — but a new wrapper changes which
  element that rule applies to, and the phone bottom bar was fixed four days ago by `#101`.
  It is a task to look at it, not an assumption.
- No change to `@pinpoint/core`, `@pinpoint/map`, `@pinpoint/tokens`, or the phone
  application. Nothing in the fix leaves `apps/web`.
- Closes `#87`. `#88` was closed by `#101` and is not part of this.
