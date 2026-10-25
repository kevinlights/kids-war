/**
 * The town and village scenes: the ground, the buildings, the street props and
 * the places where people stand.
 *
 * A settlement on the world map is a single icon. Walking through its gate puts
 * the lord on a small map of his own — a square, a road, houses and the
 * facilities the town can offer — and he moves there exactly as he moves on the
 * world map: tap the ground, the lord finds his way.
 *
 * The layout is generated from the settlement, never stored: the same town
 * always lays out the same streets, so a save only keeps the lord's progress in
 * it. The town scene is therefore a pure function of `(settlement kind, seed)`.
 */
import { createRng } from './rng'
import { findPathOn } from './pathfinding'
import { makeNpcs } from './npc'

/** Screen pixels per town tile. Same as the world map, so the art matches. */
export const TOWN_TILE = 32

/** Size of the two kinds of scene, in tiles. */
export const SCENE_SIZE = {
  town: { w: 34, h: 26 },
  village: { w: 26, h: 20 }
}

/**
 * Every kind of building a scene may hold.
 *
 * `panel` is what the interface opens when the lord walks up to the door, and
 * `w`/`h` is the footprint in tiles, which is also what the pathfinder treats as
 * blocked ground.
 */
export const BUILDINGS = {
  hall: {
    key: 'hall',
    sprite: 'town-hall',
    name: '议事厅',
    en: 'Town hall',
    w: 3,
    h: 3,
    panel: 'town',
    note: '城镇管理：资金、发展、设施与驻军。'
  },
  market: {
    key: 'market',
    sprite: 'town-market',
    name: '集市',
    en: 'Market',
    w: 2,
    h: 2,
    panel: 'market',
    note: '买卖军粮、战马与集市券。'
  },
  barracks: {
    key: 'barracks',
    sprite: 'town-barracks',
    name: '兵营',
    en: 'Barracks',
    w: 2,
    h: 2,
    panel: 'recruit',
    note: '招募士兵，把民兵练成正式兵种。'
  },
  hospital: {
    key: 'hospital',
    sprite: 'town-hospital',
    name: '医馆',
    en: 'Hospital',
    w: 2,
    h: 2,
    panel: 'hospital',
    note: '伤兵在这里养伤，恢复得更快。'
  },
  school: {
    key: 'school',
    sprite: 'town-school',
    name: '学堂',
    en: 'School',
    w: 2,
    h: 2,
    panel: 'exam',
    note: '参加考试赚金币，答对还能让城镇发展。'
  },
  tavern: {
    key: 'tavern',
    sprite: 'town-tavern',
    name: '酒馆',
    en: 'Tavern',
    w: 2,
    h: 2,
    panel: 'tavern',
    note: '镇上的人都在这里，消息和随从也在这里。'
  },
  smithy: {
    key: 'smithy',
    sprite: 'town-smithy',
    name: '铁匠铺',
    en: 'Smithy',
    w: 2,
    h: 2,
    panel: 'upgrade',
    note: '升级兵种，把士兵换更好的装备。'
  },
  barn: {
    key: 'barn',
    sprite: 'town-barn',
    name: '谷仓',
    en: 'Barn',
    w: 2,
    h: 2,
    panel: 'market',
    note: '村里的粮食和货物都在这里交易。'
  },
  mill: {
    key: 'mill',
    sprite: 'town-mill',
    name: '磨坊',
    en: 'Mill',
    w: 2,
    h: 2,
    panel: 'chat',
    note: '磨坊主知道村里所有的闲话。'
  },
  well: {
    key: 'well',
    sprite: 'town-well',
    name: '水井',
    en: 'Well',
    w: 1,
    h: 1,
    panel: 'chat',
    note: '挑水的地方，也是听消息的地方。'
  },
  house: {
    key: 'house',
    sprite: 'town-house-a',
    name: '民居',
    en: 'House',
    w: 2,
    h: 2,
    panel: 'chat',
    note: '住在这里的人，愿意和你说几句话。'
  }
}

/** Ground keys of a scene, with the cost of walking across one tile. */
export const GROUND = {
  grass: { key: 'grass', walkable: true, cost: 1.35 },
  path: { key: 'path', walkable: true, cost: 1 },
  cobble: { key: 'cobble', walkable: true, cost: 1 },
  plaza: { key: 'plaza', walkable: true, cost: 1 },
  farm: { key: 'farm', walkable: true, cost: 1.3 },
  water: { key: 'water', walkable: false, cost: 99 }
}

/** Names of the buildings a scene of this kind holds, in placement order. */
const TOWN_PLAN = ['hall', 'market', 'school', 'barracks', 'tavern', 'hospital', 'smithy', 'house', 'house', 'house', 'house', 'house']
const VILLAGE_PLAN = ['barn', 'market', 'mill', 'house', 'house', 'house', 'house', 'well']

/**
 * Where a building of each footprint may stand.
 *
 * The lots are fixed bands either side of the two roads, which is what gives
 * every town the same readable shape: a square in the middle, facilities on the
 * main street, houses behind them.
 */
const LOTS = {
  town: [
    // 3x3 lot for the hall, on the west side of the north road.
    { x: 11, y: 2, w: 3, h: 3 },
    { x: 2, y: 3, w: 2, h: 2 },
    { x: 7, y: 3, w: 2, h: 2 },
    { x: 21, y: 3, w: 2, h: 2 },
    { x: 26, y: 3, w: 2, h: 2 },
    { x: 2, y: 8, w: 2, h: 2 },
    { x: 7, y: 8, w: 2, h: 2 },
    { x: 21, y: 8, w: 2, h: 2 },
    { x: 26, y: 8, w: 2, h: 2 },
    { x: 2, y: 18, w: 2, h: 2 },
    { x: 7, y: 18, w: 2, h: 2 },
    { x: 21, y: 18, w: 2, h: 2 },
    { x: 26, y: 18, w: 2, h: 2 },
    { x: 2, y: 22, w: 2, h: 2 },
    { x: 7, y: 22, w: 2, h: 2 },
    { x: 21, y: 22, w: 2, h: 2 },
    { x: 26, y: 22, w: 2, h: 2 }
  ],
  village: [
    { x: 2, y: 2, w: 2, h: 2 },
    { x: 7, y: 2, w: 2, h: 2 },
    { x: 16, y: 2, w: 2, h: 2 },
    { x: 21, y: 2, w: 2, h: 2 },
    { x: 2, y: 6, w: 2, h: 2 },
    { x: 7, y: 6, w: 2, h: 2 },
    { x: 16, y: 6, w: 2, h: 2 },
    { x: 21, y: 6, w: 2, h: 2 },
    { x: 2, y: 14, w: 2, h: 2 },
    { x: 7, y: 14, w: 2, h: 2 },
    { x: 16, y: 14, w: 2, h: 2 },
    { x: 21, y: 14, w: 2, h: 2 },
    // The well is a single tile, so it needs a lot of its own.
    { x: 10, y: 7, w: 1, h: 1 }
  ]
}

/* -------------------------------- the scene -------------------------------- */

const cache = new Map()

/**
 * The scene of one settlement. The result is cached, so walking out of a town
 * and back in does not rebuild it (and the townsfolk keep their places).
 */
export function buildScene(settlement) {
  if (!settlement) return null
  const key = `${settlement.id}:${settlement.kind}:${settlement.recruitSeed || 0}`
  if (cache.has(key)) return cache.get(key)
  const scene = settlement.kind === 'town' ? buildTown(settlement) : buildVillage(settlement)
  cache.set(key, scene)
  return scene
}

function blankGrid(w, h, key = 'grass') {
  const grid = []
  for (let y = 0; y < h; y += 1) {
    const row = new Array(w).fill(key)
    grid.push(row)
  }
  return grid
}

/** Paint a rectangle of ground, clamped to the map. */
function paintGround(scene, x, y, w, h, key) {
  for (let j = 0; j < h; j += 1) {
    for (let i = 0; i < w; i += 1) {
      const px = x + i
      const py = y + j
      if (px < 0 || py < 0 || px >= scene.w || py >= scene.h) continue
      scene.ground[py][px] = key
    }
  }
}

/** Reserve the footprint of a building and return its door tile. */
function blockArea(scene, x, y, w, h) {
  for (let j = 0; j < h; j += 1) {
    for (let i = 0; i < w; i += 1) {
      const px = x + i
      const py = y + j
      if (px < 0 || py < 0 || px >= scene.w || py >= scene.h) continue
      scene.blocked[py * scene.w + px] = 1
    }
  }
}

function buildTown(settlement) {
  const rng = createRng((settlement.recruitSeed || 1) + 40503)
  const { w, h } = SCENE_SIZE.town
  const midX = Math.floor(w / 2)
  const midY = Math.floor(h / 2)
  const scene = {
    id: settlement.id,
    kind: 'town',
    name: settlement.name,
    w,
    h,
    ground: blankGrid(w, h, 'grass'),
    blocked: new Uint8Array(w * h),
    buildings: [],
    props: [],
    npcs: []
  }

  // Roads: a wide main street and the square where the two meet.
  paintGround(scene, 1, midY - 1, w - 2, 3, 'path')
  paintGround(scene, midX - 1, 1, 3, h - 2, 'path')
  paintGround(scene, midX - 5, midY - 4, 11, 9, 'plaza')
  // The street through the square stays a street.
  paintGround(scene, 1, midY - 1, w - 2, 3, 'cobble')
  paintGround(scene, midX - 1, 1, 3, h - 2, 'cobble')

  // Anything off the main street is a dirt lane: the two side roads into the
  // housing blocks, so the town is walkable in every direction.
  paintGround(scene, 4, midY - 6, 1, 5, 'path')
  paintGround(scene, w - 5, midY - 6, 1, 5, 'path')

  // The fountain is the middle of the square.
  const fountain = { id: 'fountain', sprite: 'town-fountain', x: midX, y: midY, w: 1, h: 1, solid: true }
  scene.props.push(fountain)
  scene.blocked[midY * w + midX] = 1

  placePlan(scene, TOWN_PLAN, LOTS.town, rng, settlement)
  decorate(scene, rng, 'town')
  addPeople(scene, settlement, rng, 7, 3)
  scene.spawn = { x: midX, y: h - 2 }
  scene.exit = { x: midX, y: h - 1 }
  return scene
}

function buildVillage(settlement) {
  const rng = createRng((settlement.recruitSeed || 1) + 91117)
  const { w, h } = SCENE_SIZE.village
  const midX = Math.floor(w / 2)
  const midY = Math.floor(h / 2)
  const scene = {
    id: settlement.id,
    kind: 'village',
    name: settlement.name,
    w,
    h,
    ground: blankGrid(w, h, 'grass'),
    blocked: new Uint8Array(w * h),
    buildings: [],
    props: [],
    npcs: []
  }

  // One dirt road through the village, and a second one across it.
  paintGround(scene, 1, midY - 1, w - 2, 2, 'path')
  paintGround(scene, midX - 1, 1, 2, h - 2, 'path')

  // Fields around the edge: the whole reason the village exists.
  paintGround(scene, 1, 1, 5, 4, 'farm')
  paintGround(scene, w - 6, h - 5, 5, 4, 'farm')
  paintGround(scene, 1, h - 5, 4, 4, 'farm')

  placePlan(scene, VILLAGE_PLAN, LOTS.village, rng, settlement)
  decorate(scene, rng, 'village')
  addPeople(scene, settlement, rng, 4, 2)
  scene.spawn = { x: midX, y: h - 2 }
  scene.exit = { x: midX, y: h - 1 }
  return scene
}

/**
 * Put the buildings of a plan on the free lots, in the order the plan lists
 * them, then fill whatever is left with trees and grass.
 */
function placePlan(scene, plan, lots, rng, settlement) {
  const free = [...lots]
  const houseSkins = ['town-house-a', 'town-house-b', 'town-house-c']
  let houseIndex = 0
  for (const key of plan) {
    const def = BUILDINGS[key]
    const lotIndex = free.findIndex((l) => l.w === def.w && l.h === def.h)
    if (lotIndex < 0) continue
    const lot = free.splice(lotIndex, 1)[0]
    const building = {
      id: `${scene.id}-b${scene.buildings.length}`,
      key,
      sprite: key === 'house' ? houseSkins[houseIndex++ % houseSkins.length] : def.sprite,
      name: def.name,
      en: def.en,
      panel: def.panel,
      note: def.note,
      x: lot.x,
      y: lot.y,
      w: def.w,
      h: def.h,
      // The door is the tile right under the building: the lord stands there to
      // go in, and everybody else walks around it.
      door: { x: lot.x + Math.floor(def.w / 2), y: lot.y + def.h }
    }
    if (key === 'house') {
      building.label = `${def.name}`
      building.owner = settlement.owner === 'player' ? '你的镇民' : '镇民'
    }
    scene.buildings.push(building)
    blockArea(scene, lot.x, lot.y, def.w, def.h)
  }
}

/**
 * Street dressing.
 *
 * Lamps follow the roads, barrels and crates gather around the shops, trees and
 * bushes fill the empty grass, and fences close the edges of the map so the
 * scene reads as a place rather than a field. Everything here is decoration
 * except the trees, the fences and the haystacks, which block the way.
 */
function decorate(scene, rng, kind) {
  const solidProps = new Set(['prop-tree', 'prop-banner', 'prop-haystack', 'prop-fence', 'prop-cart'])
  // The tile in front of a door and the one below it stay empty: a barrel or a
  // tree dropped on a doorstep would wall a facility off from the square.
  const reserved = new Set()
  for (const b of scene.buildings) {
    for (const dy of [0, 1]) reserved.add(`${b.door.x},${b.door.y + dy}`)
    reserved.add(`${b.door.x - 1},${b.door.y + 1}`)
    reserved.add(`${b.door.x + 1},${b.door.y + 1}`)
  }
  const add = (sprite, x, y) => {
    if (x < 1 || y < 1 || x >= scene.w - 1 || y >= scene.h - 1) return false
    if (reserved.has(`${x},${y}`)) return false
    if (scene.blocked[y * scene.w + x]) return false
    if (scene.props.some((p) => Math.round(p.x) === x && Math.round(p.y) === y)) return false
    scene.props.push({ sprite, x, y, solid: solidProps.has(sprite) })
    if (solidProps.has(sprite)) scene.blocked[y * scene.w + x] = 1
    return true
  }

  // Lamps down both sides of the main street.
  for (let x = 4; x < scene.w - 3; x += 7) {
    add('prop-lamp', x, Math.floor(scene.h / 2) + 2)
  }

  // Market clutter: barrels and crates on the pavement near the shops.
  for (const b of scene.buildings) {
    if (b.key === 'market' || b.key === 'barn') {
      add('prop-barrel', b.x + b.w, b.y + b.h - 1)
      add('prop-crate', b.x + b.w, b.y + b.h)
    }
    if (b.key === 'tavern') add('prop-barrel', b.x - 1, b.y + b.h - 1)
    if (b.key === 'hall') {
      add('prop-banner', b.x - 1, b.y)
      add('prop-banner', b.x + b.w, b.y)
      add('prop-signpost', b.door.x + 1, b.door.y)
    }
    if (b.key === 'school') add('prop-cart', b.x - 1, b.y + b.h)
  }

  // Trees and bushes on the open grass, then a fence around the whole map.
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const x = rng.int(1, scene.w - 2)
    const y = rng.int(1, scene.h - 2)
    if (scene.ground[y][x] !== 'grass') continue
    if (scene.blocked[y * scene.w + x]) continue
    // Keep the square and the doorways clear.
    if (Math.hypot(x - scene.w / 2, y - scene.h / 2) < 5) continue
    add(rng.next() < 0.7 ? 'prop-tree' : 'prop-bush', x, y)
  }
  for (let y = 3; y < scene.h - 3; y += 4) add('prop-fence', scene.w - 1, y)
  if (kind === 'village') {
    for (let x = 4; x < scene.w - 4; x += 5) add('prop-haystack', x, 1)
  }
}

/**
 * The people of the scene.
 *
 * They stand by the doors first — a shopkeeper at the market, a guard at the
 * barracks — then around the square, which is where a child would look for
 * someone to talk to.
 */
function addPeople(scene, settlement, rng, count, followers) {
  const spots = []
  for (const b of scene.buildings) {
    const door = b.door
    if (isWalkable(scene, door.x, door.y)) spots.push({ x: door.x, y: door.y })
  }
  const midX = Math.floor(scene.w / 2)
  const midY = Math.floor(scene.h / 2)
  for (let r = 2; r <= 4; r += 1) {
    for (let a = 0; a < 12; a += 1) {
      const x = Math.round(midX + Math.cos((a / 12) * Math.PI * 2) * r)
      const y = Math.round(midY + Math.sin((a / 12) * Math.PI * 2) * r * 0.8)
      if (isWalkable(scene, x, y)) spots.push({ x, y })
    }
  }
  // Shuffle the ring spots so the town does not look like a clock face.
  for (let i = spots.length - 1; i > 1; i -= 1) {
    const j = rng.int(1, i)
    ;[spots[i], spots[j]] = [spots[j], spots[i]]
  }
  scene.npcs = makeNpcs({
    settlement,
    seed: (settlement.recruitSeed || 1) + 7717,
    spots,
    count,
    followers
  })
}

/* -------------------------------- accessors -------------------------------- */

export function groundAt(scene, x, y) {
  if (!scene || x < 0 || y < 0 || x >= scene.w || y >= scene.h) return null
  return GROUND[scene.ground[y][x]] || GROUND.grass
}

/** Can the lord stand on this tile? */
export function isWalkable(scene, x, y) {
  if (!scene || x < 0 || y < 0 || x >= scene.w || y >= scene.h) return false
  const tile = GROUND[scene.ground[y][x]]
  if (!tile || !tile.walkable) return false
  return !scene.blocked[y * scene.w + x]
}

/** Cost function handed to the pathfinder. */
function sceneCost(scene) {
  return (grid, x, y) => {
    const tile = groundAt(scene, x, y)
    if (!tile || !tile.walkable) return { walkable: false, cost: 99 }
    if (scene.blocked[y * scene.w + x]) return { walkable: false, cost: 99 }
    return { walkable: true, cost: tile.cost }
  }
}

/**
 * A path across the scene, or the closest tile to the target when the target
 * itself is blocked (a tap on a house walks up to its wall).
 */
export function scenePath(scene, from, to) {
  return findPathOn(scene.ground, scene.w, scene.h, from, to, sceneCost(scene))
}

/** The building whose door the lord is standing next to, if any. */
export function buildingNear(scene, pos, range = 1.7) {
  if (!scene) return null
  let best = null
  let bestD = range
  for (const b of scene.buildings) {
    const d = Math.hypot(b.door.x + 0.5 - pos.x, b.door.y + 0.5 - pos.y)
    if (d < bestD) {
      bestD = d
      best = b
    }
  }
  return best
}

/** The NPC the lord is standing next to, if any. */
export function npcNear(scene, pos, range = 1.6) {
  if (!scene) return null
  let best = null
  let bestD = range
  for (const n of scene.npcs) {
    const d = Math.hypot(n.x + 0.5 - pos.x, n.y + 0.5 - pos.y)
    if (d < bestD) {
      bestD = d
      best = n
    }
  }
  return best
}

/** Every building of a kind, e.g. all the houses. */
export function buildingsOf(scene, key) {
  return (scene?.buildings || []).filter((b) => b.key === key)
}
