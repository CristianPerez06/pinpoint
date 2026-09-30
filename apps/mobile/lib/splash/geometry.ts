/**
 * The size the opening's sphere is drawn at, in density-independent points.
 *
 * The still launch image and the first animated frame must be the same size, or
 * the handover jumps. The still image is laid out by the operating system from
 * `imageWidth` in `app.json`, which cannot import this — so the number is
 * written there too, and `geometry.test.ts` fails if the two disagree.
 *
 * Why 192: Android 12 and later draw the launch icon in a 288-point box and show
 * only the circle in its middle two thirds, 192 points across. The sphere is a
 * circle, so at exactly that size Android's own mask and our sphere coincide and
 * nothing of it is cut away. iOS draws the image at the width it is given.
 */
export const SPLASH_SPHERE_WIDTH = 192

/**
 * The square the 3D opening draws in, centred on the screen, in points.
 *
 * Not the whole screen: everything the opening draws — the sphere and the pin
 * standing up out of it — fits in a square not quite twice the sphere's width,
 * and every pixel outside it would only ever be the ground. Drawing a third of
 * the screen instead of all of it is the difference, in the simulator, between
 * the animation playing and the phone falling so far behind that nothing
 * appears until it is over. The rest of the screen is the ground, painted by
 * the view around it.
 */
export const SPLASH_STAGE_WIDTH = 360
