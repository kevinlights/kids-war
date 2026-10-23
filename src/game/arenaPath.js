/**
 * Navigation over the battle arena.
 *
 * The arena is a small grid (25 x 17 cells), so A* is cheap enough to run for
 * every soldier that cannot see its goal. Only deep water blocks movement:
 * forests and rivers are still crossed, they just cost more. When the goal is
 * unreachable the search returns the walkable cell closest to it, so a soldier
 * still walks to the shore instead of standing still.
 *
 * A raw A* path is a staircase of cell centres. `arenaLineClear()` and
 * `smoothArenaPath()` turn it into a few long straight runs, which is what
 * makes a marching line curve naturally around a lake instead of following the
 * grid.
 */
import { ARENA_CELL, arenaCellTerrain, arenaTerrainAt, arenaWalkable } from './arena'

const SQRT2 = Math.SQRT2
const NEIGHBORS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2]
]

// Minimal binary min-heap keyed on the f score.
class Heap {
  constructor() {
    this.items = []
  }

  get size() {
    return this.items.length
  }

  push(node) {
    const a = this.items
    a.push(node)
    let i = a.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (a[parent].f <= a[i].f) break
      ;[a[parent], a[i]] = [a[i], a[parent]]
      i = parent
    }
  }

  pop() {
    const a = this.items
    const top = a[0]
    const last = a.pop()
    if (a.length) {
      a[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let smallest = i
        if (l < a.length && a[l].f < a[smallest].f) smallest = l
        if (r < a.length && a[r].f < a[smallest].f) smallest = r
        if (smallest === i) break
        ;[a[smallest], a[i]] = [a[i], a[smallest]]
        i = smallest
      }
    }
    return top
  }
}

function cellSize(arena) {
  return arena && arena.cell ? arena.cell : ARENA_CELL
}

function cellOf(arena, x, y) {
  const cell = cellSize(arena)
  return {
    c: Math.max(0, Math.min(arena.cols - 1, Math.floor(x / cell))),
    r: Math.max(0, Math.min(arena.rows - 1, Math.floor(y / cell)))
  }
}

function centreOf(arena, c, r) {
  const cell = cellSize(arena)
  return { x: c * cell + cell / 2, y: r * cell + cell / 2 }
}

function walkableCell(arena, c, r) {
  if (!arena || c < 0 || r < 0 || c >= arena.cols || r >= arena.rows) return false
  return arenaCellTerrain(arena, c, r).walkable
}

function cellCost(arena, c, r) {
  const terrain = arenaCellTerrain(arena, c, r)
  return terrain.walkable ? 1 / Math.max(0.2, terrain.speedMul || 1) : Infinity
}

/** The walkable cell closest to the one asked for. */
function nearestWalkableCell(arena, c, r) {
  if (walkableCell(arena, c, r)) return { c, r }
  const limit = Math.max(arena.cols, arena.rows)
  for (let radius = 1; radius <= limit; radius += 1) {
    let best = null
    let bestD = Infinity
    for (let dr = -radius; dr <= radius; dr += 1) {
      for (let dc = -radius; dc <= radius; dc += 1) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== radius) continue
        const nc = c + dc
        const nr = r + dr
        if (!walkableCell(arena, nc, nr)) continue
        const d = dc * dc + dr * dr
        if (d < bestD) {
          bestD = d
          best = { c: nc, r: nr }
        }
      }
    }
    // The first ring with land is the closest one: a further ring starts one
    // cell farther away than anything in this ring.
    if (best) return best
  }
  return null
}

/** Rebuild the cell path from the goal node back to the start. */
function reconstruct(node, startC, startR) {
  const cells = []
  let n = node
  while (n && !(n.c === startC && n.r === startR)) {
    cells.push({ c: n.c, r: n.r })
    n = n.parent
  }
  return cells.reverse()
}

/**
 * A* from one arena point to another.
 *
 * Returns an array of world-space waypoints, excluding the start point. The
 * last point is the exact goal when it is walkable, otherwise the closest
 * walkable cell. An empty array means there is no walkable route at all.
 */
export function findArenaPath(arena, start, goal) {
  if (!arena || !start || !goal) return []
  const startCell = cellOf(arena, start.x, start.y)
  const goalCell = cellOf(arena, goal.x, goal.y)
  const from = walkableCell(arena, startCell.c, startCell.r)
    ? startCell
    : nearestWalkableCell(arena, startCell.c, startCell.r)
  const to = walkableCell(arena, goalCell.c, goalCell.r)
    ? goalCell
    : nearestWalkableCell(arena, goalCell.c, goalCell.r)
  if (!from || !to) return []

  // A straight run is always the first choice. It also means a cleared path
  // costs almost nothing on the open plain.
  if (arenaLineClear(arena, start.x, start.y, goal.x, goal.y)) {
    return [{ x: goal.x, y: goal.y }]
  }
  if (from.c === to.c && from.r === to.r) return []

  const key = (c, r) => r * arena.cols + c
  const startNode = { c: from.c, r: from.r, g: 0, f: 0, parent: null }
  const open = new Heap()
  open.push(startNode)
  const best = new Map([[key(from.c, from.r), 0]])
  const closed = new Set()
  const heuristic = (c, r) => Math.hypot(c - to.c, r - to.r)
  let closest = startNode

  while (open.size) {
    const current = open.pop()
    const ck = key(current.c, current.r)
    if (closed.has(ck)) continue
    if (current.c === to.c && current.r === to.r) {
      return finishPath(arena, start, goal, walkableCell(arena, goalCell.c, goalCell.r), reconstruct(current, from.c, from.r))
    }
    closed.add(ck)
    if (heuristic(current.c, current.r) < heuristic(closest.c, closest.r)) closest = current

    for (const [dc, dr, dist] of NEIGHBORS) {
      const nc = current.c + dc
      const nr = current.r + dr
      if (!walkableCell(arena, nc, nr)) continue
      const nk = key(nc, nr)
      if (closed.has(nk)) continue
      // Do not cut a diagonal through a blocked corner.
      if (dc !== 0 && dr !== 0) {
        if (!walkableCell(arena, current.c + dc, current.r)) continue
        if (!walkableCell(arena, current.c, current.r + dr)) continue
      }
      const ng = current.g + dist * cellCost(arena, nc, nr)
      if (best.has(nk) && ng >= best.get(nk)) continue
      best.set(nk, ng)
      open.push({
        c: nc,
        r: nr,
        g: ng,
        f: ng + heuristic(nc, nr),
        parent: current
      })
    }
  }

  // Best effort: walk to the settled cell that is closest to the goal.
  if (closest !== startNode) {
    return finishPath(arena, start, goal, false, reconstruct(closest, from.c, from.r))
  }
  return []
}

/** Turn a cell path into smoothed world-space waypoints. */
function finishPath(arena, start, goal, exactGoal, cells) {
  const points = cells.map((cell) => centreOf(arena, cell.c, cell.r))
  if (exactGoal && points.length) {
    const last = points[points.length - 1]
    if (arenaLineClear(arena, last.x, last.y, goal.x, goal.y)) {
      points.push({ x: goal.x, y: goal.y })
    }
  }
  return smoothArenaPath(arena, points, start)
}

/**
 * Greedily skip waypoints that can be reached in a straight line.
 *
 * The result is the same route with the grid staircase removed, usually only
 * a handful of points, which is what a soldier actually walks.
 */
export function smoothArenaPath(arena, points, start) {
  if (!points || !points.length) return []
  const out = []
  let anchor = start ? { x: start.x, y: start.y } : null
  let i = 0

  if (!anchor) {
    anchor = points[0]
    out.push(points[0])
    i = 1
  }

  while (i < points.length) {
    let far = i
    for (let j = points.length - 1; j > i; j -= 1) {
      if (arenaLineClear(arena, anchor.x, anchor.y, points[j].x, points[j].y)) {
        far = j
        break
      }
    }
    out.push(points[far])
    anchor = points[far]
    i = far + 1
  }
  return out
}

/**
 * True when a straight line stays on walkable ground.
 *
 * The line is sampled every few pixels, which is enough for a 40 px cell and
 * much cheaper than walking every cell along the way. The small margin keeps
 * a soldier from hugging the very edge of the field.
 */
export function arenaLineClear(arena, x0, y0, x1, y1, step = 6) {
  if (!arena) return true
  const margin = 8
  const width = arena.cols * cellSize(arena)
  const height = arena.rows * cellSize(arena)
  if (
    x0 < margin || y0 < margin || x1 < margin || y1 < margin ||
    x0 > width - margin || y0 > height - margin ||
    x1 > width - margin || y1 > height - margin
  ) {
    return false
  }
  const dx = x1 - x0
  const dy = y1 - y0
  const d = Math.hypot(dx, dy)
  const samples = Math.max(1, Math.ceil(d / Math.max(1, step)))
  for (let i = 1; i <= samples; i += 1) {
    const t = i / samples
    if (!arenaWalkable(arena, x0 + dx * t, y0 + dy * t)) return false
  }
  return true
}

/**
 * Pick a natural direction for a ranged soldier to fall back.
 *
 * It starts with the direction away from the threat and tries a fan of nearby
 * directions. A candidate that keeps a clear line, stays on fast ground and
 * keeps away from the edge wins. This stops a skirmisher from backing into a
 * lake or into the corner of the field.
 */
export function retreatDirection(arena, x, y, awayX, awayY, distance = 110) {
  const len = Math.hypot(awayX, awayY)
  const base = len > 0.01 ? Math.atan2(awayY, awayX) : 0
  const angles = [0, 0.3, -0.3, 0.6, -0.6, 0.95, -0.95, 1.35, -1.35]
  const width = arena ? arena.cols * cellSize(arena) : 1000
  const height = arena ? arena.rows * cellSize(arena) : 680
  let best = null
  let bestScore = -Infinity

  for (const offset of angles) {
    const angle = base + offset
    const ex = x + Math.cos(angle) * distance
    const ey = y + Math.sin(angle) * distance
    if (ex < 20 || ey < 20 || ex > width - 20 || ey > height - 20) continue
    if (!arenaWalkable(arena, ex, ey)) continue
    const clear = arenaLineClear(arena, x, y, ex, ey, 8)
    const ground = arenaTerrainAt(arena, ex, ey)
    const edge = Math.min(ex, ey, width - ex, height - ey)
    const score =
      Math.cos(offset) * 2 +
      (clear ? 1 : 0) +
      (ground.speedMul || 1) * 0.35 +
      Math.min(edge, 120) / 120 * 0.35
    if (score > bestScore) {
      bestScore = score
      best = { x: ex, y: ey }
    }
  }

  if (best) {
    const dx = best.x - x
    const dy = best.y - y
    const d = Math.hypot(dx, dy) || 1
    return { x: dx / d, y: dy / d }
  }
  if (len > 0.01) return { x: awayX / len, y: awayY / len }
  return { x: 1, y: 0 }
}
