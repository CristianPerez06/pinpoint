## Why

Four places in the interface drew text below the contrast floor, and none of them
were reported by anything. They came out of writing the design system down rather
than out of looking for defects, which is the third time this project has found a
visual failure through a route that was not a test.

They are two mistakes, not four.

**The first is a value chosen against the wrong thing.** A primary button is filled
with `accent` and lettered with `ground`. That reads as correct — the ground is what
the surface is standing on — and it is right on exactly one theme. On the dark ground
`ground` is near-black over amber and clears 9.35:1; on the light one it is near-white
over the *same* amber and clears 2.26:1. Web had already met this and solved it with a
hand-picked `#241703` sitting as a literal in two stylesheets. Mobile could not read
that literal and guessed.

The sharp version of the same mistake is `Clear` on hover. It fills with `accent` and
keeps its `accent-ink` lettering — and **`accent-ink` and `accent` are the same value
on the dark ground.** The pair converges by design, because once the bright amber is
already the readable one there is nothing to take down. So hovering `Clear` in the dark
theme painted `#F0AE4A` on `#F0AE4A` and the word disappeared under the pointer. At
1:1 it is not thin, it is absent.

**The second is a token whose description invited the misuse.** `inkFaint` said
"placeholders, and text that is deliberately hard to notice" and was used for exactly
that: every uppercase field label, every placeholder, every dismiss glyph, on both
platforms. It measures 2.78:1 on the light ground and 4.02:1 on the dark. Deliberately
hard to notice is a real thing to want, and it is what made a whole class of unreadable
text read as intent instead of as a defect.

```
                                    before        after
mobile primary button (light)       2.26:1   →    7.44:1
Clear on hover (dark)               1.00:1   →    9.35:1
Clear on hover (light)              2.52:1   →    7.44:1
ink-faint as text (light / dark)  2.78/4.02  →  5.16/6.48
```

## What Changes

**A token for text drawn on the accent.**

- `COLOUR.inkOnAccent` is added — `{ light: '#241703', dark: '#171614' }`. Light is a
  very dark brown of the accent's own hue rather than a neutral, because a neutral over
  amber reads as a printing error. Dark is `ink`'s own ground, which is what native was
  already drawing and is the better of the two values it had.
- It is the second token after `MARKER_FOREGROUND` whose two values are near-neighbours
  rather than opposites, and for the same reason: the thing underneath it is light on
  both grounds.
- Web's two `#241703` literals and mobile's one are deleted in favour of it. The value
  existed and had nowhere to live, which is why it was copied instead of read.

**`Clear` letters its hover fill.** `.clear:hover` gains `color: var(--pp-ink-on-accent)`.

**`inkFaint` stops being a text colour.** Nine rules on web and fourteen call sites on
mobile move to `inkMuted`, which is 5.16:1 / 6.48:1 and still clearly quieter than
`ink` at 16.8:1. The token's own comment is rewritten to say what it is now for —
a hairline that needs to be darker than `line`, a border on hover, anything drawn
rather than read.

**Not changing.** The two `:hover` border-colors in `interest.module.css` keep
`ink-faint`. They are not text, and they strengthen a resting border that is already
there — this change does not open the separate question of whether `line-strong` clears
the 3:1 non-text floor for a control's boundary, which it does not, and which is worth
its own change.

**Not changing.** No palette value moves. Retuning `inkMuted` and `inkFaint` so that all
three text values clear the floor was the alternative, and it was rejected: it repaints
every muted string in both applications to fix a misuse, and the ranking between the
three was chosen deliberately.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `styling`: adds **Text is chosen against the surface it is drawn on** and **A token
  used for text clears the text contrast floor**.

  The spec already requires that every colour is defined for both grounds and that each
  value is chosen against the ground it will be drawn on. Both were satisfied here and
  neither caught any of this, because *ground* was read as the theme's background and
  the failing text was drawn on a fill instead. It also already requires that a theme
  pair preserve the relationships the palette encodes — and the pair that broke `Clear`
  preserved its relationship perfectly by collapsing to one value, which is what the
  requirement asks for and what made the composition unreadable.

  So the gap is not that a value was chosen badly. It is that nothing said *which*
  surface a value is chosen against, and nothing said a token may be too faint to letter
  with. PRODUCT.md now records WCAG 2.2 AA on both platforms; this is where that stops
  being an aspiration.

## Impact

Two applications and one package. No dependencies, no migration, no behaviour change.

- `packages/tokens/src/colour.ts` — `inkOnAccent` added; `inkFaint`'s comment rewritten.
- `packages/tokens/src/generated/{tokens.css,native.ts}` — regenerated. Two lines of CSS,
  two of native.
- `apps/web/app/_components/ui.module.css` — `.primary` reads the token; `.label` and
  `.control::placeholder` move to `ink-muted`.
- `apps/web/app/_components/filter-bar.module.css` — `.clear:hover` letters its fill;
  `.caret` and the inert `.clear` move to `ink-muted`.
- `apps/web/app/(auth)/auth.module.css` — `.submit` reads the token; `.label` moves.
- `apps/web/app/_components/{trip-bar,city-bar,marker-form,marker-details,place-search}.module.css`
  — labels, dismiss glyphs, placeholder and the absent-value text move to `ink-muted`.
- `apps/mobile/components/ui.tsx` — `Button`'s primary ink reads the token.
- `apps/mobile/app/login.tsx` — the `#241703` literal deleted; labels and placeholders move.
- `apps/mobile/components/{interest,marker-details,menu-sheet,place-search,trip-workspace}.tsx`
  — labels, glyphs and the inert `Clear` move to `ink-muted`.

**Verified by looking, again.** The full CI set is green, and was green over every one of
these defects before the change. The dark-theme `Clear` was confirmed in a browser by
applying a filter and hovering it, and the resolved values read back out of the live DOM:
`accentInk` and `accent` really are both `#f0ae4a` there, and `Clear` now letters at
`#171614`. Light was verified by measurement only.
