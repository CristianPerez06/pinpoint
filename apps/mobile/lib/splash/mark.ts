import { MARKER_HOLE, MARKER_PATH } from '@pinpoint/tokens'

/**
 * The product's mark, measured for the opening.
 *
 * Everything the opening needs to know about the pin's shape is read from
 * `MARKER_PATH` and `MARKER_HOLE`, never written here, so a change to the mark
 * reaches the opening without anybody remembering to update it (`motion`: "The
 * 3D pin is the product's mark given depth").
 *
 * Coordinates are returned in *pin units*: the tip at the origin, y pointing up,
 * and the drop exactly 1 tall from its tip to the top of its head. That is the
 * space the scene draws the pin in, and it makes "the pin is half the sphere's
 * height" a plain number.
 */
export interface MarkMeasure {
  /** The drop's outline, flattened, counter-clockwise, in pin units. */
  readonly outline: readonly (readonly [number, number])[]
  /** The hole, in pin units. */
  readonly hole: { readonly x: number; readonly y: number; readonly r: number }
  /** The head arc's true centre and radius, in pin units. */
  readonly head: { readonly x: number; readonly y: number; readonly r: number }
  /** The same numbers in the path's own box, for anyone checking them against `layout.ts`. */
  readonly raw: {
    readonly headCentre: readonly [number, number]
    readonly headRadius: number
    readonly tip: readonly [number, number]
    readonly top: number
  }
}

type Point = readonly [number, number]

/** Split the path into commands and their numbers. Only what the mark uses: M, C, A, Z. */
function commands(path: string): { op: string; args: number[] }[] {
  const tokens = path.match(/[MCAZ]|-?\d*\.?\d+/gi)
  if (!tokens) throw new Error('MARKER_PATH is empty')
  const out: { op: string; args: number[] }[] = []
  for (const token of tokens) {
    if (/[a-z]/i.test(token)) {
      if (!'MCAZ'.includes(token)) throw new Error(`MARKER_PATH uses "${token}", which the opening cannot read`)
      out.push({ op: token, args: [] })
    } else {
      out[out.length - 1]!.args.push(Number(token))
    }
  }
  return out
}

/**
 * An SVG arc's centre and angles, from its endpoints (SVG 1.1, appendix F.6.5).
 *
 * This is what the pin's own comment in `layout.ts` warns about: the arc does
 * not say where its centre is, the endpoints and flags decide it, and it comes
 * out at (16, 17.47) rather than the (16, 15) the numbers seem to suggest.
 */
function arcCentre(
  from: Point,
  r: number,
  largeArc: boolean,
  sweep: boolean,
  to: Point,
): { cx: number; cy: number; start: number; delta: number } {
  const x1 = (from[0] - to[0]) / 2
  const y1 = (from[1] - to[1]) / 2
  const numerator = Math.max(0, r * r * r * r - r * r * y1 * y1 - r * r * x1 * x1)
  const coefficient = (largeArc !== sweep ? 1 : -1) * Math.sqrt(numerator / (r * r * y1 * y1 + r * r * x1 * x1))
  const cxp = coefficient * y1
  const cyp = coefficient * -x1
  const cx = cxp + (from[0] + to[0]) / 2
  const cy = cyp + (from[1] + to[1]) / 2
  const start = Math.atan2((y1 - cyp) / r, (x1 - cxp) / r)
  let delta = Math.atan2((-y1 - cyp) / r, (-x1 - cxp) / r) - start
  if (sweep && delta < 0) delta += 2 * Math.PI
  if (!sweep && delta > 0) delta -= 2 * Math.PI
  return { cx, cy, start, delta }
}

const cubic = (a: number, b: number, c: number, d: number, t: number) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d

/** Measure the mark. `steps` is how finely each curve is flattened. */
export function measureMark(path: string = MARKER_PATH, steps = 48): MarkMeasure {
  const points: Point[] = []
  let at: Point = [0, 0]
  let head: { cx: number; cy: number; r: number } | null = null

  for (const { op, args } of commands(path)) {
    if (op === 'M') {
      at = [args[0]!, args[1]!]
      points.push(at)
    } else if (op === 'C') {
      const [x1, y1, x2, y2, x, y] = args as [number, number, number, number, number, number]
      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        points.push([cubic(at[0], x1, x2, x, t), cubic(at[1], y1, y2, y, t)])
      }
      at = [x, y]
    } else if (op === 'A') {
      const [rx, ry, , large, sweep, x, y] = args as [number, number, number, number, number, number, number]
      if (rx !== ry) throw new Error('MARKER_PATH has an elliptical arc; the opening expects a circular head')
      const arc = arcCentre(at, rx, large === 1, sweep === 1, [x, y])
      head = { cx: arc.cx, cy: arc.cy, r: rx }
      for (let i = 1; i <= steps * 4; i++) {
        const a = arc.start + (arc.delta * i) / (steps * 4)
        points.push([arc.cx + rx * Math.cos(a), arc.cy + rx * Math.sin(a)])
      }
      at = [x, y]
    }
  }
  if (!head) throw new Error('MARKER_PATH has no arc for the head')

  // The tip is the lowest point; the top is the head's top.
  const tip = points.reduce((low, p) => (p[1] > low[1] ? p : low), points[0]!)
  const top = head.cy - head.r
  const height = tip[1] - top

  const toPin = ([x, y]: Point): [number, number] => [(x - tip[0]) / height, (tip[1] - y) / height]

  // The path runs clockwise on screen, which is counter-clockwise once y points up.
  const outline = points.map(toPin)
  const holeCentre = toPin([MARKER_HOLE.cx, MARKER_HOLE.cy])
  const headCentre = toPin([head.cx, head.cy])

  return {
    outline,
    hole: { x: holeCentre[0], y: holeCentre[1], r: MARKER_HOLE.r / height },
    head: { x: headCentre[0], y: headCentre[1], r: head.r / height },
    raw: { headCentre: [head.cx, head.cy], headRadius: head.r, tip, top },
  }
}
