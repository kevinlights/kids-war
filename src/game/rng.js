// Tiny deterministic PRNG helpers shared by world generation and battles.

// mulberry32 returns a fast seeded generator in [0, 1).
export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Random helper wrapper with integer and range utilities.
export function createRng(seed) {
  const next = mulberry32(seed)
  return {
    next,
    // float in [min, max)
    float(min, max) {
      return min + next() * (max - min)
    },
    // integer in [min, max]
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1))
    },
    pick(list) {
      return list[Math.floor(next() * list.length)]
    },
    chance(p) {
      return next() < p
    },
    // Fisher-Yates shuffle, returns a new array.
    shuffle(list) {
      const arr = list.slice()
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    }
  }
}

// Build a coarse value-noise field and bilinearly sample it into a full grid.
// Returns a 2D array of floats in [0, 1] with the requested width and height.
export function valueNoise(rng, width, height, cell) {
  const gw = Math.ceil(width / cell) + 2
  const gh = Math.ceil(height / cell) + 2
  const lattice = []
  for (let y = 0; y < gh; y++) {
    const row = []
    for (let x = 0; x < gw; x++) row.push(rng.next())
    lattice.push(row)
  }

  const smooth = (t) => t * t * (3 - 2 * t)
  const out = []
  for (let y = 0; y < height; y++) {
    const row = []
    const gy = y / cell
    const y0 = Math.floor(gy)
    const ty = smooth(gy - y0)
    for (let x = 0; x < width; x++) {
      const gx = x / cell
      const x0 = Math.floor(gx)
      const tx = smooth(gx - x0)
      const v00 = lattice[y0][x0]
      const v10 = lattice[y0][x0 + 1]
      const v01 = lattice[y0 + 1][x0]
      const v11 = lattice[y0 + 1][x0 + 1]
      const top = v00 + (v10 - v00) * tx
      const bottom = v01 + (v11 - v01) * tx
      row.push(top + (bottom - top) * ty)
    }
    out.push(row)
  }
  return out
}
