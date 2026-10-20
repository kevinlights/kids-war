/**
 * The quick battle: pick a battlefield, pick how many soldiers of each kind
 * fight on each side, and the fight happens on the real battle field.
 *
 * The simulation itself is the ordinary one from `battle.js` — the same
 * squads, the same orders, the same terrain — so the quick battle is a real
 * fight, only without a campaign around it.
 */
import { createBattle, stepBattle } from './battle'
import { ARENA_MAPS } from './arena'
import { unitDef } from './units'

/** The unit kinds a quick battle can field, and the rank they fight at. */
export const QUICK_UNITS = [
  { key: 'militia', name: '民兵', en: 'Militia', icon: '🛡️' },
  { key: 'spearman', name: '长枪兵', en: 'Spearman', icon: '🔱' },
  { key: 'archer', name: '弓箭手', en: 'Archer', icon: '🏹' },
  { key: 'cavalry', name: '骑兵', en: 'Cavalry', icon: '🐎' }
]

/** The rank the quick battle soldiers fight at: the middle one. */
export const QUICK_TIER = 2

/** The most soldiers one kind may have on a side. */
export const QUICK_MAX_COUNT = 200

/** The battlefields a quick battle can be fought on. */
export const QUICK_MAPS = ARENA_MAPS

/**
 * The army the lord may field: a whole side of one kind of soldier.
 *
 * The counts are only the starting point — every kind can be set to any
 * number afterwards.
 */
export const QUICK_ARMIES = [
  { key: 'militia', name: '民兵', en: 'Militia', icon: '🛡️', note: '最便宜的基础兵，人多但很弱。' },
  { key: 'spearman', name: '长枪兵', en: 'Spearman', icon: '🔱', note: '防御最高的长枪阵，克制骑兵。' },
  { key: 'archer', name: '弓箭手', en: 'Archer', icon: '🏹', note: '隔空输出，需要前排挡住敌人。' },
  { key: 'cavalry', name: '骑兵', en: 'Cavalry', icon: '🐎', note: '速度最快，擅长绕后切远程。' }
]

/**
 * The enemy factions: each one is a mix of the four kinds.
 *
 * Picking a faction fills the enemy counts; every count can then be changed
 * to any number.
 */
export const QUICK_FACTIONS = [
  {
    key: 'bandit',
    name: '强盗',
    en: 'Bandits',
    icon: '🪓',
    color: '#9aa2ab',
    note: '乌合之众：民兵为主，少数长枪兵。',
    mix: { militia: 0.75, spearman: 0.25, archer: 0, cavalry: 0 }
  },
  {
    key: 'wolf',
    name: '苍狼王国',
    en: 'Wolf Kingdom',
    icon: '🐺',
    color: '#7a5cc0',
    note: '长枪兵与弓箭手并重，靠阵型取胜。',
    mix: { spearman: 0.5, archer: 0.35, militia: 0.15, cavalry: 0 }
  },
  {
    key: 'eagle',
    name: '赤鹰王国',
    en: 'Eagle Kingdom',
    icon: '🦅',
    color: '#c98a2b',
    note: '骑兵为主，机动性最强。',
    mix: { cavalry: 0.55, archer: 0.3, spearman: 0.15, militia: 0 }
  }
]

/** The sizes an army may have in a quick battle. */
export const QUICK_SCALES = [
  { key: 'squad', name: '小队', en: 'Squad', perSide: 8, note: '每方 8 名士兵' },
  { key: 'company', name: '中队', en: 'Company', perSide: 16, note: '每方 16 名士兵' },
  { key: 'battalion', name: '大队', en: 'Battalion', perSide: 32, note: '每方 32 名士兵' },
  { key: 'army', name: '大军', en: 'Army', perSide: 64, note: '每方 64 名士兵' }
]

/** How many fights the instant simulation runs. */
export const QUICK_ROUNDS = [
  { key: '5', name: '5 场', count: 5 },
  { key: '20', name: '20 场', count: 20 },
  { key: '50', name: '50 场', count: 50 }
]

/** The record of a scale key, falling back to the smallest one. */
export function quickScaleOf(key) {
  return QUICK_SCALES.find((s) => s.key === key) || QUICK_SCALES[0]
}

/** The record of a player army key, falling back to the militia. */
export function quickArmyOf(key) {
  return QUICK_ARMIES.find((a) => a.key === key) || QUICK_ARMIES[0]
}

/** The record of an enemy faction key, falling back to the bandits. */
export function quickFactionOf(key) {
  return QUICK_FACTIONS.find((f) => f.key === key) || QUICK_FACTIONS[0]
}

/** The record of a unit kind, falling back to the militia. */
export function quickUnitOf(key) {
  return QUICK_UNITS.find((u) => u.key === key) || QUICK_UNITS[0]
}

/** How many soldiers a side has in total. */
export function countTotal(counts) {
  return QUICK_UNITS.reduce((n, u) => n + (counts?.[u.key] || 0), 0)
}

/** How many soldiers a warband array holds in total. */
export function troopTotal(troops) {
  return (troops || []).reduce((n, g) => n + (g.count || 0), 0)
}

/**
 * The counts of one side of the field: every kind of soldier and how many of
 * it there are.
 */
export function emptyCounts() {
  const out = {}
  for (const u of QUICK_UNITS) out[u.key] = 0
  return out
}

/**
 * The counts of a whole side of one kind of soldier.
 *
 * 整队只有一个兵种时，按总人数铺开。
 */
export function armyCounts(armyKey, perSide) {
  const counts = emptyCounts()
  counts[quickArmyOf(armyKey).key] = perSide
  return counts
}

/**
 * The counts of a faction: its mix spread over the asked size.
 *
 * The last kind of the mix takes the rounding remainder, so the side always
 * has exactly the asked number of soldiers.
 */
export function factionCounts(factionKey, perSide) {
  const faction = quickFactionOf(factionKey)
  const counts = emptyCounts()
  let left = perSide
  const kinds = QUICK_UNITS.filter((u) => faction.mix[u.key] > 0)
  kinds.forEach((unit, index) => {
    const count = index === kinds.length - 1 ? left : Math.round(perSide * faction.mix[unit.key])
    const take = Math.max(0, Math.min(count, left))
    left -= take
    counts[unit.key] = take
  })
  return counts
}

/**
 * Scale the counts of a side to a new size: the mix stays, the numbers grow
 * or shrink.
 */
export function scaleCounts(counts, perSide) {
  const total = countTotal(counts)
  const out = emptyCounts()
  if (!total) return factionCounts('bandit', perSide)
  let left = perSide
  const kinds = QUICK_UNITS.filter((u) => (counts[u.key] || 0) > 0)
  kinds.forEach((unit, index) => {
    const count = index === kinds.length - 1 ? left : Math.round((counts[unit.key] / total) * perSide)
    const take = Math.max(0, Math.min(count, left))
    left -= take
    out[unit.key] = take
  })
  return out
}

/**
 * The warband of one side: every kind of soldier with its own count, and
 * every soldier at full health.
 */
export function buildArmy(counts) {
  const troops = []
  for (const unit of QUICK_UNITS) {
    const count = Math.max(0, Math.min(QUICK_MAX_COUNT, counts?.[unit.key] || 0))
    if (!count) continue
    const hp = unitDef(unit.key, QUICK_TIER).hp
    troops.push({ type: unit.key, tier: QUICK_TIER, count, hp: new Array(count).fill(hp) })
  }
  return troops
}

/** The two armies of a quick battle, ready for `createBattle()`. */
export function buildQuickArmies({ playerCounts, enemyCounts }) {
  return {
    playerTroops: buildArmy(playerCounts),
    enemyTroops: buildArmy(enemyCounts)
  }
}

/**
 * Fight one round.
 *
 * The battle runs at the largest step the simulation allows, because nobody
 * watches it: the point is the result, not the show.
 */
export function simulateRound({ map, playerTroops, enemyTroops, enemyFaction, seed, maxTime = 120 }) {
  const battle = createBattle({
    playerTroops,
    enemyTroops,
    enemyFaction,
    seed,
    playerAtkMul: 1,
    playerDefMul: 1,
    arenaMap: map
  })
  const dt = 0.1
  let time = 0
  while (!battle.outcome && time < maxTime) {
    stepBattle(battle, dt)
    time += dt
  }
  const playerAlive = battle.units.filter((u) => u.alive && u.side === 'player').length
  const enemyAlive = battle.units.filter((u) => u.alive && u.side === 'enemy').length
  const playerTotal = battle.units.filter((u) => u.side === 'player').length
  const enemyTotal = battle.units.filter((u) => u.side === 'enemy').length
  return {
    outcome: battle.outcome || 'draw',
    time: Math.round(time * 10) / 10,
    playerAlive,
    enemyAlive,
    playerFallen: playerTotal - playerAlive,
    enemyFallen: enemyTotal - enemyAlive,
    kills: battle.kills
  }
}

/**
 * Run the whole instant simulation.
 *
 * The rounds are simulated one after the other, and the callback reports the
 * progress so the screen can show a bar while the fight is running.
 */
export async function runQuickBattle(options, onProgress) {
  const map = options.map || 'mixed'
  const rounds = Math.max(1, Math.round(options.rounds || 20))
  const seed = Number.isFinite(options.seed) ? options.seed : 20261021
  const { playerTroops, enemyTroops } = buildQuickArmies(options)

  const results = []
  for (let i = 0; i < rounds; i += 1) {
    const round = simulateRound({
      map,
      playerTroops,
      enemyTroops,
      enemyFaction: options.faction || 'bandit',
      seed: seed + i * 7919
    })
    results.push(round)
    if (onProgress) onProgress(i + 1, rounds, round)
    // Give the browser a moment to paint the progress bar.
    if (i < rounds - 1) await new Promise((resolve) => setTimeout(resolve, 0))
  }

  const wins = results.filter((r) => r.outcome === 'win').length
  const losses = results.filter((r) => r.outcome === 'lose').length
  const draws = results.length - wins - losses
  const sum = (key) => results.reduce((n, r) => n + r[key], 0)
  const avg = (key) => (results.length ? Math.round((sum(key) / results.length) * 10) / 10 : 0)

  return {
    map,
    faction: quickFactionOf(options.faction),
    rounds: results.length,
    wins,
    losses,
    draws,
    winRate: results.length ? Math.round((wins / results.length) * 100) : 0,
    avgPlayerAlive: avg('playerAlive'),
    avgEnemyAlive: avg('enemyAlive'),
    avgPlayerFallen: avg('playerFallen'),
    avgEnemyFallen: avg('enemyFallen'),
    avgTime: avg('time'),
    results
  }
}
