// Procedural world generation: terrain, settlements and faction parties.
// Terrain noise tends to fragment the land into islands, so generation keeps
// only the largest connected walkable region as the playable mainland and
// places every town, village, party and the player inside it. That guarantees
// any two landmarks can actually be reached by walking.
import { createRng, valueNoise } from './rng'
import { terrainFromId, TERRAIN } from './terrain'
import { NPC_FACTIONS } from './factions'
import { KINGDOMS, NEUTRAL, BANDIT, makeGarrison, normalizeSettlement } from './settlement'

export const WORLD_W = 160
export const WORLD_H = 128
export const TILE = 32 // screen pixels per world tile

// Minimum walkable tiles required for the mainland; smaller rolls are retried.
const MIN_MAIN_TILES = 2800

const TOWN_NAMES = [
  ['晨曦', '城'], ['铁砧', '城'], ['白河', '城'], ['落霞', '城'], ['苍岩', '城'],
  ['金穗', '城'], ['青松', '城'], ['望海', '城'], ['石桥', '城'], ['长风', '城']
]

const VILLAGE_NAMES = [
  '麦田村', '柳林村', '石泉村', '杏花村', '打谷村', '牧云村',
  '芦苇村', '铁匠村', '橡树村', '竹子村', '野渡村', '蜂巢村',
  '燕麦村', '桃源村', '松风村', '溪畔村', '白沙村', '青禾村',
  '石桥村', '云杉村', '枣林村', '南塘村', '望山屯', '枫叶村'
]

/** Who holds a village: a kingdom, nobody, or a band of bandits. */
function pickVillageOwner(rng) {
  const roll = rng.next()
  if (roll < 0.5) return rng.pick(KINGDOMS)
  if (roll < 0.78) return NEUTRAL
  return BANDIT
}

function buildTerrainGrid(rng) {
  const height = valueNoise(rng, WORLD_W, WORLD_H, 10)
  const moisture = valueNoise(rng, WORLD_W, WORLD_H, 7)
  const grid = []
  for (let y = 0; y < WORLD_H; y++) {
    const row = []
    for (let x = 0; x < WORLD_W; x++) {
      const h = height[y][x]
      const m = moisture[y][x]
      let key
      if (h < 0.30) key = 'water'
      else if (h > 0.72) key = 'mountain'
      else if (m > 0.64) key = 'forest'
      else if (m < 0.33) key = 'desert'
      else key = 'plain'
      row.push(key)
    }
    grid.push(row)
  }
  // Sprinkle a few forest and mountain outcrops for texture variety.
  for (let i = 0; i < 90; i++) {
    const x = rng.int(2, WORLD_W - 3)
    const y = rng.int(2, WORLD_H - 3)
    if (grid[y][x] !== 'water') grid[y][x] = rng.chance(0.55) ? 'forest' : 'mountain'
  }
  return grid
}

function walkableAt(grid, x, y) {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return false
  const t = TERRAIN[grid[y][x]]
  return !!t && t.walkable
}

// Mark every tile that belongs to the biggest connected walkable landmass.
function buildMainComponent(grid) {
  const idx = (x, y) => y * WORLD_W + x
  const seen = new Uint8Array(WORLD_W * WORLD_H)
  let best = null

  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const start = idx(x, y)
      if (seen[start] || !walkableAt(grid, x, y)) continue
      const comp = [start]
      seen[start] = 1
      for (let head = 0; head < comp.length; head++) {
        const cx = comp[head] % WORLD_W
        const cy = Math.floor(comp[head] / WORLD_W)
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx
          const ny = cy + dy
          if (!walkableAt(grid, nx, ny)) continue
          const nk = idx(nx, ny)
          if (seen[nk]) continue
          seen[nk] = 1
          comp.push(nk)
        }
      }
      if (!best || comp.length > best.length) best = comp
    }
  }

  const mask = new Uint8Array(WORLD_W * WORLD_H)
  if (best) for (const k of best) mask[k] = 1
  return mask
}

const maskCount = (mask) => mask.reduce((n, v) => n + (v ? 1 : 0), 0)

// Find a mainland spot that keeps a minimum distance from existing anchors.
function findSpot(rng, grid, mask, anchors, minDist, tries = 300) {
  for (let i = 0; i < tries; i++) {
    const x = rng.int(3, WORLD_W - 4)
    const y = rng.int(3, WORLD_H - 4)
    if (!mask[y * WORLD_W + x]) continue
    // Require breathing room: every neighbour of the spot must be walkable.
    let open = 0
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (walkableAt(grid, x + dx, y + dy)) open++
      }
    }
    if (open < 8) continue
    let ok = true
    for (const a of anchors) {
      if (Math.hypot(a.x - x, a.y - y) < minDist) {
        ok = false
        break
      }
    }
    if (ok) return { x, y }
  }
  return null
}

function makeParty(rng, id, faction, x, y) {
  const units = []
  if (faction === 'bandit') {
    // Bandits are a rabble: mostly militia with a few basic regulars.
    units.push({ type: 'militia', tier: 1, count: rng.int(4, 12) })
    if (rng.chance(0.4)) units.push({ type: 'archer', tier: 1, count: rng.int(1, 3) })
    if (rng.chance(0.25)) units.push({ type: 'spearman', tier: 1, count: rng.int(1, 3) })
  } else {
    // Kingdoms field a mixed army: spearmen hold the line, archers shoot over
    // them and cavalry flanks, with the odd rank-2 regular.
    units.push({ type: 'militia', tier: 1, count: rng.int(4, 10) })
    units.push({ type: 'spearman', tier: rng.chance(0.4) ? 2 : 1, count: rng.int(2, 5) })
    if (rng.chance(0.7)) units.push({ type: 'archer', tier: rng.chance(0.35) ? 2 : 1, count: rng.int(1, 4) })
    if (rng.chance(0.45)) units.push({ type: 'cavalry', tier: 1, count: rng.int(1, 3) })
    if (rng.chance(0.22)) units.push({ type: 'cavalry', tier: 2, count: rng.int(1, 2) })
  }
  return {
    id: `p${id}`,
    faction,
    x,
    y,
    homeX: x,
    homeY: y,
    units,
    speed: faction === 'bandit' ? 1.15 : 1,
    wanderTimer: rng.float(0, 4),
    targetX: x,
    targetY: y
  }
}

function buildParties(rng, grid, mask, settlements) {
  const parties = []
  let pid = 0

  for (const faction of NPC_FACTIONS) {
    // Each faction gets one or two mainland anchors, then parties cluster there.
    const anchors = []
    const anchorCount = faction === 'bandit' ? 3 : 2
    for (let i = 0; i < anchorCount; i++) {
      const spot = findSpot(rng, grid, mask, [...settlements, ...anchors], 12)
      if (spot) anchors.push(spot)
    }
    if (anchors.length === 0) continue

    const partyCount = faction === 'bandit' ? rng.int(5, 8) : rng.int(4, 6)
    for (let i = 0; i < partyCount; i++) {
      const anchor = rng.pick(anchors)
      const cx = Math.min(WORLD_W - 3, Math.max(2, anchor.x + rng.int(-6, 6)))
      const cy = Math.min(WORLD_H - 3, Math.max(2, anchor.y + rng.int(-6, 6)))
      const pos = mask[cy * WORLD_W + cx] ? { x: cx, y: cy } : anchor
      parties.push(makeParty(rng, pid++, faction, pos.x, pos.y))
    }
  }
  return parties
}

// Build one candidate world (terrain + everything placed on the mainland).
function buildWorld(seed) {
  const rng = createRng(seed)
  const grid = buildTerrainGrid(rng)
  const mask = buildMainComponent(grid)
  const mainTiles = maskCount(mask)

  const settlements = []
  const anchors = []

  const townSpots = []
  for (let i = 0; i < 8; i++) {
    const spot = findSpot(rng, grid, mask, [...anchors, ...townSpots], 15)
    if (spot) townSpots.push(spot)
  }
  townSpots.forEach((spot, i) => {
    const name = TOWN_NAMES[i % TOWN_NAMES.length]
    settlements.push({
      id: `t${i}`,
      kind: 'town',
      name: name[0] + name[1],
      x: spot.x,
      y: spot.y,
      recruitSeed: rng.int(1, 99999),
      // A town always belongs to somebody: a kingdom or nobody at all. The
      // bandits never hold a town — that is the rule that keeps them small.
      owner: rng.next() < 0.72 ? rng.pick(KINGDOMS) : NEUTRAL
    })
    anchors.push(spot)
  })

  const villageSpots = []
  for (let i = 0; i < 24; i++) {
    const spot = findSpot(rng, grid, mask, [...anchors, ...villageSpots], 8)
    if (spot) villageSpots.push(spot)
  }
  villageSpots.forEach((spot, i) => {
    settlements.push({
      id: `v${i}`,
      kind: 'village',
      name: VILLAGE_NAMES[i % VILLAGE_NAMES.length],
      x: spot.x,
      y: spot.y,
      recruitSeed: rng.int(1, 99999),
      // Villages are fair game: a kingdom, nobody, or a band of bandits.
      owner: pickVillageOwner(rng)
    })
  })

  // Spawn the player next to the first town, on the same mainland.
  let spawn = null
  if (settlements.length) {
    const home = settlements[0]
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [0, 2]]
    for (const [dx, dy] of dirs) {
      const x = home.x + dx
      const y = home.y + dy
      if (walkableAt(grid, x, y)) {
        spawn = { x, y }
        break
      }
    }
  }
  if (!spawn) {
    const spot = findSpot(rng, grid, mask, settlements, 3)
    spawn = spot || { x: Math.floor(WORLD_W / 2), y: Math.floor(WORLD_H / 2) }
  }

  const parties = buildParties(rng, grid, mask, settlements)

  // Every settlement gets its economy and the soldiers that defend it.
  for (const st of settlements) {
    st.level = 1
    st.prosperity = st.owner === NEUTRAL ? 30 : 40
    st.development = 20
    st.funds = 0
    st.facilities = { hospital: 0, barracks: 0 }
    st.siege = null
    // An unclaimed town is not always defended: some of them keep a local
    // watch that has to be beaten first, the others can be taken by raising
    // the flag.
    const undefended = st.owner === NEUTRAL && st.kind === 'town' && rng.next() < 0.45
    st.garrison = undefended ? [] : makeGarrison(st)
    normalizeSettlement(st)
  }

  return { seed, w: WORLD_W, h: WORLD_H, grid, settlements, parties, spawn, mainTiles }
}

// Generate a world, retrying with a nudged seed until the mainland is big
// enough and a few settlements actually fit on it.
export function generateWorld(seed) {
  let candidate = null
  for (let attempt = 0; attempt < 8; attempt++) {
    const built = buildWorld(seed + attempt * 101)
    if (!candidate || built.mainTiles > candidate.mainTiles) candidate = built
    if (built.mainTiles >= MIN_MAIN_TILES && built.settlements.length >= 6) {
      candidate = built
      break
    }
  }
  const { mainTiles, ...world } = candidate
  void mainTiles
  return world
}

// Serialise the terrain grid to a compact id array for localStorage.
export function gridToIds(grid) {
  const map = { plain: 0, forest: 1, mountain: 2, water: 3, desert: 4 }
  const out = []
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) out.push(map[grid[y][x]] || 0)
  }
  return out
}

export function idsToGrid(ids, w, h) {
  const grid = []
  let i = 0
  for (let y = 0; y < h; y++) {
    const row = []
    for (let x = 0; x < w; x++) row.push(terrainFromId(ids[i++]).key)
    grid.push(row)
  }
  return grid
}
