---
name: Pinpoint
description: A quiet planning surface where the map and the interface share one ground and eight pin colours are the only strong colour on screen.
colors:
  ground: "#F6F4FB"
  surface: "#FFFFFF"
  surface-muted: "#EFEBF8"
  surface-sunk: "#ECE8F5"
  line: "#E3DEF0"
  line-strong: "#827C92"
  ink: "#1A1626"
  ink-muted: "#625C72"
  ink-faint: "#A19BB0"
  accent: "#7A35DC"
  accent-ink: "#6227C0"
  accent-wash: "#F0E9FD"
  accent-ring: "#7A35DC52"
  ink-on-accent: "#FFFFFF"
  danger: "#B3261E"
  danger-surface: "#FCEDEE"
  pin-place: "#8B857A"
  pin-temple: "#7C8896"
  pin-culture: "#B43F72"
  pin-nature: "#3F7A32"
  pin-food: "#D2451E"
  pin-shopping: "#9C7A00"
  pin-stay: "#0B5FD0"
  pin-transport: "#00857A"
  marker-foreground: "#FFFFFF"
  map-land: "#F2F0F7"
  map-block: "#E6E2EF"
  map-road: "#FFFFFF"
  map-road-casing: "#DAD5E6"
  map-water: "#C3D4F0"
  map-park: "#D9E8D5"
  map-boundary: "#DCD7E6"
  map-label: "#8D879C"
typography:
  display:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.033em"
  title:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.022em"
  rowName:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.52
    letterSpacing: "0em"
  note:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0em"
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.1em"
  numeric:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0em"
    fontFeature: "tabular-nums"
  control:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink-on-accent}"
    rounded: "{rounded.pill}"
    padding: "8px 15px"
    typography: "{typography.control}"
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 15px"
    typography: "{typography.control}"
  button-default-hover:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "8px 15px"
    typography: "{typography.control}"
  button-quiet-hover:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    padding: "8px 15px"
    typography: "{typography.control}"
  button-danger-hover:
    backgroundColor: "{colors.danger-surface}"
    textColor: "{colors.danger}"
  field-input:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 11px"
    typography: "{typography.control}"
  field-input-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  pill-select:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "7px 11px"
    typography: "{typography.control}"
  clear-live:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
    typography: "{typography.note}"
  clear-inert:
    backgroundColor: "transparent"
    # Muted, not faint. This block said `ink-faint`, which this document's own
    # prose contradicts, the shipped control does not use, and the `styling`
    # spec forbids: the text of a control that is present but inert has to clear
    # the 4.5:1 floor like any other text, and `ink-faint` measures 2.78:1 on the
    # light ground. The border, the fill and the weight already carry the state,
    # so the colour never has to go under the floor to say it.
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
    typography: "{typography.control}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    width: "328px"
  tag:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
    typography: "{typography.note}"
---

# Design System: Pinpoint

## Overview

**Creative North Star: "The Tinted Basemap"**

Most map products arrive as two designs stapled together: somebody else's grey
cartography, and an interface floating above it in an unrelated palette. Pinpoint
refuses that seam. The upstream style document is rewritten before either renderer sees
it, so the land, the roads and the water are drawn in the same tinted neutrals as the
panels sitting on top of them. The map is not a backdrop the interface stands on. It is
the ground, and everything else is a surface lifted off it.

Everything follows from making that ground quiet. The neutrals carry a slight purple bias rather
than being a pure grey ramp; the chrome is muted fills, hairlines and pill-shaped
controls that state nothing until touched; the basemap's own labels are deliberately
recessive. All of that restraint exists to buy one thing — eight pin colours, one per
place type, that are the only strong colour anywhere on screen. When somebody scans this
interface, the pins are what they see, because nothing else is competing.

The mood is **quiet, precise and current**. There is no neutral grey in the system:
every grey leans slightly toward the accent, a faint lilac on light and an aubergine on
dark. It leaned warm — beige and brown-black — until `purple-palette` (2026-11), and
after a real trip that read as a dated app rather than a chosen one. Quiet because the interface is a tool used while deciding
something else. Precise in the fractional type sizes (13.5px, 12.5px), the tabular
figures, the hairline dividers, and the fact that every value was chosen against the
ground it renders on rather than derived from its opposite. This must never read as a
generic consumer travel app: no full-bleed hero photography, no gradient buttons, no
oversized rounded cards, no illustrated empty states. The radius range stops
deliberately short of that look.

**Key Characteristics:**

- One tinted ground shared by the map and the interface, never two palettes meeting.
- Eight pin colours, one per place type and ranked by deliberate prominence, as the only strong colour.
- Purple as the single accent, chosen so it can never be mistaken for a place type.
- Every colour chosen twice, once against each ground; no theme is derived from the other.
- One typeface doing all the work, at eight named roles.
- Depth measured as distance from the map, not applied as decoration.
- Controls quiet at rest, responsive on contact.

> **The token modules are normative, not this file.** Every value here is derived from
> `packages/tokens/src/` and generated into `src/generated/`. This document explains the
> system so new work stays inside it; when the two disagree, the token source wins and
> this file is stale.

## Colors

A purple-tinted neutral ramp with exactly one accent, holding eight pin colours that belong
to the data rather than to the interface. Values in the frontmatter are the **light**
ground; each colour's dark counterpart is given below, because it is a chosen value and
not a derivation.

### Primary

- **Signal Purple** (dark ground: `#B48CFA`): The single accent. It carries the primary
  action, the current selection and the focus ring — and it must be distinguishable from
  every place type at a glance (`styling`, *The accent cannot be mistaken for a marker
  type*). An accent that read as a ninth place type would make the map's own colour
  vocabulary ambiguous. It took the hue Shopping held (CIE LCh 310°) when it replaced
  amber, and Shopping moved to gold, so every distance around it is one the palette
  already lived with: 46°–49° from Deep Rose, 22° light / 30° dark from Deep Blue. It is
  a dark fill on the light ground and a light one on the dark ground.
- **Deep Purple Ink** (dark ground: `#C9B0FF`): Purple *as text*, one step further from
  its ground than the fill — deeper on light, paler on dark — so it reads on the wash as
  well as on a surface (6.92:1 and 7.47:1 on Purple Wash). While the accent was amber this
  pair converged to one value on the dark ground; in purple it differs on both.
- **Purple Wash** (dark ground: `#2E2452`): Behind a selected row, and the fill of any
  control declaring an active state. Always paired with Deep Purple Ink.
- **Purple Ring** (dark ground: `#B48CFA66`): The focus ring and the pin's selection
  halo. Carries alpha deliberately, so it reads correctly over a surface *and* over
  cartography.
- **Ink on Purple** (dark ground: `#140F24`): Text sitting directly *on* the accent —
  the opposite problem to Deep Purple Ink. White on the light ground's purple (6.23:1),
  near-black on the dark ground's (7.18:1), where white would be 2.60:1. A fill is not a
  ground, so the lettering is chosen against the fill.

### Secondary — The Place Types

Eight types, one colour each, and their **relative prominence is a product decision
rather than a palette choice**. A real wishlist is lopsided, and most of it is
`temple`. If `temple` took a loud colour, the majority of the pins would be loud and
would drown the ones carrying the information somebody is actually looking for. The minority is the signal.

Note which way that runs: the quiet slate belongs to *whichever type holds the
majority*, not to sightseeing and not to the type called `culture`. Splitting Temple
back out moved the slate with the temples and left `culture` — castles, museums,
galleries — a prominent minority. That is the Ranking Rule being applied to a count,
not an exception to it.

Colour used to be carried by a closed set of five *families*, with the type deciding
only the icon. Sixteen types arrived over those five colours, seven of them sharing
one, and a castle, a museum and a park became indistinguishable except by a 15px
glyph. The cap was never reached; the bucket was. Colour now names the type directly.

- **Warm Neutral** — `place` (dark: `#A8A197`): The fallback, and deliberately the
  least coloured pin on the map. Not ranked against the rest — it makes no claim.
  Separated from Quiet Slate by hue direction, warm against cool, never by lightness:
  lightness already means visited.
- **Quiet Slate** — `temple` (dark: `#98A3B0`): The deliberate majority, deliberately
  the most recessive *coloured* value in the system.
- **Deep Rose** — `culture` (dark: `#E57DA5`): The last colour the wheel had room for,
  at CIE LCh 356° — the middle of the 94° span between the violet at 310° and Burnt
  Orange, 46° and 48° clear of them. That violet was Shopping's when this was chosen and
  is the accent's now, at the same hue, so the span is unchanged. Measured in CIE LCh
  because that is what the palette mock measures in; the same value argued in OKLCH came
  out 33° from the violet and thin.
- **Leaf Green** — `nature` (dark: `#6FB45C`): Pushed yellow rather than blue, to hold
  its distance from Teal and its ground on the basemap's park fill.
- **Burnt Orange** — `food` (dark: `#F0653A`)
- **Gold** — `shopping` (dark: `#DDB43A`): Violet until the accent became purple, then
  moved so the two could not be confused. At CIE LCh 86°–88°, 43° from Burnt Orange and
  48°–49° from Leaf Green. The light value is a deep mustard because a brighter gold
  measured 2.88:1 on the light land, under the 3:1 floor.
- **Deep Blue** — `stay` (dark: `#4A8FE8`)
- **Teal** — `transport` (dark: `#00857A` → `#16A99C`)
- **Pin Glyph** — `marker-foreground` (dark: `#120F1C`): White on light, near-black on
  dark. This is the one place the two themes differ in *kind* rather than in value, and
  it follows from the pin colours being lifted rather than darkened for the dark ground.

**How close the pins sit, measured.** Hue distance is the wrong instrument for a pair
where one colour is nearly grey: `temple` and `place` have almost no hue to measure, so
two pins can share a hue and still look nothing alike, or sit far apart in hue and look
close. Judge a pair by perceived difference (CIE ΔE2000) on the rendered map. Measured in
`purple-palette` (2026-11), the closest pairs were:

| Pair | Light | Dark | |
| --- | --- | --- | --- |
| `place` – `temple` | 14.0 | 12.8 | By design: two near-neutrals, parted by warm against cool |
| `temple` – `stay` | 20.2 | **16.9** | The tightest coloured pair, on the dark ground |
| `nature` – `transport` | 19.7 | 21.4 | The pair long judged acceptable |
| `place` – `shopping` | 21.2 | 23.4 | Same hue; parted by gold being strongly coloured and `place` not |

`temple` – `stay` on the dark ground sits under the pair long accepted and was left
there on purpose. Deepening the dark blue to part it from `temple` moves it toward the
accent by about as much — `#3478F0` reaches 20.5 from `temple` and drops to 20.8 from the
accent — so the wheel has no free room and the change would trade one close pair for
another. On the rendered dark map the two read as different. Re-measure here before
moving any pin colour.

### Tertiary — The Basemap

Not decoration: `@pinpoint/map` rewrites the upstream style document with these, which
is the entire North Star made literal. Chosen against Positron's structure, a
near-greyscale style whose quietness is what lets the marker pins be the only strong
colour on screen. Quiet is not colourless: water is recognisably blue and parks
recognisably green, at low chroma (about 11 for a park) so the area they cover does not
out-shout the pins.

- **Map Land** (dark: `#171423`), **Map Block** (dark: `#211D30`), **Map Road** (dark:
  `#3B3552`), **Map Road Casing** (dark: `#2A2539`), **Map Water** (dark: `#152A4D`),
  **Map Park** (dark: `#1A2D26`), **Map Boundary** (dark: `#2C2740`), **Map Label**
  (dark: `#837C99`).

### Neutral

- **Lilac Paper** — `ground` (dark: `#120F1C`): Behind everything.
- **Raised White** — `surface` (dark: `#1D192B`): Rails, cards, sheets, menus.
- **Muted Fill** — `surface-muted` (dark: `#2A243C`): Fields, hover states, chips. The
  resting fill of nearly every control.
- **Sunk Fill** — `surface-sunk` (dark: `#16131F`): Anything that reads as *behind* —
  sticky headers, footers.
- **Hairline** — `line` (dark: `#342E49`): The divider between rows.
- **Stated Edge** — `line-strong` (dark: `#7A7391`): A border meant to be seen — a
  control's edge rather than a divider. Clears the 3:1 non-text floor against Raised
  White, the ground and Muted Fill: 4.00:1 light, 3.82:1 dark against Raised White. It was
  about 1.5:1 until #124, which made every outlined control an edge you had to know was
  there.
- **Ink** — `ink` (dark: `#F2F0F8`): Names and values. About 16:1 on either ground.
- **Muted Ink** — `ink-muted` (dark: `#A39DB5`): Notes, counts, secondary labels.
  5.85:1 light, 7.24:1 dark.
- **Faint Ink** — `ink-faint` (dark: `#6F6886`): **Not text.** A hairline that needs to
  be darker than Hairline, a border on hover — anything drawn rather than read. It
  measures 2.46:1 on the light ground and 3.60:1 on the dark, both under the 4.5:1 floor,
  so recessive *text* goes to Muted Ink instead, which is already clearly quieter than Ink
  and still legible.
- **Danger** — `danger` (dark: `#F2857C`) and **Danger Surface** — `danger-surface`
  (dark: `#3A2029`): Failure. Chosen distinct from every type colour, so a broken map
  never reads as a marker.

### Named Rules

**The Eighth Type Rule.** There are exactly eight place types and one accent. Never
introduce a new saturated hue into the interface: any colour a person could mistake for
a place type breaks the map's vocabulary. And a new *type* now costs a colour — which
is the whole bound on the list. **The budget is now spent**: eight types, plus the
accent and `danger`, is the roughly-eight cap reached rather than approached. Do not
add a ninth on the grounds that there is room — there is not, and the wheel's last open
span went to `culture`.

This inverts the rule it replaces, which read *new types join an existing family and
never bring a colour*. That rule is why sixteen types arrived over five colours.

**The Ranking Rule.** `temple` is the most recessive coloured value in both themes and
the rest are prominent in both. `place` is exempt: it is a near-neutral rather than a
quiet colour, because it means *nothing was determined*. A dark value that is legible
but wrongly ranked does not satisfy this system. Changing the ranking is a product
change, not a palette refresh — and which type holds the majority is a fact about how
trips get filled in, so the recessive value follows it rather than being assigned once.

**The Accent Pair Rule.** Never write text in `accent`. Anything in the accent and
legible uses `accent-ink`, and anything filled with it as a state uses `accent-wash`
beneath it. The single exception is `ink-on-accent` for text sitting on the accent itself.

**The Converged-Pair Rule.** A state that fills with `accent` must also change its
lettering, always to `ink-on-accent`. This came from amber, where `accent-ink` and
`accent` were the *same value* on the dark ground and a filled state that kept its
lettering painted amber on amber at 1:1. The purple pair differs on both grounds; the
rule stands, because whether two tokens converge is a fact about one palette, and a fill
is never a lettering.

**The Chrome Fill Rule.** The accent fills a control that **commits** an act inside a form
or a panel. It never fills a control standing in the chrome at rest — at any width, on
either platform. `Save place`, `Create trip` and `Add to trip` may take the fill; the bar's
tools may not.

Arming, opening and narrowing are not committing. Beginning an act is not completing one, so
a control that puts the map into a state where a further action is expected is still chrome:
`+ Drop a pin` arms and waits, and what commits is `Use this spot`.

The reason, and it is the reason the rest of this palette is shaped the way it is: chrome is
on screen at all times, in a fixed place the eye returns to. Every other piece of restraint
here exists to buy eight pin colours that are the only strong colour anywhere,
so that when somebody scans the interface the pins are what they see. A fill in the chrome
spends that budget continuously, and spends it emphasising a control at the moment nobody is
using it. A fill on a commit spends it once, inside something raised on purpose and
dismissed after.

A second reason, narrower and just as load-bearing: where two controls are peers by
specification, filling one of them asserts a hierarchy in colour that no requirement
describes, in the one place no review reads. `marker-capture` says search and drop are peers
of which *neither shall be described as a fallback for the other*, and for the life of the
project the bar said otherwise by filling one of them.

This rule bounds the accent as a *fill*. The focus ring, the pin's selection halo, and
`accent-wash` beneath `accent-ink` all remain available to chrome — a state carried by a
wash is not a fill.

**The Chosen-Twice Rule.** Every colour is defined for both grounds, each chosen against
the ground it will be drawn on. A theme is never derived by inverting or lightening the
other. Contrast ratio is the wrong instrument at the dark end of the range — it reads
near 1.0 between any two dark colours by construction. Judge dark values by perceived
lightness (CIE L*) distance instead, with a floor of about 4.5 L* for a fill.

**The Area Rule.** Judge a fill by the area it will actually cover, not by a swatch. A
green at chroma 16 measured a comfortable +7.8 L* from the land and still swamped the
map, because at city zoom woodland covers most of the viewport.

## Typography

**Display / Body / Label Font:** Figtree (with `ui-sans-serif, system-ui, sans-serif`)

One variable typeface does all the work, bundled with both applications rather than
fetched from a third party, and deliberately **unsubsetted** — the subset stops at
U+00FF and this product is full of macrons (Kyōto, Tōdai-ji, Dōtonbori). A missing `ō`
does not fail; it silently falls back to a system face for that one glyph, so a name
renders in two typefaces and nothing reports it.

**Character:** Compact and editorial. Headings pull tight (−0.033em at display size)
while body text sits at zero tracking and a generous 1.52 leading; the contrast between
the two is what gives a dense interface air where it is actually read. Micro-labels go
the other way entirely — 11px, weight 700, +0.1em, uppercase — so the smallest text in
the system is also the most deliberate.

### Hierarchy

- **display** (800, 32px, 1.1): A place name given the whole panel. The largest thing on
  any screen.
- **title** (700, 17px, 1.22): A selected place's name, a form heading, a trip name.
- **rowName** (600, 14px, 1.3): A place's name in a list or a search result.
- **body** (400, 13.5px, 1.52): A note, read rather than scanned.
- **note** (400, 12.5px, 1.35): A note reduced to one line under a name; hints, secondary
  meta.
- **label** (700, 11px, +0.1em, uppercase, 1.3): A city header, a field label.
- **numeric** (600, 13px, tabular, 1.3): A price, a count.
- **control** (500, 13.5px, 1.3): Text inside an input or a button.

### Named Rules

**The Round Hundreds Rule.** Weights use only steps both platforms resolve identically.
Figtree is variable and a browser will happily set 620; React Native maps a weight to the
nearest resolved face, so 620 and 600 render the same on a phone and differently on a
laptop. Never specify a weight the scale does not already contain.

**The Ratio Rule.** Letter-spacing and line height are stored as multiples of the role's
own size, never as absolute units. CSS wants `em` and a unitless leading; React Native
wants points. A token committed to either unit is unusable on the other platform.

**The Column Rule.** Any number that stacks into a column takes tabular figures. With
proportional digits a `1` is narrower than a `7`, so a column of prices shifts
horizontally row to row and stops being scannable — which is the one thing a list has to
beat a spreadsheet at.

## Layout

**Spacing** is a five-step scale in density-independent pixels: 4 / 8 / 16 / 24 / 32,
stored as numbers rather than strings so React Native can take them directly and CSS can
append its own unit. Control padding sits deliberately *between* steps (7×11, 8×11,
8×15, 5×10) — the scale governs structure, and controls are tuned to their type.

**The map is the stage.** Both applications are a full-height shell with chrome at the
edges and cartography filling everything left over. Nothing scrolls the page; panels
scroll inside themselves.

**Chrome follows the screen shape, not the platform.** A phone-shaped screen puts
frequent controls in a bar across the bottom within a thumb's reach, with rare
destructive ones (Sign out) kept deliberately far away at the top. A laptop-shaped one
gets **one bar**, read left to right as scope, then the session, then the person: the
trip's name and the city (each opening what is rare and belongs to it), then search,
drop and filter, then the account. The web application is expected to render both,
chosen by window width — a browser held in a hand looks like the phone application because it *is* a
phone, not because anybody remembered to mirror it.

**A control in the bar reserves its width; it does not follow its own content.**
Anything whose text varies — a trip's name, a city's, a button with two labels, the
filter — is given a fixed width and truncates or centres inside it. A control that sizes
itself moves every control after it, so switching city or arming the map slid search,
drop and filter sideways; the things a person aims at repeatedly must not move because a
word somewhere else changed length. A short name therefore leaves air before its chevron,
which is what a picker looks like, and the space costs nothing in a bar that had most of
its width empty. The full text is in what the control opens.

**And varying text is not the only thing that changes a width.** The filter was the last
control here to size itself, and it was left out of this rule because its label is the
fixed word `Filter` — so nothing in it *varied*, it merely gained parts. Declaring a
narrowing added a count, a state dot, the two flex gaps those two children brought, and a
heavier weight: 39.53px arriving at once on a control 82.93px wide. Its own panel hangs
off it, so the panel walked sideways while somebody was choosing inside it, and the way
out of the filter is a button in that panel — pressing `Clear` moved the thing being
pressed. Read the rule as **a control's width does not follow its own state**, of which
varying text is one case and an arriving badge is another.

**The bottom bar is the floor.** Flush to the screen edge, with the map's own ornaments
and licence credit rising off it. A bar that stops short of the edge is a wide pill with
a gap under it, and the gap fills with whatever it was clearing.

**Panels over the map** are 328px wide, anchored bottom-left at `md` inset, capped at 70%
height and scrolling internally. **Menus** hang from the control that opened them —
320px, `lg` radius, `lg` shadow, `xs` below the trigger, and anchored to that trigger
rather than to the bar. At most one is open at a time across the whole bar; each closes
on an outside press and on Escape, and returns focus to what opened it. Every trigger
carries a **13px drawn chevron** in Muted Ink — drawn as a path rather than typed as
`▾`, for the reason the zoom control already records: a typed glyph takes the font's own
weight, width and vertical centring, so it is whatever size the face decided rather than
the size it was given. On a trigger that is declaring a state, the chevron takes the
lettering's colour instead. **Sheets on the phone** are pinned to the bottom
edge at one of two detents — 52% and 92% of the window — because half is enough map to
recognise a street corner and enough sheet to show the fields being checked against it.

**Responsive:** the web bar holds one row down to **1108px**, below which the tools take
a line of their own and the scope keeps the first with the account. That number is
derived rather than picked: what cannot shrink in the bar — the two fixed scope names,
the drop slot, the filter slot, the account, the gaps and the padding — measures
**868px**, and a search field stops being one at about **240px**, so the single row runs
out below their sum.

It was 1024px until #127, which by then was past its own derivation: the bar stayed one
row for 84px in which the search field shrank to 156px, well under the floor named above.
The wrapped bar was already the better arrangement there — measured at 720px and 760px it
holds with nothing overlapping and the field at 292px and 332px — so the fix was to meet
it sooner rather than to redesign it. **If anything in the bar changes width, re-measure
the 868px and move this with it.** Below **700px** the chrome takes its phone shape, which is an arrangement rather than a
narrower version of the bar: the trip's name and the city stack on two lines with a menu
of rare actions at the far end, the map takes everything under them, and search, drop and
filter become a toolbar standing on the bottom edge. Three bands, therefore — one bar, a
wrapped bar, and the phone's shape — and the phone's is the only one of the three that
changes what the controls *are* rather than where they sit.

That last number is chosen rather than derived, and it is worth saying so. 1108 is
arithmetic: it is where the bar's incompressible contents stop fitting. Nothing fails at
700 — the wrapped bar goes on working down to about 445px — so 700 is a judgement about
what a screen that width is *for*, not a measurement of what fits on it. A breakpoint
also cannot be a token, because custom properties do not resolve inside a media query, so
it is a literal repeated in each stylesheet that changes shape; `trip-workspace.module.css`
is where it is decided and every other copy points there.

Chosen by width alone, which means a phone held in landscape is about 900px wide and gets
the laptop bar. That is accepted rather than overlooked, and it is why the bar carries
horizontal safe-area padding at every width.

**A control gives up its place before it gives up its size.** Shrinking a field until it
still fits is how a search box reaches thirty pixels — present, focusable and useless.
When a row can no longer hold something at a usable size, the row wraps.

### Named Rules

**The Offset Centre Rule.** When something covers part of the map, centring the camera on
a point is exactly how to hide it — the middle of the *view* is behind the sheet. Shift
the centre by half the covered height using `offsetCenter`; never use the renderer's
camera padding, which persists in camera state and changes what `center` reports.

## Elevation & Depth

Depth in this system means **distance from the map**, not ambient polish. There are four
levels and the fourth is not part of the ramp: `sm` (1px/2px) lifts a control off a
surface, `md` (4px/12px) floats a card or a sheet header, `lg` (12px/32px) separates a
panel from the busy cartography beneath it, and `pin` (2px/5px) exists on its own terms.

Shadows are stored as **ingredients rather than as a shadow** — offset, blur, and a
colour carrying its own alpha — because there is no cross-platform notation for one. CSS
wants a single string; React Native wants four properties on iOS and an `elevation`
number on Android. Each application composes the parts in its own idiom.

**Nothing casts sideways.** There is no horizontal offset anywhere in the system: the
light is directly above, which is what makes a stack of surfaces read as a stack rather
than as a diagram.

Away from the map, most separation is not shadow at all — it is a hairline plus a tonal
step between `ground`, `surface`, `surface-muted` and `surface-sunk`.

### Shadow Vocabulary

- **sm** (`0 1px 2px #1A16260F`; dark `#00000066`): A control, or a row lifted off its surface.
- **md** (`0 4px 12px #1A16261A`; dark `#00000075`): A card, a sheet header, anything that floats.
- **lg** (`0 12px 32px #1A162629`; dark `#00000094`): A panel over the map.
- **pin** (`0 2px 5px #1A16264D`; dark `#0000008C`): A pin against cartography.

### Named Rules

**The Absent-Light Rule.** Dark-theme shadows are near-black at a higher alpha, never the
light theme's tinted ink lightened. On a dark ground a shadow works by absence of light,
and a tinted one reads as a smudge.

**The Cartography Rule.** A pin's shadow is tighter and darker than `sm` even though it
sits closer, because it separates a small shape from road casings and building blocks
rather than from a flat surface. A soft shadow simply disappears there.

**The Outline Rule.** A shadow follows the drawn outline, not the bounding box. The pin
uses `filter: drop-shadow()`, because `box-shadow` on a teardrop draws a rectangle's
worth of shade.

## Shapes

Four radii, softened deliberately: **6px** for an icon chip or tag, **10px** for a field
or a form button, **14px** for a card, sheet or panel, and **fully round** for badges,
search fields and the pill controls that make up most of the chrome. The range sits
between "this is a surface you could pick up" and the rounded-consumer-app look that
would compete with the pins for attention.

**Pills are the resting shape of the interface.** Nearly every control in the toolbar and
the bottom bar is a pill with a muted fill and a transparent border. Rectangles with a
10px radius are for things you type into and forms you fill; pills are for things you
press or open.

**The pin is a teardrop, not a disc**, drawn at 32×42 with its anchor at `{ x: 0.5, y: 1 }`
— the point sits on the coordinate, so there is no question about whether the middle or
the bottom of the pin is the place. The glyph centres on the round head at `15/42`, not
on the box. Both applications pass the normalised anchor to their renderer rather than
writing an offset, which is what let a previous drift defect survive being fixed on one
platform only.

**Sheets round only at the top** (20px). The bottom is the screen edge, and a radius
there shows the map through the corners.

## Components

### Buttons

- **Shape:** Fully round (999px), with a 1px transparent border held in reserve for
  hover.
- **Primary:** Signal Purple fill with Ink on Purple text and an `sm` shadow; hover deepens
  the shadow to `md`. Never `ground` and never a fixed white: white on the dark theme's
  purple is 2.60:1. The lettering is chosen against the fill, not the ground.
- **Default:** Raised White fill, Ink text, a visible Stated Edge border; hover fills to
  Muted Fill.
- **Quiet:** Transparent with Muted Ink text; hover fills to Muted Fill and darkens to
  Ink.
- **Danger:** Transparent with Danger text; hover fills to Danger Surface. Never a filled
  red button.
- **States:** All buttons depress 1px on `:active`. Disabled drops to 0.55 opacity and
  `cursor: not-allowed`. Transitions are 0.16s on colour and shadow, 0.12s on transform.

### Chips & Pills

- **Selector pill:** Muted Fill, transparent border, 7×11 padding, `control` type, with a
  faint caret. The border appears in Stated Edge on hover or while open — the control
  states nothing at rest.
- **Chooser:** A name that opens a choice of itself — the trip, the city, a Filter
  question — rests on Muted Fill with Ink text and its caret, at a field's corner rather
  than a pill's. Hover, press and open deepen it to Hairline. Without the fill it reads as
  a title, a caption or a line of a list.
- **Toggle pill:** Same construction, holding a checkbox tinted with the accent.
- **Tag:** Muted Fill with Muted Ink at 3×9, `note` type. A type tag inverts to the
  type colour with the pin glyph foreground.
- **Interest choice:** Outlined in Stated Edge with Muted Ink at rest; **active** is
  Purple Wash with a Deep Purple Ink border and text. Never the raw accent.
- **Filter `Clear`:** two states of one permanent control. Live is Purple Wash with a
  Signal Purple border and Deep Purple Ink text; hovering fills with Signal Purple and the
  lettering switches to Ink on Purple. Inert is transparent with Muted Ink at the control
  weight — the border, the fill and the weight carry the difference, so the colour never
  has to go below the contrast floor to say it.

### Cards & Panels

- **Corner:** 14px. **Background:** Raised White. **Border:** 1px Hairline.
- **Shadow:** `lg`, because they sit over cartography.
- **Padding:** `md` (16px). **Width:** 328px floating, 340px hanging as a detour.
- Panels scroll internally at `max-height: 70%`; the page never scrolls.

### Asking Before Destroying

**The product asks its own questions. It never hands the person the browser's box or the
operating system's alert** — neither takes a token, neither carries the danger pair, and
the browser's in particular reads as something the browser threw up rather than as
something this application asked.

- **Where it appears:** inside the panel or sheet that offered the act. There is no
  dialog in this system and no second kind of sheet; a panel that changes what it shows
  without closing is what the trip bar already does between its rename, dates and archive
  faces. A question is one more face.
- **How much it replaces:** *what is being removed stays; whatever offers other acts
  goes.* Removing a place from its card swaps the footer alone, because the card **is**
  the place and seeing it is how you know what you are answering about. Removing a city
  from the city panel replaces the body, because that body lists other cities each with
  its own delete control — and no second destructive control may stand beside a live
  question.
- **The question:** one line naming what will happen, in the product's voice. Where the
  consequence lands on records that are not on screen, a second line says what and how
  many. A count discovered afterwards arrived too late to inform the decision.
- **The controls:** decline first, confirm second. Confirm carries Danger text on a
  transparent fill and fills to Danger on hover — never a filled red block, per the
  standing rule. The footer takes the Danger Surface tint so the question has weight
  without shouting.
- **Weight:** enough to read as more important than the row it replaced, and no more.
  This is seen often; it is a question, not an alarm.
- **At phone width:** unchanged. The sheet already rises from the bottom edge, so the
  footer is where the thumb is.
- **Dismissal declines.** Pressing outside or Escape closes the question and writes
  nothing. This is the one thing a modal would give that this does not, and the safe
  direction is the one it gives up.
- **Announced when it appears**, so somebody not looking at the screen hears the
  question rather than noticing the controls changed.
- **The confirming control owns the wait.** It says `Removing…` and cannot be fired
  twice. The act begins when the question is answered, not when it was offered.

### Inputs & Fields

- **Style:** Muted Fill, transparent 1px border, 10px radius (pill for search), 8×11
  padding.
- **Focus:** Fills to Raised White, border becomes Signal Purple, plus a 3px Purple Ring
  glow. The field brightens as it activates rather than dimming its surroundings.
- **Error:** Border becomes Danger and the message sits beside the field, not only in a
  summary — a six-field form with one message at the top makes the person hunt for the
  offender.
- **Label:** `label` role, uppercase, in Muted Ink on both platforms.
- **Native fields take vertical padding rather than a fixed height**, so a larger system
  text size grows the field instead of clipping what is in it.

### Navigation & Chrome

- **The point:** a 9px accent dot with a 3px Purple Ring halo — a pin reduced to the
  point it names, in the one colour that is not a place type. The full wordmark,
  "pinpoint" at 16.5px/800/−0.032em, is for signed-out screens.

  It is *not* "the mark", which it was called until the icons were settled. The mark is
  the teardrop tile below; this is a header ornament. One is a drawing for hosts that
  have never run the product, the other is for a screen inside a product already open,
  and a shared name is how a change draws the wrong one.
- **Web header:** it *is* the bar — the dot, the trip name and the city as menus, the
  session's three tools, and the account at the far end holding what is about the person
  rather than the trip. The wordmark's letters are not in it: inside the application they
  say nothing the reader does not know, and the trip's name answers a real question.

  The three tools weigh the same as each other, and the dot is the only accent in the bar at
  rest. Search, drop and filter each fire an action and none navigates; drawing one of them
  more strongly claims a hierarchy nothing else in the system describes. See The Chrome Fill
  Rule.
- **Phone header:** the same dot, the trip name at `title`, and a menu holding rare
  actions. The trip name is the only element that yields, so a long name truncates
  instead of pushing the menu off.
- **Phone bottom bar:** the map owns the edge; the row is only what stands on it.
  Frequent controls only.

### The Mark

What a browser tab, a home screen and an installed copy's splash screen show to identify
the product. One drawing on every surface: **a purple `accent` tile carrying the pin's
own teardrop in `ink-on-accent`, with the head knocked out so the tile shows through
it.** The path is `MARKER_PATH` in `packages/tokens/src/layout.ts` — the same definition
both applications draw on the map, beside the box it is drawn in. Not a copy of it: a
mark that merely resembles the pin drifts from it silently, and so does one that copies
it and is checked, because a check reports a divergence only after somebody has made it
and only for the copies it was told about.

**It does not vary by platform.** An installed copy of the site and the installed
application reach the same Android home screen, so a rule indexed on platform puts two
marks in one place. That is not hypothetical: it is the defect this section was written
after. The dark tile is the better drawing at launcher size and was a close second when
the mark was picked; it loses on the surface the mark cannot afford to lose on, because
at 16px in a tab strip a dark tile with a small coloured pin is a speck where an accent tile is a
solid block of the one colour that is not a place type. The restraint thesis at the top
of this document argues for the dark tile and is scoped to *on screen*, where marker
colour is the signal. A launcher has no markers to compete with.

**What varies is scale, and it varies by what crops the asset** — never by platform.
Three contracts, and the drop is measured against the region that survives each:

| Contract | The host | Drop |
| --- | --- | --- |
| Drawn as given | Draws the whole canvas, adds nothing — so the asset carries its own corners | **50%** of the canvas |
| Corners cut | Rounds or squircles it and shows substantially all of it — so the asset is square to the edge | **41%** of the canvas |
| Cropped to a mask | Crops to a shape of its choosing — so the asset bleeds under the crop | **41% of what it renders**, which is less of the file |

The last row is the one that matters and the one that was got wrong. An Android launcher
draws the middle 72 of a 108-unit adaptive layer, so that asset's drop is 27.3% of its
file in order to arrive the same size as everything else. The drop's bounding box is
centred on the canvas, because the tip is the exposed end under a mask and it is the
part carrying the pin's meaning.

The favicon's 50% is not about masking. It is drawn at 16px, where 41% is six pixels
across and the tile has to do the reading.

Every asset is cut by `node .github/scripts/build-icons.mjs` and `pnpm check:icons`
fails if what is committed is not what the mark would cut. Do not hand-edit an icon:
hand-cutting in two sittings is precisely what produced two different drawings.

### The Focus Ring

One ring for the whole application: `2px solid` Signal Purple at `2px` offset with an
`sm` radius, on `:focus-visible` rather than `:focus` so a mouse click leaves nothing
behind while keyboard navigation always shows one.

### Signature Component — The Pin

The system's one piece of real iconography and the only place saturated colour is
allowed. A 32×42 teardrop filled with its type colour, a 15px stroked glyph in the
marker foreground centred on the head, and a `pin` drop-shadow following the outline.
The glyph reinforces what the colour has already said; it is not what separates one
type from another, which is why it can afford to be small.

- **Selected:** scales to 1.2 from a `50% 100%` origin over 0.18s on a
  `cubic-bezier(0.2, 0.8, 0.3, 1)`, and the Purple Ring halo fades in behind it.
- **Draft (unsaved):** the same silhouette in Raised White with a 2px dashed Ink stroke
  and a plus glyph, dropping in over 0.42s on an overshooting
  `cubic-bezier(0.2, 1.2, 0.4, 1)`. Provisional reads as provisional.
- **Count badge:** top-right, 18px, Ink on Ground with a 2px Map Land ring, tabular
  figures. The ring is what separates it from tiles.
- **Visited tick:** bottom-left, same construction, deliberately opposite the badge
  because a place can be both visited and one of several on one point.

### States

- **Loading:** a 20px spinner, 2px Hairline ring with a Signal Purple top edge, 0.8s
  linear.
- **Failed:** Danger Surface panel, 1px Danger border, Danger text at weight 600.
- **Overlay note:** a pill centred at the top of the map — Raised White, Hairline border,
  `md` shadow, Muted Ink at `note`. The danger variant swaps to the Danger pair.
- **Armed banner:** Ink on Ground — deliberately *not* the accent. While the map is armed
  the primary thing is the map itself, and a loud banner would compete with the pins it
  is asking you to look past.

## Do's and Don'ts

### Do:

- **Do** read every colour, space, radius and type value from `@pinpoint/tokens`. A
  literal in a component is a value that cannot be themed and will not survive the next
  derivation.
- **Do** choose a new colour twice, once against each ground, and judge the dark value by
  CIE L* distance rather than by contrast ratio.
- **Do** pair `accent-wash` with `accent-ink` for any active or selected state, and
  reserve the raw `accent` for the focus ring, the pin halo, and the fill of a control that
  *commits* an act inside a form or a panel. Which fills matters: see The Chrome Fill Rule.
- **Do** carry every state in something besides hue. `Clear` differs from its inert twin
  by border *and* weight as well as colour; a visited marker is drawn visited without
  changing colour. A signal that survives only in hue survives neither a greyscale
  display nor a colour-blind reader.
- **Do** keep an unavailable control in the tab order with `aria-disabled="true"` (web) or
  `accessibilityState={{ disabled: true }}` (native), styled inert with a no-op handler.
  The `disabled` attribute leaves the tab order and is skipped by screen readers.
- **Do** give the smallest text the most deliberate treatment: `label` is 11px/700/+0.1em
  uppercase, never a shrunken body style.
- **Do** use tabular figures for anything that stacks — prices, counts, distances.
- **Do** restyle MapLibre's attribution rather than hiding it. It is a licence condition
  of the tiles, not decoration.
- **Do** verify by looking. Static checks in this project have been green over a real
  visual defect on five consecutive changes.

### Don't:

- **Don't** introduce an eighth saturated hue, and don't add a place type casually. A
  type now costs a colour: adding one is a palette decision somebody has to argue for,
  not an edit to a list.
- **Don't** write text in `--pp-accent`, and don't letter an accent fill with `ground` or
  with a fixed white — white clears 2.60:1 on the dark ground's purple. Accent *text* is
  `accent-ink`; text *on* the accent is `ink-on-accent`.
- **Don't** fill a control in the chrome with the accent, however primary it feels. The bar
  is on screen at all times and the pins are what the palette was spent on. A control that
  arms, opens or narrows is not committing anything, and the emphasis it seems to want is
  emphasis at the moment nobody is using it. And don't reach for weight instead: bolding one
  tool is the same hierarchy bought more cheaply, and it looks like typography rather than
  like a claim, which is what makes it easy to do without noticing.
- **Don't** use `ink-faint` for text of any kind, placeholders included. It measures
  **2.78:1 on the light ground and 4.02:1 on the dark**, both below WCAG AA. Recessive
  text is `ink-muted` (5.16:1 / 6.48:1); `ink-faint` is for what is drawn, not read.
- **Don't** emit a value the host has to resolve — `var()`, `color-mix()`,
  `currentColor` — into anything native consumes. It occupies correct layout space and
  renders nothing, and no typecheck, lint or non-pixel test will catch it.
- **Don't** add a cross-platform styling runtime, or share a component between the two
  applications. Share token values; a `<div>` and a `<View>` are not the same something.
- **Don't** specify a font weight outside the scale's round hundreds, or a letter-spacing
  or line height in absolute units.
- **Don't** let a bottom bar stop short of the screen edge. The gap fills with whatever
  the bar was clearing.
- **Don't** centre the camera on a point while a sheet covers the map. Use `offsetCenter`.
- **Don't** permanently label every marker on the map. Density here is a text problem,
  not a geometry problem — which is why this system forbids labels rather than requiring
  clustering.
- **Don't** reach for the consumer-travel-app vocabulary: full-bleed hero photography,
  gradient fills, glassmorphism, oversized rounded cards, decorative blur, illustrated
  empty states, or emoji standing in for iconography.
