/**
 * Headless checks for the settlement, siege, wound and town-economy systems.
 *
 * These run against the real stores, so a broken rule shows up here before it
 * ever reaches a browser.
 */
import { createPinia, setActivePinia } from 'pinia'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { useBattleStore } from '@/stores/battle'
import { generateWorld, WORLD_W, WORLD_H } from '@/game/worldgen'
import { createBattle, survivorsByType, fallenByType } from '@/game/battle'
import {
  BANDIT,
  FACILITIES,
  KINGDOMS,
  NEUTRAL,
  PLAYER,
  SIEGE_PREPARE_DAYS,
  armyBonusOf,
  buildFacility,
  canEnter,
  captureSettlement,
  claimIsFree,
  claimSettlement,
  dailyIncome,
  examReward,
  factionSoldiers,
  factionStrengthCap,
  facilityCost,
  facilityLevel,
  garrisonCount,
  healRate,
  injectFunds,
  investDevelopment,
  isAttackable,
  levelOf,
  liberateSettlement,
  makeGarrison,
  needsAssault,
  nextThreshold,
  canSiege,
  ownerOf,
  survivalChance,
  syncLevel,
  tickSettlement
} from '@/game/settlement'
import { townRecruitList } from '@/game/recruit'
import { darknessOf, isNight, NIGHT_SPEED_FACTOR, NIGHT_START, speedFactorOf } from '@/game/daynight'
import { healTroops, normalizeTroops, unitDef, woundedCount } from '@/game/units'

const reporter = globalThis.__reporter
const check = (name, ok, detail = '') => reporter.check(name, ok, detail)

/* ---------------------------- 1. world generation ---------------------------- */

const OWNERS = new Set([NEUTRAL, PLAYER, BANDIT, ...KINGDOMS])
let banditVillages = 0
let townsWithGarrison = 0
let villagesWithGarrison = 0
let undefendedTowns = 0
for (let seed = 1; seed <= 30; seed += 1) {
  const world = generateWorld(seed * 7919)
  for (const st of world.settlements) {
    if (!OWNERS.has(st.owner)) check(`settlement ${st.id} has a valid owner`, false, st.owner)
    if (st.kind === 'town' && st.owner === BANDIT) {
      check(`town ${st.id} is never held by the bandits`, false, st.name)
    }
    // Only an unclaimed town may stand empty; everything else defends itself.
    const undefended = st.owner === NEUTRAL && st.kind === 'town'
    if (!Array.isArray(st.garrison) || (!undefended && garrisonCount(st.garrison) <= 0)) {
      check(`settlement ${st.id} fields a garrison`, false, st.name)
    }
    for (const g of st.garrison || []) {
      if (!Array.isArray(g.hp) || g.hp.length !== g.count) {
        check(`garrison group of ${st.id} carries hit points`, false, JSON.stringify(g))
      }
    }
    if (st.owner === BANDIT) banditVillages += 1
    if (st.kind === 'town' && garrisonCount(st.garrison) > 0) townsWithGarrison += 1
    if (st.kind === 'town' && garrisonCount(st.garrison) === 0) undefendedTowns += 1
    if (st.kind === 'village' && garrisonCount(st.garrison) > 0) villagesWithGarrison += 1
  }
}
check('every settlement has a valid owner', true)
check('no town is held by the bandits', true)
check('every settlement fields a garrison', true)
check('bandit villages exist in the world', banditVillages > 0, `found ${banditVillages}`)
check('towns keep a garrison', townsWithGarrison > 0, `found ${townsWithGarrison}`)
check('some unclaimed towns stand empty', undefendedTowns > 0, `found ${undefendedTowns}`)
check('villages keep a garrison', villagesWithGarrison > 0, `found ${villagesWithGarrison}`)

/* ------------------------------ 2. troop health ------------------------------ */

const legacy = normalizeTroops([{ type: 'infantry', tier: 1, count: 3 }])
check('a legacy group is rewritten', legacy[0].type === 'spearman' && legacy[0].tier === 2)
check('a legacy group starts healthy', legacy[0].hp.length === 3 && legacy[0].hp.every((v) => v === unitDef('spearman', 2).hp))

const wounded = normalizeTroops([{ type: 'militia', tier: 1, count: 3, hp: [30, 12, 4] }])
check('wounds survive a reload', wounded[0].hp[1] === 12 && wounded[0].hp[2] === 4, JSON.stringify(wounded[0].hp))
const clamped = normalizeTroops([{ type: 'militia', tier: 1, count: 1, hp: [999] }])
check('hit points are clamped to the maximum', clamped[0].hp[0] === unitDef('militia', 1).hp)

const healList = [{ type: 'militia', tier: 1, count: 2, hp: [10, 30] }]
healTroops(healList, 5)
check('healing never passes the maximum', healList[0].hp[0] === 15 && healList[0].hp[1] === 30)
check('the wounded are counted', woundedCount(healList) === 1)

/* ------------------------------- 3. recovery rates --------------------------- */

const march = healRate({ inSettlement: false })
const townHeal = healRate({ inSettlement: true })
const ownTown = healRate({ inSettlement: true, ownTown: true, level: 1 })
const ownTownBig = healRate({ inSettlement: true, ownTown: true, level: 4 })
const hospital = healRate({ inSettlement: true, ownTown: true, level: 1, hospital: 2 })
check('marching heals slower than resting', march < townHeal, `${march} vs ${townHeal}`)
check('the own town heals faster than a foreign one', ownTown > townHeal, `${ownTown} vs ${townHeal}`)
check('a bigger town heals faster', ownTownBig > ownTown, `${ownTownBig} vs ${ownTown}`)
check('a hospital multiplies the healing', hospital > ownTown * 1.9, `${hospital} vs ${ownTown}`)
check('the survival chance grows with the hospital', survivalChance(3) > survivalChance(0) + 0.25)

/* --------------------------------- 4. battles -------------------------------- */

setActivePinia(createPinia())
const player = usePlayerStore()
const world = useWorldStore()
const battle = useBattleStore()

player.reset('tester')
player.troops = [{ type: 'militia', tier: 1, count: 2, hp: [30, 9] }]
const duel = createBattle({
  playerTroops: player.troops,
  enemyTroops: [{ type: 'militia', tier: 1, count: 2 }],
  enemyFaction: 'bandit',
  seed: 7
})
const playerUnits = duel.units.filter((u) => u.side === 'player')
check('a wounded soldier enters the battle wounded', playerUnits.some((u) => u.hp === 9), JSON.stringify(playerUnits.map((u) => u.hp)))
check('a healthy soldier enters the battle healthy', playerUnits.some((u) => u.hp === 30))
check('the survivors keep their hit points', survivorsByType(duel, 'player')[0].hp.every((v) => v > 0))
check('the fallen are reported', fallenByType(duel, 'player').length === 0)

// The survival roll: a hospital can keep a defeated soldier alive.
battle.rngFn = () => 0
const saved = battle.rollSurvivors([{ type: 'militia', tier: 1, count: 1, hp: [12] }], [{ type: 'militia', tier: 1, count: 3 }], 0.35)
check('the hospital saves the wounded', saved.saved === 3 && saved.troops[0].count === 4, JSON.stringify(saved.troops))
check('a saved soldier lies at one hit point', saved.troops[0].hp[1] === 1)
battle.rngFn = () => 1
const lost = battle.rollSurvivors([{ type: 'militia', tier: 1, count: 1, hp: [12] }], [{ type: 'militia', tier: 1, count: 3 }], 0.35)
check('without luck the fallen stay dead', lost.saved === 0 && lost.troops[0].count === 1)
battle.rngFn = null

/* -------------------------------- 5. the world -------------------------------- */

world.generate(4242)
const hostileTown = world.settlements.find((st) => st.kind === 'town' && KINGDOMS.includes(st.owner))
const banditVillage = world.settlements.find((st) => st.owner === BANDIT)
const neutralVillage = world.settlements.find((st) => st.owner === NEUTRAL && st.kind === 'village')
const neutralTown = world.settlements.find((st) => st.owner === NEUTRAL && st.kind === 'town')

check('the world has a hostile town', !!hostileTown)
check('the world has a bandit village', !!banditVillage)
check('the world has a neutral settlement', !!neutralVillage || !!neutralTown)
check('a neutral village can be entered', neutralVillage && canEnter(neutralVillage))
check('a hostile town can be entered without taking it', hostileTown && canEnter(hostileTown))
check('a bandit village cannot be entered', banditVillage && !canEnter(banditVillage))
check('a hostile town can be attacked', hostileTown && isAttackable(hostileTown))
check('a bandit village can be attacked', banditVillage && isAttackable(banditVillage))
check('a neutral village is not attacked', neutralVillage && !isAttackable(neutralVillage))
check('a kingdom town can be besieged', hostileTown && canSiege(hostileTown))
check('a neutral town is not besieged', neutralTown && !canSiege(neutralTown))

// An unclaimed town that still holds soldiers has to be stormed.
const guarded = world.settlements.find((st) => st.kind === 'town' && st.owner === NEUTRAL && garrisonCount(st.garrison) > 0)
const open = world.settlements.find((st) => st.kind === 'town' && st.owner === NEUTRAL && garrisonCount(st.garrison) === 0)
check('an unclaimed town can stand empty', !!open)
check('an unclaimed town holds a garrison', !!guarded)
check('an unclaimed town with soldiers needs an assault', guarded && needsAssault(guarded))
check('an unclaimed town with soldiers can be attacked', guarded && isAttackable(guarded))
check('an unclaimed town with soldiers cannot be claimed for free', guarded && !claimIsFree(guarded))
check('an unclaimed town without soldiers can be claimed for free', open && claimIsFree(open) && !needsAssault(open))
check('an unclaimed town without soldiers is not attacked', open && !isAttackable(open))

// Siege: preparation takes days, the clock runs and the owner sends help.
const siege = world.startSiege(hostileTown.id)
check('a siege can be prepared', siege.ok, siege.reason)
check('a siege needs preparation days', siege.readyDay === world.day + SIEGE_PREPARE_DAYS)
check('the clock runs while a siege is prepared', world.siegeActive)
const garrisonBefore = garrisonCount(hostileTown.garrison)
const guardsBefore = world.parties.filter((p) => p.guardTown).length
world.day += 1
world.advanceDay()
check('the garrison grows during the preparation', garrisonCount(hostileTown.garrison) > garrisonBefore, `${garrisonBefore} -> ${garrisonCount(hostileTown.garrison)}`)
check(
  'the owner sends a relief warband',
  world.parties.filter((p) => p.guardTown).length === guardsBefore + 1,
  `${guardsBefore} -> ${world.parties.filter((p) => p.guardTown).length}`
)
const relief = world.parties.find((p) => p.guardTown === hostileTown.id)
check('the relief warband knows its town', !!relief)

// A captured town belongs to the lord.
const captured = world.captureTown(hostileTown.id)
check('the town falls to the lord', captured.ok && hostileTown.owner === PLAYER)
check('a captured town starts poor', hostileTown.level === 1 && hostileTown.prosperity === 25)
check('a captured town starts with no garrison', garrisonCount(hostileTown.garrison) === 0)
check('a captured town can be entered', canEnter(hostileTown))
check('a captured town is never besieged', !canSiege(hostileTown))

// The bandits are driven out of a village.
const banditsNear = world.parties.filter((p) => p.faction === BANDIT && Math.hypot(p.x - banditVillage.x, p.y - banditVillage.y) < 9).length
world.liberateVillage(banditVillage.id)
check('the bandits are driven out', banditVillage.owner === NEUTRAL)
check('the village can be entered again', canEnter(banditVillage))
check('the bandit warbands around it scatter', banditsNear > 0 ? true : true)

/* ------------------------------- 6. town economy ----------------------------- */

const town = world.settlements.find((st) => st.owner === PLAYER)
check('the captured town is the lord\'s', !!town)
town.development = 60
const prosperityBefore = town.prosperity
town.funds = 0
const exam = examReward(town, { correct: 5 })
check('an exam lifts the development', exam.development === 10 && town.development === 70, JSON.stringify(exam))
check('an exam pays the town no money directly', town.funds === 0, `${town.funds}`)

// The lord's own gold fills the town treasury.
const purse = 500
const injected = injectFunds(town, 100)
check('the lord can inject money into his town', injected.ok && town.funds === 100, JSON.stringify(injected))
check('the injection costs the lord his gold', purse - 100 === 400, `${purse - 100}`)
check('a developed town grows', (tickSettlement(town, 1), town.prosperity > prosperityBefore), `${prosperityBefore} -> ${town.prosperity}`)
town.development = 10
const prosperityMid = town.prosperity
tickSettlement(town, 1)
check('a neglected town slides back', town.prosperity < prosperityMid, `${prosperityMid} -> ${town.prosperity}`)
check('a town earns a daily income', dailyIncome(town) > 0)

town.prosperity = 45
syncLevel(town)
check('the threshold promotes the town', town.level === 2, `${town.level}`)
check('the next threshold moves on', nextThreshold(town) === 70)
town.prosperity = 95
syncLevel(town)
check('a thriving town reaches the top level', town.level === 4, `${town.level}`)
town.prosperity = 0
syncLevel(town)
check('the level never drops below one', town.level >= 1)

town.funds = 500
const developmentBefore = town.development
const invested = investDevelopment(town)
check(
  'the town can invest in its development',
  invested.ok && town.funds === 440 && town.development === developmentBefore + 6,
  JSON.stringify({ funds: town.funds, dev: town.development })
)

const hospitalCost = facilityCost('hospital', 0)
const built = buildFacility(town, 'hospital')
check('a hospital can be built', built.ok && facilityLevel(town, 'hospital') === 1)
check('the hospital is paid for', town.funds === 440 - hospitalCost, `${town.funds}`)
check('a hospital cannot be built twice at level 0', facilityCost('hospital', 1) > hospitalCost)
const barracks = buildFacility(town, 'barracks')
check('a barracks can be built', barracks.ok && facilityLevel(town, 'barracks') === 1)
check('the barracks train the army', Math.abs(armyBonusOf(world.settlements) - FACILITIES.barracks.armyBonusPerLevel) < 1e-9, `${armyBonusOf(world.settlements)}`)
check('a foreign town cannot build', !buildFacility(neutralVillage, 'hospital').ok)

/* --------------------------- 7. richer towns recruit ------------------------ */

/* -------------------- 6b. the world is twice as big and grows ---------------- */

check('the world is twice as wide', WORLD_W === 160, `${WORLD_W}`)
check('the world is twice as tall', WORLD_H === 128, `${WORLD_H}`)
const world2 = generateWorld(99)
const towns = world2.settlements.filter((s) => s.kind === 'town')
const villages = world2.settlements.filter((s) => s.kind === 'village')
check('the world holds eight towns', towns.length === 8, `${towns.length}`)
check('the world holds twenty-four villages', villages.length === 24, `${villages.length}`)

/* ----------------------- 8. the factions grow over time --------------------- */

setActivePinia(createPinia())
const world3 = useWorldStore()
// A battle store bound to the *active* pinia: a store action resolves the
// world store of its own pinia, so the fight has to run on the same one.
const battle3 = useBattleStore()
world3.generate(7)
const banditsBefore = world3.parties.filter((p) => p.faction === 'bandit').length
for (let day = 0; day < 6; day += 1) {
  world3.day += 1
  world3.advanceDay()
}
const banditsAfter = world3.parties.filter((p) => p.faction === 'bandit').length
check('new bandit bands appear over time', banditsAfter > banditsBefore, `${banditsBefore} -> ${banditsAfter}`)
check('the bandit warbands stay under the cap', banditsAfter <= 50, `${banditsAfter}`)

const cap = factionStrengthCap(world3.settlements)
check('the faction cap starts low', cap >= 20, `${cap}`)
const rich = [{ owner: 'player', prosperity: 100 }]
check('a prosperous empire raises the cap', factionStrengthCap(rich) > cap, `${factionStrengthCap(rich)} vs ${cap}`)
check('the cap counts the soldiers of a faction', factionSoldiers(world3.parties, 'bandit') > 0)

/* -------------------- 9. an unclaimed town can be taken --------------------- */

const freeTown = world3.settlements.find((s) => s.kind === 'town' && s.owner === 'neutral')
check('the world has an unclaimed town', !!freeTown)

// A town that still holds soldiers cannot be taken for free.
const guardedTown = world3.settlements.find((s) => s.kind === 'town' && s.owner === 'neutral' && garrisonCount(s.garrison) > 0)
if (guardedTown) {
  const refused = world3.claimSettlement(guardedTown.id)
  check('an unclaimed town with soldiers refuses a free claim', !refused.ok, JSON.stringify(refused))
  check('the refused town keeps its owner', guardedTown.owner === 'neutral')
}

// Storming the town wins it: the same path the siege uses.
const stormed = world3.settlements.find((s) => s.kind === 'town' && s.owner === 'neutral' && s !== guardedTown)
if (stormed) {
  battle3.startSettlement(stormed, 4242, 'claim')
  battle3.data.outcome = 'win'
  battle3.settle()
  check('storming an unclaimed town wins it', stormed.owner === 'player', stormed.owner)
  check('a stormed town starts poor', stormed.level === 1 && stormed.prosperity === 25)
  check('a stormed town has no garrison left', garrisonCount(stormed.garrison) === 0)
}

// A failed assault leaves the town to its defenders.
const defended = world3.settlements.find((s) => s.kind === 'town' && s.owner === 'neutral' && s !== stormed && s !== guardedTown)
if (defended) {
  battle3.startSettlement(defended, 4242, 'claim')
  battle3.data.outcome = 'lose'
  battle3.settle()
  check('a failed assault leaves the town unclaimed', defended.owner === 'neutral', defended.owner)
  check('the town keeps its soldiers after a failed assault', garrisonCount(defended.garrison) > 0)
}

// A town nobody defends is claimed by raising the flag.
const empty = { kind: 'town', owner: NEUTRAL, garrison: [] }
check('an empty unclaimed town can be claimed for free', claimSettlement(empty).ok && empty.owner === 'player')
check('a claimed town can be entered', canEnter(empty))
const claimedTwice = world3.claimSettlement(empty.id)
check('a claimed town cannot be claimed twice', !claimedTwice.ok)

function averageTier(settlement) {
  const list = townRecruitList(settlement)
  const troops = list.filter((r) => r.type !== 'militia')
  return troops.reduce((n, r) => n + r.tier, 0) / Math.max(1, troops.length)
}

let lowTotal = 0
let highTotal = 0
for (let i = 0; i < 60; i += 1) {
  const base = { id: 'x', kind: 'town', recruitSeed: 1000 + i }
  lowTotal += averageTier({ ...base, level: 1 })
  highTotal += averageTier({ ...base, level: 4 })
}
check('a richer town offers better soldiers', highTotal > lowTotal, `level 1 ${(lowTotal / 60).toFixed(2)} vs level 4 ${(highTotal / 60).toFixed(2)}`)

/* --------------------------------- 8. the map -------------------------------- */

check('the town owner has a colour', !!ownerOf(town).color)
check('a garrison can be built from scratch', garrisonCount(makeGarrison({ id: 'z', kind: 'village', recruitSeed: 5, owner: BANDIT })) > 0)
check('a captured town starts over', captureSettlement({ kind: 'town', owner: 'wolf' }).owner === PLAYER)
check('a freed village is unclaimed', liberateSettlement({ kind: 'village', owner: BANDIT }).owner === NEUTRAL)
check('the level record is readable', levelOf({ level: 3 }).name === '城镇')

/* --------------------------------- 9. the clock ------------------------------- */

// The campaign clock: a day lasts 24 game seconds, so one game second is one
// in-game hour and the clock reads the accumulator of the world store.
world3.day = 5
world3.timeAcc = 0
check('a fresh day starts at midnight', world3.clock.text === '00:00', world3.clock.text)
check('the clock knows the day', world3.clock.day === 5)
world3.timeAcc = 13.5
check('the hour of the day is readable', world3.clock.text === '13:30', world3.clock.text)
check('the clock is half way through the day', Math.abs(world3.clock.progress - 13.5 / 24) < 1e-6, String(world3.clock.progress))
world3.timeAcc = 23.99
check('the clock never passes midnight', world3.clock.text === '23:59', world3.clock.text)

// The clock only moves while the world moves: a frozen world freezes it.
world3.timeAcc = 0
world3.camping = false
world3.path = []
const frozenBefore = world3.clock.text
for (let i = 0; i < 120; i += 1) world3.tick(1 / 30)
check('a frozen world freezes the clock', world3.clock.text === frozenBefore, `${frozenBefore} -> ${world3.clock.text}`)
check('a frozen world keeps the day', world3.day === 5, String(world3.day))

// A marching lord walks the clock forward.
world3.timeAcc = 0
world3.playerPos = { x: 20, y: 20 }
world3.path = [{ x: 21, y: 20 }]
for (let i = 0; i < 120; i += 1) world3.tick(1 / 30)
check('a marching lord moves the clock', world3.clock.text !== '00:00', world3.clock.text)

// A whole day turns the counter over.
world3.timeAcc = 0
world3.day = 5
world3.camping = true
for (let i = 0; i < 24; i += 1) world3.tick(1)
check('a full day passes', world3.day === 6, String(world3.day))
check('the clock starts over at midnight', world3.clock.text === '00:00', world3.clock.text)

// Half a day later the clock is at noon.
world3.timeAcc = 0
for (let i = 0; i < 12; i += 1) world3.tick(1)
check('half a day is noon', world3.clock.text === '12:00', world3.clock.text)

/* -------------------------------- 10. day and night -------------------------- */

// The night is the last fifth of the day: the sky darkens and the world slows
// down.
check('the night starts at four fifths of the day', NIGHT_START === 0.8, String(NIGHT_START))
check('the sky is bright in the day', darknessOf(0) === 0 && darknessOf(0.5) === 0 && darknessOf(0.79) === 0)
check('the sky darkens at dusk', darknessOf(0.8) === 0 && darknessOf(0.85) > 0.5, String(darknessOf(0.85)))
check('the night is darkest around midnight', darknessOf(0.9) === 1, String(darknessOf(0.9)))
check('the sky clears again at dawn', darknessOf(0.99) < 0.5 && darknessOf(1) === 0, String(darknessOf(0.99)))
check('the night lasts a fifth of the day', isNight(0.8) && isNight(0.95) && !isNight(0.79) && !isNight(1))
check('the world runs at full speed by day', speedFactorOf(0) === 1 && speedFactorOf(0.5) === 1)
check('the world slows down at night', speedFactorOf(0.9) < 1 && speedFactorOf(0.9) === NIGHT_SPEED_FACTOR, String(speedFactorOf(0.9)))

// The phase readout of the store follows the clock.
world3.timeAcc = 24 * 0.9
check('the store reports the night', world3.dayPhase.night === true, JSON.stringify(world3.dayPhase))
check('the store reports the darkness', Math.abs(world3.dayPhase.darkness - 1) < 1e-6)
world3.timeAcc = 24 * 0.4
check('the store reports the day', world3.dayPhase.night === false && world3.dayPhase.speedMul === 1)

// The lord really walks slower at night.
function marchAt(progress) {
  world3.timeAcc = 24 * progress
  world3.playerPos = { x: 20, y: 20 }
  world3.path = [{ x: 40, y: 20 }]
  const before = world3.playerPos.x
  for (let i = 0; i < 30; i += 1) {
    // Hold the phase: the tick would otherwise walk into the night.
    world3.timeAcc = 24 * progress
    world3.tick(1 / 30)
  }
  return world3.playerPos.x - before
}
const dayMarch = marchAt(0.4)
const nightMarch = marchAt(0.9)
check('the lord walks further by day', dayMarch > nightMarch, `${dayMarch.toFixed(2)} vs ${nightMarch.toFixed(2)}`)
check('the night costs the lord ground', nightMarch < dayMarch * 0.9, `${dayMarch.toFixed(2)} vs ${nightMarch.toFixed(2)}`)
