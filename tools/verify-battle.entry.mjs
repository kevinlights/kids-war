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
  OPENING,
  applyDamage,
  createBattle,
  damageOf,
  formationSlots,
  SPEEDS,
  stepBattle,
  speedOf
} from '@/game/battle'
import { ARENA_CELL, ARENA_TERRAIN, ARENA_TERRAIN_KEYS, arenaCellTerrain, arenaTerrainAt, arenaWalkable, generateArenaTerrain } from '@/game/arena'
import { arenaLineClear, findArenaPath, retreatDirection, smoothArenaPath } from '@/game/arenaPath'
import {
  DEATH_TIME,
  SWING_TIME,
  breathOf,
  deathPose,
  dustOf,
  hopOf,
  hurtShake,
  swingLunge,
  walkTilt,
  woundedTilt
} from '@/game/battleAnim'
import { rewardFor } from '@/game/quiz'
import {
  DEFAULT_DIFFICULTY,
  difficultyKey,
  difficultyOf,
  enemyCapMulOf,
  enemySizeMulOf,
  foodPerBattleOf,
  paperCapOf,
  recruitMulOf,
  startOf,
  threatOf
} from '@/game/difficulty'
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
// The easy level is the practice level: every correct answer pays five gold.
check('the easy level pays five gold', rewardFor(g3, 'easy') === 5, String(rewardFor(g3, 'easy')))
check('the easy level pays five gold for grade 4 too', rewardFor(g4, 'easy') === 5)
check('the easy level pays five gold for every subject', rewardFor(logic, 'easy') === 5)
check('grade 3 pays 19 gold on normal', rewardFor(g3, 'normal') === 19, String(rewardFor(g3, 'normal')))
check('grade 3 pays 14 gold on hard', rewardFor(g3, 'hard') === 14, String(rewardFor(g3, 'hard')))
check('grade 4 pays 25 gold on normal', rewardFor(g4, 'normal') === 25)
check('grade 4 pays 19 gold on hard', rewardFor(g4, 'hard') === 19)
check('the subject bonus is kept', rewardFor(logic, 'normal') === 25 && rewardFor(logic, 'hard') === 19)
check('a reward is never below one gold', rewardFor({ grade: 4, type: 'logic' }, 'hard') >= 1)

// The difficulty also touches the start, the costs and the enemy.
check('the practice level starts rich', startOf('easy').gold === 150 && startOf('easy').food === 8)
check('the normal level keeps the old start', startOf('normal').gold === 120 && startOf('normal').food === 5)
check('the hard level starts poor', startOf('hard').gold === 90 && startOf('hard').food === 3)
check('the hard level eats more food', foodPerBattleOf('easy') === 2 && foodPerBattleOf('normal') === 3 && foodPerBattleOf('hard') === 4)
check('the hard level charges more for recruits', recruitMulOf('easy') === 0.9 && recruitMulOf('normal') === 1 && recruitMulOf('hard') === 1.15)
check('the practice paper is capped', paperCapOf('easy') === 2 && paperCapOf('normal') === 0 && paperCapOf('hard') === 0)

// The campaign threat follows the wins and the towns, and never falls.
check('a fresh campaign has no threat', threatOf({ wins: 0, towns: 0 }, 'normal') === 1)
check('wins raise the threat', threatOf({ wins: 10, towns: 0 }, 'normal') > 1)
check('towns raise the threat too', threatOf({ wins: 0, towns: 5 }, 'normal') > 1)
check('the threat is capped', threatOf({ wins: 999, towns: 99 }, 'hard') === 2)
check('the practice level escalates the least', threatOf({ wins: 999, towns: 99 }, 'easy') === 1.2)
check('a bigger threat fields bigger parties', enemySizeMulOf(1.5, 'normal') > enemySizeMulOf(1, 'normal'))
check('a hard threat raises the enemy ceiling', enemyCapMulOf(1.5, 'hard') > enemyCapMulOf(1, 'hard'))

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
  // The map opens on a standoff, so the lord gives his attack order first.
  for (const key of b.playerGroups) b.groups[key].order = 'attack'
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

/* -------------------------- 2b. the opening standoff ----------------------- */

/**
 * Step a battle in small, fixed slices, the way the browser does every frame.
 * The standoff is measured in game seconds, so the tests move the clock too.
 */
function advance(b, seconds) {
  const steps = Math.ceil(seconds * 60)
  for (let i = 0; i < steps; i += 1) stepBattle(b, 1 / 60)
  return b
}

/** Distance between the two armies' centres, in arena pixels. */
function armyGap(b) {
  const centre = (side) => {
    const list = b.units.filter((u) => u.alive && u.side === side)
    if (!list.length) return { x: 0, y: 0 }
    return list.reduce((a, u) => ({ x: a.x + u.x / list.length, y: a.y + u.y / list.length }), { x: 0, y: 0 })
  }
  const mine = centre('player')
  const foe = centre('enemy')
  return Math.hypot(mine.x - foe.x, mine.y - foe.y)
}

function standoffBattle() {
  return createBattle({
    playerTroops: [{ type: 'spearman', tier: 2, count: 4, hp: [] }],
    enemyTroops: [{ type: 'militia', tier: 1, count: 4, hp: [] }],
    enemyFaction: 'bandit',
    seed: 71
  })
}

const enemiesOf = (b) => Object.values(b.groups).filter((g) => g.side === 'enemy' && !g.isDummy)

const hold = standoffBattle()
check('the lord opens on the defensive order', hold.groups[hold.playerGroups[0]].order === 'defend')
check('so does the enemy', enemiesOf(hold).every((g) => g.order === 'defend'))
check('the standoff starts in the wait phase', !!hold.opening && hold.opening.phase === 'wait')
check('the wait is a few seconds long', OPENING.wait >= 3 && OPENING.wait <= 8, String(OPENING.wait))

const gapOpen = armyGap(hold)
advance(hold, 1)
const gapHeld = armyGap(hold)
check('both armies hold when the map opens', Math.abs(gapHeld - gapOpen) < 12, `${gapOpen.toFixed(1)} -> ${gapHeld.toFixed(1)}`)
check('the enemy still waits after a moment', hold.opening.phase === 'wait' && enemiesOf(hold).every((g) => g.order === 'defend'))

advance(hold, OPENING.wait - 1 + 0.1)
check('the enemy dresses its ranks after the wait', hold.opening.phase === 'dress')
check('the dressing changes the formation', enemiesOf(hold).every((g) => g.formation === 'wedge' || g.formation === 'line1'))
check('the enemy still holds while it dresses', enemiesOf(hold).every((g) => g.order === 'defend'))

advance(hold, OPENING.dress + 0.1)
check('the enemy attacks once it is dressed', hold.opening.phase === 'advance' && enemiesOf(hold).every((g) => g.order === 'attack'))
const gapCharge = armyGap(hold)
advance(hold, 3)
check('the enemy really closes in', armyGap(hold) < gapCharge - 40, `${gapCharge.toFixed(1)} -> ${armyGap(hold).toFixed(1)}`)
check('the lord is still standing where he was', hold.groups[hold.playerGroups[0]].order === 'defend')

// The lord's own attack order ends the wait at once.
const rushed = standoffBattle()
battle.data = rushed
battle.active = true
battle.setOrder('attack', rushed.playerGroups[0])
check('ordering an attack ends the wait', rushed.groups[rushed.playerGroups[0]].order === 'attack' && rushed.opening.phase === 'dress')
advance(rushed, OPENING.react + 0.1)
check('the enemy answers a first attack quickly', rushed.opening.phase === 'advance' && enemiesOf(rushed).every((g) => g.order === 'attack'))
battle.data = null
battle.active = false

// A blow that lands before the wait is over does the same.
const struck = standoffBattle()
const hero = struck.units.find((u) => u.side === 'player')
const victim = struck.units.find((u) => u.side === 'enemy')
applyDamage(struck, victim, 3, hero)
check('a first blow also ends the wait', struck.opening.phase === 'dress')

// The 「全军出击」 button orders every squad at once.
const all = standoffBattle()
battle.data = all
battle.active = true
battle.selectedGroup = null
battle.allAttack()
check('the charge button orders every squad', all.playerGroups.every((k) => all.groups[k].order === 'attack'))
check('the charge button ends the standoff', all.opening.phase !== 'wait')
battle.data = null
battle.active = false
battle.selectedGroup = null

// A drill is not a battle: it has no standoff and keeps its free attack.
const drill = createBattle({
  playerTroops: [{ type: 'militia', tier: 1, count: 2, hp: [] }],
  enemyTroops: [],
  seed: 5,
  training: true
})
check('a drill has no standoff', drill.opening === null)
check('a drill keeps its free attack', drill.groups[drill.playerGroups[0]].order === 'attack')

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
check(
  'the field covers about twice the old ground',
  ARENA.w * ARENA.h >= 1.9 * 1000 * 680 && ARENA.w * ARENA.h <= 2.1 * 1000 * 680,
  `${ARENA.w}x${ARENA.h}`
)

/* --------------------- 3b. a new field for every battle --------------------- */

// Every battle is fought on its own field: the layout is drawn from the battle
// seed, and the real battles use a fresh seed each time.
function layoutOf(seed) {
  const t = generateArenaTerrain(seed)
  let out = ''
  for (let r = 0; r < t.rows; r += 1) {
    for (let c = 0; c < t.cols; c += 1) out += arenaCellTerrain(t, c, r).key[0]
  }
  return out
}
const layouts = new Set()
for (let seed = 1; seed <= 12; seed += 1) layouts.add(layoutOf(seed * 7919))
check('every battle gets its own field', layouts.size === 12, `${layouts.size}/12 distinct`)
check('the same seed rebuilds the same field', layoutOf(7919) === layoutOf(7919))
check('every layout holds all five kinds of ground', [...layouts].every((l) => new Set(l).size === 6), `${[...layouts].map((l) => new Set(l).size).join(',')}`)

// The lake is always placed inside the field and clear of the two deployment
// bands, so it can never cut the field in two or swallow a starting army.
let lakeOnEdge = 0
let lakeInDeploy = 0
for (let seed = 1; seed <= 20; seed += 1) {
  const t = generateArenaTerrain(seed * 104729)
  for (let r = 0; r < t.rows; r += 1) {
    for (let c = 0; c < t.cols; c += 1) {
      if (arenaCellTerrain(t, c, r).key !== 'lake') continue
      if (r === 0 || c === 0 || r === t.rows - 1 || c === t.cols - 1) lakeOnEdge += 1
      if (c <= Math.floor(t.cols * 0.28) || c >= Math.floor(t.cols * 0.72)) lakeInDeploy += 1
    }
  }
}
check('no lake reaches the edge of the field', lakeOnEdge === 0, String(lakeOnEdge))
check('no lake swallows a deployment band', lakeInDeploy === 0, String(lakeInDeploy))

// A preset still guarantees the ground it promises, whatever the seed says.
const presetGround = { plain: null, forest: 'forest', mountain: 'mountain', river: 'river', lake: 'lake' }
for (const [key, kind] of Object.entries(presetGround)) {
  const t = generateArenaTerrain(20261023, 25, 17, key)
  const present = new Set()
  for (let r = 0; r < t.rows; r += 1) {
    for (let c = 0; c < t.cols; c += 1) present.add(arenaCellTerrain(t, c, r).key)
  }
  check(
    `the ${key} preset keeps its ground`,
    kind ? present.has(kind) : present.size === 1 && present.has('plain'),
    [...present].join(',')
  )
}
check('the mixed preset keeps a bit of everything', layoutOf(20261023).length > 0 && new Set(layoutOf(20261023)).size === 6)

// Nobody is dropped into deep water: the deployment bands are cleared.
let wetStart = 0
for (let seed = 1; seed <= 12; seed += 1) {
  const b = createBattle({
    playerTroops: [{ type: 'militia', tier: 1, count: 3, hp: [30, 30, 30] }],
    enemyTroops: [{ type: 'militia', tier: 1, count: 3, hp: [30, 30, 30] }],
    enemyFaction: 'bandit',
    seed: seed * 7919
  })
  for (const u of b.units) if (u.alive && !arenaWalkable(b.terrain, u.x, u.y)) wetStart += 1
  if (!arenaWalkable(b.terrain, b.commander.x, b.commander.y)) wetStart += 1
}
check('no soldier starts in deep water', wetStart === 0, String(wetStart))

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
  // Walking is measured under an attack order, so the soldier heads for the
  // enemy instead of walking back to its own anchor.
  b.groups[unit.group].order = 'attack'
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

  // A straight line across the water is blocked, and A* finds a dry route
  // around it. The route is made of walkable waypoints, and smoothing keeps
  // the corners off the grid without cutting through the lake.
  let crossing = null
  for (let d = 2; d <= 6 && !crossing; d += 1) {
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 0], [0, -1]]) {
      const start = {
        x: lx + dx * lakeTest.terrain.cell * d,
        y: ly + dy * lakeTest.terrain.cell * d
      }
      const goal = {
        x: lx - dx * lakeTest.terrain.cell * d,
        y: ly - dy * lakeTest.terrain.cell * d
      }
      const inField = (p) => p.x > 16 && p.y > 16 && p.x < ARENA.w - 16 && p.y < ARENA.h - 16
      if (!inField(start) || !inField(goal)) continue
      if (!arenaWalkable(lakeTest.terrain, start.x, start.y)) continue
      if (!arenaWalkable(lakeTest.terrain, goal.x, goal.y)) continue
      if (arenaLineClear(lakeTest.terrain, start.x, start.y, goal.x, goal.y, 6)) continue
      crossing = { start, goal }
      break
    }
  }
  check('the lake blocks a straight line', !!crossing)
  if (crossing) {
    const route = findArenaPath(lakeTest.terrain, crossing.start, crossing.goal)
    check('a path is found around the lake', route.length > 0, `${route.length} waypoints`)
    check(
      'the path stays on dry land',
      route.every((p) => arenaWalkable(lakeTest.terrain, p.x, p.y))
    )
    const last = route[route.length - 1]
    check(
      'the path ends near the goal',
      !!last && Math.hypot(last.x - crossing.goal.x, last.y - crossing.goal.y) < lakeTest.terrain.cell,
      last ? `${Math.hypot(last.x - crossing.goal.x, last.y - crossing.goal.y).toFixed(1)} px` : 'no end'
    )
    const smoothed = smoothArenaPath(lakeTest.terrain, route, crossing.start)
    check('smoothing keeps the route on dry land', smoothed.every((p) => arenaWalkable(lakeTest.terrain, p.x, p.y)))
    check('smoothing keeps the last waypoint', smoothed.length > 0 &&
      Math.hypot(smoothed[smoothed.length - 1].x - last.x, smoothed[smoothed.length - 1].y - last.y) < 1,
      `${smoothed.length} of ${route.length}`)
  }

  // Falling back away from a threat must not back into the lake.
  const shore = { x: lx - lakeTest.terrain.cell, y: ly }
  const away = retreatDirection(lakeTest.terrain, shore.x, shore.y, -1, 0, 80)
  const retreatX = shore.x + away.x * 60
  const retreatY = shore.y + away.y * 60
  check('a retreat direction has unit length', Math.abs(Math.hypot(away.x, away.y) - 1) < 0.001)
  check('a retreat avoids the lake', arenaWalkable(lakeTest.terrain, retreatX, retreatY), `${retreatX.toFixed(0)},${retreatY.toFixed(0)}`)
}

/* ------------------- 3c. a cornered skirmisher slips out ------------------- */

// A ranged squad told to attack keeps its distance, but a squad that only
// walks straight away from the enemy backs itself into the corner and stands
// there trading shots. The retreat has to use the room it has: along the wall,
// or round the enemy's flank, when the corner is behind it.
const flatField = generateArenaTerrain(
  5,
  Math.round(ARENA.w / ARENA_CELL),
  Math.round(ARENA.h / ARENA_CELL),
  'plain'
)
const cornerFoe = { x: ARENA.w - 122, y: ARENA.h - 122 }
const cornerSpot = { x: ARENA.w - 49, y: ARENA.h - 49 }
const cornerAway = { x: cornerSpot.x - cornerFoe.x, y: cornerSpot.y - cornerFoe.y }
const cornerAwayLen = Math.hypot(cornerAway.x, cornerAway.y)
const cornerOut = retreatDirection(
  flatField,
  cornerSpot.x,
  cornerSpot.y,
  cornerAway.x,
  cornerAway.y,
  110,
  cornerFoe
)
const cornerEnd = { x: cornerSpot.x + cornerOut.x * 110, y: cornerSpot.y + cornerOut.y * 110 }
check(
  'a cornered squad keeps its retreat inside the field',
  cornerEnd.x > 20 && cornerEnd.y > 20 && cornerEnd.x < ARENA.w - 20 && cornerEnd.y < ARENA.h - 20,
  `${cornerEnd.x.toFixed(0)},${cornerEnd.y.toFixed(0)}`
)
check(
  'a cornered squad does not back into the wall',
  (cornerOut.x * cornerAway.x + cornerOut.y * cornerAway.y) / cornerAwayLen < 0.5,
  `${((cornerOut.x * cornerAway.x + cornerOut.y * cornerAway.y) / cornerAwayLen).toFixed(2)}`
)
check(
  'a cornered squad does not run through the foe',
  Math.hypot(cornerEnd.x - cornerFoe.x, cornerEnd.y - cornerFoe.y) > 40,
  `${Math.hypot(cornerEnd.x - cornerFoe.x, cornerEnd.y - cornerFoe.y).toFixed(0)} px from the foe`
)
const cornerNext = retreatDirection(
  flatField,
  cornerSpot.x,
  cornerSpot.y,
  cornerAway.x,
  cornerAway.y,
  110,
  cornerFoe,
  cornerOut
)
check(
  'a cornered squad does not dither between two walls',
  cornerNext.x * cornerOut.x + cornerNext.y * cornerOut.y > 0.8,
  `${(cornerNext.x * cornerOut.x + cornerNext.y * cornerOut.y).toFixed(2)}`
)
const openAway = retreatDirection(flatField, ARENA.w * 0.5, ARENA.h * 0.5, 1, 0, 110)
check(
  'a squad in the open still falls back straight away',
  openAway.x > 0.9 && Math.abs(openAway.y) < 0.2,
  `${openAway.x.toFixed(2)},${openAway.y.toFixed(2)}`
)

// The same trap, walked through: archers pinned in the corner with a warband
// pressing them must work their way out instead of standing against the wall.
const pinned = createBattle({
  playerTroops: [{ type: 'archer', tier: 2, count: 4, hp: [] }],
  enemyTroops: [{ type: 'militia', tier: 1, count: 4, hp: [] }],
  enemyFaction: 'bandit',
  arenaMap: 'plain',
  seed: 1234
})
pinned.opening = null
for (const [i, u] of pinned.units.filter((one) => one.side === 'player').entries()) {
  u.x = ARENA.w - 46 - (i % 2) * 16
  u.y = ARENA.h - 46 - Math.floor(i / 2) * 16
}
for (const [i, u] of pinned.units.filter((one) => one.side === 'enemy').entries()) {
  u.x = ARENA.w - 122 + (i % 2) * 14
  u.y = ARENA.h - 122 - Math.floor(i / 2) * 14
  u.hp = 400
  u.maxHp = 400
}
for (const key of pinned.playerGroups) pinned.groups[key].order = 'attack'
for (const key of Object.keys(pinned.groups).filter((one) => one.startsWith('enemy:'))) {
  pinned.groups[key].order = 'attack'
}
const pinnedCentre = () => {
  const list = pinned.units.filter((one) => one.side === 'player' && one.alive)
  if (!list.length) return null
  return list.reduce((a, one) => ({ x: a.x + one.x / list.length, y: a.y + one.y / list.length }), { x: 0, y: 0 })
}
const pinStart = pinnedCentre()
const pinGap = (point) => Math.hypot(ARENA.w - 16 - point.x, ARENA.h - 16 - point.y)
advance(pinned, 2.5)
const pinEnd = pinnedCentre()
check(
  'a cornered squad works its way out of the corner',
  !!pinEnd && pinGap(pinEnd) > pinGap(pinStart) + 60,
  pinEnd ? `${pinGap(pinStart).toFixed(0)} -> ${pinGap(pinEnd).toFixed(0)} px` : 'all down'
)

/* --------------------- 3d. the charge and the volley --------------------- */

/**
 * One melee soldier chasing one archer across open ground. The two are placed
 * far apart on the same line, so the distance, the sprint and the fatigue can
 * be measured without terrain in the way.
 */
function chaseBattle(seed = 909) {
  const b = createBattle({
    playerTroops: [{ type: 'spearman', tier: 2, count: 1, hp: [] }],
    enemyTroops: [{ type: 'archer', tier: 2, count: 1, hp: [] }],
    enemyFaction: 'bandit',
    seed,
    arenaMap: 'plain'
  })
  b.opening = null
  const mine = b.units.find((u) => u.side === 'player')
  const foe = b.units.find((u) => u.side === 'enemy')
  mine.x = 200
  mine.y = ARENA.h / 2
  foe.x = ARENA.w - 200
  foe.y = ARENA.h / 2
  const g = b.groups[b.playerGroups[0]]
  g.order = 'attack'
  g.rally = { x: mine.x, y: mine.y }
  const h = Object.values(b.groups).find((one) => one.side === 'enemy')
  h.order = 'defend'
  h.rally = { x: foe.x, y: foe.y }
  h.anchor = { x: foe.x, y: foe.y }
  return { b, mine, foe, g, h }
}

const sprintRun = chaseBattle()
check(
  'the terrain grid follows the field',
  sprintRun.b.terrain.cols === Math.round(ARENA.w / ARENA_CELL) &&
    sprintRun.b.terrain.rows === Math.round(ARENA.h / ARENA_CELL),
  `${sprintRun.b.terrain.cols}x${sprintRun.b.terrain.rows}`
)
const sprintStart = sprintRun.mine.x
advance(sprintRun.b, 1)
const sprintMoved = sprintRun.mine.x - sprintStart
check('a far melee soldier sprints', sprintRun.mine.sprinting === true)
check('the sprint covers more than a walk', sprintMoved > 100, `${sprintMoved.toFixed(1)} px in 1 s`)
check('the sprint burns stamina', sprintRun.mine.stamina < 1, sprintRun.mine.stamina.toFixed(2))
check('the sprint is stopped at once by a hold order', (() => {
  const held = chaseBattle(910)
  held.g.order = 'defend'
  advance(held.b, 1)
  return held.mine.sprinting === false
})())
let sprintGuard = 0
while (sprintRun.mine.tired <= 0 && sprintGuard < 300) {
  advance(sprintRun.b, 0.1)
  sprintGuard += 1
}
check('the sprint is spent after a few seconds', sprintRun.mine.stamina <= 0.001, sprintRun.mine.stamina.toFixed(2))
check('a spent sprint leaves the soldier tired', sprintRun.mine.tired > 0, sprintRun.mine.tired.toFixed(1))
check('a tired soldier is out of the sprint', sprintRun.mine.sprinting === false)

/**
 * An archer told to walk while slowed by its last volley covers less ground
 * than the same archer with a clear head. `volleyT` is set directly, so the
 * check measures the slowdown itself and not the aiming code.
 */
function walkOf(slowed) {
  const b = createBattle({
    playerTroops: [{ type: 'archer', tier: 2, count: 1, hp: [] }],
    enemyTroops: [{ type: 'militia', tier: 1, count: 1, hp: [] }],
    enemyFaction: 'bandit',
    seed: 921,
    arenaMap: 'plain'
  })
  b.opening = null
  const archer = b.units.find((u) => u.side === 'player')
  const foe = b.units.find((u) => u.side === 'enemy')
  foe.x = 60
  foe.y = 60
  archer.x = ARENA.w / 2
  archer.y = ARENA.h / 2
  const g = b.groups[b.playerGroups[0]]
  g.order = 'move'
  g.rally = { x: archer.x + 400, y: archer.y }
  const h = Object.values(b.groups).find((one) => one.side === 'enemy')
  h.order = 'defend'
  h.rally = { x: foe.x, y: foe.y }
  h.anchor = { x: foe.x, y: foe.y }
  if (slowed) archer.volleyT = 10
  const start = archer.x
  advance(b, 1)
  return archer.x - start
}
const walkFast = walkOf(false)
const walkSlow = walkOf(true)
check('an archer slowed by a volley walks less', walkSlow < walkFast * 0.8, `${walkSlow.toFixed(1)} vs ${walkFast.toFixed(1)} px`)
check('the slow is a short one, not a stop', walkSlow > walkFast * 0.5, `${walkSlow.toFixed(1)} px`)

// A volley sets the slow clock.
const volleyRun = chaseBattle(922)
volleyRun.foe.x = volleyRun.mine.x + 110
volleyRun.h.rally = { x: volleyRun.foe.x, y: volleyRun.foe.y }
volleyRun.h.anchor = { x: volleyRun.foe.x, y: volleyRun.foe.y }
volleyRun.foe.cd = 0
advance(volleyRun.b, 0.05)
check('a volley slows the archer', volleyRun.foe.volleyT > 0, volleyRun.foe.volleyT.toFixed(2))

// A foe right on top of the archer cannot be shot: the bow needs room.
volleyRun.b.projectiles = []
volleyRun.foe.cd = 0
volleyRun.foe.volleyT = 0
volleyRun.foe.x = volleyRun.mine.x + 20
advance(volleyRun.b, 0.05)
check('a foe in the archer face cannot be shot', volleyRun.b.projectiles.length === 0 && volleyRun.foe.volleyT === 0)

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
  near.x = 570
  near.y = 340
  far.x = 440
  far.y = 340
  // The armies hold in place, so every squad is pinned where the test puts it.
  for (const g of Object.values(b.groups)) {
    const unit = b.units.find((u) => u.alive && u.group === g.key)
    if (!unit) continue
    g.anchor = { x: unit.x, y: unit.y }
    g.rally = { x: unit.x, y: unit.y }
    g.order = 'defend'
  }
  // The far archer shoots the hero.
  far.cd = 0
  // One second is enough: the arrow lands at once, and the hero turns before
  // the enemy's own charge (which a first blow starts) can reach him.
  for (let i = 0; i < 60; i += 1) stepBattle(b, 1 / 60)
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
  // Let the lord charge and the two sides close and fight.
  for (const key of b.playerGroups) b.groups[key].order = 'attack'
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
  // A scattered squad has no block to keep: it fights as soon as it is ordered.
  group.order = 'attack'
  let t = 0
  while (!b.outcome && t < 120) {
    stepBattle(b, 0.1)
    t += 0.1
  }
  check('the scattered squad attacks the enemy', b.kills > 0, `${b.kills} kills`)
  check('the scattered fight ends', !!b.outcome, String(b.outcome))
  check('the scattered fight does not stall', t < 60, `${t.toFixed(1)}s`)
}

/* --------------------------- 4c. battle animation --------------------------- */

// Animation is render-only, but its maths is still checked: a walking soldier
// hops, a standing one breathes, a hit shakes, a swing leans and a body falls
// and fades.
check('a standing soldier does not hop', hopOf(0, Math.PI / 2) === 0)
check('a walking soldier leaves the ground', hopOf(80, Math.PI / 2) > 0, String(hopOf(80, Math.PI / 2)))
check('a standing soldier breathes', Math.abs(breathOf(0, 1)) > 0)
check('a walking soldier does not breathe', breathOf(100, 1) === 0)
check('a walking soldier leans a little', Math.abs(walkTilt(80, 1)) > 0)
check('a soldier at full health stands straight', woundedTilt(1, 1, 0) === 0)
check('a badly wounded soldier lists', Math.abs(woundedTilt(0.05, 1, 0)) > 0)
check('a fresh hit shakes the soldier', hurtShake(0.18, 0.02, 0) > 0, String(hurtShake(0.18, 0.02, 0)))
check('a faded hit does not shake', hurtShake(0, 1, 0) === 0)
check('a swing starts and ends at rest', swingLunge(0) === 0 && swingLunge(SWING_TIME) === 0)
check('the middle of a swing leans the hardest', swingLunge(SWING_TIME / 2) > 3, String(swingLunge(SWING_TIME / 2)))
check('a standing soldier kicks no dust', dustOf(0, Math.PI / 4) === 0)
check('a walking soldier kicks dust', dustOf(100, Math.PI / 4) > 0)
{
  const start = deathPose(0)
  const middle = deathPose(DEATH_TIME / 2)
  const end = deathPose(DEATH_TIME)
  check('a fresh body stands upright', start.progress === 0 && start.rotation === 0 && start.alpha === 1)
  check('a falling body tips over', middle.rotation > start.rotation && middle.drop > start.drop)
  check('a falling body fades', end.alpha < start.alpha, `${start.alpha} -> ${end.alpha}`)
  check('the body is gone at the end', end.progress === 1)
}
{
  const b = createBattle({
    playerTroops: [{ type: 'militia', tier: 1, count: 2, hp: [] }],
    enemyTroops: [{ type: 'militia', tier: 1, count: 2, hp: [] }],
    enemyFaction: 'bandit',
    seed: 404
  })
  check('soldiers carry a swing timer', b.units.every((u) => u.swing === 0))
  check('the commander carries the visual fields', b.commander.hitFlash === 0 && b.commander.swing === 0)

  // The swing timer really fires when a blow lands: the lord charges, so the
  // two lines meet inside the watched window.
  for (const key of b.playerGroups) b.groups[key].order = 'attack'
  let sawSwing = false
  let sawFlash = false
  for (let i = 0; i < 60 * 12 && !b.outcome; i += 1) {
    stepBattle(b, 1 / 60)
    if (b.units.some((u) => u.swing > 0)) sawSwing = true
    if (b.units.some((u) => u.hitFlash > 0)) sawFlash = true
  }
  check('a strike sets the swing timer', sawSwing)
  check('a wound sets the hit flash', sawFlash)
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
