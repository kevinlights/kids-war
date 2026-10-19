/**
 * Battle state: owns the live simulation, the player's squad selection and the
 * outcome that is applied back to the world and the player once the fight ends.
 */
import { defineStore } from 'pinia'
import {
  createBattle,
  stepBattle,
  battleSummary,
  battleGroups,
  survivorsByType,
  fallenByType,
  formationSlots,
  ARENA
} from '@/game/battle'
import { warbandValue, woundedCount } from '@/game/units'
import { survivalChance } from '@/game/settlement'
import { usePlayerStore } from './player'
import { useWorldStore } from './world'

export const useBattleStore = defineStore('battle', {
  state: () => ({
    active: false,
    data: null,
    context: null, // { partyId, faction }
    result: null, // { outcome, loot, summary, recruits }
    settled: false,
    selectedGroup: null, // null means every squad at once
    // Random source of the survival rolls; a check can replace it.
    rngFn: null
  }),

  getters: {
    /** Player squads with their live count, order, formation and density. */
    groups: (s) => (s.data ? battleGroups(s.data, 'player') : []),
    selected: (s) => (s.data && s.selectedGroup ? s.data.groups[s.selectedGroup] || null : null),
    /** Order shown by the command bar: the selected squad's, else the first one's. */
    order: (s) => {
      if (!s.data) return 'attack'
      if (s.selectedGroup && s.data.groups[s.selectedGroup]) return s.data.groups[s.selectedGroup].order
      const first = s.data.playerGroups[0]
      return first && s.data.groups[first] ? s.data.groups[first].order : 'attack'
    },
    formation: (s) => {
      if (!s.data) return 'square'
      if (s.selectedGroup && s.data.groups[s.selectedGroup]) return s.data.groups[s.selectedGroup].formation
      const first = s.data.playerGroups[0]
      return first && s.data.groups[first] ? s.data.groups[first].formation : 'square'
    },
    density: (s) => {
      if (!s.data) return 'tight'
      if (s.selectedGroup && s.data.groups[s.selectedGroup]) return s.data.groups[s.selectedGroup].density
      const first = s.data.playerGroups[0]
      return first && s.data.groups[first] ? s.data.groups[first].density : 'tight'
    }
  },

  actions: {
    /** Random source of the survival rolls. A check can replace it. */
    rng() {
      return this.rngFn ? this.rngFn() : Math.random()
    },

    start(party, seed) {
      const player = usePlayerStore()
      const world = useWorldStore()
      // Each battle eats into the food store; fielding troops hungry weakens them.
      const FOOD_PER_BATTLE = 3
      const food = player.supplies.food || 0
      let atkMul = 1
      if (food < FOOD_PER_BATTLE) atkMul *= 0.75
      // Every horse in the baggage train adds a small army-wide attack bonus.
      atkMul += Math.min(10, player.supplies.horse || 0) * 0.01
      // The barracks of the lord's towns train the whole army.
      atkMul += world.armyBonus
      player.supplies.food = Math.max(0, food - FOOD_PER_BATTLE)

      this.data = createBattle({
        playerTroops: player.troops,
        enemyTroops: party.units,
        enemyFaction: party.faction,
        seed,
        playerAtkMul: atkMul,
        playerDefMul: 1 + world.armyBonus
      })
      this.context = { partyId: party.id, faction: party.faction, kind: 'party', hungry: food < FOOD_PER_BATTLE }
      this.selectedGroup = null
      this.result = null
      this.settled = false
      this.active = true
    },

    /**
     * Storm a town or drive the bandits out of a village. The garrison of the
     * settlement is the enemy, and the outcome changes the ownership.
     */
    startSettlement(settlement, seed, kind) {
      const player = usePlayerStore()
      const world = useWorldStore()
      const food = player.supplies.food || 0
      let atkMul = 1
      if (food < 3) atkMul *= 0.75
      atkMul += Math.min(10, player.supplies.horse || 0) * 0.01
      atkMul += world.armyBonus
      player.supplies.food = Math.max(0, food - 3)

      this.data = createBattle({
        playerTroops: player.troops,
        enemyTroops: settlement.garrison || [],
        enemyFaction: settlement.owner,
        seed,
        playerAtkMul: atkMul,
        playerDefMul: 1 + world.armyBonus
      })
      this.context = {
        partyId: null,
        faction: settlement.owner,
        kind,
        settlementId: settlement.id,
        hungry: food < 3
      }
      this.selectedGroup = null
      this.result = null
      this.settled = false
      this.active = true
    },

    tick(dt) {
      if (!this.active || !this.data) return
      stepBattle(this.data, Math.min(dt, 0.05))
      if (this.data.outcome && !this.settled) this.settle()
    },

    /* ------------------------------ squad commands ----------------------------- */

    selectGroup(key) {
      this.selectedGroup = key
    },

    // `groupKey` omitted means every player squad.
    setOrder(key, groupKey) {
      if (!this.data) return
      const scope = groupKey === undefined ? this.selectedGroup : groupKey
      for (const k of scope ? [scope] : this.data.playerGroups) {
        const g = this.data.groups[k]
        if (!g) continue
        g.order = key
        // A squad ordered to move needs a place to stand: keep its last rally
        // point, or use where it is right now.
        if (key === 'move' && !g.rally) g.rally = { x: g.tx, y: g.ty }
      }
    },

    setFormation(key, groupKey) {
      if (!this.data) return
      const scope = groupKey === undefined ? this.selectedGroup : groupKey
      for (const k of scope ? [scope] : this.data.playerGroups) {
        const g = this.data.groups[k]
        if (!g) continue
        g.formation = key
        g.slots = formationSlots(g.unitCount, key, g.density, g.side === 'player' ? 1 : -1)
      }
    },

    setDensity(key, groupKey) {
      if (!this.data) return
      const scope = groupKey === undefined ? this.selectedGroup : groupKey
      for (const k of scope ? [scope] : this.data.playerGroups) {
        const g = this.data.groups[k]
        if (!g) continue
        g.density = key
        g.slots = formationSlots(g.unitCount, g.formation, key, g.side === 'player' ? 1 : -1)
      }
    },

    // Place a squad's rally flag; the squad also switches to the move order.
    setRally(groupKey, x, y) {
      if (!this.data) return
      const g = this.data.groups[groupKey]
      if (!g) return
      g.rally = {
        x: Math.max(20, Math.min(ARENA.w - 20, x)),
        y: Math.max(20, Math.min(ARENA.h - 20, y))
      }
      g.order = 'move'
    },

    /** Commander target position inside the arena coordinate space. */
    moveCommander(x, y) {
      if (!this.data) return
      this.data.commander.tx = Math.max(20, Math.min(ARENA.w - 20, x))
      this.data.commander.ty = Math.max(20, Math.min(ARENA.h - 20, y))
    },

    /**
     * One tap on the field: a squad waiting on a move order gets its rally flag
     * planted, anything else moves the commander marker.
     */
    tapField(x, y) {
      const sel = this.selectedGroup ? this.data?.groups[this.selectedGroup] : null
      if (sel && sel.order === 'move') this.setRally(this.selectedGroup, x, y)
      else this.moveCommander(x, y)
    },

    /* -------------------------------- settlement ------------------------------- */

    /**
     * Roll the survivors of a fight: a soldier who went down is dead, unless
     * the lord's hospitals save some of them as wounded soldiers.
     */
    rollSurvivors(survivors, fallen, chance) {
      const out = survivors.map((s) => ({ ...s, hp: [...(s.hp || [])] }))
      let saved = 0
      for (const group of fallen) {
        for (let i = 0; i < group.count; i += 1) {
          if (this.rng() >= chance) continue
          saved += 1
          const found = out.find((s) => s.type === group.type && s.tier === group.tier)
          // A saved soldier lies at one hit point and heals over time.
          if (found) {
            found.count += 1
            found.hp.push(1)
          } else {
            out.push({ type: group.type, tier: group.tier, count: 1, hp: [1] })
          }
        }
      }
      return { troops: out, saved }
    },

    settle() {
      const world = useWorldStore()
      const player = usePlayerStore()
      const outcome = this.data.outcome
      const summary = battleSummary(this.data)
      const party = this.context && this.context.partyId ? world.partyById(this.context.partyId) : null
      const settlement =
        this.context && this.context.settlementId
          ? world.settlementById(this.context.settlementId)
          : null

      player.stats.battles += 1
      let loot = 0
      let recruits = 0
      let captured = null

      if (outcome === 'win') {
        player.stats.wins += 1
        if (party) {
          // Loot scales with the recruiting value of the defeated warband.
          loot = Math.round(warbandValue(party.units) * 0.35)
          // A chance to press a few prisoners into service.
          if (Math.random() < 0.6) recruits = Math.min(4, Math.round(summary.kills * 0.25))
        }
        player.addGold(loot)
        if (recruits > 0) player.addTroops('militia', 1, recruits)
        if (party) world.defeatParty(party.id)
        if (settlement) {
          // The town's soldiers are gone, so the lord takes it over.
          if (this.context.kind === 'siege') captured = world.captureTown(settlement.id)
          else if (this.context.kind === 'bandits') captured = world.liberateVillage(settlement.id)
        }
      } else if (party) {
        // Defeat: the enemy holds the field with whoever is still standing, so
        // their troop count must drop to their survivors too.
        const survivors = survivorsByType(this.data, 'enemy')
        world.cooldown[party.id] = 60
        if (survivors.length) party.units = survivors
        else world.defeatParty(party.id)
        // Nudge the player clear of the enemy so the fight does not restart.
        const dx = world.playerPos.x - party.x
        const dy = world.playerPos.y - party.y
        const d = Math.hypot(dx, dy) || 1
        world.playerPos.x = party.x + (dx / d) * 3
        world.playerPos.y = party.y + (dy / d) * 3
      } else if (settlement && outcome === 'lose') {
        // The assault failed: the town still holds its soldiers.
        const survivors = survivorsByType(this.data, 'enemy')
        settlement.garrison = survivors
        // Push the lord back so the fight does not restart immediately.
        const dx = world.playerPos.x - settlement.x
        const dy = world.playerPos.y - settlement.y
        const d = Math.hypot(dx, dy) || 1
        world.playerPos.x = settlement.x + (dx / d) * 3
        world.playerPos.y = settlement.y + (dy / d) * 3
      }

      // The warband after the fight is exactly the soldiers who survived it.
      // Losers keep no free replacement troop, so a wipe really empties it.
      const survivors = survivorsByType(this.data, 'player')
      const fallen = fallenByType(this.data, 'player')
      const chance = survivalChance(world.bestHospital)
      const rolled = this.rollSurvivors(survivors, fallen, chance)
      player.troops = rolled.troops

      this.result = {
        outcome,
        loot,
        recruits,
        summary,
        wounded: woundedCount(rolled.troops),
        saved: rolled.saved,
        fallen: summary.fallen,
        captured: !!captured?.ok
      }
      this.settled = true
    },

    // Close the battle and let the caller route back to the world map.
    close() {
      this.active = false
      this.data = null
      this.context = null
      this.settled = false
      this.selectedGroup = null
    }
  }
})
