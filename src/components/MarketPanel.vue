<template>
  <div class="panel-wrap">
    <p class="lead muted">物资会随军出征：每场战斗消耗 3 份军粮，粮草不足时部队战斗力下降；战马越多，全军攻击略有提升。</p>

    <div class="supply-bar">
      <div class="chip">🌾 军粮 {{ player.supplies.food }}</div>
      <div class="chip">🐎 战马 {{ player.supplies.horse }}</div>
      <div class="chip">🎟️ 集市券 {{ player.supplies.ticket }}</div>
      <div class="chip">📜 征兵令 {{ player.supplies.order }}</div>
    </div>

    <div class="list">
      <div v-for="g in goods" :key="g.key" class="good-row">
        <div class="good-icon">{{ g.icon }}</div>
        <div class="good-info">
          <div class="good-name">{{ g.name }}</div>
          <div class="muted small">{{ g.desc }}</div>
        </div>
        <div class="good-buy">
          <span class="cost">🪙 {{ g.price }}</span>
          <button class="btn small" :disabled="player.gold < g.price" @click="buy(g)">购买</button>
          <button
            v-if="player.supplies.ticket > 0"
            class="btn small ticket"
            @click="buyWithTicket(g)"
          >
            🎟️ 用券
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
import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { persistGame } from '@/composables/gameState'

const player = usePlayerStore()
const toast = ref('')
let timer = 0

const goods = [
  { key: 'food', name: '军粮 ×5', icon: '🌾', desc: '每场战斗消耗 3 份，缺粮会削弱攻击', price: 25, apply: () => (player.supplies.food += 5) },
  { key: 'horse', name: '战马 ×1', icon: '🐎', desc: '每匹战马为全军增加 1% 攻击（最多 10%）', price: 40, apply: () => (player.supplies.horse += 1) }
]

function buy(g) {
  if (!player.spendGold(g.price)) return
  g.apply()
  persistGame()
  toast.value = `购买了${g.name}`
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), 1600)
}

/**
 * Buy without gold: a market voucher is a gift for a paper that was answered
 * without a single mistake, and it pays for one purchase.
 */
function buyWithTicket(g) {
  if (!player.useSupply('ticket', 1)) return
  g.apply()
  persistGame()
  toast.value = `用集市券换到了${g.name}`
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), 1600)
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
  line-height: 1.6;
}

.supply-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.good-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
}

.good-icon {
  font-size: 26px;
  width: 44px;
  text-align: center;
}

.good-info {
  flex: 1;
}

.good-name {
  font-weight: 700;
}

.small {
  font-size: 12px;
}

.good-buy {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cost {
  color: var(--gold);
  font-weight: 700;
}

.btn.small {
  padding: 8px 14px;
  font-size: 13.5px;
}

.btn.ticket {
  border-color: var(--gold-deep);
  color: var(--gold);
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

/* Phones: stack the item details above its purchase row. */
@media (max-width: 560px) {
  .good-row {
    flex-wrap: wrap;
    gap: 8px;
  }

  .good-info {
    flex: 1 1 55%;
  }

  .good-buy {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
