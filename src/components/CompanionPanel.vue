<template>
  <div class="comp-overlay" @click.self="emit('close')">
    <div class="comp-card panel">
      <header class="head">
        <h2>👥 随从</h2>
        <span class="chip">🛡️ 你的部队 {{ player.totalTroops }}</span>
        <span class="chip">🏳 随从旗下 {{ player.companionTroops }}</span>
        <button class="btn ghost" @click="emit('close')">✕</button>
      </header>

      <p class="lead muted">
        把士兵交给随从，他就会带着这面旗子跟你上战场：他自己的人和你的部队分开排队，各自的伤亡也分开结算。
        没有士兵的随从留在镇上等你，不会白白跟去送命。
      </p>

      <div v-if="!player.companions.length" class="empty muted">
        还没有随从。去城镇里和居民聊聊 —— 完成他们的委托，再花些金币就能请他们上路。
      </div>

      <div v-for="c in player.companions" :key="c.id" class="comp">
        <div class="comp-head">
          <div class="portrait-wrap">
            <img class="portrait" :src="spriteUrl(c.sprite)" :alt="c.name" />
            <!-- How many soldiers he leads, in the corner of his portrait. -->
            <span class="portrait-badge" :class="{ empty: strength(c) === 0 }">{{ strength(c) }}</span>
          </div>
          <div class="who">
            <div class="name">{{ c.name }} <span class="role">{{ roleName(c.role) }}</span></div>
            <div class="muted small">
              旗子下 {{ strength(c) }} / {{ capOf(c) }} 名士兵 · {{ buffText(c.role) }}
            </div>
          </div>
          <button class="btn small danger" @click="dismiss(c)">解散</button>
        </div>

        <div class="columns">
          <div class="col">
            <div class="col-title">你的部队</div>
            <div v-if="!player.roster.length" class="muted small">队伍里没有士兵</div>
            <div v-for="row in player.roster" :key="row.key" class="row">
              <img class="mini" :src="spriteUrl(unitSprite(row.type, row.tier))" :alt="row.name" />
              <span class="row-name">{{ row.name }} ×{{ row.count }}</span>
              <button
                class="btn tiny"
                :disabled="roomOf(c) <= 0"
                @click="give(c, row)"
              >
                给他
              </button>
            </div>
          </div>

          <div class="col">
            <div class="col-title">他的旗子</div>
            <div v-if="!c.soldiers.length" class="muted small">还没有士兵，战场上不会出现</div>
            <div v-for="g in c.soldiers" :key="`${g.type}-${g.tier}`" class="row">
              <img class="mini" :src="spriteUrl(unitSprite(g.type, g.tier))" :alt="g.type" />
              <span class="row-name">{{ unitName(g.type, g.tier) }} ×{{ g.count }}</span>
              <button class="btn tiny" @click="take(c, g)">收回</button>
            </div>
          </div>
        </div>
      </div>

      <transition name="fade">
        <div v-if="toast" class="inline-toast">{{ toast }}</div>
      </transition>
    </div>
  </div>
</template>

<script setup>
/**
 * The companion panel: who rides with the lord and what each of them leads.
 *
 * A companion fights with soldiers the lord hands over, never with soldiers of
 * his own, so this screen is a transfer table between the warband and a banner.
 * Every transfer moves real soldiers with their real wounds.
 */
import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { ROLES, companionCap, companionStrength } from '@/game/npc'
import { unitName, unitSprite } from '@/game/units'
import { spriteUrl } from '@/game/pixelAssets'
import { persistGame } from '@/composables/gameState'

const emit = defineEmits(['close'])
const player = usePlayerStore()
const toast = ref('')
let timer = 0

const capOf = (c) => companionCap({ role: c.role })
const strength = (c) => companionStrength(c)
const roomOf = (c) => Math.max(0, capOf(c) - strength(c))
const roleName = (role) => ROLES[role]?.name || role

/** What the trade brings to the army, in words a child can read. */
function buffText(role) {
  const buff = ROLES[role]?.buff || {}
  const parts = []
  if (buff.atk) parts.push(`全军攻击 +${Math.round(buff.atk * 100)}%`)
  if (buff.def) parts.push(`全军防御 +${Math.round(buff.def * 100)}%`)
  if (buff.heal) parts.push(`伤兵恢复 +${Math.round(buff.heal * 100)}%`)
  return parts.length ? parts.join(' · ') : '没有额外加成'
}

function flash(msg) {
  toast.value = msg
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), 1800)
}

function give(companion, row) {
  const res = player.assignCompanionSoldiers(companion.id, row.type, row.tier, 1)
  if (!res.ok) {
    flash(`🚫 ${res.reason}`)
    return
  }
  persistGame()
  flash(`🤝 1 名${row.name}走到了 ${companion.name} 的旗下`)
}

function take(companion, group) {
  const res = player.recallCompanionSoldiers(companion.id, group.type, group.tier, 1)
  if (!res.ok) {
    flash(`🚫 ${res.reason}`)
    return
  }
  persistGame()
  flash(`↩ 1 名${unitName(group.type, group.tier)}回到你的部队`)
}

function dismiss(companion) {
  player.dismissCompanion(companion.id)
  persistGame()
  flash(`👋 ${companion.name}带着他的士兵回到了自己的城镇`)
}
</script>

<style scoped>
.comp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 9, 6, 0.62);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  z-index: 32;
}

.comp-card {
  width: min(760px, 100%);
  max-height: min(88vh, 720px);
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.head h2 {
  margin: 0;
  font-size: 19px;
  color: var(--gold);
  letter-spacing: 1px;
  flex: 1;
}

.lead {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
}

.empty {
  padding: 18px 12px;
  text-align: center;
  border: 1px dashed var(--line);
  border-radius: 12px;
  font-size: 13px;
}

.comp {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comp-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.portrait-wrap {
  position: relative;
  flex: none;
}

.portrait {
  display: block;
  width: 44px;
  height: 44px;
  image-rendering: pixelated;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
}

/* The troop badge: a dark disc in the portrait's corner, the same signal the
   map and the battle HUD use. */
.portrait-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.45);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.portrait-badge.empty {
  color: var(--ink-dim);
  border-color: var(--line);
}

.who {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 700;
  font-size: 15px;
  color: #ffe9a8;
}

.role {
  font-size: 12px;
  color: var(--ink-dim);
  font-weight: 400;
  margin-left: 6px;
}

.small {
  font-size: 12px;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.24);
}

.col-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--gold);
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
  flex: none;
}

.row-name {
  flex: 1;
  font-size: 12.5px;
}

.btn.tiny {
  padding: 4px 8px;
  font-size: 11.5px;
  border-radius: 8px;
  border: 1px solid var(--line);
  color: var(--ink);
  background: rgba(255, 255, 255, 0.06);
}

.btn.tiny:disabled {
  opacity: 0.4;
}

.btn.small.danger {
  border-color: rgba(214, 120, 90, 0.6);
  color: #ffd9d0;
}

.inline-toast {
  align-self: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(10, 14, 10, 0.94);
  border: 1px solid var(--gold-deep);
  color: var(--gold);
  font-size: 12.5px;
  font-weight: 700;
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

@media (max-width: 560px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
</style>
