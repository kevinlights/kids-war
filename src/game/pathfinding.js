// A* pathfinding over the world tile grid. Movement cost comes from terrain so
// forests and deserts are slower to cross than plains. A binary heap keeps the
// open set fast even for cross-map journeys.
import { WORLD_W, WORLD_H } from './worldgen'

const NEIGHBORS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]
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

// terrainCost(grid, x, y) -> { walkable, cost }
export function findPath(grid, start, goal, terrainCost) {
  const sx = Math.round(start.x)
  const sy = Math.round(start.y)
  const gx = Math.max(0, Math.min(WORLD_W - 1, Math.round(goal.x)))
  const gy = Math.max(0, Math.min(WORLD_H - 1, Math.round(goal.y)))

  if (sx === gx && sy === gy) return []

  const key = (x, y) => y * WORLD_W + x
  const startNode = { x: sx, y: sy, g: 0, f: 0, parent: null }
  const open = new Heap()
  open.push(startNode)
  const best = new Map([[key(sx, sy), 0]])
  const closed = new Set()
  const heuristic = (x, y) => Math.hypot(x - gx, y - gy)

  // Tracks the settled tile closest to the goal, used as a fallback when the
  // exact goal cannot be reached (clicks into water, mountains or islands).
  let closest = startNode

  while (open.size) {
    const current = open.pop()
    const ck = key(current.x, current.y)
    if (closed.has(ck)) continue
    if (current.x === gx && current.y === gy) return reconstruct(current, sx, sy)
    closed.add(ck)
    if (heuristic(current.x, current.y) < heuristic(closest.x, closest.y)) closest = current

    for (const [dx, dy, dist] of NEIGHBORS) {
      const nx = current.x + dx
      const ny = current.y + dy
      if (nx < 0 || ny < 0 || nx >= WORLD_W || ny >= WORLD_H) continue
      const nk = key(nx, ny)
      if (closed.has(nk)) continue
      const t = terrainCost(grid, nx, ny)
      if (!t.walkable) continue
      // Prevent cutting diagonally through blocked corners.
      if (dx !== 0 && dy !== 0) {
        if (!terrainCost(grid, current.x + dx, current.y).walkable) continue
        if (!terrainCost(grid, current.x, current.y + dy).walkable) continue
      }
      const ng = current.g + dist * t.cost
      if (best.has(nk) && ng >= best.get(nk)) continue
      best.set(nk, ng)
      open.push({ x: nx, y: ny, g: ng, f: ng + heuristic(nx, ny), parent: current })
    }
  }

  // Best effort: walk as close to the target as the land allows.
  if (closest !== startNode) return reconstruct(closest, sx, sy)
  return []
}

function reconstruct(node, sx, sy) {
  const path = []
  let n = node
  while (n && !(n.x === sx && n.y === sy)) {
    path.push({ x: n.x, y: n.y })
    n = n.parent
  }
  return path.reverse()
}
