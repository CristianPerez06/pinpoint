## Why

Every question this product asks before destroying something is asked by the platform,
not by the product. On the laptop that is the browser's grey system box in its own font,
pinned to the top of the window, with an OK button we cannot theme. On the phone it is the
operating system's alert. Neither can carry the product's colours, and the browser's in
particular reads as something the browser threw up rather than as something the
application asked.

At the same time, two panels have no way out. The place card and the capture form float
over the map and can only be closed by finding one particular button inside them — no
Escape, no press outside, and focus never moves into them or back to what opened them.
Every menu in the chrome has had that contract since `#40`; these two were left out of
that change on purpose, and this is the other half.

And a refusal from a chrome panel is reported *behind* the panel that caused it. Below
about 934px the panel covers the message: measured at a 560px column, the only part of
`Could not save that trip. Dismiss` still visible is the last three letters.

## What Changes

- **The product asks its own questions, in the panel that offered the act.** No dialog, no
  second sheet, and no new kind of layer. The panel that offered the act takes a question
  face, the way the trip bar already swaps between its rename, dates and archive faces.
  What is being removed stays on screen; whatever offers *other* actions goes away while
  the question stands.
- **The rule for when to ask is written down**, and it is not "irreversible". It is
  **destroys something a person entered, or cannot be got back**. That keeps the currency
  change asking — changing a city's currency can be undone, but the prices stored in the
  old one cannot be retyped from nothing — and keeps archiving a trip silent, because
  nothing is lost.
- **Escape on a half-filled form asks rather than discards.** The same question face, so
  there is one pattern rather than one per situation. On a form with nothing typed it
  simply closes.
- **The two panels over the map gain the dismissal and focus contract** the chrome's
  menus already have.
- **A refusal from a panel is shown in that panel**, which is what the specification
  already requires and what the phone already does. The laptop is the one that diverged.

Not in this change:

- **#196**, a refused field answering in the validation library's voice. The same
  principle applied to sentences rather than to containers, and it lives in
  `packages/core`. Separable, and this change is large enough.

## Capabilities

### New Capabilities

None. Both rules belong to capabilities that already exist.

### Modified Capabilities

- `write-feedback`: one requirement added, one modified.
  - **Added** — a write that destroys something asks first. When to ask, what the question
    must say, that the answer is asynchronous, and that the control which confirms owns the
    pending state rather than the control that offered the act.
  - **Modified** — *A refused write says so, wherever it happened*: the existing sentence
    already says a refusal goes beside the control where one is still on screen. It gains
    a scenario making the panel case explicit, because one application reads it correctly
    and the other does not.
- `workspace-chrome`: three requirements modified.
  - **Modified** — *Anything that opens can be dismissed without hunting*, and *A control
    that opens something announces and restores state*: both are scoped to what is raised
    **from the chrome**. That scoping was deliberate and is now the thing being widened,
    so the two panels over the map are covered by the same contract.
  - **Modified** — *Only one thing opens at a time*: a panel showing a question is the
    case where that rule has to bite hardest, because the controls it replaces are
    themselves destructive.

## Impact

- `apps/web/app/_components/ui.tsx` — the laptop has no dialog primitive and gains no
  dialog; what it gains is a question face inside panels that already exist.
- `apps/web/app/_components/marker-details.tsx`, `city-bar.tsx`, `marker-form.tsx` — the
  three laptop sites that ask, plus the form's Escape.
- `apps/mobile/components/marker-details.tsx`, `city-sheet.tsx`, `trip-workspace.tsx`,
  `trip-calendar.tsx` — the four phone sites. Two of them are not in `#50`'s list.
- `apps/web/app/_components/trip-bar.tsx` — where a chrome panel's refusal is drawn.
- **Seven platform confirmations, not the four the ticket names.** Both currency changes
  and one in the phone's calendar are missing from it.
- No new dependency. `#50` says so explicitly, and the shape chosen here needs none.
