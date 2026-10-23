/**
 * Battle state: owns the live simulation, the player's squad selection and the
 * outcome that is applied back to the world and the player once the fight ends.
 */
import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import {
  createBattle,
  stepBattle,
  battleSummary,
  battleGroups,
  survivorsByType,
  fallenByType,
  formationSlots,
  hastenEnemy,
  spawnTrainingDummies,
  ARENA
} from '@/game/battle'
import { warbandValue, woundedCount } from '@/game/units'
import { survivalChance } from '@/game/settlement'
import { speedOf } from '@/game/battle'
import { foodPerBattleOf } from '@/game/difficulty'
import { usePlayerStore } from './player'
import { useWorldStore } from './world'

// Real time since the last stamp of the interface.
let stampClock = 0

// How far past the edge of the field the camera may be dragged, in screen
// pixels: a small margin of ground shows around the field.
const PAN_OUTSIDE = 140

export const useBattleStore = defineStore('battle', {
  state: () => ({
    active: false,
    data: null,
    context: null, // { partyId, faction }
    result: null, // { outcome, loot, summary, recruits }
    settled: false,
    selectedGroup: null, // null means every squad at once
    // The live battle data is raw (see `start`), so the interface watches this
    // counter instead of every soldier. It moves a few times a second.
    stamp: 0,
    // How fast the simulation runs: 'slow' (the default), 'normal' or 'fast'.
    speed: 'slow',
    // The camera over the battle field: the field is bigger than a phone
    // screen, so the view follows the fighting until the player drags it.
    camX: ARENA.w / 2,
    camY: ARENA.h / 2,
    zoom: 1,
    follow: true,
    // Random source of the survival rolls; a check can replace it.
    rngFn: null
  }),

  getters: {
    /** The speed record of the current setting. */
    speedInfo: (s) => speedOf(s.speed),
    /**
     * True while the lord is training instead of fighting: the field holds no
     * enemies, nothing is lost and the session goes on until he leaves.
     */
    isTraining: (s) => !!(s.data && s.data.training),
    /** Player squads with their live count, order, formation and density. */
    groups: (s) => {
      void s.stamp
      return s.data ? battleGroups(s.data, 'player') : []
    },
    selected: (s) => {
      void s.stamp
      return s.data && s.selectedGroup ? s.data.groups[s.selectedGroup] || null : null
    },
    /** Order shown by the command bar: the selected squad's, else the first one's. */
    order: (s) => {
      void s.stamp
      if (!s.data) return 'attack'
      if (s.selectedGroup && s.data.groups[s.selectedGroup]) return s.data.groups[s.selectedGroup].order
      const first = s.data.playerGroups[0]
      return first && s.data.groups[first] ? s.data.groups[first].order : 'attack'
    },
    formation: (s) => {
      void s.stamp
      if (!s.data) return 'square'
      if (s.selectedGroup && s.data.groups[s.selectedGroup]) return s.data.groups[s.selectedGroup].formation
      const first = s.data.playerGroups[0]
      return first && s.data.groups[first] ? s.data.groups[first].formation : 'square'
    },
    density: (s) => {
      void s.stamp
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
      const FOOD_PER_BATTLE = foodPerBattleOf(player.difficulty)
      const food = player.supplies.food || 0
      let atkMul = 1
      if (food < FOOD_PER_BATTLE) atkMul *= 0.75
      // Every horse in the baggage train adds a small army-wide attack bonus.
      atkMul += Math.min(10, player.supplies.horse || 0) * 0.01
      // The barracks of the lord's towns train the whole army.
      atkMul += world.armyBonus
      // What the lord learned makes the whole army stronger: the tactics
      // attribute and the war banner of the milestones.
      atkMul *= player.skillEffects.armyAtk
      atkMul *= player.milestoneEffects.armyAtk
      player.supplies.food = Math.max(0, food - FOOD_PER_BATTLE)

      this.data = markRaw(createBattle({
        playerTroops: player.troops,
        enemyTroops: party.units,
        enemyFaction: party.faction,
        seed,
        playerAtkMul: atkMul,
        playerDefMul: 1 + world.armyBonus
      }))
      this.context = { partyId: party.id, faction: party.faction, kind: 'party', hungry: food < FOOD_PER_BATTLE }
      this.selectedGroup = null
      this.result = null
      this.settled = false
      this.active = true
    },

    /**
     * Storm a town or drive the bandits out of a village. The garrison of the
     * settlement is the enemy, and the outcome changes the ownership.
     *
     * The kinds are:
     *   siege   攻打王国的城镇 —— 打赢就占领
     *   claim   攻打无主但有守军的城镇 —— 打赢就占领
     *   bandits 赶走强盗 —— 打赢就变成无主
     */
    startSettlement(settlement, seed, kind) {
      const player = usePlayerStore()
      const world = useWorldStore()
      const FOOD_PER_BATTLE = foodPerBattleOf(player.difficulty)
      const food = player.supplies.food || 0
      let atkMul = 1
      if (food < FOOD_PER_BATTLE) atkMul *= 0.75
      atkMul += Math.min(10, player.supplies.horse || 0) * 0.01
      atkMul += world.armyBonus
      // The attributes and the milestones make the whole army stronger.
      atkMul *= player.skillEffects.armyAtk
      atkMul *= player.milestoneEffects.armyAtk
      player.supplies.food = Math.max(0, food - FOOD_PER_BATTLE)

      this.data = markRaw(createBattle({
        playerTroops: player.troops,
        enemyTroops: settlement.garrison || [],
        enemyFaction: settlement.owner,
        seed,
        playerAtkMul: atkMul,
        playerDefMul: 1 + world.armyBonus
      }))
      this.context = {
        partyId: null,
        faction: settlement.owner,
        kind,
        settlementId: settlement.id,
        hungry: food < FOOD_PER_BATTLE
      }
      this.selectedGroup = null
      this.result = null
      this.settled = false
      this.active = true
    },

    /**
     * Start a training session: the lord's own soldiers on the field and
     * nothing else but a row of wooden dummies.
     *
     * A training session costs nothing — no food, no gold, no soldiers — and
     * it never ends on its own, so the lord practises as long as he likes.
     */
    startTraining(seed) {
      const player = usePlayerStore()
      this.data = markRaw(createBattle({
        playerTroops: player.troops,
        enemyTroops: [],
        enemyFaction: 'training',
        seed,
        playerAtkMul: 1,
        playerDefMul: 1,
        training: true
      }))
      spawnTrainingDummies(this.data)
      this.context = { partyId: null, faction: 'training', kind: 'training', hungry: false }
      this.selectedGroup = null
      this.result = null
      this.settled = false
      this.active = true
    },

    /**
     * Start a quick battle: the chosen army against the chosen enemy faction
     * on the chosen battlefield.
     *
     * It is a sandbox: the fight is a real one — the same simulation, the same
     * commands, the same field — but the campaign is not touched, so nobody
     * loses a soldier of the lord's own warband.
     *
     * 快速战斗：选好的两支队伍在选好的战场上打一场真的仗，但战役数据不受影响。
     */
    startQuick({ map, playerTroops, enemyTroops, enemyFaction, seed }) {
      this.data = markRaw(createBattle({
        playerTroops,
        enemyTroops,
        enemyFaction,
        seed,
        playerAtkMul: 1,
        playerDefMul: 1,
        arenaMap: map || 'mixed'
      }))
      this.context = {
        partyId: null,
        faction: enemyFaction,
        kind: 'quick',
        map: map || 'mixed',
        hungry: false
      }
      this.selectedGroup = null
      this.result = null
      this.settled = false
      this.active = true
    },

    tick(dt) {
      if (!this.active || !this.data) return
      // The speed setting scales the clock of the simulation: the slow speed
      // keeps the battle readable, the fast one hurries it along.
      const mul = speedOf(this.speed).mul
      stepBattle(this.data, Math.min(dt * mul, 0.08))
      if (this.data.outcome && !this.settled) this.settle()
      // The field itself is raw, so the command bar is refreshed from this
      // counter: ten times a second is enough for counts and orders and costs
      // a fraction of a reactive army.
      stampClock += dt
      if (stampClock >= 0.1) {
        stampClock = 0
        this.stamp += 1
      }
    },

    /** Change how fast the battle runs. */
    setSpeed(key) {
      this.speed = speedOf(key).key
      return this.speed
    },

    /* -------------------------------- camera -------------------------------- */

    /**
     * Keep the camera on the fighting.
     *
     * The zoom follows the armies: when they are far apart the field is seen
     * from a distance, and when they meet the camera zooms in. A phone screen
     * is narrow, so its floor is lower: at the opening both armies have to fit
     * on screen instead of the camera sitting on the empty ground between
     * them. The camera may also be dragged a little past the edge of the field.
     */
    updateCamera(viewW, viewH) {
      if (!this.data || !viewW || !viewH) return
      const bounds = this.actionBounds()
      if (bounds) {
        const needW = Math.max(320, bounds.maxX - bounds.minX + 260)
        const needH = Math.max(240, bounds.maxY - bounds.minY + 260)
        const fit = Math.min(viewW / needW, viewH / needH)
        // A phone is narrow: zooming to 0.7 would cut both armies off the
        // sides of the screen at the opening, so the floor is lower there.
        const floor = viewW <= 640 ? 0.42 : 0.7
        this.zoom = Math.max(floor, Math.min(1.5, fit))
        if (this.follow) {
          this.camX += (bounds.cx - this.camX) * 0.12
          // The command bar covers the bottom of the screen, so the fighting
          // is kept a little above the middle.
          this.camY += (bounds.cy + 60 - this.camY) * 0.12
        }
      } else {
        this.zoom = Math.max(0.55, Math.min(1.5, Math.min(viewW / 560, viewH / 620)))
      }
      // The camera may be dragged a little past the edge of the field, so the
      // ground around it can be seen and the last soldier at the border is not
      // glued to the side of the screen. The buffer is measured on screen and
      // turned into field pixels with the zoom.
      const halfW = viewW / this.zoom / 2
      const halfH = viewH / this.zoom / 2
      const pad = PAN_OUTSIDE / this.zoom
      const minX = Math.min(halfW, ARENA.w / 2) - pad
      const maxX = Math.max(ARENA.w - halfW, ARENA.w / 2) + pad
      const minY = Math.min(halfH, ARENA.h / 2) - pad
      const maxY = Math.max(ARENA.h - halfH, ARENA.h / 2) + pad
      this.camX = Math.max(minX, Math.min(maxX, this.camX))
      this.camY = Math.max(minY, Math.min(maxY, this.camY))
    },

    /** The box around every living soldier: what the camera likes to watch. */
    actionBounds() {
      if (!this.data) return null
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      for (const u of this.data.units) {
        if (!u.alive) continue
        if (u.x < minX) minX = u.x
        if (u.x > maxX) maxX = u.x
        if (u.y < minY) minY = u.y
        if (u.y > maxY) maxY = u.y
      }
      if (!Number.isFinite(minX)) return null
      return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
    },

    /** Drag the field: the camera follows the finger and stops auto-following. */
    panCamera(dx, dy) {
      this.camX -= dx / this.zoom
      this.camY -= dy / this.zoom
      this.follow = false
    },

    /** Let the camera follow the fighting again. */
    recenter() {
      this.follow = true
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
      // Attacking ends the enemy's wait: it answers within a moment instead of
      // standing there while the lord's squads walk the whole field.
      if (key === 'attack') hastenEnemy(this.data)
    },

    /**
     * The 「全军出击」 button of the standoff banner: every squad attacks at
     * once, whatever is selected. It is the one tap that starts the fight.
     */
    allAttack() {
      if (!this.data) return
      for (const k of this.data.playerGroups) this.setOrder('attack', k)
      hastenEnemy(this.data)
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
      // A training session never settles: it changes nothing about the
      // campaign, so the lord's soldiers, purse and record stay untouched.
      if (this.context && this.context.kind === 'training') return
      const outcome = this.data.outcome
      const summary = battleSummary(this.data)

      // A quick battle is a sandbox: the fight was real, but the campaign is
      // not touched — no loot, no record, and not one soldier of the lord's
      // own warband is lost.
      if (this.context && this.context.kind === 'quick') {
        this.result = {
          outcome,
          loot: 0,
          recruits: 0,
          summary,
          wounded: 0,
          saved: 0,
          fallen: summary.fallen,
          captured: false,
          sandbox: true
        }
        this.settled = true
        return
      }

      const world = useWorldStore()
      const player = usePlayerStore()
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
          if (this.context.kind === 'siege' || this.context.kind === 'claim') {
            captured = world.captureTown(settlement.id)
          } else if (this.context.kind === 'bandits') {
            captured = world.liberateVillage(settlement.id)
          }
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
        // A failed assault breaks the siege: the lord has to gather his troops
        // and prepare the attack all over again.
        if (this.context.kind === 'siege') settlement.siege = null
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

      // The badge of the milestones pays a little gold after every fight.
      const badgeGold = player.milestoneEffects.battleGold
      if (badgeGold) player.addGold(badgeGold)

      this.result = {
        outcome,
        loot,
        recruits,
        summary,
        wounded: woundedCount(rolled.troops),
        saved: rolled.saved,
        fallen: summary.fallen,
        badgeGold,
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
