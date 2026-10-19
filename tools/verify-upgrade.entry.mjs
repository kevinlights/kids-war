/**
 * Regression checks for the unit upgrade path.
 *
 * The bug these guard against: `upgradesFor()` returned edges without a `type`
 * field, so the store could never match an edge and the upgrade silently did
 * nothing — the militia stayed a militia.
 */
import { createPinia, setActivePinia } from 'pinia'
import { usePlayerStore } from '@/stores/player'
import { BRANCHES, UNIT_TYPES, troopKey, unitCost, upgradeCost, upgradesFor } from '@/game/units'

let failed = 0
let passed = 0

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  ok   ${name}`)
  } else {
    failed += 1
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`)
  }
}

function groupOf(player, type, tier) {
  return player.troops.find((t) => troopKey(t.type, t.tier) === troopKey(type, tier))
}

/** Soldier count of one group, 0 when the group does not exist. */
function countOf(player, type, tier) {
  const group = groupOf(player, type, tier)
  return group ? group.count : 0
}

console.log('upgrade edges')
for (const branch of BRANCHES) {
  const edges = upgradesFor('militia', 1)
  const edge = edges.find((u) => u.type === branch)
  check(`militia -> ${branch} edge exists`, !!edge)
  if (!edge) continue
  check(`militia -> ${branch} edge keeps type`, edge.type === branch, `got ${edge.type}`)
  check(`militia -> ${branch} edge starts at rank 1`, edge.tier === 1, `got ${edge.tier}`)
  check(`militia -> ${branch} edge has a name`, typeof edge.name === 'string' && edge.name.length > 0)
  check(
    `militia -> ${branch} price matches the formula`,
    edge.cost === upgradeCost('militia', 1, branch, 1),
    `edge ${edge.cost} vs formula ${upgradeCost('militia', 1, branch, 1)}`
  )
}
check('militia offers exactly three branches', upgradesFor('militia', 1).length === 3)

for (const family of BRANCHES) {
  for (let tier = 1; tier < 4; tier += 1) {
    const edges = upgradesFor(family, tier)
    check(`${family} rank ${tier} has one edge`, edges.length === 1)
    const edge = edges[0]
    if (!edge) continue
    check(`${family} rank ${tier} edge keeps type`, edge.type === family, `got ${edge.type}`)
    check(`${family} rank ${tier} edge climbs one rank`, edge.tier === tier + 1, `got ${edge.tier}`)
  }
  check(`${family} rank 4 is the top`, upgradesFor(family, 4).length === 0)
}

console.log('store upgrades')
setActivePinia(createPinia())
const player = usePlayerStore()
player.reset('tester')

for (const branch of BRANCHES) {
  // Every branch starts from the same eight militia.
  player.troops = [{ type: 'militia', tier: 1, count: 8 }]
  player.gold = 100000
  const before = countOf(player, 'militia', 1)
  const goldBefore = player.gold
  const res = player.upgradeTroops('militia', 1, branch, 1, 3)
  check(`${branch} upgrade succeeds`, res.ok, res.reason || '')
  if (!res.ok) continue
  const target = groupOf(player, branch, 1)
  check(`${branch} group exists after upgrade`, !!target)
  check(`${branch} count is 3`, target && target.count === 3, `got ${target && target.count}`)
  check(`${branch} is not a militia`, target && target.type === branch, `got ${target && target.type}`)
  check(`militia shrank by 3`, countOf(player, 'militia', 1) === before - 3)
  check(
    `gold dropped by the edge price`,
    player.gold === goldBefore - upgradeCost('militia', 1, branch, 1) * 3,
    `gold ${player.gold} vs expected ${goldBefore - upgradeCost('militia', 1, branch, 1) * 3}`
  )
}

// Rank climb inside a family.
player.troops = [{ type: 'spearman', tier: 1, count: 4 }]
player.gold = 100000
const spearBefore = countOf(player, 'spearman', 1)
const climb = player.upgradeTroops('spearman', 1, 'spearman', 2, 2)
check('spearman rank climb succeeds', climb.ok, climb.reason || '')
const spear2 = groupOf(player, 'spearman', 2)
check('rank 2 group exists', !!spear2)
check('rank 2 group holds 2 soldiers', spear2 && spear2.count === 2, `got ${spear2 && spear2.count}`)
check('rank 1 group shrank', countOf(player, 'spearman', 1) === spearBefore - 2)

// Upgrading the whole group empties and removes the source entry.
player.troops = [{ type: 'militia', tier: 1, count: 4 }]
player.gold = 100000
const all = player.upgradeTroops('militia', 1, 'cavalry', 1, 4)
check('upgrading every soldier succeeds', all.ok, all.reason || '')
check('empty source group is dropped', !groupOf(player, 'militia', 1))
check('target holds every soldier', countOf(player, 'cavalry', 1) === 4)

// Illegal edges are refused.
player.troops = [{ type: 'militia', tier: 1, count: 4 }]
player.gold = 100000
check('militia cannot jump to rank 3', !player.upgradeTroops('militia', 1, 'cavalry', 3, 1).ok)
check('militia cannot become a spearman rank 2', !player.upgradeTroops('militia', 1, 'spearman', 2, 1).ok)
check('unknown family is refused', !player.upgradeTroops('militia', 1, 'dragon', 1, 1).ok)
check('too few soldiers are refused', !player.upgradeTroops('militia', 1, 'archer', 1, 9).ok)
check('refused upgrades keep the militia', countOf(player, 'militia', 1) === 4)

// The panel hands the store whatever the edge carries, so replay that exact
// path: pick the row the panel would render and feed `edge.type` / `edge.tier`
// back into the store.
for (const branch of BRANCHES) {
  player.troops = [{ type: 'militia', tier: 1, count: 4 }]
  player.gold = 100000
  const edge = upgradesFor('militia', 1).find((u) => u.name.includes(UNIT_TYPES[branch].name))
  check(`panel row for ${branch} exists`, !!edge)
  if (!edge) continue
  const goldBefore = player.gold
  const res = player.upgradeTroops('militia', 1, edge.type, edge.tier, 1)
  check(`panel path upgrades into ${branch}`, res.ok, res.reason || '')
  const target = groupOf(player, branch, 1)
  check(`panel path writes a ${branch} soldier`, target && target.count === 1, JSON.stringify(player.troops))
  check(
    `panel path charges the real price`,
    res.ok && goldBefore - player.gold === edge.cost,
    `paid ${goldBefore - player.gold}, expected ${edge.cost}`
  )
  check(
    'panel path leaves no soldier with an empty family',
    player.troops.every((t) => typeof t.type === 'string' && t.type.length > 0),
    JSON.stringify(player.troops)
  )
  check(
    'panel path does not leave the soldiers as militia',
    countOf(player, 'militia', 1) === 3,
    `militia left ${countOf(player, 'militia', 1)}`
  )
}

// Not enough gold must not consume the soldiers.
player.troops = [{ type: 'militia', tier: 1, count: 4 }]
player.gold = 0
const broke = player.upgradeTroops('militia', 1, 'archer', 1, 1)
check('broke lords cannot upgrade', !broke.ok)
check('broke lords keep their soldiers', countOf(player, 'militia', 1) === 4)

// Every stored group must name a real family.
player.troops = [{ type: 'militia', tier: 1, count: 3 }]
player.gold = 100000
for (const branch of BRANCHES) {
  player.upgradeTroops('militia', 1, branch, 1, 1)
}
check(
  'no group has an undefined family',
  player.troops.every((t) => typeof t.type === 'string' && !!UNIT_TYPES[t.type]),
  JSON.stringify(player.troops)
)
check('roster shows the three families', player.roster.length === 3, `got ${player.roster.length}`)

// The price ladder must stay cheaper than buying the elite outright.
const ladder = BRANCHES.reduce((sum, family) => {
  let total = 0
  for (let tier = 1; tier < 4; tier += 1) total += upgradeCost(family, tier, family, tier + 1)
  return sum + total
}, 0)
const elite = BRANCHES.reduce((sum, family) => sum + unitCost(family, 4), 0)
check('climbing the ladder is cheaper than the elite price', ladder < elite, `${ladder} vs ${elite}`)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
