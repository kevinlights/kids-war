<template>
  <div class="panel-wrap">
    <p class="lead muted">
      {{ settlement.kind === 'town' ? '城镇兵营随机提供长枪兵 / 弓箭手 / 骑兵，从初级到精英都有，价格更贵。' : '村庄只能招募朴实的民兵，价格便宜，可在升级页变成正式兵种。' }}
    </p>

    <div class="supply-bar">
      <div class="chip">👥 队伍 {{ player.totalTroops }} / {{ player.partyCap }}</div>
      <div v-if="player.supplies.order > 0" class="chip order">📜 征兵令 {{ player.supplies.order }}</div>
    </div>

    <button
      v-if="player.supplies.order > 0"
      class="btn order-btn"
      @click="useOrder"
    >
      📜 用征兵令免费招募 2 名民兵
    </button>

    <div class="list">
      <div v-for="row in rows" :key="row.key" class="unit-row">
        <img class="unit-icon" :src="spriteUrl(unitSprite(row.type, row.tier))" :alt="row.def.name" />
        <div class="unit-info">
          <div class="unit-name">
            {{ row.def.name }}
            <span class="tier" :class="'t' + row.tier">{{ row.def.rank || '基础' }}</span>
          </div>
          <div class="unit-stats muted">
            攻 {{ row.def.atk }} · 防 {{ row.def.def }} · 血 {{ row.def.hp }}
            <template v-if="row.def.ranged"> · 射程 {{ row.def.range }}</template>
            · 克制 {{ counterName(row.type) }}
          </div>
        </div>
        <div class="unit-buy">
          <div class="cost">🪙 {{ row.cost }}</div>
          <div class="stepper">
            <button class="step" @click="qty[row.key] = Math.max(1, (qty[row.key] || 1) - 1)">−</button>
            <span class="qty">{{ qty[row.key] || 1 }}</span>
            <button class="step" @click="qty[row.key] = (qty[row.key] || 1) + 1">＋</button>
          </div>
          <button
            class="btn small"
            :disabled="player.gold < row.cost * (qty[row.key] || 1)"
            @click="hire(row, qty[row.key] || 1)"
          >
            招募
          </button>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="toast" class="inline-toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { recruitList } from '@/game/recruit'
import { recruitMulOf } from '@/game/difficulty'
import { troopKey, unitDef, unitOf, unitSprite } from '@/game/units'
import { spriteUrl } from '@/game/pixelAssets'
import { persistGame } from '@/composables/gameState'

const props = defineProps({ settlement: { type: Object, required: true } })
const player = usePlayerStore()
const qty = reactive({})
const toast = ref('')
let timer = 0

// Stock rows with their rank-scaled stats resolved once for the template.
const rows = computed(() =>
  recruitList(props.settlement, { recruitMul: recruitMulOf(player.difficulty) }).map((item) => ({
    ...item,
    key: troopKey(item.type, item.tier),
    def: unitDef(item.type, item.tier)
  }))
)

/** Family a soldier is strong against, for the trait line. */
function counterName(type) {
  const counter = unitOf(type).counter
  return counter ? unitOf(counter).name : '无'
}

function hire(row, n) {
  // The warband has a ceiling: the leadership attribute buys more room.
  if (player.totalTroops + n > player.partyCap) {
    toast.value = `队伍已达上限（${player.partyCap} 名），升级「统御」可以带更多人`
    clearTimeout(timer)
    timer = setTimeout(() => (toast.value = ''), 2000)
    return
  }
  const cost = row.cost * n
  if (!player.spendGold(cost)) return
  player.addTroops(row.type, row.tier, n)
  // Hiring counts towards the quests that ask for soldiers.
  player.countRecruits(n)
  persistGame()
  toast.value = `招募了 ${n} 名${row.def.name}`
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), 1600)
}

/**
 * A recruit order is the gift of a subject that was answered without a single
 * mistake: it pays for two militia, free of charge.
 */
function useOrder() {
  const room = Math.max(0, player.partyCap - player.totalTroops)
  if (room <= 0) {
    toast.value = '队伍已经满了，征兵令派不上用场'
    clearTimeout(timer)
    timer = setTimeout(() => (toast.value = ''), 2000)
    return
  }
  if (!player.useSupply('order', 1)) return
  const count = Math.min(2, room)
  player.addTroops('militia', 1, count)
  player.countRecruits(count)
  persistGame()
  toast.value = `征兵令招来了 ${count} 名民兵`
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), 2000)
}
</script>

<style scoped>
.panel-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.lead {
  margin: 0;
  font-size: 13.5px;
}

.supply-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip.order {
  border-color: var(--gold-deep);
  color: var(--gold);
}

.order-btn {
  border-color: var(--gold-deep);
  color: var(--gold);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.unit-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
}

/* Unit art is a square 32x32 sprite shown at its native size, so the art is
   never resampled. */
.unit-icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  flex-shrink: 0;
}

.unit-info {
  flex: 1;
  min-width: 0;
}

.unit-name {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Rank badge: bronze for 初级 up to gold for 精英. */
.tier {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: #f2e7c9;
  background: rgba(255, 255, 255, 0.1);
}

.tier.t1 {
  color: #f0d9b5;
  background: rgba(176, 141, 87, 0.35);
}

.tier.t2 {
  color: #e9f0f7;
  background: rgba(143, 162, 179, 0.35);
}

.tier.t3 {
  color: #dfe7ff;
  background: rgba(111, 136, 192, 0.4);
}

.tier.t4 {
  color: #ffefbd;
  background: rgba(232, 197, 106, 0.35);
  border-color: var(--gold-deep);
}

.unit-stats {
  font-size: 12.5px;
  margin-top: 2px;
}

.unit-buy {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.cost {
  color: var(--gold);
  font-weight: 700;
  font-size: 14px;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px 6px;
}

.step {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  font-weight: 800;
  line-height: 1;
}

.qty {
  min-width: 24px;
  text-align: center;
  font-weight: 700;
}

.btn.small {
  padding: 8px 14px;
  font-size: 13.5px;
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

/* Phones: put the unit details on one row and the purchase controls on the
   next so nothing gets squeezed off screen. */
@media (max-width: 560px) {
  .unit-row {
    flex-wrap: wrap;
    gap: 8px;
  }

  .unit-info {
    flex: 1 1 55%;
  }

  .unit-buy {
    width: 100%;
    justify-content: space-between;
  }

  .step {
    width: 34px;
    height: 34px;
    font-size: 17px;
  }

  .qty {
    min-width: 30px;
    font-size: 15px;
  }
}
</style>
