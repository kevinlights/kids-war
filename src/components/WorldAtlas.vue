<script setup>
/**
 * Detailed world atlas: the whole world at a zoom larger than a phone screen,
 * opened by tapping the minimap. Drag anywhere on the map to look at a
 * different region; the button recentres the view on the lord.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { ATLAS_SCALE, drawAtlas } from '@/game/atlas'
import { WORLD_H, WORLD_W } from '@/game/worldgen'

const emit = defineEmits(['close'])

const world = useWorldStore()
const player = usePlayerStore()
const canvasEl = ref(null)
let ctx = null
let raf = 0
let observer = null
let size = { w: 0, h: 0 }
// Top-left corner of the visible slice of the world, in atlas pixels.
let pan = { x: 0, y: 0 }
let drag = null

/** Keep the world covering the viewport, or centred when it is smaller. */
function clampPan() {
  const w = WORLD_W * ATLAS_SCALE
  const h = WORLD_H * ATLAS_SCALE
  pan.x = w <= size.w ? (size.w - w) / 2 : Math.min(0, Math.max(size.w - w, pan.x))
  pan.y = h <= size.h ? (size.h - h) / 2 : Math.min(0, Math.max(size.h - h, pan.y))
}

function centerOnLord() {
  pan.x = size.w / 2 - (world.playerPos.x + 0.5) * ATLAS_SCALE
  pan.y = size.h / 2 - (world.playerPos.y + 0.5) * ATLAS_SCALE
  clampPan()
}

function measure() {
  const el = canvasEl.value
  if (!el) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  size = { w: el.clientWidth, h: el.clientHeight }
  el.width = Math.round(size.w * dpr)
  el.height = Math.round(size.h * dpr)
  ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  clampPan()
}

function loop() {
  if (ctx && size.w) {
    drawAtlas(ctx, world, {
      ox: pan.x,
      oy: pan.y,
      w: size.w,
      h: size.h,
      troops: player.totalTroops,
      companions: player.companions
    })
  }
  raf = requestAnimationFrame(loop)
}

// Pointer events cover mouse and touch with one code path; the capture keeps
// the drag alive when a finger leaves the canvas.
function onPointerDown(e) {
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY }
  e.currentTarget.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (!drag || e.pointerId !== drag.id) return
  pan.x += e.clientX - drag.x
  pan.y += e.clientY - drag.y
  drag.x = e.clientX
  drag.y = e.clientY
  clampPan()
}

function onPointerUp(e) {
  if (drag && e.pointerId === drag.id) drag = null
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(canvasEl.value)
  window.addEventListener('resize', measure)
  window.addEventListener('keydown', onKey)
  centerOnLord()
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  window.removeEventListener('resize', measure)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="atlas panel pop">
      <header class="head">
        <div class="title">🗺️ 世界全图</div>
        <div class="meta muted">
          第 {{ world.day }} 天 {{ world.clock.text }} · {{ world.settlements.length }} 处聚落 · 拖动查看不同区域
        </div>
        <button class="close" @click="$emit('close')">✕</button>
      </header>

      <div class="stage">
        <canvas
          ref="canvasEl"
          class="atlas-canvas"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        ></canvas>
      </div>

      <footer class="foot">
        <span class="muted small">手指按住拖动地图 · 图标右上角数字是该部队兵力</span>
        <button class="btn ghost small" @click="centerOnLord">🎯 回到主角</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.atlas {
  width: min(980px, 100%);
  height: min(760px, 100%);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.title {
  font-size: 16px;
  font-weight: 800;
  color: var(--gold);
}

.meta {
  flex: 1;
  font-size: 12px;
}

.close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--line);
  font-size: 15px;
  flex: none;
}

.stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #0c120c;
}

.stage canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* Touch panning: no page scroll, no pinch zoom, no double-tap zoom. */
  touch-action: none;
  cursor: grab;
}

.stage canvas:active {
  cursor: grabbing;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.small {
  font-size: 12px;
}

@media (max-width: 560px) {
  .atlas {
    padding: 10px;
  }

  .meta {
    display: none;
  }

  .foot .small {
    font-size: 11px;
  }
}
</style>
