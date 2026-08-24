# Design

## Context

Written after the fact. The defects were found while generating a design-system
document from the token source, not while looking for them, and the fix was made in the
same session. This file records the decisions so the reasoning is not only in a diff.

## Decisions

### The value gets a token rather than a third copy

`#241703` already existed twice on web, as a literal in `ui.module.css` and again in
`auth.module.css`, each with a comment explaining why white does not work over amber.
Mobile needed the same value and reached for `ground`, which is the closest thing a
component can read from the theme and is wrong on the light ground.

The literal was the cause, not the symptom. A value that cannot be read from the token
package gets copied by whoever needs it next, and the copy is made by someone reasoning
from the theme rather than from the measurement. So `inkOnAccent` is a token, and the
three literals are gone.

**Its two values are near-neighbours, and that is not a violation.** The `styling` spec
forbids defining a colour once and reusing it across both grounds, and requires each
value be chosen against the ground it is drawn on. Both hold here: the surface being
chosen against is the accent, which is light in both themes, so both values are dark.
`MARKER_FOREGROUND` is the existing precedent for a pair that behaves this way — it is
white on light and near-black on dark precisely because the thing under it is *not*
constant, and this token is the mirror case.

### The dark value is `#171614` rather than the light one repeated

Web drew `#241703` on both themes and was legible on both (9.06:1 on the dark accent).
Taking `#171614` instead costs nothing measurable — 9.35:1 — and buys two things: the
pair is genuinely chosen twice rather than duplicated, and the mobile dark theme renders
byte-identically to what it rendered before this change, so the only visible difference
anywhere is the light-theme button that was broken.

### `inkFaint` is narrowed rather than retuned

The alternative was to move `inkMuted` and `inkFaint` up until all three text values
clear 4.5:1 — one token edit, no component changes, and the three-step text ramp
preserved. It was rejected.

There is no room. `ink` is 16.8:1 and `inkMuted` is 5.16:1; a third step above 4.5:1
lands between them with nothing to separate it from `inkMuted` by eye. Making room means
moving `inkMuted` too, which repaints every muted string in both applications to correct
a misuse of a different token — and the ranking between the three was chosen against
these grounds deliberately.

So the ramp keeps two text values and one non-text value. The separation that `inkFaint`
was carrying for labels is carried by the `label` role instead, which is already 11px,
weight 700, +0.1em and uppercase — a stronger distinction than a hue step, and one that
survives a greyscale display.

Native had already reached this answer: `FieldLabel` in `apps/mobile/components/ui.tsx`
has used `inkMuted` since it was written. Web is being brought to a decision this project
had already made on the other platform, not to a new one.

### The comment is part of the fix

`inkFaint` said "placeholders, and text that is deliberately hard to notice". Every
misuse of it was a correct reading of that sentence. Changing the call sites without
changing the description leaves the trap armed for the next person, who will find a
token that describes exactly what they want and no indication it cannot carry text.

### The two hover borders keep `inkFaint`

`interest.module.css` uses it for `border-color` on `:hover`, which is not text and is
an enhancement over a resting border that is already drawn in `line-strong`. Left alone.

This deliberately does not open the adjacent question: `line-strong` on `surface` is
about 1.5:1, under the 3:1 non-text floor for a control's boundary, which affects every
default button and outlined chip in the system. That is a real finding, it is not this
change, and folding it in would turn a contrast fix into a palette revision.

## Risks

- **The text ramp flattens.** Labels, notes and placeholders now share one colour, where
  three shades did some of that work before. Typography carries the distinction instead.
  Judged acceptable, and it is what native already looked like.
- **Light theme was measured, not seen.** The browser used for verification was in dark
  mode. Every light-ground ratio in the proposal is computed; none was confirmed by eye.
