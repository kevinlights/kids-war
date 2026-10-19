<template>
  <div class="panel-wrap">
    <p class="lead muted">
      民兵可以升级成长枪兵、弓箭手或骑兵；每个兵种都能一路升到
      初级 → 中级 → 高级 → 精英，逐级升级比直接招募精英便宜。
    </p>

    <div v-if="!player.troops.length" class="empty">你的队伍里还没有士兵，先去招募吧。</div>

    <div v-for="t in player.troops" :key="troopKey(t.type, t.tier)" class="troop-block">
      <div class="troop-head">
        <img class="badge" :src="spriteUrl(unitSprite(t.type, t.tier))" :alt="defOf(t).name" />
        <b>{{ defOf(t).name }}</b>
        <span class="tier" :class="'t' + t.tier">{{ defOf(t).rank || '基础' }}</span>
        <span class="muted">× {{ t.count }}</span>
      </div>

      <div v-if="upgradesFor(t.type, t.tier).length" class="upgrades">
        <div v-for="u in upgradesFor(t.type, t.tier)" :key="u.type + ':' + u.tier" class="up-row">
          <div class="up-info">
            → <b>{{ u.name }}</b>
            <span class="muted small">攻 {{ u.atk }} · 防 {{ u.def }} · 血 {{ u.hp }}</span>
          </div>
          <div class="up-action">
            <span class="cost">🪙 {{ u.cost }}<span class="muted"> / 名</span></span>
            <div class="stepper">
              <button class="step" @click="dec(t, u)">−</button>
              <span class="qty">{{ qtyOf(t, u) }}</span>
              <button class="step" @click="inc(t, u)">＋</button>
            </div>
            <button
              class="btn small"
              :disabled="player.gold < u.cost * qtyOf(t, u)"
              @click="doUpgrade(t, u)"
            >
              升级
            </button>
          </div>
        </div>
      </div>
      <div v-else class="muted small">已是精英等级，无法再升级。</div>
    </div>

    <transition name="fade">
      <div v-if="toast" class="inline-toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { troopKey, unitDef, unitSprite, upgradesFor } from '@/game/units'
import { spriteUrl } from '@/game/pixelAssets'
import { persistGame } from '@/composables/gameState'

const player = usePlayerStore()
const qty = reactive({})
const toast = ref('')
let timer = 0

const defOf = (t) => unitDef(t.type, t.tier)
const keyOf = (t, u) => `${troopKey(t.type, t.tier)}>${u.type}:${u.tier}`
const qtyOf = (t, u) => Math.max(1, qty[keyOf(t, u)] || 1)

function inc(t, u) {
  const k = keyOf(t, u)
  qty[k] = Math.min(t.count, qtyOf(t, u) + 1)
}

function dec(t, u) {
  const k = keyOf(t, u)
  qty[k] = Math.max(1, qtyOf(t, u) - 1)
}

function doUpgrade(t, u) {
  const n = qtyOf(t, u)
  const res = player.upgradeTroops(t.type, t.tier, u.type, u.tier, n)
  if (!res.ok) {
    toast.value = res.reason
  } else {
    toast.value = `升级了 ${n} 名${u.name}`
    persistGame()
  }
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
}

.empty {
  padding: 20px;
  text-align: center;
  color: var(--ink-dim);
}

.troop-block {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.troop-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15.5px;
  flex-wrap: wrap;
}

/* Native-size sprite, so the art is never resampled by the browser. */
.badge {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  flex: none;
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

.upgrades {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.up-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  flex-wrap: wrap;
}

.up-info {
  font-size: 14px;
}

.small {
  font-size: 12px;
}

.up-action {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cost {
  color: var(--gold);
  font-weight: 700;
  font-size: 13.5px;
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

/* Phones: keep the upgrade row readable by stacking the controls. */
@media (max-width: 560px) {
  .up-row {
    align-items: flex-start;
  }

  .up-info {
    width: 100%;
  }

  .up-action {
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
