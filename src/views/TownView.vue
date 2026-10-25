<template>
  <div class="town-page">
    <TownMap
      ref="mapEl"
      class="map"
      :scene="scene"
      @interact="onInteract"
      @near-change="near = $event"
    />

    <!-- Top bar: where the lord is, who holds the town and what he carries. -->
    <div class="hud-top">
      <button class="chip btn-chip" @click="leaveTown">← 离开</button>
      <div class="chip title">
        {{ settlement.kind === 'town' ? '🏰' : '🏘️' }} {{ settlement.name }}
        <span class="lv">Lv.{{ level.level }} {{ level.name }}</span>
      </div>
      <div class="chip owner" :style="{ borderColor: owner.color, color: owner.color }">{{ owner.name }}</div>
      <div class="chip gold">🪙 {{ player.gold }}</div>
      <div class="chip">🛡️ {{ player.totalTroops }}</div>
      <DayClock note="⏳ 镇内 1 秒 = 1 分钟" live />
    </div>

    <div class="hint-bar">
      <span class="tip">点地面走动，点人或房屋门口就走过去说话</span>
      <transition name="fade">
        <span v-if="toast" class="toast">{{ toast }}</span>
      </transition>
    </div>

    <!-- Bottom bar: what the lord can do where he stands, and the way out. -->
    <div class="hud-bottom">
      <div class="left">
        <button v-if="near" class="btn action" @click="useNear">{{ nearLabel }}</button>
        <button class="btn" @click="showCompanions = true">
          👥 随从 <span v-if="player.companions.length" class="badge-n">{{ player.companions.length }}</span>
        </button>
        <button class="btn" @click="showQuests = true">
          📜 委托 <span v-if="player.openQuests.length" class="badge-n">{{ player.openQuests.length }}</span>
        </button>
        <button class="btn" @click="openTownPanel">🏛 镇务</button>
      </div>
      <div class="right">
        <button class="btn ghost" @click="router.push('/guide')">📖 帮助</button>
        <button class="btn ghost" @click="saveNow">💾 保存</button>
      </div>
    </div>

    <!-- A building opened: the panels are the very ones the old settlement
         screen used, so nothing about the town is duplicated. -->
    <div v-if="sheet" class="sheet-overlay" @click.self="sheet = null">
      <div class="sheet panel">
        <header class="sheet-head">
          <h2>{{ sheet.icon }} {{ sheet.title }}</h2>
          <span class="muted small">{{ sheet.note }}</span>
          <button class="btn ghost" @click="sheet = null">✕</button>
        </header>
        <div class="sheet-body scroll">
          <MarketPanel v-if="sheet.key === 'market'" />
          <RecruitPanel v-else-if="sheet.key === 'recruit'" :settlement="settlement" />
          <UpgradePanel v-else-if="sheet.key === 'upgrade'" />
          <TownPanel v-else-if="sheet.key === 'town'" :settlement="settlement" />
          <div v-else-if="sheet.key === 'tavern'" class="tavern">
            <p class="muted">酒馆里坐着镇上的人。想和谁说话，点他一下；想找人上路，先完成他的委托。</p>
            <div class="people">
              <button v-for="n in scene.npcs" :key="n.id" class="person" @click="talkTo(n)">
                <img class="person-art" :src="spriteUrl(n.sprite)" :alt="n.name" />
                <span class="person-name">{{ n.name }}</span>
                <span class="person-role">{{ n.title }}</span>
                <span class="person-mark" :class="{ done: questDone(n) }">{{ questMark(n) }}</span>
              </button>
            </div>
            <button class="btn" @click="sheet = null; showCompanions = true">👥 管理随从</button>
          </div>
          <!-- The hospital is a place to rest, not a shop: it shows what the
               town does for the wounded and lets the lord wait a while. -->
          <div v-else-if="sheet.key === 'hospital'" class="hospital">
            <div class="stat-grid">
              <div class="stat"><span class="k">医院等级</span><span class="v">Lv.{{ hospitalLevel }}</span></div>
              <div class="stat"><span class="k">每天恢复</span><span class="v">{{ healPerDay }} 点</span></div>
              <div class="stat"><span class="k">伤兵</span><span class="v">{{ player.wounded }} 名</span></div>
              <div class="stat"><span class="k">领主生命</span><span class="v">{{ player.lordHp }} / {{ player.lordMaxHp }}</span></div>
            </div>
            <p class="muted">
              在城镇里时间走得慢（现实 1 秒 = 游戏 1 分钟），伤兵和领主都会慢慢恢复。
              自己占领的城镇恢复得更快，医院每一级再加快一半。
            </p>
            <button class="btn" @click="sheet = null">继续休息</button>
          </div>
          <div v-else class="tavern">
            <p class="quote">「{{ chatter }}」</p>
            <div class="people">
              <button v-for="n in scene.npcs" :key="n.id" class="person" @click="talkTo(n)">
                <img class="person-art" :src="spriteUrl(n.sprite)" :alt="n.name" />
                <span class="person-name">{{ n.name }}</span>
                <span class="person-role">{{ n.title }}</span>
                <span class="person-mark" :class="{ done: questDone(n) }">{{ questMark(n) }}</span>
              </button>
            </div>
            <button class="btn small" @click="nextChatter">再说一句</button>
          </div>
        </div>
      </div>
    </div>

    <NpcDialog
      v-if="talkNpc"
      :npc="talkNpc"
      :town-id="settlement.id"
      :town-name="settlement.name"
      @close="talkNpc = null"
      @hired="onHired"
    />

    <QuestPanel v-if="showQuests" @close="showQuests = false" />

    <CompanionPanel v-if="showCompanions" @close="showCompanions = false" />

    <ExamModal v-if="showExam" :settlement="settlement" @close="showExam = false" />
  </div>
</template>

<script setup>
/**
 * The town screen: one settlement, walked through instead of listed.
 *
 * The old settlement screen is still there for the numbers — this screen is the
 * place itself: a square to cross, houses and facilities to walk up to, and the
 * people who live there. Entering a building opens the same panels the
 * management screen uses, so there is exactly one implementation of the market,
 * the barracks and the town books.
 *
 * 城镇界面：把据点当作一个可以走动的场景。房屋与设施就是原来的各个面板，
 * 居民与 NPC 提供对话、委托与随从。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { buildScene } from '@/game/town'
import { levelOf, ownerOf, facilityLevel, healRate } from '@/game/settlement'
import { persistGame } from '@/composables/gameState'
import { spriteUrl } from '@/game/pixelAssets'
import TownMap from '@/components/TownMap.vue'
import NpcDialog from '@/components/NpcDialog.vue'
import CompanionPanel from '@/components/CompanionPanel.vue'
import QuestPanel from '@/components/QuestPanel.vue'
import MarketPanel from '@/components/MarketPanel.vue'
import RecruitPanel from '@/components/RecruitPanel.vue'
import UpgradePanel from '@/components/UpgradePanel.vue'
import TownPanel from '@/components/TownPanel.vue'
import ExamModal from '@/components/ExamModal.vue'
import DayClock from '@/components/DayClock.vue'

const route = useRoute()
const router = useRouter()
const world = useWorldStore()
const player = usePlayerStore()

const mapEl = ref(null)
const near = ref(null)
const sheet = ref(null)
const talkNpc = ref(null)
const showCompanions = ref(false)
const showQuests = ref(false)
const showExam = ref(false)
const toast = ref('')
let toastTimer = 0

const settlement = computed(() => world.settlements.find((s) => s.id === route.query.id) || null)
const scene = computed(() => (settlement.value ? buildScene(settlement.value) : null))
const level = computed(() => levelOf(settlement.value))
const owner = computed(() => ownerOf(settlement.value))
const hospitalLevel = computed(() => facilityLevel(settlement.value, 'hospital'))
const healPerDay = computed(() =>
  Math.round(
    healRate({
      inSettlement: true,
      ownTown: settlement.value?.owner === 'player',
      level: settlement.value?.level || 1,
      hospital: hospitalLevel.value,
      surgery: player.attributes.surgery,
      medicine: player.milestoneEffects.healMul > 1
    })
  )
)

/** The label of the button that uses whatever the lord is standing next to. */
const nearLabel = computed(() => {
  const target = near.value
  if (!target) return ''
  if (target.kind === 'npc') return `💬 和 ${target.npc.name} 说话`
  return `🚪 进入 ${target.building.name}`
})

// Small talk of the wells and the common houses: a town should feel like it has
// more to say than its shopkeepers.
const CHATTER = [
  '听说北边的路上又有强盗了，走之前多带点粮。',
  '谁能想到，几年前这里还只有一口井和两间房。',
  '领主大人，镇上的人都盼着你能把路修好。',
  '铁匠说今年的铁贵了，一把好剑要攒三个月的钱。',
  '学堂里的孩子今天又背会了一首诗。'
]
const chatterIndex = ref(0)
const chatter = computed(() => CHATTER[chatterIndex.value % CHATTER.length])
function nextChatter() {
  chatterIndex.value += 1
}

function flash(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2200)
}

function questDone(npc) {
  return !!player.quests[npc.id]?.done
}

/** The state of one townsperson's job, in one word for the people list. */
function questMark(npc) {
  const state = player.quests[npc.id]
  if (!state) return '? 有委托'
  if (state.done) return '✓ 委托已完成'
  return '! 委托进行中'
}

/** Open the right panel for a building: a few are full-screen modals. */
function openBuilding(building) {
  const tiles = { market: '🛒', recruit: '🛡️', upgrade: '⬆️', town: '🏛️', tavern: '🍺', hospital: '🏥' }
  if (building.panel === 'exam') {
    showExam.value = true
    return
  }
  sheet.value = {
    key: building.panel,
    title: building.name,
    note: building.note,
    icon: tiles[building.panel] || '🏠'
  }
}

function openTownPanel() {
  sheet.value = { key: 'town', title: '镇务', note: '资金、发展、设施与驻军', icon: '🏛️' }
}

function talkTo(npc) {
  sheet.value = null
  talkNpc.value = npc
}

function onHired(npc) {
  flash(`🤝 ${npc.name}加入了你的队伍，去「👥 随从」里给他分配士兵`)
  talkNpc.value = null
}

/** Whatever the lord tapped, or whatever he stands next to. */
function onInteract(target) {
  if (!target) return
  if (target.kind === 'npc') talkTo(target.npc)
  else openBuilding(target.building)
}

function useNear() {
  if (!near.value) return
  if (near.value.kind === 'npc') talkTo(near.value.npc)
  else openBuilding(near.value.building)
}

function leaveTown() {
  persistGame()
  world.leaveRest()
  router.push('/world')
}

function saveNow() {
  persistGame()
  flash('进度已保存 💾')
}

// Resting inside the town: the clock runs slowly, the wounded heal and the town
// keeps developing while the lord walks its streets.
let raf = 0
let last = 0
function restLoop(now) {
  const dt = last ? (now - last) / 1000 : 0
  last = now
  if (settlement.value) world.restTick(dt, settlement.value.id)
  raf = requestAnimationFrame(restLoop)
}

watch(
  () => route.query.id,
  () => {
    near.value = null
    sheet.value = null
  }
)

onMounted(() => {
  if (!player.username) {
    router.replace('/')
    return
  }
  if (!settlement.value) {
    router.replace('/world')
    return
  }
  if (!scene.value) {
    router.replace('/world')
    return
  }
  world.markVisited(settlement.value.id)
  raf = requestAnimationFrame(restLoop)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  world.leaveRest()
})
</script>

<style scoped>
.town-page {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #16200f;
}

.map {
  position: absolute;
  inset: 0;
}

.hud-top {
  position: absolute;
  top: calc(10px + env(safe-area-inset-top));
  left: 10px;
  right: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  z-index: 5;
  pointer-events: none;
}

.hud-top > * {
  pointer-events: auto;
}

.chip {
  backdrop-filter: blur(6px);
}

.btn-chip {
  color: #fff;
  border-color: var(--gold-deep);
  background: rgba(20, 26, 20, 0.75);
  font-weight: 700;
}

.chip.title {
  color: var(--gold);
  border-color: var(--gold-deep);
  font-weight: 700;
  letter-spacing: 1px;
}

.chip.title .lv {
  font-size: 11.5px;
  color: var(--ink-dim);
  margin-left: 6px;
  letter-spacing: 0;
}

.chip.gold {
  color: var(--gold);
  border-color: var(--gold-deep);
}

.chip.owner {
  background: rgba(0, 0, 0, 0.3);
}

.hint-bar {
  position: absolute;
  top: calc(58px + env(safe-area-inset-top));
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 5;
  pointer-events: none;
}

.tip {
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(10, 14, 10, 0.5);
  font-size: 11.5px;
  color: var(--ink-dim);
}

.toast {
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(10, 14, 10, 0.92);
  border: 1px solid var(--gold-deep);
  color: var(--gold);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  box-shadow: var(--shadow);
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
  gap: 10px;
  z-index: 5;
}

.left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.right {
  display: flex;
  gap: 8px;
}

.btn.action {
  font-size: 15px;
  padding: 13px 18px;
  border-color: var(--gold);
  color: #2b1e05;
  background: linear-gradient(180deg, var(--gold), var(--gold-deep));
  font-weight: 700;
}

.badge-n {
  display: inline-block;
  margin-left: 4px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--line);
  font-size: 11.5px;
}

/* The building sheet: the panels of the settlement screen, mounted over the
   scene so the lord never loses sight of where he is. */
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 9, 6, 0.6);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  z-index: 28;
}

.sheet {
  width: min(720px, 100%);
  max-height: min(88vh, 760px);
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 10px;
}

.sheet-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sheet-head h2 {
  margin: 0;
  font-size: 18px;
  color: var(--gold);
  letter-spacing: 1px;
}

.sheet-head .small {
  flex: 1;
  font-size: 12px;
}

.sheet-body {
  min-height: 0;
  overflow: auto;
}

.tavern,
.hospital,
.chatter {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.people {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 8px;
  width: 100%;
}

.person {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  text-align: center;
}

.person:hover {
  background: rgba(232, 197, 106, 0.12);
}

.person-art {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
}

.person-name {
  font-weight: 700;
  font-size: 13.5px;
}

.person-role {
  font-size: 11.5px;
  color: var(--ink-dim);
}

.person-mark {
  font-size: 11px;
  color: #ffd76a;
}

.person-mark.done {
  color: #8fe08a;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  width: 100%;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid var(--line);
}

.stat .k {
  font-size: 11.5px;
  color: var(--ink-dim);
}

.stat .v {
  font-size: 15px;
  font-weight: 700;
  color: #ffe9a8;
}

.quote {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 560px) {
  .hud-top {
    gap: 6px;
  }

  .hint-bar {
    top: calc(96px + env(safe-area-inset-top));
  }

  .hud-bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 0 10px;
  }

  .left {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .left .btn.action {
    grid-column: 1 / -1;
  }

  .left .btn,
  .right .btn {
    width: 100%;
    font-size: 13.5px;
    padding: 11px 8px;
  }

  .right {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
}
</style>
