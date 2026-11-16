/**
 * Colour tokens. Concrete literals, resolved by nobody.
 *
 * Every value here is a hex string — six digits, or eight where the value needs
 * an alpha channel. Both notations are rendered by a browser and by React
 * Native without further interpretation, which is the property that matters: the
 * `styling` spec forbids emitting anything the host resolves at runtime, because
 * native styling passes such a value through uninterpreted and produces an
 * element that occupies correct layout space and renders nothing — invisible to
 * typechecking, to linting, and to every test that does not inspect pixels.
 *
 * `rgba(…)` is deliberately absent even though browsers accept it. React Native
 * accepts it too, and that is exactly the trap: it works until somebody writes
 * `color-mix()` or a custom property beside it and nothing complains.
 *
 * WHY EVERY COLOUR IS A PAIR
 *
 * A colour is meaningless without the ground it is drawn on. Defining one value
 * and deriving the other by inversion produces contrast and destroys meaning —
 * see `MARKER_TYPE_COLOURS` below, where the ranking between the values is the
 * whole point and inversion would scramble it. So each colour is chosen twice,
 * against each ground.
 *
 * Non-colour tokens stay single-valued. Nothing about a spacing step changes
 * with the ground it sits on, and duplicating them would create two places for
 * one value to drift.
 */

export type ThemeMode = 'light' | 'dark'

/**
 * What a person asked for, which is not the same thing as a ground.
 *
 * `ThemeMode` has two values because a colour is drawn on one of two grounds.
 * This has three, because "whichever the device says" is a real answer and the
 * one almost everybody is giving — it is the state both applications are in
 * today, and losing it would be a downgrade for everybody who is happy.
 *
 * The two types are deliberately not merged. A stored `'light'` and a device
 * that merely happens to be light are different facts: the first survives the
 * device changing its mind and the second is the device changing its mind. One
 * type holding both cannot tell them apart, and every consumer that renders a
 * colour would have to handle `'system'`, which is not a ground and has no
 * value to render. `resolveMode` in `./theme` is the one place the three become
 * two.
 */
export type ThemePreference = 'system' | ThemeMode

/** One token, chosen against each ground. */
export interface Themed {
  readonly light: string
  readonly dark: string
}

/**
 * One colour per marker type, and the reason they are not an even palette.
 *
 * These were keyed by *family* until this change, and seven of the sixteen types
 * shared one of them. The map could not tell a castle from a park by colour at
 * all, and the reason it could not was structural: the family set was closed on
 * purpose, so growth in the type list had nowhere to go but the icon. Colour now
 * names the type directly. Adding a type costs a colour, which is what bounds the
 * list — see `@pinpoint/map`'s `marker-type.ts`.
 *
 * WHY THEY ARE NOT EVEN
 *
 * A real wishlist is lopsided. The Kyoto trip this product was first built
 * against held eighteen places, of which **eight were temples** and four were
 * the rest of sightseeing put together — one each of `nature`, `shopping`,
 * `transport` and `stay`, and no `food` at all. If `temple` took a loud colour,
 * eight loud pins would drown the ones that carry information, and the minority
 * is the signal. Finding the one restaurant among eight temples is exactly the
 * question asked at lunchtime.
 *
 * So `temple` is deliberately the most recessive *coloured* value here, and the
 * rest are deliberately prominent. It holds the majority for the same reason
 * `see` did before the families were removed, and `culture` did for the one
 * change in between. Changing that is a product decision, not a palette refresh.
 *
 * Note which way that reasoning runs. The slate belongs to *whichever type holds
 * the majority*, not to sightseeing and not to the type that happens to be
 * called `culture`. When Temple was split back out, the slate went with the
 * temples and `culture` — castles, museums, galleries, a minority — became a
 * prominent value like every other minority. That is the rule being applied to a
 * count, not an exception to it.
 *
 * (The trip those counts come from was a seed migration, deleted in #138. The
 * numbers are read from its last revision in the history; nothing in the
 * database holds them now.)
 *
 * `place` is exempt from that ranking because it is not making a claim. It is the
 * fallback — the type a marker takes when nothing was determined — so it is the
 * least coloured thing on the map rather than the quietest colour on it. A pin
 * meaning *we do not know what this is* should look like it.
 *
 * It is separated from `culture` by hue direction, warm against cool, rather than
 * by lightness. Lightness already means visited: a `place` pin that read as a
 * paler `culture` would be read as one already seen, which is the one misreading
 * this palette cannot afford.
 *
 * THE DARK VALUES ARE CHOSEN, NOT DERIVED
 *
 * The light values were picked against white and several fail outright on a
 * dark ground — `stay` at `#0B5FD0` on a near-black ground is close to
 * invisible. Each dark value is picked against the dark ground instead (it was
 * `#1D1B18` when they were chosen and is `#120F1C` now; every one of them
 * still clears 3:1 against the dark land), and the ranking above is
 * preserved in both: `culture` is still the most recessive, the rest are still
 * prominent. A value that is legible but wrongly ranked does not satisfy this.
 *
 * HOW CLOSE THEY SIT
 *
 * Measured by perceived difference (CIE ΔE2000), not by hue: `temple` and
 * `place` are near-greys, and hue says little about a colour that has almost
 * none. The closest coloured pair is `temple` – `stay` on the dark ground, at
 * 16.9, under the 21.4 of `nature` – `transport` that was long judged
 * acceptable. Left there on purpose: deepening the dark `stay` to part it from
 * `temple` moves it toward the accent by about as much. The full table and the
 * reasoning are in `DESIGN.md`, under the place types.
 *
 * The keys are the marker types defined in `@pinpoint/map`. This package cannot
 * import them — it declares no dependencies, and `@pinpoint/map` depends on it —
 * so the two are tied together by a compile-time completeness check on the map
 * side rather than by an import here.
 */
export const MARKER_TYPE_COLOURS = {
  /**
   * Warm neutral. The null, and deliberately the least coloured pin on the map.
   * Not ranked against the others — see above.
   */
  place: { light: '#8B857A', dark: '#A8A197' },
  /** Muted slate. The quiet majority. */
  temple: { light: '#7C8896', dark: '#98A3B0' },
  /**
   * Deep rose, and the last colour the wheel had room for.
   *
   * It sits at CIE LCh hue 356°, the middle of the only open span left: the
   * stretch between the violet at 310° and `food`'s burnt orange at 44° is 94°
   * wide, and this clears 46° of the violet and 48° of `food`. `nature` against
   * `transport` — the pair already judged acceptable — is 49°.
   *
   * That violet was `shopping`'s when this was chosen. It is the accent's now
   * (`shopping` moved to gold, see below), at the same hue, so the span and
   * both distances are unchanged — only what sits on the far side of it is.
   *
   * **Measured in CIE LCh, which is the instrument.** An earlier draft put this
   * at hue 345° on an OKLCH reading, where the same span looks 100° wide and
   * centred differently. The two spaces disagree about violet by about 15°, and
   * on the OKLCH figure the value came out 33° from `shopping` — thin, and the
   * palette mock said so. `mock/palette.html` measures in CIE LCh throughout, as
   * does every threshold this palette was already judged against, so a value
   * argued in one space and checked in another is not comparable to anything.
   *
   * Prominent on purpose. `culture` is a minority type — castles, museums,
   * galleries — so the ranking above wants it to stand out, and being more
   * legible than the slate it replaced is correct rather than a mistake.
   */
  culture: { light: '#B43F72', dark: '#E57DA5' },
  /**
   * Leaf green, pushed yellow rather than blue. The distance it has to keep is
   * from `transport`'s teal, and it has to hold its ground on the basemap's own
   * park fill — which is where a viewpoint usually is.
   */
  nature: { light: '#3F7A32', dark: '#6FB45C' },
  /** Burnt orange. */
  food: { light: '#D2451E', dark: '#F0653A' },
  /**
   * Gold, and it was violet until the accent became purple.
   *
   * A violet pin beside violet buttons and a violet selected row reads as the
   * same thing, so the type moved rather than the accent (`styling`, *The accent
   * cannot be mistaken for a marker type*). Gold is the hue amber left free.
   *
   * Placed by measurement in CIE LCh, at 86.5° light and 87.5° dark: 43° from
   * `food`'s burnt orange and 48°–49° from `nature`'s green, which is the
   * spacing the rest of the wheel already holds. The light value is a deep
   * mustard because a brighter gold measured 2.88:1 against the light land,
   * under the 3:1 floor a pin has to clear; this one is 3.58:1, and the white
   * glyph on it is 4.04:1.
   */
  shopping: { light: '#9C7A00', dark: '#DDB43A' },
  /** Blue. */
  stay: { light: '#0B5FD0', dark: '#4A8FE8' },
  /** Teal. */
  transport: { light: '#00857A', dark: '#16A99C' },
} as const satisfies Record<string, Themed>

export type MarkerTypeColourKey = keyof typeof MARKER_TYPE_COLOURS

/**
 * The pin's glyph, drawn on top of a family colour.
 *
 * White on the light theme, against eight values chosen to carry it. On the dark
 * theme the pins are the lighter element and the glyph inverts with them: white
 * on `temple`'s dark value clears about 2.6:1, which is thin at a 16px stroked
 * icon, where near-black clears comfortably against all eight.
 *
 * This is the one place the two themes differ in kind rather than in value, and
 * it follows from the types being lifted rather than darkened.
 */
export const MARKER_FOREGROUND: Themed = { light: '#FFFFFF', dark: '#120F1C' }

/**
 * The continents on the mark's globe: the sphere's purple taken darker — the
 * accent's own hue (310°) at about two thirds of its lightness, so the globe
 * reads as one colour in two depths rather than as two colours.
 *
 * Not themed, because the mark carries its own ground and is the same on both
 * (`product-mark`). It lived as a literal in the phone's opening while that was
 * the only thing drawing it; the waiting area's globe draws it too, so it is a
 * shared value now and belongs here.
 */
export const MARK_LAND = '#4E1C99'

/**
 * Neutrals and the accent, used by both applications for the surfaces around
 * the map.
 *
 * The neutrals carry a slight purple bias rather than being a pure grey ramp —
 * a faint lilac on the light ground, a deep aubergine on the dark one. That is a
 * choice and not an accident: it is what makes the accent read as chosen rather
 * than dropped onto a stock palette, and the basemap below is tinted to match so
 * the map and the interface share one ground instead of looking stapled
 * together.
 *
 * They were warm — beige on light, brown-black on dark — until `purple-palette`.
 * After a real trip both modes read as dated: every grey carried the same tint,
 * the ground and the surfaces above it were a step apart that hardly showed, and
 * the map had almost no colour of its own. The bias moved to the accent's hue,
 * and the steps between ground, surface and fill were opened so a panel lifts
 * off what is behind it.
 */
export const COLOUR = {
  /** Behind everything. */
  ground: { light: '#F6F4FB', dark: '#120F1C' },
  /** Rails, cards, sheets — anything that sits above the ground. */
  surface: { light: '#FFFFFF', dark: '#1D192B' },
  /** Fields, hover states, chips. */
  surfaceMuted: { light: '#EFEBF8', dark: '#2A243C' },
  /** Recessed: sticky headers, footers, anything that reads as behind. */
  surfaceSunk: { light: '#ECE8F5', dark: '#16131F' },
  /** The hairline between rows. */
  line: { light: '#E3DEF0', dark: '#342E49' },
  /**
   * A border meant to be seen — a control's edge rather than a divider.
   *
   * Clears the 3:1 non-text floor against `surface`, `ground` and
   * `surfaceMuted` on both grounds, because it is what shows where a control
   * is (`styling`, *A control's edge clears the non-text contrast floor*). It
   * was `#D3D0C8` / `#443F38`, about 1.5:1, which made every outlined control
   * an edge you had to already know was there (#124). It takes the palette's
   * own purple-grey, and on the light ground it is kept darker than the bare
   * floor needs — 3.41:1 on `surfaceMuted`, the tightest of the three — because
   * an edge that only just clears reads as faint on a real screen. For a line
   * that only separates two things, use `line`.
   */
  lineStrong: { light: '#827C92', dark: '#7A7391' },
  /** Names and values. */
  ink: { light: '#1A1626', dark: '#F2F0F8' },
  /** Notes, counts, labels. */
  inkMuted: { light: '#625C72', dark: '#A39DB5' },
  /**
   * Not text. A hairline that needs to be darker than `line`, a border on
   * hover — anything drawn rather than read.
   *
   * It said "placeholders, and text that is deliberately hard to notice" and
   * was used for exactly that: every uppercase field label, every placeholder,
   * every dismiss glyph, on both platforms. It measured **2.78:1** on the light
   * ground and **4.02:1** on the dark (2.46:1 and 3.60:1 in the purple
   * palette), so all of it sat under the 4.5:1 floor — and "deliberately hard to
   * notice" is what made that read as intent instead of as a defect.
   *
   * Deliberately recessive is a real thing to want, and `inkMuted` already is
   * one: 5.85:1 light and 7.24:1 dark on the ground, clearly quieter than `ink`
   * at about 16:1 and legible. Recessive text goes there. What stays here is
   * what is not text.
   */
  inkFaint: { light: '#A19BB0', dark: '#6F6886' },

  /**
   * The accent, and why it is purple.
   *
   * It carries the primary action, the current selection, and the focus ring,
   * so it must be distinguishable from all eight marker types at a glance — an
   * accent that reads as a ninth type would make the map's own colour
   * vocabulary ambiguous (`styling`, *The accent cannot be mistaken for a
   * marker type*).
   *
   * It was amber until `purple-palette`, which was the person's choice of a
   * more current look. Purple took the hue `shopping` held (310° in CIE LCh),
   * and `shopping` moved to gold, so the accent sits exactly where a type used
   * to and every distance around it is one the palette already lived with:
   * 46°–49° from `culture`'s rose, and 22° light / 30° dark from `stay`'s blue —
   * which is what `shopping` and `stay` were apart. Blue is the one to watch:
   * the two part on chroma and on lightness as well as on hue, and the accent
   * is never drawn as a pin.
   *
   * Unlike amber it is a dark fill on the light ground and a light one on the
   * dark ground, which is why `inkOnAccent` below is a pair of opposites now.
   */
  accent: { light: '#7A35DC', dark: '#B48CFA' },
  /**
   * The accent as text, and this is not interchangeable with `accent`.
   *
   * Anything written in the accent uses this. It is the same hue taken one step
   * further from its ground than the fill — deeper on light, paler on dark — so
   * that it reads on the selected-row wash as well as on a surface: 6.92:1 and
   * 7.47:1 on `accentWash`, where the fill itself would manage about 5.3:1.
   *
   * While the accent was amber the two **converged** on the dark ground, and a
   * state that filled with `accent` and kept `accentInk` lettering painted a
   * word out at 1:1. In purple they differ on both grounds. The rule that came
   * out of that stands regardless: a state that fills with the accent letters
   * itself with `inkOnAccent`, never with this.
   */
  accentInk: { light: '#6227C0', dark: '#C9B0FF' },
  /**
   * Text drawn *on* the accent, which is the opposite problem to `accentInk`.
   *
   * The purple is a dark fill on the light ground and a light one on the dark
   * ground, so the ink over it is white on light (6.23:1) and near-black on
   * dark (7.18:1). White on the dark ground's accent would be 2.60:1.
   *
   * It was a pair of near-neighbours while the accent was amber, which is light
   * on both grounds, and the reason this token exists is the same either way:
   * the ground a button is standing on is not the thing that letters it. A
   * fill is a different surface from a ground, and a value chosen against one
   * makes no claim about the other (`styling`, *Text is chosen against the
   * surface it is drawn on*). Under amber, lettering in `ground` was legible on
   * one theme and 2.26:1 on the other.
   */
  inkOnAccent: { light: '#FFFFFF', dark: '#140F24' },
  /** Behind a selected row. */
  accentWash: { light: '#F0E9FD', dark: '#2E2452' },
  /** The focus ring. Alpha, so it reads over a surface or over the map. */
  accentRing: { light: '#7A35DC52', dark: '#B48CFA66' },
  /**
   * Laid over a screen while something raised over it is the one being used —
   * a sheet that sets the screen back, a centred calendar, a place opened over
   * the trip's calendar. Not for anything drawn on a surface.
   *
   * Darkening on both grounds, never the ground's own colour: a wash in the
   * ground fades the screen toward the surface raised over it, and the two then
   * read as one. A pair, though the halves start equal, so the dark ground can
   * be taken deeper on its own if black at this depth is too faint over it.
   */
  scrim: { light: '#00000063', dark: '#00000063' },

  /** Failure. Distinct from every type colour, so a broken map never reads as a marker. */
  danger: { light: '#B3261E', dark: '#F2857C' },
  dangerSurface: { light: '#FCEDEE', dark: '#3A2029' },
} as const satisfies Record<string, Themed>

/**
 * The basemap's own colours.
 *
 * These are not decoration. `@pinpoint/map` rewrites the upstream style
 * document with them, which is how the map ends up sharing the interface's
 * purple-tinted ground instead of arriving as a stranger's grey. They live here rather
 * than in the map package for the same reason every other colour does: one
 * place a colour is written.
 *
 * Values are chosen against positron's structure — a near-greyscale style whose
 * quietness is what lets the marker pins be the only strong colour on screen.
 *
 * Quiet is not the same as colourless, which is what the warm set had become:
 * water a pale grey, parks a grey-green, and a map that read as beige. Since
 * `purple-palette` water is recognisably blue and parks recognisably green,
 * still at low chroma (about 11 for a park on either ground) so that the area
 * they cover does not out-shout the pins.
 */
/**
 * HOW THESE VALUES WERE CHOSEN, AND THE MISTAKE THEY CORRECT
 *
 * A basemap is read by the *separation* between its categories, not by any one
 * colour. The first attempt at the dark set was picked by eye at a contrast
 * ratio that looked reasonable — and rendered a map that was, at 1:1, a black
 * rectangle. Every category was there and drawing; none of them were
 * distinguishable.
 *
 * Contrast ratio is the wrong instrument at this end of the range. It is near
 * 1.0 between any two dark colours by construction, so it reported the dark set
 * as no worse than the light one. Perceived lightness — CIE L* — is uniform,
 * and it showed the real problem immediately: water sat 1.5 L* from land, where
 * the light set separates them by 9.
 *
 * So every value below is chosen for its L* distance from `land`, with a floor
 * of about 4.5 for a fill and more for anything linear. Water additionally
 * carries a cool cast and park a green one, because a hue difference reads at
 * distances where a lightness difference alone does not.
 */
export const BASEMAP_COLOUR = {
  /** Everything that is not water, park, road, or building. */
  land: { light: '#F2F0F7', dark: '#171423' },
  /** Building footprints and blocks. */
  block: { light: '#E6E2EF', dark: '#211D30' },
  /** The road surface itself. The most prominent thing after labels. */
  road: { light: '#FFFFFF', dark: '#3B3552' },
  /** The line around a road, which is what separates it from the land. */
  roadCasing: { light: '#DAD5E6', dark: '#2A2539' },
  water: { light: '#C3D4F0', dark: '#152A4D' },
  /**
   * Park and woodland.
   *
   * Kept close to the land in both lightness *and* chroma, which is the part
   * that was got wrong first. A green at chroma 16 measured as a modest +7.8 L*
   * from the land and still swamped the map — because at city zoom woodland
   * covers most of the viewport, and a large area of saturated colour dominates
   * regardless of how its lightness measures. Judge a fill by the area it will
   * actually cover, not by a swatch.
   */
  park: { light: '#D9E8D5', dark: '#1A2D26' },
  /**
   * Administrative borders.
   *
   * Their own value rather than the label colour, which is what they took at
   * first — and it made prefecture boundaries the loudest thing on the map,
   * louder than the roads somebody is actually navigating by. They sit between
   * the land and a road casing: present when looked for, invisible otherwise.
   */
  boundary: { light: '#DCD7E6', dark: '#2C2740' },
  /** The map's own text. Deliberately quiet — our markers are the subject. */
  label: { light: '#8D879C', dark: '#837C99' },
} as const satisfies Record<string, Themed>
