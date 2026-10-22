<template>
  <div class="settlement-page">
    <header class="head panel">
      <button class="btn ghost" @click="leave">← 返回世界地图</button>
      <div class="title">
        <span class="kind">{{ settlement.kind === 'town' ? '🏰 城镇' : '🏘️ 村庄' }}</span>
        <h1>{{ settlement ? settlement.name : '未知据点' }}</h1>
        <span v-if="settlement" class="chip level" title="城镇等级">Lv.{{ level.level }} {{ level.name }}</span>
      </div>
      <div class="head-right">
        <DayClock note="⏳ 镇内 1 秒 = 1 分钟" live />
        <span v-if="settlement" class="chip owner" :style="{ borderColor: owner.color, color: owner.color }">
          {{ owner.name }}
        </span>
        <div class="chip gold">🪙 {{ player.gold }}</div>
        <div class="chip">🛡️ {{ player.totalTroops }} 兵</div>
      </div>
    </header>

    <template v-if="settlement">
      <nav class="tabs panel">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="tab"
          :class="{ on: tab === t.key }"
          @click="tab = t.key"
        >
          {{ t.icon }} {{ t.name }}
        </button>
      </nav>

      <main class="content panel scroll">
        <RecruitPanel v-if="tab === 'recruit'" :settlement="settlement" />
        <UpgradePanel v-else-if="tab === 'upgrade'" />
        <MarketPanel v-else-if="tab === 'market'" />
        <TownPanel v-else-if="tab === 'town'" :settlement="settlement" />
        <div v-else-if="tab === 'exam'" class="exam-entry">
          <div class="exam-card">
            <div class="exam-icon">📜</div>
            <h2>城镇考试任务</h2>
            <p class="muted">
              参加考试并答对题目来赚取金币。题目按三年级、四年级分级，包含英文、语文、数学、逻辑推理与百科知识；
              答错的题目会更常出现，答对的题目会越出越少。
            </p>
            <p v-if="mine" class="muted">
              这座城镇属于你：考试的收入会变成城镇资金，答对的题目还会提升城镇发展。
            </p>
            <div class="exam-stats muted">
              已参加 {{ player.stats.exams }} 次 · 累计答对 {{ player.stats.correct }} 题
            </div>
            <button class="btn big" @click="showExam = true">开始考试</button>
          </div>
        </div>
      </main>
    </template>

    <ExamModal v-if="showExam && settlement" :settlement="settlement" @close="showExam = false" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import RecruitPanel from '@/components/RecruitPanel.vue'
import UpgradePanel from '@/components/UpgradePanel.vue'
import MarketPanel from '@/components/MarketPanel.vue'
import TownPanel from '@/components/TownPanel.vue'
import ExamModal from '@/components/ExamModal.vue'
import DayClock from '@/components/DayClock.vue'
import { levelOf, ownerOf } from '@/game/settlement'
import { persistGame } from '@/composables/gameState'

const route = useRoute()
const router = useRouter()
const world = useWorldStore()
const player = usePlayerStore()

const tab = ref('recruit')
const showExam = ref(false)

const settlement = computed(() => world.settlements.find((s) => s.id === route.query.id) || null)
const level = computed(() => levelOf(settlement.value))
const owner = computed(() => ownerOf(settlement.value))
const mine = computed(() => settlement.value?.owner === 'player')

const tabs = computed(() => {
  const base = [
    { key: 'recruit', name: '招募', icon: '🛡️' },
    { key: 'upgrade', name: '升级', icon: '⬆️' },
    { key: 'market', name: '市场', icon: '🛒' },
    { key: 'town', name: '城镇', icon: '🏛️' }
  ]
  if (settlement.value?.kind === 'town') base.push({ key: 'exam', name: '考试', icon: '📜' })
  return base
})

function leave() {
  persistGame()
  world.leaveRest()
  router.push('/world')
}

// Resting in a settlement: the clock runs, the wounded heal and the town
// keeps developing. The parties on the map hold their ground.
let raf = 0
let last = 0
function restLoop(now) {
  const dt = last ? (now - last) / 1000 : 0
  last = now
  if (settlement.value) world.restTick(dt, settlement.value.id)
  raf = requestAnimationFrame(restLoop)
}

onMounted(() => {
  if (!player.username) {
    router.replace('/')
    return
  }
  if (!settlement.value) {
    router.replace('/world')
    return
  }
  if (settlement.value.kind !== 'town' && tab.value === 'exam') tab.value = 'recruit'
  raf = requestAnimationFrame(restLoop)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  world.leaveRest()
})
</script>

<style scoped>
.settlement-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: radial-gradient(900px 500px at 50% -10%, rgba(232, 197, 106, 0.10), transparent 62%), var(--bg-deep);
  overflow: hidden;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  flex-wrap: wrap;
}

.title {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 180px;
}

.kind {
  font-size: 13px;
  color: var(--ink-dim);
}

.head h1 {
  margin: 0;
  font-size: 22px;
  color: var(--gold);
  letter-spacing: 2px;
}

.head-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.chip.level {
  color: #ffefbd;
  background: rgba(232, 197, 106, 0.2);
  border-color: var(--gold-deep);
  font-weight: 700;
}

.chip.owner {
  background: rgba(0, 0, 0, 0.3);
}

.chip.gold {
  color: var(--gold);
  border-color: var(--gold-deep);
}

.tabs {
  display: flex;
  gap: 6px;
  padding: 6px;
  flex-wrap: wrap;
}

.tab {
  padding: 9px 18px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14.5px;
  color: var(--ink-dim);
  transition: all 0.15s;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.07);
}

.tab.on {
  background: linear-gradient(180deg, var(--gold), var(--gold-deep));
  color: #2b1e05;
}

.content {
  flex: 1;
  padding: 16px;
  min-height: 0;
}

.exam-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.exam-card {
  max-width: 460px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.exam-icon {
  font-size: 52px;
}

.exam-card h2 {
  margin: 0;
  color: var(--gold);
}

.exam-stats {
  font-size: 13px;
}

.btn.big {
  padding: 14px 34px;
  font-size: 17px;
}

/* Phones: give each header control its own row and make the tabs tappable. */
@media (max-width: 560px) {
  .settlement-page {
    padding: 8px;
    gap: 8px;
  }

  .head {
    padding: 10px 12px;
    gap: 8px;
  }

  .head > .btn.ghost,
  .title,
  .head-right {
    width: 100%;
  }

  .title {
    min-width: 0;
    justify-content: space-between;
  }

  .head h1 {
    font-size: 19px;
    letter-spacing: 1px;
  }

  .tabs {
    gap: 4px;
    padding: 5px;
  }

  .tab {
    flex: 1 1 auto;
    padding: 10px 8px;
    font-size: 13.5px;
    text-align: center;
  }

  .content {
    padding: 12px 10px;
  }
}
</style>
