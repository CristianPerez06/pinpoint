---
name: Pinpoint
description: A warm, quiet planning surface where the map and the interface share one ground and five saturated pins are the only strong colour on screen.
colors:
  ground: "#FBFAF8"
  surface: "#FFFFFF"
  surface-muted: "#F3F2EF"
  surface-sunk: "#EFEDE8"
  line: "#E4E2DC"
  line-strong: "#D3D0C8"
  ink: "#1A1917"
  ink-muted: "#6E6A63"
  ink-faint: "#9C978E"
  accent: "#E39A2B"
  accent-ink: "#8A5A0B"
  accent-wash: "#FBF1DF"
  accent-ring: "#E39A2B61"
  ink-on-accent: "#241703"
  danger: "#B3261E"
  danger-surface: "#FCEDEC"
  family-see: "#7C8896"
  family-eat: "#D2451E"
  family-buy: "#8A3FFC"
  family-sleep: "#0B5FD0"
  family-move: "#00857A"
  marker-foreground: "#FFFFFF"
  map-land: "#EFEEE9"
  map-block: "#E3E1D9"
  map-road: "#FFFFFF"
  map-road-casing: "#DAD6CC"
  map-water: "#CBD6DA"
  map-park: "#E1E5DC"
  map-boundary: "#DEDAD0"
  map-label: "#9A948B"
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

**Creative North Star: "The Warmed Basemap"**

Most map products arrive as two designs stapled together: somebody else's grey
cartography, and an interface floating above it in an unrelated palette. Pinpoint
refuses that seam. The upstream style document is rewritten before either renderer sees
it, so the land, the roads and the water are drawn in the same warm neutrals as the
panels sitting on top of them. The map is not a backdrop the interface stands on. It is
the ground, and everything else is a surface lifted off it.

Everything follows from making that ground quiet. The neutrals carry a warm bias rather
than being a pure grey ramp; the chrome is muted fills, hairlines and pill-shaped
controls that state nothing until touched; the basemap's own labels are deliberately
recessive. All of that restraint exists to buy one thing — five saturated marker
families that are the only strong colour anywhere on screen. When somebody scans this
interface, the pins are what they see, because nothing else is competing.

The mood is **warm, quiet and precise**. Warm in the literal sense that there is no
neutral grey in the system. Quiet because the interface is a tool used while deciding
something else. Precise in the fractional type sizes (13.5px, 12.5px), the tabular
figures, the hairline dividers, and the fact that every value was chosen against the
ground it renders on rather than derived from its opposite. This must never read as a
generic consumer travel app: no full-bleed hero photography, no gradient buttons, no
oversized rounded cards, no illustrated empty states. The radius range stops
deliberately short of that look.

**Key Characteristics:**

- One warm ground shared by the map and the interface, never two palettes meeting.
- Five saturated marker families, ranked by deliberate prominence, as the only strong colour.
- Amber as the single accent, chosen so it can never be mistaken for a sixth family.
- Every colour chosen twice, once against each ground; no theme is derived from the other.
- One typeface doing all the work, at eight named roles.
- Depth measured as distance from the map, not applied as decoration.
- Controls quiet at rest, responsive on contact.

> **The token modules are normative, not this file.** Every value here is derived from
> `packages/tokens/src/` and generated into `src/generated/`. This document explains the
> system so new work stays inside it; when the two disagree, the token source wins and
> this file is stale.

## Colors

A warm neutral ramp with exactly one accent, holding five saturated families that belong
to the data rather than to the interface. Values in the frontmatter are the **light**
ground; each colour's dark counterpart is given below, because it is a chosen value and
not a derivation.

### Primary

- **Signal Amber** (dark ground: `#F0AE4A`): The single accent. It carries the primary
  action, the current selection and the focus ring — and it is amber specifically
  because it must be distinguishable from all five marker families at a glance. An
  accent that read as a sixth family would make the map's own colour vocabulary
  ambiguous. Amber is nowhere near slate, orange-red, violet, blue or teal, and it is
  warm against a near-greyscale basemap.
- **Deep Amber Ink** (dark ground: `#F0AE4A`): Amber *as text*, and not interchangeable
  with the accent. The accent itself clears about 2:1 on white and is unreadable as
  type. On the dark ground the relationship inverts — the bright amber is already the
  readable value — so the pair converges to one value there.
- **Amber Wash** (dark ground: `#33291A`): Behind a selected row, and the fill of any
  control declaring an active state. Always paired with Deep Amber Ink.
- **Amber Ring** (dark ground: `#F0AE4A6B`): The focus ring and the pin's selection
  halo. Carries alpha deliberately, so it reads correctly over a surface *and* over
  cartography.
- **Ink on Amber** (dark ground: `#171614`): Text sitting directly *on* the accent —
  the opposite problem to Deep Amber Ink. Amber is a light surface on both grounds, so
  the ink over it is dark on both; this is the second token, after Pin Glyph, whose two
  values are near-neighbours rather than opposites. Light is a very dark brown of the
  accent's own hue rather than a neutral, because a neutral over amber reads as a
  printing error (7.44:1). Dark is Ink's own ground (9.35:1).

### Secondary — The Marker Families

Five fixed families, one colour each, and their **relative prominence is a product
decision rather than a palette choice**. A real wishlist is lopsided: the seeded Kyoto
trip is fourteen `see` against one each of the rest. If `see` took a loud colour,
fourteen loud pins would drown the four carrying the information somebody is actually
looking for. The minority is the signal.

- **Quiet Slate** — `see` (dark: `#98A3B0`): The deliberate majority, deliberately the
  most recessive value in the system.
- **Burnt Orange** — `eat` (dark: `#F0653A`)
- **Violet** — `buy` (dark: `#A97BFF`)
- **Deep Blue** — `sleep` (dark: `#4A8FE8`)
- **Teal** — `move` (dark: `#00857A` → `#16A99C`)
- **Pin Glyph** — `marker-foreground` (dark: `#171614`): White on light, near-black on
  dark. This is the one place the two themes differ in *kind* rather than in value, and
  it follows from the families being lifted rather than darkened for the dark ground.

### Tertiary — The Basemap

Not decoration: `@pinpoint/map` rewrites the upstream style document with these, which
is the entire North Star made literal. Chosen against Positron's structure, a
near-greyscale style whose quietness is what lets five saturated pins be the only strong
colour on screen.

- **Map Land** (dark: `#1A1815`), **Map Block** (dark: `#262218`), **Map Road** (dark:
  `#3D372D`), **Map Road Casing** (dark: `#2C271E`), **Map Water** (dark: `#16242C`),
  **Map Park** (dark: `#1F241F`), **Map Boundary** (dark: `#2A251E`), **Map Label**
  (dark: `#8A8378`).

### Neutral

- **Warm Paper** — `ground` (dark: `#171614`): Behind everything.
- **Raised White** — `surface` (dark: `#201E1B`): Rails, cards, sheets, menus.
- **Muted Fill** — `surface-muted` (dark: `#2A2724`): Fields, hover states, chips. The
  resting fill of nearly every control.
- **Sunk Fill** — `surface-sunk` (dark: `#1B1A17`): Anything that reads as *behind* —
  sticky headers, footers.
- **Hairline** — `line` (dark: `#34302B`): The divider between rows.
- **Stated Edge** — `line-strong` (dark: `#443F38`): A border meant to be seen — a
  control's edge rather than a divider.
- **Ink** — `ink` (dark: `#F2F0EC`): Names and values. 16.8:1 on the light ground.
- **Muted Ink** — `ink-muted` (dark: `#A09A91`): Notes, counts, secondary labels.
  5.16:1 light, 6.48:1 dark.
- **Faint Ink** — `ink-faint` (dark: `#7C766D`): **Not text.** A hairline that needs to
  be darker than Hairline, a border on hover — anything drawn rather than read. It
  measures 2.78:1 on the light ground and 4.02:1 on the dark, both under the 4.5:1 floor,
  so recessive *text* goes to Muted Ink instead, which is already clearly quieter than Ink
  and still legible.
- **Danger** — `danger` (dark: `#F2857C`) and **Danger Surface** — `danger-surface`
  (dark: `#33211F`): Failure. Chosen distinct from every family colour, so a broken map
  never reads as a marker.

### Named Rules

**The Sixth Family Rule.** There are exactly five colour families and one accent. Never
introduce a new saturated hue into the interface: any colour a person could mistake for
a marker family breaks the map's vocabulary. New *types* join an existing family; they
never bring a colour.

**The Ranking Rule.** `see` is the most recessive value in both themes and the other four
are prominent in both. A dark value that is legible but wrongly ranked does not satisfy
this system. Changing the ranking is a product change, not a palette refresh.

**The Amber Pair Rule.** Never write text in `accent`. Anything amber and legible uses
`accent-ink`, and anything amber and filled uses `accent-wash` beneath it. The single
exception is `ink-on-accent` for text sitting on the accent itself.

**The Converged-Pair Rule.** `accent-ink` and `accent` are the *same value* on the dark
ground — the pair converges once the bright amber is already the readable one. So any
state that fills with `accent` must also change its lettering, or it paints amber on
amber at 1:1. Filling with the accent means lettering with `ink-on-accent`, always.

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
Anything whose text varies — a trip's name, a city's, a button with two labels — is
given a fixed width and truncates inside it. A control that sizes itself moves every
control after it, so switching city or arming the map slid search, drop and filter
sideways; the things a person aims at repeatedly must not move because a word somewhere
else changed length. A short name therefore leaves air before its chevron, which is what
a picker looks like, and the space costs nothing in a bar that had most of its width
empty. The full text is in what the control opens.

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

**Responsive:** the web bar holds one row down to **1024px**, below which the tools take
a line of their own and the scope keeps the first with the account. That number is
derived rather than picked: what cannot shrink in the bar — the two fixed scope names,
the drop slot, the filter, the account, the gaps and the padding — comes to about 764px,
and a search field stops being one at about 240px, so the single row runs out around
1004px. Below **700px** the chrome takes its phone shape, which is an arrangement rather than a
narrower version of the bar: the trip's name and the city stack on two lines with a menu
of rare actions at the far end, the map takes everything under them, and search, drop and
filter become a toolbar standing on the bottom edge. Three bands, therefore — one bar, a
wrapped bar, and the phone's shape — and the phone's is the only one of the three that
changes what the controls *are* rather than where they sit.

That last number is chosen rather than derived, and it is worth saying so. 1024 is
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

- **sm** (`0 1px 2px #1A19170F`; dark `#00000066`): A control, or a row lifted off its surface.
- **md** (`0 4px 12px #1A19171A`; dark `#00000075`): A card, a sheet header, anything that floats.
- **lg** (`0 12px 32px #1A191729`; dark `#00000094`): A panel over the map.
- **pin** (`0 2px 5px #1A19174D`; dark `#0000008C`): A pin against cartography.

### Named Rules

**The Absent-Light Rule.** Dark-theme shadows are near-black at a higher alpha, never the
light theme's warm ink lightened. On a dark ground a shadow works by absence of light,
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
- **Primary:** Signal Amber fill with Ink on Amber text and an `sm` shadow; hover deepens
  the shadow to `md`. Never `ground` and never white: on the dark theme `ground` is
  near-black over amber and reads fine, and on the light one it is near-white over the
  same amber at 2.26:1.
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
- **Toggle pill:** Same construction, holding a checkbox tinted with the accent.
- **Tag:** Muted Fill with Muted Ink at 3×9, `note` type. A family tag inverts to the
  family colour with the pin glyph foreground.
- **Interest choice:** Outlined in Stated Edge with Muted Ink at rest; **active** is
  Amber Wash with a Deep Amber Ink border and text. Never the raw accent.
- **Filter `Clear`:** two states of one permanent control. Live is Amber Wash with a
  Signal Amber border and Deep Amber Ink text; hovering fills with Signal Amber and the
  lettering switches to Ink on Amber. Inert is transparent with Muted Ink at the control
  weight — the border, the fill and the weight carry the difference, so the colour never
  has to go below the contrast floor to say it.

### Cards & Panels

- **Corner:** 14px. **Background:** Raised White. **Border:** 1px Hairline.
- **Shadow:** `lg`, because they sit over cartography.
- **Padding:** `md` (16px). **Width:** 328px floating, 340px hanging as a detour.
- Panels scroll internally at `max-height: 70%`; the page never scrolls.

### Inputs & Fields

- **Style:** Muted Fill, transparent 1px border, 10px radius (pill for search), 8×11
  padding.
- **Focus:** Fills to Raised White, border becomes Signal Amber, plus a 3px Amber Ring
  glow. The field brightens as it activates rather than dimming its surroundings.
- **Error:** Border becomes Danger and the message sits beside the field, not only in a
  summary — a six-field form with one message at the top makes the person hunt for the
  offender.
- **Label:** `label` role, uppercase, in Muted Ink on both platforms.
- **Native fields take vertical padding rather than a fixed height**, so a larger system
  text size grows the field instead of clipping what is in it.

### Navigation & Chrome

- **The mark:** a 9px accent dot with a 3px Amber Ring halo. The dot *is* the mark — a
  pin reduced to the point it names, in the one colour that is not a marker family. The
  full wordmark, "pinpoint" at 16.5px/800/−0.032em, is for signed-out screens.
- **Web header:** it *is* the bar — the dot, the trip name and the city as menus, the
  session's three tools, and the account at the far end holding what is about the person
  rather than the trip. The wordmark's letters are not in it: inside the application they
  say nothing the reader does not know, and the trip's name answers a real question.
- **Phone header:** the same dot, the trip name at `title`, and a menu holding rare
  actions. The trip name is the only element that yields, so a long name truncates
  instead of pushing the menu off.
- **Phone bottom bar:** the map owns the edge; the row is only what stands on it.
  Frequent controls only.

### The Focus Ring

One ring for the whole application: `2px solid` Signal Amber at `2px` offset with an
`sm` radius, on `:focus-visible` rather than `:focus` so a mouse click leaves nothing
behind while keyboard navigation always shows one.

### Signature Component — The Pin

The system's one piece of real iconography and the only place saturated colour is
allowed. A 32×42 teardrop filled with its family colour, a 15px stroked glyph in the
marker foreground centred on the head, and a `pin` drop-shadow following the outline.

- **Selected:** scales to 1.2 from a `50% 100%` origin over 0.18s on a
  `cubic-bezier(0.2, 0.8, 0.3, 1)`, and the Amber Ring halo fades in behind it.
- **Draft (unsaved):** the same silhouette in Raised White with a 2px dashed Ink stroke
  and a plus glyph, dropping in over 0.42s on an overshooting
  `cubic-bezier(0.2, 1.2, 0.4, 1)`. Provisional reads as provisional.
- **Count badge:** top-right, 18px, Ink on Ground with a 2px Map Land ring, tabular
  figures. The ring is what separates it from tiles.
- **Visited tick:** bottom-left, same construction, deliberately opposite the badge
  because a place can be both visited and one of several on one point.

### States

- **Loading:** a 20px spinner, 2px Hairline ring with a Signal Amber top edge, 0.8s
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
  reserve the raw `accent` for fills, the focus ring, and the pin halo.
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

- **Don't** introduce a sixth saturated hue. New marker types join an existing family and
  bring an icon, never a colour.
- **Don't** write text in `--pp-accent`, and don't letter an accent fill with `ground` or
  with white — white clears 2.26:1 on it. Amber *text* is `accent-ink`; text *on* amber is
  `ink-on-accent`.
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
