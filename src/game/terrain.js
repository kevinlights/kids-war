// Terrain definitions for the world map and battle maps.
// Only the plain terrain is used for full battle simulation for now, but the
// other kinds already carry metadata so they can be enabled later.

export const TERRAIN = {
  plain: {
    key: 'plain',
    name: '平原',
    en: 'Plain',
    color: '#6fae4f',
    walkable: true,
    cost: 1
  },
  forest: {
    key: 'forest',
    name: '森林',
    en: 'Forest',
    color: '#3f7a3a',
    walkable: true,
    cost: 1.6
  },
  mountain: {
    key: 'mountain',
    name: '山地',
    en: 'Mountain',
    color: '#8a8073',
    walkable: false,
    cost: 99
  },
  water: {
    key: 'water',
    name: '水域',
    en: 'Water',
    color: '#3d78a8',
    walkable: false,
    cost: 99
  },
  desert: {
    key: 'desert',
    name: '沙漠',
    en: 'Desert',
    color: '#d8c07a',
    walkable: true,
    cost: 1.3
  }
}

export const TERRAIN_KEYS = Object.keys(TERRAIN)

// Compact id mapping so the world grid can be serialised as a small array.
export const TERRAIN_BY_ID = TERRAIN_KEYS.map((k) => TERRAIN[k])
export const TERRAIN_ID = TERRAIN_KEYS.reduce((acc, k, i) => {
  acc[k] = i
  return acc
}, {})

export function terrainFromId(id) {
  return TERRAIN_BY_ID[id] || TERRAIN.plain
}

// The terrain of a *battle* lives in `src/game/arena.js`: the battlefield is
// tiled with its own kinds (forest, desert, river, lake, mountain) that change
// how a soldier fights there.
