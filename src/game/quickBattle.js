/**
 * The quick battle simulator.
 *
 * It answers the question "who would win?" without playing a whole campaign:
 * pick a battlefield, pick the two armies and the size of them, and the
 * simulation fights the fight many times over and counts the results.
 *
 * The simulation itself is the ordinary one from `battle.js` — the same squads,
 * the same orders, the same terrain — so the numbers it produces are the
 * numbers the real battles would produce.
 */
import { createBattle, stepBattle } from './battle'
import { ARENA_MAPS } from './arena'
import { unitDef } from './units'

/** The armies the lord may field in a quick battle. */
export const QUICK_PLAYER_ARMIES = [
  { key: 'militia', name: '民兵', en: 'Militia', icon: '🛡️', note: '最便宜的基础兵，人多但很弱。' },
  { key: 'spearman', name: '长枪兵', en: 'Spearman', icon: '🔱', note: '防御最高的长枪阵，克制骑兵。' },
  { key: 'archer', name: '弓箭手', en: 'Archer', icon: '🏹', note: '隔空输出，需要前排挡住敌人。' },
  { key: 'cavalry', name: '骑兵', en: 'Cavalry', icon: '🐎', note: '速度最快，擅长绕后切远程。' }
]

/**
 * The enemy factions, each with the mix of families it fights with.
 *
 * The weights are the share of the enemy army each family takes.
 */
export const QUICK_ENEMY_FACTIONS = [
  {
    key: 'bandit',
    name: '强盗',
    en: 'Bandits',
    icon: '🪓',
    color: '#9aa2ab',
    note: '乌合之众：民兵为主，少数长枪兵。',
    roster: [
      { type: 'militia', tier: 1, share: 0.75 },
      { type: 'spearman', tier: 1, share: 0.25 }
    ]
  },
  {
    key: 'wolf',
    name: '苍狼王国',
    en: 'Wolf Kingdom',
    icon: '🐺',
    color: '#7a5cc0',
    note: '长枪兵与弓箭手并重，靠阵型取胜。',
    roster: [
      { type: 'spearman', tier: 2, share: 0.5 },
      { type: 'archer', tier: 2, share: 0.35 },
      { type: 'militia', tier: 1, share: 0.15 }
    ]
  },
  {
    key: 'eagle',
    name: '赤鹰王国',
    en: 'Eagle Kingdom',
    icon: '🦅',
    color: '#c98a2b',
    note: '骑兵为主，机动性最强。',
    roster: [
      { type: 'cavalry', tier: 2, share: 0.55 },
      { type: 'archer', tier: 2, share: 0.3 },
      { type: 'spearman', tier: 2, share: 0.15 }
    ]
  }
]

/** The sizes an army may have in a quick battle. */
export const QUICK_SCALES = [
  { key: 'squad', name: '小队', en: 'Squad', perSide: 8, note: '每方 8 名士兵' },
  { key: 'company', name: '中队', en: 'Company', perSide: 16, note: '每方 16 名士兵' },
  { key: 'battalion', name: '大队', en: 'Battalion', perSide: 32, note: '每方 32 名士兵' },
  { key: 'army', name: '大军', en: 'Army', perSide: 64, note: '每方 64 名士兵' }
]

/** How many fights a quick battle runs. */
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
  return QUICK_PLAYER_ARMIES.find((a) => a.key === key) || QUICK_PLAYER_ARMIES[0]
}

/** The record of an enemy faction key, falling back to the bandits. */
export function quickFactionOf(key) {
  return QUICK_ENEMY_FACTIONS.find((f) => f.key === key) || QUICK_ENEMY_FACTIONS[0]
}

/** The battlefield presets the simulator offers. */
export const QUICK_MAPS = ARENA_MAPS

/**
 * The warband of one side: the soldiers are spread over the families of a
 * roster by their share, and every soldier starts at full health.
 */
export function buildArmy(roster, perSide) {
  const troops = []
  let left = perSide
  roster.forEach((entry, index) => {
    const count = index === roster.length - 1 ? left : Math.round(perSide * entry.share)
    const take = Math.max(0, Math.min(count, left))
    left -= take
    if (!take) return
    const hp = unitDef(entry.type, entry.tier).hp
    troops.push({ type: entry.type, tier: entry.tier, count: take, hp: new Array(take).fill(hp) })
  })
  return troops
}

/** The warband of the lord's side: one family, as many soldiers as asked. */
export function buildPlayerArmy(armyKey, perSide) {
  const army = quickArmyOf(armyKey)
  const hp = unitDef(army.key, 2).hp
  return [{ type: army.key, tier: 2, count: perSide, hp: new Array(perSide).fill(hp) }]
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
 * Run the whole quick battle.
 *
 * The rounds are simulated one after the other, and the callback reports the
 * progress so the screen can show a bar while the fight is running.
 */
export async function runQuickBattle(options, onProgress) {
  const map = options.map || 'mixed'
  const scale = quickScaleOf(options.scale)
  const army = quickArmyOf(options.army)
  const faction = quickFactionOf(options.faction)
  const rounds = Math.max(1, Math.round(options.rounds || 20))
  const seed = Number.isFinite(options.seed) ? options.seed : 20261021

  const playerTroops = buildPlayerArmy(army.key, scale.perSide)
  const enemyTroops = buildArmy(faction.roster, scale.perSide)

  const results = []
  for (let i = 0; i < rounds; i += 1) {
    const round = simulateRound({
      map,
      playerTroops,
      enemyTroops,
      enemyFaction: faction.key,
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
    army,
    faction,
    scale,
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
