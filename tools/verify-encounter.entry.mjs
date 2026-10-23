/**
 * Headless checks for the meeting with a hostile warband.
 *
 * The rules kept honest here:
 *   - a party that reaches the lord stops the world instead of teleporting
 *     him into the arena,
 *   - every hostile faction has something to say and a portrait to show,
 *   - the enemy roster is readable troop by troop,
 *   - fleeing always moves the lord 3–6 tiles away, onto walkable ground, and
 *     puts the party on cooldown so the meeting does not repeat at once,
 *   - a truly cornered lord is not teleported anywhere.
 */
import { createPinia, setActivePinia } from 'pinia'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { useBattleStore } from '@/stores/battle'
import { NPC_FACTIONS } from '@/game/factions'
import {
  ENCOUNTER_TALK,
  FLEE_COOLDOWN,
  FLEE_MAX_DISTANCE,
  FLEE_MIN_DISTANCE,
  encounterLine,
  enemyRoster,
  fleeCandidates,
  fleeTarget,
  talkOf
} from '@/game/encounter'
import { spriteUrl } from '@/game/pixelAssets'
import { TERRAIN } from '@/game/terrain'
import { createRng } from '@/game/rng'
import { WORLD_H, WORLD_W } from '@/game/worldgen'

const check = (name, condition, detail = '') => globalThis.__reporter.check(name, condition, detail)

setActivePinia(createPinia())
const world = useWorldStore()
const player = usePlayerStore()
const battle = useBattleStore()

/* ------------------------------- 1. the talk ------------------------------- */

check('every hostile faction has a meeting', NPC_FACTIONS.every((key) => !!ENCOUNTER_TALK[key]))
check(
  'every faction names the one who talks',
  NPC_FACTIONS.every((key) => !!talkOf(key).mood),
  NPC_FACTIONS.map((key) => talkOf(key).mood).join(' / ')
)
check(
  'every faction can open the dialog',
  NPC_FACTIONS.every((key) => talkOf(key).greeting.length >= 2),
  NPC_FACTIONS.map((key) => String(talkOf(key).greeting.length)).join('/')
)
check(
  'every faction can answer back',
  NPC_FACTIONS.every((key) => talkOf(key).replies.length >= 2),
  NPC_FACTIONS.map((key) => String(talkOf(key).replies.length)).join('/')
)
check('an unknown faction falls back to the bandits', talkOf('nonsense') === ENCOUNTER_TALK.bandit)
check(
  'every line is short enough for a phone',
  NPC_FACTIONS.every((key) =>
    [...talkOf(key).greeting, ...talkOf(key).replies].every((line) => line.length <= 48)
  ),
  NPC_FACTIONS.map((key) => {
    const talk = talkOf(key)
    return String(Math.max(...[...talk.greeting, ...talk.replies].map((l) => l.length)))
  }).join('/')
)

const firstBandit = encounterLine('bandit', 'greeting', 7)
check('the same seed says the same line', encounterLine('bandit', 'greeting', 7) === firstBandit)
check('a line comes from the faction bank', talkOf('bandit').greeting.includes(firstBandit))
check(
  'different seeds find different lines',
  new Set([1, 2, 3, 4, 5].map((seed) => encounterLine('wolf', 'greeting', seed))).size >= 2
)
check('an unknown kind falls back to the greeting', talkOf('eagle').greeting.includes(encounterLine('eagle', 'nope', 2)))

/* ----------------------------- 2. the portrait ---------------------------- */

check(
  'every faction has a portrait image',
  NPC_FACTIONS.every((key) => !!spriteUrl(key)),
  NPC_FACTIONS.map((key) => String(spriteUrl(key))).join(' ')
)
check(
  'the portraits are the commander sprites',
  NPC_FACTIONS.every((key) => spriteUrl(key).includes('/commander/')),
  String(spriteUrl('bandit'))
)

/* ------------------------------ 3. the roster ----------------------------- */

const party = {
  id: 'foe-1',
  faction: 'wolf',
  x: 20,
  y: 20,
  units: [
    { type: 'militia', tier: 1, count: 3, hp: [30, 30, 30] },
    { type: 'archer', tier: 2, count: 2, hp: [44, 44] }
  ]
}
const roster = enemyRoster(party)
check('the roster counts every enemy', roster.total === 5, String(roster.total))
check('the roster names the soldiers', roster.groups.some((g) => g.name.includes('民兵')) && roster.groups.some((g) => g.name.includes('弓箭手')))
check('the roster keeps an entry per group', roster.groups.length === 2, String(roster.groups.length))
check('the roster carries a sprite per group', roster.groups.every((g) => !!spriteUrl(g.sprite)))
check('the roster reads as one line', roster.summary.includes('×') && roster.summary.includes('·'), roster.summary)
check('an empty party has nothing to show', enemyRoster({ units: [] }).total === 0)

/* --------------------------- 4. the escape target ------------------------- */

/** A flat plain grid with the borders kept walkable. */
function plainGrid(value = 'plain') {
  return Array.from({ length: WORLD_H }, () => new Array(WORLD_W).fill(value))
}

const grid = plainGrid()
const lord = { x: 40, y: 40 }
const foe = { x: 39, y: 40 }
const candidates = fleeCandidates({ grid, player: lord, party: foe, rng: createRng(99) })
check('an open map offers an escape', candidates.length > 0, String(candidates.length))
check(
  'the escape is a short dash',
  candidates.every((c) => c.distance >= FLEE_MIN_DISTANCE && c.distance <= FLEE_MAX_DISTANCE),
  candidates.map((c) => c.distance).join(',')
)
check(
  'the escape lands on walkable ground',
  candidates.every((c) => TERRAIN[grid[c.y][c.x]].walkable)
)
check(
  'the escape runs away from the enemy',
  candidates.every((c) => Math.hypot(c.x - foe.x, c.y - foe.y) > 1.3),
  candidates.map((c) => Math.hypot(c.x - foe.x, c.y - foe.y).toFixed(1)).join(',')
)
check(
  'the escape stays inside the world',
  candidates.every((c) => c.x > 0 && c.y > 0 && c.x < WORLD_W - 1 && c.y < WORLD_H - 1)
)
check('the same seed runs the same way', fleeTarget({ grid, player: lord, party: foe, rng: createRng(5) }).x === fleeTarget({ grid, player: lord, party: foe, rng: createRng(5) }).x)

// Water and mountains are never a landing place.
const mixed = plainGrid()
for (let y = 30; y < 50; y += 1) {
  for (let x = 30; x < 50; x += 1) {
    if ((x + y) % 3 === 0) mixed[y][x] = 'water'
    if ((x + y) % 7 === 0) mixed[y][x] = 'mountain'
  }
}
const mixedSpots = fleeCandidates({ grid: mixed, player: lord, party: foe, rng: createRng(3) })
check('blocked ground is skipped', mixedSpots.every((c) => TERRAIN[mixed[c.y][c.x]].walkable), String(mixedSpots.length))
check('a mixed map still offers an escape', mixedSpots.length > 0)
check('a fully blocked map offers none', fleeCandidates({ grid: plainGrid('water'), player: lord, party: foe, rng: createRng(1) }).length === 0)
check('no grid means no escape', fleeCandidates({ grid: null, player: lord, party: foe, rng: createRng(1) }).length === 0)

/* ------------------------- 5. the world stops to talk --------------------- */

world.generate(20261024)
player.reset('tester')
player.addTroops('militia', 1, 6)
player.supplies.food = 30
const warbandSize = player.totalTroops
world.parties = []
const start = { ...world.playerPos }
// A hostile party standing one tile away, as if it had just caught the lord.
let spot = null
for (const [dx, dy] of [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
]) {
  const x = Math.round(start.x) + dx
  const y = Math.round(start.y) + dy
  if (TERRAIN[world.grid[y][x]] && TERRAIN[world.grid[y][x]].walkable) {
    spot = { x, y }
    break
  }
}
check('the world offers a tile beside the lord', !!spot)
const wolfParty = {
  id: 'foe-tester',
  faction: 'wolf',
  x: spot.x,
  y: spot.y,
  homeX: spot.x,
  homeY: spot.y,
  units: [
    { type: 'militia', tier: 1, count: 4, hp: [30, 30, 30, 30] },
    { type: 'spearman', tier: 1, count: 2, hp: [56, 56] }
  ],
  speed: 1,
  wanderTimer: 0,
  targetX: spot.x,
  targetY: spot.y
}
world.parties = [wolfParty]
world.encounter = { partyId: wolfParty.id, faction: wolfParty.faction }
world.day = 3
world.timeAcc = 6
const dayBefore = world.day
const accBefore = world.timeAcc
const foeBefore = { x: wolfParty.x, y: wolfParty.y }
for (let i = 0; i < 60; i += 1) world.tick(1 / 60)
check('the meeting freezes the day', world.day === dayBefore, `${world.day}`)
check('the meeting freezes the clock', world.timeAcc === accBefore, `${world.timeAcc}`)
check('the meeting freezes the enemy', wolfParty.x === foeBefore.x && wolfParty.y === foeBefore.y)
check('the clock reports it is frozen', world.timeFlowing === false)
check('the meeting is still open', !!world.encounter)

// Battle is not started by the store: the dialog decides.
check('no battle is running while the two sides talk', battle.active === false)

/* ---------------------------- 6. running away ----------------------------- */

const flee = world.fleeEncounter(424242)
check('the lord escapes', flee.ok === true, JSON.stringify(flee))
check('the meeting closes after the escape', world.encounter === null)
check('the escape is a short dash', flee.distance >= FLEE_MIN_DISTANCE && flee.distance <= FLEE_MAX_DISTANCE, String(flee.distance))
check('the enemy is put on cooldown', (world.cooldown[wolfParty.id] || 0) === FLEE_COOLDOWN, String(world.cooldown[wolfParty.id]))
check('the lord has a path to run', world.path.length > 0, String(world.path.length))
check('the escape does not cost a soldier', player.totalTroops === warbandSize, `${player.totalTroops} vs ${warbandSize}`)

// Let the run play out: the lord really leaves.
for (let i = 0; i < 240; i += 1) world.tick(1 / 60)
const travelled = Math.hypot(world.playerPos.x - start.x, world.playerPos.y - start.y)
check('the lord actually moves', travelled > 1, travelled.toFixed(2))
check('the lord is out of reach', Math.hypot(world.playerPos.x - wolfParty.x, world.playerPos.y - wolfParty.y) > 2, Math.hypot(world.playerPos.x - wolfParty.x, world.playerPos.y - wolfParty.y).toFixed(2))

// The cooldown keeps the same party from attacking again at once.
world.path = []
world.stopCamp()
world.tick(1 / 60)
check('the escaped enemy does not strike again at once', world.encounter === null)
check('a second escape finds nothing to run from', world.fleeEncounter(1).ok === false)

// The cooldown runs on game time, so a marching lord eventually meets again.
world.cooldown = {}
world.playerPos = { ...start }
world.parties = [{ ...wolfParty, x: spot.x, y: spot.y, targetX: spot.x, targetY: spot.y }]
world.tick(1 / 60)
check('the same enemy meets the lord again after the cooldown', !!world.encounter)
check('the meeting names that party', world.encounter.partyId === wolfParty.id)

/* --------------------------- 7. choosing to fight ------------------------- */

const enemyParty = world.partyById(wolfParty.id)
battle.start(enemyParty, 1234)
check('the fight option opens a real battle', battle.active === true)
check('the battle is a party fight', battle.context.kind === 'party')
check('the enemy army reaches the field', battle.data.units.filter((u) => u.side === 'enemy').length === 6, String(battle.data.units.filter((u) => u.side === 'enemy').length))
battle.close()
