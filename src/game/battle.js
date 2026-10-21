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
 * Counter damage is family based (spearman > cavalry > archer > spearman) and
 * comes from `counterMultiplier` in `units.js`.
 */
import { unitDef, unitName, counterMultiplier, normalizeTroops } from './units'
import { createRng } from './rng'
import { arenaTerrainAt, arenaWalkable, ARENA_CELL, generateArenaTerrain } from './arena'

/**
 * The battle field. It is deliberately larger than the screen of a phone: the
 * camera follows the fighting instead, so the armies still have room to manoeuvre.
 */
export const ARENA = { w: 1000, h: 680, margin: 50 }

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
/** Pixels per second at `speed: 1`. */
const BASE_SPEED = 90

/**
 * How fast the battle runs. The slow speed is the default one, so a child can
 * read the field and give orders before the next clash happens.
 */
export const SPEEDS = [
  { key: 'slow', name: '慢速', en: 'Slow', icon: '🐢', mul: 0.6, note: '战斗慢半拍，方便看清每一个动作' },
  { key: 'normal', name: '正常', en: 'Normal', icon: '🚶', mul: 1, note: '游戏原本的速度' },
  { key: 'fast', name: '快速', en: 'Fast', icon: '🐇', mul: 1.8, note: '战局推进很快，适合熟练之后' }
]

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
function addSide(b, side, troops, dir, atkMul) {
  // One squad per family and rank; duplicates are merged up front so a squad
  // always has a single anchor point.
  const list = normalizeTroops(troops)
  // The armies start in their own half of the field, with room to manoeuvre in
  // between instead of clashing on the first step.
  const originX = side === 'player' ? ARENA.w * 0.22 : ARENA.w * 0.78

  list.forEach((t, gi) => {
    const def = unitDef(t.type, t.tier)
    const key = groupKeyOf(side, t.type, def.tier)
    const anchorY = (ARENA.h * (gi + 1)) / (list.length + 1)
    const group = {
      key,
      side,
      type: t.type,
      tier: def.tier,
      name: unitName(t.type, def.tier),
      formation: side === 'player' ? 'square' : 'line2',
      density: 'tight',
      order: 'attack',
      // The way the formation faces: it turns towards the foe it attacks.
      dir,
      anchor: { x: originX, y: anchorY },
      rally: null,
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
    facing: dir > 0 ? 1 : -1,
    hitFlash: 0,
    // The soldier that hit it last: it answers that one first.
    lastAttackerId: null,
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

export function createBattle({
  playerTroops,
  enemyTroops,
  enemyFaction,
  seed,
  playerAtkMul = 1,
  playerDefMul = 1,
  training = false,
  arenaMap = 'mixed'
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
    commander: {
      id: 'commander',
      side: 'player',
      type: 'commander',
      x: ARENA.w * 0.16,
      y: ARENA.h / 2,
      tx: ARENA.w * 0.16,
      ty: ARENA.h / 2,
      maxHp: 120,
      hp: 120,
      atk: 14,
      def: 12,
      speed: 150,
      alive: true,
      cd: 0,
      isCommander: true
    },
    projectiles: [],
    effects: [],
    time: 0,
    outcome: null, // 'win' | 'lose' | null
    kills: 0,
    losses: 0
  }
  addSide(b, 'player', playerTroops, 1, playerAtkMul)
  addSide(b, 'enemy', enemyTroops, -1, 1)
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
      facing: -1,
      hitFlash: 0,
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
    revived += 1
  }
  return revived
}

/* -------------------------------- simulation -------------------------------- */

function aliveUnits(b, side) {
  return b.units.filter((u) => u.alive && u.side === side)
}

function nearestEnemy(b, unit) {
  const foeSide = unit.side === 'player' ? 'enemy' : 'player'
  let best = null
  let bestD = Infinity
  for (const u of b.units) {
    if (!u.alive || u.side !== foeSide) continue
    const d = Math.hypot(u.x - unit.x, u.y - unit.y)
    if (d < bestD) {
      bestD = d
      best = u
    }
  }
  return { unit: best, dist: bestD }
}

/**
 * The soldier's target.
 *
 * Whoever hit it last comes first while it is within reach: a soldier that is
 * attacked always answers, even when it was holding its position or walking
 * somewhere else. Out of reach the nearest enemy is the target as usual.
 */
function foeFor(b, unit) {
  const nearest = nearestEnemy(b, unit)
  if (!unit.lastAttackerId) return nearest
  const attacker = b.units.find((u) => u.id === unit.lastAttackerId)
  if (!attacker || !attacker.alive) return nearest
  const d = Math.hypot(attacker.x - unit.x, attacker.y - unit.y)
  const reach = unit.def.ranged ? unit.def.range : MELEE_RANGE
  if (d > reach) return nearest
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

    if (g.side === 'player') {
      if (g.order === 'follow') {
        g.tx = b.commander.x - 40
        g.ty = b.commander.y
        g.retreat = null
        continue
      }
      if (g.order === 'defend' || g.order === 'move') {
        const point = g.rally || g.anchor
        g.tx = point.x
        g.ty = point.y
        g.retreat = null
        continue
      }
    }

    // attack (and every enemy squad): advance on the nearest enemy.
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
    const toward = Math.hypot(cx - foe.x, cy - foe.y) || 1
    g.tx = foe.x + ((cx - foe.x) / toward) * press
    g.ty = foe.y + ((cy - foe.y) / toward) * press

    // A ranged squad keeps its distance: the whole formation steps back
    // together instead of every soldier running on its own.
    const d = Math.hypot(foe.x - cx, foe.y - cy)
    if (def.ranged && d < def.range * 0.5) {
      const len = d || 1
      g.retreat = { x: (cx - foe.x) / len, y: (cy - foe.y) / len }
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

function strike(b, unit, target) {
  // A training dummy only takes blows: it never swings back.
  if (unit.isDummy) return
  const def = unit.def
  const cooldown = def.ranged ? 1.6 : 1.0
  if (unit.cd > 0) return
  const dmg = damageOf(b, unit, target)
  unit.cd = cooldown

  if (def.ranged) {
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
    // The blow shoves it aside: the line shuffles instead of standing still.
    if (target.wobble) {
      const dx = target.x - attacker.x
      const dy = target.y - attacker.y
      const len = Math.hypot(dx, dy) || 1
      target.wobble.dx += (dx / len) * 5
      target.wobble.dy += (dy / len) * 5
    }
  }
  if (target.isCommander) {
    target.hp = Math.max(0, target.hp - dmg)
    target.hitFlash = 0.2
    if (target.hp <= 0) {
      target.alive = false
      b.outcome = 'lose'
    }
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

export function stepBattle(b, dt) {
  if (b.outcome) return b
  b.time += dt
  const cmd = b.commander

  // Move the commander smoothly toward its click target.
  if (cmd.alive) {
    moveToward(cmd, cmd.tx, cmd.ty, cmd.speed, dt, (x, y) => blockedAt(b, x, y))
    if (cmd.cd > 0) cmd.cd -= dt
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
    if (!group) continue

    const mods = groupMods(group)
    const slot = group.slots[unit.slotIndex] || { ox: 0, oy: 0 }
    // The target: whoever hit this soldier last comes first while it is in
    // reach, so an attack is always answered.
    const { unit: foe, dist } = foeFor(b, unit)
    const engage = def.ranged ? def.range : MELEE_RANGE
    const holding = group.order !== 'attack'
    // The ground the soldier stands on slows it down: a forest or a river
    // costs time, a mountain gives a better view but a slippery footing.
    const ground = arenaTerrainAt(b.terrain, unit.x, unit.y)
    const speed = def.speed * BASE_SPEED * mods.speedMul * ground.speedMul
    const prevX = unit.x
    const prevY = unit.y
    // The formation breathes. Every soldier sways a little inside its slot,
    // dodges aside when it is hit and slides away from a neighbour that
    // stands too close — the shape of the squad stays, the line is alive.
    const inReach = !!(foe && dist <= engage)
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
      const d = Math.hypot(ddx, ddy)
      if (d > 14 || d < 0.01) continue
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
    const tx = scattered ? foe.x + offX * 1.6 : group.tx + slot.ox + offX
    const ty = scattered ? foe.y + offY * 1.6 : group.ty + slot.oy + offY

    let wantsToMove = false
    if (group.retreat) {
      // A ranged squad that is too close steps back as one block, so every
      // soldier keeps its place in the formation.
      wantsToMove = true
      moveToward(
        unit,
        unit.x + group.retreat.x * 60,
        unit.y + group.retreat.y * 60,
        speed,
        dt,
        (x, y) => blockedAt(b, x, y)
      )
    } else {
      // Walk to the slot unless this soldier is already shooting / swinging.
      // The soldier holds its slot tightly (2 px): a soldier that drifts off
      // its slot would step out of reach of the foe and stop fighting.
      const dSlot = Math.hypot(tx - unit.x, ty - unit.y)
      // A soldier that is trading blows still shuffles back into its place
      // after a blow shoved it aside.
      const shuffle = Math.hypot(wob.dx + pushX * 0.4, wob.dy + pushY * 0.4)
      if (dSlot > 2 && (holding || !foe || dist > engage || shuffle > 2)) {
        wantsToMove = true
        moveToward(unit, tx, ty, speed, dt, (x, y) => blockedAt(b, x, y))
      }
    }
    if (foe && dist <= engage) {
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
      const target = b.units.find((u) => u.id === p.targetId && u.alive)
      // Loose ranks give up density for cover, so a scattered squad takes less
      // from arrows. The reduction is applied where the arrow lands.
      if (target) {
        const shooter = p.attackerId ? b.units.find((u) => u.id === p.attackerId) : null
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
  if (!cmd.alive) b.outcome = 'lose'
  else if (enemyAlive.length === 0) b.outcome = 'win'
  else if (playerAlive.length === 0) b.outcome = 'lose'
  return b
}

/* --------------------------------- helpers --------------------------------- */

/** Soldiers of one side still standing, merged by family and rank. */
export function survivorsByType(b, side) {
  const out = []
  for (const u of b.units) {
    if (!u.alive || u.side !== side) continue
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
export function fallenByType(b, side) {
  const out = []
  for (const u of b.units) {
    if (u.alive || u.side !== side) continue
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
