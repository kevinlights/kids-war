<template>
  <canvas ref="canvasEl" class="world-canvas" @click="onPointer"></canvas>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { TERRAIN } from '@/game/terrain'
import { drawSprite } from '@/game/pixelAssets'
import { drawBadge, partyTroops } from '@/game/atlas'
import { TILE, WORLD_W, WORLD_H } from '@/game/worldgen'
import { ownerOf, garrisonCount } from '@/game/settlement'

// Terrain keys that carry a pixel-art decoration on top of the flat tile colour.
const TILE_DECO = { forest: 'forest', mountain: 'mountain', water: 'water', desert: 'desert' }

const world = useWorldStore()
const player = usePlayerStore()
const canvasEl = ref(null)

let ctx = null
let dpr = 1
let W = 0
let H = 0
let raf = 0
let last = 0
let vignette = null

function resize() {
  const el = canvasEl.value
  if (!el) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = el.clientWidth
  H = el.clientHeight
  el.width = Math.floor(W * dpr)
  el.height = Math.floor(H * dpr)
  ctx = el.getContext('2d')
  // The vignette only depends on the canvas size, so build it once per resize
  // instead of allocating a gradient on every animation frame.
  vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.4)')
}

function terrainAt(x, y) {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return null
  return TERRAIN[world.grid[y]?.[x]] || TERRAIN.plain
}

function drawTile(t, sx, sy, gx, gy) {
  ctx.fillStyle = t.color
  ctx.fillRect(sx, sy, TILE + 1, TILE + 1)
  // Light checker overlay gives the ground subtle texture.
  if ((gx + gy) % 2 === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.045)'
    ctx.fillRect(sx, sy, TILE + 1, TILE + 1)
  }
  // Trees, peaks, foam and dunes are 32x32 sprites laid over the tile colour.
  const deco = TILE_DECO[t.key]
  if (deco) drawSprite(ctx, deco, sx + TILE / 2, sy + TILE / 2, TILE)
}

function drawSettlement(st) {
  const sx = st.x * TILE + TILE / 2 - world.camX
  const sy = st.y * TILE + TILE / 2 - world.camY
  if (sx < -100 || sy < -100 || sx > W + 100 || sy > H + 100) return
  const isTown = st.kind === 'town'
  // Towns are drawn at 2x so a major landmark reads bigger than a village.
  const size = isTown ? TILE * 2 : TILE

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 4
  drawSprite(ctx, isTown ? 'town' : 'village', sx, sy, size)
  ctx.restore()

  // Ownership ring in the colour of the faction that holds the settlement, so
  // the map shows who owns what without a legend lookup.
  const owner = ownerOf(st)
  if (st.owner && st.owner !== 'neutral') {
    ctx.strokeStyle = owner.color
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(sx, sy, size / 2 + 3, 0, Math.PI * 2)
    ctx.stroke()
  }

  // The soldiers that defend the settlement, in the same badge the parties
  // and the lord use.
  const garrison = garrisonCount(st.garrison)
  if (garrison > 0) drawBadge(ctx, sx + 11, sy - 11, garrison)

  // Name plate below the icon.
  const label = st.owner === 'player' ? `${st.name} Lv.${st.level}` : st.name
  ctx.font = 'bold 12px "PingFang SC", sans-serif'
  const w = ctx.measureText(label).width + 12
  const plateY = sy + size / 2 + 2
  ctx.fillStyle = 'rgba(10,14,10,0.72)'
  ctx.beginPath()
  ctx.roundRect(sx - w / 2, plateY, w, 17, 8)
  ctx.fill()
  ctx.fillStyle = isTown ? '#ffe9a8' : '#f0e6cc'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, sx, plateY + 9)
}

function drawParty(p) {
  const sx = p.x * TILE + TILE / 2 - world.camX
  const sy = p.y * TILE + TILE / 2 - world.camY
  if (sx < -60 || sy < -60 || sx > W + 60 || sy > H + 60) return

  // Each faction is drawn as its own commander sprite, and the cloth colour
  // comes from `game/factions.js`: the very same icon and colour the legend
  // shows, so there is nothing to keep in sync by hand.
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 6
  drawSprite(ctx, p.faction, sx, sy, TILE)
  ctx.restore()

  // Troop badge in the icon's top-right corner, same as the lord's.
  drawBadge(ctx, sx + 11, sy - 11, partyTroops(p))
}

// A camped lord is drawn beside a tent with a live campfire, which is the map
// signal that game time is running while he stands still.
function drawCamp(sx, sy) {
  const fx = sx + TILE * 0.85
  const fy = sy + TILE * 0.1
  const flicker = 1 + Math.sin(performance.now() / 170) * 0.14

  ctx.save()
  const glow = ctx.createRadialGradient(fx, fy, 2, fx, fy, TILE * 1.35 * flicker)
  glow.addColorStop(0, 'rgba(255,201,120,0.5)')
  glow.addColorStop(1, 'rgba(255,140,60,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(fx, fy, TILE * 1.35 * flicker, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 8
  drawSprite(ctx, 'camp', sx + TILE * 0.95, sy - TILE * 0.1, TILE)
  ctx.restore()
}

function drawPlayer() {
  const sx = world.playerPos.x * TILE + TILE / 2 - world.camX
  const sy = world.playerPos.y * TILE + TILE / 2 - world.camY

  if (world.camping) drawCamp(sx, sy)

  // Pulsing selection ring: warm while camping, cool while on the march.
  const pulse = 1 + Math.sin(performance.now() / 320) * 0.12
  ctx.beginPath()
  ctx.arc(sx, sy, 16 * pulse, 0, Math.PI * 2)
  ctx.strokeStyle = world.camping ? 'rgba(255,186,96,0.8)' : 'rgba(74,163,255,0.7)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 8
  drawSprite(ctx, 'lord', sx, sy, TILE)
  ctx.restore()

  // The lord carries a troop badge in the same corner as a faction commander,
  // so both sides of a meeting can be sized up without opening a panel.
  drawBadge(ctx, sx + 11, sy - 11, player.totalTroops)
}

function drawPath() {
  if (!world.path.length) return
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 7])
  ctx.beginPath()
  ctx.moveTo(
    world.playerPos.x * TILE + TILE / 2 - world.camX,
    world.playerPos.y * TILE + TILE / 2 - world.camY
  )
  for (const p of world.path) ctx.lineTo(p.x * TILE + TILE / 2 - world.camX, p.y * TILE + TILE / 2 - world.camY)
  ctx.stroke()
  ctx.restore()
}

function render() {
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)

  const x0 = Math.max(0, Math.floor(world.camX / TILE))
  const y0 = Math.max(0, Math.floor(world.camY / TILE))
  const x1 = Math.min(WORLD_W - 1, Math.ceil((world.camX + W) / TILE))
  const y1 = Math.min(WORLD_H - 1, Math.ceil((world.camY + H) / TILE))

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = terrainAt(x, y)
      if (!t) continue
      drawTile(t, Math.floor(x * TILE - world.camX), Math.floor(y * TILE - world.camY), x, y)
    }
  }

  drawPath()
  for (const st of world.settlements) drawSettlement(st)
  for (const p of world.parties) drawParty(p)
  drawPlayer()

  // Vignette for depth.
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, W, H)
}

function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0)
  last = ts
  world.tick(dt)
  world.updateCamera(W, H)
  render()
  raf = requestAnimationFrame(loop)
}

function onPointer(e) {
  const rect = canvasEl.value.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const gx = (sx + world.camX - TILE / 2) / TILE
  const gy = (sy + world.camY - TILE / 2) / TILE
  world.moveTo(gx, gy)
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  last = performance.now()
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.world-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: manipulation;
}
</style>
