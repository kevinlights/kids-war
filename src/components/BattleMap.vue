<template>
  <canvas ref="canvasEl" class="battle-canvas" @click="onPointer"></canvas>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useBattleStore } from '@/stores/battle'
import { ARENA } from '@/game/battle'
import { createRng } from '@/game/rng'
import { drawSprite } from '@/game/pixelAssets'
import { unitSprite } from '@/game/units'

const emit = defineEmits(['end'])
const battle = useBattleStore()
const canvasEl = ref(null)

let ctx = null
let dpr = 1
let W = 0
let H = 0
let scale = 1
let offX = 0
let offY = 0
let raf = 0
let last = 0
let endEmitted = false

// Static decorations are generated once so the field looks stable per battle.
const rng = createRng(90210)
const patches = Array.from({ length: 46 }, () => ({
  x: rng.float(0, ARENA.w),
  y: rng.float(0, ARENA.h),
  r: rng.float(26, 78),
  c: rng.chance(0.5) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
}))
const tufts = Array.from({ length: 130 }, () => ({ x: rng.float(0, ARENA.w), y: rng.float(0, ARENA.h) }))

function resize() {
  const el = canvasEl.value
  if (!el) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = el.clientWidth
  H = el.clientHeight
  el.width = Math.floor(W * dpr)
  el.height = Math.floor(H * dpr)
  ctx = el.getContext('2d')
  scale = Math.min(W / ARENA.w, H / ARENA.h) * 0.96
  offX = (W - ARENA.w * scale) / 2
  offY = (H - ARENA.h * scale) / 2
}

function drawFloor() {
  ctx.fillStyle = '#7cb85a'
  ctx.fillRect(0, 0, ARENA.w, ARENA.h)
  for (const p of patches) {
    ctx.fillStyle = p.c
    ctx.beginPath()
    ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = 'rgba(60,110,50,0.5)'
  ctx.lineWidth = 1
  for (const t of tufts) {
    ctx.beginPath()
    ctx.moveTo(t.x, t.y)
    ctx.lineTo(t.x + 2, t.y - 5)
    ctx.stroke()
  }
  // Border to frame the field.
  ctx.strokeStyle = 'rgba(20,40,20,0.55)'
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, ARENA.w - 6, ARENA.h - 6)
}

function drawUnit(u) {
  const size = u.isCommander ? 36 : 28
  const isPlayer = u.side === 'player'
  const groundY = u.y + size / 2 - 4

  // The squad the player has selected wears a gold ring, so the command bar
  // and the field always agree about what the order will apply to.
  if (isPlayer && battle.selectedGroup && u.group === battle.selectedGroup) {
    ctx.strokeStyle = 'rgba(232,197,106,0.9)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(u.x, groundY, 13, 5, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Base disc in the side's colour: both armies share the same unit art, so
  // the ground colour is what separates friend from foe on the field.
  ctx.fillStyle = isPlayer ? 'rgba(74,163,255,0.6)' : 'rgba(216,83,63,0.6)'
  ctx.beginPath()
  ctx.ellipse(u.x, groundY, 11, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  if (u.hitFlash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.arc(u.x, u.y, size * 0.55, 0, Math.PI * 2)
    ctx.fill()
  }

  // The commander uses the lord sprite; soldiers use their own unit type and
  // flip to face the way they are moving.
  drawSprite(ctx, u.isCommander ? 'lord' : unitSprite(u.type, u.tier), u.x, u.y, size, u.facing < 0)

  // Health bar above every unit.
  const w = size * 0.7
  const hpPct = Math.max(0, u.hp / u.maxHp)
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(u.x - w / 2, u.y - size / 2 - 6, w, 4)
  ctx.fillStyle = isPlayer ? '#5fd07a' : '#e06b5a'
  ctx.fillRect(u.x - w / 2, u.y - size / 2 - 6, w * hpPct, 4)

  // Rank pips for the tiered families: 初级 is one pip, 精英 is four.
  if (u.def && u.def.tiered) {
    const pipW = 3
    const gap = 1
    const total = u.tier * pipW + (u.tier - 1) * gap
    const rowY = u.y - size / 2 - 12
    for (let i = 0; i < u.tier; i++) {
      ctx.fillStyle = i === u.tier - 1 ? '#ffe9a8' : 'rgba(232,197,106,0.6)'
      ctx.fillRect(u.x - total / 2 + i * (pipW + gap), rowY, pipW, 3)
    }
  }
}

/** Rally crosses for every squad that is heading somewhere. */
function drawRallies() {
  const sel = battle.selectedGroup
  for (const g of battle.groups) {
    if (!g.rally || g.order !== 'move') continue
    const active = !sel || g.key === sel
    ctx.strokeStyle = active ? 'rgba(255,233,168,0.95)' : 'rgba(255,233,168,0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(g.rally.x, g.rally.y, 9, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(g.rally.x - 5, g.rally.y)
    ctx.lineTo(g.rally.x + 5, g.rally.y)
    ctx.moveTo(g.rally.x, g.rally.y - 5)
    ctx.lineTo(g.rally.x, g.rally.y + 5)
    ctx.stroke()
  }
}

function drawProjectiles() {
  for (const p of battle.data.projectiles) {
    ctx.strokeStyle = p.side === 'player' ? '#fff8dc' : '#ffd0b0'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    const angle = Math.atan2(p.ty - p.y, p.tx - p.x)
    ctx.lineTo(p.x + Math.cos(angle) * 10, p.y + Math.sin(angle) * 10)
    ctx.stroke()
  }
}

function drawEffects() {
  for (const e of battle.data.effects) {
    const k = e.t / e.life
    ctx.strokeStyle = `rgba(255,240,180,${1 - k})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(e.x, e.y, 4 + k * 14, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function render() {
  if (!ctx || !battle.data) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  ctx.translate(offX, offY)
  ctx.scale(scale, scale)

  drawFloor()

  // Commander movement target marker.
  const cmd = battle.data.commander
  ctx.strokeStyle = 'rgba(74,163,255,0.6)'
  ctx.setLineDash([5, 6])
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cmd.tx, cmd.ty, 16, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  for (const u of battle.data.units) if (u.alive) drawUnit(u)
  if (cmd.alive) drawUnit(cmd)
  drawRallies()
  drawProjectiles()
  drawEffects()

  ctx.restore()
}

function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0)
  last = ts
  if (battle.active) {
    battle.tick(dt)
    if (battle.data && battle.data.outcome && !endEmitted) {
      endEmitted = true
      setTimeout(() => emit('end'), 650)
    }
  }
  render()
  raf = requestAnimationFrame(loop)
}

function onPointer(e) {
  if (!battle.data || battle.data.outcome) return
  const rect = canvasEl.value.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const ax = (sx - offX) / scale
  const ay = (sy - offY) / scale
  // A squad waiting on a move order plants its rally flag here; otherwise the
  // tap moves the commander.
  battle.tapField(ax, ay)
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
.battle-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: manipulation;
}
</style>
