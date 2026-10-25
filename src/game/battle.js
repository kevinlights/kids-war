/**
 * Battle simulation on a flat plains arena.
 *
 * Every troop group the player brings (one family at one rank) is an
 * independent squad with its own order, formation and density:
 *
 *   order      攻击 attack  防守 defend  跟随 follow  移动 move
 *   formation  方队 square / 一行 line1 / 两行 line2 / 三行 line3 / 尖形 wedge / 随机 random
 *   density    松散 loose / 紧凑 tight
 *
 * Orders pick where a squad is heading, formations lay it out when it gets
 * there, and density sets the spacing between its soldiers. All three also
 * carry combat modifiers, listed in the guide.
 *
 * A fight opens on a standoff: both armies hold their ground, the lord gives
 * his own orders, and the enemy spends the first seconds dressing its ranks
 * before it charges (see `OPENING`).
 *
 * Counter damage is family based (spearman > cavalry > archer > spearman) and
 * comes from `counterMultiplier` in `units.js`.
 */
import { unitDef, unitName, counterMultiplier, normalizeTroops } from './units'
import { createRng } from './rng'
import { arenaTerrainAt, arenaWalkable, ARENA_CELL, generateArenaTerrain } from './arena'
import { arenaLineClear, findArenaPath, retreatDirection } from './arenaPath'
import { factionOf } from './factions'
import {
  ENEMY_GENERAL_ATK,
  ENEMY_GENERAL_DEF,
  ENEMY_GENERAL_SPEED,
  GENERAL_SWING_COOLDOWN,
  LAST_STAND_ATK_MUL,
  LAST_STAND_SECONDS,
  LAST_STAND_SWING_MUL,
  LORD_ATK,
  LORD_DEF,
  LORD_GUARD_COUNT,
  LORD_MAX_HP,
  LORD_SPEED,
  clampLordHp
} from './lord'

/**
 * The battle field. It is deliberately larger than the screen of a phone: the
 * camera follows the fighting instead, so the armies still have room to manoeuvre.
 */
// The field covers about twice the ground it used to (1.98x the area), so both
// armies have room to form up and the fight takes a while to close:
// 1400 x 960, 35 x 24 terrain cells.
export const ARENA = { w: 1400, h: 960, margin: 50 }

/** Standing orders a squad can be given. */
export const ORDERS = [
  { key: 'attack', name: '攻击', en: 'Attack', icon: '⚔️', hint: '主动出击，整队压向最近的敌人' },
  { key: 'defend', name: '防守', en: 'Defend', icon: '🛡️', hint: '守住当前位置，防御大幅提升' },
  { key: 'follow', name: '跟随', en: 'Follow', icon: '🏇', hint: '跟随指挥官移动，沿途交战' },
  { key: 'move', name: '移动', en: 'Move', icon: '🎯', hint: '整队走到点击的位置后原地待命' }
]

/** Squad layouts. `note` is shown in the game guide. */
export const FORMATIONS = [
  { key: 'square', name: '方队', en: 'Square', icon: '▦', note: '排成方块，防御 +6%' },
  { key: 'line1', name: '一行', en: 'Single rank', icon: '▬', note: '横排一线，正面最宽，攻击 +6%' },
  { key: 'line2', name: '两行', en: 'Two ranks', icon: '▤', note: '两排纵深，防御 +3%' },
  { key: 'line3', name: '三行', en: 'Three ranks', icon: '▥', note: '三排厚阵，防御 +8%，移动 −5%' },
  { key: 'wedge', name: '尖形', en: 'Wedge', icon: '▲', note: '楔形突击，攻击 +12%，防御 −5%' },
  {
    key: 'random',
    name: '随机',
    en: 'Scatter',
    icon: '⁘',
    note: '散兵散布：没有加成，每个士兵自己扑向敌人，最难被围住'
  }
]

/** Spacing of a squad: loose spreads out, tight packs the ranks. */
export const DENSITIES = [
  { key: 'loose', name: '松散', en: 'Loose', icon: '⋯', gap: 38, defMul: 0.94, rangedTaken: 0.78, speedMul: 1.06, note: '间隔大，远程伤害 −22%，防御 −6%' },
  { key: 'tight', name: '紧凑', en: 'Tight', icon: '≡', gap: 22, defMul: 1.14, rangedTaken: 1, speedMul: 0.92, note: '肩并肩，防御 +14%，移动 −8%' }
]

/** Order modifiers, applied on top of the formation and density ones. */
export const ORDER_MODS = {
  attack: { atkMul: 1.08, defMul: 0.94 },
  defend: { atkMul: 0.96, defMul: 1.25 },
  follow: { atkMul: 1, defMul: 1.05 },
  move: { atkMul: 0.94, defMul: 1 }
}

export const FORMATION_MODS = {
  square: { defMul: 1.06 },
  line1: { atkMul: 1.06 },
  line2: { defMul: 1.03 },
  line3: { defMul: 1.08, speedMul: 0.95 },
  wedge: { atkMul: 1.12, defMul: 0.95 },
  random: {}
}

const MELEE_RANGE = 26
const AGGRO = 320
// A melee soldier that is still far from its foe sprints, then pays for it.
const CHARGE_DISTANCE = 90
const CHARGE_MULT = 1.3
// A full breath of sprint lasts about two and a half seconds and takes about
// four seconds to recover, so the pursuit closes ground in bursts.
const CHARGE_DRAIN = 0.4
const CHARGE_REGEN = 0.25
const TIRED_TIME = 2.5
const TIRED_MULT = 0.9
// A volley costs a moment of movement: the archer plants its feet to shoot,
// which is what makes a long kite more and more expensive.
const VOLLEY_SLOW_TIME = 0.9
const VOLLEY_SLOW_MULT = 0.72
// A bow needs room to draw: a foe that is right on top of the archer cannot be
// shot at, which is what makes closing the distance worth the effort.
const ARCHER_MIN_RANGE = 32
// Backing away with a foe in the face is slower than a clean retreat, but not
// as slow as the recovery from a volley: the archer can still break away.
const ARCHER_PRESSED_MULT = 0.85
/** Pixels per second at `speed: 1`. */
const BASE_SPEED = 90

// Navigation tuning. A soldier only asks A* for a path when the direct line is
// blocked, keeps that path until its goal has moved far enough to matter, and
// skips the waypoints it can already see past.
const NAV_REPATH_DISTANCE = 18
const NAV_REACHED = 9
const NAV_RETRY = 0.65

/**
 * How fast the battle runs. The slow speed is the default one, so a child can
 * read the field and give orders before the next clash happens.
 */
export const SPEEDS = [
  { key: 'slow', name: '慢速', en: 'Slow', icon: '🐢', mul: 0.6, note: '战斗慢半拍，方便看清每一个动作' },
  { key: 'normal', name: '正常', en: 'Normal', icon: '🚶', mul: 1, note: '游戏原本的速度' },
  { key: 'fast', name: '快速', en: 'Fast', icon: '🐇', mul: 1.8, note: '战局推进很快，适合熟练之后' }
]

/**
 * The opening standoff of a battle, in game seconds.
 *
 * The map opens with both armies standing still: the lord has time to read the
 * field and give his own orders, and the enemy spends that time dressing its
 * ranks. It then attacks. A lord who strikes first cuts the wait short.
 */
export const OPENING = {
  // How long both sides hold before the enemy starts dressing its ranks.
  wait: 5,
  // How long the enemy spends changing formation before it charges.
  dress: 2.4,
  // How long the enemy takes to answer a lord who attacks first.
  react: 0.8
}

/** The speed record of a key, falling back to the slow one. */
export function speedOf(key) {
  return SPEEDS.find((s) => s.key === key) || SPEEDS[0]
}

export function orderOf(key) {
  return ORDERS.find((o) => o.key === key) || ORDERS[0]
}

export function formationOf(key) {
  return FORMATIONS.find((f) => f.key === key) || FORMATIONS[0]
}

export function densityOf(key) {
  return DENSITIES.find((d) => d.key === key) || DENSITIES[1]
}

/** Combined attack / defence / spacing modifiers of one squad. */
export function groupMods(group) {
  const order = ORDER_MODS[group.order] || ORDER_MODS.attack
  const form = FORMATION_MODS[group.formation] || {}
  const dens = densityOf(group.density)
  return {
    atkMul: (order.atkMul || 1) * (form.atkMul || 1),
    defMul: (order.defMul || 1) * (form.defMul || 1) * dens.defMul,
    speedMul: (form.speedMul || 1) * dens.speedMul,
    rangedTaken: dens.rangedTaken
  }
}

/** Defence multiplier of whatever squad a unit belongs to. */
function defMulOf(b, unit) {
  const g = b.groups[unit.group]
  return g ? groupMods(g).defMul : 1
}

function rangedTakenOf(b, unit) {
  const g = b.groups[unit.group]
  return g ? groupMods(g).rangedTaken : 1
}

/* -------------------------------- formation -------------------------------- */

/**
 * Offsets of every slot of a squad, relative to the squad's anchor point.
 *
 * The squad faces `dir` (+1 right, −1 left), so the first rank sits on the
 * anchor and deeper ranks step away from the enemy.
 */
export function formationSlots(count, formation = 'square', density = 'tight', dir = 1) {
  const gap = densityOf(density).gap
  const n = Math.max(0, count)
  const slots = []
  if (!n) return slots

  const place = (col, row, rows) => ({
    ox: -col * gap * dir,
    oy: (row - (rows - 1) / 2) * gap
  })

  if (formation === 'line1') {
    for (let i = 0; i < n; i++) slots.push(place(0, i, n))
    return slots
  }

  if (formation === 'line2' || formation === 'line3') {
    const ranks = formation === 'line2' ? 2 : 3
    const perRank = Math.ceil(n / ranks)
    for (let i = 0; i < n; i++) slots.push(place(Math.floor(i / perRank), i % perRank, perRank))
    return slots
  }

  if (formation === 'wedge') {
    // Rank 0 is the point that leads the charge, then each rank widens by two.
    // A rank cut short by the squad size is centred on the point as well, so a
    // half-filled wedge is still symmetric about its anchor.
    let index = 0
    for (let rank = 0; index < n; rank++) {
      const width = Math.min(rank * 2 + 1, n - index)
      for (let k = 0; k < width; k++, index++) {
        slots.push({ ox: -rank * gap * dir, oy: (k - (width - 1) / 2) * gap })
      }
    }
    return slots
  }

  if (formation === 'random') {
    const rng = createRng(1013 + n)
    const spread = Math.max(1, Math.ceil(Math.sqrt(n))) * gap * 0.62
    for (let i = 0; i < n; i++) {
      slots.push({ ox: rng.float(-spread, spread), oy: rng.float(-spread, spread) })
    }
    return slots
  }

  // square: the default block, as deep as it is wide. The row count is what the
  // block actually fills — `min(cols, n)` — so a partly filled last column still
  // leaves the block centred on its anchor.
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.min(cols, n)
  for (let i = 0; i < n; i++) slots.push(place(Math.floor(i / cols), i % cols, rows))
  return slots
}

/* ------------------------------- battle setup ------------------------------- */

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function groupKeyOf(side, type, tier) {
  return `${side}:${type}:${tier}`
}

/**
 * Lay out one side: one squad per troop group, anchored down the left (player)
 * or right (enemy) edge so several squads start in their own band of the field.
 */
function addSide(b, side, troops, dir, atkMul, opts = {}) {
  // One squad per family and rank; duplicates are merged up front so a squad
  // always has a single anchor point.
  const list = normalizeTroops(troops)
  // The armies start in their own half of the field, with room to manoeuvre in
  // between instead of clashing on the first step.
  const originX = side === 'player' ? ARENA.w * 0.22 : ARENA.w * 0.78
  // A companion's banner takes its own band of the field, so the lord's squads
  // and his companion's squads never start on top of each other.
  const bandFrom = opts.yFrom ?? 0.06
  const bandTo = opts.yTo ?? 0.94

  list.forEach((t, gi) => {
    const def = unitDef(t.type, t.tier)
    const key = opts.owner ? `${side}:${opts.owner}:${t.type}:${def.tier}` : groupKeyOf(side, t.type, def.tier)
    const anchorY = ARENA.h * (bandFrom + (bandTo - bandFrom) * ((gi + 1) / (list.length + 1)))
    const group = {
      key,
      side,
      type: t.type,
      tier: def.tier,
      // A squad under a companion's banner is named after him, so the battle
      // HUD says whose soldiers are whose.
      name: opts.owner ? `${opts.label}·${unitName(t.type, def.tier)}` : unitName(t.type, def.tier),
      owner: opts.owner || null,
      ownerName: opts.label || null,
      formation: side === 'player' ? 'square' : 'line2',
      density: 'tight',
      // The map opens on a standoff: every squad holds its ground until it is
      // ordered otherwise, and the enemy dresses its ranks before it charges.
      // A training session is not a battle, so the drill keeps its free attack.
      order: b.training ? 'attack' : 'defend',
      // The way the formation faces: it turns towards the foe it attacks.
      dir,
      anchor: { x: originX, y: anchorY },
      rally: side === 'player' ? { x: originX, y: anchorY } : null,
      tx: originX,
      ty: anchorY,
      count: t.count,
      unitCount: t.count,
      slots: []
    }
    group.slots = formationSlots(t.count, group.formation, group.density, dir)
    // A wounded soldier enters the fight with the health it still has.
    for (let i = 0; i < t.count; i++) addUnit(b, side, group, def, i, atkMul, dir, (t.hp || [])[i])
    b.groups[key] = group
    if (side === 'player') b.playerGroups.push(key)
  })
}

function addUnit(b, side, group, def, index, atkMul, dir, carriedHp) {
  const slot = group.slots[index] || { ox: 0, oy: 0 }
  const hp = Number.isFinite(carriedHp) ? Math.max(1, Math.min(def.hp, carriedHp)) : def.hp
  b.units.push({
    id: `${group.key}#${index}`,
    side,
    group: group.key,
    slotIndex: index,
    // `null` is a soldier of the lord's own warband; a string is the id of the
    // companion under whose banner this soldier marches.
    owner: group.owner || null,
    type: group.type,
    tier: group.tier,
    def,
    atkMul,
    maxHp: def.hp,
    hp,
    x: clamp(group.anchor.x + slot.ox, 18, ARENA.w - 18),
    y: clamp(group.anchor.y + slot.oy, 18, ARENA.h - 18),
    cd: b.rng.float(0, 0.6),
    alive: true,
    // Sprint and volley clocks (see `stepBattle`).
    stamina: 1,
    sprinting: false,
    tired: 0,
    volleyT: 0,
    facing: dir > 0 ? 1 : -1,
    hitFlash: 0,
    // A short visual lunge after a strike: the renderer leans the soldier into
    // the blow. It carries no gameplay meaning.
    swing: 0,
    // The soldier that hit it last: it answers that one first.
    lastAttackerId: null,
    // The cached arena path of the soldier, used only when deep water blocks
    // the direct line to its slot.
    nav: { path: [], index: 0, goal: null, at: -1 },
    // The personal space of the soldier inside the formation: it sways a
    // little, dodges aside when it is hit and slides away from a neighbour
    // that stands too close. The shape of the squad survives, the line is
    // not a rigid grid.
    wobble: {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      phase: b.rng.float(0, Math.PI * 2),
      speed: b.rng.float(1.6, 2.8)
    }
  })
}

/** Where the bodyguards stand around their general, before the side decides. */
const GUARD_SLOTS = [
  { ox: 20, oy: -15 },
  { ox: 20, oy: 15 },
  { ox: -15, oy: -19 },
  { ox: -15, oy: 19 }
]

/**
 * Build one general.
 *
 * A general carries the same visual fields as a soldier (flash, swing, nav) so
 * the renderer needs no special path for him.
 */
function makeGeneral({ id, side, x, y, maxHp, hp, atk, def, speed, name, sprite, isEnemyGeneral = false }) {
  const top = Math.max(1, Math.round(maxHp || LORD_MAX_HP))
  return {
    id,
    side,
    type: 'commander',
    name,
    sprite,
    x,
    y,
    tx: x,
    ty: y,
    maxHp: top,
    hp: clampLordHp(hp === undefined ? top : hp, top),
    atk,
    def,
    speed,
    alive: true,
    cd: 0,
    // Visual-only fields shared with the soldiers, so the renderer does not
    // need a special path for a general.
    hitFlash: 0,
    swing: 0,
    facing: side === 'player' ? 1 : -1,
    nav: { path: [], index: 0, goal: null, at: -1 },
    isCommander: true,
    isGeneral: true,
    isEnemyGeneral,
    // How many times a beaten general was carried back to his feet.
    downs: 0
  }
}

/**
 * Take the bodyguards out of a warband.
 *
 * They are real soldiers of the side — never free troops — so the warband is
 * smaller by exactly the guards that now stand around its general, and each
 * guard carries the health its soldier had. Melee families are preferred, a
 * one-soldier army still keeps one soldier in its squad, and an army of a
 * single archer simply has no bodyguard.
 */
export function splitGuards(troops, count = LORD_GUARD_COUNT) {
  const list = normalizeTroops(troops).map((t) => ({ ...t, hp: [...(t.hp || [])] }))
  const total = list.reduce((n, t) => n + t.count, 0)
  // Never strip a squad bare: at most half the army is on bodyguard duty, so a
  // small warband still fields a squad of its own.
  const want = Math.min(count, Math.max(0, total - 1), Math.floor(total / 2))
  const guards = []
  const isMelee = (t) => !unitDef(t.type, t.tier).ranged
  while (guards.length < want) {
    const melee = list.filter((t) => t.count > 0 && isMelee(t))
    const pool = melee.length ? melee : list.filter((t) => t.count > 0)
    if (!pool.length) break
    // The biggest melee squad gives the next guard, so a wide army shares the
    // duty instead of one squad disappearing into the bodyguard.
    pool.sort((a, b) => b.count - a.count || b.tier - a.tier)
    const from = pool[0]
    const hp = from.hp.length ? from.hp.shift() : unitDef(from.type, from.tier).hp
    from.count -= 1
    guards.push({ type: from.type, tier: from.tier, hp })
  }
  return { troops: list.filter((t) => t.count > 0), guards }
}

/**
 * Put the bodyguard of one general on the field: a small squad that follows
 * him and stands in the way of whoever swings at him.
 */
function addGuardSquad(b, general, guards) {
  if (!general || !guards.length) return null
  const side = general.side
  const dir = side === 'player' ? 1 : -1
  const key = `${side}:guard:1`
  const first = guards[0]
  const group = {
    key,
    side,
    type: first.type,
    tier: first.tier,
    name: '亲兵',
    formation: 'square',
    density: 'tight',
    // A bodyguard holds to its general: it never joins the charge.
    order: 'follow',
    isGuard: true,
    guardOf: general.id,
    dir,
    anchor: { x: general.x, y: general.y },
    rally: null,
    tx: general.x,
    ty: general.y,
    count: guards.length,
    unitCount: guards.length,
    slots: []
  }
  group.slots = guards.map((unused, i) => {
    const slot = GUARD_SLOTS[i % GUARD_SLOTS.length]
    return { ox: slot.ox * dir, oy: slot.oy }
  })
  guards.forEach((carried, i) => {
    const def = unitDef(carried.type, carried.tier)
    const slot = group.slots[i]
    b.units.push({
      id: `${key}#${i}`,
      side,
      group: key,
      slotIndex: i,
      type: carried.type,
      tier: def.tier,
      def,
      atkMul: side === 'player' ? b.playerAtkMul : 1,
      maxHp: def.hp,
      hp: Math.max(1, Math.min(def.hp, Number.isFinite(carried.hp) ? carried.hp : def.hp)),
      x: clamp(general.x + slot.ox, 18, ARENA.w - 18),
      y: clamp(general.y + slot.oy, 18, ARENA.h - 18),
      cd: b.rng.float(0, 0.6),
      alive: true,
      stamina: 1,
      sprinting: false,
      tired: 0,
      volleyT: 0,
      facing: dir,
      hitFlash: 0,
      swing: 0,
      lastAttackerId: null,
      nav: { path: [], index: 0, goal: null, at: -1 },
      isGuard: true,
      guardOf: general.id,
      wobble: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        phase: b.rng.float(0, Math.PI * 2),
        speed: b.rng.float(1.6, 2.8)
      }
    })
  })
  b.groups[key] = group
  return group
}

/**
 * The sprite of a hostile general: the commander art of its faction.
 */
export function generalSprite(enemyFaction) {
  const key = factionOf(enemyFaction)?.key
  return ['bandit', 'wolf', 'eagle'].includes(key) ? key : 'bandit'
}

export function createBattle({
  playerTroops,
  enemyTroops,
  enemyFaction,
  seed,
  playerAtkMul = 1,
  playerDefMul = 1,
  training = false,
  arenaMap = 'mixed',
  // The companions riding with the lord: `[{ id, name, troops }]`. Their
  // soldiers are player-side squads of their own, tagged with the companion id.
  allyTroops = [],
  // The lord carries his wounds in from the world map.
  lordHp = LORD_MAX_HP,
  lordMaxHp = LORD_MAX_HP,
  // A watched battle ends the moment a general falls and the two armies go
  // back to the world map. An instant simulation has no map to return to, so
  // it fights on until one army is gone.
  endOnGeneralDown = true,
  // A general whose soldiers are all gone holds out for a few seconds before
  // he falls or yields. An instant simulation skips that and settles at once.
  lastStand = true
}) {
  const b = {
    rng: createRng(seed),
    enemyFaction,
    // A training session has no enemy army: it only carries the lord's own
    // soldiers, so the fight never ends and nothing is lost.
    training: !!training,
    // The terrain of this field: it is generated from the seed, so the same
    // fight always looks the same. The preset decides which ground it holds.
    terrain: generateArenaTerrain(
      seed,
      Math.round(ARENA.w / ARENA_CELL),
      Math.round(ARENA.h / ARENA_CELL),
      arenaMap
    ),
    // Army-wide modifiers: the barracks of the lord's towns train his soldiers,
    // so the whole warband hits and holds harder.
    playerAtkMul,
    playerDefMul,
    groups: {},
    playerGroups: [],
    units: [],
    commander: makeGeneral({
      id: 'commander',
      side: 'player',
      x: ARENA.w * 0.16,
      y: ARENA.h / 2,
      name: '主将',
      sprite: 'lord',
      maxHp: lordMaxHp,
      hp: lordHp,
      atk: LORD_ATK,
      def: LORD_DEF,
      speed: LORD_SPEED
    }),
    // The enemy fields a general of its own, unless this is a drill.
    enemyCommander: null,
    projectiles: [],
    effects: [],
    time: 0,
    // The opening standoff: `phase` runs wait → dress → advance. A drill has no
    // enemy to wait for, so it carries no opening at all.
    opening: training
      ? null
      : { phase: 'wait', t: 0, wait: OPENING.wait, dress: OPENING.dress },
    outcome: null, // 'win' | 'lose' | 'general' | null
    // Set when the lord himself went down: the store reads it to scatter half
    // the warband, restore half his health and put him back beside the field.
    lordDown: false,
    // Set when the hostile general went down: the store reads it to put both
    // armies back on the map around the field, with the chase still open.
    enemyGeneralDown: false,
    endOnGeneralDown: !!endOnGeneralDown,
    lastStandEnabled: !!lastStand,
    // Set while a side with no soldiers left is still holding the field with
    // its general: `{ side, t }` counts the seconds of the last stand.
    lastStand: null,
    // Set when a battle ended because a lone general gave up the field:
    // 'player' (the lord withdrew) or 'enemy' (their general fled).
    yielded: null,
    // How many times a general went down on this field.
    generalDowns: 0,
    kills: 0,
    losses: 0
  }

  // The bodyguard is taken out of each army before the squads are laid out, so
  // the four guards really are four soldiers of that side.
  const playerSide = training
    ? { troops: playerTroops, guards: [] }
    : splitGuards(playerTroops)
  const enemySide = training ? { troops: enemyTroops, guards: [] } : splitGuards(enemyTroops)

  addSide(b, 'player', playerSide.troops, 1, playerAtkMul, { yFrom: 0.05, yTo: 0.6 })
  addSide(b, 'enemy', enemySide.troops, -1, 1)
  // A companion's banner stands behind the lord's line, in its own band.
  for (const ally of allyTroops) {
    if (!ally || !ally.troops || !ally.troops.length) continue
    addSide(b, 'player', ally.troops, 1, playerAtkMul, {
      owner: ally.id,
      label: ally.name,
      yFrom: 0.66,
      yTo: 0.96
    })
  }

  if (!training) {
    b.enemyCommander = makeGeneral({
      id: 'enemy-commander',
      side: 'enemy',
      x: ARENA.w * 0.84,
      y: ARENA.h / 2,
      name: `${factionOf(enemyFaction)?.name || '敌军'}主将`,
      sprite: generalSprite(enemyFaction),
      maxHp: lordMaxHp,
      hp: lordMaxHp,
      atk: ENEMY_GENERAL_ATK,
      def: ENEMY_GENERAL_DEF,
      speed: ENEMY_GENERAL_SPEED,
      isEnemyGeneral: true
    })
    // The enemy general holds the same ground its army does at the opening.
    b.enemyCommander.tx = b.enemyCommander.x
    b.enemyCommander.ty = b.enemyCommander.y
  }

  addGuardSquad(b, b.commander, playerSide.guards)
  addGuardSquad(b, b.enemyCommander, enemySide.guards)
  return b
}

/* --------------------------------- training -------------------------------- */

/**
 * The training dummy: a wooden post that takes blows but never fights back.
 *
 * It is the target of a training session, so the lord can practise the attack
 * order and the formations without risking a single soldier.
 */
export const TRAINING_DUMMY_DEF = {
  key: 'dummy',
  type: 'dummy',
  name: '训练木桩',
  en: 'Training dummy',
  tier: 1,
  tiered: false,
  atk: 0,
  def: 1,
  // Soft enough that a single soldier knocks it down within a few blows, so a
  // short drill already shows something.
  hp: 60,
  ranged: false,
  range: 0,
  speed: 0,
  note: '训练用的木桩：只挨打，不会还手，打倒后会自动立起来。'
}

/** How many dummies stand in the training field. */
export const TRAINING_DUMMY_COUNT = 8

/**
 * Put the training dummies on the right-hand side of the field, in two ranks.
 *
 * They belong to the enemy side so the ordinary targeting code finds them,
 * but they carry the `isDummy` flag: they never strike back and they never
 * move away from their post.
 */
export function spawnTrainingDummies(b, count = TRAINING_DUMMY_COUNT) {
  const key = 'enemy:training:1'
  const anchorX = ARENA.w * 0.76
  const anchorY = ARENA.h / 2
  const group = {
    key,
    side: 'enemy',
    type: 'dummy',
    tier: 1,
    name: TRAINING_DUMMY_DEF.name,
    formation: 'line2',
    density: 'tight',
    order: 'defend',
    isDummy: true,
    anchor: { x: anchorX, y: anchorY },
    rally: null,
    tx: anchorX,
    ty: anchorY,
    count,
    unitCount: count,
    slots: formationSlots(count, 'line2', 'tight', -1)
  }
  b.groups[key] = group
  for (let i = 0; i < count; i += 1) {
    const slot = group.slots[i] || { ox: 0, oy: 0 }
    b.units.push({
      id: `${key}#${i}`,
      side: 'enemy',
      group: key,
      slotIndex: i,
      type: 'dummy',
      tier: 1,
      def: TRAINING_DUMMY_DEF,
      atkMul: 1,
      maxHp: TRAINING_DUMMY_DEF.hp,
      hp: TRAINING_DUMMY_DEF.hp,
      x: clamp(anchorX + slot.ox, 18, ARENA.w - 18),
      y: clamp(anchorY + slot.oy, 18, ARENA.h - 18),
      cd: 0,
      alive: true,
      stamina: 1,
      sprinting: false,
      tired: 0,
      volleyT: 0,
      facing: -1,
      hitFlash: 0,
      swing: 0,
      nav: { path: [], index: 0, goal: null, at: -1 },
      isDummy: true,
      // When a dummy went down, so it can stand back up a moment later.
      downAt: 0
    })
  }
  return group
}

/**
 * Stand the dummies back up. A training session never ends, so the dummies
 * come back after they have been knocked down and the practice can go on.
 */
export function reviveTrainingDummies(b) {
  let revived = 0
  for (const u of b.units) {
    if (!u.isDummy) continue
    u.hp = u.maxHp
    u.alive = true
    u.hitFlash = 0
    u.swing = 0
    revived += 1
  }
  return revived
}

/* -------------------------------- simulation -------------------------------- */

function aliveUnits(b, side) {
  return b.units.filter((u) => u.alive && u.side === side)
}

// A big battle has hundreds of soldiers a side, and looking for the nearest
// foe by scanning the whole field costs O(n^2) every frame. A coarse grid
// rebuilt a few times a second turns the search into a handful of cells, and
// a soldier keeps its target for a moment instead of searching again on every
// frame.
const TARGET_CELL = 90
const TARGET_REFRESH = 0.18
const TARGET_GRID_LIFE = 0.12

/** The soldier buckets of this field, rebuilt when they go stale. */
function targetGrid(b) {
  const grid = b._targetGrid
  if (grid && b.time - grid.at < TARGET_GRID_LIFE) return grid
  const cells = new Map()
  const byId = new Map()
  // A general whose bodyguard still stands cannot be picked as a target: the
  // guards are what the soldiers have to get through first.
  const shielded = new Set()
  for (const u of b.units) {
    if (!u.alive) continue
    if (u.isGuard) shielded.add(u.guardOf)
    byId.set(u.id, u)
    const key = Math.floor(u.x / TARGET_CELL) + ':' + Math.floor(u.y / TARGET_CELL)
    let list = cells.get(key)
    if (!list) cells.set(key, (list = []))
    list.push(u)
  }
  // The two generals are on the field as well: they can be struck, and they
  // are who a soldier answers when a general is the one who hit it.
  for (const gen of generalsOf(b)) {
    if (!gen.alive) continue
    byId.set(gen.id, gen)
    const key = Math.floor(gen.x / TARGET_CELL) + ':' + Math.floor(gen.y / TARGET_CELL)
    let list = cells.get(key)
    if (!list) cells.set(key, (list = []))
    list.push(gen)
  }
  b._targetGrid = { at: b.time, cells, byId, shielded }
  return b._targetGrid
}

/** The generals of the field: the lord and, unless it is a drill, the enemy's. */
function generalsOf(b) {
  return b.enemyCommander ? [b.commander, b.enemyCommander] : [b.commander]
}

/** True while a general still has a living bodyguard in front of him. */
export function generalShielded(b, general) {
  if (!general || !general.isGeneral) return false
  return b.units.some((u) => u.alive && u.isGuard && u.guardOf === general.id)
}

/** The living bodyguards of one general. */
export function guardsOf(b, general) {
  if (!general) return []
  return b.units.filter((u) => u.alive && u.isGuard && u.guardOf === general.id)
}

/**
 * True while this general is the last body left on his side of the field.
 *
 * A general in that state fights the last stand: he swings harder and faster,
 * and the battle waits a few seconds before deciding how it ends.
 * 士兵全部倒下后，主将会进入「孤军奋战」：攻击更高、出手更快。
 */
export function isLastStand(b, general) {
  return !!b.lastStand && !!general && b.lastStand.side === general.side
}

/** A soldier or a general by its id, alive or not. */
function combatantById(b, id) {
  if (!id) return null
  const unit = b.units.find((u) => u.id === id)
  if (unit) return unit
  return generalsOf(b).find((g) => g.id === id) || null
}

function nearestEnemy(b, unit) {
  const foeSide = unit.side === 'player' ? 'enemy' : 'player'
  const grid = targetGrid(b)
  const gx = Math.floor(unit.x / TARGET_CELL)
  const gy = Math.floor(unit.y / TARGET_CELL)
  // A dozen rings reach every corner of the field whatever its size.
  const maxRing = Math.ceil(Math.max(ARENA.w, ARENA.h) / TARGET_CELL) + 1
  let best = null
  let bestD2 = Infinity
  const visit = (cx, cy) => {
    const list = grid.cells.get(cx + ':' + cy)
    if (!list) return
    for (const u of list) {
      if (u.side !== foeSide) continue
      // A shielded general is not a target: his guards are.
      if (u.isGeneral && grid.shielded.has(u.id)) continue
      const dx = u.x - unit.x
      const dy = u.y - unit.y
      const d2 = dx * dx + dy * dy
      if (d2 < bestD2) {
        bestD2 = d2
        best = u
      }
    }
  }
  for (let r = 0; r <= maxRing; r += 1) {
    if (r === 0) {
      visit(gx, gy)
    } else {
      for (let cx = gx - r; cx <= gx + r; cx += 1) {
        visit(cx, gy - r)
        visit(cx, gy + r)
      }
      for (let cy = gy - r + 1; cy <= gy + r - 1; cy += 1) {
        visit(gx - r, cy)
        visit(gx + r, cy)
      }
    }
    // The next ring is at least r cells away, so a closer foe cannot be left.
    if (best && bestD2 <= (r * TARGET_CELL) * (r * TARGET_CELL)) break
  }
  return { unit: best, dist: best ? Math.sqrt(bestD2) : Infinity }
}

/**
 * The soldier's target.
 *
 * Whoever hit it last comes first while it is within reach: a soldier that is
 * attacked always answers, even when it was holding its position or walking
 * somewhere else. Out of reach the nearest enemy is the target as usual.
 */
function foeFor(b, unit) {
  // The nearest foe moves slowly: keep it for a moment, drop it the instant it
  // falls, and spread the refreshes over the whole army with a per-soldier
  // phase so no single frame searches for every soldier at once.
  const cached = unit.foeCache
  let nearest
  if (cached && cached.unit && cached.unit.alive && b.time - cached.at < TARGET_REFRESH) {
    const dx = cached.unit.x - unit.x
    const dy = cached.unit.y - unit.y
    nearest = { unit: cached.unit, dist: Math.sqrt(dx * dx + dy * dy) || 0 }
  } else {
    nearest = nearestEnemy(b, unit)
    const phase = ((unit.id * 37) % 100) / 100
    unit.foeCache = { unit: nearest.unit, at: b.time - phase * TARGET_REFRESH }
  }
  if (!unit.lastAttackerId) return nearest
  const grid = targetGrid(b)
  const attacker = grid.byId.get(unit.lastAttackerId)
  if (!attacker || !attacker.alive) return nearest
  // A general who hit someone still answers for it, unless his bodyguard is
  // standing in the way: then the blow is answered by the guards.
  if (attacker.isGeneral && grid.shielded.has(attacker.id)) return nearest
  const d = Math.hypot(attacker.x - unit.x, attacker.y - unit.y)
  const reach = unit.def.ranged ? unit.def.range : MELEE_RANGE
  if (d > reach) return nearest
  // A blow cannot cross deep water. If the attacker is on the far shore, the
  // soldier keeps looking for a foe it can actually reach.
  if (!unit.def.ranged && !arenaLineClear(b.terrain, unit.x, unit.y, attacker.x, attacker.y, 6)) {
    return nearest
  }
  return { unit: attacker, dist: d }
}

/** Enemy closest to a point, used as the aim point of a charging squad. */
function nearestFoeTo(b, side, x, y) {
  const foeSide = side === 'player' ? 'enemy' : 'player'
  let best = null
  let bestD = Infinity
  for (const u of b.units) {
    if (!u.alive || u.side !== foeSide) continue
    const d = Math.hypot(u.x - x, u.y - y)
    if (d < bestD) {
      bestD = d
      best = u
    }
  }
  return best
}

/** The cached navigation state of a soldier or of the commander. */
function navOf(unit) {
  if (!unit.nav || !Array.isArray(unit.nav.path)) {
    unit.nav = { path: [], index: 0, goal: null, at: -1 }
  }
  return unit.nav
}

/**
 * The point this soldier should walk toward right now.
 *
 * A clear line means the goal itself: the ordinary case on the open plain.
 * When deep water blocks it, A* runs once and the soldier follows its
 * smoothed waypoints. The path is kept until the goal moves, or until a very
 * short retry window passes when no route was found.
 */
function navigationPoint(b, unit, tx, ty) {
  if (!b.terrain) return { x: tx, y: ty }
  const nav = navOf(unit)
  if (arenaLineClear(b.terrain, unit.x, unit.y, tx, ty, 8)) {
    nav.path = []
    nav.index = 0
    nav.goal = null
    return { x: tx, y: ty }
  }

  const moved = !nav.goal || Math.hypot(tx - nav.goal.x, ty - nav.goal.y) > NAV_REPATH_DISTANCE
  const retry = !nav.path.length && b.time - nav.at > NAV_RETRY
  if (moved || retry) {
    nav.path = findArenaPath(
      b.terrain,
      { x: unit.x, y: unit.y },
      { x: tx, y: ty }
    )
    nav.index = 0
    nav.goal = { x: tx, y: ty }
    nav.at = b.time
  }
  if (!nav.path.length) return { x: tx, y: ty }

  // Skip waypoints already underfoot, then look ahead to the farthest point
  // that can still be reached in a straight line.
  while (nav.index < nav.path.length) {
    const p = nav.path[nav.index]
    if (Math.hypot(p.x - unit.x, p.y - unit.y) > NAV_REACHED) break
    nav.index += 1
  }
  while (nav.index + 1 < nav.path.length) {
    const p = nav.path[nav.index + 1]
    if (!arenaLineClear(b.terrain, unit.x, unit.y, p.x, p.y, 8)) break
    nav.index += 1
  }
  if (nav.index >= nav.path.length) {
    nav.path = []
    nav.goal = null
    return { x: tx, y: ty }
  }
  return nav.path[nav.index]
}

/** Walk toward a point, following a cached path around any lake in the way. */
function moveTo(b, unit, tx, ty, speed, dt) {
  const aim = navigationPoint(b, unit, tx, ty)
  moveToward(unit, aim.x, aim.y, speed, dt, (x, y) => blockedAt(b, x, y))
}

/**
 * The anchor a squad should march toward.
 *
 * If the squad can see the foe, that is the foe itself. If a lake is in the
 * way, the first smoothed point of a group path is used instead, so the whole
 * formation walks around the shore together instead of each soldier finding a
 * different way and breaking the shape.
 */
function groupApproach(b, cx, cy, fx, fy) {
  if (!b.terrain || arenaLineClear(b.terrain, cx, cy, fx, fy, 8)) {
    return { x: fx, y: fy, direct: true }
  }
  const path = findArenaPath(b.terrain, { x: cx, y: cy }, { x: fx, y: fy })
  if (!path.length) return { x: fx, y: fy, direct: false }
  return { x: path[0].x, y: path[0].y, direct: false }
}

function moveToward(unit, tx, ty, speed, dt, blocked) {
  const dx = tx - unit.x
  const dy = ty - unit.y
  const d = Math.hypot(dx, dy)
  if (d < 1) return
  const step = Math.min(d, speed * dt)
  // The two axes move on their own, so a soldier slides along the shore of a
  // lake instead of walking into it.
  const nx = unit.x + (dx / d) * step
  const ny = unit.y + (dy / d) * step
  if (!blocked || !blocked(nx, unit.y)) unit.x = nx
  if (!blocked || !blocked(unit.x, ny)) unit.y = ny
  if (Math.abs(dx) > 2) unit.facing = dx >= 0 ? 1 : -1
}

/** Walk straight away from a point, used by ranged skirmishers. */
function moveAwayFrom(unit, fx, fy, speed, dt, blocked) {
  const dx = unit.x - fx
  const dy = unit.y - fy
  const d = Math.hypot(dx, dy)
  if (d < 1) return
  const step = speed * dt
  const nx = unit.x + (dx / d) * step
  const ny = unit.y + (dy / d) * step
  if (!blocked || !blocked(nx, unit.y)) unit.x = nx
  if (!blocked || !blocked(unit.x, ny)) unit.y = ny
}

/** True when a position is off the field or inside a lake. */
function blockedAt(b, x, y) {
  if (x < 16 || y < 16 || x > ARENA.w - 16 || y > ARENA.h - 16) return true
  return !arenaWalkable(b.terrain, x, y)
}

/* ------------------------------ opening standoff ----------------------------- */

/**
 * The enemy dresses its ranks: ranged squads spread into a firing line, melee
 * squads tighten into a wedge. This is the visible beat before a charge.
 */
export function dressEnemyRanks(b) {
  const o = b.opening
  if (!o || o.phase !== 'wait') return false
  o.phase = 'dress'
  o.t = 0
  for (const g of Object.values(b.groups)) {
    if (g.side !== 'enemy' || g.isDummy || g.isGuard) continue
    const def = unitDef(g.type, g.tier)
    g.formation = def.ranged ? 'line1' : 'wedge'
    g.slots = formationSlots(g.unitCount, g.formation, g.density, g.dir)
  }
  return true
}

/** The enemy has finished dressing: every enemy squad is ordered to attack. */
export function enemyAdvance(b) {
  const o = b.opening
  if (!o) return false
  o.phase = 'advance'
  o.t = 0
  for (const g of Object.values(b.groups)) {
    // A bodyguard stays with its general, the dummies stay at their post.
    if (g.side !== 'enemy' || g.isDummy || g.isGuard) continue
    g.order = 'attack'
  }
  return true
}

/**
 * Cut the standoff short: the enemy dresses its ranks now and charges a moment
 * later. Used when the lord attacks first, or when a blow already landed.
 */
export function hastenEnemy(b) {
  const o = b.opening
  if (!o || o.phase === 'advance') return false
  if (o.phase === 'wait') dressEnemyRanks(b)
  o.t = Math.max(o.t, o.dress - OPENING.react)
  return true
}

/** Advance the standoff clock: wait, dress the ranks, then charge. */
function updateOpening(b, dt) {
  const o = b.opening
  if (!o || o.phase === 'advance') return
  o.t += dt
  if (o.phase === 'wait') {
    if (o.t >= o.wait) dressEnemyRanks(b)
    return
  }
  if (o.phase === 'dress' && o.t >= o.dress) enemyAdvance(b)
}

/**
 * Where each squad is heading this frame: the enemy for an attack, its own
 * anchor for a defence, the commander for a follow and its rally point for a
 * move. Individual soldiers then walk to their slot around that point.
 *
 * An attacking squad keeps its **formation**: the squad turns so that its
 * front rank faces the foe, the anchor of the formation goes onto the foe and
 * every soldier holds its own slot around it. A ranged squad that is too
 * close steps back as one block, so the shape survives the retreat too.
 */
function updateGroupTargets(b) {
  for (const g of Object.values(b.groups)) {
    // A training dummy holds its post: it never charges the lord.
    if (g.isDummy) {
      g.tx = g.anchor.x
      g.ty = g.anchor.y
      g.retreat = null
      continue
    }

    // A bodyguard walks with the general it protects: whichever side it is on,
    // the general himself is the anchor, so the four men stay between him and
    // whoever comes for him.
    if (g.isGuard) {
      const general = g.guardOf === 'commander' ? b.commander : b.enemyCommander
      g.tx = general ? general.x : g.anchor.x
      g.ty = general ? general.y : g.anchor.y
      g.retreat = null
      continue
    }

    // Where the squad stands right now.
    let cx = 0
    let cy = 0
    let n = 0
    for (const u of b.units) {
      if (!u.alive || u.group !== g.key) continue
      cx += u.x
      cy += u.y
      n += 1
    }
    cx = n ? cx / n : g.anchor.x
    cy = n ? cy / n : g.anchor.y
    g.center = { x: cx, y: cy }

    // The ranks close up: the survivors take the front slots, so a thinned
    // squad keeps a line instead of standing in the gaps left by the dead.
    const living = b.units
      .filter((u) => u.alive && u.group === g.key)
      .sort((one, other) => one.slotIndex - other.slotIndex)
    g.packed = new Map(living.map((u, i) => [u.id, i]))

    if (g.side === 'player' && g.order === 'follow') {
      g.tx = b.commander.x - 40
      g.ty = b.commander.y
      g.retreat = null
      continue
    }
    // A squad that holds stands on its rally point (or its anchor). This is
    // both armies at the start of a fight and every squad told to defend.
    if (g.order === 'defend' || g.order === 'move') {
      const point = g.rally || g.anchor
      g.tx = point.x
      g.ty = point.y
      g.retreat = null
      continue
    }

    // attack: advance on the nearest enemy.
    const foe = nearestFoeTo(b, g.side, cx, cy)
    if (!foe) {
      g.retreat = null
      continue
    }

    // The formation turns to face the foe, so the front rank is the one that
    // fights and the rest keeps its shape behind it.
    const dir = foe.x >= cx ? 1 : -1
    if (g.dir !== dir) {
      g.dir = dir
      g.slots = formationSlots(g.unitCount, g.formation, g.density, dir)
    }
    // A squad of spears presses in a little: the front rank leans on the foe
    // while the rest of the formation stays behind it.
    const def = unitDef(g.type, g.tier)
    const press = def.ranged ? 0 : 7
    // The squad as a whole follows a path around deep water. Without this the
    // formation anchor would sit on the far shore, and soldiers would try to
    // reach slots behind the lake instead of walking around it.
    const approach = groupApproach(b, cx, cy, foe.x, foe.y)
    if (approach.direct) {
      const toward = Math.hypot(cx - foe.x, cy - foe.y) || 1
      g.tx = foe.x + ((cx - foe.x) / toward) * press
      g.ty = foe.y + ((cy - foe.y) / toward) * press
    } else {
      g.tx = approach.x
      g.ty = approach.y
    }

    // A ranged squad keeps its distance: the whole formation steps back
    // together instead of every soldier running on its own. The direction
    // avoids lakes and the map edge, and when the enemy has it against a wall
    // it looks for the open ground along that wall or round the enemy's flank.
    const d = Math.hypot(foe.x - cx, foe.y - cy)
    if (def.ranged && d < def.range * 0.5) {
      g.retreat = retreatDirection(b.terrain, cx, cy, cx - foe.x, cy - foe.y, 110, foe, g.retreat)
    } else {
      g.retreat = null
    }
  }
}

/**
 * The damage one strike deals.
 *
 * The ground under the fighters matters: a desert tires the attacker and a
 * forest hides the defender, so the same swing hurts more on open ground.
 */
export function damageOf(b, unit, target) {
  const def = unit.def
  const group = b.groups[unit.group]
  const atkMul = group ? groupMods(group).atkMul : 1
  const counter = counterMultiplier(unit.type, target.type)
  const atkGround = arenaTerrainAt(b.terrain, unit.x, unit.y)
  const defGround = arenaTerrainAt(b.terrain, target.x, target.y)
  const effAtk = def.atk * (unit.atkMul || 1) * atkMul * counter * atkGround.atkMul
  const sideDef = target.side === 'player' ? b.playerDefMul || 1 : 1
  const effDef = (target.def.def || 0) * defMulOf(b, target) * sideDef * defGround.defMul
  return Math.max(1, Math.round(effAtk - effDef * 0.5 + b.rng.float(-1, 1)))
}

/**
 * The damage one blow of a general deals.
 *
 * A general is not part of a squad, so no formation or order modifier applies:
 * only the ground under his feet and the ground under the man he hits.
 */
export function generalDamage(b, general, target) {
  const atkGround = arenaTerrainAt(b.terrain, general.x, general.y)
  const defGround = arenaTerrainAt(b.terrain, target.x, target.y)
  const targetDef = typeof target.def === 'number' ? target.def : (target.def && target.def.def) || 0
  const effAtk = general.atk * atkGround.atkMul * (isLastStand(b, general) ? LAST_STAND_ATK_MUL : 1)
  const effDef = targetDef * defMulOf(b, target) * defGround.defMul
  return Math.max(1, Math.round(effAtk - effDef * 0.5 + b.rng.float(-1, 1)))
}

/**
 * The enemy general goes down: the battle is over on the spot.
 *
 * Unlike the lord he does not lose the campaign — nobody dies — but his army
 * has just lost its commander, so both sides fall back onto the world map
 * around the field. The warband is still standing, so the lord may go after it
 * again at once, or walk away while he has the chance.
 * 敌将倒下同样立刻结束战斗：双方退回世界地图、落在战场周围，玩家可以继续追击或离开。
 */
export function downEnemyGeneral(b) {
  const gen = b.enemyCommander
  if (!gen) return false
  gen.hp = 0
  gen.alive = false
  gen.hitFlash = 0
  gen.swing = 0
  gen.downs = (gen.downs || 0) + 1
  gen.nav = { path: [], index: 0, goal: null, at: -1 }
  b.generalDowns = (b.generalDowns || 0) + 1
  b.effects.push({ x: gen.x, y: gen.y, t: 0, life: 0.5, kind: 'down' })
  b.enemyGeneralDown = true
  // A general who falls with no soldier of his own left on the field is not a
  // reason to stop short: the army is gone, so the battle is won outright.
  b.outcome = aliveUnits(b, 'enemy').length === 0 ? 'win' : 'general'
  return true
}

/**
 * A lone general gives up the field (the player pressed 撤退).
 *
 * The battle is lost either way, but the rest of the rules still apply through
 * `settle()`: the lord keeps whatever health he has, the enemy warband stays on
 * the map, and both sides fall back around the field.
 * 只剩主将时玩家可以主动撤出战场：判负，但不再额外损失。
 */
export function yieldBattle(b, side = 'player') {
  if (!b || b.outcome) return false
  b.yielded = side
  b.outcome = side === 'player' ? 'lose' : 'win'
  return true
}function strike(b, unit, target) {
  // A training dummy only takes blows: it never swings back.
  if (unit.isDummy) return
  const def = unit.def
  const cooldown = def.ranged ? 1.6 : 1.0
  if (unit.cd > 0) return
  const dmg = damageOf(b, unit, target)
  unit.cd = cooldown
  // The renderer turns this into a short lean toward the target.
  unit.swing = 0.16

  if (def.ranged) {
    // A bow needs room to draw: at point-blank the archer cannot loose and has
    // to give ground instead, so a foe that gets in is genuinely dangerous.
    const gap = Math.hypot(target.x - unit.x, target.y - unit.y)
    if (gap < ARCHER_MIN_RANGE) return
    // Planting the bow costs a step: the next volley starts a little slower.
    unit.volleyT = VOLLEY_SLOW_TIME
    b.projectiles.push({
      x: unit.x,
      y: unit.y,
      tx: target.x,
      ty: target.y,
      targetId: target.id,
      // The shooter is remembered, so the soldier it hits knows who to answer.
      attackerId: unit.id,
      t: 0,
      speed: 420,
      side: unit.side,
      dmg
    })
  } else {
    applyDamage(b, target, dmg, unit)
    b.effects.push({ x: target.x, y: target.y, t: 0, life: 0.22, kind: 'hit' })
  }
}

export function applyDamage(b, target, dmg, attacker) {
  // The victim remembers who hit it: a soldier that is attacked answers the
  // attacker instead of the nearest enemy.
  if (attacker && attacker.side !== target.side) {
    target.lastAttackerId = attacker.id
    // A blow against the enemy ends its wait: it dresses its ranks and charges.
    if (target.side === 'enemy' && attacker.side === 'player') hastenEnemy(b)
    // The blow shoves it aside: the line shuffles instead of standing still.
    if (target.wobble) {
      const dx = target.x - attacker.x
      const dy = target.y - attacker.y
      const len = Math.hypot(dx, dy) || 1
      target.wobble.dx += (dx / len) * 5
      target.wobble.dy += (dy / len) * 5
    }
  }
  if (target.isGeneral) {
    // The bodyguard throws itself in the way: while one of the four men still
    // stands, the general takes no blow at all — the guard does.
    const guards = guardsOf(b, target)
    if (guards.length) {
      let blocker = guards[0]
      let bestD = Infinity
      for (const guard of guards) {
        const d = Math.hypot(guard.x - target.x, guard.y - target.y)
        if (d < bestD) {
          bestD = d
          blocker = guard
        }
      }
      applyDamage(b, blocker, dmg, attacker)
      b.effects.push({ x: blocker.x, y: blocker.y, t: 0, life: 0.18, kind: 'block' })
      return
    }
    target.hp = Math.max(0, target.hp - dmg)
    target.hitFlash = 0.2
    if (target.hp > 0) return
    // A hostile general keeps his own life, but the blow he cannot take ends
    // the battle: both armies fall back onto the world map.
    if (target.isEnemyGeneral) {
      if (!b.endOnGeneralDown) {
        // An instant simulation has no world map to go back to, so it fights
        // on without a commander rather than stopping halfway.
        target.hp = 0
        target.alive = false
        b.generalDowns = (b.generalDowns || 0) + 1
        return
      }
      downEnemyGeneral(b)
      return
    }
    // The lord never dies, but a battle he falls in is lost on the spot.
    target.alive = false
    b.lordDown = true
    b.outcome = 'lose'
    return
  }
  target.hp -= dmg
  target.hitFlash = 0.18
  if (target.hp <= 0) {
    target.alive = false
    if (target.isDummy) {
      // A dummy that goes down stands back up a moment later, so a drill
      // never runs out of targets and nobody is hurt.
      target.downAt = b.time
      return
    }
    if (target.side === 'enemy') b.kills++
    else b.losses++
  }
}

/**
 * One frame of a general: walk where he was told to go, and strike anyone who
 * comes within reach of his arm.
 *
 * Both generals work this way, so the lord who walks onto an enemy squad, and
 * the enemy general who walks onto the lord, trade blows without any special
 * case for either of them.
 */
function stepGeneral(b, gen, dt) {
  if (!gen || !gen.alive) return
  if (gen.cd > 0) gen.cd -= dt
  if (gen.hitFlash > 0) gen.hitFlash -= dt
  if (gen.swing > 0) gen.swing -= dt
  moveTo(b, gen, gen.tx, gen.ty, gen.speed, dt)

  const foe = nearestEnemy(b, gen)
  if (!foe.unit) return
  const reach = MELEE_RANGE + 6
  if (foe.dist > reach) return
  if (!arenaLineClear(b.terrain, gen.x, gen.y, foe.unit.x, foe.unit.y, 6)) return
  gen.facing = foe.unit.x >= gen.x ? 1 : -1
  if (gen.cd > 0) return
  gen.cd = GENERAL_SWING_COOLDOWN * (isLastStand(b, gen) ? LAST_STAND_SWING_MUL : 1)
  gen.swing = 0.16
  applyDamage(b, foe.unit, generalDamage(b, gen, foe.unit), gen)
  b.effects.push({ x: foe.unit.x, y: foe.unit.y, t: 0, life: 0.22, kind: 'hit' })
}

export function stepBattle(b, dt) {
  if (b.outcome) return b
  b.time += dt
  const cmd = b.commander

  // First the standoff: it decides whether the enemy still holds or attacks.
  updateOpening(b, dt)

  // The lord walks toward the spot he was given, around any lake, and swings
  // at whatever stands in his way.
  stepGeneral(b, cmd, dt)

  // The enemy general stands with his army, a little behind its front line,
  // and swings at whatever the line does not stop. He is a general, not a
  // squad: nobody gives him orders, and he does not run ahead of his men.
  const foeGeneral = b.enemyCommander
  if (foeGeneral && foeGeneral.alive) {
    if (!b.opening || b.opening.phase === 'advance') {
      const own = b.units.filter((u) => u.alive && u.side === 'enemy' && !u.isGuard)
      if (own.length) {
        const cx = own.reduce((n, u) => n + u.x, 0) / own.length
        const cy = own.reduce((n, u) => n + u.y, 0) / own.length
        // +x is the enemy's own side of the field: the general keeps to the
        // rear of his line instead of walking into the lord's army alone.
        foeGeneral.tx = clamp(cx + 70, 40, ARENA.w - 40)
        foeGeneral.ty = clamp(cy, 40, ARENA.h - 40)
      } else {
        foeGeneral.tx = cmd.x
        foeGeneral.ty = cmd.y
      }
    }
    stepGeneral(b, foeGeneral, dt)
  }

  updateGroupTargets(b)

  // The living soldiers of every squad: a soldier slides away from a
  // neighbour that stands too close, so the line never turns into a grid.
  const byGroup = new Map()
  for (const u of b.units) {
    if (!u.alive) continue
    let list = byGroup.get(u.group)
    if (!list) {
      list = []
      byGroup.set(u.group, list)
    }
    list.push(u)
  }

  for (const unit of b.units) {
    if (!unit.alive) continue
    const group = b.groups[unit.group]
    const def = unit.def
    if (unit.cd > 0) unit.cd -= dt
    if (unit.hitFlash > 0) unit.hitFlash -= dt
    if (unit.swing > 0) unit.swing -= dt
    if (!group) continue

    const mods = groupMods(group)
    // A thinned squad closes its ranks: the survivor of a lost front rank takes
    // the front slot, so the line still faces the foe.
    const packed = group.packed ? group.packed.get(unit.id) : undefined
    const slot = group.slots[packed === undefined ? unit.slotIndex : packed] || { ox: 0, oy: 0 }
    // The target: whoever hit this soldier last comes first while it is in
    // reach, so an attack is always answered.
    const { unit: foe, dist } = foeFor(b, unit)
    const engage = def.ranged ? def.range : MELEE_RANGE
    const holding = group.order !== 'attack'
    // The ground the soldier stands on slows it down: a forest or a river
    // costs time, a mountain gives a better view but a slippery footing.
    const ground = arenaTerrainAt(b.terrain, unit.x, unit.y)
    // A melee soldier far from its foe breaks into a sprint. The sprint is
    // latched: once it starts beyond `CHARGE_DISTANCE` it carries the soldier
    // through the last stretch to contact instead of dying out at 30 px, which
    // is what makes a chase feel like a charge rather than a walk.
    let chargeMul = 1
    const melee = !def.ranged && !unit.isDummy
    const attacking = group.order === 'attack'
    if (melee && unit.tired > 0) {
      unit.tired = Math.max(0, unit.tired - dt)
      chargeMul = TIRED_MULT
    }
    if (melee) {
      // Contact, a lost target or a new order ends the sprint at once.
      if (unit.sprinting && (!foe || dist <= MELEE_RANGE || !attacking || unit.stamina <= 0)) {
        unit.sprinting = false
      }
      if (!unit.sprinting && foe && dist > CHARGE_DISTANCE && attacking && unit.tired <= 0 && unit.stamina > 0) {
        unit.sprinting = true
      }
      if (unit.sprinting) {
        unit.stamina = Math.max(0, unit.stamina - CHARGE_DRAIN * dt)
        chargeMul = CHARGE_MULT
        if (unit.stamina <= 0) {
          unit.sprinting = false
          unit.tired = TIRED_TIME
        }
      } else if (unit.tired <= 0) {
        unit.stamina = Math.min(1, unit.stamina + CHARGE_REGEN * dt)
      }
    }
    // The archer is slower right after loosing a volley, and slower still
    // while it backs away with a foe in its face: a bow cannot be run with.
    if (unit.volleyT > 0) unit.volleyT = Math.max(0, unit.volleyT - dt)
    const pressed = def.ranged && !!foe && dist < ARCHER_MIN_RANGE
    const volleyMul = pressed ? ARCHER_PRESSED_MULT : unit.volleyT > 0 ? VOLLEY_SLOW_MULT : 1
    const speed = def.speed * BASE_SPEED * mods.speedMul * ground.speedMul * chargeMul * volleyMul
    const prevX = unit.x
    const prevY = unit.y
    // The formation breathes. Every soldier sways a little inside its slot,
    // dodges aside when it is hit and slides away from a neighbour that
    // stands too close — the shape of the squad stays, the line is alive.
    // A distant foe is out of reach anyway: skip the line check until it can
    // actually be struck, which is most of the soldiers in a big battle.
    const sighted = !foe || def.ranged || dist > engage ||
      arenaLineClear(b.terrain, unit.x, unit.y, foe.x, foe.y, 6)
    const inReach = !!(foe && dist <= engage && sighted)
    const wob = unit.wobble || { x: 0, y: 0, dx: 0, dy: 0, phase: 0, speed: 1 }
    // A soldier that is trading blows only shuffles a little, or it would
    // step out of reach.
    const amp = inReach ? 3 : 7
    wob.x = Math.sin(b.time * wob.speed + wob.phase) * amp
    wob.y = Math.cos(b.time * wob.speed * 0.75 + wob.phase) * amp * 0.7
    // The shove of a blow fades away again.
    wob.dx *= 0.85
    wob.dy *= 0.85
    // A neighbour too close pushes it aside.
    let pushX = 0
    let pushY = 0
    const mates = byGroup.get(unit.group) || []
    for (const other of mates) {
      if (other === unit) continue
      const ddx = unit.x - other.x
      const ddy = unit.y - other.y
      const d2 = ddx * ddx + ddy * ddy
      if (d2 > 196 || d2 < 0.0001) continue
      const d = Math.sqrt(d2)
      pushX += (ddx / d) * (14 - d)
      pushY += (ddy / d) * (14 - d)
    }
    let offX = wob.x + wob.dx + pushX * 0.4
    let offY = wob.y + wob.dy + pushY * 0.4
    // The personal space stays small, so the formation keeps its shape.
    const offLen = Math.hypot(offX, offY)
    if (offLen > 10) {
      offX = (offX / offLen) * 10
      offY = (offY / offLen) * 10
    }
    // The soldier keeps its slot: the attack does not mob the enemy, the
    // formation marches onto it as it is.
    //
    // A scattered squad is the exception: it has no block to keep, so every
    // soldier closes on the foe itself and attacks it.
    const scattered = group.formation === 'random' && group.order === 'attack' && !!foe
    // A melee soldier whose foe is close but still out of reach leaves the
    // block and closes on it directly. The squad still forms up for the march,
    // but the last stretch is a chase: the charge is only worth anything if the
    // soldier can actually take hold of the archer it ran down.
    const pressing =
      melee && !!foe && foe.def.ranged && dist <= CHARGE_DISTANCE && group.order === 'attack'
    const tx = scattered || pressing ? foe.x + offX * 1.6 : group.tx + slot.ox + offX
    const ty = scattered || pressing ? foe.y + offY * 1.6 : group.ty + slot.oy + offY

    let wantsToMove = false
    if (group.retreat) {
      // A ranged squad that is too close steps back as one block, so every
      // soldier keeps its place in the formation.
      wantsToMove = true
      moveTo(
        b,
        unit,
        unit.x + group.retreat.x * 70,
        unit.y + group.retreat.y * 70,
        speed,
        dt
      )
    } else {
      // Walk to the slot unless this soldier is already shooting / swinging.
      // The soldier holds its slot tightly (2 px): a soldier that drifts off
      // its slot would step out of reach of the foe and stop fighting.
      const dSlot = Math.hypot(tx - unit.x, ty - unit.y)
      // A soldier that is trading blows still shuffles back into its place
      // after a blow shoved it aside.
      const shuffle = Math.hypot(wob.dx + pushX * 0.4, wob.dy + pushY * 0.4)
      if (dSlot > 2 && (holding || !foe || !inReach || shuffle > 2)) {
        wantsToMove = true
        moveTo(b, unit, tx, ty, speed, dt)
      }
    }
    if (inReach) {
      // The soldier turns to the foe it answers and strikes.
      unit.facing = foe.x >= unit.x ? 1 : -1
      strike(b, unit, foe)
    }

    // A soldier that wants to move but cannot (a lake in the way) gets a
    // sideways nudge, so no fight can stall for ever.
    const moved = Math.hypot(unit.x - prevX, unit.y - prevY)
    unit.stuck = wantsToMove && moved < 0.2 ? (unit.stuck || 0) + dt : 0
    if (unit.stuck > 0.8 && !unit.isDummy) {
      unit.stuck = 0
      const nav = navOf(unit)
      nav.path = []
      nav.goal = null
      nav.at = -1
      const dx = tx - unit.x
      const dy = ty - unit.y
      const len = Math.hypot(dx, dy) || 1
      unit.detour = unit.detour === 1 ? -1 : 1
      const step = 26 * unit.detour
      const nx = unit.x + (-dy / len) * step
      const ny = unit.y + (dx / len) * step
      if (!blockedAt(b, nx, ny)) {
        unit.x = nx
        unit.y = ny
      }
    }

    unit.x = clamp(unit.x, 16, ARENA.w - 16)
    unit.y = clamp(unit.y, 16, ARENA.h - 16)
  }

  // Advance projectiles and land their damage on arrival.
  const nextProjectiles = []
  for (const p of b.projectiles) {
    p.t += dt
    const dx = p.tx - p.x
    const dy = p.ty - p.y
    const d = Math.hypot(dx, dy)
    const step = p.speed * dt
    if (d <= step || p.t > 2.5) {
      const found = combatantById(b, p.targetId)
      const target = found && found.alive ? found : null
      // Loose ranks give up density for cover, so a scattered squad takes less
      // from arrows. The reduction is applied where the arrow lands.
      if (target) {
        const shooter = combatantById(b, p.attackerId)
        // A volley at a general is caught by his bodyguard instead.
        applyDamage(b, target, Math.max(1, Math.round(p.dmg * rangedTakenOf(b, target))), shooter)
      }
    } else {
      p.x += (dx / d) * step
      p.y += (dy / d) * step
      nextProjectiles.push(p)
    }
  }
  b.projectiles = nextProjectiles

  // Decay hit sparkles.
  b.effects = b.effects
    .map((e) => ({ ...e, t: e.t + dt }))
    .filter((e) => e.t < e.life)

  // Resolve the outcome once a side is wiped out. A training session has no
  // outcome at all: it goes on until the lord leaves the field.
  if (b.training) {
    // Every dummy that was knocked down stands back up after two seconds, so
    // the practice never runs out of targets.
    for (const u of b.units) {
      if (!u.isDummy || u.alive) continue
      if (b.time - (u.downAt || 0) > 2) {
        u.hp = u.maxHp
        u.alive = true
        u.hitFlash = 0
      }
    }
    return b
  }
  const playerAlive = aliveUnits(b, 'player')
  const enemyAlive = aliveUnits(b, 'enemy')
  // The lord going down loses the battle at once — he does not die, he is
  // carried off the field (see `applyDamage`).
  if (!cmd.alive || cmd.hp <= 0) {
    b.outcome = 'lose'
    return b
  }
  // An instant simulation settles the moment a side runs out of soldiers.
  if (!b.lastStandEnabled) {
    if (enemyAlive.length === 0) b.outcome = 'win'
    else if (playerAlive.length === 0) b.outcome = 'lose'
    return b
  }
  // Soldiers gone, general still standing: the field is not lost yet. The
  // general holds out on his own for a few seconds — long enough for the
  // child to see it, run him down, or take him home.
  if (!b.lastStand) {
    if (playerAlive.length === 0) b.lastStand = { side: 'player', t: 0 }
    else if (enemyAlive.length === 0) b.lastStand = { side: 'enemy', t: 0 }
  }
  const stand = b.lastStand
  if (!stand) return b
  // The lone general fell before the time was up: `applyDamage` already ended
  // the battle the ordinary way (the lord down, or the hostile general down).
  const generalGone =
    stand.side === 'player' ? !cmd.alive : !b.enemyCommander || !b.enemyCommander.alive
  if (generalGone) {
    if (b.outcome) return b
    b.outcome = stand.side === 'player' ? 'lose' : 'win'
    return b
  }
  stand.t += dt
  if (stand.t >= LAST_STAND_SECONDS) {
    // Time is up: the lone general gives up the field. The lord withdraws and
    // the battle is lost; a hostile general flees and the battle is won.
    b.yielded = stand.side
    b.outcome = stand.side === 'player' ? 'lose' : 'win'
  }
  return b
}

/* --------------------------------- helpers --------------------------------- */

/** Soldiers of one side still standing, merged by family and rank. */
export function survivorsByType(b, side, owner) {
  const out = []
  for (const u of b.units) {
    if (!u.alive || u.side !== side) continue
    // `owner` filters the soldiers by whose banner they marched under:
    // `undefined` reads the whole side, `null` only the lord's own soldiers and
    // a string only that companion's.
    if (owner !== undefined && (u.owner || null) !== owner) continue
    const found = out.find((x) => x.type === u.type && x.tier === u.tier)
    if (found) {
      found.count += 1
      found.hp.push(Math.max(1, u.hp))
    } else {
      out.push({ type: u.type, tier: u.tier, count: 1, hp: [Math.max(1, u.hp)] })
    }
  }
  return out
}

/**
 * Soldiers of one side that went down, merged by family and rank. A hospital
 * can still save some of them, so the store needs to know who fell.
 */
export function fallenByType(b, side, owner) {
  const out = []
  for (const u of b.units) {
    if (u.alive || u.side !== side) continue
    if (owner !== undefined && (u.owner || null) !== owner) continue
    const found = out.find((x) => x.type === u.type && x.tier === u.tier)
    if (found) found.count += 1
    else out.push({ type: u.type, tier: u.tier, count: 1 })
  }
  return out
}

/** Per-squad readout for the battle HUD. */
export function battleGroups(b, side) {
  return (side === 'player' ? b.playerGroups : Object.keys(b.groups))
    .map((key) => b.groups[key])
    .filter((g) => g && g.side === side)
    .map((g) => {
      const alive = b.units.filter((u) => u.alive && u.group === g.key).length
      return {
        key: g.key,
        type: g.type,
        tier: g.tier,
        name: g.name,
        order: g.order,
        formation: g.formation,
        density: g.density,
        total: g.unitCount,
        alive,
        owner: g.owner || null,
        ownerName: g.ownerName || null,
        rally: g.rally,
        anchor: g.anchor
      }
    })
}

/** Aggregate remaining strength for the result summary. */
export function battleSummary(b) {
  const remaining = b.units.filter((u) => u.alive && u.side === 'player')
  const byType = {}
  for (const u of remaining) byType[u.group] = (byType[u.group] || 0) + 1
  const wounded = remaining.filter((u) => u.hp < u.maxHp).length
  const fallen = b.units.filter((u) => !u.alive && u.side === 'player').length
  return { remaining, byType, kills: b.kills, losses: b.losses, wounded, fallen }
}

/**
 * The two generals as the battle HUD reads them: hit points, and how many of
 * the four bodyguards still stand between a general and his enemies.
 */
export function lordReport(b) {
  const of = (gen) => {
    if (!gen) return null
    const guards = b.units.filter((u) => u.isGuard && u.guardOf === gen.id)
    const hp = Math.max(0, Math.round(gen.hp))
    return {
      id: gen.id,
      side: gen.side,
      name: gen.name,
      hp,
      maxHp: gen.maxHp,
      percent: Math.max(0, Math.min(100, Math.round((hp / gen.maxHp) * 100))),
      alive: gen.alive,
      guards: guards.length,
      guardsAlive: guards.filter((g) => g.alive).length,
      shielded: guards.some((g) => g.alive),
      downs: gen.downs || 0
    }
  }
  return {
    lord: of(b.commander),
    enemy: of(b.enemyCommander),
    generalDowns: b.generalDowns || 0
  }
}
