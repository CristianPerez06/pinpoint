## 1. Tokens: themes, typography, and a real derivation

- [ ] 1.1 Restructure `packages/tokens/src/colour.ts` so every colour is a
      `{ light, dark }` pair, and replace the cool neutrals with the warm set
      (ground, surface, surface-muted, surface-sunk, line, line-strong, ink,
      ink-muted, ink-faint)
- [ ] 1.2 Add the amber accent and its text-safe partner — `#E39A2B` / `#F0AE4A` for
      surfaces, `#8A5A0B` / `#F0AE4A` for text — plus the accent wash and ring, and
      restate in the file's comment why the accent may not be a sixth family colour
- [ ] 1.3 Give the five marker families their dark values, keeping the comment that
      explains the deliberate lopsidedness and adding that the ranking holds in both
      themes
- [ ] 1.4 Add the elevation tokens (three shadow levels, per theme) and extend
      `RADIUS` for the softer corners
- [ ] 1.5 Add `packages/tokens/src/type.ts` — the type scale as roles, each with size,
      weight, letter-spacing, line height, and whether numerals are tabular; keep the
      existing comment's reasoning about numbers rather than unit strings
- [ ] 1.6 Add the basemap colour tokens (land, block, road, casing, water, park, label)
      for both themes, so the style patch and the interface read one palette
- [ ] 1.7 Write the derivation script producing the native module (both themes as
      literals) and the web stylesheet (custom properties under `:root` and a
      `prefers-color-scheme` block), each with a generated-file header
- [ ] 1.8 Make the derivation fail rather than emit when a colour is defined for only
      one theme, or when a host-resolved reference would reach the native output
- [ ] 1.9 Add a CI check that regenerates both representations and fails on a diff

## 2. `@pinpoint/map`: icons, geometry, and the style patch

- [ ] 2.1 Change `MarkerTypeDefinition.icon` from an emoji string to a
      `MarkerIconName` union, and replace every entry in `MARKER_TYPES`; update the
      file comment, which currently explains the emoji choice
- [ ] 2.2 Change the marker visual description to carry a family identifier and an
      icon identifier rather than a resolved colour and glyph
- [ ] 2.3 Add the drawn geometry to the description — the teardrop's size and its
      normalised anchor `{ x: 0.5, y: 1 }` — and update `marker-view.test.ts`
- [ ] 2.4 Add `themeStyle(document, theme)`: classify each layer by category from its
      paint properties and source layer, rewrite colours from the basemap tokens, and
      perform no I/O
- [ ] 2.5 Make `themeStyle` throw naming any category that matched no layer, and cover
      that case in a test alongside the happy path
- [ ] 2.6 Add a committed fixture of the upstream positron document for those tests,
      with a note in the test file that a fixture can drift from live and the runtime
      assertion is what actually protects the map
- [ ] 2.7 Replace `styleUrl`'s role: keep the URLs, but have the package expose the
      transformation by name so both applications apply the same one

## 3. Web

- [ ] 3.1 Adopt CSS Modules and import the generated stylesheet in the root layout;
      delete `app/_components/ui.tsx`'s inline style objects as each component moves
- [ ] 3.2 Add Figtree via `next/font/local` with the variable woff2, and apply it as
      the application's font
- [ ] 3.3 Add `lucide-react` and the `Record<MarkerIconName, IconComponent>` mapping;
      confirm the exhaustive record makes a missing entry a type error
- [ ] 3.4 Fetch the style document, pass it through `themeStyle`, and hand the result
      to MapLibre instead of the URL — including the unreachable-style failure, which
      must say what happened rather than leave a blank canvas under correct pins
- [ ] 3.5 Draw the teardrop pin from the shared geometry, using MapLibre's `Marker`
      anchor option rather than an offset written in the app
- [ ] 3.6 Restyle the marker details panel, the marker form, the city bar, place
      search, and the state/notice components against the tokens
- [ ] 3.7 Restyle the login and signup screens
- [ ] 3.8 Re-render the map when the theme changes, without reloading the trip and
      without moving the camera

## 4. Mobile

- [ ] 4.1 Add Figtree via `expo-font` and hold render until the font has loaded
- [ ] 4.2 Add `lucide-react-native` and its mapping, built from the same identifiers
      as web
- [ ] 4.3 Add the `useTheme()` hook over React Native's `useColorScheme()`, returning
      one theme's literals
- [ ] 4.4 Fetch and patch the style, passing the result to
      `@maplibre/maplibre-react-native` as it expects
- [ ] 4.5 Draw the teardrop pin from the shared geometry and the annotation's anchor
- [ ] 4.6 Restyle the map screen, the detail sheet, the overlay note, and login
- [ ] 4.7 Confirm the theme change re-renders the map without moving the camera

## 5. Checks, and looking

- [ ] 5.1 Add the repository script asserting both font files exist and report the
      same family and version, and wire it into CI
- [ ] 5.2 Run `pnpm check:cycles` and confirm `@pinpoint/map` still declares no
      third-party runtime dependencies after the style patch lands
- [ ] 5.3 Open the web application in both themes and confirm every surface changes
      together, including the map
- [ ] 5.4 Open the mobile application in both themes and confirm the same
- [ ] 5.5 Zoom hard on both platforms in both themes and confirm pins hold their
      coordinates throughout, not only after the zoom settles
- [ ] 5.6 Confirm attribution is still visible on both platforms in both themes
- [ ] 5.7 Confirm every marker type renders a distinct icon on both platforms, and
      that an unknown type still renders the fallback
- [ ] 5.8 Break the style fetch deliberately and confirm the failure is reported rather
      than showing pins over a blank canvas
- [ ] 5.9 Run `openspec validate establish-visual-language --strict`
- [ ] 5.10 Replace the `styling` spec's `TBD - created by archiving` purpose in
      `openspec/specs/styling/spec.md`, and tick the matching roadmap loose end
