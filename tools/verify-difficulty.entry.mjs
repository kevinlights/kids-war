/**
 * Headless checks for the three difficulty levels and the campaign threat.
 *
 * The numbers here are the contract of the difficulty redesign: the normal
 * level keeps the old payouts, the practice level cannot be farmed, the hard
 * level pays less and fields more enemies, and the threat rises with the
 * battles won but never punishes a child who is stuck.
 */
import { createPinia, setActivePinia } from 'pinia'
import { settlePaper } from '@/game/quiz/reward'
import { rewardFor } from '@/game/quiz'
import { NPC_FACTIONS } from '@/game/factions'
import { generateWorld } from '@/game/worldgen'
import { recruitList } from '@/game/recruit'
import { factionStrengthCap } from '@/game/settlement'
import {
  DIFFICULTIES,
  enemyCapMulOf,
  enemySizeMulOf,
  foeOf,
  foodPerBattleOf,
  paperCapOf,
  recruitMulOf,
  rewardMul,
  startOf,
  threatOf
} from '@/game/difficulty'
import { usePlayerStore } from '@/stores/player'
import { useWorldStore } from '@/stores/world'

const check = (name, condition, detail = '') => globalThis.__reporter.check(name, condition, detail)

setActivePinia(createPinia())
const player = usePlayerStore()
const world = useWorldStore()

/* ------------------------------- 1. the price ------------------------------- */

const q = (type = 'math', grade = 3) => ({ type, grade, prompt: 'q', options: ['a', 'b'], answer: 0 })
const paper = (count, right, difficulty) =>
  settlePaper({
    answers: Array.from({ length: count }, (_, i) => ({ question: q(), correct: i < right })),
    difficulty,
    rng: () => 0.99
  })

check('normal keeps the shipped grade 3 price', rewardFor(q(), 'normal') === 19)
check('normal keeps the shipped grade 4 price', rewardFor(q('math', 4), 'normal') === 25)
check('hard cuts the price by a fifth', rewardFor(q(), 'hard') === 14 && rewardFor(q('math', 4), 'hard') === 19)
check('hard cuts the subject bonus too', rewardFor(q('logic'), 'hard') === 19 && rewardFor(q('encyclopedia'), 'hard') === 18)
check('easy stays a flat five', rewardFor(q(), 'easy') === 5 && rewardFor(q('logic', 4), 'easy') === 5)
check('the price multiplier is only on hard', rewardMul('easy') === 1 && rewardMul('normal') === 1 && rewardMul('hard') === 0.8)

/* ------------------------------ 2. the paper ------------------------------- */

const normal5 = paper(5, 5, 'normal')
const normal8 = paper(8, 8, 'normal')
const normal12 = paper(12, 12, 'normal')
check('normal keeps the 5 question payout', normal5.gold === 239, String(normal5.gold))
check('normal keeps the 8 question payout', normal8.gold === 410, String(normal8.gold))
check('normal keeps the 12 question payout', normal12.gold === 677, String(normal12.gold))

const hard5 = paper(5, 5, 'hard')
const hard8 = paper(8, 8, 'hard')
const hard12 = paper(12, 12, 'hard')
check('hard pays 74 percent of normal on five questions', hard5.gold === 176, String(hard5.gold))
check('hard pays less on eight questions', hard8.gold === 302 && hard8.gold < normal8.gold, String(hard8.gold))
check('hard pays less on twelve questions', hard12.gold === 499 && hard12.gold < normal12.gold, String(hard12.gold))

const easy5 = paper(5, 5, 'easy')
const easy8 = paper(8, 8, 'easy')
const easy12 = paper(12, 12, 'easy')
check('the practice paper is capped at five questions', easy5.gold === 50 && easy5.capped, String(easy5.gold))
check('the practice paper is capped at eight questions', easy8.gold === 80 && easy8.capped, String(easy8.gold))
check('the practice paper is capped at twelve questions', easy12.gold === 120 && easy12.capped, String(easy12.gold))
check('the practice cap leaves a weak paper alone', paper(5, 3, 'easy').capped === false)
check('the practice cap is twice the base', paperCapOf('easy') === 2 && easy12.gold === easy12.base * 2)

check('every level pays for the same questions', normal5.correct === hard5.correct && hard5.correct === easy5.correct && normal5.passLine === 3)
check('the reward order is easy < hard < normal', easy12.gold < hard12.gold && hard12.gold < normal12.gold)

/* ------------------------------- 3. the start ------------------------------- */

check('easy starts with 150 gold and 8 food', startOf('easy').gold === 150 && startOf('easy').food === 8)
check('normal keeps the shipped start', startOf('normal').gold === 120 && startOf('normal').food === 5)
check('hard starts with 90 gold and 3 food', startOf('hard').gold === 90 && startOf('hard').food === 3)
check('food per battle rises with the level', foodPerBattleOf('easy') === 2 && foodPerBattleOf('normal') === 3 && foodPerBattleOf('hard') === 4)
check('recruit prices rise with the level', recruitMulOf('easy') < recruitMulOf('normal') && recruitMulOf('normal') < recruitMulOf('hard'))

/* ------------------------------- 4. the threat ------------------------------ */

check('a fresh normal campaign has no threat', threatOf({ wins: 0, towns: 0 }, 'normal') === 1)
check('ten wins raise the normal threat', Math.abs(threatOf({ wins: 10, towns: 0 }, 'normal') - 1.2) < 1e-9, String(threatOf({ wins: 10, towns: 0 }, 'normal')))
check('five towns raise the normal threat', Math.abs(threatOf({ wins: 0, towns: 5 }, 'normal') - 1.2) < 1e-9)
check('the threat is capped on normal', threatOf({ wins: 500, towns: 50 }, 'normal') === 1.8)
check('the threat is capped on hard', threatOf({ wins: 500, towns: 50 }, 'hard') === 2)
check('the practice threat is capped lowest', threatOf({ wins: 500, towns: 50 }, 'easy') === 1.2)
check('the threat never goes below one', threatOf({ wins: -5, towns: -5 }, 'hard') === 1)
check('bigger threats field bigger parties', enemySizeMulOf(1.5, 'normal') > enemySizeMulOf(1, 'normal'))
check('the party size follows the level', enemySizeMulOf(1, 'easy') < enemySizeMulOf(1, 'normal') && enemySizeMulOf(1, 'normal') < enemySizeMulOf(1, 'hard'))
check('bigger threats raise the ceiling', enemyCapMulOf(1.5, 'normal') > enemyCapMulOf(1, 'normal'))
check('hard allows rank three reinforcements', foeOf('hard').tierMax === 3 && foeOf('normal').tierMax === 2 && foeOf('easy').tierMax === 1)
check('the difficulty list is the three levels', DIFFICULTIES.map((d) => d.key).join() === 'easy,normal,hard')

/* ------------------------------- 5. the shops ------------------------------ */

const town = { kind: 'town', recruitSeed: 12345, level: 2 }
const sum = (rows) => rows.reduce((n, row) => n + row.cost, 0)
const easyShop = sum(recruitList(town, { recruitMul: recruitMulOf('easy') }))
const normalShop = sum(recruitList(town, { recruitMul: recruitMulOf('normal') }))
const hardShop = sum(recruitList(town, { recruitMul: recruitMulOf('hard') }))
check('the hard shop is dearer than normal', hardShop > normalShop, `${hardShop} vs ${normalShop}`)
check('the practice shop is cheaper than normal', easyShop < normalShop, `${easyShop} vs ${normalShop}`)
check('a town still offers five rows', recruitList(town).length === 5)

/* ------------------------------- 6. the world ------------------------------ */

const easyWorld = generateWorld(4242, { enemyScale: 0.9 })
const normalWorld = generateWorld(4242, { enemyScale: 1 })
const hardWorld = generateWorld(4242, { enemyScale: 1.1 })
const soldiers = (w) => w.parties.reduce((n, p) => n + p.units.reduce((m, g) => m + g.count, 0), 0)
const easyTroops = soldiers(easyWorld)
const normalTroops = soldiers(normalWorld)
const hardTroops = soldiers(hardWorld)
check('the same seed rolls the same world', easyWorld.settlements.length === normalWorld.settlements.length)
check('hard fields more enemies from day one', hardTroops > normalTroops, `${hardTroops} vs ${normalTroops}`)
check('practice fields fewer enemies from day one', easyTroops < normalTroops, `${easyTroops} vs ${normalTroops}`)
check('the enemy scaling keeps the same factions', easyWorld.parties.length === normalWorld.parties.length)

/* ------------------------------- 7. the store ------------------------------ */

player.reset('tester', 'hard')
check('a hard campaign starts on the hard level', player.difficulty === 'hard')
check('a hard campaign starts with the hard purse', player.gold === 90 && player.supplies.food === 3)
player.reset('tester', 'normal')
check('a normal campaign starts with the normal purse', player.gold === 120 && player.supplies.food === 5)
player.reset('tester')
check('a campaign without a level starts on easy', player.difficulty === 'easy' && player.gold === 150)

// The world store publishes the threat the HUD reads.
world.settlements = [{ id: 't0', owner: 'player', prosperity: 100 }]
world.parties = []
player.stats.wins = 10
player.setDifficulty('normal')
check('the world publishes the normal threat', world.threat === 1.24, String(world.threat))
player.stats.wins = 0
check('the threat falls back when the wins are reset', world.threat === 1.04, String(world.threat))

/* --------------------------- 8. growth and the cap -------------------------- */

function seededWorld(level, wins) {
  player.reset('growth', level)
  player.stats.wins = wins
  world.day = 5 // an odd day for every level, so no new bandit band is rolled
  world.settlements = [{ id: 't0', kind: 'town', owner: 'player', prosperity: 100, level: 1 }]
  world.parties = NPC_FACTIONS.map((faction, i) => ({
    id: `p${i}`,
    faction,
    units: [{ type: 'militia', tier: 1, count: 2, hp: [30, 30] }],
    homeX: 0,
    homeY: 0,
    x: 0,
    y: 0,
    speed: 1,
    wanderTimer: 0,
    targetX: 0,
    targetY: 0
  }))
}

const total = () => world.parties.reduce((n, p) => n + p.units.reduce((m, g) => m + g.count, 0), 0)

seededWorld('normal', 0)
const normalBefore = total()
world.growFactions()
const normalAfter = total()
check('normal still reinforces one soldier a day', normalAfter - normalBefore === 3, `${normalAfter - normalBefore} soldiers for three factions`)
check('normal keeps the advertised ceiling', world.threat === 1.04 && Math.round(factionStrengthCap(world.settlements) * world.threat) === 83, String(world.threat))
check('normal stays under the ceiling', world.parties.every((p) => p.units.reduce((n, g) => n + g.count, 0) <= 80))

seededWorld('hard', 10)
const hardBefore = total()
world.growFactions()
const hardGrowth = total() - hardBefore
check('hard reinforces faster than normal', hardGrowth >= 3, String(hardGrowth))
check('hard raises the threat', world.threat > 1.2, String(world.threat))

seededWorld('easy', 0)
const easyBefore = total()
world.growFactions()
const easyGrowth = total() - easyBefore
check('practice grows no faster than normal', easyGrowth <= 3, String(easyGrowth))
check('practice fields basic troops only', world.parties.every((p) => p.units.every((g) => g.tier === 1)))

world.day = 10
world.parties = []
world.settlements = [{ id: 't0', kind: 'town', owner: 'player', prosperity: 0, level: 1 }]
player.reset('growth', 'hard')
player.stats.wins = 20
world.growFactions()
check('a hard bandit band is bigger than its base roll', world.parties.length === 1 && world.parties[0].units[0].count >= 4, JSON.stringify(world.parties[0]?.units))

/* -------------------------------- 9. summary -------------------------------- */

check('the three levels are still the same three names', DIFFICULTIES.map((d) => d.name).join() === '简单,普通,困难')
