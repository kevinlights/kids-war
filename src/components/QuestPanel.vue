<template>
  <div class="quest-overlay" @click.self="emit('close')">
    <div class="quest-card panel">
      <header class="head">
        <h2>📜 委托</h2>
        <span class="chip">进行中 {{ player.openQuests.length }}</span>
        <span class="chip done-chip">已完成 {{ doneCount }}</span>
        <button class="btn ghost" @click="emit('close')">✕</button>
      </header>

      <p class="lead muted">
        镇上的人托付你的事都在这里。接下委托之后，你为他做的事才算数；做完了回去找他，就能花金币请他上路。
      </p>

      <div v-if="!player.allQuests.length" class="empty muted">
        还没有接下的委托。走进任何一座城镇，找到头上有「!」的人，和他说说话。
      </div>

      <div class="list">
        <div v-for="q in player.allQuests" :key="q.npcId" class="row" :class="{ done: q.done }">
          <div class="row-head">
            <span class="who">{{ q.name }}</span>
            <span class="role muted">{{ q.title }}</span>
            <span v-if="q.townName" class="chip town">{{ q.townName }}</span>
            <span class="chip" :class="q.done ? 'done-chip' : ''">{{ progressOf(q) }} / {{ q.target }}</span>
          </div>
          <div class="bar"><i :style="{ width: `${percentOf(q)}%` }"></i></div>
          <div class="row-foot">
            <span class="label">{{ q.label }}</span>
            <span v-if="q.done" class="ready">✅ 已完成 —— 回去找他就能招募</span>
            <span v-else class="muted small">{{ hintOf(q) }}</span>
            <span class="spacer"></span>
            <button v-if="!q.done" class="btn tiny" @click="abandon(q)">放弃</button>
            <button v-else-if="q.townId" class="btn tiny go" @click="goTown(q)">去找 {{ q.name }}</button>
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
 * The quest log.
 *
 * One place lists every job the lord has taken: who asked, in which town, what
 * is left to do and whether it is finished. It is opened from the world map and
 * from any town, so a child never has to remember which street the job came
 * from.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { QUEST_KINDS } from '@/game/npc'
import { persistGame } from '@/composables/gameState'

const emit = defineEmits(['close'])
const router = useRouter()
const player = usePlayerStore()
const toast = ref('')
let timer = 0

const doneCount = computed(() => player.allQuests.filter((q) => q.done).length)

/**
 * The live progress of a stored quest.
 *
 * The record keeps the counter value of the day it was accepted, so the current
 * number is today's counter minus that base. `done` is written back the moment
 * the target is reached, which is what makes a finished job stay finished.
 */
function progressOf(quest) {
  const def = QUEST_KINDS[quest.kind] || QUEST_KINDS.exam
  const current = Math.max(0, def.counter(player) - quest.base)
  if (current >= quest.target && !quest.done) quest.done = true
  return Math.min(current, quest.target)
}

function percentOf(quest) {
  return Math.round((progressOf(quest) / Math.max(1, quest.target)) * 100)
}

/** What is left to do, in the words of the counter the quest is measured on. */
function hintOf(quest) {
  const def = QUEST_KINDS[quest.kind]
  if (!def) return ''
  return `还差 ${Math.max(0, quest.target - progressOf(quest))} ${def.unit}`
}

function flash(msg) {
  toast.value = msg
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), 1800)
}

function abandon(quest) {
  player.abandonQuest(quest.npcId)
  persistGame()
  flash(`🗑 已放弃 ${quest.name} 的委托`)
}

/** Walk straight back to the town the job came from. */
function goTown(quest) {
  if (!quest.townId) return
  persistGame()
  emit('close')
  router.push({ name: 'town', query: { id: quest.townId } })
}
</script>

<style scoped>
.quest-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 9, 6, 0.62);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  z-index: 34;
}

.quest-card {
  width: min(680px, 100%);
  max-height: min(86vh, 700px);
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.done-chip {
  color: #bfe8c0;
  border-color: rgba(111, 191, 115, 0.6);
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
  line-height: 1.6;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row.done {
  border-color: rgba(111, 191, 115, 0.45);
  background: rgba(111, 191, 115, 0.07);
}

.row-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.who {
  font-weight: 700;
  font-size: 15px;
  color: #ffe9a8;
}

.role {
  font-size: 12px;
}

.chip.town {
  font-size: 11.5px;
  color: var(--ink-dim);
}

.bar {
  height: 7px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.42);
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--gold-deep), var(--gold));
  transition: width 0.3s;
}

.row-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.label {
  font-size: 12.5px;
  color: var(--ink);
}

.ready {
  font-size: 12px;
  color: #bfe8c0;
}

.small {
  font-size: 12px;
}

.spacer {
  flex: 1;
}

.btn.tiny {
  padding: 5px 10px;
  font-size: 11.5px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.06);
  color: var(--ink);
}

.btn.tiny.go {
  border-color: var(--gold-deep);
  color: var(--gold);
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
