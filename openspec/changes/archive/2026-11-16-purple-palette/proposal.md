## Why

After a real trip, both the light and the dark mode read as dated: every grey carries a
beige tint, panels barely differ from the background behind them, and the map has almost
no colour of its own. The app should look current without its layout changing.

## What Changes

Colours only. Nothing moves, and no shape, border or spacing changes.

- **BREAKING (brand)** — Purple replaces amber as the highlight colour. Buttons that
  save or create, the selected day, the selected filter and the focus ring turn purple.
- **BREAKING (brand)** — Backgrounds lose their beige tint. Light mode becomes a faint
  lilac with white panels; dark mode becomes a deep aubergine with panels that visibly
  lift off it.
- The map gets recognisably blue water and green parks, on a ground tinted to match the
  interface. Pins stay the strongest colour on it.
- The **Shopping** pin moves from violet to gold, because a violet pin beside violet
  buttons would read as the same thing. The other seven pin colours stay, and so does
  which pin is the quiet one.
- The app icon becomes a purple tile with a white pin. The opening globe and the globe
  shown while the map loads become a purple sphere with darker purple continents.
- The sign-up and password-reset emails take the same colours: a lilac background and a
  purple box around the code, in place of beige and amber.
- The written brand rules that name amber and warm greys are rewritten to say purple and
  purple-tinted greys.

The direction was chosen from a mock of one phone screen, kept in this change as
`mock/directions-mock.html` ("Purple highlight"). Its values are a starting point: the
exact colours are settled in a wider mock first, covering the calendar, the laptop layout
and an error state.

**Not being done:**

- No layout, shape, border, padding or type changes.
- No third mode and no way to pick a colour scheme. Light, dark and follow-the-device stay.
- The emails change colour only. Their wording, their single language and who sends
  them stay as they are; that is #78.
- No change to which pin is quiet and which are prominent.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-mark`: the rule that the icon is "amber-tiled" becomes a rule that it is tiled
  in the highlight colour, whatever that colour is.
- `motion`: the three places that describe the globe as an amber sphere with a dark pin
  describe it in the mark's own colours instead.
- `styling`: adds the rule that the highlight colour must never be mistakable for a pin
  colour. It was a brand note until now, and it is the rule that moved Shopping to gold.

## Impact

- `@pinpoint/tokens`: the colour source and its two generated outputs. Both apps pick
  the new values up from there.
- Icons and launch images, recut by the icon script; the phone needs a fresh native
  build before the new icon and launch image appear.
- `PRODUCT.md` (brand commitments), `DESIGN.md`, `.impeccable/design.json`, and the
  comments across both apps that explain a rule by saying "amber".
- `supabase/templates/` — the two email templates. Supabase keeps its own copy of each,
  pasted into its dashboard by hand, so the hosted copies have to be pasted again.
- People with the app installed see the icon change colour after updating.
