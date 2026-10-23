<template>
  <div class="encounter-backdrop" role="dialog" aria-modal="true" :aria-label="`遭遇 ${faction.name}`">
    <section class="encounter-card panel">
      <!-- The enemy leader: his faction commander sprite in a portrait frame,
           so the child always knows who is talking. -->
      <header class="who">
        <div class="portrait" :style="{ '--faction': faction.color }">
          <img class="portrait-img" :src="portrait" :alt="`${faction.name}的首领`" />
          <span class="portrait-tag">敌将</span>
        </div>
        <div class="who-text">
          <div class="kicker">遭遇 · {{ faction.name }}</div>
          <div class="mood">{{ talk.mood }}</div>
          <div class="tally">
            <span>🛡️ 敌方 {{ roster.total }} 兵</span>
            <span class="dot">·</span>
            <span>👑 我方 {{ player.totalTroops }} 兵</span>
          </div>
        </div>
      </header>

      <div class="roster">
        <span v-for="g in roster.groups" :key="`${g.type}:${g.tier}`" class="troop">
          <img class="troop-sprite" :src="spriteUrl(g.sprite)" :alt="g.name" />
          <b>{{ g.name }}</b>
          <span class="troop-count">×{{ g.count }}</span>
        </span>
      </div>

      <div class="bubble">
        <p>{{ greeting }}</p>
      </div>
      <transition name="fade">
        <div v-if="reply" class="bubble reply">
          <p>{{ reply }}</p>
        </div>
      </transition>

      <div class="options">
        <button class="option fight" @click="$emit('fight')">
          <span class="option-icon">⚔️</span>
          <span class="option-text">
            <b>开战</b>
            <small>进入战场，指挥你的小队</small>
          </span>
        </button>
        <button class="option flee" @click="$emit('flee')">
          <span class="option-icon">🏃</span>
          <span class="option-text">
            <b>逃跑</b>
            <small>随机退开 3–6 格，不会损失士兵</small>
          </span>
        </button>
        <button class="option talk" @click="speak">
          <span class="option-icon">🗣️</span>
          <span class="option-text">
            <b>喊话</b>
            <small>听听对方怎么回答</small>
          </span>
        </button>
      </div>

      <p class="tip">逃跑后敌人会愣住一会儿，暂时追不上你。</p>
    </section>
  </div>
</template>

<script setup>
/**
 * The meeting dialog of the world map.
 *
 * A hostile party that reaches the lord stops the world and opens this card:
 * the enemy leader says a line, his warband is shown troop by troop, and the
 * child picks a line of his own — fight, run, or talk back. The card is a thin
 * view: the rules live in `game/encounter.js` and the world store.
 * 世界地图上的遭遇对话框：敌人拦下主角后世界暂停并弹出这张卡片——敌将先说一句，
 * 他的队伍按兵种列出，孩子再选「开战 / 逃跑 / 喊话」。卡片只负责显示，
 * 规则在 `game/encounter.js` 与世界 store 里。
 */
import { computed, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { factionOf } from '@/game/factions'
import { spriteUrl } from '@/game/pixelAssets'
import { encounterLine, enemyRoster, talkOf } from '@/game/encounter'

const props = defineProps({
  // The hostile party the lord has just met.
  party: { type: Object, required: true }
})
defineEmits(['fight', 'flee'])

const player = usePlayerStore()
// Each dialog is created fresh for one meeting, so one random seed is enough
// to keep its lines stable while it is open.
const seed = Math.floor(Math.random() * 1e9)

const faction = computed(() => factionOf(props.party.faction))
const talk = computed(() => talkOf(props.party.faction))
const greeting = computed(() => encounterLine(props.party.faction, 'greeting', seed))
const roster = computed(() => enemyRoster(props.party))
const portrait = computed(() => spriteUrl(faction.value.key))

// The 「🗣️ 喊话」 replies, one after another, so a child who keeps talking
// hears every line instead of the same one three times.
const reply = ref('')
const replyIndex = ref(0)
function speak() {
  const bank = talk.value.replies
  reply.value = bank[replyIndex.value % bank.length]
  replyIndex.value += 1
}
</script>

<style scoped>
.encounter-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: rgba(5, 8, 5, 0.62);
  backdrop-filter: blur(3px);
}

.encounter-card {
  width: min(440px, 100%);
  max-height: min(86dvh, 640px);
  overflow-y: auto;
  padding: 16px;
  animation: popIn 0.22s ease-out;
  border-color: rgba(232, 197, 106, 0.45);
}

/* ------------------------------- the leader ------------------------------- */

.who {
  display: flex;
  gap: 14px;
  align-items: center;
}

.portrait {
  position: relative;
  flex: none;
  width: 96px;
  height: 96px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  border: 2px solid var(--faction, var(--gold-deep));
  background:
    radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.14), rgba(0, 0, 0, 0.55) 72%),
    #0d110d;
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.65), 0 0 14px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

/* A soft faction-coloured glow behind the sprite, so three factions never
   look like the same card. */
.portrait::before {
  content: '';
  position: absolute;
  inset: -30% 0 auto;
  height: 80%;
  background: var(--faction, #9aa2ab);
  opacity: 0.22;
  filter: blur(12px);
}

.portrait-img {
  position: relative;
  width: 82px;
  height: 82px;
  image-rendering: pixelated;
  filter: drop-shadow(0 5px 6px rgba(0, 0, 0, 0.65));
}

.portrait-tag {
  position: absolute;
  left: 6px;
  bottom: 5px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.62);
  border: 1px solid var(--faction, var(--line));
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.who-text {
  min-width: 0;
}

.kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--gold);
}

.mood {
  margin-top: 2px;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
}

.tally {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--ink-dim);
}

.tally .dot {
  margin: 0 4px;
}

/* ------------------------------- the roster ------------------------------- */

.roster {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.troop {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  font-size: 12px;
}

.troop-sprite {
  width: 18px;
  height: 18px;
  image-rendering: pixelated;
}

.troop-count {
  color: var(--gold);
  font-weight: 700;
}

/* ------------------------------- the words -------------------------------- */

.bubble {
  position: relative;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px 12px 12px 4px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--line);
}

.bubble p {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
}

/* The leader's answer sits on the other side of the conversation. */
.bubble.reply {
  margin-left: 28px;
  border-radius: 12px 12px 4px 12px;
  border-color: rgba(214, 120, 90, 0.45);
  background: rgba(120, 50, 30, 0.26);
}

/* ------------------------------- the choices ------------------------------ */

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 9px 12px;
  text-align: left;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  transition: background 0.15s, border-color 0.15s, transform 0.08s;
}

.option:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--gold-deep);
}

.option:active {
  transform: translateY(1px);
}

/* The two decisions that matter get a colour of their own. */
.option.fight {
  background: linear-gradient(180deg, rgba(214, 120, 90, 0.32), rgba(120, 45, 30, 0.34));
  border-color: rgba(216, 120, 95, 0.7);
}

.option.flee {
  background: linear-gradient(180deg, rgba(90, 150, 210, 0.24), rgba(35, 65, 95, 0.3));
  border-color: rgba(120, 190, 255, 0.45);
}

.option.fight:hover {
  background: linear-gradient(180deg, rgba(230, 135, 100, 0.42), rgba(140, 55, 35, 0.42));
}

.option.flee:hover {
  background: linear-gradient(180deg, rgba(110, 175, 235, 0.34), rgba(45, 80, 115, 0.38));
}

.option-icon {
  flex: none;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  font-size: 18px;
}

.option-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.option-text b {
  font-size: 15px;
}

.option-text small {
  color: var(--ink-dim);
  font-size: 11.5px;
  line-height: 1.35;
}

.tip {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink-dim);
  text-align: center;
}

@media (max-width: 560px) {
  .encounter-backdrop {
    padding: 10px;
    align-items: end;
  }

  .encounter-card {
    width: 100%;
    padding: 14px;
    max-height: 88dvh;
  }

  .portrait {
    width: 82px;
    height: 82px;
    border-radius: 14px;
  }

  .portrait-img {
    width: 68px;
    height: 68px;
  }

  .mood {
    font-size: 18px;
  }
}
</style>
