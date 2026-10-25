/**
 * Shared pixel-art toolkit: the Pixelorama bridge, the software rasterizer and
 * the palette every asset of the game is drawn with.
 *
 * `generate.mjs` draws the soldiers, settlements, commanders and terrain of the
 * world map; `generate-town.mjs` draws the ground, houses, facilities, props
 * and townsfolk of the town and village scenes. Both of them stream their art
 * through the very same rasterizer and palette, which is what keeps the town
 * looking like it belongs to the same world as the world map.
 *
 * 共享像素工具：Pixelorama 桥接、软件光栅器与整套调色板。世界地图与城镇场景的
 * 素材都走同一套工具与调色板，因此两边的画风天然一致。
 */
import { readFileSync, writeFileSync } from 'node:fs'

export const BRIDGE_URL = 'http://127.0.0.1:7373'

/* ------------------------------- bridge ------------------------------- */

export async function cmd(tool, params = {}) {
  const res = await fetch(`${BRIDGE_URL}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, params })
  })
  const json = await res.json().catch(() => ({ success: false, error: 'invalid JSON reply' }))
  if (!json.success) throw new Error(`${tool} failed: ${json.error || JSON.stringify(json)}`)
  return json.data || {}
}

/* ---------------------------- pixel buffer ---------------------------- */

/**
 * Small software rasterizer: shapes are computed in JS and streamed to
 * Pixelorama in one batched flush, which is faster and far easier to tune than
 * chaining hundreds of primitive commands over the bridge.
 */
export class Pix {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.g = new Map()
  }

  key(x, y) {
    return y * this.w + x
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h
  }

  set(x, y, color) {
    x = Math.round(x)
    y = Math.round(y)
    if (!this.inBounds(x, y)) return
    this.g.set(this.key(x, y), color)
  }

  /** Filled or hollow axis-aligned rectangle. */
  rect(x, y, w, h, color, filled = true) {
    for (let j = 0; j < h; j += 1) {
      for (let i = 0; i < w; i += 1) {
        const edge = i === 0 || j === 0 || i === w - 1 || j === h - 1
        if (filled || edge) this.set(x + i, y + j, color)
      }
    }
  }

  /** Filled or hollow circle, optionally clipped to a row band. */
  circle(cx, cy, r, color, filled = true, yMin = -1e9, yMax = 1e9) {
    for (let j = -r; j <= r; j += 1) {
      const y = cy + j
      if (y < yMin || y > yMax) continue
      for (let i = -r; i <= r; i += 1) {
        const d = Math.hypot(i, j)
        if (d > r) continue
        const inner = r - 1.2
        if (filled || d >= inner) this.set(cx + i, y, color)
      }
    }
  }

  /** Filled or hollow ellipse, optionally clipped to a row band. */
  ellipse(cx, cy, rx, ry, color, filled = true, yMin = -1e9, yMax = 1e9) {
    for (let j = -ry; j <= ry; j += 1) {
      const y = cy + j
      if (y < yMin || y > yMax) continue
      for (let i = -rx; i <= rx; i += 1) {
        const d = Math.hypot(i / rx, j / ry)
        if (d > 1) continue
        const inner = 1 - Math.max(1.2 / rx, 1.2 / ry)
        if (filled || d >= inner) this.set(cx + i, y, color)
      }
    }
  }

  /** Rounded rectangle, used for hull-ish shapes such as horse bodies. */
  roundRect(x, y, w, h, r, color, filled = true) {
    for (let j = 0; j < h; j += 1) {
      for (let i = 0; i < w; i += 1) {
        const dx = Math.min(i, w - 1 - i)
        const dy = Math.min(j, h - 1 - j)
        const corner = Math.hypot(Math.max(0, r - dx), Math.max(0, r - dy))
        const inside = corner <= r + 0.2
        const edge = corner > r - 1.1 || i === 0 || j === 0 || i === w - 1 || j === h - 1
        if (inside && (filled || edge)) this.set(x + i, y + j, color)
      }
    }
  }

  line(x1, y1, x2, y2, color) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1)
    for (let s = 0; s <= steps; s += 1) {
      this.set(x1 + ((x2 - x1) * s) / steps, y1 + ((y2 - y1) * s) / steps, color)
    }
  }

  /** Thick line: `n` parallel strokes offset along the normal. */
  stroke(x1, y1, x2, y2, n, color) {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1
    const nx = -(y2 - y1) / len
    const ny = (x2 - x1) / len
    for (let i = 0; i < n; i += 1) {
      this.line(x1 + nx * i, y1 + ny * i, x2 + nx * i, y2 + ny * i, color)
    }
  }

  /** Even-odd polygon fill, used for peaks, dune wedges and pennant notches. */
  poly(points, color) {
    const xs = points.map((p) => p[0])
    const ys = points.map((p) => p[1])
    const x0 = Math.floor(Math.min(...xs))
    const x1 = Math.ceil(Math.max(...xs))
    const y0 = Math.floor(Math.min(...ys))
    const y1 = Math.ceil(Math.max(...ys))
    const inside = (x, y) => {
      let hit = false
      for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
        const [xi, yi] = points[i]
        const [xj, yj] = points[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
      }
      return hit
    }
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) if (inside(x + 0.5, y + 0.5)) this.set(x, y, color)
    }
  }

  /** Clear a region back to transparent. */
  erase(x, y, w, h) {
    for (let j = 0; j < h; j += 1) {
      for (let i = 0; i < w; i += 1) {
        if (this.inBounds(x + i, y + j)) this.g.delete(this.key(x + i, y + j))
      }
    }
  }

  /**
   * Silhouette pass: grow every empty pixel that touches a painted pixel into
   * the outline colour. One pass keeps the stroke proportional at 32px and
   * still reads at 2x or 4x on a bigger canvas.
   *
   * Bounds are checked before building a key: `y * w + x` wraps at the row
   * ends, so an unguarded `x - 1` would silently test the last column of the
   * row above and paint stray pixels on the opposite edge.
   */
  outline(color) {
    const add = []
    for (let y = 0; y < this.h; y += 1) {
      for (let x = 0; x < this.w; x += 1) {
        if (this.g.has(this.key(x, y))) continue
        let touch = false
        for (let dy = -1; dy <= 1 && !touch; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (!dx && !dy) continue
            const nx = x + dx
            const ny = y + dy
            if (!this.inBounds(nx, ny)) continue
            if (this.g.has(this.key(nx, ny))) {
              touch = true
              break
            }
          }
        }
        if (touch) add.push(this.key(x, y))
      }
    }
    for (const k of add) this.g.set(k, color)
  }

  toPixels() {
    const out = []
    for (const [key, color] of this.g) {
      const x = key % this.w
      out.push({ x, y: (key - x) / this.w, color })
    }
    return out
  }
}

/* ------------------------------- palette ------------------------------- */

export const OUTLINE = '#231a11'
export const SKIN = '#e6b98d'
export const SKIN_DARK = '#c08f62'
export const METAL = '#ccd2da'
export const METAL_DARK = '#8a929c'
export const LEATHER = '#7a5230'
export const LEATHER_DARK = '#54391f'
export const WOOD = '#8b5e3c'
export const WOOD_DARK = '#5f3d26'
export const GOLD = '#e8c56a'
export const GOLD_DARK = '#a9812f'
export const HORSE = '#6b4a33'
export const HORSE_DARK = '#452c1c'
export const HOOF = '#2f2114'
export const CANOPY = '#3f7a3a'
export const CANOPY_DARK = '#2a5427'
export const CANOPY_LIGHT = '#579a45'
export const STONE = '#b9b3a6'
export const STONE_DARK = '#8a8073'
export const STONE_LIGHT = '#d8d3c6'
export const SNOW = '#f1f3f5'
export const SAND = '#d8c07a'
export const SAND_DARK = '#b0955a'
export const FOAM = '#e8f2f8'
export const STRAW = '#ddb85c'
export const STRAW_DARK = '#a9853a'
export const CAPE_RED = '#a8324b'

/** Lighten (positive) or darken (negative) one #rrggbb colour by a 0..1 amount. */
export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (v) => Math.max(0, Math.min(255, Math.round(amount > 0 ? v + (255 - v) * amount : v + v * amount)))
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/* -------------------------------- manifest -------------------------------- */

/**
 * Write `public/pixel/index.json`, merging the assets of this run into the
 * manifest that is already on disk.
 *
 * The game ships one manifest for every sprite it can draw, and two generators
 * feed it: the world-map generator and the town generator. Merging by category
 * means either script can be run on its own without wiping the other's rows.
 *
 * 两个生成器共用一个清单：按分类合并，单独跑其中一个不会抹掉另一个的条目。
 */
export function writeIndex(indexPath, entries) {
  let existing = []
  try {
    existing = JSON.parse(readFileSync(indexPath, 'utf8'))
  } catch {
    existing = []
  }
  const categories = new Set(entries.map((e) => e.category))
  const kept = existing.filter((row) => !categories.has(row.category))
  const merged = [...kept, ...entries].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  )
  writeFileSync(indexPath, `${JSON.stringify(merged, null, 2)}\n`)
  return merged
}
