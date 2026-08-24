/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Written by packages/tokens/scripts/derive.ts from the modules in ../. Any
 * edit here is lost the next time that script runs, and CI fails on the diff
 * before it gets the chance.
 *
 * This is the native representation: both themes, already flattened to one
 * ground's literals, because a React Native StyleSheet wants "#FBFAF8" and not
 * a pair to choose from. Every value is a literal — nothing here is resolved by
 * a host.
 */

export interface ThemeElevation {
  readonly colour: string
  readonly offsetY: number
  readonly blur: number
}

export interface Theme {
  readonly mode: 'light' | 'dark'
  readonly colour: Readonly<Record<'ground' | 'surface' | 'surfaceMuted' | 'surfaceSunk' | 'line' | 'lineStrong' | 'ink' | 'inkMuted' | 'inkFaint' | 'accent' | 'accentInk' | 'inkOnAccent' | 'accentWash' | 'accentRing' | 'danger' | 'dangerSurface', string>>
  readonly basemap: Readonly<Record<'land' | 'block' | 'road' | 'roadCasing' | 'water' | 'park' | 'boundary' | 'label', string>>
  readonly markerFamily: Readonly<Record<'see' | 'eat' | 'buy' | 'sleep' | 'move', string>>
  readonly markerForeground: string
  readonly elevation: Readonly<Record<'sm' | 'md' | 'lg' | 'pin', ThemeElevation>>
}

export const LIGHT: Theme = {
  "mode": "light",
  "colour": {
    "ground": "#FBFAF8",
    "surface": "#FFFFFF",
    "surfaceMuted": "#F3F2EF",
    "surfaceSunk": "#EFEDE8",
    "line": "#E4E2DC",
    "lineStrong": "#D3D0C8",
    "ink": "#1A1917",
    "inkMuted": "#6E6A63",
    "inkFaint": "#9C978E",
    "accent": "#E39A2B",
    "accentInk": "#8A5A0B",
    "inkOnAccent": "#241703",
    "accentWash": "#FBF1DF",
    "accentRing": "#E39A2B61",
    "danger": "#B3261E",
    "dangerSurface": "#FCEDEC"
  },
  "basemap": {
    "land": "#EFEEE9",
    "block": "#E3E1D9",
    "road": "#FFFFFF",
    "roadCasing": "#DAD6CC",
    "water": "#CBD6DA",
    "park": "#E1E5DC",
    "boundary": "#DEDAD0",
    "label": "#9A948B"
  },
  "markerFamily": {
    "see": "#7C8896",
    "eat": "#D2451E",
    "buy": "#8A3FFC",
    "sleep": "#0B5FD0",
    "move": "#00857A"
  },
  "markerForeground": "#FFFFFF",
  "elevation": {
    "sm": {
      "colour": "#1A19170F",
      "offsetY": 1,
      "blur": 2
    },
    "md": {
      "colour": "#1A19171A",
      "offsetY": 4,
      "blur": 12
    },
    "lg": {
      "colour": "#1A191729",
      "offsetY": 12,
      "blur": 32
    },
    "pin": {
      "colour": "#1A19174D",
      "offsetY": 2,
      "blur": 5
    }
  }
}

export const DARK: Theme = {
  "mode": "dark",
  "colour": {
    "ground": "#171614",
    "surface": "#201E1B",
    "surfaceMuted": "#2A2724",
    "surfaceSunk": "#1B1A17",
    "line": "#34302B",
    "lineStrong": "#443F38",
    "ink": "#F2F0EC",
    "inkMuted": "#A09A91",
    "inkFaint": "#7C766D",
    "accent": "#F0AE4A",
    "accentInk": "#F0AE4A",
    "inkOnAccent": "#171614",
    "accentWash": "#33291A",
    "accentRing": "#F0AE4A6B",
    "danger": "#F2857C",
    "dangerSurface": "#33211F"
  },
  "basemap": {
    "land": "#1A1815",
    "block": "#262218",
    "road": "#3D372D",
    "roadCasing": "#2C271E",
    "water": "#16242C",
    "park": "#1F241F",
    "boundary": "#2A251E",
    "label": "#8A8378"
  },
  "markerFamily": {
    "see": "#98A3B0",
    "eat": "#F0653A",
    "buy": "#A97BFF",
    "sleep": "#4A8FE8",
    "move": "#16A99C"
  },
  "markerForeground": "#171614",
  "elevation": {
    "sm": {
      "colour": "#00000066",
      "offsetY": 1,
      "blur": 2
    },
    "md": {
      "colour": "#00000075",
      "offsetY": 4,
      "blur": 12
    },
    "lg": {
      "colour": "#00000094",
      "offsetY": 12,
      "blur": 32
    },
    "pin": {
      "colour": "#0000008C",
      "offsetY": 2,
      "blur": 5
    }
  }
}
