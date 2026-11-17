## Context

See proposal.md for why. Every colour lives once in `packages/tokens/src/colour.ts` as a `{ light, dark }` pair and is generated into CSS custom properties (web) and literals (native). Raised surfaces in both apps use `surface` with a `line` border. On the web the shared menu panel, the place card/form panel, the search results and the map note use it; on the phone each sheet sets the same pair inline (there is no shared sheet surface), and the place form is the one exception, filled with `ground`.

## Goals / Non-Goals

**Goals:** the dark surface family moves up one step together; one new outline colour for things raised over the map; the rule is held by tests.

**Non-Goals:** shadows, the map's own colours, the map controls' edges, and the light theme.

## Decisions

**Move the dark surface family as a set, not `surface` alone.** Lifting only `surface` would put it level with the selected-row wash and the danger fill (1.04:1 and 1.01:1), and the control edge would drop under its 3:1 floor on fields. New dark values, measured against the existing tests:

| Token | Today | New | Checks |
|---|---|---|---|
| `surface` | `#1D192B` | `#2D2844` | 1.29:1 over land; lighter than land, blocks, water, parks |
| `surfaceMuted` | `#2A243C` | `#37314F` | `inkMuted` 4.69:1, `danger` 4.91:1 |
| `line` | `#342E49` | `#423C5D` | hairline, 1.36:1 on surface |
| `lineStrong` | `#7A7391` | `#8A83A2` | 3.90 / 3.41 / 5.27 on surface / muted / ground |
| `accentWash` | `#2E2452` | `#3A2C66` | `inkMuted` 4.65:1, `accentInk` 6.43:1 |
| `dangerSurface` | `#3A2029` | `#4C2735` | `danger` 5.11:1 |

`ground` and `surfaceSunk` stay: the page background behind cards does not need to move, and sunk is meant to read as behind.

**A new token for the outline, `panelEdge`: light `#E3DEF0`, dark `#5E5680`.** The light value equals today's `line`, so light mode is unchanged. Reusing `lineStrong` was the alternative; it is the control-edge token with its own 3:1 rule, and a panel outline is a different job — tying them together means the next change to one moves the other. `line` cannot do it: on the new dark surface it is meant to be faint. The dark value is lighter than the surface (2.08:1) and every non-label map colour, including roads.

**Which elements take `panelEdge`.** Only surfaces raised over the map: web `.menuPanel` and its phone-width sheet form, `ui.module.css` `.panel` (place card and form), search results, map note (`states.module.css` `.note`); phone sheets (menu, filter, nearby, city, trip, people, attribution, handoff), place card, place form, overlay note. Dividers *inside* them keep `line`. The same components reused off the map (calendar) take the outline too — they are the same component, and a faint outline on a card over a scrim does no harm.

**The phone place form moves from `ground` to `surface`.** It is raised over the map, and `ground` is darker than the map's land, so it would be the one panel left blending in.

## Risks / Trade-offs

- [Every dark screen shifts slightly, including calendar and settings] → agreed with the person; checked by looking at each screen in the tasks.
- [The phone's bottom tool bar and the web chrome bar also use `surface`, so they lighten too] → intended: one surface colour; they keep their `line` border since they are not floating.
