/**
 * Every asset a host may show to identify the product, and the contract each is
 * cut to.
 *
 * `dropWidth` is the drop's width as a fraction of the *canvas*. The
 * specification states it as a fraction of the region the host renders, which
 * is the same number for every contract but the last — an Android launcher
 * draws the middle 72 of a 108-unit adaptive layer, so an asset for it is cut
 * smaller on the file to arrive the same size on the screen.
 *
 * That is the whole reason this table exists rather than one number: the marks
 * disagreed on size because each was cut against its own file.
 */

/** The drop, as a fraction of whatever the host actually draws. */
export const DROP_OF_RENDERED = 0.41

/**
 * The fraction of an Android adaptive layer a launcher renders: 72 of 108
 * units. The remaining ring is reserved for masking and parallax and is never
 * fully visible.
 */
export const ANDROID_RENDERED = 72 / 108

/**
 * The favicon is the exception, and not because of masking.
 *
 * It is drawn at 16px in a tab strip, where a drop at 41% is six pixels across
 * and unreadable. The tile does the reading at that size, so the drop is larger
 * and the mark is a solid field of the accent with a shape in it.
 */
export const DROP_OF_FAVICON = 0.5

/** The favicon's corner radius, as a fraction of its size — `icon.svg`'s rx 7 of 32. */
export const FAVICON_RADIUS = 7 / 32

export const ASSETS = [
  {
    path: 'apps/web/app/icon.svg',
    kind: 'svg',
    contract: 'drawn as given',
    size: 32,
    dropWidth: DROP_OF_FAVICON,
    radius: FAVICON_RADIUS,
    note: 'The one asset a host renders itself. Same contract as the favicon, expressed as text.',
  },
  {
    path: 'apps/web/app/favicon.ico',
    kind: 'ico',
    contract: 'drawn as given',
    sizes: [16, 32, 48],
    dropWidth: DROP_OF_FAVICON,
    radius: FAVICON_RADIUS,
    note: 'Nothing masks a favicon; a browser draws what it is given, so it carries its own corners.',
  },
  {
    path: 'apps/web/app/apple-icon.png',
    kind: 'png',
    contract: 'corners cut',
    size: 180,
    dropWidth: DROP_OF_RENDERED,
    note: 'iOS rounds it itself, so it is square to the edge and would be rounded twice otherwise.',
  },
  {
    path: 'apps/web/public/icon-192.png',
    kind: 'png',
    contract: 'cropped to a mask',
    size: 192,
    dropWidth: DROP_OF_RENDERED,
    note: 'Declared `any` and `maskable`. A manifest maskable icon is rendered essentially whole under the mask, so the fraction is unchanged.',
  },
  {
    path: 'apps/web/public/icon-512.png',
    kind: 'png',
    contract: 'cropped to a mask',
    size: 512,
    dropWidth: DROP_OF_RENDERED,
  },
  {
    path: 'apps/mobile/assets/icon.png',
    kind: 'png',
    contract: 'corners cut',
    size: 1024,
    dropWidth: DROP_OF_RENDERED,
    note: 'The iOS application icon. Opaque — an alpha channel here is rejected at submission.',
  },
  {
    path: 'apps/mobile/assets/adaptive-icon.png',
    kind: 'png',
    contract: 'cropped to a mask',
    size: 1024,
    dropWidth: DROP_OF_RENDERED * ANDROID_RENDERED,
    transparent: true,
    note: 'The Android adaptive foreground. No tile: the ground is the background layer `app.json` names, and painting one here would hide it.',
  },
]
