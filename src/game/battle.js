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

export const ARENA = { w: 900, h: 560, margin: 48 }

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
  { key: 'random', name: '随机', en: 'Scatter', icon: '⁘', note: '散兵散布，没有加成，最难被围住' }
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
const BASE_SPEED = 62

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
  const originX = side === 'player' ? ARENA.margin + 26 : ARENA.w - ARENA.margin - 26

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
    hitFlash: 0
  })
}

export function createBattle({ playerTroops, enemyTroops, enemyFaction, seed, playerAtkMul = 1, playerDefMul = 1 }) {
  const b = {
    rng: createRng(seed),
    enemyFaction,
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
      x: ARENA.margin + 20,
      y: ARENA.h / 2,
      tx: ARENA.margin + 20,
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

function moveToward(unit, tx, ty, speed, dt) {
  const dx = tx - unit.x
  const dy = ty - unit.y
  const d = Math.hypot(dx, dy)
  if (d < 1) return
  const step = Math.min(d, speed * dt)
  unit.x += (dx / d) * step
  unit.y += (dy / d) * step
  if (Math.abs(dx) > 2) unit.facing = dx >= 0 ? 1 : -1
}

/** Walk straight away from a point, used by ranged skirmishers. */
function moveAwayFrom(unit, fx, fy, speed, dt) {
  const dx = unit.x - fx
  const dy = unit.y - fy
  const d = Math.hypot(dx, dy)
  if (d < 1) return
  const step = speed * dt
  unit.x += (dx / d) * step
  unit.y += (dy / d) * step
}

/**
 * Where each squad is heading this frame: the enemy for an attack, its own
 * anchor for a defence, the commander for a follow and its rally point for a
 * move. Individual soldiers then walk to their slot around that point.
 */
function updateGroupTargets(b) {
  for (const g of Object.values(b.groups)) {
    if (g.side === 'player') {
      if (g.order === 'follow') {
        g.tx = b.commander.x - 40
        g.ty = b.commander.y
        continue
      }
      if (g.order === 'defend' || g.order === 'move') {
        const point = g.rally || g.anchor
        g.tx = point.x
        g.ty = point.y
        continue
      }
    }
    // attack (and every enemy squad): advance on the nearest enemy.
    let cx = 0
    let cy = 0
    let n = 0
    for (const u of b.units) {
      if (!u.alive || u.group !== g.key) continue
      cx += u.x
      cy += u.y
      n += 1
    }
    const foe = nearestFoeTo(b, g.side, n ? cx / n : g.anchor.x, n ? cy / n : g.anchor.y)
    if (foe) {
      g.tx = foe.x
      g.ty = foe.y
    }
  }
}

function strike(b, unit, target) {
  const def = unit.def
  const cooldown = def.ranged ? 1.6 : 1.0
  if (unit.cd > 0) return
  const group = b.groups[unit.group]
  const atkMul = group ? groupMods(group).atkMul : 1
  const counter = counterMultiplier(unit.type, target.type)
  const effAtk = def.atk * (unit.atkMul || 1) * atkMul * counter
  const sideDef = target.side === 'player' ? b.playerDefMul || 1 : 1
  const effDef = (target.def.def || 0) * defMulOf(b, target) * sideDef
  const dmg = Math.max(1, Math.round(effAtk - effDef * 0.5 + b.rng.float(-1, 1)))
  unit.cd = cooldown

  if (def.ranged) {
    b.projectiles.push({
      x: unit.x,
      y: unit.y,
      tx: target.x,
      ty: target.y,
      targetId: target.id,
      t: 0,
      speed: 420,
      side: unit.side,
      dmg
    })
  } else {
    applyDamage(b, target, dmg)
    b.effects.push({ x: target.x, y: target.y, t: 0, life: 0.22, kind: 'hit' })
  }
}

function applyDamage(b, target, dmg) {
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
    moveToward(cmd, cmd.tx, cmd.ty, cmd.speed, dt)
    if (cmd.cd > 0) cmd.cd -= dt
  }

  updateGroupTargets(b)

  for (const unit of b.units) {
    if (!unit.alive) continue
    const group = b.groups[unit.group]
    const def = unit.def
    if (unit.cd > 0) unit.cd -= dt
    if (unit.hitFlash > 0) unit.hitFlash -= dt
    if (!group) continue

    const mods = groupMods(group)
    const slot = group.slots[unit.slotIndex] || { ox: 0, oy: 0 }
    const { unit: foe, dist } = nearestEnemy(b, unit)
    const engage = def.ranged ? def.range : MELEE_RANGE
    const holding = group.order !== 'attack'
    // Ranged squads ordered to attack keep the enemy at arm's length: once a foe
    // closes to half their range they back away, still facing it and still
    // shooting. Squads holding a position never fall back, so an archer told to
    // 防守 stands and trades blows.
    const kiting = def.ranged && group.order === 'attack' && foe && dist < def.range * 0.5
    // A charging melee squad crowds the enemy: the slot offsets — which can be
    // tens of pixels deep in a big block or a scattered formation — are capped so
    // every soldier can reach striking distance instead of hovering out of reach
    // behind the front rank. Ranged squads never need to close, so they keep the
    // shape of their formation.
    const crowd = !def.ranged && group.order === 'attack' && foe && dist < 140 ? MELEE_RANGE * 0.5 : null
    const tx = group.tx + (crowd === null ? slot.ox : Math.max(-crowd, Math.min(crowd, slot.ox)))
    const ty = group.ty + (crowd === null ? slot.oy : Math.max(-crowd, Math.min(crowd, slot.oy)))

    if (kiting) {
      moveAwayFrom(unit, foe.x, foe.y, def.speed * BASE_SPEED * mods.speedMul, dt)
      unit.facing = foe.x >= unit.x ? 1 : -1
    } else {
      // Walk to the slot unless this soldier is already shooting / swinging.
      const dSlot = Math.hypot(tx - unit.x, ty - unit.y)
      if (dSlot > 5 && (holding || !foe || dist > engage)) {
        moveToward(unit, tx, ty, def.speed * BASE_SPEED * mods.speedMul, dt)
      }
    }
    if (foe && dist <= engage) strike(b, unit, foe)

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
      if (target) applyDamage(b, target, Math.max(1, Math.round(p.dmg * rangedTakenOf(b, target))))
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

  // Resolve the outcome once a side is wiped out.
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
