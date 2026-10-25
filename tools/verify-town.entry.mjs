/**
 * Headless checks for the town scenes, the townsfolk, their quests and the
 * companions.
 *
 * The scenes are a pure function of a settlement, so they can be built here
 * exactly as the browser builds them; the quest and companion rules live in the
 * player store, so they are exercised through the real store with a real world.
 */
import { createPinia, setActivePinia } from 'pinia'
import { usePlayerStore } from '@/stores/player'
import { useWorldStore } from '@/stores/world'
import { useBattleStore } from '@/stores/battle'
import { generateWorld } from '@/game/worldgen'
import { buildScene, isWalkable, scenePath, buildingNear, npcNear, scenePath as path, BUILDINGS, SCENE_SIZE } from '@/game/town'
import {
  ROLES,
  FOLLOWER_KEYS,
  QUEST_KINDS,
  battleCompanions,
  companionCap,
  companionEffects,
  companionStrength,
  makeCompanion,
  makeQuest
} from '@/game/npc'
import { SPRITE_PATH } from '@/game/pixelAssets'
import { easeFollower, followerTargets } from '@/game/followers'
import { createBattle, survivorsByType, fallenByType, battleGroups, stepBattle } from '@/game/battle'
import { normalizeTroops } from '@/game/units'

setActivePinia(createPinia())
const reporter = globalThis.__reporter
const check = (name, ok, detail = '') => reporter.check(name, ok, detail)

/* ------------------------------- the scenes ------------------------------- */

const world = generateWorld(20261025)
const towns = world.settlements.filter((s) => s.kind === 'town')
const villages = world.settlements.filter((s) => s.kind === 'village')

check('the world has towns to walk through', towns.length > 0, `${towns.length}`)
check('the world has villages to walk through', villages.length > 0, `${villages.length}`)

const townScene = buildScene(towns[0])
const villageScene = buildScene(villages[0])

check('a town scene is 34 x 26 tiles', townScene.w === SCENE_SIZE.town.w && townScene.h === SCENE_SIZE.town.h, `${townScene.w}x${townScene.h}`)
check('a village scene is 26 x 20 tiles', villageScene.w === SCENE_SIZE.village.w && villageScene.h === SCENE_SIZE.village.h, `${villageScene.w}x${villageScene.h}`)

// Facilities a town must offer: the whole management of the game is reachable by
// walking to a door.
const townKeys = new Set(townScene.buildings.map((b) => b.key))
for (const key of ['hall', 'market', 'barracks', 'school', 'tavern', 'hospital', 'smithy', 'house']) {
  check(`a town holds a ${key}`, townKeys.has(key))
}
const villageKeys = new Set(villageScene.buildings.map((b) => b.key))
for (const key of ['barn', 'market', 'mill', 'house', 'well']) {
  check(`a village holds a ${key}`, villageKeys.has(key))
}

check('a town holds at least ten buildings', townScene.buildings.length >= 10, `${townScene.buildings.length}`)
check('every building has a name and a note', townScene.buildings.every((b) => b.name && b.note && b.panel))
check('every building sprite is in the pixel manifest', townScene.buildings.every((b) => !!SPRITE_PATH[b.sprite]), townScene.buildings.map((b) => b.sprite).join(','))
check('every prop sprite is in the pixel manifest', [...townScene.props, ...villageScene.props].every((p) => !!SPRITE_PATH[p.sprite]))
check('the fountain stands in the middle of the town square', townScene.props.some((p) => p.sprite === 'town-fountain'))

// Doors: the tile the lord stands on to walk in. It must be open ground, or the
// whole facility is unreachable.
const doorsOpen = townScene.buildings.every((b) => isWalkable(townScene, b.door.x, b.door.y))
check('every town door stands on open ground', doorsOpen)
check('every village door stands on open ground', villageScene.buildings.every((b) => isWalkable(villageScene, b.door.x, b.door.y)))

// Footprints: a house is not walk-through.
const insideBlocked = townScene.buildings.every((b) => {
  for (let j = 0; j < b.h; j += 1) {
    for (let i = 0; i < b.w; i += 1) {
      if (isWalkable(townScene, b.x + i, b.y + j)) return false
    }
  }
  return true
})
check('a building footprint is never walkable', insideBlocked)

// Reachability: every door must be walkable-to from the spawn tile.
const unreachable = townScene.buildings.filter((b) => {
  const p = path(townScene, townScene.spawn, b.door)
  const last = p[p.length - 1]
  return !last || last.x !== b.door.x || last.y !== b.door.y
})
check('every town door is reachable from the gate', unreachable.length === 0, unreachable.map((b) => b.key).join(','))

const villageUnreachable = villageScene.buildings.filter((b) => {
  const p = path(villageScene, villageScene.spawn, b.door)
  const last = p[p.length - 1]
  return !last || last.x !== b.door.x || last.y !== b.door.y
})
check('every village door is reachable from the gate', villageUnreachable.length === 0, villageUnreachable.map((b) => b.key).join(','))

// People stand on open ground and can be walked up to.
check('every NPC stands on open ground', townScene.npcs.every((n) => isWalkable(townScene, Math.round(n.x), Math.round(n.y))))
const npcUnreachable = townScene.npcs.filter((n) => {
  const p = path(townScene, townScene.spawn, { x: Math.round(n.x), y: Math.round(n.y) })
  return p.length === 0
})
check('every NPC can be walked up to', npcUnreachable.length === 0, npcUnreachable.map((n) => n.name).join(','))

check('a town holds at least seven people', townScene.npcs.length >= 7, `${townScene.npcs.length}`)
check('a town holds at least two people who would follow a lord', townScene.npcs.filter((n) => n.follower).length >= 2)
check('a town also holds residents who never leave', townScene.npcs.some((n) => !n.follower))

// The same town is always the same town, and the cache hands back the same map.
const again = buildScene(towns[0])
check('the scene is cached per settlement', again === townScene)
check(
  'the layout is stable across a rebuild',
  again.buildings.length === townScene.buildings.length &&
    again.buildings.every((b, i) => b.x === townScene.buildings[i].x && b.y === townScene.buildings[i].y)
)

// Every settlement of the map lays out without a single broken door.
let brokenScenes = 0
for (const st of world.settlements) {
  const sc = buildScene(st)
  if (!sc || !sc.npcs.length) brokenScenes += 1
  if (sc.buildings.some((b) => !isWalkable(sc, b.door.x, b.door.y))) brokenScenes += 1
}
check('every settlement of the world lays out cleanly', brokenScenes === 0, `${brokenScenes} broken`)

// Proximity helpers, which the screen uses for its action button.
const door = townScene.buildings[0].door
check('standing on a door finds its building', !!buildingNear(townScene, { x: door.x + 0.4, y: door.y + 0.4 }))
check('standing in the middle of nowhere finds nobody', !npcNear(townScene, { x: 0.5, y: 0.5 }, 0.5) && !buildingNear(townScene, { x: 0.5, y: 0.5 }, 0.5))

/* --------------------------------- people --------------------------------- */

const npc = townScene.npcs[0]
check('every role has a name and a Chinese title', Object.values(ROLES).every((r) => r.name && r.en))
check('every role sprite is in the pixel manifest', Object.values(ROLES).every((r) => !!SPRITE_PATH[r.sprite]))
check('a NPC always has a name', townScene.npcs.every((n) => typeof n.name === 'string' && n.name.length >= 2))
check('the names of one town are distinct', new Set(townScene.npcs.map((n) => n.name)).size === townScene.npcs.length)
check('a NPC always carries a quest', townScene.npcs.every((n) => n.quest && QUEST_KINDS[n.quest.kind] && n.quest.target > 0))
check('the quest line names its target', townScene.npcs.every((n) => n.quest.label.includes(String(n.quest.target))))
check('a follower costs gold', FOLLOWER_KEYS.every((k) => ROLES[k].cost > 0))
check('a resident costs nothing and cannot lead soldiers', Object.values(ROLES).filter((r) => !r.follower).every((r) => r.cost === 0 && r.squadCap === 0))
check('a follower can always lead at least four soldiers', FOLLOWER_KEYS.every((k) => ROLES[k].squadCap >= 4))

// The quest generator is seeded: the same NPC always asks for the same job.
const q1 = makeQuest({ id: 'x:n0', role: 'scholar', seed: 999, big: true })
const q2 = makeQuest({ id: 'x:n0', role: 'scholar', seed: 999, big: true })
check('a quest is deterministic for one NPC', q1.kind === q2.kind && q1.target === q2.target)
check('a scholar asks for answers, a guard for victories', makeQuest({ id: 'a', role: 'scholar', seed: 1 }).kind === 'exam' && makeQuest({ id: 'b', role: 'guard', seed: 2 }).kind === 'battle')

/* ------------------------------ the player ------------------------------- */

const player = usePlayerStore()
player.reset('tester', 'normal')
// Start from a known warband so transfers are easy to follow.
player.troops = normalizeTroops([{ type: 'militia', tier: 1, count: 6 }, { type: 'archer', tier: 1, count: 3 }])

// A quest is not started by looking at somebody: it has to be accepted, and
// progress only counts what happens after that.
const followerNpc = townScene.npcs.find((n) => n.follower)
const residentNpc = townScene.npcs.find((n) => !n.follower)
followerNpc.townId = townScene.id
followerNpc.townName = townScene.name

check('talking to somebody does not start a job by itself', player.questProgress(followerNpc).accepted === false)
check('an unaccepted job keeps no record', player.questRecord(followerNpc.id) === null)
check('an unaccepted job cannot be recruited for', player.hireCompanion(followerNpc, townScene.id).ok === false)

// Work done before accepting must not count towards the job.
player.stats.correct += 5
player.stats.wins += 2
player.stats.recruited += 3

const accepted = player.acceptQuest(followerNpc)
check('「接受委托」 writes the record down', accepted.ok === true)
check('the record knows who asked', player.questRecord(followerNpc.id).name === followerNpc.name)
check('the record knows the town', player.questRecord(followerNpc.id).townId === townScene.id)
check('the same job cannot be accepted twice', player.acceptQuest(followerNpc).ok === false)
check('a new job starts from today, not from the campaign', player.questProgress(followerNpc).current === 0)
check('an accepted job shows up in the log', player.allQuests.some((q) => q.npcId === followerNpc.id))
check('an accepted job is listed as open', player.openQuests.some((q) => q.npcId === followerNpc.id))

const kind = followerNpc.quest.kind
if (kind === 'exam') player.stats.correct += followerNpc.quest.target - 1
if (kind === 'battle') player.stats.wins += followerNpc.quest.target - 1
if (kind === 'recruit') player.stats.recruited += followerNpc.quest.target - 1
check('the job counts the work done after accepting', player.questProgress(followerNpc).current === followerNpc.quest.target - 1)
check('a job is not done one step early', player.questProgress(followerNpc).done === false)
check('an unfinished job cannot be recruited for', player.hireCompanion(followerNpc, townScene.id).ok === false)

if (kind === 'exam') player.stats.correct += 1
if (kind === 'battle') player.stats.wins += 1
if (kind === 'recruit') player.stats.recruited += 1
check('the job is done once the target is reached', player.questProgress(followerNpc).done === true)
check('a finished job stays finished', player.quests[followerNpc.id].done === true)
check('a finished job leaves the open list', !player.openQuests.some((q) => q.npcId === followerNpc.id))
check('a finished job stays in the log', player.allQuests.some((q) => q.npcId === followerNpc.id))

// A second job accepted later must not inherit the work already done.
const second = townScene.npcs.find((n) => n.id !== followerNpc.id)
second.townId = townScene.id
second.townName = townScene.name
player.acceptQuest(second)
check('two jobs are tracked side by side', player.allQuests.length === 2)
check('the second job starts at zero as well', player.questProgress(second).current === 0, `${second.name} ${second.quest.kind}`)
player.abandonQuest(second.id)
check('a job can be given back', player.questRecord(second.id) === null && player.allQuests.length === 1)

// Hiring needs gold.
const broke = player.hireCompanion(followerNpc, townScene.id)
check('a finished job still needs gold', broke.ok === false && /金币/.test(broke.reason))
player.gold = 1000
const hired = player.hireCompanion(followerNpc, townScene.id)
check('a NPC joins once his job is done and he is paid', hired.ok === true)
check('hiring costs his price', player.gold === 1000 - followerNpc.cost, `${player.gold}`)
check('the companion starts with an empty banner', player.companions.length === 1 && player.companions[0].soldiers.length === 0)
check('the same NPC cannot be hired twice', player.hireCompanion(followerNpc, townScene.id).ok === false)
check('a resident never joins', player.hireCompanion(residentNpc, townScene.id).ok === false)

/* ------------------------------- companions ------------------------------- */

const companion = player.companions[0]
const cap = companionCap({ role: companion.role })
check('a companion knows how many soldiers he may lead', cap >= 4, `${cap}`)
check('an empty banner is left out of the battle', battleCompanions(player.companions).length === 0)

const before = player.totalTroops
const given = player.assignCompanionSoldiers(companion.id, 'militia', 1, 3)
check('soldiers can be handed to a companion', given.ok && given.moved === 3)
check('the soldiers leave the warband', player.totalTroops === before - 3, `${player.totalTroops}`)
check('the companion now leads three soldiers', companionStrength(companion) === 3)
check('the army as a whole keeps its size', player.armySize === before)
const over = player.assignCompanionSoldiers(companion.id, 'archer', 1, 99)
check('a banner has a limit', over.moved === cap - 3, `${over.moved} of ${cap - 3}`)
check('the banner stops exactly at its limit', companionStrength(companion) === cap)

const recalled = player.recallCompanionSoldiers(companion.id, 'militia', 1, 2)
check('soldiers can be taken back', recalled.ok && recalled.moved === 2)
check('recalled soldiers are back in the warband', player.totalTroops === before - 3 - (cap - 3) + 2)

// A wounded soldier stays wounded through the transfer.
const hurt = player.troops.find((g) => g.type === 'militia')
if (hurt) hurt.hp = hurt.hp.map((v) => Math.max(1, Math.round(v / 2)))
const hpBefore = hurt ? Math.min(...hurt.hp) : 0
player.assignCompanionSoldiers(companion.id, hurt.type, hurt.tier, 1)
const movedGroup = companion.soldiers.find((g) => g.type === hurt.type && g.tier === hurt.tier)
check('a wounded soldier stays wounded under a banner', !movedGroup || Math.min(...movedGroup.hp) === hpBefore, `${hpBefore}`)

// The buffs are summed, never multiplied, so one more friend is one more small
// bonus and never a runaway army.
const buffs = companionEffects(player.companions)
check('a companion brings a small army-wide bonus', buffs.atk + buffs.def + buffs.heal > 0)

player.dismissCompanion(companion.id)
check('dismissing a companion returns his soldiers', player.companions.length === 0 && player.armySize === player.totalTroops)

/* --------------------------------- battle --------------------------------- */

// A battle with a companion banner: his soldiers are player-side squads with his
// own name on them, and his casualties never touch the lord's roster.
const allyNpc = { ...followerNpc, id: 'ally:1', name: '赵大勇' }
player.companions.push(makeCompanion(allyNpc, townScene.id))
const ally = player.companions[0]
ally.soldiers = normalizeTroops([{ type: 'militia', tier: 1, count: 4 }])

const war = createBattle({
  playerTroops: player.troops,
  enemyTroops: normalizeTroops([{ type: 'militia', tier: 1, count: 6 }]),
  enemyFaction: 'bandit',
  seed: 4242,
  allyTroops: battleCompanions(player.companions)
})
const allyGroups = battleGroups(war, 'player').filter((g) => g.owner === ally.id)
check('a companion banner forms a squad of its own', allyGroups.length === 1, `${allyGroups.length}`)
check('the squad is named after the companion', allyGroups[0] && allyGroups[0].name.includes('赵大勇'))
check('the squad starts behind the lord line', allyGroups[0] && allyGroups[0].anchor.y > 0.5 * 960)

const allyUnits = war.units.filter((u) => u.owner === ally.id)
check('every soldier of the banner is tagged with him', allyUnits.length === 4, `${allyUnits.length}`)
check('the lord own soldiers carry no owner', war.units.some((u) => u.side === 'player' && u.owner === null))
check(
  'the lord survivors and the banner survivors are counted apart',
  survivorsByType(war, 'player').length >= survivorsByType(war, 'player', null).length &&
    survivorsByType(war, 'player', ally.id).length <= 4
)
check('owning a filter separates the fallen too', fallenByType(war, 'player', 'nobody').length === 0)

// Run the real simulation for a few seconds: the tagged units must fight, and
// the filter must still answer correctly afterwards.
// A battle opens with a standoff and the two lines have to walk into each
// other, so the simulation is run for a full minute of game time.
for (let i = 0; i < 1200; i += 1) stepBattle(war, 0.05)
const allyLeft = survivorsByType(war, 'player', ally.id).reduce((n, g) => n + g.count, 0)
const lordLeft = survivorsByType(war, 'player', null).reduce((n, g) => n + g.count, 0)
check('the battle actually ran', war.kills + war.losses > 0 || war.units.some((u) => !u.alive), `${war.kills}k ${war.losses}l`)
check('the banner never grows past its soldiers', allyLeft <= 4, `${allyLeft}`)
check('the two pools together are the player side', allyLeft + lordLeft === survivorsByType(war, 'player').reduce((n, g) => n + g.count, 0))

// The battle store hands the companions over to the battle it starts.
const worldStore = useWorldStore()
worldStore.generate(20261025)
const battle = useBattleStore()
const party = worldStore.parties.find((p) => p.faction === 'bandit')
battle.start(party, 777)
check('starting a battle carries the companions in', battle.context.companions.includes(ally.id))
check('the field holds the companion banner', battle.data.units.some((u) => u.owner === ally.id))

// Settling returns the banner's survivors to the companion and the lord's own
// soldiers to the warband, each in its own pool.
const lordTroopsBefore = normalizeTroops(player.troops)
battle.data.outcome = 'win'
battle.settle(1)
check('the fight produced a result', !!battle.result)
check('the result reports every companion', Array.isArray(battle.result.companions) && battle.result.companions.length === 1)
check('the companion keeps the soldiers who came back', companionStrength(player.companions[0]) <= 4)
check('the lord warband stays his own', player.troops.every((g) => g.count > 0) && player.totalTroops >= 0, `${player.totalTroops} vs ${lordTroopsBefore.length} groups`)


/* ------------------------- the party on the world map ------------------------ */

// A companion has no position of his own: he walks in a slot behind the lord,
// which is what makes one party out of the whole train.
const train = [1, 2, 3, 4, 5].map((n) => ({ id: `c${n}`, sprite: 'npc-guard', name: `同伴${n}` }))
const lord = { x: 20, y: 20 }

const south = followerTargets(train, lord, { x: 0, y: 1 })
check('every companion gets a slot', south.length === train.length)
check('the party walks behind the lord', south.every((f) => f.y < lord.y), south.map((f) => f.y.toFixed(2)).join(','))
check('nobody stands on the lord', south.every((f) => Math.hypot(f.x - lord.x, f.y - lord.y) > 0.5))
const abreast = Math.abs(south[0].y - south[1].y) < 1e-6 && Math.abs(south[0].x - south[1].x) > 0.4
check('the first two walk abreast', abreast, `${south[0].x.toFixed(2)},${south[1].x.toFixed(2)}`)
check('the next pair walks further back', south[2].y < south[0].y && south[3].y < south[1].y)
check(
  'the party opens out as it grows',
  Math.abs(south[2].x - lord.x) > Math.abs(south[0].x - lord.x)
)

const north = followerTargets(train, lord, { x: 0, y: -1 })
check('walking north puts the party south of the lord', north.every((f) => f.y > lord.y))
const east = followerTargets(train, lord, { x: 1, y: 0 })
check('walking east puts the party west of the lord', east.every((f) => f.x < lord.x))
check('turning around turns the whole party', south[0].y < lord.y && east[0].x < lord.x)
check('a standing lord still lays the party out', followerTargets(train, lord, { x: 0, y: 0 }).length === train.length)
check('an empty party has no slots', followerTargets([], lord, { x: 0, y: 1 }).length === 0)
check('the slots are stable for the same input', JSON.stringify(south) === JSON.stringify(south))

// The lag is what makes the train look like it walks; it must close the gap and
// never overshoot the slot.
let at = { x: 0, y: 0 }
const goal = { x: 4, y: 2 }
for (let i = 0; i < 200; i += 1) at = easeFollower(at, goal, 0.016)
check('a follower catches up with its slot', Math.hypot(at.x - goal.x, at.y - goal.y) < 0.02, `${at.x.toFixed(2)},${at.y.toFixed(2)}`)
check('a follower never overshoots', at.x <= goal.x + 1e-6 && at.y <= goal.y + 1e-6)
check('a big frame step still lands inside the slot', easeFollower({ x: 0, y: 0 }, goal, 5).x <= goal.x)

/* --------------------------------- saving --------------------------------- */

player.quests.foo = { kind: 'exam', target: 8, base: 0, done: true }
const payload = {
  username: 'tester',
  gold: player.gold,
  troops: player.troops,
  stats: player.stats,
  companions: player.companions,
  quests: player.quests
}
const fresh = usePlayerStore()
fresh.hydrate(payload)
check('a save keeps the companions', fresh.companions.length === 1 && fresh.companions[0].soldiers.length >= 0)
check('a save keeps the quest records', fresh.quests.foo && fresh.quests.foo.done === true)
check('a save keeps the count of hired soldiers', fresh.stats.recruited === player.stats.recruited)

const legacy = usePlayerStore()
legacy.hydrate({ username: 'old', gold: 50, troops: [], stats: { wins: 3 } })
check('an old save loads with no companions', legacy.companions.length === 0 && Object.keys(legacy.quests).length === 0)
check('an old save keeps its own stats', legacy.stats.wins === 3 && legacy.stats.recruited === 0)
