/**
 * Player state: identity, treasury, warband roster and progress stats.
 *
 * A warband entry is `{ type, tier, count, hp }`: the family, its rank (1-4),
 * how many soldiers of that exact group the lord fields and the hit points
 * each of them still has.
 */
import { defineStore } from 'pinia'
import {
  troopKey,
  unitDef,
  unitWage,
  upgradeCost,
  upgradesFor,
  normalizeTroops,
  healTroops,
  woundedCount,
  warbandHealth
} from '@/game/units'
import { MEMORY, applyForgetting, levelFor, updateProgress, weightFor } from '@/game/quiz/scheduler'

/** The warband every new lord starts with. */
function startingTroops() {
  const hp = unitDef('militia', 1).hp
  return [{ type: 'militia', tier: 1, count: 8, hp: new Array(8).fill(hp) }]
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    username: '',
    gold: 120,
    troops: startingTroops(),
    // simple supply counters used by the market screens
    supplies: { food: 5, horse: 0 },
    stats: { days: 1, battles: 0, wins: 0, exams: 0, correct: 0 },
    // Memory curve bookkeeping: question key → { level, right, wrong, lastSeen }.
    questionStats: {},
    gradePref: 3
  }),

  getters: {
    totalTroops: (s) => s.troops.reduce((n, t) => n + t.count, 0),
    // Sum of wages paid each day; used for flavour and the upkeep readout.
    dailyWage: (s) => s.troops.reduce((n, t) => n + unitWage(t.type, t.tier) * t.count, 0),
    hasWarband: (s) => s.troops.some((t) => t.count > 0),
    // Soldiers that are still wounded: they fight at reduced health.
    wounded: (s) => woundedCount(s.troops),
    // Average health of the warband in percent, for the roster readout.
    health: (s) => warbandHealth(s.troops),
    // Memory-curve weight of one question key (0.05 … 1.0).
    questionWeight: (s) => (key) => weightFor(s.questionStats[key]),
    questionLevel: (s) => (key) => levelFor(s.questionStats[key]),
    // How much of the bank is mastered: tracked questions and those at level 4+.
    memorySummary: (s) => {
      const entries = Object.values(s.questionStats)
      return {
        tracked: entries.length,
        mastered: entries.filter((p) => p.level >= MEMORY.MAX_LEVEL - 1).length
      }
    },
    /**
     * Roster rows for the panels: full rank-scaled stats per group, sorted by
     * family order then rank so the list does not jump around while upgrading.
     */
    roster: (s) =>
      s.troops
        .filter((t) => t.count > 0)
        .map((t) => {
          const def = unitDef(t.type, t.tier)
          const maxHp = def.hp
          const hurt = (t.hp || []).filter((v) => v < maxHp).length
          return {
            ...def,
            key: troopKey(t.type, t.tier),
            count: t.count,
            wounded: hurt,
            wageTotal: def.wage * t.count
          }
        })
        .sort((a, b) => a.key.localeCompare(b.key) || b.tier - a.tier)
  },

  actions: {
    reset(username) {
      this.username = username
      this.gold = 120
      this.troops = startingTroops()
      this.supplies = { food: 5, horse: 0 }
      this.stats = { days: 1, battles: 0, wins: 0, exams: 0, correct: 0 }
      this.questionStats = {}
      this.gradePref = 3
    },

    // Hydrate from a stored save payload, migrating pre-standard rosters.
    hydrate(data) {
      this.username = data.username
      this.gold = data.gold ?? 120
      // An empty array is a real state (the warband was wiped) and is kept.
      this.troops = Array.isArray(data.troops) ? normalizeTroops(data.troops) : startingTroops()
      this.supplies = data.supplies ?? { food: 5, horse: 0 }
      this.stats = data.stats ?? { days: 1, battles: 0, wins: 0, exams: 0, correct: 0 }
      // Older saves have no memory records yet, which is a valid empty state.
      this.questionStats = data.questionStats && typeof data.questionStats === 'object' ? data.questionStats : {}
    },

    addGold(n) {
      this.gold = Math.max(0, this.gold + n)
    },

    spendGold(n) {
      if (this.gold < n) return false
      this.gold -= n
      return true
    },

    addTroops(type, tier, count) {
      const key = troopKey(type, tier)
      const maxHp = unitDef(type, tier).hp
      const entry = this.troops.find((t) => troopKey(t.type, t.tier) === key)
      if (entry) {
        entry.count += count
        entry.hp = (entry.hp || []).concat(new Array(count).fill(maxHp))
      } else {
        this.troops.push({ type, tier, count, hp: new Array(count).fill(maxHp) })
      }
    },

    // Remove up to `count` soldiers of one group. Returns how many were removed.
    removeTroops(type, tier, count) {
      const key = troopKey(type, tier)
      const entry = this.troops.find((t) => troopKey(t.type, t.tier) === key)
      if (!entry) return 0
      const removed = Math.min(entry.count, count)
      entry.count -= removed
      // The wounded go first: a dead or healed-away slot is worth less than a
      // healthy one, so the roster keeps the best soldiers it can.
      if (removed > 0) {
        const hp = entry.hp || []
        const kept = []
        let toDrop = removed
        for (let i = hp.length - 1; i >= 0 && toDrop > 0; i -= 1) {
          const maxHp = unitDef(entry.type, entry.tier).hp
          if (hp[i] < maxHp) {
            hp.splice(i, 1)
            toDrop -= 1
          }
        }
        while (toDrop > 0 && hp.length) {
          hp.pop()
          toDrop -= 1
        }
        entry.hp = hp
      }
      this.troops = this.troops.filter((t) => t.count > 0)
      return removed
    },

    /** Heal the wounded by `amount` hit points per soldier. */
    heal(amount) {
      healTroops(this.troops, amount)
    },

    /**
     * Promote `count` soldiers along one edge of the upgrade tree. The edge
     * must exist (`upgradesFor`), the soldiers must be present and the lord
     * must be able to afford it.
     *
     * Everything after the lookup uses the matched edge rather than the raw
     * arguments, so the store can only ever write a family and rank that the
     * tree really sells.
     */
    upgradeTroops(fromType, fromTier, toType, toTier, count) {
      const edge = upgradesFor(fromType, fromTier).find((u) => u.type === toType && u.tier === toTier)
      if (!edge) return { ok: false, reason: '不可升级' }
      const key = troopKey(fromType, fromTier)
      const entry = this.troops.find((t) => troopKey(t.type, t.tier) === key)
      if (!entry || entry.count < count) return { ok: false, reason: '兵员不足' }
      const cost = upgradeCost(fromType, fromTier, edge.type, edge.tier) * count
      if (this.gold < cost) return { ok: false, reason: '金币不足' }
      this.gold -= cost
      // The promoted soldiers leave the old group (and its hit points with it)
      // and join the new rank at full health: a promotion means new gear.
      const maxHp = unitDef(entry.type, entry.tier).hp
      const sourceHp = entry.hp || []
      entry.hp = sourceHp.slice(count)
      while (entry.hp.length < entry.count - count) entry.hp.push(maxHp)
      entry.count -= count
      if (entry.count === 0) this.troops = this.troops.filter((t) => t.count > 0)
      this.addTroops(edge.type, edge.tier, count)
      return { ok: true, cost }
    },

    // Fold one answered question into the memory curve.
    recordAnswer(itemKey, correct, now = Date.now()) {
      if (!itemKey) return
      this.questionStats[itemKey] = updateProgress(this.questionStats[itemKey], correct, now)
    },

    // Run the forgetting pass before a paper is drawn, so questions left alone
    // for a long time come back.
    applyQuestionForgetting(now = Date.now()) {
      applyForgetting(this.questionStats, now)
    },

    // Keep the save tidy: drop the least recently seen records past `max`.
    pruneQuestionStats(max = 1200) {
      const keys = Object.keys(this.questionStats)
      if (keys.length <= max) return
      keys
        .sort((a, b) => (this.questionStats[b].lastSeen || 0) - (this.questionStats[a].lastSeen || 0))
        .slice(max)
        .forEach((key) => delete this.questionStats[key])
    }
  }
})
