<script setup>
/**
 * Corner minimap: the whole world in miniature, with the settlement markers,
 * the roaming warbands, the camera rectangle and the lord. Tapping it opens
 * the detailed atlas, where a finger drag pans across the world.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useWorldStore } from '@/stores/world'
import { drawMiniMap } from '@/game/atlas'
import { WORLD_H, WORLD_W } from '@/game/worldgen'

defineEmits(['open'])

const world = useWorldStore()
const canvasEl = ref(null)

let ctx = null
let raf = 0
let observer = null
let viewW = 0
let viewH = 0

// The canvas keeps its world aspect ratio in CSS, so a resize only has to
// re-scale the backing store to the device pixel ratio and remember the size.
function measure() {
  const el = canvasEl.value
  if (!el) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  viewW = el.clientWidth
  viewH = el.clientHeight
  el.width = Math.round(viewW * dpr)
  el.height = Math.round(viewH * dpr)
  ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function loop() {
  if (ctx && viewW && viewH) drawMiniMap(ctx, world, viewW, viewH)
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(canvasEl.value)
  window.addEventListener('resize', measure)
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <button class="minimap panel" type="button" title="点击查看详细地图" @click="$emit('open')">
    <canvas ref="canvasEl" :style="{ aspectRatio: `${WORLD_W} / ${WORLD_H}` }"></canvas>
    <span class="tag">🗺️ 全图 · 点击放大</span>
  </button>
</template>

<style scoped>
.minimap {
  display: block;
  width: 124px;
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
  text-align: center;
}

.minimap canvas {
  display: block;
  width: 100%;
  /* Blocky terrain is the point here, so never let the browser smooth it. */
  image-rendering: pixelated;
  border-bottom: 1px solid var(--line);
}

.tag {
  display: block;
  padding: 3px 4px 4px;
  font-size: 10px;
  color: var(--gold);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.minimap:hover .tag {
  color: #ffe9a8;
}

@media (max-width: 560px) {
  .minimap {
    width: 104px;
  }

  .tag {
    font-size: 9.5px;
  }
}
</style>
