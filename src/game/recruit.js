/**
 * Recruit lists per settlement.
 *
 * Villages only ever offer basic militia. Towns roll four distinct
 * family-and-rank offers from a weighted pool — low ranks are common, elites
 * are rare — and are seeded per settlement, so a given town keeps the same
 * stock. Every offer is marked up 15% over the recruiting price.
 *
 * A richer town offers better soldiers: every level multiplies the weight of
 * the higher ranks, so a level 4 town sees far more rank 2 and rank 3 troops
 * than a level 1 hamlet.
 */
import { createRng } from './rng'
import { unitCost } from './units'
import { levelOf } from './settlement'

const TOWN_MARKUP = 1.15

/** Town stock pool: one row per family and rank, higher weight = more common. */
const TOWN_POOL = [
  { type: 'spearman', tier: 1, weight: 8 },
  { type: 'archer', tier: 1, weight: 7 },
  { type: 'cavalry', tier: 1, weight: 5 },
  { type: 'spearman', tier: 2, weight: 4.5 },
  { type: 'archer', tier: 2, weight: 4 },
  { type: 'cavalry', tier: 2, weight: 2.6 },
  { type: 'spearman', tier: 3, weight: 2 },
  { type: 'archer', tier: 3, weight: 1.8 },
  { type: 'cavalry', tier: 3, weight: 1.1 },
  { type: 'spearman', tier: 4, weight: 0.7 },
  { type: 'archer', tier: 4, weight: 0.6 },
  { type: 'cavalry', tier: 4, weight: 0.35 }
]

// Offer rows carry the price the settlement sells at, rounded to whole gold.
function offer(type, tier, markup = 1) {
  return { type, tier, cost: Math.round(unitCost(type, tier) * markup) }
}

function weightedPick(rng, pool, bias = 1) {
  // A richer town shifts the weight towards the higher ranks.
  const weights = pool.map((row) => row.weight * Math.pow(bias, row.tier - 1))
  const total = weights.reduce((n, w) => n + w, 0)
  let r = rng.next() * total
  for (let i = 0; i < pool.length; i += 1) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

/** Town stock: four unique family-and-rank offers plus cheap militia. */
export function townRecruitList(settlement, recruitMul = 1) {
  const rng = createRng(settlement.recruitSeed)
  const bias = levelOf(settlement).recruitBias
  const list = []
  let guard = 0
  while (list.length < 4 && guard++ < 60) {
    const pick = weightedPick(rng, TOWN_POOL, bias)
    if (list.some((x) => x.type === pick.type && x.tier === pick.tier)) continue
    list.push(offer(pick.type, pick.tier, TOWN_MARKUP * recruitMul))
  }
  list.push(offer('militia', 1, recruitMul))
  return list
}

export function villageRecruitList(recruitMul = 1) {
  return [offer('militia', 1, recruitMul)]
}

/**
 * The stock of one settlement. `recruitMul` is the difficulty markup: the
 * normal level passes 1 and leaves every price exactly as it shipped.
 */
export function recruitList(settlement, { recruitMul = 1 } = {}) {
  return settlement.kind === 'town' ? townRecruitList(settlement, recruitMul) : villageRecruitList(recruitMul)
}
