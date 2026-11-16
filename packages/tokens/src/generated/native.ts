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
  readonly colour: Readonly<Record<'ground' | 'surface' | 'surfaceMuted' | 'surfaceSunk' | 'line' | 'lineStrong' | 'ink' | 'inkMuted' | 'inkFaint' | 'accent' | 'accentInk' | 'inkOnAccent' | 'accentWash' | 'accentRing' | 'scrim' | 'danger' | 'dangerSurface', string>>
  readonly basemap: Readonly<Record<'land' | 'block' | 'road' | 'roadCasing' | 'water' | 'park' | 'boundary' | 'label', string>>
  readonly markerType: Readonly<Record<'place' | 'temple' | 'culture' | 'nature' | 'food' | 'shopping' | 'stay' | 'transport', string>>
  readonly markerForeground: string
  readonly elevation: Readonly<Record<'sm' | 'md' | 'lg' | 'pin', ThemeElevation>>
}

export const LIGHT: Theme = {
  "mode": "light",
  "colour": {
    "ground": "#F6F4FB",
    "surface": "#FFFFFF",
    "surfaceMuted": "#EFEBF8",
    "surfaceSunk": "#ECE8F5",
    "line": "#E3DEF0",
    "lineStrong": "#827C92",
    "ink": "#1A1626",
    "inkMuted": "#625C72",
    "inkFaint": "#A19BB0",
    "accent": "#7A35DC",
    "accentInk": "#6227C0",
    "inkOnAccent": "#FFFFFF",
    "accentWash": "#F0E9FD",
    "accentRing": "#7A35DC52",
    "scrim": "#00000063",
    "danger": "#B3261E",
    "dangerSurface": "#FCEDEE"
  },
  "basemap": {
    "land": "#F2F0F7",
    "block": "#E6E2EF",
    "road": "#FFFFFF",
    "roadCasing": "#DAD5E6",
    "water": "#C3D4F0",
    "park": "#D9E8D5",
    "boundary": "#DCD7E6",
    "label": "#8D879C"
  },
  "markerType": {
    "place": "#8B857A",
    "temple": "#7C8896",
    "culture": "#B43F72",
    "nature": "#3F7A32",
    "food": "#D2451E",
    "shopping": "#9C7A00",
    "stay": "#0B5FD0",
    "transport": "#00857A"
  },
  "markerForeground": "#FFFFFF",
  "elevation": {
    "sm": {
      "colour": "#1A16260F",
      "offsetY": 1,
      "blur": 2
    },
    "md": {
      "colour": "#1A16261A",
      "offsetY": 4,
      "blur": 12
    },
    "lg": {
      "colour": "#1A162629",
      "offsetY": 12,
      "blur": 32
    },
    "pin": {
      "colour": "#1A16264D",
      "offsetY": 2,
      "blur": 5
    }
  }
}

export const DARK: Theme = {
  "mode": "dark",
  "colour": {
    "ground": "#120F1C",
    "surface": "#1D192B",
    "surfaceMuted": "#2A243C",
    "surfaceSunk": "#16131F",
    "line": "#342E49",
    "lineStrong": "#7A7391",
    "ink": "#F2F0F8",
    "inkMuted": "#A39DB5",
    "inkFaint": "#6F6886",
    "accent": "#B48CFA",
    "accentInk": "#C9B0FF",
    "inkOnAccent": "#140F24",
    "accentWash": "#2E2452",
    "accentRing": "#B48CFA66",
    "scrim": "#00000063",
    "danger": "#F2857C",
    "dangerSurface": "#3A2029"
  },
  "basemap": {
    "land": "#171423",
    "block": "#211D30",
    "road": "#3B3552",
    "roadCasing": "#2A2539",
    "water": "#152A4D",
    "park": "#1A2D26",
    "boundary": "#2C2740",
    "label": "#837C99"
  },
  "markerType": {
    "place": "#A8A197",
    "temple": "#98A3B0",
    "culture": "#E57DA5",
    "nature": "#6FB45C",
    "food": "#F0653A",
    "shopping": "#DDB43A",
    "stay": "#4A8FE8",
    "transport": "#16A99C"
  },
  "markerForeground": "#120F1C",
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
