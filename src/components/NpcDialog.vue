<template>
  <div class="npc-overlay" @click.self="emit('close')">
    <div class="npc-card panel">
      <header class="head">
        <img class="portrait" :src="spriteUrl(npc.sprite)" :alt="npc.name" />
        <div class="who">
          <div class="name-row">
            <h2>{{ npc.name }}</h2>
            <span class="chip role">{{ npc.title }}</span>
            <span v-if="npc.follower" class="chip follow">可以招为随从</span>
            <span v-else class="chip plain">镇上的居民</span>
          </div>
          <p class="intro muted">{{ role.intro }}</p>
        </div>
        <button class="btn ghost close" @click="emit('close')">✕</button>
      </header>

      <!-- What he says right now. Talking again draws another line from his own
           pool, so a townsperson does not repeat one sentence forever. -->
      <div class="speech">
        <span class="quote">「{{ line }}」</span>
        <button class="btn small" @click="talk(false)">🗣 再说几句</button>
      </div>

      <section class="quest" :class="{ unaccepted: !quest.accepted }">
        <div class="quest-head">
          <span class="q-title">委托 · {{ questLabel }}</span>
          <span class="chip" :class="{ done: quest.done }">{{ quest.current }} / {{ quest.target }}</span>
        </div>
        <p class="offer muted">{{ npc.quest.offer }}</p>
        <div class="bar">
          <i :style="{ width: `${Math.round((quest.current / Math.max(1, quest.target)) * 100)}%` }"></i>
        </div>
        <p v-if="quest.done" class="hint done-hint">{{ doneLine }}</p>
        <p v-else-if="!quest.accepted" class="hint muted">
          接下委托之后，你为他做的事才会算进这份委托里。
        </p>
        <p v-else class="hint muted">{{ progressHint }}</p>

        <!-- The two buttons of the quest itself: take it, or give it back. -->
        <div class="quest-actions">
          <button v-if="!quest.accepted" class="btn accept" @click="accept">📜 接受委托</button>
          <template v-else>
            <span class="chip accepted">✅ 已接下</span>
            <button class="btn tiny ghost" @click="abandon">放弃委托</button>
          </template>
        </div>
      </section>

      <footer class="actions">
        <template v-if="npc.follower">
          <button
            v-if="!isCompanion"
            class="btn hire"
            :disabled="!quest.done || player.gold < npc.cost"
            @click="hire"
          >
            🤝 招募为随从 · 🪙 {{ npc.cost }}
          </button>
          <span v-else class="chip in-party">✅ 已在你的队伍里</span>
          <span v-if="!quest.done" class="muted small">完成委托后才能招募</span>
          <span v-else-if="player.gold < npc.cost" class="muted small">
            还差 {{ npc.cost - player.gold }} 金币
          </span>
        </template>
        <span v-else class="muted small">{{ npc.name }}只想守着自家门口，不会跟着走。</span>
        <button class="btn ghost" @click="emit('close')">离开</button>
      </footer>

      <transition name="fade">
        <div v-if="toast" class="inline-toast">{{ toast }}</div>
      </transition>
    </div>
  </div>
</template>

<script setup>
/**
 * The conversation with one townsperson.
 *
 * It holds the three things a NPC is for: the small talk, the quest, and the
 * hiring. Nothing here talks to the world directly — the player store owns the
 * quest record and the companions, and the screen only reports what happened.
 */
import { computed, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { ROLES, QUEST_DONE_LINES, companionCap } from '@/game/npc'
import { spriteUrl } from '@/game/pixelAssets'
import { persistGame } from '@/composables/gameState'

const props = defineProps({
  npc: { type: Object, required: true },
  townId: { type: String, default: '' },
  townName: { type: String, default: '' }
})
const emit = defineEmits(['close', 'hired'])

const player = usePlayerStore()
const role = computed(() => ROLES[props.npc.role] || ROLES.farmer)
const toast = ref('')
let toastTimer = 0

// The line he says: the intro once, then a rotating line of his own pool every
// time the lord asks for more.
const lineIndex = ref(0)
const line = computed(() => {
  const pool = role.value.lines || []
  if (!pool.length) return role.value.intro
  return pool[lineIndex.value % pool.length]
})

// The dialog tells the store which town the NPC belongs to, so the quest log can
// say where the job was taken.
const questNpc = computed(() => ({ ...props.npc, townId: props.townId, townName: props.townName }))
const quest = computed(() => player.questProgress(props.npc))
const isCompanion = computed(() => player.companions.some((c) => c.id === props.npc.id))
const doneLine = computed(() => QUEST_DONE_LINES[props.npc.name.length % QUEST_DONE_LINES.length])
const questLabel = computed(() => props.npc.quest?.label || '帮他做点事')
const progressHint = computed(() => {
  if (quest.value.done) return ''
  return `接下委托之后你为他做的事才算 —— 现在完成 ${quest.value.current} / ${quest.value.target}。`
})

/** 「📜 接受委托」: the job starts from today's counters. */
function accept() {
  const res = player.acceptQuest(questNpc.value)
  if (!res.ok) {
    flash(`🚫 ${res.reason}`)
    return
  }
  persistGame()
  flash('📜 委托已接下，去完成它吧')
}

/** 「放弃委托」: the job goes back to the NPC. */
function abandon() {
  player.abandonQuest(props.npc.id)
  persistGame()
  flash('🗑 已放弃这份委托')
}

function flash(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2000)
}

function talk() {
  lineIndex.value += 1
}

function hire() {
  const res = player.hireCompanion(props.npc, props.townId)
  if (!res.ok) {
    flash(`🚫 ${res.reason}`)
    return
  }
  persistGame()
  flash(`🤝 ${props.npc.name}加入了你的队伍，可以带 ${companionCap(props.npc)} 名士兵`)
  emit('hired', props.npc)
}
</script>

<style scoped>
.npc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 9, 6, 0.62);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  z-index: 30;
}

.npc-card {
  width: min(520px, 100%);
  max-height: min(86vh, 640px);
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.portrait {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  flex: none;
}

.who {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.name-row h2 {
  margin: 0;
  font-size: 20px;
  color: var(--gold);
  letter-spacing: 1px;
}

.chip.role {
  background: rgba(232, 197, 106, 0.16);
  border-color: var(--gold-deep);
  color: #ffefbd;
}

.chip.follow {
  color: #bfe8c0;
  border-color: rgba(111, 191, 115, 0.6);
}

.chip.plain {
  color: var(--ink-dim);
}

.chip.done {
  color: #bfe8c0;
  border-color: rgba(111, 191, 115, 0.6);
}

.chip.in-party {
  color: #bfe8c0;
  border-color: rgba(111, 191, 115, 0.6);
  font-weight: 700;
}

.close {
  flex: none;
}

.intro {
  margin: 6px 0 0;
  font-size: 12.5px;
  line-height: 1.5;
}

.speech {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--line);
}

.quote {
  flex: 1;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--ink);
}

.quest {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(232, 197, 106, 0.08);
  border: 1px solid var(--line);
}

.quest-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.q-title {
  font-weight: 700;
  color: var(--gold);
  font-size: 14px;
}

.offer {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
}

.bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--gold-deep), var(--gold));
  transition: width 0.3s;
}

.hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.quest.unaccepted .bar i {
  background: rgba(255, 255, 255, 0.28);
}

.quest-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.btn.accept {
  border-color: var(--gold);
  color: #2b1e05;
  background: linear-gradient(180deg, var(--gold), var(--gold-deep));
  font-weight: 700;
  padding: 8px 16px;
}

.chip.accepted {
  color: #bfe8c0;
  border-color: rgba(111, 191, 115, 0.6);
}

.btn.tiny.ghost {
  padding: 5px 10px;
  font-size: 11.5px;
  border-radius: 8px;
  border: 1px solid var(--line);
  color: var(--ink-dim);
  background: rgba(255, 255, 255, 0.05);
}

.done-hint {
  color: #bfe8c0;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  border-top: 1px dashed var(--line);
  padding-top: 10px;
}

.btn.hire {
  border-color: var(--gold);
  color: #2b1e05;
  background: linear-gradient(180deg, var(--gold), var(--gold-deep));
  font-weight: 700;
}

.btn.hire:disabled {
  opacity: 0.45;
  background: rgba(255, 255, 255, 0.1);
  color: var(--ink-dim);
  border-color: var(--line);
}

.small {
  font-size: 12px;
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
  .npc-card {
    padding: 12px;
  }

  .portrait {
    width: 52px;
    height: 52px;
  }

  .name-row h2 {
    font-size: 18px;
  }
}
</style>
