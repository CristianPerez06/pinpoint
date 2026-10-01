import { COLOUR, MARK_LAND } from '@pinpoint/tokens'
import type { ExpoWebGLRenderingContext } from 'expo-gl'
import {
  AmbientLight,
  ColorManagement,
  Color,
  DataTexture,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  LinearSRGBColorSpace,
  LatheGeometry,
  Mesh,
  MeshPhongMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  Shape,
  Path,
  SphereGeometry,
  Vector2,
  WebGLRenderer,
} from 'three'

import { SPLASH_SPHERE_WIDTH } from './geometry'
import { LAND_HEIGHT, LAND_WIDTH, landMask, landPixels } from './land'
import { measureMark } from './mark'
import type { Pose } from './timeline'

/**
 * The opening's 3D scene: an amber globe with the product's pin on it.
 *
 * A port of the approved mock (`openspec/changes/animate-the-apps-and-the-splash/
 * mock/splash.html`), which is Three.js too, so the geometry, colours and lights
 * carry across nearly line for line. The mock is the reference for how any of
 * this should look; `timeline.ts` is the reference for when.
 *
 * Tested together: three 0.186.1, expo-gl 57.0.2.
 *
 * WHY THE FIRST FRAME IS THE STILL IMAGE, EXACTLY
 *
 * The still launch image is cut from the mark by the icon tooling, and the
 * operating system shows it until this scene has drawn once. For the handover to
 * be invisible the first frame must be that picture: so every light starts at
 * zero and every material glows at full strength in its own colour, which makes
 * the sphere a flat `accent` disc and the pin a flat `inkOnAccent` drop — no
 * shading, nothing 3D. The perspective is compensated too: the pin stands in
 * front of the sphere, nearer the camera, so it is shrunk by exactly as much as
 * nearness would enlarge it, and the camera is framed on the sphere's
 * silhouette rather than its radius.
 */

/**
 * The mark's colours, as the icon tooling cuts them: the light values on every
 * ground, because the mark carries its own ground (`product-mark`).
 */
const SPHERE = COLOUR.accent.light
const PIN = COLOUR.inkOnAccent.light

/**
 * The continents are `MARK_LAND`, shared with the waiting area's globe. `PIN_LIT`
 * is the pin's body once light reaches it — `PIN` is what it looks like unlit —
 * and a literal, because nothing else in either application draws it and
 * `styling` keeps a token for values that are shared.
 */
const LAND = MARK_LAND
const PIN_LIT = '#3A260A'

/** Where the globe starts: facing South America. */
const START_LONGITUDE = -60
/** How far the view rises to look down on the globe. */
const TILT = (22 * Math.PI) / 180
/** How far the pin's head tips toward the viewer. */
const PIN_TIP_FORWARD = 0.3
/** The pin's height, in sphere radii: half the sphere at first, a third more at the end. */
const PIN_START_HEIGHT = 1
const PIN_END_HEIGHT = 1.3
/** How far in front of the sphere's surface the pin stands. */
const PIN_LIFT = 1.02
const CAMERA_DISTANCE = 9

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const easeOut = (p: number) => 1 - (1 - p) ** 3
const easeOutBack = (p: number) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2

/**
 * `three` over `expo-gl`, past a check that misreads the context.
 *
 * `three` has required WebGL 2 since r163 and refuses a WebGL 1 context by
 * asking `context instanceof WebGLRenderingContext`. In a browser that is a
 * fair test, because a browser's WebGL 2 context does not inherit from the
 * WebGL 1 class. `expo-gl` makes it inherit — which is what the WebGL
 * specification describes — so its WebGL 2 context answers yes and is refused
 * as WebGL 1. The check reads the global by name, so the name is hidden for the
 * length of the constructor and nothing else, and only once `expo-gl` has said
 * the context really is WebGL 2.
 */
function createRenderer(gl: ExpoWebGLRenderingContext, canvas: HTMLCanvasElement): WebGLRenderer {
  if (!(gl as unknown as { supportsWebGL2?: boolean }).supportsWebGL2) {
    throw new Error('This phone offers no WebGL 2 context, which three needs')
  }
  const scope = globalThis as { WebGLRenderingContext?: unknown }
  const webgl1 = scope.WebGLRenderingContext
  scope.WebGLRenderingContext = undefined
  try {
    return new WebGLRenderer({ canvas, context: gl as unknown as WebGL2RenderingContext, antialias: true })
  } finally {
    scope.WebGLRenderingContext = webgl1
  }
}

export interface SplashScene {
  /** Draw one frame of the opening on `ground`. */
  draw(pose: Pose, ground: string): void
  dispose(): void
}

/**
 * `widthInPoints` is the view's width as layout sees it. The sphere is framed to
 * be `SPLASH_SPHERE_WIDTH` of those, the size the still image is drawn at.
 */
export function createScene(gl: ExpoWebGLRenderingContext, widthInPoints: number): SplashScene {
  const width = gl.drawingBufferWidth
  const height = gl.drawingBufferHeight

  /*
   * `three` wants a canvas; `expo-gl` has a context and no canvas. This stub is
   * everything the renderer reads from one when it is handed a context of its
   * own — its size, and somewhere to attach listeners that will never fire.
   */
  const canvas = {
    width,
    height,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    clientWidth: width,
    clientHeight: height,
    getContext: () => gl,
  } as unknown as HTMLCanvasElement

  const renderer = createRenderer(gl, canvas)
  renderer.setPixelRatio(1)
  renderer.setSize(width, height, false)
  /*
   * Lighting is worked out on the colours as they are written, not converted
   * to linear light and back. That is how the approved mock was drawn (its
   * `three` predates colour management), and converting made the amber wash
   * out to a bright yellow once lit. It also means the first, unlit frame is
   * exactly the hex values the still image is cut in.
   */
  ColorManagement.enabled = false
  renderer.outputColorSpace = LinearSRGBColorSpace
  // The pin casts its shadow on the globe, as in the mock. PCF is the soft
  // shadow `three` still has; the mock's PCFSoft has since been folded into it.
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap

  const scene = new Scene()

  // Framed on the sphere's silhouette — which, seen from a finite distance, is a
  // touch wider than its radius — so it spans SPLASH_SPHERE_WIDTH points.
  const camera = new PerspectiveCamera(30, width / height, 0.1, 100)
  const silhouette = CAMERA_DISTANCE * Math.tan(Math.asin(1 / CAMERA_DISTANCE))
  const visibleWidth = (2 * silhouette) / (SPLASH_SPHERE_WIDTH / widthInPoints)
  camera.fov = (2 * Math.atan(visibleWidth / camera.aspect / 2 / CAMERA_DISTANCE) * 180) / Math.PI
  camera.updateProjectionMatrix()

  // Lights start at zero: the first frame is flat colour, like the icon.
  const ambient = new AmbientLight(0xffffff, 0)
  const key = new DirectionalLight(0xffffff, 0)
  key.position.set(-3, 4, 6)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 })
  key.shadow.radius = 4
  const rim = new DirectionalLight(0xfff1dc, 0)
  rim.position.set(4, -1, 2)
  scene.add(ambient, key, rim)

  // The globe: an amber ball, and the continents on a second skin that fades in.
  /*
   * ONE SHADING PROGRAM FOR EVERYTHING
   *
   * Each distinct kind of material costs the phone a shader program, compiled
   * before the first frame can be drawn — and that first frame is what the
   * operating system's still image is waiting on, so every program is time
   * added to the launch. In the simulator a program cost over half a second.
   *
   * So every surface here is the same kind: Phong, with a colour map and a glow
   * map. Surfaces with no pattern get a one-pixel white texture, which changes
   * nothing they draw and makes them the same program as the continents.
   */
  const plain = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
  plain.needsUpdate = true
  const surface = (options: ConstructorParameters<typeof MeshPhongMaterial>[0]) =>
    new MeshPhongMaterial({ map: plain, emissiveMap: plain, transparent: true, ...options })

  const globe = new Group()
  const ballMaterial = surface({ color: SPHERE, emissive: SPHERE, emissiveIntensity: 1, shininess: 4 })
  const ball = new Mesh(new SphereGeometry(1, 96, 64), ballMaterial)
  ball.receiveShadow = true
  const landTexture = new DataTexture(landPixels(landMask(), LAND), LAND_WIDTH, LAND_HEIGHT)
  landTexture.needsUpdate = true
  const landMaterial = surface({
    map: landTexture,
    emissive: 0xffffff,
    emissiveMap: landTexture,
    emissiveIntensity: 1,
    shininess: 4,
    opacity: 0,
    depthWrite: false,
  })
  const landSkin = new Mesh(new SphereGeometry(1.002, 96, 64), landMaterial)
  landSkin.receiveShadow = true
  globe.add(ball, landSkin)
  scene.add(globe)
  const facing = (longitude: number) => Math.PI / 2 - (2 * Math.PI * (longitude + 180)) / 360

  const mark = measureMark()

  // The flat pin: the icon's drawing, almost no thickness, never lit.
  const shape = new Shape(mark.outline.map(([x, y]) => new Vector2(x, y)))
  const hole = new Path()
  hole.absarc(mark.hole.x, mark.hole.y, mark.hole.r, 0, Math.PI * 2, false)
  shape.holes.push(hole)
  // Unlit: black under the lights, glowing its own colour — the same look as a
  // flat fill, from the same program as everything else.
  const flatMaterial = surface({ color: 0x000000, emissive: PIN, emissiveIntensity: 1, shininess: 0 })
  const flatPin = new Mesh(new ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false, curveSegments: 64 }), flatMaterial)

  /*
   * The 3D pin: a ball with the hole drilled through it, on a cone narrowing to
   * the point. The ball is centred on the hole rather than on the arc's centre
   * and takes the arc's radius, so the hole stays where the icon has it and is
   * concentric with the ball it goes through — the 3D head stands a little
   * taller than the flat one, which the growth hides.
   */
  const headR = mark.head.r
  const headY = mark.hole.y
  const holeR = mark.hole.r
  const roundMaterial = surface({
    color: PIN_LIT,
    emissive: PIN,
    emissiveIntensity: 1,
    shininess: 60,
    opacity: 0,
  })
  const edge = Math.acos(holeR / headR)
  const headProfile: Vector2[] = []
  for (let i = 0; i <= 48; i++) {
    const a = -edge + (2 * edge * i) / 48
    headProfile.push(new Vector2(headR * Math.cos(a), headR * Math.sin(a)))
  }
  const wall = headR * Math.sin(edge)
  for (let i = 1; i < 8; i++) headProfile.push(new Vector2(holeR, wall - (2 * wall * i) / 8))
  headProfile.push(headProfile[0]!.clone())
  const headGeometry = new LatheGeometry(headProfile, 96)
  headGeometry.rotateX(Math.PI / 2) // the hole faces the viewer, as in the icon
  headGeometry.translate(0, headY, 0)
  const head = new Mesh(headGeometry, roundMaterial)

  const k = headR / headY
  const tangentY = headY - headR * k
  const tangentR = headR * Math.sqrt(1 - k * k)
  const coneTop = headY - holeR - 0.01 // stop inside the ball, below the hole
  const tailProfile = [new Vector2(0.0005, 0)]
  for (let i = 1; i <= 12; i++) {
    const y = (coneTop * i) / 12
    tailProfile.push(new Vector2(tangentR * (y / tangentY) ** 1.15, y))
  }
  tailProfile.push(new Vector2(0.0005, coneTop))
  const tail = new Mesh(new LatheGeometry(tailProfile, 96), roundMaterial)
  head.castShadow = true
  tail.castShadow = true
  const roundPin = new Group()
  roundPin.add(head, tail)

  const pin = new Group() // positioned at the tip
  pin.add(flatPin, roundPin)
  scene.add(pin)

  const startZ = PIN_LIFT
  const endY = PIN_LIFT * Math.sin(TILT)
  const endZ = PIN_LIFT * Math.cos(TILT)
  // Nearness enlarges; this undoes it for the first frame (see the header).
  const nearness = (CAMERA_DISTANCE - startZ) / CAMERA_DISTANCE

  const ground = new Color()

  return {
    draw(pose, groundColour) {
      const g = clamp(pose.grow)
      const light = easeOut(g)
      const back = easeOutBack(g)

      renderer.setClearColor(ground.set(groundColour), 1)
      ambient.intensity = 0.55 * Math.PI * light
      key.intensity = 0.9 * Math.PI * light
      rim.intensity = 0.35 * Math.PI * light
      ballMaterial.emissiveIntensity = lerp(1, 0.35, light)
      landMaterial.emissiveIntensity = lerp(1, 0.35, light)
      landMaterial.opacity = light
      roundMaterial.emissiveIntensity = lerp(1, 0, light)

      globe.rotation.y = facing(START_LONGITUDE) + (pose.spin * Math.PI) / 180

      const size = lerp(PIN_START_HEIGHT * nearness, PIN_END_HEIGHT, back)
      pin.scale.set(size, size, size)
      roundPin.scale.z = lerp(0.02, 1, light)
      const fill = clamp(g / 0.35)
      flatMaterial.opacity = 1 - fill
      flatPin.visible = fill < 1
      roundMaterial.opacity = fill
      pin.position.set(
        0,
        lerp(-(PIN_START_HEIGHT * nearness) / 2, endY, light),
        lerp(startZ, endZ, light),
      )
      pin.rotation.set(lerp(0, PIN_TIP_FORWARD, back), 0, pose.sway)

      const tilt = TILT * light
      camera.position.set(0, CAMERA_DISTANCE * Math.sin(tilt), CAMERA_DISTANCE * Math.cos(tilt))
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
      gl.endFrameEXP()
      /*
       * Back-pressure. `expo-gl` queues drawing for a thread of its own and
       * returns at once, so a phone whose graphics are slower than the frames
       * asked of it builds a queue that is presented seconds late — the
       * animation plays to nobody and the screen shows the ground meanwhile.
       * `getError` is one of the calls that waits for that thread to catch up,
       * so the next frame is only asked for once this one is drawn. The clock is
       * time-based, so a slow phone drops frames rather than playing slowly.
       */
      gl.getError()
    },
    dispose() {
      renderer.dispose()
      landTexture.dispose()
    },
  }
}
