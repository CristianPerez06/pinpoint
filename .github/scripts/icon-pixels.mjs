/**
 * Reading icons back, so the check compares pictures rather than files.
 *
 * Two PNGs of the same image may legitimately differ byte for byte — zlib is
 * free to choose a different encoding, and does across versions — so nothing
 * here compares bytes. It decodes both sides and compares pixels.
 */

import zlib from 'node:zlib'

/** Decode an eight-bit, non-interlaced PNG of colour type 2 or 6 to RGBA. */
export function decodePng(buffer) {
  let offset = 8
  let header = null
  const idat = []

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const body = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      header = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        depth: body[8],
        colour: body[9],
        interlace: body[12],
      }
    }
    if (type === 'IDAT') idat.push(body)
    offset += 12 + length
  }

  if (!header) throw new Error('no IHDR')
  if (header.depth !== 8 || header.interlace !== 0 || (header.colour !== 2 && header.colour !== 6)) {
    throw new Error(`unsupported PNG: ${JSON.stringify(header)}`)
  }

  const channels = header.colour === 6 ? 4 : 3
  const { width, height } = header
  const stride = width * channels
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const flat = Buffer.alloc(height * stride)

  let pos = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++]
    const line = raw.subarray(pos, pos + stride)
    pos += stride
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? flat[y * stride + x - channels] : 0
      const b = y > 0 ? flat[(y - 1) * stride + x] : 0
      const c = x >= channels && y > 0 ? flat[(y - 1) * stride + x - channels] : 0
      let v = line[x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      flat[y * stride + x] = v & 0xff
    }
  }

  const data = Buffer.alloc(width * height * 4)
  for (let i = 0, j = 0; i < width * height; i++) {
    data[i * 4] = flat[j]
    data[i * 4 + 1] = flat[j + 1]
    data[i * 4 + 2] = flat[j + 2]
    data[i * 4 + 3] = channels === 4 ? flat[j + 3] : 255
    j += channels
  }

  return { width, height, data, colourType: header.colour }
}

/** The PNGs inside an ICO, in directory order. */
export function decodeIco(buffer) {
  const count = buffer.readUInt16LE(4)
  const images = []
  for (let i = 0; i < count; i++) {
    const entry = 6 + i * 16
    const length = buffer.readUInt32LE(entry + 8)
    const offset = buffer.readUInt32LE(entry + 12)
    images.push(decodePng(buffer.subarray(offset, offset + length)))
  }
  return images
}

/**
 * The drop's bounding box in a rendered icon.
 *
 * "Drop" is whatever is not the tile: on an opaque asset that is any pixel
 * pulled away from the tile colour, and on the transparent adaptive foreground
 * it is any pixel with alpha. A pixel counts once it is at least half way,
 * which keeps the tapering tip from being measured differently on two assets
 * only because one is larger.
 */
export function dropBounds({ width, height, data }, tile) {
  const tileRgb = tile ? hexToRgb(tile) : null
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      let hit
      if (tileRgb) {
        // Distance from the tile along the red channel, which is the channel the
        // accent and the drop are furthest apart on.
        hit = data[i + 3] > 127 && Math.abs(data[i] - tileRgb[0]) > Math.abs(tileRgb[0] - 0x24) / 2
      } else {
        hit = data[i + 3] > 127
      }
      if (!hit) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/** Mean absolute per-channel difference between two decoded images, 0-255. */
export function meanDifference(a, b) {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`size mismatch: ${a.width}x${a.height} vs ${b.width}x${b.height}`)
  }
  let total = 0
  for (let i = 0; i < a.data.length; i++) total += Math.abs(a.data[i] - b.data[i])
  return total / a.data.length
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
