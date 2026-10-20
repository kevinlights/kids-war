/**
 * Headless checks for the quick battle simulator.
 *
 * The simulator answers "who would win?" without a campaign: it picks a
 * battlefield, the two armies and their size, and fights the fight many times
 * over. These checks keep that contract honest.
 */
import { createPinia, setActivePinia } from 'pinia'
import { ARENA_MAPS, generateArenaTerrain, arenaCellTerrain } from '@/game/arena'
import {
  QUICK_ENEMY_FACTIONS,
  QUICK_MAPS,
  QUICK_PLAYER_ARMIES,
  QUICK_SCALES,
  buildArmy,
  buildPlayerArmy,
  quickFactionOf,
  quickScaleOf,
  runQuickBattle,
  simulateRound
} from '@/game/quickBattle'

const check = (name, condition, detail = '') => globalThis.__reporter.check(name, condition, detail)

setActivePinia(createPinia())

/* ------------------------------ 1. the maps -------------------------------- */

check('there are six battlefields', ARENA_MAPS.length === 6, String(ARENA_MAPS.length))
check('the simulator offers every battlefield', QUICK_MAPS.length === ARENA_MAPS.length)
check('every battlefield has a name and a note', ARENA_MAPS.every((m) => m.name && m.en && m.note))

/** The kinds of terrain a battlefield holds. */
function kindsOf(map) {
  const arena = generateArenaTerrain(11, 25, 17, map)
  const kinds = new Set()
  for (let r = 0; r < arena.rows; r += 1) {
    for (let c = 0; c < arena.cols; c += 1) kinds.add(arenaCellTerrain(arena, c, r).key)
  }
  return kinds
}

check('the plain field is empty ground', !kindsOf('plain').has('forest') && !kindsOf('plain').has('lake'), [...kindsOf('plain')].join(','))
check('the forest field holds woods', kindsOf('forest').has('forest'), [...kindsOf('forest')].join(','))
check('the mountain field holds mountains', kindsOf('mountain').has('mountain'), [...kindsOf('mountain')].join(','))
check('the river field holds a river', kindsOf('river').has('river'), [...kindsOf('river')].join(','))
check('the lake field holds a lake', kindsOf('lake').has('lake'), [...kindsOf('lake')].join(','))
check('the mixed field holds several kinds', kindsOf('mixed').size >= 4, [...kindsOf('mixed')].join(','))
// A lake is deep water: nobody crosses it, whatever the battlefield is.
const lakeArena = generateArenaTerrain(11, 25, 17, 'lake')
let lakeCells = 0
for (let r = 0; r < lakeArena.rows; r += 1) {
  for (let c = 0; c < lakeArena.cols; c += 1) {
    if (arenaCellTerrain(lakeArena, c, r).walkable) continue
    lakeCells += 1
  }
}
check('the lake holds deep water', lakeCells > 10, String(lakeCells))

/* ------------------------------ 2. the armies ------------------------------ */

check('there are four armies for the lord', QUICK_PLAYER_ARMIES.length === 4)
check('there are three enemy factions', QUICK_ENEMY_FACTIONS.length === 3)
check('the factions are the hostile ones', QUICK_ENEMY_FACTIONS.every((f) => f.key !== 'player'))
check('every faction has a roster', QUICK_ENEMY_FACTIONS.every((f) => f.roster.length > 0))
check('every roster entry has a share', QUICK_ENEMY_FACTIONS.every((f) => f.roster.every((r) => r.share > 0)))

const scale = quickScaleOf('company')
check('the scales grow', QUICK_SCALES.every((s, i) => i === 0 || s.perSide > QUICK_SCALES[i - 1].perSide))
check('the scale falls back', quickScaleOf('nonsense').key === QUICK_SCALES[0].key)
check('the faction falls back', quickFactionOf('nonsense').key === 'bandit')

const bandits = buildArmy(quickFactionOf('bandit').roster, 16)
const banditTotal = bandits.reduce((n, g) => n + g.count, 0)
check('the enemy army has the asked size', banditTotal === 16, String(banditTotal))
check('the enemy army carries health', bandits.every((g) => g.hp.length === g.count && g.hp.every((v) => v > 0)))
check('the enemy army keeps its families', bandits.every((g) => g.type && g.tier))

const playerArmy = buildPlayerArmy('spearman', 16)
check('the lord fields the asked size', playerArmy.reduce((n, g) => n + g.count, 0) === 16)
check('the lord fields the chosen family', playerArmy[0].type === 'spearman')
check('the lord fields healthy soldiers', playerArmy[0].hp.length === playerArmy[0].count)

/* ------------------------------- 3. the fight ------------------------------- */

const round = simulateRound({
  map: 'mixed',
  playerTroops: buildPlayerArmy('spearman', 8),
  enemyTroops: buildArmy(quickFactionOf('bandit').roster, 8),
  enemyFaction: 'bandit',
  seed: 3
})
check('a round always ends', !!round.outcome, round.outcome)
check('a round counts the survivors', round.playerAlive >= 0 && round.enemyAlive >= 0)
check('a round counts the fallen', round.playerFallen === 8 - round.playerAlive && round.enemyFallen === 8 - round.enemyAlive)

// The whole simulation must stay fast enough for a browser.
const started = Date.now()
const report = await runQuickBattle({ map: 'mixed', army: 'spearman', faction: 'bandit', scale: 'squad', rounds: 5 })
const elapsed = Date.now() - started
check('five rounds are simulated', report.rounds === 5, String(report.rounds))
check('the results add up', report.wins + report.losses + report.draws === 5)
check('the win rate follows the wins', report.winRate === Math.round((report.wins / 5) * 100), String(report.winRate))
check('the averages are numbers', Number.isFinite(report.avgPlayerFallen) && Number.isFinite(report.avgTime))
check('the simulation is quick', elapsed < 20000, `${elapsed} ms`)
