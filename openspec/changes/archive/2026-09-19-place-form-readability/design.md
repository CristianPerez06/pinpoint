# Design

## Context

See `proposal.md` — Why. The look was settled on `mock/place-form-mock.html` before any
of this was written; the numbers quoted below were measured on it rather than reasoned
about.

Two forms have to end up agreeing without sharing a line of styling code:
`apps/web/app/_components/` and `apps/mobile/components/`. There is no cross-platform
styling runtime and adding one is rejected by default (`openspec/specs/styling`). So the
group and the price row are built twice, once per app, over the same tokens.

## Goals / Non-Goals

**Goals.** The hours and the prices each read as one bounded section on both apps. No
label says "(optional)". The price row stays readable at every width both apps reach.

**Non-Goals.** No change to what is saved, to the place card, or to which fields exist.
No shared component extracted for the group — two small borders in two files is cheaper
than a package that neither app can import a renderer into.

## Decisions

### The group is a border, not a fill

Measured on the mock: `surfaceSunk` against `surface` is **1.17:1** on the light ground
and **1.05:1** on the dark one. At 1.05:1 the fill *is* the card — it would do nothing on
dark while looking deliberate on light. The border (`line` against `surface`) is 1.27:1
and carries the boundary on both grounds on its own.

A fill would also force the time and amount fields onto a different background from every
other field in the form, so that they stayed visible against it — a second divergence
bought for nothing.

*Alternative considered:* heading plus a divider above. It shows where the section starts
and not where it ends, which is the actual complaint in #191.

### The price row wraps; it never shrinks

This is the one that needs stating, because the repo has already been bitten by it
(`AGENTS.md`, "Two flex defaults quietly decide how wide a control in the bar is").

Inside the `Price` group the row loses 24px to the group's own padding. At the card's
narrow width (328px, which is what the web card takes below a 1200px window) two amount
fields with a plain `flex: 1` were measured at **43px of usable amount each — about five
digits**. A ¥120,000 hotel would not be readable.

So each amount field takes a **flex basis wide enough for a plausible amount** and the row
is allowed to wrap. Below the width where both fit, `Free` drops to its own line beneath
the two amounts — which is the better reading anyway, since `Free` applies to both amounts
and not to the field beside it. Measured after the change: 8 digits at 328px, 8 and 9
digits on the phone and the wide card, all on one row except at 328px.

**A `min-width` floor is the wrong tool here.** A flex item with a `min-width` does not
wrap when it runs out of room, it overflows its container — the failure `AGENTS.md`
records as drawing the search field underneath the drop button. The basis makes the item
drop to the next line instead.

### The currency code sits on the field

With one `Price` label for the section, the code has to move onto each field (`USD 25`,
`JPY 3800`) or be lost. This is why the spec delta adds that any message about one of the
two amounts names its currency: the label used to do that job and no longer can.

## Risks / Trade-offs

- **The form gets taller, not shorter** — 17px on the laptop, 9px on the phone. Accepted
  deliberately: the complaint in #191 is legibility, not length, and the borders cost
  padding. → Recorded in the proposal so it is not discovered as a regression later.
- **Two implementations of the same group can drift** → Both are a border, a radius and a
  label over existing tokens; the delta states the behaviour so a drift is a spec failure
  rather than a matter of taste.
- **The phone's day row is tight inside the group** — the group's padding leaves 315
  points for seven 44-point targets that need 308. Seven points spare. → Do not add
  horizontal padding to that group beyond what the mock uses, and check it on a
  375-point device rather than trusting the simulator's default.
- **Touching the mobile sheet risks two recorded gotchas** — a `ScrollView` in a
  content-sized container collapsing, and `KeyboardAvoidingView` overwriting
  `paddingBottom`. → This change adds no container to the sheet's own structure; the
  groups sit inside the existing `ScrollView`. Leave the sheet's surface and
  `KeyboardAvoidingView` arrangement alone.

## Migration Plan

None. No stored data changes, so there is nothing to migrate and nothing to roll back
beyond reverting the commit.
