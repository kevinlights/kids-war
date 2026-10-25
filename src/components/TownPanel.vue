<template>
  <div class="panel-wrap">
    <div class="head panel">
      <div class="head-main">
        <div class="title">
          <b>{{ settlement.name }}</b>
          <span class="chip">Lv.{{ level.level }} {{ level.name }}</span>
          <span class="chip" :style="{ borderColor: owner.color, color: owner.color }">
            {{ owner.name }}
          </span>
        </div>
        <p class="muted small">
          {{
            mine
              ? '你的城镇：发展越高，繁荣度涨得越快；繁荣度达标就能升级。'
              : '这里由别的势力驻守，想要拿下这座城镇，先在地图上准备围城。'
          }}
        </p>
      </div>
      <div class="meters">
        <div class="meter">
          <div class="meter-label">
            繁荣度 <b>{{ Math.round(settlement.prosperity || 0) }}</b>
            <span class="muted" v-if="next !== null">/ {{ next }} 升级</span>
          </div>
          <div class="bar"><i class="fill prosperity" :style="{ width: settlement.prosperity + '%' }"></i></div>
        </div>
        <div class="meter">
          <div class="meter-label">发展 <b>{{ Math.round(settlement.development || 0) }}</b></div>
          <div class="bar"><i class="fill development" :style="{ width: settlement.development + '%' }"></i></div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="stat">
        <div class="big">🪙 {{ settlement.funds || 0 }}</div>
        <div class="muted">城镇资金</div>
      </div>
      <div class="stat">
        <div class="big">🏛️ {{ level.level }}</div>
        <div class="muted">城镇等级</div>
      </div>
      <div class="stat">
        <div class="big">🛡️ {{ garrisonCount(settlement.garrison) }}</div>
        <div class="muted">驻守士兵</div>
      </div>
      <div class="stat" v-if="mine">
        <div class="big">📈 {{ dailyIncome(settlement) }}</div>
        <div class="muted">每日收入</div>
      </div>
    </div>

    <!-- Development: the exam feeds it, the lord's gold can too. -->
    <div v-if="mine" class="block panel">
      <div class="block-head">
        <b>📈 投入发展</b>
        <span class="muted small">发展高于 40 时繁荣度上升，低于 40 时下降</span>
      </div>
      <div class="block-body">
        <button class="btn small" :disabled="player.gold < injectCost" @click="inject">
          注入资金 🪙 {{ injectCost }} → 城镇金库
        </button>
        <button class="btn small" :disabled="settlement.funds < investCost" @click="invest">
          投入发展 · 城镇资金 {{ investCost }} → 发展 +{{ investGain }}
        </button>
        <span class="muted small">考试的收入先进你的钱袋，再由你注入城镇；答对的题目也会提升城镇发展。</span>
      </div>
    </div>

    <!-- Facilities: the hospital heals, the barracks trains. -->
    <div v-if="mine" class="block panel">
      <div class="block-head">
        <b>🏗️ 城镇设施</b>
        <span class="muted small">用城镇资金建造，设施可以继续升级</span>
      </div>
      <div class="facilities">
        <div v-for="def in facilityList" :key="def.key" class="facility">
          <div class="facility-head">
            <span class="icon">{{ def.icon }}</span>
            <b>{{ def.name }}</b>
            <span class="muted small">Lv.{{ facilityLevel(settlement, def.key) }}</span>
          </div>
          <p class="muted small">{{ def.note }}</p>
          <button
            class="btn small"
            :disabled="!canBuild(def.key)"
            @click="build(def.key)"
          >
            {{ buildLabel(def.key) }}
          </button>
        </div>
      </div>
    </div>

    <!-- The garrison that defends the settlement. -->
    <div class="block panel">
      <div class="block-head">
        <b>🛡️ 驻守士兵</b>
        <span class="muted small">{{ mine ? '把部队留在这里守城，随时可以撤回' : '攻下城镇前先打败他们' }}</span>
      </div>
      <!-- The lord's own town: move his soldiers in and out of the garrison. -->
      <div v-if="mine && garrisonOps.length" class="garrison-ops">
        <div v-for="op in garrisonOps" :key="op.key" class="gop-row">
          <img class="unit-icon" :src="spriteUrl(unitSprite(op.type, op.tier))" :alt="op.name" />
          <span class="gop-name">{{ op.name }}</span>
          <button class="btn tiny" :disabled="op.warband <= 0" @click="station(op.type, op.tier)">➕ 驻守</button>
          <span class="gop-count">部队 {{ op.warband }} · 守军 {{ op.garrison }}</span>
          <button class="btn tiny" :disabled="op.garrison <= 0" @click="withdraw(op.type, op.tier)">➖ 撤回</button>
        </div>
      </div>
      <div v-else-if="mine && !garrisonOps.length" class="muted small">你还没有可以留在这里的部队。</div>
      <div v-else-if="garrisonRows.length" class="garrison">
        <div v-for="row in garrisonRows" :key="row.key" class="garrison-row">
          <img class="unit-icon" :src="spriteUrl(unitSprite(row.type, row.tier))" :alt="row.name" />
          <span>{{ row.name }}</span>
          <span class="muted">× {{ row.count }}</span>
        </div>
      </div>
      <div v-else class="muted small">这里没有驻军。</div>
    </div>

    <transition name="fade">
      <div v-if="toast" class="inline-toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useWorldStore } from '@/stores/world'
import {
  FACILITIES,
  INJECT_COST,
  INVEST_COST,
  INVEST_GAIN,
  buildFacility,
  dailyIncome,
  facilityCost,
  facilityLevel,
  garrisonCount,
  injectFunds,
  investDevelopment,
  levelOf,
  nextThreshold,
  ownerOf
} from '@/game/settlement'
import { unitName, unitSprite, troopKey } from '@/game/units'
import { spriteUrl } from '@/game/pixelAssets'
import { persistGame } from '@/composables/gameState'

const props = defineProps({ settlement: { type: Object, required: true } })
const player = usePlayerStore()
const world = useWorldStore()

// The engineering attribute makes every facility cheaper.
const discount = computed(() => player.skillEffects.buildDiscount)
const toast = ref('')
let timer = 0

const level = computed(() => levelOf(props.settlement))
const owner = computed(() => ownerOf(props.settlement))
const next = computed(() => nextThreshold(props.settlement))
const mine = computed(() => props.settlement.owner === 'player')
const facilityList = Object.values(FACILITIES)
const injectCost = INJECT_COST
const investCost = INVEST_COST
const investGain = INVEST_GAIN

const garrisonRows = computed(() =>
  (props.settlement.garrison || []).map((g) => ({
    key: troopKey(g.type, g.tier),
    type: g.type,
    tier: g.tier,
    name: unitName(g.type, g.tier),
    count: g.count
  }))
)

/**
 * The groups the lord may move between the warband and the garrison: every
 * group present on either side, so he can station soldiers and take them back.
 */
const garrisonOps = computed(() => {
  const warband = {}
  for (const g of player.troops) {
    if (!g.count) continue
    warband[troopKey(g.type, g.tier)] = { type: g.type, tier: g.tier, count: g.count }
  }
  const garrison = {}
  for (const g of props.settlement.garrison || []) {
    if (!g.count) continue
    garrison[troopKey(g.type, g.tier)] = { type: g.type, tier: g.tier, count: g.count }
  }
  const keys = [...new Set([...Object.keys(warband), ...Object.keys(garrison)])]
  return keys
    .map((key) => {
      const def = warband[key] || garrison[key]
      return {
        key,
        type: def.type,
        tier: def.tier,
        name: unitName(def.type, def.tier),
        warband: warband[key]?.count || 0,
        garrison: garrison[key]?.count || 0
      }
    })
    .sort((a, b) => a.key.localeCompare(b.key) || b.tier - a.tier)
})

function flash(msg) {
  toast.value = msg
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), 1800)
}

function canBuild(key) {
  const level = facilityLevel(props.settlement, key)
  if (level >= FACILITIES[key].maxLevel) return false
  return (props.settlement.funds || 0) >= facilityCost(key, level, discount.value)
}

function buildLabel(key) {
  const level = facilityLevel(props.settlement, key)
  if (level >= FACILITIES[key].maxLevel) return '已满级'
  return `建造 / 升级 · 🪙 ${facilityCost(key, level, discount.value)}`
}

function build(key) {
  const res = buildFacility(props.settlement, key, discount.value)
  if (!res.ok) {
    flash(res.reason)
    return
  }
  flash(`${FACILITIES[key].name} 升到 Lv.${res.level}`)
  persistGame()
}

function invest() {
  const res = investDevelopment(props.settlement)
  if (!res.ok) {
    flash(res.reason)
    return
  }
  flash(`发展 +${INVEST_GAIN}`)
  persistGame()
}

/** Put the lord's own gold into the town treasury. */
function inject() {
  if (!player.spendGold(injectCost)) {
    flash('金币不足')
    return
  }
  const res = injectFunds(props.settlement, injectCost)
  if (!res.ok) {
    player.addGold(injectCost)
    flash(res.reason)
    return
  }
  flash(`已注入 ${injectCost} 金币，城镇金库 +${injectCost}`)
  persistGame()
}

/** Move one soldier of the group from the warband into the town garrison. */
function station(type, tier) {
  const res = world.stationTroops(props.settlement.id, type, tier, 1)
  if (!res.ok) {
    flash(res.reason)
    return
  }
  flash(`${unitName(type, tier)} 入城驻守`)
  persistGame()
}

/** Move one soldier of the group back from the garrison into the warband. */
function withdraw(type, tier) {
  const res = world.withdrawTroops(props.settlement.id, type, tier, 1)
  if (!res.ok) {
    flash(res.reason)
    return
  }
  flash(`${unitName(type, tier)} 撤回部队`)
  persistGame()
}
</script>

<style scoped>
.panel-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.head {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 14px;
}

.head-main {
  flex: 1 1 240px;
  min-width: 0;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 15px;
}

.chip {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--ink-dim);
  background: rgba(255, 255, 255, 0.06);
}

.meters {
  flex: 1 1 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.meter-label {
  font-size: 12.5px;
  margin-bottom: 3px;
}

.bar {
  height: 9px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.4);
  overflow: hidden;
  border: 1px solid var(--line);
}

.fill {
  display: block;
  height: 100%;
}

.fill.prosperity {
  background: linear-gradient(90deg, #b98b3c, #f0d48a);
}

.fill.development {
  background: linear-gradient(90deg, #3f7f4f, #86d39a);
}

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
}

.stat {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  text-align: center;
}

.big {
  font-size: 17px;
  font-weight: 700;
  color: var(--gold);
}

.block {
  padding: 12px 14px;
  border-radius: 12px;
}

.block-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.block-body {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.facilities {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.facility {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.facility-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 18px;
}

.garrison {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.garrison-ops {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gop-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
}

.gop-name {
  flex: 1 1 auto;
  min-width: 0;
}

.gop-count {
  font-size: 12px;
  color: var(--ink-dim);
  white-space: nowrap;
}

.btn.tiny {
  padding: 5px 10px;
  font-size: 12px;
  border-radius: 8px;
  box-shadow: 0 3px 0 #6d5119, var(--shadow);
}

.btn.tiny:active {
  box-shadow: 0 1px 0 #6d5119, var(--shadow);
}

.garrison-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
}

.unit-icon {
  width: 24px;
  height: 24px;
  image-rendering: pixelated;
}

.small {
  font-size: 12px;
}

.inline-toast {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(10, 14, 10, 0.92);
  border: 1px solid var(--gold-deep);
  color: var(--gold);
  font-size: 13px;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
