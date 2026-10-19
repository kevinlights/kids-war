<template>
  <div class="battle-view">
    <BattleMap class="map" @end="onEnd" />

    <div class="hud-top">
      <div class="side player">
        <span class="dot" style="background: #4aa3ff"></span>
        我方 {{ playerAlive }}
      </div>
      <div class="vs">⚔️ 战斗</div>
      <div class="side enemy">
        <span class="dot" :style="{ background: enemyColor }"></span>
        {{ enemyName }} {{ enemyAlive }}
      </div>
    </div>

    <div v-if="hungry" class="warn">🌾 军粮不足，部队士气低落（攻击下降）</div>

    <div class="command">
      <!-- Squad selector: one chip per family and rank, plus 全军. -->
      <div class="chips">
        <button class="chip all" :class="{ on: battle.selectedGroup === null }" @click="battle.selectGroup(null)">
          <span class="chip-art">🎖️</span>
          <span class="chip-text"><b>全军</b><i>{{ playerAlive }} 名</i></span>
        </button>
        <button
          v-for="g in groups"
          :key="g.key"
          class="chip"
          :class="{ on: battle.selectedGroup === g.key, gone: g.alive === 0 }"
          @click="battle.selectGroup(g.key)"
        >
          <img class="chip-art" :src="spriteUrl(unitSprite(g.type, g.tier))" :alt="g.name" />
          <span class="chip-text">
            <b>{{ g.name }}</b>
            <i>{{ g.alive }}/{{ g.total }} 名</i>
          </span>
          <span class="chip-tag">{{ orderOf(g.order).icon }} {{ formationOf(g.formation).icon }}</span>
        </button>
      </div>

      <!-- Tactics: applied to the selected squad, or to everyone. -->
      <div class="row orders">
        <button
          v-for="o in ORDERS"
          :key="o.key"
          class="cmd"
          :class="{ on: order === o.key }"
          :title="o.hint"
          @click="battle.setOrder(o.key)"
        >
          <span class="cmd-icon">{{ o.icon }}</span>
          <span class="cmd-name">{{ o.name }}</span>
        </button>
      </div>

      <!-- Formation and density, folded away by default to keep the field big. -->
      <button class="sheet-toggle" @click="showSheet = !showSheet">
        <span>▦ 队形 · {{ formationLabel }} · {{ densityLabel }}</span>
        <span class="chev">{{ showSheet ? '▾' : '▴' }}</span>
      </button>

      <div v-if="showSheet" class="sheet">
        <div class="sheet-row">
          <button
            v-for="f in FORMATIONS"
            :key="f.key"
            class="grid-btn"
            :class="{ on: formation === f.key }"
            :title="f.note"
            @click="battle.setFormation(f.key)"
          >
            <span class="gb-icon">{{ f.icon }}</span>
            <span class="gb-name">{{ f.name }}</span>
          </button>
        </div>
        <div class="sheet-row dens">
          <button
            v-for="d in DENSITIES"
            :key="d.key"
            class="grid-btn wide"
            :class="{ on: density === d.key }"
            :title="d.note"
            @click="battle.setDensity(d.key)"
          >
            <span class="gb-icon">{{ d.icon }}</span>
            <span class="gb-name">{{ d.name }}</span>
          </button>
        </div>
        <p class="sheet-note">{{ sheetNote }}</p>
      </div>

      <div class="hint">{{ hint }}</div>
    </div>

    <!-- Result overlay -->
    <div v-if="result" class="overlay">
      <div class="result panel pop">
        <h2 :class="result.outcome">{{ result.outcome === 'win' ? '🏆 大获全胜' : '💀 战斗失利' }}</h2>

        <div v-if="result.outcome === 'win'" class="loot">
          <div class="loot-item">🪙 战利品 <b>+{{ result.loot }}</b></div>
          <div v-if="result.recruits" class="loot-item">🎖️ 收编俘虏 <b>+{{ result.recruits }} 民兵</b></div>
          <div v-if="result.captured" class="loot-item">🏛️ 占领城镇 <b>这座城镇归你了</b></div>
        </div>
        <p v-else class="muted lose-tip">部队损失惨重，退回安全地带修养，先去城镇考试赚钱补充兵力吧。</p>

        <div class="casualties">
          <div class="casualty">🩸 阵亡 <b>{{ result.fallen || 0 }}</b></div>
          <div class="casualty">🤕 受伤 <b>{{ result.wounded || 0 }}</b></div>
          <div v-if="result.saved" class="casualty">🏥 救回 <b>{{ result.saved }}</b></div>
        </div>

        <div class="survivors">
          <div class="survivors-title">幸存部队</div>
          <div class="survivor-list">
            <div v-for="u in survivors" :key="u.key" class="survivor">
              <img class="badge" :src="spriteUrl(unitSprite(u.type, u.tier))" :alt="u.name" />
              {{ u.name }} × {{ u.count }}
            </div>
            <div v-if="!survivors.length" class="muted">没有幸存者</div>
          </div>
        </div>

        <button class="btn big" @click="returnToWorld">返回世界地图</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BattleMap from '@/components/BattleMap.vue'
import { useBattleStore } from '@/stores/battle'
import { useWorldStore } from '@/stores/world'
import { ORDERS, FORMATIONS, DENSITIES, orderOf, formationOf, densityOf } from '@/game/battle'
import { factionOf } from '@/game/factions'
import { unitSprite } from '@/game/units'
import { spriteUrl } from '@/game/pixelAssets'
import { persistGame } from '@/composables/gameState'

const router = useRouter()
const battle = useBattleStore()
const world = useWorldStore()

const result = ref(null)
const showSheet = ref(false)

const groups = computed(() => battle.groups)
const order = computed(() => battle.order)
const formation = computed(() => battle.formation)
const density = computed(() => battle.density)
const hungry = computed(() => !!battle.context?.hungry)

const enemyName = computed(() => (battle.context ? factionOf(battle.context.faction).name : '敌军'))
const enemyColor = computed(() => (battle.context ? factionOf(battle.context.faction).color : '#d8533f'))

const playerAlive = computed(() => (battle.data ? battle.data.units.filter((u) => u.alive && u.side === 'player').length : 0))
const enemyAlive = computed(() => (battle.data ? battle.data.units.filter((u) => u.alive && u.side === 'enemy').length : 0))

/** Name of whatever the commands apply to right now. */
const scopeName = computed(() => (battle.selectedGroup ? battle.selected?.name || '该部队' : '全军'))

const formationLabel = computed(() => formationOf(formation.value).name)
const densityLabel = computed(() => densityOf(density.value).name)

/** Effect text of the selected formation and density, for the folded panel. */
const sheetNote = computed(
  () => `${formationOf(formation.value).note} · ${densityOf(density.value).note}`
)

const hint = computed(() => {
  if (order.value === 'move') return `${scopeName.value}：点击战场放置移动目标（黄色十字）`
  if (order.value === 'follow') return `${scopeName.value}跟随指挥官，点击战场可移动指挥官`
  if (order.value === 'defend') return `${scopeName.value}原地结阵防守，远程单位原地射击`
  return `${scopeName.value}冲锋，点击战场可移动指挥官`
})

/** Survivors of the fight, merged by family and rank. */
const survivors = computed(() => {
  const list = result.value?.summary?.remaining || []
  const out = []
  for (const u of list) {
    const found = out.find((x) => x.type === u.type && x.tier === u.tier)
    if (found) found.count += 1
    else out.push({ key: u.group, type: u.type, tier: u.tier, name: u.def?.name || u.type, count: 1 })
  }
  return out
})

function onEnd() {
  if (battle.data?.outcome) {
    result.value = battle.result || { outcome: battle.data.outcome, loot: 0, recruits: 0, summary: { remaining: [] } }
  }
}

function returnToWorld() {
  world.clearEncounter()
  battle.close()
  persistGame()
  router.push('/world')
}

onMounted(() => {
  if (!battle.active || !battle.data) {
    world.clearEncounter()
    router.replace('/world')
  }
})

watch(
  () => battle.settled,
  (done) => {
    if (done && !result.value) result.value = battle.result
  }
)
</script>

<style scoped>
.battle-view {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #0e140e;
}

.map {
  position: absolute;
  inset: 0;
}

.hud-top {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(8, 12, 8, 0.72);
  border: 1px solid var(--line);
  z-index: 5;
  white-space: nowrap;
}

.side {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.side.enemy {
  color: #f0b3a5;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.vs {
  color: var(--gold);
  font-weight: 800;
}

.warn {
  position: absolute;
  top: calc(62px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(120, 60, 30, 0.85);
  border: 1px solid rgba(216, 83, 63, 0.7);
  font-size: 13px;
  z-index: 5;
}

/* ------------------------------- command bar ------------------------------- */

.command {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(8, 12, 8, 0.35), rgba(8, 12, 8, 0.92) 34%);
  z-index: 5;
}

.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  min-height: 46px;
  padding: 6px 12px;
  border-radius: 12px;
  background: rgba(12, 16, 12, 0.88);
  border: 1px solid var(--line);
}

.chip.on {
  border-color: var(--gold);
  background: rgba(52, 42, 16, 0.95);
  box-shadow: 0 0 12px rgba(232, 197, 106, 0.35);
}

.chip.gone {
  opacity: 0.45;
}

.chip-art {
  width: 26px;
  height: 26px;
  font-size: 20px;
  line-height: 26px;
  text-align: center;
  image-rendering: pixelated;
  flex: none;
}

.chip-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.chip-text b {
  font-size: 13.5px;
}

.chip-text i {
  font-style: normal;
  font-size: 11px;
  color: var(--ink-dim);
}

.chip-tag {
  font-size: 12px;
  opacity: 0.85;
}

.row {
  display: flex;
  gap: 8px;
}

.orders .cmd {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 52px;
  padding: 6px 4px;
  border-radius: 12px;
  background: rgba(10, 14, 10, 0.88);
  border: 1px solid var(--line);
  transition: all 0.15s;
}

.orders .cmd.on {
  background: linear-gradient(180deg, var(--gold), var(--gold-deep));
  color: #2b1e05;
  border-color: #fff6d8;
  box-shadow: 0 0 14px rgba(232, 197, 106, 0.5);
}

.cmd-icon {
  font-size: 20px;
}

.cmd-name {
  font-size: 13px;
  font-weight: 700;
}

.sheet-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  background: rgba(10, 14, 10, 0.88);
  border: 1px solid var(--line);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}

.chev {
  color: var(--gold);
}

.sheet {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(6, 10, 6, 0.94);
  border: 1px solid var(--line);
}

.sheet-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.sheet-row.dens {
  grid-template-columns: repeat(2, 1fr);
}

.grid-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 44px;
  padding: 5px 2px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid transparent;
  transition: all 0.15s;
}

.grid-btn.on {
  background: rgba(232, 197, 106, 0.22);
  border-color: var(--gold);
  color: var(--gold);
}

.gb-icon {
  font-size: 15px;
  line-height: 1;
}

.gb-name {
  font-size: 12px;
  font-weight: 700;
}

.sheet-note {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink-dim);
}

.hint {
  font-size: 12.5px;
  color: var(--ink-dim);
  text-align: center;
}

/* --------------------------------- result --------------------------------- */

.result {
  width: min(520px, 100%);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  text-align: center;
}

.result h2 {
  margin: 0;
  font-size: 28px;
  letter-spacing: 3px;
}

.result h2.win {
  color: var(--gold);
}

.result h2.lose {
  color: #ef9a89;
}

.loot {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.loot-item {
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
}

.loot-item b {
  color: var(--gold);
}

/* Casualty line: dead, wounded and rescued soldiers. */
.casualties {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 10px 0;
}

.casualty {
  font-size: 13.5px;
  color: var(--ink-dim);
}

.casualty b {
  color: var(--gold);
  margin-left: 4px;
}

.lose-tip {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.survivors {
  width: 100%;
  text-align: left;
}

.survivors-title {
  font-size: 13px;
  color: var(--ink-dim);
  margin-bottom: 8px;
}

.survivor-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.survivor {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  font-size: 13.5px;
}

/* Native-size sprite, so the survivor list never resamples the art. */
.badge {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  flex: none;
}

.btn.big {
  padding: 14px 34px;
  font-size: 17px;
}

/* Phones: shrink the top bar and keep every command reachable by a thumb. */
@media (max-width: 560px) {
  .hud-top {
    gap: 8px;
    padding: 6px 12px;
    font-size: 13px;
  }

  .warn {
    font-size: 12px;
    padding: 5px 10px;
    max-width: 92vw;
    text-align: center;
    white-space: normal;
  }

  .command {
    gap: 6px;
  }

  .chip {
    min-height: 44px;
    padding: 5px 10px;
  }

  .chip-art {
    width: 24px;
    height: 24px;
  }

  .chip-text b {
    font-size: 12.5px;
  }

  .orders .cmd {
    min-height: 50px;
  }

  .cmd-icon {
    font-size: 18px;
  }

  .cmd-name {
    font-size: 12.5px;
  }

  .sheet-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .sheet-row.dens {
    grid-template-columns: repeat(2, 1fr);
  }

  .hint {
    font-size: 12px;
  }

  .result {
    padding: 18px 14px;
  }

  .result h2 {
    font-size: 23px;
  }
}
</style>
