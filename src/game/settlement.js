/**
 * Settlement state: ownership, garrisons, the town economy and facilities.
 *
 * A settlement is a town or a village on the world map. Every one of them
 * belongs to exactly one owner:
 *
 *   neutral  无主    - enterable by anyone
 *   player   主角    - captured by the lord, run by the player
 *   bandit   强盗    - only ever villages; the lord cannot walk in
 *   wolf     苍狼    - a kingdom town or village
 *   eagle    赤鹰    - a kingdom town or village
 *
 * Bandits may never hold a town — that is the rule that makes the two
 * kingdoms the real opponents.
 *
 * A player-owned town develops over time:
 *
 *   考试 exam        → 资金 funds + 发展 development
 *   发展 development → 繁荣度 prosperity (rises while development is high,
 *                      falls when it is low)
 *   繁荣度 prosperity → 等级 level (the next threshold promotes the town)
 *
 * The level makes the town better: richer recruits, a larger garrison, faster
 * healing. The funds pay for facilities: the hospital heals the wounded and
 * keeps defeated soldiers alive, the barracks trains the army.
 */
import { createRng } from './rng'
import { unitDef, unitCost, normalizeTroops, troopCount, MAX_TIER } from './units'
import { FACTIONS } from './factions'

/** The owner key of a settlement that belongs to nobody. */
export const NEUTRAL = 'neutral'
/** The owner key of a settlement the lord has taken. */
export const PLAYER = 'player'
/** The owner key of a settlement held by the bandits. */
export const BANDIT = 'bandit'

/** Kingdoms that hold towns and villages. */
export const KINGDOMS = ['wolf', 'eagle']

/**
 * Town levels. A town is promoted as soon as its prosperity reaches the next
 * threshold; the last entry is the cap.
 */
export const TOWN_LEVELS = [
  { level: 1, name: '村镇', en: 'Hamlet', prosperity: 0, recruitBias: 1, heal: 0, garrison: 5 },
  { level: 2, name: '小镇', en: 'Town', prosperity: 40, recruitBias: 1.35, heal: 6, garrison: 8 },
  { level: 3, name: '城镇', en: 'City', prosperity: 70, recruitBias: 1.8, heal: 12, garrison: 11 },
  { level: 4, name: '大城', en: 'Great city', prosperity: 90, recruitBias: 2.4, heal: 18, garrison: 14 }
]

/** Facilities a town can build with its own funds. */
export const FACILITIES = {
  hospital: {
    key: 'hospital',
    name: '医院',
    en: 'Hospital',
    icon: '🏥',
    maxLevel: 3,
    baseCost: 120,
    stepCost: 90,
    healPerLevel: 0.5,
    survivalPerLevel: 0.1,
    note: '加快伤兵恢复，并提高战败时的士兵存活率。',
    en_note: 'Heals the wounded faster and keeps defeated soldiers alive.'
  },
  barracks: {
    key: 'barracks',
    name: '军营',
    en: 'Barracks',
    icon: '🏚️',
    maxLevel: 3,
    baseCost: 150,
    stepCost: 100,
    armyBonusPerLevel: 0.06,
    note: '训练士兵，提高全军攻击与防御。',
    en_note: 'Trains the army: every level adds attack and defence.'
  }
}

/** Days a lord needs to prepare a siege before he may storm a town. */
export const SIEGE_PREPARE_DAYS = 2
/** Soldiers the garrison may gain per day while a siege is being prepared. */
export const SIEGE_GARRISON_PER_DAY = 1
/** Extra soldiers the garrison may hold on top of its base size. */
export const SIEGE_GARRISON_BONUS = 4

/* --------------------------------- helpers -------------------------------- */

/**
 * How strong the NPC factions may grow.
 *
 * Their strength is tied to the prosperity of the towns the lord holds: the
 * richer his empire, the stronger his rivals get. The number is a cap on the
 * soldiers a single faction may field on the map.
 */
export function factionStrengthCap(settlements) {
  let prosperity = 0
  for (const st of settlements || []) {
    if (st.owner === PLAYER) prosperity += st.prosperity || 0
  }
  return Math.round(20 + prosperity * 0.6)
}

/** Soldiers one faction currently fields on the map. */
export function factionSoldiers(parties, faction) {
  let n = 0
  for (const p of parties || []) {
    if (p.faction !== faction) continue
    for (const g of p.units || []) n += g.count
  }
  return n
}

/** Level record of a settlement, clamped into 1..TOWN_LEVELS.length. */
export function levelOf(settlement) {
  const level = Math.max(1, Math.min(TOWN_LEVELS.length, settlement?.level || 1))
  return TOWN_LEVELS[level - 1]
}

/** Prosperity needed for the next level, or null when the town is at the top. */
export function nextThreshold(settlement) {
  const next = TOWN_LEVELS[settlement?.level || 1]
  return next ? next.prosperity : null
}

/** Owner record of a settlement, falling back to the neutral one. */
export function ownerOf(settlement) {
  const key = settlement?.owner || NEUTRAL
  return FACTIONS[key] || { key: NEUTRAL, name: '无主', en: 'Unclaimed', color: '#d8c39a' }
}

/**
 * The lord may walk into every settlement except a bandit village. A town held
 * by a kingdom can be entered without taking it — the lord may trade and
 * examine there, and only capture it by force if he wants to.
 *
 * 强盗的村庄进不去；别的势力的城镇可以先进去 —— 主角可以在里面考试与招募，
 * 想要据为己有才需要打下来。
 */
export function canEnter(settlement) {
  if (!settlement) return false
  return settlement.owner !== BANDIT
}

/** Only the lord's own towns can be developed and improved. */
export function isPlayerTown(settlement) {
  return !!settlement && settlement.owner === PLAYER
}

/** A settlement the lord may attack: a hostile town or a bandit village. */
export function isAttackable(settlement) {
  if (!settlement) return false
  if (settlement.owner === BANDIT) return settlement.kind === 'village'
  if (settlement.owner === NEUTRAL) {
    // An unclaimed town that still holds soldiers has to be stormed.
    return settlement.kind === 'town' && garrisonCount(settlement.garrison) > 0
  }
  return settlement.kind === 'town' && settlement.owner !== PLAYER
}

/**
 * Can the lord take the settlement without a fight?
 *
 * An unclaimed town nobody defends is simply claimed — the lord walks in and
 * raises his flag. As soon as the town holds soldiers, the flag has to be
 * planted the hard way: the garrison has to be beaten first.
 */
export function claimIsFree(settlement) {
  if (!settlement) return false
  if (settlement.owner !== NEUTRAL) return false
  return garrisonCount(settlement.garrison) === 0
}

/** An unclaimed town that still holds soldiers and has to be stormed. */
export function needsAssault(settlement) {
  if (!settlement) return false
  if (settlement.owner !== NEUTRAL) return false
  if (settlement.kind !== 'town') return false
  return garrisonCount(settlement.garrison) > 0
}

/**
 * A town the lord may besiege: one held by a kingdom. A neutral town is
 * claimed without a fight, and a town of the lord's own needs no war at all.
 */
export function canSiege(settlement) {
  if (!settlement) return false
  if (settlement.kind !== 'town') return false
  return settlement.owner === 'wolf' || settlement.owner === 'eagle'
}

/** Cost of the next hospital or barracks level. */
export function facilityCost(key, level = 0) {
  const def = FACILITIES[key]
  if (!def) return Infinity
  return def.baseCost + def.stepCost * level
}

/** Level of a facility, 0 when it was never built. */
export function facilityLevel(settlement, key) {
  return settlement?.facilities?.[key] || 0
}

/** Attack and defence bonus the army gets from all its barracks. */
export function armyBonusOf(settlements) {
  let bonus = 0
  for (const st of settlements || []) {
    if (st.owner !== PLAYER) continue
    bonus += facilityLevel(st, 'barracks') * FACILITIES.barracks.armyBonusPerLevel
  }
  return bonus
}

/**
 * Hit points a wounded soldier regains per day.
 *
 * Resting inside a settlement heals far faster than marching; the lord's own
 * towns heal faster still, and every hospital level multiplies the rate.
 */
export function healRate({ inSettlement = false, ownTown = false, level = 1, hospital = 0 } = {}) {
  let rate = inSettlement ? 24 : 6
  if (ownTown) rate += 6 + 6 * (level - 1)
  if (hospital > 0) rate *= 1 + FACILITIES.hospital.healPerLevel * hospital
  return rate
}

/**
 * Chance that a soldier who reached zero hit points survives as a wounded
 * soldier instead of dying for good. Hospitals keep more of them alive.
 */
export function survivalChance(hospital = 0) {
  return 0.35 + FACILITIES.hospital.survivalPerLevel * hospital
}

/* -------------------------------- garrisons -------------------------------- */

/** Soldiers a settlement of this level can field. */
export function garrisonSize(settlement) {
  const base = settlement.kind === 'town' ? levelOf(settlement).garrison : 2 + (settlement.level || 1)
  return base
}

/** Families a garrison of this owner fields. */
function garrisonFamilies(owner) {
  if (owner === 'wolf') return ['spearman', 'spearman', 'archer', 'cavalry']
  if (owner === 'eagle') return ['cavalry', 'cavalry', 'archer', 'spearman']
  if (owner === BANDIT) return ['militia', 'militia', 'archer']
  return ['militia', 'militia', 'spearman']
}

/** Small stable hash so a settlement always rolls the same garrison. */
function seedOf(settlement) {
  let h = 2166136261
  const text = `${settlement.id}:${settlement.recruitSeed || 0}`
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * The soldiers that defend a settlement. Towns field a mix of their owner's
 * families, villages a smaller band.
 */
export function makeGarrison(settlement) {
  const rng = createRng(seedOf(settlement))
  const size = garrisonSize(settlement)
  const families = garrisonFamilies(settlement.owner)
  const groups = []
  for (let i = 0; i < size; i += 1) {
    const type = rng.pick(families)
    // A town or village never fields elites; the lord's own training is the
    // only way to reach the higher ranks.
    const tier = 1 + (rng.next() < 0.25 ? 1 : 0)
    const found = groups.find((g) => g.type === type && g.tier === tier)
    if (found) found.count += 1
    else groups.push({ type, tier, count: 1 })
  }
  return groups.map((g) => ({
    type: g.type,
    tier: Math.min(MAX_TIER, g.tier),
    count: g.count,
    hp: new Array(g.count).fill(unitDef(g.type, g.tier).hp)
  }))
}

/** Soldiers of a garrison, counted. */
export function garrisonCount(garrison) {
  return troopCount(garrison)
}

/** Add soldiers to a garrison, topping them up to full health. */
export function addGarrison(garrison, type, tier, count) {
  const found = garrison.find((g) => g.type === type && g.tier === tier)
  const hp = unitDef(type, tier).hp
  if (found) {
    found.count += count
    found.hp = (found.hp || []).concat(new Array(count).fill(hp))
    return garrison
  }
  garrison.push({ type, tier, count, hp: new Array(count).fill(hp) })
  return garrison
}

/* -------------------------------- the economy ------------------------------- */

/** Daily income a town earns from its prosperity. */
export function dailyIncome(settlement) {
  if (!isPlayerTown(settlement)) return 0
  return Math.max(0, Math.round((settlement.prosperity || 0) * 0.15))
}

/**
 * Advance a settlement by one day.
 *
 * A player town earns money from its prosperity, loses prosperity while its
 * development is low and gains it while the development is high. A hostile
 * settlement slowly refills its garrison, which is what makes a long siege
 * expensive.
 */
export function tickSettlement(settlement, days = 1) {
  if (!settlement) return settlement
  const player = isPlayerTown(settlement)

  if (player) {
    const development = settlement.development || 0
    // Development above 40 lifts the town, below 40 it slides back.
    const drift = (development - 40) * 0.15 * days
    settlement.prosperity = Math.max(0, Math.min(100, (settlement.prosperity || 0) + drift))
    // Without exams the town slowly forgets how to grow.
    settlement.development = Math.max(0, development - 0.2 * days)
    settlement.funds = (settlement.funds || 0) + dailyIncome(settlement) * days
    syncLevel(settlement)
  } else if (settlement.owner !== NEUTRAL) {
    // A hostile town keeps its garrison up: a siege that takes too long meets
    // more soldiers than it did at the start.
    const size = garrisonSize(settlement)
    const cap = size + SIEGE_GARRISON_BONUS
    if (garrisonCount(settlement.garrison) < cap && settlement.kind === 'town') {
      const rng = createRng(seedOf(settlement) + (settlement.day || 0) * 7919)
      const type = rng.pick(garrisonFamilies(settlement.owner))
      addGarrison(settlement.garrison, type, 1, 1)
    }
  }
  return settlement
}

/** Promote a town as soon as its prosperity reaches the next threshold. */
export function syncLevel(settlement) {
  if (!settlement) return settlement
  let level = settlement.level || 1
  while (level < TOWN_LEVELS.length && (settlement.prosperity || 0) >= TOWN_LEVELS[level].prosperity) {
    level += 1
  }
  settlement.level = level
  return settlement
}

/**
 * What an exam gives the town: the correct answers lift the development.
 *
 * The gold of the exam always goes to the lord's own purse — the town is paid
 * by an injection, so a lord who owns his towns is never short of money.
 */
export function examReward(settlement, { correct = 0 } = {}) {
  if (!isPlayerTown(settlement)) return { development: 0 }
  const development = correct * 2
  settlement.development = Math.min(100, (settlement.development || 0) + development)
  return { development }
}

/** Personal gold the lord pays to fill the town treasury. */
export const INJECT_COST = 100
/** Development bought with the town's own money. */
export const INVEST_COST = 60
export const INVEST_GAIN = 6

/** Move the lord's gold into the town treasury. */
export function injectFunds(settlement, amount = INJECT_COST) {
  if (!isPlayerTown(settlement)) return { ok: false, reason: '这不是你的城镇' }
  settlement.funds = (settlement.funds || 0) + amount
  return { ok: true, amount }
}

/** Development bought with the town's own money. */
export function investDevelopment(settlement) {
  if (!isPlayerTown(settlement)) return { ok: false, reason: '这不是你的城镇' }
  if ((settlement.funds || 0) < INVEST_COST) return { ok: false, reason: '资金不足' }
  if ((settlement.development || 0) >= 100) return { ok: false, reason: '发展已满' }
  settlement.funds -= INVEST_COST
  settlement.development = Math.min(100, (settlement.development || 0) + INVEST_GAIN)
  return { ok: true }
}

/** Build or upgrade a facility, paying with the town's funds. */
export function buildFacility(settlement, key) {
  const def = FACILITIES[key]
  if (!def) return { ok: false, reason: '没有这种设施' }
  if (!isPlayerTown(settlement)) return { ok: false, reason: '这不是你的城镇' }
  const level = facilityLevel(settlement, key)
  if (level >= def.maxLevel) return { ok: false, reason: '已达最高级' }
  const cost = facilityCost(key, level)
  if ((settlement.funds || 0) < cost) return { ok: false, reason: '资金不足' }
  settlement.funds -= cost
  settlement.facilities = settlement.facilities || {}
  settlement.facilities[key] = level + 1
  return { ok: true, cost, level: level + 1 }
}

/** Capture a town for the lord: it starts over as a poor little hamlet. */
export function captureSettlement(settlement) {
  if (!settlement) return settlement
  settlement.owner = PLAYER
  settlement.garrison = []
  settlement.level = 1
  settlement.prosperity = 25
  settlement.development = 20
  settlement.funds = 0
  settlement.facilities = { hospital: 0, barracks: 0 }
  settlement.siege = null
  return settlement
}

/**
 * Take over an unclaimed settlement without a fight: nobody defends it, so the
 * lord simply walks in and raises his flag.
 *
 * A town that still holds soldiers is refused here — it has to be stormed
 * first, the same way a kingdom town does.
 */
export function claimSettlement(settlement) {
  if (!settlement) return { ok: false, reason: '找不到这个据点' }
  if (settlement.owner !== NEUTRAL) return { ok: false, reason: '这里已经有主人了' }
  if (!claimIsFree(settlement)) return { ok: false, reason: '城里还有守军，要先打下来' }
  captureSettlement(settlement)
  return { ok: true, settlement }
}

/** Drive the bandits out of a village: it becomes unclaimed again. */
export function liberateSettlement(settlement) {
  if (!settlement) return settlement
  settlement.owner = NEUTRAL
  settlement.garrison = []
  settlement.siege = null
  return settlement
}

/**
 * Make sure a settlement carries every field the game expects.
 *
 * A save from before the ownership system has no owner at all, so one is
 * picked deterministically from the settlement's id: the world still has
 * hostile towns and bandit villages to take.
 */
export function normalizeSettlement(settlement) {
  if (!settlement) return settlement
  if (!settlement.owner) settlement.owner = legacyOwner(settlement)
  settlement.level = Math.max(1, Math.min(TOWN_LEVELS.length, settlement.level || 1))
  settlement.prosperity = Math.max(0, Math.min(100, settlement.prosperity ?? 30))
  settlement.development = Math.max(0, Math.min(100, settlement.development ?? 20))
  settlement.funds = Math.max(0, settlement.funds ?? 0)
  settlement.facilities = settlement.facilities || { hospital: 0, barracks: 0 }
  settlement.facilities.hospital = facilityLevel(settlement, 'hospital')
  settlement.facilities.barracks = facilityLevel(settlement, 'barracks')
  settlement.garrison = normalizeTroops(settlement.garrison)
  // A town the lord holds keeps no enemy garrison, and an unclaimed town may
  // have nobody inside; every other settlement fields one.
  const undefended = settlement.owner === NEUTRAL && settlement.kind === 'town'
  if (!settlement.garrison.length && settlement.owner !== PLAYER && !undefended) {
    settlement.garrison = makeGarrison(settlement)
  }
  if (!settlement.siege) settlement.siege = null
  return settlement
}

/** Owner for a settlement from a save that predates the ownership system. */
function legacyOwner(settlement) {
  const rng = createRng(seedOf(settlement))
  if (settlement.kind === 'town') return rng.next() < 0.72 ? rng.pick(KINGDOMS) : NEUTRAL
  const roll = rng.next()
  if (roll < 0.5) return rng.pick(KINGDOMS)
  if (roll < 0.78) return NEUTRAL
  return BANDIT
}
