<template>
  <div class="world-view">
    <WorldMap class="map" />

    <!-- Top status bar -->
    <div class="hud-top">
      <div class="chip">👑 {{ player.username || '领主' }}</div>
      <div class="chip gold">🪙 {{ player.gold }}</div>
      <div class="chip">🛡️ {{ player.totalTroops }} 兵</div>
      <DayClock :note="flowLabel" :live="world.timeFlowing" />
      <div class="chip">🏆 胜 {{ player.stats.wins }} / {{ player.stats.battles }}</div>
      <button class="chip role-btn" title="查看角色信息" @click="showCharacter = true">👤 角色详情</button>
      <button class="chip diff-chip" title="难度设置" @click="showSettings = !showSettings">
        🎚 {{ difficulty.name }}
      </button>
    </div>

    <!-- Settings sheet: the difficulty of the campaign. -->
    <div v-if="showSettings" class="settings panel">
      <div class="settings-title">难度设置</div>
      <div class="diff-row">
        <button
          v-for="d in difficulties"
          :key="d.key"
          class="diff-btn"
          :class="{ on: player.difficulty === d.key }"
          @click="pickDifficulty(d.key)"
        >
          <span class="diff-icon">{{ d.icon }}</span>
          <span class="diff-name">{{ d.name }}</span>
        </button>
      </div>
      <p class="muted settings-note">{{ difficulty.note }}</p>
    </div>

    <!-- Right column: the minimap sits in the corner, the legend under it -->
    <div class="hud-right">
      <MiniMap @open="showAtlas = true" />

      <div class="legend panel">
        <div class="legend-title">
          图例
          <button class="mini" @click="showLegend = !showLegend">{{ showLegend ? '收起' : '展开' }}</button>
        </div>
        <div v-if="showLegend" class="legend-body">
          <div v-for="row in legendRows" :key="row.name" class="legend-row">
            <img class="legend-sprite" :src="spriteUrl(row.sprite)" :alt="row.name" />
            <span class="legend-name">{{ row.name }}</span>
            <i class="legend-dot" :style="{ background: row.color }"></i>
          </div>
          <div class="legend-note muted">图标右上角数字 = 兵力</div>
        </div>
      </div>
    </div>

    <!-- Bottom action bar -->
    <div class="hud-bottom">
      <div class="left" :class="{ solo: !nearby }">
        <button v-if="nearby && canEnter(nearby)" class="btn enter-btn" @click="enterSettlement">
          进入 {{ nearby.kind === 'town' ? '🏰' : '🏘️' }} {{ nearby.name }}
        </button>
        <button
          v-else-if="nearby && nearby.owner === 'bandit'"
          class="btn action-btn danger"
          @click="driveOffBandits(nearby)"
        >
          ⚔️ 赶走强盗 {{ nearby.name }}
        </button>
        <template v-if="nearby && canEnter(nearby) && nearby.kind === 'town' && canSiege(nearby)">
          <button v-if="!siege.active" class="btn action-btn danger" @click="prepareSiege(nearby)">
            🏰 准备围城 {{ nearby.name }}
          </button>
          <template v-else>
            <button v-if="siege.ready" class="btn action-btn danger" @click="stormTown(nearby)">
              ⚔️ 攻打 {{ nearby.name }}
            </button>
            <span v-else class="siege-chip">⏳ 围城准备中 · 还需 {{ siege.daysLeft }} 天</span>
            <!-- A siege can always be called off: the lord changes his mind. -->
            <button class="btn action-btn" @click="cancelSiege(nearby)">🚫 取消围城</button>
          </template>
        </template>
        <!-- An unclaimed town: taken for free when nobody defends it, stormed
             when it still holds soldiers. -->
        <button
          v-if="nearby && nearby.owner === 'neutral' && nearby.kind === 'town'"
          class="btn action-btn"
          :class="{ danger: townGuarded }"
          @click="claimTown(nearby)"
        >
          {{ townGuarded ? '⚔️ 攻城' : '🚩 占领' }} {{ nearby.name }}
          <span v-if="townGuarded" class="btn-note">守军 {{ townGuardCount }} 名</span>
        </button>
        <button class="btn camp-btn" :class="{ on: world.camping }" @click="toggleCamp">
          {{ world.camping ? '🔥 拔营' : '⛺ 扎营' }}
        </button>
        <!-- Drill the troops: the training field holds no enemy at all. -->
        <button v-if="world.camping" class="btn train-btn" @click="startTraining">🎯 练兵</button>
        <div v-if="!nearby" class="hint-chip" :class="{ warning: player.totalTroops === 0 }">
          {{ hintText }}
        </div>
      </div>
      <div class="right">
        <button class="btn ghost" @click="router.push('/guide')">📖 帮助</button>
        <button class="btn ghost" @click="openShare">📤 分享</button>
        <button class="btn ghost" @click="saveNow">💾 保存</button>
        <button class="btn ghost" @click="exitToHome">🏠 退出</button>
      </div>
    </div>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <!-- Lord info panel -->
    <CharacterPanel v-if="showCharacter" @close="showCharacter = false" />

    <!-- Detailed map, opened by tapping the minimap -->
    <WorldAtlas v-if="showAtlas" @close="showAtlas = false" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import WorldMap from '@/components/WorldMap.vue'
import MiniMap from '@/components/MiniMap.vue'
import WorldAtlas from '@/components/WorldAtlas.vue'
import CharacterPanel from '@/components/CharacterPanel.vue'
import DayClock from '@/components/DayClock.vue'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { useBattleStore } from '@/stores/battle'
import { persistGame } from '@/composables/gameState'
import { openShare } from '@/composables/share'
import { FACTIONS, NPC_FACTIONS } from '@/game/factions'
import { canEnter as canEnterSettlement, canSiege as canSiegeSettlement, garrisonCount, needsAssault, SIEGE_PREPARE_DAYS } from '@/game/settlement'
import { difficultyList, difficultyOf } from '@/game/difficulty'
import { spriteUrl } from '@/game/pixelAssets'

const router = useRouter()
const world = useWorldStore()
const player = usePlayerStore()
const battle = useBattleStore()

// Start with the legend collapsed on phones so the world map stays clear.
const showLegend = ref(window.innerWidth > 560)
// Lord info popup, opened from the status chips in the top bar.
const showCharacter = ref(false)
// Detailed map overlay, opened from the minimap.
const showAtlas = ref(false)
// Difficulty sheet on the world map.
const showSettings = ref(false)
const toast = ref('')
let toastTimer = 0
let autosave = 0

const nearby = computed(() => world.nearbySettlement)
const canEnter = computed(() => (st) => canEnterSettlement(st))
// Only a town held by a kingdom can be besieged: a neutral town is claimed and
// a town of the lord's own needs no war at all.
const canSiege = computed(() => (st) => canSiegeSettlement(st))
// Progress of the siege of the settlement the lord is standing next to.
const siege = computed(() => world.siegeState(nearby.value))
// An unclaimed town that still holds soldiers: it has to be stormed.
const townGuarded = computed(() => needsAssault(nearby.value))
const townGuardCount = computed(() => (nearby.value ? garrisonCount(nearby.value.garrison) : 0))
// Difficulty of the campaign and the list of levels.
const difficulties = difficultyList()
const difficulty = computed(() => difficultyOf(player.difficulty))

// Legend rows mirror exactly what the world map draws: the lord, one commander
// sprite per faction and the two settlement kinds. The colour comes straight
// from `game/factions.js`, the same table the sprite generator reads, so the
// swatch here can never drift away from the cloth the commander wears.
const legendRows = computed(() => [
  { name: '你的部队', sprite: 'lord', color: FACTIONS.player.color },
  ...NPC_FACTIONS.map((key) => ({
    name: `${FACTIONS[key].name}${FACTIONS[key].hostile ? ' (敌)' : ''}`,
    sprite: key,
    color: FACTIONS[key].color
  })),
  { name: '城镇', sprite: 'town', color: '#f0d48a' },
  { name: '村庄', sprite: 'village', color: '#d8c39a' }
])

// Clock state shown next to the day counter: game time only advances while the
// lord is marching or camping.
const flowLabel = computed(() => {
  if (world.camping) return '🔥 扎营'
  return world.timeFlowing ? '⏳ 流逝' : '⏸ 停滞'
})

const hintText = computed(() => {
  if (player.totalTroops === 0) return '🛡️ 队伍已溃散，去最近的村庄招募民兵吧'
  if (world.camping) return '⛺ 扎营中，时间自然流逝 · 点地图或「拔营」结束'
  return '点地图移动，时间随移动流逝 · 或「扎营」原地等待'
})

function flash(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2200)
}

function toggleCamp() {
  world.toggleCamp()
  flash(world.camping ? '⛺ 已扎营：时间开始流逝，敌人也会行动' : '🔥 已拔营：时间停止，直到你再次移动或扎营')
}

/**
 * Drill the troops: the lord walks onto a training field that holds his own
 * soldiers and a row of wooden dummies, and nothing else. Nobody dies there
 * and the campaign is not touched.
 */
function startTraining() {
  if (player.totalTroops <= 0) {
    flash('🛡️ 没有士兵可以练兵，先去村庄招募民兵吧')
    return
  }
  world.stop()
  battle.startTraining(Math.floor(Math.random() * 1e9))
  router.push('/battle')
}

function enterSettlement() {
  const st = world.nearbySettlement
  if (!st) return
  world.stop()
  world.stopCamp()
  world.markVisited(st.id)
  persistGame()
  router.push({ name: 'settlement', query: { id: st.id } })
}

/** Start preparing a siege: the clock keeps running while the troops gather. */
function prepareSiege(st) {
  const res = world.startSiege(st.id)
  if (!res.ok) {
    flash(res.reason)
    return
  }
  flash(`🏰 开始准备围城 ${st.name}，需要 ${SIEGE_PREPARE_DAYS} 天`)
  persistGame()
}

/** The preparation is over: storm the town and its garrison. */
function stormTown(st) {
  world.stop()
  world.stopCamp()
  battle.startSettlement(st, Math.floor(Math.random() * 1e9), 'siege')
  persistGame()
  router.push('/battle')
}

/** Call off a siege: the preparations stop and the clock stops with them. */
function cancelSiege(st) {
  const res = world.cancelSiege(st.id)
  if (!res.ok) {
    flash('这里没有正在进行的围城')
    return
  }
  flash(`🚫 已取消对 ${st.name} 的围城准备`)
  persistGame()
}

/** Change the difficulty of the campaign from the world map. */
function pickDifficulty(key) {
  player.setDifficulty(key)
  flash(`🎚 难度：${difficultyOf(key).name}`)
  persistGame()
}

/** Drive the bandits out of a village. */
function driveOffBandits(st) {
  world.stop()
  world.stopCamp()
  battle.startSettlement(st, Math.floor(Math.random() * 1e9), 'bandits')
  persistGame()
  router.push('/battle')
}

/**
 * Take an unclaimed town. A town nobody defends is simply claimed; a town that
 * still holds soldiers has to be stormed first.
 */
function claimTown(st) {
  if (needsAssault(st)) {
    world.stop()
    world.stopCamp()
    battle.startSettlement(st, Math.floor(Math.random() * 1e9), 'claim')
    persistGame()
    router.push('/battle')
    return
  }
  const res = world.claimSettlement(st.id)
  if (!res.ok) {
    flash(res.reason)
    return
  }
  flash(`🚩 ${st.name} 现在属于你了`)
  persistGame()
}

function saveNow() {
  persistGame()
  flash('进度已保存 💾')
}

function exitToHome() {
  persistGame()
  router.push('/')
}

// Route into battle as soon as a hostile party catches the player.
watch(
  () => world.encounter,
  (enc) => {
    if (!enc) return
    const party = world.partyById(enc.partyId)
    if (!party) {
      world.clearEncounter()
      return
    }
    battle.start(party, Math.floor(Math.random() * 1e9))
    persistGame()
    router.push('/battle')
  }
)

onMounted(() => {
  if (!player.username) {
    router.replace('/')
    return
  }
  flash(`欢迎回来，${player.username}！`)
  autosave = setInterval(persistGame, 6000)
})

onBeforeUnmount(() => {
  clearInterval(autosave)
  clearTimeout(toastTimer)
})
</script>

<style scoped>
.world-view {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #101610;
}

.map {
  position: absolute;
  inset: 0;
}

.hud-top {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  left: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  z-index: 5;
}

.chip {
  backdrop-filter: blur(6px);
}

.chip.gold {
  color: var(--gold);
  border-color: var(--gold-deep);
}

/* Tappable status chip that opens the lord info panel. */
.role-btn {
  color: #fff;
  border-color: var(--gold-deep);
  background: rgba(232, 197, 106, 0.14);
  font-weight: 700;
}

.role-btn:hover {
  background: rgba(232, 197, 106, 0.26);
}

/* Difficulty chip and the settings sheet it opens. */
.diff-chip {
  color: #fff;
  border-color: var(--gold-deep);
  background: rgba(232, 197, 106, 0.14);
  font-weight: 700;
}

.settings {
  position: absolute;
  top: calc(84px + env(safe-area-inset-top));
  left: 12px;
  width: min(260px, calc(100% - 24px));
  padding: 12px;
  z-index: 6;
}

.settings-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--gold);
  margin-bottom: 8px;
}

.diff-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.diff-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 46px;
  padding: 6px 2px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid transparent;
  transition: all 0.15s;
}

.diff-btn.on {
  background: rgba(232, 197, 106, 0.22);
  border-color: var(--gold);
  color: var(--gold);
}

.diff-icon {
  font-size: 16px;
  line-height: 1;
}

.diff-name {
  font-size: 13px;
  font-weight: 700;
}

.settings-note {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
}

/* The siege countdown is a readout, not a button: the cancel button sits next
   to it so a siege can always be called off. */
.siege-chip {
  display: inline-flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(10, 14, 10, 0.88);
  border: 1px solid var(--line);
  font-size: 14px;
  color: var(--ink);
}

.legend {
  padding: 10px 12px;
  font-size: 12.5px;
  min-width: 130px;
}

/* The minimap and the legend share the top-right corner, minimap first. */
.hud-right {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 5;
  max-width: 45vw;
}

.legend-title {
  font-weight: 700;
  color: var(--gold);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.mini {
  font-size: 11px;
  color: var(--ink-dim);
  text-decoration: underline;
}

.legend-body {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* One row per icon the map draws: the sprite itself, so the legend can never
   show something the map does not, plus the faction colour as a swatch. */
.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-sprite {
  width: 22px;
  height: 22px;
  image-rendering: pixelated;
  flex: none;
}

.legend-name {
  flex: 1;
  white-space: nowrap;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.4);
  flex: none;
}

.legend-note {
  border-top: 1px dashed var(--line);
  padding-top: 6px;
  font-size: 11px;
}

.hud-bottom {
  position: absolute;
  bottom: calc(14px + env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  padding: 0 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  z-index: 5;
}

.left {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.right {
  display: flex;
  gap: 8px;
}

.enter-btn,
.action-btn {
  font-size: 16px;
  padding: 14px 22px;
  animation: popIn 0.25s ease-out;
}

/* The fight and siege buttons are the same shape, but they start a war. */
.action-btn.danger {
  border-color: rgba(214, 120, 90, 0.7);
  color: #ffd9d0;
}

/* The garrison count on the assault button. */
.btn-note {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(214, 120, 90, 0.5);
  font-size: 12px;
  font-weight: 700;
}

/* Camp toggle: the warm variant is the "you are resting here" state. */
.camp-btn {
  font-size: 15px;
  padding: 14px 18px;
}

.camp-btn.on {
  color: #ffd9a8;
  border-color: rgba(255, 170, 80, 0.85);
  background: rgba(200, 110, 40, 0.3);
}

/* The drill button: it only shows up while the camp is pitched. */
.train-btn {
  font-size: 15px;
  padding: 14px 18px;
  border-color: rgba(120, 190, 255, 0.7);
  color: #d9edff;
}

.train-btn:hover {
  background: rgba(90, 160, 230, 0.22);
}

/* The clock state lives inside the DayClock chip now. */

.hint-chip {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid var(--line);
  font-size: 13px;
  color: var(--ink-dim);
}

.hint-chip.warning {
  background: rgba(120, 60, 30, 0.85);
  border-color: rgba(216, 83, 63, 0.8);
  color: #ffd9cd;
  font-weight: 700;
}

.toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 14px 24px;
  border-radius: 12px;
  background: rgba(10, 14, 10, 0.9);
  border: 1px solid var(--gold-deep);
  color: var(--gold);
  font-weight: 700;
  z-index: 9;
  box-shadow: var(--shadow);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Phones: keep the map clear, stack the HUD and give every control a full
   width row so nothing is cramped under a thumb. */
@media (max-width: 560px) {
  .hud-top {
    max-width: calc(100% - 148px);
    gap: 6px;
  }

  .hud-right {
    max-width: 44vw;
  }

  .legend {
    padding: 8px 10px;
    min-width: 96px;
    font-size: 12px;
  }

  .legend-sprite {
    width: 20px;
    height: 20px;
  }

  .hud-bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 0 10px;
  }

  .left {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    align-items: stretch;
  }

  /* Camp only, no settlement button: let it take the whole row. */
  .left.solo .camp-btn,
  .left.solo .train-btn {
    grid-column: 1 / -1;
  }

  .left .enter-btn,
  .left .action-btn,
  .left .camp-btn,
  .left .train-btn {
    width: 100%;
    font-size: 14px;
    padding: 12px 8px;
  }

  .hint-chip {
    width: 100%;
    text-align: center;
    grid-column: 1 / -1;
  }

  .right {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .right .btn {
    padding: 10px 4px;
    font-size: 12.5px;
    gap: 3px;
  }
}
</style>
