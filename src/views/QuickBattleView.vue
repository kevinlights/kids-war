<template>
  <div class="quick scroll">
    <div class="content">
      <header class="head">
        <button class="back" @click="router.push('/')">← 返回首页</button>
        <h1>⚡ 快速战斗</h1>
        <p class="sub">选战场、选敌我、选兵力，模拟器替你打一遍 · Quick battle simulator</p>
      </header>

      <!-- The battlefield -->
      <section class="panel block">
        <div class="block-title">🗺️ 战场地图 · Battlefield</div>
        <div class="grid maps">
          <button
            v-for="m in MAPS"
            :key="m.key"
            class="pick"
            :class="{ on: options.map === m.key }"
            @click="options.map = m.key"
          >
            <span class="pick-icon">{{ m.icon }}</span>
            <span class="pick-name">{{ m.name }}</span>
          </button>
        </div>
        <p class="note">{{ mapInfo.note }}</p>
      </section>

      <!-- The two sides -->
      <section class="panel block">
        <div class="block-title">⚔️ 敌我势力 · The two sides</div>
        <div class="sides">
          <div class="side">
            <div class="side-title">🛡️ 己方</div>
            <div class="grid">
              <button
                v-for="a in ARMIES"
                :key="a.key"
                class="pick"
                :class="{ on: options.army === a.key }"
                @click="options.army = a.key"
              >
                <span class="pick-icon">{{ a.icon }}</span>
                <span class="pick-name">{{ a.name }}</span>
              </button>
            </div>
            <p class="note">{{ armyInfo.note }}</p>
          </div>
          <div class="side">
            <div class="side-title">🪓 敌方</div>
            <div class="grid">
              <button
                v-for="f in FACTIONS"
                :key="f.key"
                class="pick"
                :class="{ on: options.faction === f.key }"
                @click="options.faction = f.key"
              >
                <span class="pick-icon">{{ f.icon }}</span>
                <span class="pick-name">{{ f.name }}</span>
              </button>
            </div>
            <p class="note">{{ factionInfo.note }}</p>
          </div>
        </div>
      </section>

      <!-- The size of the armies and the number of fights -->
      <section class="panel block">
        <div class="block-title">🪖 士兵规模 · Size of the armies</div>
        <div class="grid scales">
          <button
            v-for="s in SCALES"
            :key="s.key"
            class="pick"
            :class="{ on: options.scale === s.key }"
            @click="options.scale = s.key"
          >
            <span class="pick-name">{{ s.name }}</span>
            <span class="pick-sub">{{ s.perSide }} × {{ s.perSide }}</span>
          </button>
        </div>
        <div class="block-title rounds">🔁 模拟场次 · Rounds</div>
        <div class="grid rounds-grid">
          <button
            v-for="r in ROUNDS"
            :key="r.key"
            class="pick"
            :class="{ on: String(options.rounds) === r.key }"
            @click="options.rounds = Number(r.key)"
          >
            <span class="pick-name">{{ r.name }}</span>
          </button>
        </div>
      </section>

      <button class="btn go" :disabled="running" @click="run">
        {{ running ? '⏳ 模拟中…' : '⚡ 开始模拟' }}
      </button>

      <!-- The progress of the simulation -->
      <div v-if="running || done" class="panel progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${percent}%` }"></div>
        </div>
        <span class="progress-text">{{ doneText }}</span>
      </div>

      <!-- The result of the simulation -->
      <section v-if="report" class="panel result">
        <div class="result-head">
          <div class="winrate">
            <b>{{ report.winRate }}%</b>
            <span>胜率 · Win rate</span>
          </div>
          <div class="tally">
            <div class="tally-item win">🏆 胜 {{ report.wins }}</div>
            <div class="tally-item lose">💀 负 {{ report.losses }}</div>
            <div class="tally-item draw">🤝 平 {{ report.draws }}</div>
          </div>
        </div>

        <p class="setup muted">
          {{ mapInfo.icon }} {{ mapInfo.name }} · {{ armyInfo.icon }} {{ armyInfo.name }} × {{ report.scale.perSide }} vs
          {{ factionInfo.icon }} {{ factionInfo.name }} × {{ report.scale.perSide }} · {{ report.rounds }} 场
        </p>

        <div class="stats">
          <div class="stat"><span>我方平均剩余</span><b>{{ report.avgPlayerAlive }}</b></div>
          <div class="stat"><span>我方平均阵亡</span><b>{{ report.avgPlayerFallen }}</b></div>
          <div class="stat"><span>敌方平均阵亡</span><b>{{ report.avgEnemyFallen }}</b></div>
          <div class="stat"><span>平均时长</span><b>{{ report.avgTime }}s</b></div>
        </div>

        <div class="rounds-title">每场结果 · Every round</div>
        <div class="round-list">
          <div v-for="(r, i) in report.results" :key="i" class="round-row" :class="r.outcome">
            <span class="round-no">#{{ i + 1 }}</span>
            <span class="round-out">{{ outcomeText(r.outcome) }}</span>
            <span class="round-detail">我 {{ r.playerAlive }} · 敌 {{ r.enemyAlive }} · {{ r.time }}s</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  QUICK_ENEMY_FACTIONS,
  QUICK_MAPS,
  QUICK_PLAYER_ARMIES,
  QUICK_ROUNDS,
  QUICK_SCALES,
  quickFactionOf,
  quickScaleOf,
  runQuickBattle
} from '@/game/quickBattle'
import { arenaMapOf } from '@/game/arena'

const router = useRouter()

const MAPS = QUICK_MAPS
const ARMIES = QUICK_PLAYER_ARMIES
const FACTIONS = QUICK_ENEMY_FACTIONS
const SCALES = QUICK_SCALES
const ROUNDS = QUICK_ROUNDS

// The settings of the simulation.
const options = ref({
  map: 'mixed',
  army: 'spearman',
  faction: 'bandit',
  scale: 'company',
  rounds: 20
})

const running = ref(false)
const done = ref(0)
const report = ref(null)

const mapInfo = computed(() => arenaMapOf(options.value.map))
const armyInfo = computed(
  () => QUICK_PLAYER_ARMIES.find((a) => a.key === options.value.army) || QUICK_PLAYER_ARMIES[0]
)
const factionInfo = computed(() => quickFactionOf(options.value.faction))

const percent = computed(() =>
  report.value ? 100 : Math.round((done.value / Math.max(1, options.value.rounds)) * 100)
)
const doneText = computed(
  () => `已完成 ${done.value} / ${options.value.rounds} 场 · ${percent.value}%`
)

function outcomeText(outcome) {
  if (outcome === 'win') return '🏆 胜'
  if (outcome === 'lose') return '💀 负'
  return '🤝 平'
}

/** Run the whole simulation and show what came out of it. */
async function run() {
  if (running.value) return
  running.value = true
  done.value = 0
  report.value = null
  try {
    report.value = await runQuickBattle(
      { ...options.value, seed: Math.floor(Math.random() * 1e9) },
      (finished) => {
        done.value = finished
      }
    )
  } finally {
    running.value = false
  }
}
</script>

<style scoped>
.quick {
  position: relative;
  height: 100%;
  background: linear-gradient(180deg, #1a2418, #0c110c);
}

.content {
  position: relative;
  max-width: 620px;
  margin: 0 auto;
  padding: 26px 16px 50px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.head {
  text-align: center;
}

.back {
  font-size: 13px;
  color: var(--ink-dim);
  text-decoration: underline;
  text-underline-offset: 3px;
}

h1 {
  margin: 8px 0 4px;
  font-size: 30px;
  letter-spacing: 4px;
  color: var(--gold);
  text-shadow: 0 3px 0 #6d5119;
}

.sub {
  margin: 0;
  font-size: 12px;
  color: var(--ink-dim);
  letter-spacing: 1px;
}

.block {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.block-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--gold);
}

.block-title.rounds {
  margin-top: 4px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.grid.maps {
  grid-template-columns: repeat(3, 1fr);
}

.grid.scales {
  grid-template-columns: repeat(4, 1fr);
}

.grid.rounds-grid {
  grid-template-columns: repeat(3, 1fr);
}

.pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-height: 56px;
  padding: 8px 4px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  transition: all 0.15s;
}

.pick.on {
  background: rgba(232, 197, 106, 0.22);
  border-color: var(--gold);
  color: var(--gold);
}

.pick-icon {
  font-size: 19px;
  line-height: 1;
}

.pick-name {
  font-size: 13.5px;
  font-weight: 700;
}

.pick-sub {
  font-size: 11px;
  color: var(--ink-dim);
}

.sides {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-dim);
}

.btn.go {
  padding: 16px;
  font-size: 17px;
  letter-spacing: 2px;
}

.progress {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--line);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-deep), var(--gold));
  transition: width 0.15s linear;
}

.progress-text {
  font-size: 12px;
  color: var(--ink-dim);
}

.result {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.winrate {
  display: flex;
  flex-direction: column;
}

.winrate b {
  font-size: 34px;
  color: var(--gold);
  line-height: 1.1;
}

.winrate span {
  font-size: 11.5px;
  color: var(--ink-dim);
}

.tally {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tally-item {
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
}

.tally-item.win {
  color: #ffe9a8;
  border-color: rgba(232, 197, 106, 0.6);
}

.tally-item.lose {
  color: #f0b3a5;
  border-color: rgba(216, 83, 63, 0.6);
}

.setup {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  font-size: 11.5px;
  color: var(--ink-dim);
}

.stat b {
  font-size: 17px;
  color: var(--ink);
}

.rounds-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--gold);
}

.round-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
}

.round-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 5px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 12.5px;
}

.round-no {
  color: var(--ink-dim);
  min-width: 32px;
}

.round-out {
  font-weight: 700;
  min-width: 52px;
}

.round-row.win .round-out {
  color: #ffe9a8;
}

.round-row.lose .round-out {
  color: #f0b3a5;
}

.round-detail {
  color: var(--ink-dim);
}

/* Phones: the picks stay big enough for a thumb. */
@media (max-width: 560px) {
  .content {
    padding: 20px 12px 40px;
  }

  h1 {
    font-size: 25px;
  }

  .grid.maps,
  .grid.rounds-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .grid.scales {
    grid-template-columns: repeat(2, 1fr);
  }

  .pick {
    min-height: 52px;
    font-size: 12.5px;
  }
}
</style>
