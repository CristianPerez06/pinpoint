## Context

The bar is one element. `apps/web/app/_components/workspace-chrome.tsx` renders a single
`<span role="toolbar">` holding search, drop and filter, and the cascade decides where it
stands: a group inside the header above 700px, and a row fixed to the bottom edge over the
map below it. So "the phone" and "the laptop" are not two components with two opinions —
they are one component under two media queries, and the amber fill exists in exactly one
of them.

Below 700px, `ui.module.css` already flattens every tool: `[role='toolbar'] .button` sets
`border-color: transparent`, `border-radius: 0`, `box-shadow: none` and `color: ink-muted`,
and a following rule sets `background: none` on `.primary`, `.default` and `.danger`. The
argument written above that rule is the phone's: the row sits over a map whose pins are the
only saturated colour, and a fourth amber thing at the bottom competes with what it serves.
`apps/mobile` reaches the same place by never having had a fill, and its comment records
that an earlier pass drew `Drop` in the accent and it was rejected on sight.

Above 700px none of that applies. The bar is not over the map: `.bar` is a
`--pp-surface` strip with a `1px --pp-line` bottom border, a flex sibling above `<main>`.
The phone's stated reason is therefore literally false at a laptop width, which is why this
could not be settled by copying the phone's rule up — a new reason was needed, and finding
it is what #63 asked for.

Five candidates were drawn at a true 1440×760 over a thirty-pin trip in both themes before
any of this was written. What follows is the reasoning that survived looking at them.

## Goals / Non-Goals

**Goals:**

- Remove the accent fill from the drop control at a laptop width.
- Replace it with a rule that explains both the removal and the six accent fills that stay,
  so the next change finds a constraint rather than an absence.
- Make the web and the phone one behaviour rather than two that happen to agree below a
  breakpoint.
- Write the reason into DESIGN.md and into the specs, because a decision that lives only in
  a diff is a decision that gets undone.

**Non-Goals:**

- **The point.** The 9px amber dot at the head of the bar is the product's mark inside the
  product, it is `product-mark`'s, and it is not touched. It is also the reason "no accent
  in the bar" was never on the table: the choice was one amber thing or two.
- **The other six accent fills.** `Save place`, `Create trip`, `Create city`, `Add to trip`
  and the two panel saves are correct and stay.
- **Token values.** No colour changes, and no new colour — the Eighth Type Rule is not in
  play.
- **What any control does, is called, or where it stands.** #40 settled the arrangement.
  This is only the colour.
- **`marker-capture`.** Its peers rule already says the right thing.

## Decisions

### Candidate C over B, and the deciding fact is the dark ground

B — the accent as a 1px edge with `accent-ink` lettering, no fill — is a real candidate and
was the closest thing to a rival. Three reasons it lost, in the order they carry weight.

**One rule instead of a rule plus an exception.** C is what `apps/mobile` does and what the
web already does below 700px. Choosing it means DESIGN.md gains one sentence that is true
on every surface. Choosing B means that sentence plus "except the drop control on a laptop",
and an exception has to be defended by everyone who touches the bar afterwards. The
divergence cost of C is zero and the divergence cost of B is permanent.

**B does not satisfy the peers rule either.** `marker-capture` says search and drop are
equals and neither is a fallback for the other. An outline is a quieter hierarchy, but it is
still a hierarchy — drop is still drawn as the one that matters. C is the only candidate
where the colour stops asserting something the specification denies.

**B is not equally good in both themes.** On the dark ground `accent-ink` and `accent` are
the same value (`#F0AE4A`) — the Converged-Pair Rule — so B's border and its lettering
collapse to one amber. It reads deliberate on white and under-drawn on black. Nothing about
that is a bug in the tokens; it is the pair converging exactly as designed. But a candidate
whose emphasis is carried by two things on one ground and one thing on the other is a
candidate that ships with a maintenance note.

The other three lost more quickly. **A** is the status quo and has never had an argument
made for it. **D** — the search field wearing its focus treatment at rest — makes the bar
claim a field is focused when nothing is, leaving the real focus state nothing to say, and
spreads the amber thinly around a 480px perimeter rather than massing it. **E** — the
accent on the filter — collides with the filter's own `.live` state: the trigger fills with
`accent-wash` when it is narrowing something, so a permanently-filled filter would get
*quieter* when used than when ignored, and the one thing that control exists to say would
have nowhere left to be said.

### The rule is bounded by *commit*, not by *button*

The rule this change establishes is:

> The accent fills a control that commits an act inside a form or a panel. It never fills a
> control standing in the chrome at rest.

The obvious alternative — "the accent never fills anything" — was rejected because it is
false about the code and would break six correct controls. Every existing `primary` on web
is a commit inside a panel or a form: `Save`, `Add to trip`, `Create city`, `Save place`,
`Create trip`. `+ Drop a pin` is the only `primary` standing in the chrome, and drop does
not commit anything — it *arms* the map. What commits is `Use this spot`, and that already
carries `accent-wash` rather than the fill.

So the rule is not a new constraint invented to justify one removal. It is the description
of what the application already does everywhere except one control, which is the strongest
form a rule of this kind can take.

### The tone changes at the call site, not in a stylesheet

`tone={dropping ? 'danger' : 'primary'}` becomes `tone={dropping ? 'danger' : 'default'}`
in `workspace-chrome.tsx`. The alternative — leaving `primary` and overriding its fill from
`trip-workspace.module.css` at a laptop width — was rejected: it would leave the component
declaring a primary action that never draws as one, and the next reader would have to find
two files to learn what colour the control is.

`default` is the right tone rather than a new one, and what it lands beside is worth stating
correctly, because an earlier draft of this document got it wrong and the wrong version
argued the case better than the truth does.

The bar does not hold four identical pills. Read left to right it holds the point, two
**quiet** text menus (the trip and the city are `tone="quiet"` — transparent, `ink-muted`,
no border), a search **field** in `surface-muted`, then two bordered pills, then a quiet
account menu. So `default` does not make drop the fourth of four. It makes drop and filter a
**matched pair**: two adjacent slots of identical width, identical construction, and equal
weight — which is a sharper outcome than uniformity would have been, because those two are
precisely the controls a filled drop was ranking against each other.

On both themes `.default`'s background is `--pp-surface`, which is also the bar's own
background, so the pair reads as hairline outlines rather than as filled shapes. **That is
the intended result and not something drop lost:** a future change that "restores" a fill
here would be re-deciding this, and should read this document first.

Verified by looking, not by reading the stylesheet — the mistake above was made by reading
the stylesheet.

At a phone width nothing changes. `[role='toolbar'] .button` already overrides
`border-color`, `border-radius`, `box-shadow` and `color` at a higher specificity than
`.default`, and the background rule already covers `.default`. `primary` and `default`
flatten identically there today, so the tone swap is invisible below 700px — which is the
point: the phone was already right.

### `.primary` stays in the toolbar's background selector, as a guard

This was the open question carried out of the proposal. After the change, `.primary` never
appears inside `[role='toolbar']`, so the selector lists a class that is no longer there.

It stays. The rule is cheap, and the regression it prevents is one this project has already
made and rejected on sight — twice, once on each platform. What changes is the comment above
it: it currently argues the phone's local case, and after this change the decision does not
live there any more. It should name the rule and say it is a guard, so that a reader looking
for *why* is sent to DESIGN.md rather than finding a second, narrower argument that appears
to be the reason.

### `workspace-chrome` gains a requirement rather than widening one

The proposal described the existing requirement — *a tool in the bottom bar is a glyph above
one line of words* — as being widened to every width. On writing the spec that turned out to
be wrong, and the correction is recorded here rather than quietly applied: that requirement
is about the glyph-above-words **shape**, which is genuinely phone-only, and widening it
would drag a stacked-glyph layout onto the laptop bar.

What generalises is not the shape but the *equality* — "these controls are equals, each
fires an action, none navigates", which the existing requirement states only as rationale
for one-size lettering. So `workspace-chrome` gets a sibling requirement about weight at
every width, and the phone-shape requirement is left exactly as it is.

## Risks / Trade-offs

**The laptop bar reads flat rather than calm.** → The risk that could not be reasoned about
and is the reason the candidates were drawn before this was written. It is smaller than it
first appeared: C does not draw `Drop` as bare text, it draws it as the same bordered pill
as its three neighbours, so the bar keeps its structure and loses only its shout. If it
still reads under-weighted once it is open, **the fix is weight, not colour** — and the
weight is raised on **all three tools together**, never on `Drop` alone.

That last clause is not a detail. An earlier draft of this document proposed `Drop` at 600
as the fallback, which the requirement written immediately afterwards forbids: the session's
tools carry no lettering weight that the others do not have. Bolding one of the three is the
same hierarchy the fill was asserting, bought more cheaply — and it would have been easy to
apply without noticing, because it looks like typography rather than like a claim. The
correction is recorded rather than quietly made, because the mistake is the instructive part:
the pull toward re-emphasising this one control survives the removal of the colour.

**The point becomes the only amber in the chrome.** → It may read as more deliberate, or as
a stray speck with nothing to relate to. Judged by looking, in both themes, with pins on
screen. If it fails, that is a `product-mark` question and a separate change; it is not
fixed by putting a fill back.

**Arming now changes a control from `default` to `danger` rather than from `primary` to
`danger`.** → A smaller visual jump than before, at the exact moment the interface most
needs to say that the map is doing something unusual. Mitigated by what already carries
that message: the banner over the map, and the row being replaced rather than added to.
Both are unchanged, and both are checked while armed as part of validation.

**Somebody puts a fill back in the chrome later.** → Three guards, deliberately overlapping:
the retained `[role='toolbar'] .primary` background rule, the new `styling` requirement
that bounds accent fills to commits, and the DESIGN.md rule. Only the first is mechanical,
which is why the other two exist.

**Nothing here is caught by a type-check.** → Every rule involved is a colour on a control
that renders. This change is validated by opening both applications with a trip's pins on
screen, in both themes, at both widths, at rest and while armed. The task list budgets for
that rather than assuming it.

## Migration Plan

None. No stored data, no token values, no API surface, and no user-visible behaviour beyond
one control's colour. Rollback is reverting the tone at the call site; the spec and
DESIGN.md changes are documentation of a decision and would be reverted with it.

`apps/mobile` needs no code change — it is the surface this converges on. Its comment
arguing the phone's local case should point at the rule instead, for the same reason the
web's comment should: the argument is no longer phone-shaped.

## Open Questions

- ~~**Does `+ Drop a pin` keep its `+`?**~~ **Decided: it keeps it.** The `+` says what the
  control does rather than emphasising it, and it is the only thing in the bar that
  distinguishes beginning a place from finding one. It is also not a weight, a fill or a
  size, so it makes no claim the peers requirement is concerned with — three tools can be
  equals and still say different things. The `.drop` slot is unchanged.
- **Does the bar want any compensating weight at all?** Held open deliberately — see the
  first risk. Decided by looking, and only after. If the answer is yes, it is applied to all
  three tools, not to one.
