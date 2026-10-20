<template>
  <div class="quick scroll">
    <div class="content">
      <header class="head">
        <button class="back" @click="router.push('/')">← 返回首页</button>
        <h1>⚡ 快速战斗</h1>
        <p class="sub">选战场、定兵力，进入战场真打一场 · Pick a field, set the armies, fight it out</p>
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

      <!-- The size of the armies -->
      <section class="panel block">
        <div class="block-title">🪖 士兵规模 · Size of the armies</div>
        <div class="grid scales">
          <button
            v-for="s in SCALES"
            :key="s.key"
            class="pick"
            :class="{ on: options.scale === s.key }"
            @click="setScale(s)"
          >
            <span class="pick-name">{{ s.name }}</span>
            <span class="pick-sub">{{ s.perSide }} × {{ s.perSide }}</span>
          </button>
        </div>
        <p class="note">规模只决定每方多少人，具体兵种的数量可以自己填。The size only says how many soldiers there are; the mix is yours to set.</p>
      </section>

      <!-- The two sides -->
      <section class="panel block">
        <div class="block-title">⚔️ 敌我势力 · The two sides</div>

        <div class="side">
          <div class="side-head">
            <span class="side-title">🛡️ 己方</span>
            <span class="side-total">{{ total(playerCounts) }} 名</span>
          </div>
          <div class="presets">
            <button
              v-for="a in ARMIES"
              :key="a.key"
              class="chip"
              @click="setPlayerArmy(a.key)"
            >
              {{ a.icon }} {{ a.name }}
            </button>
          </div>
          <div v-for="u in UNITS" :key="u.key" class="counter">
            <span class="counter-name">{{ u.icon }} {{ u.name }}</span>
            <div class="stepper">
              <button class="step" @click="change(playerCounts, u.key, -1)">−</button>
              <span class="num">{{ playerCounts[u.key] }}</span>
              <button class="step" @click="change(playerCounts, u.key, 1)">+</button>
            </div>
          </div>
        </div>

        <div class="side">
          <div class="side-head">
            <span class="side-title">🪓 敌方</span>
            <span class="side-total">{{ total(enemyCounts) }} 名</span>
          </div>
          <div class="presets">
            <button
              v-for="f in FACTIONS"
              :key="f.key"
              class="chip"
              :class="{ on: options.faction === f.key }"
              @click="setFaction(f.key)"
            >
              {{ f.icon }} {{ f.name }}
            </button>
          </div>
          <p class="note">{{ factionInfo.note }}</p>
          <div v-for="u in UNITS" :key="u.key" class="counter">
            <span class="counter-name">{{ u.icon }} {{ u.name }}</span>
            <div class="stepper">
              <button class="step" @click="change(enemyCounts, u.key, -1)">−</button>
              <span class="num">{{ enemyCounts[u.key] }}</span>
              <button class="step" @click="change(enemyCounts, u.key, 1)">+</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Into the battle -->
      <div class="actions">
        <button class="btn go" :disabled="!canFight" @click="startBattle">⚡ 进入战场</button>
        <button class="btn ghost" :disabled="running || !canFight" @click="simulate">
          {{ running ? '⏳ 模拟中…' : '📊 先看看胜率' }}
        </button>
      </div>
      <p v-if="!canFight" class="hint muted">两边都要有人才能开战。Both sides need at least one soldier.</p>

      <!-- The progress of the instant simulation -->
      <div v-if="running || done" class="panel progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${percent}%` }"></div>
        </div>
        <span class="progress-text">{{ doneText }}</span>
      </div>

      <!-- The report of the instant simulation -->
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

        <div class="stats">
          <div class="stat"><span>我方平均剩余</span><b>{{ report.avgPlayerAlive }}</b></div>
          <div class="stat"><span>我方平均阵亡</span><b>{{ report.avgPlayerFallen }}</b></div>
          <div class="stat"><span>敌方平均阵亡</span><b>{{ report.avgEnemyFallen }}</b></div>
          <div class="stat"><span>平均时长</span><b>{{ report.avgTime }}s</b></div>
        </div>

        <p class="setup muted">这是模拟出来的结果；点「⚡ 进入战场」自己指挥一场。This is the simulation; 「⚡ 进入战场」 is the fight you command yourself.</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  QUICK_ARMIES,
  QUICK_FACTIONS,
  QUICK_MAPS,
  QUICK_MAX_COUNT,
  QUICK_ROUNDS,
  QUICK_SCALES,
  QUICK_UNITS,
  armyCounts,
  buildQuickArmies,
  countTotal,
  emptyCounts,
  factionCounts,
  quickFactionOf,
  quickScaleOf,
  runQuickBattle,
  scaleCounts
} from '@/game/quickBattle'
import { arenaMapOf } from '@/game/arena'
import { useBattleStore } from '@/stores/battle'

const router = useRouter()
const battle = useBattleStore()

const MAPS = QUICK_MAPS
const ARMIES = QUICK_ARMIES
const FACTIONS = QUICK_FACTIONS
const SCALES = QUICK_SCALES
const UNITS = QUICK_UNITS

// The settings of the fight.
const options = ref({
  map: 'mixed',
  faction: 'bandit',
  scale: 'company'
})

// The soldiers of each side: every kind can be set to any number.
const playerCounts = ref(armyCounts('spearman', quickScaleOf('company').perSide))
const enemyCounts = ref(factionCounts('bandit', quickScaleOf('company').perSide))

const running = ref(false)
const done = ref(0)
const report = ref(null)

const mapInfo = computed(() => arenaMapOf(options.value.map))
const factionInfo = computed(() => quickFactionOf(options.value.faction))
const canFight = computed(
  () => countTotal(playerCounts.value) > 0 && countTotal(enemyCounts.value) > 0
)

const percent = computed(() =>
  report.value ? 100 : Math.round((done.value / Math.max(1, options.value.rounds || 20)) * 100)
)
const doneText = computed(() => `已完成 ${done.value} / ${options.value.rounds || 20} 场 · ${percent.value}%`)

/** How many soldiers a side has. */
function total(counts) {
  return countTotal(counts)
}

/** Add or remove one soldier of a kind. */
function change(counts, key, step) {
  const next = Math.max(0, Math.min(QUICK_MAX_COUNT, (counts[key] || 0) + step))
  counts[key] = next
}

/** The lord fields one kind of soldier. */
function setPlayerArmy(key) {
  playerCounts.value = armyCounts(key, quickScaleOf(options.value.scale).perSide)
}

/** The enemy fights with the mix of its faction. */
function setFaction(key) {
  options.value.faction = key
  enemyCounts.value = factionCounts(key, quickScaleOf(options.value.scale).perSide)
}

/** The size scales both sides, mix kept. */
function setScale(scale) {
  options.value.scale = scale.key
  const perSide = scale.perSide
  playerCounts.value = scaleCounts(playerCounts.value, perSide)
  enemyCounts.value = scaleCounts(enemyCounts.value, perSide)
}

/** Into the battle: the two armies meet on the chosen field. */
function startBattle() {
  if (!canFight.value) return
  const { playerTroops, enemyTroops } = buildQuickArmies({
    playerCounts: playerCounts.value,
    enemyCounts: enemyCounts.value
  })
  battle.startQuick({
    map: options.value.map,
    playerTroops,
    enemyTroops,
    enemyFaction: options.value.faction,
    seed: Math.floor(Math.random() * 1e9)
  })
  router.push('/battle')
}

/** The instant simulation: the same fight, over and over. */
async function simulate() {
  if (running.value) return
  running.value = true
  done.value = 0
  report.value = null
  try {
    report.value = await runQuickBattle(
      {
        map: options.value.map,
        faction: options.value.faction,
        playerCounts: playerCounts.value,
        enemyCounts: enemyCounts.value,
        rounds: 20,
        seed: Math.floor(Math.random() * 1e9)
      },
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

.side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
}

.side-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.side-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}

.side-total {
  font-size: 12px;
  color: var(--gold);
  font-weight: 700;
}

/* The one-tap presets: a whole army of one kind, or the mix of a faction. */
.presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink);
}

.chip.on {
  background: rgba(232, 197, 106, 0.22);
  border-color: var(--gold);
  color: var(--gold);
}

/* One row per kind of soldier: its name and a stepper for its count. */
.counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
}

.counter-name {
  font-size: 13.5px;
  font-weight: 700;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.step {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--line);
  color: var(--ink);
  font-size: 17px;
  line-height: 1;
  font-weight: 700;
}

.step:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.num {
  min-width: 38px;
  text-align: center;
  font-size: 16px;
  font-weight: 800;
  color: var(--gold);
}

.note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-dim);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.actions .btn {
  flex: 1;
  min-width: 160px;
}

.btn.go {
  padding: 16px;
  font-size: 17px;
  letter-spacing: 2px;
}

.hint {
  margin: 0;
  font-size: 13px;
  text-align: center;
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

/* Phones: the picks and the steppers stay big enough for a thumb. */
@media (max-width: 560px) {
  .content {
    padding: 20px 12px 40px;
  }

  h1 {
    font-size: 25px;
  }

  .grid.maps {
    grid-template-columns: repeat(3, 1fr);
  }

  .grid.scales {
    grid-template-columns: repeat(2, 1fr);
  }

  .pick {
    min-height: 52px;
    font-size: 12.5px;
  }

  .actions .btn {
    min-width: 0;
  }
}
</style>
