/**
 * Headless checks for the difficulty setting, the battle speed control, the
 * battlefield terrain and the siege fixes.
 *
 * These run against the real stores, so a broken rule shows up here before it
 * ever reaches a browser.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { useBattleStore } from '@/stores/battle'
import {
  ARENA,
  applyDamage,
  createBattle,
  damageOf,
  formationSlots,
  SPEEDS,
  stepBattle,
  speedOf
} from '@/game/battle'
import { ARENA_TERRAIN, ARENA_TERRAIN_KEYS, arenaCellTerrain, arenaTerrainAt, arenaWalkable, generateArenaTerrain } from '@/game/arena'
import { rewardFor } from '@/game/quiz'
import { DEFAULT_DIFFICULTY, difficultyKey, difficultyOf } from '@/game/difficulty'
import { KINGDOMS, PLAYER, SIEGE_PREPARE_DAYS } from '@/game/settlement'

const check = (name, condition, detail = '') => globalThis.__reporter.check(name, condition, detail)

setActivePinia(createPinia())
const world = useWorldStore()
const player = usePlayerStore()
const battle = useBattleStore()

/* ------------------------------- 1. difficulty ------------------------------- */

check('a new game starts on the easy difficulty', player.difficulty === DEFAULT_DIFFICULTY)
check('the easy difficulty is the current numbers', difficultyOf('easy').rewardDelta === 0)
check('the normal difficulty takes one gold off', difficultyOf('normal').rewardDelta === -1)
check('the hard difficulty takes two gold off', difficultyOf('hard').rewardDelta === -2)
check('an unknown difficulty falls back to the easy one', difficultyKey('nonsense') === 'easy')

const g3 = { grade: 3, type: 'math' }
const g4 = { grade: 4, type: 'math' }
const logic = { grade: 3, type: 'logic' }
check('grade 3 pays 20 gold on easy', rewardFor(g3, 'easy') === 20, String(rewardFor(g3, 'easy')))
check('grade 3 pays 19 gold on normal', rewardFor(g3, 'normal') === 19, String(rewardFor(g3, 'normal')))
check('grade 3 pays 18 gold on hard', rewardFor(g3, 'hard') === 18, String(rewardFor(g3, 'hard')))
check('grade 4 pays 26 gold on easy', rewardFor(g4, 'easy') === 26)
check('grade 4 pays 25 gold on normal', rewardFor(g4, 'normal') === 25)
check('grade 4 pays 24 gold on hard', rewardFor(g4, 'hard') === 24)
check('the subject bonus is kept', rewardFor(logic, 'easy') === 26 && rewardFor(logic, 'hard') === 24)
check('a reward is never below one gold', rewardFor({ grade: 4, type: 'logic' }, 'hard') >= 1)

// The setting belongs to the lord and survives a reload.
player.setDifficulty('hard')
check('the difficulty can be changed', player.difficulty === 'hard')
player.hydrate({ username: 'tester', difficulty: 'normal', gold: 10, troops: [], supplies: {}, stats: {} })
check('a save keeps the difficulty', player.difficulty === 'normal')
player.hydrate({ username: 'tester', gold: 10, troops: [], supplies: {}, stats: {} })
check('an old save is an easy game', player.difficulty === 'easy')
player.reset('tester')
player.setDifficulty('normal')

/* -------------------------------- 2. speed --------------------------------- */

check('the battle starts slow', battle.speed === 'slow')
check('the slow speed is slower than the normal one', speedOf('slow').mul < speedOf('normal').mul)
check('the fast speed is faster than the normal one', speedOf('fast').mul > speedOf('normal').mul)
check('there are three speeds', SPEEDS.length === 3)

// The speed really changes how fast the armies close in.
function march(speedKey) {
  const b = createBattle({
    playerTroops: [{ type: 'militia', tier: 1, count: 2, hp: [30, 30] }],
    enemyTroops: [{ type: 'militia', tier: 1, count: 2, hp: [30, 30] }],
    enemyFaction: 'bandit',
    seed: 11
  })
  const before = b.units.find((u) => u.side === 'player').x
  battle.data = b
  battle.active = true
  battle.speed = speedKey
  for (let i = 0; i < 60; i += 1) battle.tick(1 / 60)
  const after = b.units.find((u) => u.side === 'player').x
  return after - before
}
const slowMarch = march('slow')
const fastMarch = march('fast')
check('the slow speed advances less', slowMarch < fastMarch, `${slowMarch.toFixed(1)} vs ${fastMarch.toFixed(1)}`)
check('the slow speed still moves the army', slowMarch > 0, String(slowMarch))
battle.speed = 'slow'

/* ------------------------------- 3. terrain -------------------------------- */

const field = generateArenaTerrain(99)
const kinds = new Set()
for (let r = 0; r < field.rows; r += 1) {
  for (let c = 0; c < field.cols; c += 1) kinds.add(arenaCellTerrain(field, c, r).key)
}
for (const key of ['forest', 'desert', 'river', 'lake', 'mountain']) {
  check(`the field has ${ARENA_TERRAIN[key].name}`, kinds.has(key), [...kinds].join(','))
}
check('every cell is a known terrain', [...kinds].every((k) => ARENA_TERRAIN_KEYS.includes(k)))
check('the lake cannot be walked on', ARENA_TERRAIN.lake.walkable === false)
check('the other terrain can be walked on', ['plain', 'forest', 'desert', 'river', 'mountain'].every((k) => ARENA_TERRAIN[k].walkable))
check('the forest gives cover', ARENA_TERRAIN.forest.defMul > 1)
check('the desert tires the troops', ARENA_TERRAIN.desert.atkMul < 1)
check('the river slows the troops down', ARENA_TERRAIN.river.speedMul < 1)
check('the mountain gives the high ground', ARENA_TERRAIN.mountain.atkMul > 1)
check('the field is bigger than the old arena', ARENA.w > 900 && ARENA.h > 560, `${ARENA.w}x${ARENA.h}`)

// A soldier in the forest is slower than one on the plain.
function walkOn(key) {
  const b = createBattle({
    playerTroops: [{ type: 'militia', tier: 1, count: 1, hp: [30] }],
    enemyTroops: [{ type: 'militia', tier: 1, count: 1, hp: [30] }],
    enemyFaction: 'bandit',
    seed: 21
  })
  // Find a cell of this terrain and drop the player soldier onto it.
  let spot = null
  for (let r = 0; r < b.terrain.rows && !spot; r += 1) {
    for (let c = 0; c < b.terrain.cols; c += 1) {
      if (arenaCellTerrain(b.terrain, c, r).key === key) {
        spot = { x: c * b.terrain.cell + b.terrain.cell / 2, y: r * b.terrain.cell + b.terrain.cell / 2 }
        break
      }
    }
  }
  if (!spot) return null
  const unit = b.units.find((u) => u.side === 'player')
  unit.x = spot.x
  unit.y = spot.y
  // Push the enemy far away so the soldier keeps walking.
  const foe = b.units.find((u) => u.side === 'enemy')
  foe.x = Math.max(20, Math.min(ARENA.w - 20, spot.x + 400))
  foe.y = spot.y
  const before = unit.x
  for (let i = 0; i < 30; i += 1) stepBattle(b, 1 / 60)
  return Math.abs(unit.x - before)
}
const plainWalk = walkOn('plain')
const forestWalk = walkOn('forest')
const riverWalk = walkOn('river')
check('the plain is walkable', plainWalk !== null && plainWalk > 0)
check('the forest slows a soldier down', forestWalk !== null && forestWalk < plainWalk, `${forestWalk} vs ${plainWalk}`)
check('the river slows a soldier down more', riverWalk !== null && riverWalk < plainWalk, `${riverWalk} vs ${plainWalk}`)

// The ground changes the damage as well.
function hitOn(key) {
  const b = createBattle({
    playerTroops: [{ type: 'militia', tier: 1, count: 1, hp: [30] }],
    enemyTroops: [{ type: 'militia', tier: 1, count: 1, hp: [30] }],
    enemyFaction: 'bandit',
    seed: 33
  })
  let spot = null
  for (let r = 0; r < b.terrain.rows && !spot; r += 1) {
    for (let c = 0; c < b.terrain.cols; c += 1) {
      if (arenaCellTerrain(b.terrain, c, r).key === key) {
        spot = { x: c * b.terrain.cell + b.terrain.cell / 2, y: r * b.terrain.cell + b.terrain.cell / 2 }
        break
      }
    }
  }
  if (!spot) return null
  const attacker = b.units.find((u) => u.side === 'player')
  const target = b.units.find((u) => u.side === 'enemy')
  attacker.x = spot.x
  attacker.y = spot.y
  target.x = spot.x
  target.y = spot.y
  // Take the random swing out of the comparison, so only the ground counts.
  b.rng.float = () => 0
  return damageOf(b, attacker, target)
}
const plainHit = hitOn('plain')
const forestHit = hitOn('forest')
check('a forest takes less damage than open ground', plainHit !== null && forestHit !== null && forestHit < plainHit, `${forestHit} vs ${plainHit}`)

// A lake really blocks the movement.
const lakeTest = createBattle({
  playerTroops: [{ type: 'militia', tier: 1, count: 1, hp: [30] }],
  enemyTroops: [{ type: 'militia', tier: 1, count: 1, hp: [30] }],
  enemyFaction: 'bandit',
  seed: 44
})
let lakeCell = null
for (let r = 0; r < lakeTest.terrain.rows && !lakeCell; r += 1) {
  for (let c = 0; c < lakeTest.terrain.cols; c += 1) {
    if (arenaCellTerrain(lakeTest.terrain, c, r).key === 'lake') {
      lakeCell = { c, r }
      break
    }
  }
}
check('the field has a lake', !!lakeCell)
if (lakeCell) {
  const lx = lakeCell.c * lakeTest.terrain.cell + lakeTest.terrain.cell / 2
  const ly = lakeCell.r * lakeTest.terrain.cell + lakeTest.terrain.cell / 2
  check('the middle of the lake is not walkable', !arenaWalkable(lakeTest.terrain, lx, ly))
  check('the shore of the lake is walkable', arenaWalkable(lakeTest.terrain, lx - lakeTest.terrain.cell, ly))
}

/* ---------------------------- 4. no battle can stall ------------------------- */

// Every battle has to end: the terrain must never be able to lock two armies
// on opposite sides of a lake for ever.
let ended = 0
let longest = 0
for (let seed = 1; seed <= 12; seed += 1) {
  const b = createBattle({
    playerTroops: [{ type: 'militia', tier: 1, count: 4, hp: [30, 30, 30, 30] }],
    enemyTroops: [{ type: 'militia', tier: 1, count: 4, hp: [30, 30, 30, 30] }],
    enemyFaction: 'bandit',
    seed: seed * 977
  })
  let t = 0
  while (!b.outcome && t < 120) {
    stepBattle(b, 1 / 30)
    t += 1 / 30
  }
  if (b.outcome) ended += 1
  longest = Math.max(longest, t)
}
check('every battle ends', ended === 12, `${ended}/12`)
check('no battle runs longer than two minutes', longest < 120, longest.toFixed(1))

/* --------------------- 4b. the counterattack and the formation -------------- */

/**
 * A soldier that is attacked answers the attacker.
 *
 * The player soldier stands between two enemies: the near one to its right and
 * the far one to its left. The far one shoots it, and the soldier has to turn
 * to the left and answer it, instead of trading blows with the nearer foe.
 */
{
  const b = createBattle({
    playerTroops: [{ type: 'archer', tier: 2, count: 1, hp: [] }],
    enemyTroops: [
      { type: 'militia', tier: 1, count: 1, hp: [] },
      { type: 'archer', tier: 2, count: 1, hp: [] }
    ],
    enemyFaction: 'bandit',
    seed: 77
  })
  const hero = b.units.find((u) => u.side === 'player')
  const near = b.units.find((u) => u.side === 'enemy' && u.type === 'militia')
  const far = b.units.find((u) => u.side === 'enemy' && u.type === 'archer')
  // The near foe stands to the right, the shooter to the left.
  hero.x = 500
  hero.y = 340
  near.x = 540
  near.y = 340
  far.x = 440
  far.y = 340
  // The far archer shoots the hero.
  far.cd = 0
  for (let i = 0; i < 200; i += 1) stepBattle(b, 1 / 60)
  check('the soldier remembers who hit it', hero.lastAttackerId === far.id, String(hero.lastAttackerId))
  check('the soldier answers the attacker', hero.facing < 0, String(hero.facing))
  check('the hero took the blow', hero.hp < hero.maxHp, `${hero.hp}/${hero.maxHp}`)
}

/**
 * An attack keeps the formation: the soldiers hold their slots around the
 * squad's target instead of mobbing the enemy.
 */
{
  const b = createBattle({
    playerTroops: [{ type: 'spearman', tier: 2, count: 9, hp: [] }],
    enemyTroops: [{ type: 'spearman', tier: 2, count: 9, hp: [] }],
    enemyFaction: 'bandit',
    seed: 88
  })
  // Let the two sides close and fight.
  for (let i = 0; i < 60 * 20; i += 1) stepBattle(b, 1 / 60)
  const group = b.groups[b.playerGroups[0]]
  const living = b.units.filter((u) => u.alive && u.side === 'player')
  // How wide the squad is on the field, against how wide its formation is.
  const xs = living.map((u) => u.x)
  const ys = living.map((u) => u.y)
  const spread = Math.max(...xs) - Math.min(...xs)
  const slotXs = group.slots.map((s) => s.ox)
  const slotYs = group.slots.map((s) => s.oy)
  const wanted = Math.max(Math.max(...slotXs) - Math.min(...slotXs), Math.max(...slotYs) - Math.min(...slotYs))
  check('the formation holds while attacking', spread > wanted * 0.6, `${spread.toFixed(1)} px of ${wanted} px`)
  // The squad is not collapsed on the enemy: the ranks are still spread out.
  check('the ranks keep their distance', spread > 20, `${spread.toFixed(1)} px`)
  // The fight still happens: both sides took losses.
  check('the attack is not harmless', b.kills > 0 && b.losses > 0, `${b.kills} kills / ${b.losses} losses`)
}

/**
 * The formation breathes: the soldiers move inside their slots, so the line
 * is alive instead of standing like a grid.
 */
{
  const b = createBattle({
    playerTroops: [{ type: 'spearman', tier: 2, count: 9, hp: [] }],
    enemyTroops: [{ type: 'spearman', tier: 2, count: 9, hp: [] }],
    enemyFaction: 'bandit',
    seed: 91
  })
  // Let the two sides close and fight.
  for (let i = 0; i < 60 * 12; i += 1) stepBattle(b, 1 / 60)
  const group = b.groups[b.playerGroups[0]]
  // Every soldier keeps a personal space inside its slot.
  let offX = 0
  let offY = 0
  let counted = 0
  for (const u of b.units) {
    if (!u.alive || u.side !== 'player') continue
    const slot = group.slots[u.slotIndex] || { ox: 0, oy: 0 }
    offX += Math.abs(u.x - (group.tx + slot.ox))
    offY += Math.abs(u.y - (group.ty + slot.oy))
    counted += 1
  }
  check('the soldiers are not a rigid grid', offX / counted > 1, `${(offX / counted).toFixed(1)} px`)
  check('the personal space stays small', offX / counted < 22, `${(offX / counted).toFixed(1)} px`)
  // A blow shoves the soldier aside: it dodges instead of standing still.
  const hit = b.units.find((u) => u.alive && u.side === 'player')
  const before = hit.wobble ? Math.hypot(hit.wobble.dx, hit.wobble.dy) : 0
  applyDamage(b, hit, 5, b.units.find((u) => u.side === 'enemy' && u.alive))
  const after = hit.wobble ? Math.hypot(hit.wobble.dx, hit.wobble.dy) : 0
  check('a blow shoves the soldier aside', after > before, `${before.toFixed(1)} -> ${after.toFixed(1)}`)
}

/**
 * The scattered formation attacks too: it has no block to keep, so every
 * soldier closes on the foe itself.
 */
{
  const b = createBattle({
    playerTroops: [{ type: 'spearman', tier: 2, count: 8, hp: [] }],
    enemyTroops: [{ type: 'spearman', tier: 2, count: 8, hp: [] }],
    enemyFaction: 'bandit',
    seed: 5
  })
  const group = b.groups[b.playerGroups[0]]
  group.formation = 'random'
  group.slots = formationSlots(8, 'random', 'tight', group.dir)
  let t = 0
  while (!b.outcome && t < 120) {
    stepBattle(b, 0.1)
    t += 0.1
  }
  check('the scattered squad attacks the enemy', b.kills > 0, `${b.kills} kills`)
  check('the scattered fight ends', !!b.outcome, String(b.outcome))
  check('the scattered fight does not stall', t < 60, `${t.toFixed(1)}s`)
}

/* --------------------------------- 5. siege --------------------------------- */

world.generate(4242)
const hostileTown = world.settlements.find((st) => st.kind === 'town' && KINGDOMS.includes(st.owner))
check('the world has a hostile town', !!hostileTown)

const prepared = world.startSiege(hostileTown.id)
check('a siege can be prepared', prepared.ok, prepared.reason)
check('the siege needs its preparation days', prepared.readyDay === world.day + SIEGE_PREPARE_DAYS)
check('the clock runs while the siege is prepared', world.siegeActive)

// The lord may change his mind: the siege is interrupted.
const cancelled = world.cancelSiege(hostileTown.id)
check('a siege can be interrupted', cancelled.ok)
check('the interrupted siege is gone', !hostileTown.siege)
check('the clock stops after the interruption', !world.siegeActive)
check('the siege can be prepared again', world.startSiege(hostileTown.id).ok)

// A ready siege can be interrupted as well.
world.day = hostileTown.siege.readyDay
world.updateSiege(hostileTown)
check('the siege is ready', hostileTown.siege.ready)
check('a ready siege can be interrupted', world.cancelSiege(hostileTown.id).ok && !hostileTown.siege)

// A failed assault breaks the siege: the preparation starts over.
world.startSiege(hostileTown.id)
world.day = hostileTown.siege.readyDay
world.updateSiege(hostileTown)
battle.startSettlement(hostileTown, 123, 'siege')
battle.data.outcome = 'lose'
battle.settle()
check('a failed assault ends the siege', !hostileTown.siege)
check('the lord has to prepare the siege again', world.startSiege(hostileTown.id).ok)
check('the siege needs its days again', hostileTown.siege.readyDay === world.day + SIEGE_PREPARE_DAYS)

// A won assault takes the town.
world.cancelSiege(hostileTown.id)
world.startSiege(hostileTown.id)
world.day = hostileTown.siege.readyDay
world.updateSiege(hostileTown)
battle.startSettlement(hostileTown, 321, 'siege')
battle.data.outcome = 'win'
battle.settle()
check('a won assault takes the town', hostileTown.owner === PLAYER, hostileTown.owner)
check('a captured town has no siege', !hostileTown.siege)

// The interface really offers the interruption.
const root = globalThis.__kwgRoot || process.cwd()
const worldView = readFileSync(path.join(root, 'src', 'views', 'WorldView.vue'), 'utf8')
check('the world map shows a cancel button', worldView.includes('取消围城'))
check('the world map calls the cancel action', worldView.includes('cancelSiege'))
const battleView = readFileSync(path.join(root, 'src', 'views', 'BattleView.vue'), 'utf8')
check('the battle screen shows the speed control', battleView.includes('SPEEDS') && battleView.includes('setSpeed'))
const battleStore = readFileSync(path.join(root, 'src', 'stores', 'battle.js'), 'utf8')
check('the store defaults to the slow speed', /speed:\s*'slow'/.test(battleStore))
const homeView = readFileSync(path.join(root, 'src', 'views', 'HomeView.vue'), 'utf8')
check('the home screen offers the difficulty', homeView.includes('difficulty'))
