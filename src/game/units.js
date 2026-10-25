/**
 * Unit roster for kids-war-game.
 *
 * The army is one basic family plus three tiered branches:
 *
 *   militia                                  — the cheap village entry troop
 *   spearman / archer / cavalry              — tiered families
 *
 * Every tiered family is recruited at rank 1 and promoted in place through
 * four ranks: 初级 (basic) → 中级 (intermediate) → 高级 (advanced) → 精英 (elite).
 * Rank multiplies attack, defence, hit points, range and price, so a soldier
 * never changes family when it gets stronger.
 *
 * The three families form a rock-paper-scissors cycle:
 *
 *   spearman  >  cavalry  >  archer  >  spearman
 *
 * Everywhere in the game a soldier group is stored as `{ type, tier, count, hp }`:
 * the player's `troops` array, the town garrisons and every enemy party. `hp`
 * holds one hit-point value per soldier, so a wounded soldier can carry its
 * injuries into the next battle and heal over time.
 *
 * Art is not described here: `unitSprite(type, tier)` maps a soldier to one of
 * the 32x32 sprites under `public/pixel/unit/`.
 */

/** Rank ladder shared by every tiered family. Index 0 is rank 1. */
export const TIER_RANKS = [
  { tier: 1, rank: '初级', en: 'Basic', statMul: 1, costMul: 1, wageMul: 1 },
  { tier: 2, rank: '中级', en: 'Intermediate', statMul: 1.3, costMul: 1.9, wageMul: 1.5 },
  { tier: 3, rank: '高级', en: 'Advanced', statMul: 1.65, costMul: 3.1, wageMul: 2 },
  { tier: 4, rank: '精英', en: 'Elite', statMul: 2.05, costMul: 4.7, wageMul: 2.5 }
]

/** Highest rank a tiered family can reach. */
export const MAX_TIER = TIER_RANKS.length

/** Base (rank 1) statistics of every family. */
export const UNIT_TYPES = {
  militia: {
    key: 'militia',
    name: '民兵',
    en: 'Militia',
    tiered: false,
    atk: 4,
    def: 3,
    hp: 30,
    ranged: false,
    range: 0,
    speed: 1,
    recruitCost: 12,
    wage: 1,
    counter: null,
    note: '村庄招募的基础兵种，可升级为长枪兵、弓箭手或骑兵。'
  },
  spearman: {
    key: 'spearman',
    name: '长枪兵',
    en: 'Spearman',
    tiered: true,
    atk: 9,
    def: 10,
    hp: 56,
    ranged: false,
    range: 0,
    speed: 1,
    recruitCost: 30,
    wage: 2,
    counter: 'cavalry',
    note: '克制骑兵：长枪能顶住冲锋，防御最高。'
  },
  archer: {
    key: 'archer',
    name: '弓箭手',
    en: 'Archer',
    tiered: true,
    atk: 8,
    def: 3,
    hp: 34,
    ranged: true,
    range: 150,
    speed: 1.12,
    recruitCost: 34,
    wage: 2,
    counter: 'spearman',
    note: '克制长枪兵：隔空输出，需要前排保护。'
  },
  cavalry: {
    key: 'cavalry',
    name: '骑兵',
    en: 'Cavalry',
    tiered: true,
    atk: 12,
    def: 6,
    hp: 58,
    ranged: false,
    range: 0,
    speed: 1.8,
    recruitCost: 46,
    wage: 3,
    counter: 'archer',
    note: '克制弓箭手：速度快，适合绕后切远程。'
  }
}

/** Families ordered by role, used by the guide's upgrade diagram. */
export const BRANCHES = ['spearman', 'archer', 'cavalry']

/** Every family key. */
export const UNIT_KEYS = Object.keys(UNIT_TYPES)

/** Base definition of a family, falling back to militia for an unknown key. */
export function unitOf(key) {
  return UNIT_TYPES[key] || UNIT_TYPES.militia
}

/** Rank record for a tier, clamped into 1..MAX_TIER. */
export function rankOf(tier) {
  const t = Math.max(1, Math.min(MAX_TIER, Math.round(tier || 1)))
  return TIER_RANKS[t - 1]
}

/** Key that identifies one soldier group inside a warband array. */
export function troopKey(type, tier) {
  return `${type}:${rankOf(tier).tier}`
}

/** Display name: 民兵, 中级长枪兵, 精英骑兵, ... */
export function unitName(type, tier = 1) {
  const base = unitOf(type)
  if (!base.tiered) return base.name
  return `${rankOf(tier).rank}${base.name}`
}

/** Recruiting price of one soldier at a rank. */
export function unitCost(type, tier = 1) {
  const base = unitOf(type)
  if (!base.tiered) return base.recruitCost
  return Math.round(base.recruitCost * rankOf(tier).costMul)
}

/** Daily wage of one soldier at a rank. */
export function unitWage(type, tier = 1) {
  const base = unitOf(type)
  if (!base.tiered) return base.wage
  return Math.max(1, Math.round(base.wage * rankOf(tier).wageMul))
}

/**
 * Full battle definition of one soldier: the family stats scaled by the rank
 * multiplier. Range grows a little with the rank so elite archers outrange
 * basic ones, while movement speed stays constant.
 *
 * The result carries `type` as well as `key`, so a definition can always be
 * fed back into `troopKey()`, `addTroops()` or an upgrade edge lookup.
 */
export function unitDef(type, tier = 1) {
  const base = unitOf(type)
  const rank = base.tiered ? rankOf(tier) : { tier: 1, rank: '', statMul: 1 }
  const m = rank.statMul
  return {
    ...base,
    type: base.key,
    tier: rank.tier,
    rank: rank.rank,
    name: unitName(type, tier),
    atk: Math.round(base.atk * m),
    def: Math.round(base.def * m),
    hp: Math.round(base.hp * m),
    range: base.ranged ? Math.round(base.range * (1 + (rank.tier - 1) * 0.1)) : 0,
    recruitCost: unitCost(type, tier),
    wage: unitWage(type, tier)
  }
}

/* ------------------------------ upgrade tree ------------------------------ */

/**
 * Gold to promote one soldier along an edge of the tree. A promotion costs 70%
 * of the price gap between the two ranks, so climbing the ladder step by step
 * is always cheaper than buying the elite rank straight from a town.
 */
export function upgradeCost(fromType, fromTier, toType, toTier) {
  const step = unitCost(toType, toTier) - unitCost(fromType, fromTier)
  return Math.max(8, Math.round(step * 0.7))
}

/**
 * Upgrade edges leaving one soldier group: militia branches into the three
 * families at rank 1, every tiered family climbs to its next rank.
 *
 * Every edge names its target family in `type` and its rank in `tier`, because
 * the UI and `player.upgradeTroops()` address a soldier group as
 * `{ type, tier }` and match the edge on exactly those two fields.
 */
export function upgradesFor(type, tier = 1) {
  const base = unitOf(type)
  if (!base.tiered) {
    return BRANCHES.map((branch) => ({
      ...unitDef(branch, 1),
      type: branch,
      cost: upgradeCost(type, 1, branch, 1)
    }))
  }
  const t = rankOf(tier).tier
  if (t >= MAX_TIER) return []
  return [
    {
      ...unitDef(base.key, t + 1),
      type: base.key,
      cost: upgradeCost(base.key, t, base.key, t + 1)
    }
  ]
}

/* --------------------------------- combat --------------------------------- */

/** Rock-paper-scissors cycle, `key` counters `counters`. */
export const COUNTERS = {
  spearman: 'cavalry',
  cavalry: 'archer',
  archer: 'spearman'
}

/** Attack multiplier when the attacker counters the target. */
export const COUNTER_BONUS = 1.4
/** Attack multiplier when the target counters the attacker. */
export const COUNTER_PENALTY = 0.75

/** Damage multiplier from one family attacking another. */
export function counterMultiplier(attackerType, targetType) {
  if (COUNTERS[attackerType] === targetType) return COUNTER_BONUS
  if (COUNTERS[targetType] === attackerType) return COUNTER_PENALTY
  return 1
}

/* ---------------------------------- art ---------------------------------- */

/**
 * Sprite pair of a family: `[basic, elite]`. Ranks 1-2 wear the basic art,
 * ranks 3-4 the elite art, and the rank pips drawn on top tell them apart.
 */
const TYPE_SPRITES = {
  militia: ['militia'],
  spearman: ['spearman', 'spearman-elite'],
  archer: ['archer', 'marksman'],
  cavalry: ['cavalry', 'knight']
}

/** Sprite name for a soldier, resolved through `pixelAssets.spriteUrl`. */
export function unitSprite(type, tier = 1) {
  const pair = TYPE_SPRITES[type] || TYPE_SPRITES.militia
  return tier >= 3 && pair[1] ? pair[1] : pair[0]
}

/* ------------------------------- migration ------------------------------- */

/**
 * Keys used before the roster was standardised. Loading an old save rewrites
 * them, so a warband keeps its strength: former tier-2 soldiers become rank 2
 * and former tier-3 elites become rank 4 of the matching family.
 */
const LEGACY_TYPES = {
  militia: { type: 'militia', tier: 1 },
  infantry: { type: 'spearman', tier: 2 },
  veteran: { type: 'spearman', tier: 4 },
  archer: { type: 'archer', tier: 2 },
  marksman: { type: 'archer', tier: 4 },
  cavalry: { type: 'cavalry', tier: 2 },
  knight: { type: 'cavalry', tier: 4 }
}

/**
 * Rewrite any troop array (player warband, garrison or enemy party) into the
 * current `{ type, tier, count, hp }` shape and merge duplicate groups. Safe to
 * call on data that is already current.
 *
 * `hp` holds one hit-point value per soldier, so a wounded soldier can enter
 * the next battle with the damage it still carries. A group without hit points
 * (an old save, a fresh recruit) is filled up to full health.
 */
export function normalizeTroops(list) {
  const out = []
  for (const raw of list || []) {
    if (!raw || !raw.count) continue
    const mapped = UNIT_TYPES[raw.type] ? raw : LEGACY_TYPES[raw.type]
    if (!mapped) continue
    const type = mapped.type
    const tier = rankOf(mapped.tier ?? raw.tier ?? 1).tier
    const maxHp = unitDef(type, tier).hp
    // Old saves and legacy families have no hit points: they start healthy.
    const carried = Array.isArray(raw.hp) && raw.type === type ? raw.hp : []
    const hp = []
    for (let i = 0; i < raw.count; i += 1) {
      const value = Number(carried[i])
      hp.push(Number.isFinite(value) ? Math.max(0, Math.min(maxHp, value)) : maxHp)
    }
    const found = out.find((t) => t.type === type && t.tier === tier)
    if (found) {
      found.count += raw.count
      found.hp = found.hp.concat(hp)
    } else {
      out.push({ type, tier, count: raw.count, hp })
    }
  }
  return out
}

/** Total soldiers in a warband array. */
export function troopCount(units) {
  return (units || []).reduce((n, t) => n + t.count, 0)
}

/** How many soldiers of a warband are wounded (below full health). */
export function woundedCount(units) {
  let n = 0
  for (const group of units || []) {
    const maxHp = unitDef(group.type, group.tier).hp
    for (const value of group.hp || []) {
      if (value < maxHp) n += 1
    }
  }
  return n
}

/**
 * Heal a warband by `amount` hit points per soldier. Nobody heals past their
 * maximum, and a group that is back to full health keeps its shape.
 */
export function healTroops(units, amount) {
  if (!amount) return units
  for (const group of units || []) {
    const maxHp = unitDef(group.type, group.tier).hp
    group.hp = (group.hp || []).map((value) => Math.min(maxHp, value + amount))
  }
  return units
}

/** Average health of a warband in percent, for the roster readout. */
export function warbandHealth(units) {
  let sum = 0
  let n = 0
  for (const group of units || []) {
    const maxHp = unitDef(group.type, group.tier).hp
    for (const value of group.hp || []) {
      sum += maxHp ? value / maxHp : 1
      n += 1
    }
  }
  return n ? Math.round((sum / n) * 100) : 100
}

/** Recruiting value of a warband, used for victory loot. */
export function warbandValue(units) {
  return (units || []).reduce((n, t) => n + unitCost(t.type, t.tier) * t.count, 0)
}

/**
 * Scatter half a warband.
 *
 * A lord carried off the field loses half of the soldiers who came back with
 * him: every group keeps the healthiest half (rounded up, so one lone soldier
 * survives), and the rest are lost.
 * 主将被抬下战场时，跟着他回来的士兵会散掉一半：每组只留下体力最好的那一半（向上取整）。
 */
export function loseHalfTroops(units) {
  let lost = 0
  const out = []
  for (const group of units || []) {
    if (!group || !group.count) continue
    const maxHp = unitDef(group.type, group.tier).hp
    const hp = (group.hp || []).map((value) => Math.max(1, Math.min(maxHp, Number(value) || maxHp)))
    while (hp.length < group.count) hp.push(maxHp)
    const keep = Math.ceil(group.count / 2)
    lost += group.count - keep
    if (keep <= 0) continue
    out.push({
      ...group,
      count: keep,
      hp: hp.sort((a, b) => b - a).slice(0, keep)
    })
  }
  return { troops: out, lost }
}
