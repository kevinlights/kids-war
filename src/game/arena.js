/**
 * The terrain of a battle field.
 *
 * The arena is not a flat lawn any more: it is divided into cells, and every
 * cell carries a piece of terrain that changes how a soldier fights there:
 *
 *   森林 Forest    树木掩体：防御 +15%，移动 −20%
 *   沙地 Desert    体力消耗：攻击 −10%，移动 −10%
 *   河流 River     涉水而行：移动 −30%，防御 −5%
 *   湖泊 Lake      深水：无法通行
 *   山地 Mountain  居高临下：攻击 +10%，防御 −10%
 *
 * The terrain is generated from the battle seed, so a fight always looks the
 * same, and it is stored on the battle object so the simulation and the
 * renderer read exactly the same map.
 */
import { createRng } from './rng'

/** The terrain kinds of a battle field. */
export const ARENA_TERRAIN = {
  plain: {
    key: 'plain',
    name: '平原',
    en: 'Plain',
    color: '#7cb85a',
    speedMul: 1,
    atkMul: 1,
    defMul: 1,
    walkable: true,
    note: '开阔的平原，没有特殊效果。',
    en_note: 'Open ground, no special effect.'
  },
  forest: {
    key: 'forest',
    name: '森林',
    en: 'Forest',
    color: '#4c8a43',
    speedMul: 0.8,
    atkMul: 1,
    defMul: 1.15,
    walkable: true,
    note: '树木掩体：防御 +15%，移动 −20%',
    en_note: 'Cover of the trees: defence +15%, movement -20%.'
  },
  desert: {
    key: 'desert',
    name: '沙地',
    en: 'Desert',
    color: '#dcc484',
    speedMul: 0.9,
    atkMul: 0.9,
    defMul: 1,
    walkable: true,
    note: '体力消耗：攻击 −10%，移动 −10%',
    en_note: 'The heat tires the troops: attack -10%, movement -10%.'
  },
  river: {
    key: 'river',
    name: '河流',
    en: 'River',
    color: '#4f8fd0',
    speedMul: 0.7,
    atkMul: 1,
    defMul: 0.95,
    walkable: true,
    note: '涉水而行：移动 −30%，防御 −5%',
    en_note: 'Wading is slow: movement -30%, defence -5%.'
  },
  lake: {
    key: 'lake',
    name: '湖泊',
    en: 'Lake',
    color: '#2f6ea8',
    speedMul: 1,
    atkMul: 1,
    defMul: 1,
    walkable: false,
    note: '深水湖泊：无法通行',
    en_note: 'Deep water: nobody can cross it.'
  },
  mountain: {
    key: 'mountain',
    name: '山地',
    en: 'Mountain',
    color: '#9a917f',
    speedMul: 0.9,
    atkMul: 1.1,
    defMul: 0.9,
    walkable: true,
    note: '居高临下：攻击 +10%，防御 −10%',
    en_note: 'The high ground: attack +10%, defence -10%.'
  }
}

/** The terrain keys, in the order the cell array stores them. */
export const ARENA_TERRAIN_KEYS = Object.keys(ARENA_TERRAIN)

/** Every terrain record, for the legend of the battle field. */
export const ARENA_TERRAIN_LIST = ARENA_TERRAIN_KEYS.map((k) => ARENA_TERRAIN[k])

/** Size of one terrain cell, in arena units. */
export const ARENA_CELL = 40

/**
 * The battlefields a field can be laid out on.
 *
 * A battlefield is a preset of the terrain generator: it decides which kinds
 * of ground the field holds. The quick battle simulator offers them all, and
 * a fight on the plain plays very differently from a fight in the woods.
 * 战场预设：地形生成器按预设摆放地形，快速战斗里可以挑选。
 */
export const ARENA_MAPS = [
  {
    key: 'mixed',
    name: '混战',
    en: 'Mixed',
    icon: '🗺️',
    note: '森林、河流、山地与湖泊俱全，最常见的战场。'
  },
  {
    key: 'plain',
    name: '平原',
    en: 'Plain',
    icon: '🌾',
    note: '一马平川：没有掩体，也没有地形加成。'
  },
  {
    key: 'forest',
    name: '密林',
    en: 'Forest',
    icon: '🌲',
    note: '大片树林：防御 +15%，移动 −20%。'
  },
  {
    key: 'mountain',
    name: '山地',
    en: 'Mountain',
    icon: '⛰️',
    note: '起伏的山地：攻击 +10%，防御 −10%。'
  },
  {
    key: 'river',
    name: '大河',
    en: 'River',
    icon: '🌊',
    note: '一条大河横穿战场：涉水移动 −30%，防御 −5%。'
  },
  {
    key: 'lake',
    name: '湖泽',
    en: 'Lake',
    icon: '🏞️',
    note: '中央一个大湖，深水不可通行，只能绕行。'
  }
]

/** The battlefield record of a key, falling back to the mixed one. */
export function arenaMapOf(key) {
  return ARENA_MAPS.find((m) => m.key === key) || ARENA_MAPS[0]
}

/**
 * Generate the terrain of a battle field.
 *
 * The field is `cols` by `rows` cells. A winding river crosses it, a lake and
 * a mountain sit in the field and a couple of forests and a stretch of sand
 * break up the plain. **Every piece is placed from the seed**, so two battles
 * never share a map, even when they use the same preset.
 *
 * The `map` preset decides which of those pieces the field holds:
 * `mixed` is the full set, `plain` is empty ground and the other presets put
 * one kind of terrain in the middle of the field.
 */
export function generateArenaTerrain(seed, cols = 25, rows = 17, map = 'mixed') {
  const rng = createRng((seed || 1) * 2654435761)
  const cells = new Uint8Array(cols * rows)
  const index = (c, r) => r * cols + c
  const set = (c, r, key) => {
    if (c < 0 || r < 0 || c >= cols || r >= rows) return
    cells[index(c, r)] = ARENA_TERRAIN_KEYS.indexOf(key)
  }
  const get = (c, r) => (c < 0 || r < 0 || c >= cols || r >= rows ? 'plain' : ARENA_TERRAIN_KEYS[cells[index(c, r)]])

  /** A blob of one terrain kind around a point. */
  const blob = (cc, rr, radius, key) => {
    for (let r = rr - radius; r <= rr + radius; r += 1) {
      for (let c = cc - radius; c <= cc + radius; c += 1) {
        const dx = c - cc
        const dy = r - rr
        if (dx * dx + dy * dy > radius * radius) continue
        // The edge of a blob is ragged, so it does not look like a circle.
        if (radius > 1 && rng.next() < 0.18) continue
        set(c, r, key)
      }
    }
  }

  // Where a piece may stand. The seed picks every position, and the bounds keep
  // the pieces on the field and out of the two deployment bands.
  const span = (lo, hi, size) => Math.max(1, Math.min(size - 2, Math.floor((lo + rng.next() * (hi - lo)) * size)))
  const radiusOf = (big, small) => (big ? 4 : small + (rng.next() < 0.4 ? 1 : 0))

  // Which pieces of terrain this battlefield holds.
  const wantRiver = map === 'mixed' || map === 'river'
  const wantLake = map === 'mixed' || map === 'lake'
  const wantMountain = map === 'mixed' || map === 'mountain'
  const wantForest = map === 'mixed' || map === 'forest'
  const wantDesert = map === 'mixed'

  // The river winds from the top to the bottom of the field: where it starts,
  // how wide it is and which way it leans all come from the seed.
  let riverCol = span(0.24, 0.54, cols)
  const baseWidth = map === 'river' ? 3 : rng.next() < 0.4 ? 2 : 1
  const riverAt = new Array(rows).fill(riverCol)
  if (wantRiver) {
    let drift = rng.next() * 2 - 1
    for (let r = 0; r < rows; r += 1) {
      riverAt[r] = riverCol
      const width = baseWidth + (rng.next() < 0.12 ? 1 : 0)
      for (let c = riverCol; c < riverCol + width; c += 1) set(c, r, 'river')
      drift += rng.next() * 1.7 - 0.85
      riverCol += drift > 0.55 ? 1 : drift < -0.55 ? -1 : 0
      riverCol = Math.max(1, Math.min(cols - 4, riverCol))
    }
  }

  // A lake in the middle and a mountain in one of the upper corners. The lake
  // stays strictly inside the field, so it can never cut it in two.
  if (wantLake) {
    if (map === 'lake') blob(Math.floor(cols * 0.5), Math.floor(rows * 0.5), 4, 'lake')
    else blob(span(0.36, 0.64, cols), span(0.3, 0.72, rows), radiusOf(false, 2), 'lake')
  }
  if (wantMountain) {
    if (map === 'mountain') {
      blob(span(0.2, 0.34, cols), span(0.25, 0.4, rows), 4, 'mountain')
      blob(span(0.66, 0.8, cols), span(0.6, 0.75, rows), 4, 'mountain')
    } else {
      blob(span(0.66, 0.86, cols), span(0.14, 0.4, rows), radiusOf(false, 2), 'mountain')
    }
  }

  // Forests and a stretch of sand.
  if (wantForest) {
    if (map === 'forest') {
      blob(span(0.16, 0.32, cols), span(0.22, 0.4, rows), 4, 'forest')
      blob(span(0.66, 0.84, cols), span(0.6, 0.78, rows), 4, 'forest')
    } else {
      blob(span(0.08, 0.26, cols), span(0.14, 0.4, rows), radiusOf(false, 2), 'forest')
      blob(span(0.4, 0.7, cols), span(0.56, 0.86, rows), radiusOf(false, 2), 'forest')
    }
  }
  if (wantDesert) blob(span(0.34, 0.66, cols), span(0.08, 0.2, rows), radiusOf(false, 2), 'desert')

  // Where a lake sits under the river it becomes shallow water: the lake must
  // not dam the one way across the field.
  if (wantRiver) {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (get(c, r) !== 'lake') continue
        if (Math.abs(c - riverAt[r]) <= 2) set(c, r, 'river')
      }
    }
  }

  // The armies deploy on the left and on the right, so no water may stand
  // there: a soldier that starts in a lake could never get out of it.
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (get(c, r) !== 'lake') continue
      const inDeployment = c <= Math.floor(cols * 0.28) || c >= Math.floor(cols * 0.72)
      if (inDeployment) set(c, r, 'plain')
    }
  }

  return { seed: seed || 1, cols, rows, cell: ARENA_CELL, cells }
}

/** The terrain record of a cell. */
export function arenaCellTerrain(arena, col, row) {
  if (!arena) return ARENA_TERRAIN.plain
  const c = Math.max(0, Math.min(arena.cols - 1, col))
  const r = Math.max(0, Math.min(arena.rows - 1, row))
  const key = ARENA_TERRAIN_KEYS[arena.cells[r * arena.cols + c]] || 'plain'
  return ARENA_TERRAIN[key]
}

/** The terrain at an arena position (in arena units). */
export function arenaTerrainAt(arena, x, y) {
  if (!arena) return ARENA_TERRAIN.plain
  const col = Math.floor(x / arena.cell)
  const row = Math.floor(y / arena.cell)
  return arenaCellTerrain(arena, col, row)
}

/** True when a position can be walked on. */
export function arenaWalkable(arena, x, y) {
  return arenaTerrainAt(arena, x, y).walkable
}
