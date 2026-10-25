/**
 * Headless checks for the two generals and the lord's own body.
 *
 * The rules this suite pins down:
 *
 *   the lord        can be struck, cannot die, and a battle he falls in is
 *                   lost at once — half the warband is scattered, his health
 *                   comes back at half, and he is put down on the world map
 *                   around the field he fell on
 *   the enemy       general going down ends the battle too: both armies step
 *   general         back onto the map around the field, his warband is still
 *                   standing, and the lord may chase it or walk away
 *   the bodyguard   four melee soldiers of that side stand in front of each
 *                   general and take the blows meant for him
 *   the generals    swing at whoever comes within reach
 */
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { usePlayerStore } from '@/stores/player'
import { useWorldStore } from '@/stores/world'
import { useBattleStore } from '@/stores/battle'
import {
  applyDamage,
  createBattle,
  generalDamage,
  generalShielded,
  guardsOf,
  isLastStand,
  lordReport,
  splitGuards,
  stepBattle,
  yieldBattle
} from '@/game/battle'
import {
  FIELD_RETURN_MAX,
  FIELD_RETURN_MIN,
  LORD_GUARD_COUNT,
  LAST_STAND_SECONDS,
  LORD_MAX_HP,
  clampLordHp,
  halfLordHp,
  lordRegenPerSecond
} from '@/game/lord'
import { loseHalfTroops, troopCount } from '@/game/units'
import { saveGame, loadGame } from '@/game/save'

const check = (name, condition, detail = '') => globalThis.__reporter.check(name, condition, detail)

setActivePinia(createPinia())
const player = usePlayerStore()
const world = useWorldStore()
const battle = useBattleStore()

/* ----------------------------- 1. the bodyguard ---------------------------- */

check('a side fields four bodyguards', LORD_GUARD_COUNT === 4, String(LORD_GUARD_COUNT))

{
  const troops = [{ type: 'militia', tier: 1, count: 8, hp: [] }]
  const split = splitGuards(troops)
  check('eight soldiers give four guards', split.guards.length === 4, String(split.guards.length))
  check('the guards come out of the warband', troopCount(split.troops) === 4, String(troopCount(split.troops)))
  check('nobody is conjured up or lost', troopCount(split.troops) + split.guards.length === 8)
  check('a guard keeps its family', split.guards.every((g) => g.type === 'militia'))
  check('a guard carries its own health', split.guards.every((g) => Number.isFinite(g.hp)))
}

{
  // Melee families are taken first; an archer-heavy army still keeps a squad.
  const mixed = splitGuards([
    { type: 'archer', tier: 1, count: 6, hp: [] },
    { type: 'spearman', tier: 1, count: 2, hp: [] }
  ])
  check(
    'every melee soldier is taken before an archer',
    mixed.guards.filter((g) => g.type === 'spearman').length === 2 &&
      mixed.guards.slice(0, 2).every((g) => g.type === 'spearman'),
    JSON.stringify(mixed.guards)
  )
  check('at most half the army guards', mixed.guards.length <= 4)
}

{
  const tiny = splitGuards([{ type: 'militia', tier: 1, count: 2, hp: [] }])
  check('a two-soldier army keeps a fighter', troopCount(tiny.troops) === 1 && tiny.guards.length === 1)
  const alone = splitGuards([{ type: 'militia', tier: 1, count: 1, hp: [] }])
  check('a lone soldier stays in his squad', alone.guards.length === 0 && troopCount(alone.troops) === 1)
}

/* ------------------------------- 2. the field ------------------------------ */

const roster = [
  { type: 'militia', tier: 1, count: 6, hp: [] },
  { type: 'archer', tier: 1, count: 4, hp: [] }
]

function freshBattle(seed = 611) {
  return createBattle({
    playerTroops: roster,
    enemyTroops: roster,
    enemyFaction: 'wolf',
    seed,
    lordHp: 90
  })
}

{
  const b = freshBattle()
  check('the field has a lord', !!b.commander && b.commander.isGeneral)
  check('the field has an enemy general', !!b.enemyCommander && b.enemyCommander.isEnemyGeneral)
  check('the enemy general wears his faction colour art', b.enemyCommander.sprite === 'wolf', b.enemyCommander.sprite)
  check('the lord enters with the health he carried in', b.commander.hp === 90 && b.commander.maxHp === LORD_MAX_HP)
  check('each general has four guards', guardsOf(b, b.commander).length === 4 && guardsOf(b, b.enemyCommander).length === 4)
  check('the guards are ordinary soldiers of their side', b.units.filter((u) => u.isGuard).every((u) => u.side && u.hp > 0))
  check('the bodyguard follows its general', b.groups['player:guard:1'].order === 'follow')
  check('the bodyguard is not a squad the child commands', !b.playerGroups.includes('player:guard:1'))
  const report = lordReport(b)
  check('the HUD reads both generals', report.lord.hp === 90 && report.enemy.hp === LORD_MAX_HP)
  check('the HUD counts the bodyguards', report.lord.guardsAlive === 4 && report.enemy.guardsAlive === 4)
  check('a watched battle ends when a general falls', b.endOnGeneralDown === true)
}

{
  const b = createBattle({
    playerTroops: roster,
    enemyTroops: [],
    enemyFaction: 'training',
    seed: 5,
    training: true
  })
  check('a drill has no hostile general', b.enemyCommander === null)
  check('a drill keeps the lord but no bodyguard', b.commander.isGeneral && guardsOf(b, b.commander).length === 0)
}

/* --------------------------- 3. the guard shields -------------------------- */

{
  const b = freshBattle()
  const gen = b.enemyCommander
  const attacker = b.units.find((u) => u.side === 'player' && !u.isGuard)
  const guardHpTotal = () => guardsOf(b, gen).reduce((n, g) => n + g.hp, 0)
  const guardHpBefore = guardHpTotal()
  check('a guarded general is shielded', generalShielded(b, gen))
  applyDamage(b, gen, 30, attacker)
  check('the general takes no blow while guarded', gen.hp === gen.maxHp, String(gen.hp))
  const after = guardHpTotal()
  check('a guard took the blow instead', after === guardHpBefore - 30)
}

{
  const b = freshBattle()
  const gen = b.enemyCommander
  const attacker = b.units.find((u) => u.side === 'player' && !u.isGuard)
  // Kill the whole bodyguard: the general is exposed.
  for (const guard of guardsOf(b, gen)) guard.alive = false
  check('a general without guards is not shielded', !generalShielded(b, gen))
  const before = gen.hp
  applyDamage(b, gen, 30, attacker)
  check('an exposed general takes the blow', gen.hp === before - 30, String(gen.hp))
}

/* ------------------------ 4. the hostile general is beaten ------------------ */

{
  const b = freshBattle()
  const gen = b.enemyCommander
  for (const guard of guardsOf(b, gen)) guard.alive = false
  const attacker = b.units.find((u) => u.side === 'player' && !u.isGuard)
  applyDamage(b, gen, gen.hp, attacker)
  check('a beaten general goes down for good', gen.alive === false && gen.hp === 0)
  check('his fall ends the battle', b.outcome === 'general' && b.enemyGeneralDown === true, String(b.outcome))
  check('the lord did not fall with him', b.lordDown === false)
  check('the fall is counted', b.generalDowns === 1 && gen.downs === 1)
  check('the fall leaves a marker on the field', b.effects.some((e) => e.kind === 'down'))
  check(
    'his army is still standing',
    b.units.filter((u) => u.alive && u.side === 'enemy').length > 0,
    String(b.units.filter((u) => u.alive && u.side === 'enemy').length)
  )
  check('the fight does not go on', stepBattle(b, 1 / 60) === b && b.time === 0)
}

{
  // An instant simulation has no world map to fall back to: the round goes on
  // without a hostile general rather than stopping halfway.
  const b = createBattle({
    playerTroops: roster,
    enemyTroops: roster,
    enemyFaction: 'wolf',
    seed: 611,
    endOnGeneralDown: false
  })
  const gen = b.enemyCommander
  for (const guard of guardsOf(b, gen)) guard.alive = false
  const attacker = b.units.find((u) => u.side === 'player' && !u.isGuard)
  applyDamage(b, gen, gen.hp, attacker)
  check('a simulated round fights on', b.outcome === null && b.enemyGeneralDown === false)
  check('the simulated general stays down', gen.alive === false)
  check('a simulated fall is still counted', b.generalDowns === 1)
}

/* ------------------------ 4b. the last stand of a lone general ------------- */

check(
  'the last stand lasts a few seconds',
  LAST_STAND_SECONDS >= 4 && LAST_STAND_SECONDS <= 12,
  String(LAST_STAND_SECONDS)
)

{
  // No soldiers left on either side: the lord holds the field on his own, and
  // nothing is around to interrupt him, so the clock can be watched.
  const b = createBattle({
    playerTroops: roster,
    enemyTroops: [],
    enemyFaction: 'wolf',
    seed: 77
  })
  for (const u of b.units) if (u.side === 'player') u.alive = false
  stepBattle(b, 1 / 60)
  check('losing every soldier does not end the battle at once', b.outcome === null, String(b.outcome))
  check('the lord enters his last stand', !!b.lastStand && b.lastStand.side === 'player')
  check('he is the last man standing', isLastStand(b, b.commander) === true)
  check('the HUD can read the last stand', !!b.lastStand && b.lastStand.t >= 0)

  // A general on his last legs swings harder.
  const target = b.enemyCommander
  b.rng.float = () => 0
  const buffed = generalDamage(b, b.commander, target)
  const stand = b.lastStand
  b.lastStand = null
  const plain = generalDamage(b, b.commander, target)
  b.lastStand = stand
  check('a lone general hits harder', buffed > plain, `${plain} -> ${buffed}`)

  for (let i = 0; i < 60 * LAST_STAND_SECONDS + 30; i += 1) stepBattle(b, 1 / 60)
  check('time runs out and the lone lord yields', b.outcome === 'lose' && b.yielded === 'player', `${b.outcome}/${b.yielded}`)
  check('he walks off the field alive', b.commander.alive === true && b.lordDown === false)
}

{
  // The lord can also give up the field himself (the 撤退 button).
  const b = createBattle({
    playerTroops: roster,
    enemyTroops: roster,
    enemyFaction: 'wolf',
    seed: 78
  })
  for (const u of b.units) if (u.side === 'player') u.alive = false
  stepBattle(b, 1 / 60)
  check('a retreat is only possible in a last stand', yieldBattle(b, 'player') === true)
  check('a retreat loses the battle', b.outcome === 'lose' && b.yielded === 'player')
  check('a retreat cannot be repeated', yieldBattle(b, 'player') === false)
}

{
  // The enemy's soldiers are gone but their general is not: he holds as well,
  // and when he gives up the battle is won.
  const b = createBattle({
    playerTroops: roster,
    enemyTroops: roster,
    enemyFaction: 'wolf',
    seed: 79
  })
  for (const u of b.units) if (u.side === 'enemy') u.alive = false
  stepBattle(b, 1 / 60)
  check('the enemy general holds on his own too', !!b.lastStand && b.lastStand.side === 'enemy')
  check('the lord is not in a last stand', isLastStand(b, b.commander) === false)
  yieldBattle(b, 'enemy')
  check('a hostile general who gives up loses the battle', b.outcome === 'win' && b.yielded === 'enemy')
}

{
  // A hostile general falling with no soldier left is a victory, not a draw:
  // his army is gone, so nothing is left to chase.
  const b = createBattle({
    playerTroops: roster,
    enemyTroops: [],
    enemyFaction: 'wolf',
    seed: 80
  })
  const attacker = b.units.find((u) => u.side === 'player')
  applyDamage(b, b.enemyCommander, b.enemyCommander.hp + 5, attacker)
  check('the fall of the last enemy is a victory', b.outcome === 'win' && b.enemyGeneralDown === true, String(b.outcome))
  check('nobody is left to chase him', b.yielded === null)
}

{
  // An instant round has no last stand to watch.
  const b = createBattle({
    playerTroops: roster,
    enemyTroops: roster,
    enemyFaction: 'wolf',
    seed: 81,
    lastStand: false
  })
  for (const u of b.units) if (u.side === 'player') u.alive = false
  stepBattle(b, 1 / 60)
  check('an instant round ends with the army', b.outcome === 'lose' && b.lastStand === null)
}

/* ---------------------------- 5. the lord goes down ------------------------ */

{
  const b = freshBattle()
  for (const guard of guardsOf(b, b.commander)) guard.alive = false
  const attacker = b.units.find((u) => u.side === 'enemy' && !u.isGuard)
  applyDamage(b, b.commander, b.commander.hp, attacker)
  check('the lord does not die', b.commander.alive === false && b.commander.hp === 0)
  check('a battle the lord falls in is lost', b.outcome === 'lose' && b.lordDown === true)
  check('the enemy general is untouched by it', b.enemyGeneralDown === false)
  const report = lordReport(b)
  check('the HUD shows a fallen lord', report.lord.hp === 0 && report.lord.alive === false)
}

/* ----------------------------- 6. the general fights ----------------------- */

{
  const b = freshBattle()
  const foe = b.units.find((u) => u.side === 'enemy' && !u.isGuard)
  // Put the lord's arm within reach of an enemy soldier.
  b.commander.x = foe.x - 16
  b.commander.y = foe.y
  b.commander.tx = b.commander.x
  b.commander.ty = b.commander.y
  b.commander.cd = 0
  const before = foe.hp
  stepBattle(b, 1 / 60)
  check('a general strikes whoever is in reach', foe.hp < before, `${before} -> ${foe.hp}`)
  check('a strike leans the general into the blow', b.commander.swing > 0)
  const dmg = generalDamage(b, b.commander, foe)
  check('the general deals real damage', dmg >= 1, String(dmg))
}

{
  // The bodyguard stays with its general as he walks.
  const b = freshBattle()
  for (let i = 0; i < 60 * 8; i += 1) stepBattle(b, 1 / 60)
  const guards = guardsOf(b, b.commander)
  const near = guards.filter((g) => Math.hypot(g.x - b.commander.x, g.y - b.commander.y) < 60)
  check('the bodyguard keeps station around its general', near.length === guards.length, `${near.length}/${guards.length}`)
}

/* -------------------------- 7. the lord's own body ------------------------- */

check('a whole lord has a hundred and twenty points', LORD_MAX_HP === 120, String(LORD_MAX_HP))
check('half health is half', halfLordHp(120) === 60)
check('health is clamped into range', clampLordHp(999) === 120 && clampLordHp(-5) === 0)
check(
  'a town heals faster than the road',
  lordRegenPerSecond({ inSettlement: true }) > lordRegenPerSecond({})
)
check(
  'his own town heals faster still',
  lordRegenPerSecond({ inSettlement: true, ownTown: true }) > lordRegenPerSecond({ inSettlement: true })
)
check('a hospital helps', lordRegenPerSecond({ inSettlement: true, hospital: 2 }) > lordRegenPerSecond({ inSettlement: true }))

{
  const half = loseHalfTroops([{ type: 'militia', tier: 1, count: 7, hp: [9, 8, 7, 6, 5, 4, 3] }])
  check('half the soldiers are scattered', half.lost === 3 && troopCount(half.troops) === 4, JSON.stringify(half))
  check('the healthiest are kept', half.troops[0].hp.every((hp) => hp >= 6), JSON.stringify(half.troops[0].hp))
}

/* --------------------------- 8. the player store --------------------------- */

player.reset('general-tester')
check('a new lord is unhurt', player.lordHp === LORD_MAX_HP && player.lordHealth === 100)
player.setLordHp(30)
check('a wound is written down', player.lordHp === 30 && player.lordWounded)
check('the wound is a percentage', player.lordHealth === 25, String(player.lordHealth))
player.healLord(10)
check('healing stops at the top', player.lordHp === 40)
player.healLord(9999)
check('nobody heals past full', player.lordHp === LORD_MAX_HP)
player.setLordHp(0)
check('zero is a real state', player.lordHp === 0 && player.lordHealth === 0)
player.reviveLordHalf()
check('a beaten lord wakes at half health', player.lordHp === 60, String(player.lordHp))

// The wound survives a save and a reload.
{
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key)
  }
  player.setLordHp(42)
  saveGame('general-tester', {
    seed: 1,
    grid: world.grid,
    settlements: [],
    parties: [],
    playerPos: { x: 2, y: 2 },
    day: 1,
    gold: player.gold,
    troops: player.troops,
    supplies: player.supplies,
    stats: player.stats,
    lordHp: player.lordHp,
    lordMaxHp: player.lordMaxHp
  })
  const loaded = loadGame('general-tester')
  check('the save carries the lord health', loaded.lordHp === 42 && loaded.lordMaxHp === 120, JSON.stringify([loaded.lordHp, loaded.lordMaxHp]))
  const other = usePlayerStore()
  check('a save without lord health restores a whole lord', (other.hydrate({ username: 'x', troops: [], gold: 1 }, 1), other.lordHp === LORD_MAX_HP))
  other.hydrate(loaded)
  check('a reload keeps the wound', other.lordHp === 42, String(other.lordHp))
  delete globalThis.localStorage
}

/* --------------------------- 9. the world reacts --------------------------- */

world.generate(4242)
player.reset('general-tester')

{
  player.setLordHp(10)
  const road = world.healLordTick(1, {})
  check('the lord heals on the road', road > 0, String(road))
  player.setLordHp(10)
  const town = world.healLordTick(1, { inSettlement: true })
  check('a town heals him faster', town > road, `${road} vs ${town}`)
  player.setLordHp(10)
  const own = world.healLordTick(1, { inSettlement: true, ownTown: true })
  check('his own town heals him faster still', own > town, `${town} vs ${own}`)
  player.setLordHp(LORD_MAX_HP)
  check('a whole lord is not healed', world.healLordTick(1, {}) === 0)
}

{
  // The field is wherever the fight broke out — the lord's own tile.
  const field = { x: world.playerPos.x, y: world.playerPos.y }
  const partiesBefore = world.parties.length
  const moved = world.relocateToField(77, 'lord')
  const dist = Math.hypot(world.playerPos.x - field.x, world.playerPos.y - field.y)
  check('he is put back on the map', !!moved, JSON.stringify(moved))
  check('he does not cross the world', dist <= FIELD_RETURN_MAX + 1.5, String(dist.toFixed(2)))
  check('he is not dropped on the exact spot', dist >= FIELD_RETURN_MIN - 1, String(dist.toFixed(2)))
  check('the ring is a few tiles wide', FIELD_RETURN_MIN >= 2 && FIELD_RETURN_MAX <= 8)
  const terrain = world.grid[Math.round(world.playerPos.y)]?.[Math.round(world.playerPos.x)]
  check('he stands on walkable ground', terrain !== 'water', String(terrain))
  const inTown = world.settlements.some(
    (st) => Math.hypot(st.x - world.playerPos.x, st.y - world.playerPos.y) < 1.2
  )
  check('he is not dropped inside a town gate', !inTown, JSON.stringify(world.playerPos))
  check('the enemy warbands are still on the map', world.parties.length === partiesBefore)
  check('the map knows why he stepped back', world.lastReturn === 'lord', String(world.lastReturn))
  world.clearReturn()
  check('the note is cleared once it is read', world.lastReturn === null)
}

{
  // The enemy general going down puts him back the same way.
  const field = { x: world.playerPos.x, y: world.playerPos.y }
  world.relocateToField(11, 'enemy')
  const dist = Math.hypot(world.playerPos.x - field.x, world.playerPos.y - field.y)
  check('a beaten enemy general also puts the lord beside the field', dist <= FIELD_RETURN_MAX + 1.5, String(dist))
  check('the map names the enemy general', world.lastReturn === 'enemy', String(world.lastReturn))
  world.clearReturn()
}

/* --------------------------- 10. the battle store -------------------------- */

world.generate(4242)
player.reset('general-tester')
player.troops = [{ type: 'militia', tier: 1, count: 10, hp: new Array(10).fill(30) }]
player.setLordHp(80)

{
  const party = world.parties[0]
  const field = { x: world.playerPos.x, y: world.playerPos.y }
  battle.start(party, 991)
  check('the battle borrows the lord health', battle.data.commander.hp === 80, String(battle.data.commander.hp))
  // Walk the lord down: the bodyguard goes first, then the blow lands.
  for (const guard of guardsOf(battle.data, battle.data.commander)) guard.alive = false
  battle.data.commander.hp = 1
  const attacker = battle.data.units.find((u) => u.side === 'enemy')
  applyDamage(battle.data, battle.data.commander, 5, attacker)
  check('the battle ends the moment the lord falls', battle.data.outcome === 'lose')
  const troopsBefore = player.totalTroops
  battle.settle(31337)
  check('the defeat is settled', battle.settled && battle.result.lordDown === true)
  check('half the soldiers are scattered', player.totalTroops < troopsBefore && battle.result.halfLost > 0, `${troopsBefore} -> ${player.totalTroops}`)
  check('the lord wakes at half health', player.lordHp === halfLordHp(player.lordMaxHp), String(player.lordHp))
  check('he is put back beside the field', battle.result.relocated === true)
  const dist = Math.hypot(world.playerPos.x - field.x, world.playerPos.y - field.y)
  check('he wakes near the battlefield, not in another town', dist <= FIELD_RETURN_MAX + 1.5, String(dist.toFixed(2)))
  check('the enemy is still on the map to chase him', world.parties.some((p) => p.id === party.id))
  check('the enemy may come after him soon', (world.cooldown[party.id] || 0) <= 10, String(world.cooldown[party.id]))
  battle.close()
}

{
  // The enemy general going down: settled, both sides back around the field.
  world.generate(4242)
  player.reset('general-tester')
  player.troops = [{ type: 'militia', tier: 1, count: 10, hp: new Array(10).fill(30) }]
  player.setLordHp(95)
  const party = world.parties[0]
  const field = { x: world.playerPos.x, y: world.playerPos.y }
  const troopsBefore = player.totalTroops
  battle.start(party, 4242)
  for (const guard of guardsOf(battle.data, battle.data.enemyCommander)) guard.alive = false
  const attacker = battle.data.units.find((u) => u.side === 'player')
  applyDamage(battle.data, battle.data.enemyCommander, battle.data.enemyCommander.hp, attacker)
  check('the battle stops when the enemy general falls', battle.data.outcome === 'general')
  battle.settle(777)
  check('the fight is settled', battle.settled && battle.result.generalDown === true)
  check('the lord did not fall', battle.result.lordDown === false)
  check('nobody loses half the warband', battle.result.halfLost === 0 && player.totalTroops === troopsBefore)
  check('the lord keeps his wound', player.lordHp === 95, String(player.lordHp))
  check('the enemy warband is still there', world.parties.some((p) => p.id === party.id))
  check('the enemy keeps the soldiers it had left', (party.units || []).length > 0)
  check('the chase is open at once', (world.cooldown[party.id] || 0) <= 5, String(world.cooldown[party.id]))
  const dist = Math.hypot(world.playerPos.x - field.x, world.playerPos.y - field.y)
  check('the lord is put back beside the field', battle.result.relocated === true && dist <= FIELD_RETURN_MAX + 1.5, String(dist.toFixed(2)))
  check('the map names the reason', world.lastReturn === 'enemy', String(world.lastReturn))
  battle.close()
}

{
  // A warband wiped out to the last soldier: the lord withdraws, and the only
  // thing he loses is the army he no longer has.
  world.generate(4242)
  player.reset('general-tester')
  player.troops = [{ type: 'militia', tier: 1, count: 4, hp: new Array(4).fill(30) }]
  player.setLordHp(72)
  const party = world.parties[0]
  const field = { x: world.playerPos.x, y: world.playerPos.y }
  battle.start(party, 515)
  for (const u of battle.data.units) if (u.side === 'player') u.alive = false
  battle.tick(1 / 60)
  check('the battle waits while the lord stands alone', !!battle.data.lastStand && battle.data.outcome === null)
  check('the store lets him withdraw', battle.withdraw() === true)
  check('the retreat ends the fight', battle.data.outcome === 'lose' && battle.data.yielded === 'player')
  battle.settle(515)
  check('the retreat is settled', battle.settled && battle.result.withdrew === true)
  check('a retreat does not scatter half of nothing', battle.result.halfLost === 0 && battle.result.lordDown === false)
  // The field is empty, so only the rescue roll of the hospitals can bring
  // anybody back: a couple of wounded at one hit point, never a fresh squad.
  check('the warband is wiped out afterwards', player.totalTroops <= 4, String(player.totalTroops))
  check('the lord keeps the health he had', player.lordHp === 72, String(player.lordHp))
  check('he is put back beside the field', battle.result.relocated === true)
  const dist = Math.hypot(world.playerPos.x - field.x, world.playerPos.y - field.y)
  check('the retreat does not cross the map', dist <= FIELD_RETURN_MAX + 1.5, String(dist.toFixed(2)))
  check('the map knows he withdrew', world.lastReturn === 'withdraw', String(world.lastReturn))
  check('the enemy is still there to be avoided', world.parties.some((p) => p.id === party.id))
  check('the enemy may follow him shortly', (world.cooldown[party.id] || 0) <= 6, String(world.cooldown[party.id]))
  battle.close()
}

{
  // The enemy's army is wiped out and their general gives up the field: the
  // battle is won, and the result says he ran.
  world.generate(4242)
  player.reset('general-tester')
  player.troops = [{ type: 'militia', tier: 1, count: 8, hp: new Array(8).fill(30) }]
  player.setLordHp(100)
  const party = world.parties[0]
  battle.start(party, 616)
  for (const u of battle.data.units) if (u.side === 'enemy') u.alive = false
  battle.tick(1 / 60)
  check('the hostile general holds on alone', !!battle.data.lastStand && battle.data.lastStand.side === 'enemy')
  yieldBattle(battle.data, 'enemy')
  battle.settle(616)
  check('his surrender is a victory', battle.result.outcome === 'win')
  check('the result says the enemy general ran', battle.result.generalFled === true)
  check('nothing was scattered from the lord', battle.result.lordDown === false && battle.result.halfLost === 0)
  check('the enemy party is gone from the map', !world.parties.some((p) => p.id === party.id))
  battle.close()
}

{
  // A battle the lord walks away from only leaves him wounded.
  world.generate(4242)
  player.reset('general-tester')
  player.troops = [{ type: 'militia', tier: 1, count: 10, hp: new Array(10).fill(30) }]
  player.setLordHp(100)
  battle.start(world.parties[0], 4242)
  battle.data.commander.hp = 55
  battle.data.outcome = 'win'
  battle.settle(1)
  check('a wound is carried out of a battle', player.lordHp === 55, String(player.lordHp))
  check('a normal defeat does not scatter the warband', battle.result.lordDown === false)
  check('a victory does not move him', battle.result.relocated === false)
  battle.close()
}

/* --------------------------- 11. the interface ---------------------------- */

{
  const root = globalThis.__kwgRoot || process.cwd()
  const battleView = readFileSync(path.join(root, 'src/views/BattleView.vue'), 'utf8')
  check('the battle HUD shows the lord health', battleView.includes('gen-row') && battleView.includes('lord.percent'))
  check('the battle HUD shows the enemy general', battleView.includes('enemyGeneral'))
  check('the result screen explains a fallen lord', battleView.includes('result.lordDown'))
  check('the result screen explains a fallen enemy general', battleView.includes("result.outcome === 'general'"))
  check('the result screen says he was carried back to the field', battleView.includes('result.relocated'))
  check('the result screen explains a lone general', battleView.includes('last-stand'))
  check('the result screen explains a retreat', battleView.includes('result.withdrew'))
  check('the result screen explains an enemy general running', battleView.includes('result.generalFled'))
  const map = readFileSync(path.join(root, 'src/components/BattleMap.vue'), 'utf8')
  check('the field draws the enemy general', map.includes('enemyCommander'))
  check('the field draws the general sprite', map.includes('spriteOf'))
  check('the field marks a general going down', map.includes("e.kind === 'down'"))
  const worldView = readFileSync(path.join(root, 'src/views/WorldView.vue'), 'utf8')
  check('the world map shows the lord health', worldView.includes('player.lordHp'))
  check('the world map says what just happened', worldView.includes('lastReturn'))
  check('the world map also knows a retreat', worldView.includes("lastReturn === 'withdraw'"))
  const panel = readFileSync(path.join(root, 'src/components/CharacterPanel.vue'), 'utf8')
  check('the lord panel shows his health', panel.includes('player.lordHp'))
}
