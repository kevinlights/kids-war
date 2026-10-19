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

// Battle map terrain presets. Only plain is fully playable today.
export const BATTLE_TERRAINS = {
  plain: {
    key: 'plain',
    name: '平原',
    en: 'Plain',
    floor: '#7cb85a',
    patch: '#6aa84f',
    enabled: true
  },
  forest: { key: 'forest', name: '森林', en: 'Forest', floor: '#4c8a43', patch: '#3f7a3a', enabled: false },
  mountain: { key: 'mountain', name: '山地', en: 'Mountain', floor: '#9a917f', patch: '#8a8073', enabled: false },
  desert: { key: 'desert', name: '沙漠', en: 'Desert', floor: '#dcc484', patch: '#cdb26f', enabled: false },
  village: { key: 'village', name: '村庄', en: 'Village', floor: '#8fa86a', patch: '#7c945a', enabled: false }
}
