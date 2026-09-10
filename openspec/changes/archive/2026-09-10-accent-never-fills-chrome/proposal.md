## Why

`+ Drop a pin` is the only amber fill on a laptop screen, and nobody ever decided it should
be. It is there because it has always been there: #40 reorganised the bar around it and
deliberately left the accent where it found it, so the new arrangement could be judged
without a second change confusing it. This is that deferred question, and it is #63.

Two things are wrong with leaving it, and they are separate.

**It spends the budget the pins were promised.** DESIGN.md is explicit that every piece of
restraint in the system exists to buy one thing — five saturated marker families that are
the only strong colour anywhere on screen, so that when somebody scans the interface the
pins are what they see. A filled amber control in the chrome is the one thing on a laptop
screen competing with that, and it competes from a fixed place the eye returns to.

**It asserts a hierarchy the specs deny.** `marker-capture` says the two ways to add a
place are peers and that *neither SHALL be described as a fallback for the other*. Filling
one of them and leaving the other a grey field says exactly that, quietly, in colour,
where no reviewer reads it. (The first version of this finding argued drop was the
secondary route and cited the button's own tooltip. That tooltip was itself the violation
and #40 removed it. The finding survives its own reasoning: the problem is not that drop
is secondary, it is that nothing in the bar is primary and one control is coloured as
though it were.)

Five candidates were drawn at a true 1440×760 over a thirty-pin trip in both themes before
this was written. The decision is candidate C — nothing in the bar fills — and the
reasons are below.

## What Changes

- **The drop control stops taking the accent as its fill on a laptop-shaped screen.** It is
  drawn as its neighbours are: a surface pill with a hairline border, the same construction
  the trip, the city and the filter already use. The bar keeps five bordered shapes; it
  stops shouting.
- **The rule this establishes is written down and made testable.** Not "drop is not
  filled", which is a fact about one control that the next change can undo without
  noticing, but the rule that explains it and the six accent fills that stay:

  > The accent fills a control that **commits** an act inside a form or a panel. It never
  > fills a control standing in the chrome at rest.

  Every existing `primary` on web already satisfies this — `Save place`, `Create trip`,
  `Create city`, `Add to trip`, and the two panel saves are all commits inside panels.
  `+ Drop a pin` is the single exception, and it is in the chrome.
- **The bar's tools become peers at every width, not only below 700px.** The web already
  strips the fill from every tone inside `[role='toolbar']`, and `apps/mobile` never had
  one. The requirement that they weigh the same currently only governs the phone shape;
  it is generalised, and the laptop stops being the one place it does not hold.
- **DESIGN.md records the decision and its reason**, so the next person to reach for an
  amber fill in the chrome finds the argument rather than an absence.
- **The point does not change.** The 9px amber dot at the head of the bar is the product's
  mark inside the product, it is covered by `product-mark`, and it stays exactly as it is.
  This change is about the *second* amber thing in the bar, not the first.

Not breaking. No token changes, no new colour, nothing removed from the tab order, and no
control changes what it does or what it is called.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `styling`: gains a requirement bounding where the accent may be used as a **fill** —
  commits inside forms and panels, never chrome at rest. The capability today constrains
  what colour text takes *over* an accent fill and says nothing about which controls may
  have one, which is why a fill could sit in the chrome for the life of the project
  without any rule being broken.
- `workspace-chrome`: gains a requirement that the session's tools carry the same weight at
  every width. Today the only place that equality is written down is as rationale inside
  *a tool in the bottom bar is a glyph above one line of words*, which governs the phone
  shape — so "these controls are equals, each fires an action, none navigates" is a fact
  about one breakpoint rather than about the tools. The phone-shape requirement itself is
  left alone; widening it would drag a stacked-glyph layout onto the laptop bar. See
  design.md.

`marker-capture` is **not** modified. Its peers rule already says what it needs to say;
this change stops the interface contradicting it.

## Impact

- `apps/web/app/_components/workspace-chrome.tsx` — the drop control's `tone`.
- `apps/web/app/_components/ui.module.css` — the `[role='toolbar']` block already removes
  the fill below 700px; whether that override is still the right shape once the laptop no
  longer needs overriding is a design.md question.
- `DESIGN.md` — the accent section and the Do's and Don'ts.
- `openspec/specs/styling/spec.md`, `openspec/specs/workspace-chrome/spec.md`.

Not affected: `packages/tokens` (no value changes), `apps/mobile` (already conforms — it
is the surface this change converges on), the write path, and every other `primary` button
in the application.

**Validation is looking, not type-checking.** The last two changes each shipped three
defects that type-checked, rendered, and were wrong. The thing being changed here is
visible only by opening both applications with a trip's pins on screen, in both themes,
which is what the task list has to budget for.
