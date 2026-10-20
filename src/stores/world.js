// World state: terrain, settlements, roaming parties and the player's map position.
import { defineStore } from 'pinia'
import { generateWorld, WORLD_W, WORLD_H, TILE } from '@/game/worldgen'
import { TERRAIN } from '@/game/terrain'
import { findPath } from '@/game/pathfinding'
import { factionOf, NPC_FACTIONS } from '@/game/factions'
import { darknessOf, isNight, speedFactorOf } from '@/game/daynight'
import { normalizeTroops, healTroops, unitDef } from '@/game/units'
import { createRng } from '@/game/rng'
import {
  BANDIT,
  NEUTRAL,
  PLAYER,
  SIEGE_PREPARE_DAYS,
  SIEGE_GARRISON_PER_DAY,
  armyBonusOf,
  captureSettlement,
  claimSettlement,
  facilityLevel,
  factionSoldiers,
  factionStrengthCap,
  garrisonCount,
  healRate,
  liberateSettlement,
  normalizeSettlement,
  ownerOf,
  tickSettlement
} from '@/game/settlement'
import { usePlayerStore } from './player'

/** How many bandit warbands may roam the map at the same time. */
const BANDIT_PARTY_CAP = 50

/** Soldiers a warband fields. */
function partyStrength(p) {
  return (p.units || []).reduce((n, g) => n + g.count, 0)
}

/** Add soldiers to a warband, topped up to full health. */
function addTroopToParty(party, type, tier, count) {
  const hp = unitDef(type, tier).hp
  const found = party.units.find((g) => g.type === type && g.tier === tier)
  if (found) {
    found.count += count
    found.hp = (found.hp || []).concat(new Array(count).fill(hp))
  } else {
    party.units.push({ type, tier, count, hp: new Array(count).fill(hp) })
  }
}

// Terrain accessor used both by pathfinding and by party wandering.
function terrainCost(grid, x, y) {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return { walkable: false, cost: 99 }
  const t = TERRAIN[grid[y][x]]
  if (!t) return { walkable: false, cost: 99 }
  return { walkable: t.walkable, cost: t.cost }
}

export const useWorldStore = defineStore('world', {
  state: () => ({
    seed: 0,
    grid: [],
    settlements: [],
    parties: [],
    playerPos: { x: 0, y: 0 },
    path: [],
    camX: 0,
    camY: 0,
    // Size of the world map viewport in screen pixels, published every frame by
    // WorldMap so the minimap can outline what the big map is looking at.
    viewW: 0,
    viewH: 0,
    day: 1,
    timeAcc: 0,
    // True while the lord has pitched camp: the clock keeps running even
    // though the lord stands still.
    camping: false,
    // Set every tick: game time only advances while the lord travels or camps,
    // so the HUD can show whether the clock is live.
    timeFlowing: false,
    encounter: null, // { partyId, faction } set when a hostile party reaches the player
    cooldown: {}, // partyId -> remaining seconds before it can fight again
    visited: [],
    // Settlement the lord is resting in: wounds heal faster and the town keeps
    // developing while he stays.
    restingAt: null
  }),

  getters: {
    // Settlement the player is standing on, if any (within ~1.4 tiles).
    nearbySettlement(s) {
      let best = null
      let bestD = 1.4
      for (const st of s.settlements) {
        const d = Math.hypot(st.x - s.playerPos.x, st.y - s.playerPos.y)
        if (d < bestD) {
          bestD = d
          best = st
        }
      }
      return best
    },
    partyById: (s) => (id) => s.parties.find((p) => p.id === id),
    settlementById: (s) => (id) => s.settlements.find((st) => st.id === id),
    // The towns the lord holds.
    playerTowns: (s) => s.settlements.filter((st) => st.owner === PLAYER),
    // Attack and defence bonus the army gets from the barracks of his towns.
    armyBonus: (s) => armyBonusOf(s.settlements),
    // Hospital level of the town the lord is resting in, if any.
    hospitalHere: (s) => {
      if (!s.restingAt) return 0
      const st = s.settlements.find((x) => x.id === s.restingAt)
      return st ? facilityLevel(st, 'hospital') : 0
    },
    // The best hospital the lord owns: it keeps more of his soldiers alive.
    bestHospital: (s) =>
      s.settlements
        .filter((st) => st.owner === PLAYER)
        .reduce((best, st) => Math.max(best, facilityLevel(st, 'hospital')), 0),
    // A siege is being prepared somewhere, so the clock has to keep running.
    siegeActive: (s) => s.settlements.some((st) => st.siege && !st.siege.ready),
    /**
     * The clock of the campaign.
     *
     * A day lasts 24 game seconds, so one game second is one in-game hour:
     * the accumulator is read as an hour of the day. The clock only moves
     * while time flows, which makes it a readout of how the day counter
     * actually advances.
     */
    clock: (s) => {
      const acc = Math.max(0, s.timeAcc || 0)
      const hour = Math.min(23, Math.floor(acc))
      const minute = Math.min(59, Math.floor((acc - hour) * 60))
      const text = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      return {
        day: s.day,
        hour,
        minute,
        text,
        // How much of the day is gone, in percent.
        progress: Math.max(0, Math.min(1, acc / 24))
      }
    },
    /**
     * The phase of the day: daylight, dusk, night or dawn.
     *
     * The last fifth of every day is night — the sky darkens and everything
     * moves a little slower.
     */
    dayPhase: (s) => {
      const progress = Math.max(0, Math.min(1, (s.timeAcc || 0) / 24))
      const night = isNight(progress)
      const darkness = darknessOf(progress)
      return {
        progress,
        night,
        darkness,
        // The factor every movement of the world is scaled by.
        speedMul: speedFactorOf(progress),
        label: night ? '夜晚' : '白天',
        en: night ? 'Night' : 'Day',
        icon: night ? '🌙' : '☀️'
      }
    }
  },

  actions: {
    // Generate a fresh world and drop the player at the spawn tile.
    generate(seed) {
      const world = generateWorld(seed)
      this.seed = world.seed
      this.grid = world.grid
      this.settlements = world.settlements.map((st) => normalizeSettlement(st))
      this.parties = world.parties.map((p) => ({ ...p, units: normalizeTroops(p.units) }))
      this.playerPos = { x: world.spawn.x, y: world.spawn.y }
      this.path = []
      this.camX = world.spawn.x * TILE + TILE / 2
      this.camY = world.spawn.y * TILE + TILE / 2
      this.day = 1
      this.timeAcc = 0
      this.camping = false
      this.timeFlowing = false
      this.encounter = null
      this.cooldown = {}
      this.visited = []
      this.restingAt = null
    },

    // Restore a previously saved world, migrating pre-standard party rosters.
    hydrate(saved) {
      this.seed = saved.seed
      this.grid = saved.grid
      this.settlements = (saved.settlements || []).map((st) => normalizeSettlement(st))
      this.parties = (saved.parties || []).map((p) => ({ ...p, units: normalizeTroops(p.units) }))
      this.playerPos = { ...saved.playerPos }
      this.path = []
      this.camX = saved.playerPos.x * TILE + TILE / 2
      this.camY = saved.playerPos.y * TILE + TILE / 2
      // Camp is a live state, not a saved one: a fresh load always starts with
      // the lord standing still and the clock frozen.
      this.day = Number.isFinite(saved.day) ? saved.day : 1
      this.timeAcc = 0
      this.camping = false
      this.timeFlowing = false
      this.encounter = null
      this.cooldown = {}
      this.visited = []
      this.restingAt = null
    },

    tile(x, y) {
      if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return null
      return this.grid[y][x]
    },

    // Order the player to walk to a tile by computing an A* path. Walking away
    // from a campsite breaks camp; tapping the tile the lord already stands on
    // leaves the camp (and the clock) alone.
    moveTo(tx, ty) {
      const clampedX = Math.max(0, Math.min(WORLD_W - 1, Math.round(tx)))
      const clampedY = Math.max(0, Math.min(WORLD_H - 1, Math.round(ty)))
      const sameTile =
        clampedX === Math.round(this.playerPos.x) && clampedY === Math.round(this.playerPos.y)
      if (!sameTile) this.camping = false
      const path = findPath(this.grid, this.playerPos, { x: clampedX, y: clampedY }, terrainCost)
      this.path = path
      return path.length
    },

    stop() {
      this.path = []
    },

    // Pitch camp where the lord stands: the clock keeps running while he rests.
    startCamp() {
      this.path = []
      this.camping = true
    },

    // Break camp: the clock freezes again until the lord moves or camps anew.
    stopCamp() {
      this.camping = false
    },

    toggleCamp() {
      if (this.camping) this.stopCamp()
      else this.startCamp()
    },

    /* --------------------------------- sieges -------------------------------- */

    /**
     * Start preparing a siege against a hostile town. The preparation takes
     * `SIEGE_PREPARE_DAYS` days, the clock keeps running while it does, and the
     * owner sends soldiers to protect the town.
     */
    startSiege(settlementId) {
      const st = this.settlementById(settlementId)
      if (!st) return { ok: false, reason: '找不到这座城镇' }
      if (st.kind !== 'town') return { ok: false, reason: '只有城镇需要围城' }
      if (st.owner === PLAYER) return { ok: false, reason: '这已经是你的城镇' }
      if (st.owner === NEUTRAL) return { ok: false, reason: '无主的城镇不用攻打' }
      if (st.siege) return { ok: false, reason: '围城准备已经开始' }
      st.siege = {
        startedDay: this.day,
        readyDay: this.day + SIEGE_PREPARE_DAYS,
        ready: false,
        reliefSent: false
      }
      return { ok: true, readyDay: st.siege.readyDay }
    },

    /** Progress of the siege of one settlement. */
    siegeState(settlement) {
      const siege = settlement?.siege
      if (!siege) return { active: false, ready: false, daysLeft: 0 }
      return {
        active: true,
        ready: !!siege.ready,
        daysLeft: Math.max(0, siege.readyDay - this.day),
        readyDay: siege.readyDay
      }
    },

    /** Give up on a siege and walk away. */
    cancelSiege(settlementId) {
      const st = this.settlementById(settlementId)
      if (!st || !st.siege) return { ok: false }
      st.siege = null
      return { ok: true }
    },

    /** The town falls to the lord. */
    captureTown(settlementId) {
      const st = this.settlementById(settlementId)
      if (!st) return { ok: false, reason: '找不到这座城镇' }
      captureSettlement(st)
      return { ok: true, settlement: st }
    },

    /** Take over an unclaimed settlement: nobody defends it, so no fight. */
    claimSettlement(settlementId) {
      const st = this.settlementById(settlementId)
      if (!st) return { ok: false, reason: '找不到这个据点' }
      const res = claimSettlement(st)
      if (!res.ok) return res
      return { ok: true, settlement: st }
    },

    /** The bandits are driven out of a village. */
    liberateVillage(settlementId) {
      const st = this.settlementById(settlementId)
      if (!st) return { ok: false, reason: '找不到这个村庄' }
      liberateSettlement(st)
      // The bandits around the village scatter and are no longer on the map.
      this.parties = this.parties.filter(
        (p) => !(p.faction === BANDIT && Math.hypot(p.x - st.x, p.y - st.y) < 9)
      )
      return { ok: true, settlement: st }
    },

    /**
     * The owner of a besieged town sends help: a warband that marches to the
     * town and fights the attacker on the way.
     */
    spawnRelief(settlement) {
      const rng = createRng(settlement.x * 7919 + settlement.y * 104729 + this.day)
      const side = rng.next() < 0.5 ? 1 : -1
      const x = Math.max(1, Math.min(WORLD_W - 2, settlement.x + side * rng.int(3, 5)))
      const y = Math.max(1, Math.min(WORLD_H - 2, settlement.y + rng.int(-3, 3)))
      const units = [
        { type: 'militia', tier: 1, count: rng.int(4, 8) },
        { type: 'spearman', tier: 1, count: rng.int(2, 4) }
      ]
      if (rng.chance(0.6)) units.push({ type: 'archer', tier: 1, count: rng.int(1, 3) })
      this.parties.push({
        id: `relief-${settlement.id}-${this.day}`,
        faction: settlement.owner,
        x,
        y,
        homeX: x,
        homeY: y,
        units: normalizeTroops(units),
        speed: 1.2,
        wanderTimer: 0,
        targetX: settlement.x,
        targetY: settlement.y,
        guardTown: settlement.id
      })
    },

    /** Advance one day: wounds heal, towns develop, sieges move on. */
    advanceDay(options = {}) {
      const player = usePlayerStore()
      const resting = options.restingIn ? this.settlementById(options.restingIn) : null
      // Resting in a settlement heals far faster than marching; a hospital in
      // that town multiplies the rate.
      const rate = resting
        ? healRate({
            inSettlement: true,
            ownTown: resting.owner === PLAYER,
            level: resting.level,
            hospital: facilityLevel(resting, 'hospital')
          })
        : healRate({ inSettlement: false, hospital: this.hospitalHere })
      healTroops(player.troops, rate)

      for (const st of this.settlements) {
        tickSettlement(st, 1)
        st.day = this.day
        this.updateSiege(st)
      }

      this.growFactions()
    },

    /**
     * The world gets harder as the campaign goes on: new bands of bandits
     * appear, and every faction reinforces its warbands — up to a cap that
     * grows with the prosperity of the towns the lord holds.
     */
    growFactions() {
      this.spawnBanditBand()
      const cap = factionStrengthCap(this.settlements)
      for (const faction of NPC_FACTIONS) {
        const soldiers = factionSoldiers(this.parties, faction)
        if (soldiers >= cap) continue
        // One soldier a day for the strongest warband of the faction.
        const party = this.parties
          .filter((p) => p.faction === faction)
          .sort((a, b) => partyStrength(b) - partyStrength(a))[0]
        if (!party) continue
        const rng = createRng(this.day * 31 + faction.length * 7919)
        const type = rng.next() < 0.5 ? 'militia' : 'spearman'
        const tier = rng.next() < 0.2 ? 2 : 1
        addTroopToParty(party, type, tier, 1)
      }
    },

    /**
     * A new band of bandits wanders onto the map. The number of bandit warbands
     * is capped, so the world never drowns in them.
     */
    spawnBanditBand() {
      const bandits = this.parties.filter((p) => p.faction === 'bandit')
      if (bandits.length >= BANDIT_PARTY_CAP) return
      if (this.day % 2 !== 0) return
      const spot = this.randomLandSpot()
      if (!spot) return
      const rng = createRng(this.day * 131 + this.parties.length * 17)
      const units = [
        { type: 'militia', tier: 1, count: rng.int(3, 7) },
        { type: 'archer', tier: 1, count: rng.int(1, 3) }
      ]
      this.parties.push({
        id: `bandit-${this.day}-${this.parties.length}`,
        faction: 'bandit',
        x: spot.x,
        y: spot.y,
        homeX: spot.x,
        homeY: spot.y,
        units: normalizeTroops(units),
        speed: 1.15,
        wanderTimer: 0,
        targetX: spot.x,
        targetY: spot.y
      })
    },

    /** A random walkable tile far enough from the lord to be a surprise. */
    randomLandSpot() {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const x = 1 + Math.floor(Math.random() * (WORLD_W - 2))
        const y = 1 + Math.floor(Math.random() * (WORLD_H - 2))
        if (this.grid[y]?.[x] === 'water') continue
        const d = Math.hypot(x - this.playerPos.x, y - this.playerPos.y)
        if (d < 12) continue
        return { x, y }
      }
      return null
    },

    /** One day of siege: the garrison grows and the owner sends help. */
    updateSiege(settlement) {
      const siege = settlement.siege
      if (!siege || siege.ready) return
      if (!siege.reliefSent) {
        siege.reliefSent = true
        this.spawnRelief(settlement)
      }
      if (this.day >= siege.readyDay) siege.ready = true
    },

    /**
     * Resting inside a settlement: the clock runs, the wounded heal and the
     * town keeps developing, while the parties on the map hold their ground.
     */
    restTick(dt, settlementId) {
      this.restingAt = settlementId || null
      this.timeAcc += dt
      if (this.timeAcc < 24) return
      this.timeAcc -= 24
      this.day += 1
      this.advanceDay({ restingIn: settlementId })
    },

    /** Leave a settlement: the lord is back on the road. */
    leaveRest() {
      this.restingAt = null
    },

    // Advance the player, roaming parties and the day counter.
    tick(dt) {
      const player = usePlayerStore()
      // The night slows the whole world down: the lord walks a quarter slower
      // in the deepest night, and so does every roaming warband.
      const nightFactor = this.dayPhase.speedMul
      // --- player movement -------------------------------------------------
      // `travelled` is the world distance covered this frame: it is what
      // decides whether game time advances at all.
      let remaining = 3.9 * dt * nightFactor
      let travelled = 0
      let guard = 0
      while (remaining > 0 && this.path.length && guard++ < 200) {
        const next = this.path[0]
        const dx = next.x - this.playerPos.x
        const dy = next.y - this.playerPos.y
        const dist = Math.hypot(dx, dy)
        if (dist < 1e-3) {
          this.path.shift()
          continue
        }
        const t = terrainCost(this.grid, next.x, next.y)
        const step = Math.min(dist, remaining)
        this.playerPos.x += (dx / dist) * step
        this.playerPos.y += (dy / dist) * step
        travelled += step
        remaining -= step * t.cost
        if (step >= dist - 1e-3) this.path.shift()
      }

      // --- clock gate ------------------------------------------------------
      // Game time (and therefore every roaming party) only moves forward while
      // the lord is travelling or camping. Standing still freezes the world.
      // A siege under preparation also keeps the clock running: the lord has
      // to wait for his troops to be ready, and the town uses that time.
      const flowing = this.camping || travelled > 1e-4 || this.siegeActive
      this.timeFlowing = flowing
      const gdt = flowing ? dt : 0

      // --- day clock -------------------------------------------------------
      this.timeAcc += gdt
      if (this.timeAcc >= 24) {
        this.timeAcc -= 24
        this.day += 1
        this.advanceDay()
      }

      // --- party cooldowns -------------------------------------------------
      for (const id of Object.keys(this.cooldown)) {
        this.cooldown[id] -= gdt
        if (this.cooldown[id] <= 0) delete this.cooldown[id]
      }

      // --- party wandering / bandit aggression -----------------------------
      for (const p of this.parties) {
        const distToPlayer = Math.hypot(p.x - this.playerPos.x, p.y - this.playerPos.y)
        const hostile = factionOf(p.faction).hostile

        if (p.guardTown) {
          // A relief warband on its way to a besieged town: it marches to the
          // town, but it also turns on the attacker when he comes close.
          const town = this.settlementById(p.guardTown)
          if (!town || town.owner === PLAYER) {
            // The town fell (or changed hands): the warband runs home.
            p.guardTown = null
            p.homeX = p.x
            p.homeY = p.y
          } else if (hostile && distToPlayer < 5 && !this.cooldown[p.id]) {
            p.targetX = this.playerPos.x
            p.targetY = this.playerPos.y
          } else {
            p.targetX = town.x
            p.targetY = town.y
            // Arrived: the soldiers join the garrison of the town.
            if (Math.hypot(p.x - town.x, p.y - town.y) < 0.9) {
              for (const group of p.units) {
                const found = town.garrison.find((g) => g.type === group.type && g.tier === group.tier)
                if (found) {
                  found.count += group.count
                  found.hp = (found.hp || []).concat(group.hp || [])
                } else {
                  town.garrison.push({ ...group, hp: [...(group.hp || [])] })
                }
              }
              this.parties = this.parties.filter((x) => x.id !== p.id)
              continue
            }
          }
        } else if (hostile && distToPlayer < 9 && !this.cooldown[p.id]) {
          // Chase the player.
          p.targetX = this.playerPos.x
          p.targetY = this.playerPos.y
        } else {
          p.wanderTimer -= gdt
          if (p.wanderTimer <= 0) {
            p.wanderTimer = 4 + Math.random() * 6
            const ang = Math.random() * Math.PI * 2
            const r = 3 + Math.random() * 5
            p.targetX = Math.max(1, Math.min(WORLD_W - 2, p.homeX + Math.cos(ang) * r))
            p.targetY = Math.max(1, Math.min(WORLD_H - 2, p.homeY + Math.sin(ang) * r))
          }
        }
        const dx = p.targetX - p.x
        const dy = p.targetY - p.y
        const d = Math.hypot(dx, dy)
        if (d > 0.05) {
          // The warbands slow down at night as well.
          const speed = 1.7 * p.speed * nightFactor
          const step = Math.min(d, speed * gdt)
          const nx = p.x + (dx / d) * step
          const ny = p.y + (dy / d) * step
          if (terrainCost(this.grid, Math.round(nx), Math.round(ny)).walkable) {
            p.x = nx
            p.y = ny
          } else {
            p.wanderTimer = 0 // blocked, pick a new target next tick
          }
        }
      }

      // --- encounter detection ---------------------------------------------
      // A lord with no soldiers left has nothing worth attacking, so hostile
      // parties leave them alone until they recruit again.
      if (!this.encounter && player.totalTroops > 0) {
        for (const p of this.parties) {
          if (this.cooldown[p.id]) continue
          if (!factionOf(p.faction).hostile) continue
          const d = Math.hypot(p.x - this.playerPos.x, p.y - this.playerPos.y)
          if (d < 1.3) {
            this.encounter = { partyId: p.id, faction: p.faction }
            this.stop()
            break
          }
        }
      }
    },

    // Camera smoothly trails the player.
    updateCamera(viewW, viewH) {
      this.viewW = viewW
      this.viewH = viewH
      const px = this.playerPos.x * TILE + TILE / 2
      const py = this.playerPos.y * TILE + TILE / 2
      const targetX = Math.max(0, Math.min(WORLD_W * TILE - viewW, px - viewW / 2))
      const targetY = Math.max(0, Math.min(WORLD_H * TILE - viewH, py - viewH / 2))
      this.camX += (targetX - this.camX) * 0.16
      this.camY += (targetY - this.camY) * 0.16
    },

    // Remove a defeated party from the map and start its respawn cooldown.
    defeatParty(id) {
      this.parties = this.parties.filter((p) => p.id !== id)
      this.cooldown[id] = 45
    },

    markVisited(id) {
      if (!this.visited.includes(id)) this.visited.push(id)
    },

    clearEncounter() {
      this.encounter = null
    }
  }
})
