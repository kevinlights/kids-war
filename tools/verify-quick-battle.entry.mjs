/**
 * Headless checks for the quick battle.
 *
 * The quick battle lets the lord pick a battlefield, set how many soldiers of
 * each kind fight on each side, and then fight it out on the real field.
 * These checks keep that contract honest.
 */
import { createPinia, setActivePinia } from 'pinia'
import { usePlayerStore } from '@/stores/player'
import { useBattleStore } from '@/stores/battle'
import { ARENA_MAPS, generateArenaTerrain, arenaCellTerrain } from '@/game/arena'
import {
  QUICK_FACTIONS,
  QUICK_MAPS,
  QUICK_MAX_COUNT,
  QUICK_SCALES,
  QUICK_UNITS,
  armyCounts,
  buildArmy,
  buildQuickArmies,
  countTotal,
  emptyCounts,
  factionCounts,
  quickFactionOf,
  quickScaleOf,
  runQuickBattle,
  scaleCounts,
  simulateRound,
  troopTotal
} from '@/game/quickBattle'

const check = (name, condition, detail = '') => globalThis.__reporter.check(name, condition, detail)

setActivePinia(createPinia())
const player = usePlayerStore()
const battle = useBattleStore()

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

check('there are four kinds of soldier', QUICK_UNITS.length === 4)
check('every kind has a name', QUICK_UNITS.every((u) => u.name && u.en && u.icon))
check('there are three enemy factions', QUICK_FACTIONS.length === 3)
check('the factions are the hostile ones', QUICK_FACTIONS.every((f) => f.key !== 'player'))
check('every faction has a mix', QUICK_FACTIONS.every((f) => f.mix && Object.keys(f.mix).length === 4))
check('the scales grow', QUICK_SCALES.every((s, i) => i === 0 || s.perSide > QUICK_SCALES[i - 1].perSide))
check('the scale falls back', quickScaleOf('nonsense').key === QUICK_SCALES[0].key)
check('the faction falls back', quickFactionOf('nonsense').key === 'bandit')

// The counts of every kind can be set to any number.
const counts = emptyCounts()
counts.militia = 3
counts.archer = 11
counts.cavalry = 0
check('the counts hold every kind', QUICK_UNITS.every((u) => typeof counts[u.key] === 'number'))
check('the counts add up', countTotal(counts) === 14, String(countTotal(counts)))

const army = buildArmy(counts)
check('the army holds the counted soldiers', army.reduce((n, g) => n + g.count, 0) === 14)
check('the army carries the kinds that were counted', army.length === 2)
check('the army carries health', army.every((g) => g.hp.length === g.count && g.hp.every((v) => v > 0)))
check('an empty kind is left out', !army.some((g) => g.count === 0))

// A whole army of one kind.
const oneKind = armyCounts('cavalry', 12)
check('an army of one kind holds them all', oneKind.cavalry === 12 && countTotal(oneKind) === 12)

// A faction fills the enemy counts with its mix.
const bandits = factionCounts('bandit', 16)
check('a faction fills the asked size', countTotal(bandits) === 16, String(countTotal(bandits)))
check('a faction uses its own kinds', bandits.militia > 0 && bandits.cavalry === 0)
const wolf = factionCounts('wolf', 16)
check('the wolf fights with spears and bows', wolf.spearman > 0 && wolf.archer > 0)
const eagle = factionCounts('eagle', 16)
check('the eagle fights with cavalry', eagle.cavalry > 0)

// Scaling keeps the mix and changes the size.
const scaled = scaleCounts(wolf, 32)
check('scaling keeps the size asked', countTotal(scaled) === 32, String(countTotal(scaled)))
check(
  'scaling keeps the mix',
  scaled.spearman > 0 && scaled.archer > 0 && Math.abs(scaled.spearman / 32 - wolf.spearman / 16) < 0.1,
  JSON.stringify({ scaled, wolf })
)
check('scaling an empty side gives soldiers', countTotal(scaleCounts(emptyCounts(), 8)) === 8)

// The two sides of a quick battle.
const { playerTroops, enemyTroops } = buildQuickArmies({
  playerCounts: armyCounts('spearman', 8),
  enemyCounts: factionCounts('bandit', 8)
})
check('the quick battle has two armies', playerTroops.length === 1 && enemyTroops.length === 2)
check('the quick battle armies have the asked size', troopTotal(playerTroops) === 8 && troopTotal(enemyTroops) === 8)
check('the count of a kind is capped at 100', QUICK_MAX_COUNT === 100, String(QUICK_MAX_COUNT))
const overfilled = buildArmy({ militia: QUICK_MAX_COUNT + 50 })
check('an overfilled kind is capped', troopTotal(overfilled) === QUICK_MAX_COUNT, String(troopTotal(overfilled)))

/* --------------------------- 3. the fight itself --------------------------- */

// The store opens the battle with the chosen armies.
player.reset('tester')
player.addTroops('militia', 1, 5)
const troopsBefore = JSON.stringify(player.troops)
const goldBefore = player.gold

battle.startQuick({
  map: 'forest',
  playerTroops,
  enemyTroops,
  enemyFaction: 'bandit',
  seed: 17
})
check('the quick battle is open', battle.active && !!battle.data)
check('the store knows it is a quick battle', battle.context.kind === 'quick')
check('the enemy is the chosen faction', battle.context.faction === 'bandit')
check('the field is the chosen battlefield', battle.context.map === 'forest')
check('the chosen armies are on the field', battle.data.units.filter((u) => u.side === 'player').length === 8)
check('the enemy army is on the field', battle.data.units.filter((u) => u.side === 'enemy').length === 8)

// The fight is a real one: it ends and it is settled.
let guard = 0
while (!battle.data.outcome && guard < 60 * 200) {
  battle.tick(1 / 60)
  guard += 1
}
check('the quick battle ends', !!battle.data.outcome, String(battle.data.outcome))
check('the quick battle settles', battle.settled === true)
check('the result carries the survivors', !!battle.result && !!battle.result.summary)

// A quick battle is a sandbox: the campaign is not touched.
check('the warband is untouched', JSON.stringify(player.troops) === troopsBefore)
check('the purse is untouched', player.gold === goldBefore)
check('the record is untouched', player.stats.battles === 0)
check('the result says it is a sandbox', battle.result.sandbox === true)
battle.close()
check('the quick battle closes', !battle.active && !battle.data)

/* --------------------------- 4. the instant run ---------------------------- */

const round = simulateRound({
  map: 'mixed',
  playerTroops,
  enemyTroops,
  enemyFaction: 'bandit',
  seed: 3
})
check('a round always ends', !!round.outcome, round.outcome)
check('a round counts the survivors', round.playerAlive >= 0 && round.enemyAlive >= 0)
check('a round counts the fallen', round.playerFallen === 8 - round.playerAlive && round.enemyFallen === 8 - round.enemyAlive)

// The whole simulation must stay fast enough for a browser.
const started = Date.now()
const report = await runQuickBattle({
  map: 'mixed',
  faction: 'bandit',
  playerCounts: armyCounts('spearman', 8),
  enemyCounts: factionCounts('bandit', 8),
  rounds: 5
})
const elapsed = Date.now() - started
check('five rounds are simulated', report.rounds === 5, String(report.rounds))
check('the results add up', report.wins + report.losses + report.draws === 5)
check('the win rate follows the wins', report.winRate === Math.round((report.wins / 5) * 100), String(report.winRate))
check('the averages are numbers', Number.isFinite(report.avgPlayerFallen) && Number.isFinite(report.avgTime))
check('the simulation is quick', elapsed < 20000, `${elapsed} ms`)
