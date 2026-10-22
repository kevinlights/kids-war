<template>
  <div class="day-clock" :class="{ live }">
    <div class="dc-top">
      <span class="dc-day">📅 第 {{ clock.day }} 天</span>
      <span class="dc-time">{{ clock.text }}</span>
      <span class="dc-phase" :title="phase.label">{{ phase.icon }}</span>
      <span v-if="note" class="dc-note">{{ note }}</span>
    </div>
    <div class="dc-bar" :title="`今天已过 ${Math.round(clock.progress * 100)}%`">
      <i :style="{ width: pct }"></i>
      <!-- The last fifth of the bar is the night. -->
      <span class="dc-night"></span>
    </div>
  </div>
</template>

<script setup>
/**
 * The campaign clock: the day counter, the hour inside that day and a bar
 * showing how much of the day is gone.
 *
 * On the world map a day lasts 24 game seconds and one game second is one
 * in-game hour. Inside a settlement the clock is deliberately slower: one real
 * second is one in-game minute, so a day of town business takes 24 real
 * minutes. Either way the hour of the day is the accumulator of the world
 * store, and the clock only moves while time flows.
 */
import { computed } from 'vue'
import { useWorldStore } from '@/stores/world'

const props = defineProps({
  // A short note under the day, such as the clock state of the world.
  note: { type: String, default: '' },
  // True while the clock is actually running.
  live: { type: Boolean, default: false }
})

const world = useWorldStore()
const clock = computed(() => world.clock)
const phase = computed(() => world.dayPhase)
const pct = computed(() => `${(clock.value.progress * 100).toFixed(1)}%`)
</script>

<style scoped>
.day-clock {
  display: inline-flex;
  flex-direction: column;
  gap: 3px;
  min-width: 124px;
  padding: 5px 11px 6px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--line);
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(6px);
}

.dc-top {
  display: flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}

.dc-time {
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

.dc-phase {
  font-size: 13px;
  line-height: 1;
}

.dc-note {
  font-size: 11px;
  font-weight: 400;
  color: var(--ink-dim);
}

/* The bar is the day's progress: it fills up and empties with every day. */
.dc-bar {
  position: relative;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  overflow: hidden;
}

/* The last fifth of the bar is the night. */
.dc-night {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 80%;
  right: 0;
  background: rgba(96, 130, 210, 0.5);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.dc-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--gold);
  transition: width 0.25s linear;
}

.day-clock.live .dc-bar i {
  background: #9ce08a;
}

.day-clock.live .dc-time {
  color: #b8e6a4;
}

/* Phones: the clock keeps its own row so nothing is squeezed. */
@media (max-width: 560px) {
  .day-clock {
    min-width: 108px;
    padding: 4px 9px 5px;
    font-size: 12px;
  }

  .dc-note {
    font-size: 10.5px;
  }
}
</style>
