<template>
  <canvas
    ref="canvasEl"
    class="battle-canvas"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @click="onPointer"
  ></canvas>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBattleStore } from '@/stores/battle'
import { ARENA } from '@/game/battle'
import { arenaCellTerrain } from '@/game/arena'
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
let raf = 0
let last = 0
let endEmitted = false

// The terrain is painted once into an offscreen canvas, so the field is a
// single blit per frame however many cells it has.
let ground = null
let groundTerrain = null

// Drag state: a finger that moves over the field pans the camera.
let dragging = false
let dragMoved = false
let lastX = 0
let lastY = 0

function resize() {
  const el = canvasEl.value
  if (!el) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = el.clientWidth
  H = el.clientHeight
  el.width = Math.floor(W * dpr)
  el.height = Math.floor(H * dpr)
  ctx = el.getContext('2d')
  battle.updateCamera(W, H)
}

/**
 * Paint the ground of the field: one coloured block per terrain cell plus the
 * little decorations that make the terrain readable at a glance.
 */
function buildGround(terrain) {
  if (!terrain) return
  const canvas = document.createElement('canvas')
  canvas.width = ARENA.w
  canvas.height = ARENA.h
  const g = canvas.getContext('2d')
  const rng = createRng((terrain.seed || 1) * 97 + 13)
  const cell = terrain.cell

  for (let r = 0; r < terrain.rows; r += 1) {
    for (let c = 0; c < terrain.cols; c += 1) {
      const t = arenaCellTerrain(terrain, c, r)
      const x = c * cell
      const y = r * cell
      g.fillStyle = t.color
      g.fillRect(x, y, cell, cell)
      if (t.key === 'plain') {
        // A little variety so the grass is not a flat sheet of colour.
        if (rng.chance(0.35)) {
          g.fillStyle = 'rgba(255,255,255,0.05)'
          g.fillRect(x, y, cell, cell)
        }
      }
    }
  }

  // Decorations on top of the colour blocks.
  for (let r = 0; r < terrain.rows; r += 1) {
    for (let c = 0; c < terrain.cols; c += 1) {
      const t = arenaCellTerrain(terrain, c, r)
      const cx = c * cell + cell / 2
      const cy = r * cell + cell / 2
      if (t.key === 'forest') {
        for (let i = 0; i < 4; i += 1) {
          const x = cx + rng.float(-16, 16)
          const y = cy + rng.float(-12, 12)
          const s = rng.float(7, 11)
          g.fillStyle = 'rgba(24,72,30,0.85)'
          g.beginPath()
          g.moveTo(x, y - s)
          g.lineTo(x + s * 0.75, y + s * 0.6)
          g.lineTo(x - s * 0.75, y + s * 0.6)
          g.closePath()
          g.fill()
          g.fillStyle = 'rgba(18,54,24,0.9)'
          g.fillRect(x - 1.5, y + s * 0.5, 3, 4)
        }
      } else if (t.key === 'mountain') {
        for (let i = 0; i < 2; i += 1) {
          const x = cx + rng.float(-14, 14)
          const y = cy + rng.float(-6, 12)
          const s = rng.float(10, 16)
          g.fillStyle = '#7d7466'
          g.beginPath()
          g.moveTo(x, y - s)
          g.lineTo(x + s, y + s * 0.5)
          g.lineTo(x - s, y + s * 0.5)
          g.closePath()
          g.fill()
          g.fillStyle = '#a49a89'
          g.beginPath()
          g.moveTo(x, y - s)
          g.lineTo(x + s * 0.45, y - s * 0.2)
          g.lineTo(x - s * 0.45, y - s * 0.2)
          g.closePath()
          g.fill()
        }
      } else if (t.key === 'desert') {
        g.fillStyle = 'rgba(150,120,60,0.35)'
        for (let i = 0; i < 6; i += 1) {
          g.beginPath()
          g.arc(cx + rng.float(-18, 18), cy + rng.float(-16, 16), rng.float(1, 2.4), 0, Math.PI * 2)
          g.fill()
        }
      } else if (t.key === 'river' || t.key === 'lake') {
        g.strokeStyle = 'rgba(255,255,255,0.35)'
        g.lineWidth = 1.5
        for (let i = 0; i < 3; i += 1) {
          const y = cy - 12 + i * 9 + rng.float(-3, 3)
          const w = rng.float(10, 22)
          g.beginPath()
          g.moveTo(cx - w / 2, y)
          g.quadraticCurveTo(cx, y + 3, cx + w / 2, y)
          g.stroke()
        }
      } else {
        // Grass tufts on the plain.
        g.strokeStyle = 'rgba(60,110,50,0.5)'
        g.lineWidth = 1
        for (let i = 0; i < 3; i += 1) {
          const x = cx + rng.float(-16, 16)
          const y = cy + rng.float(-14, 14)
          g.beginPath()
          g.moveTo(x, y)
          g.lineTo(x + 2, y - 5)
          g.stroke()
        }
      }
    }
  }

  ground = canvas
  groundTerrain = terrain
}

function drawGround() {
  if (!ground) return
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(ground, 0, 0)
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
  // The ground around the field, so the area outside it does not look like a
  // hole in the screen.
  ctx.fillStyle = '#1b2418'
  ctx.fillRect(0, 0, W, H)
  ctx.save()
  // The camera: the field is bigger than the screen, so it is looked at
  // through a movable window.
  ctx.translate(W / 2, H / 2)
  ctx.scale(battle.zoom, battle.zoom)
  ctx.translate(-battle.camX, -battle.camY)

  drawGround()

  // Border to frame the field.
  ctx.strokeStyle = 'rgba(20,40,20,0.55)'
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, ARENA.w - 6, ARENA.h - 6)

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
  battle.updateCamera(W, H)
  render()
  raf = requestAnimationFrame(loop)
}

/** Turn a screen position into a position on the field. */
function toField(e) {
  const rect = canvasEl.value.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  return {
    x: (sx - W / 2) / battle.zoom + battle.camX,
    y: (sy - H / 2) / battle.zoom + battle.camY
  }
}

function onPointerDown(e) {
  dragging = true
  dragMoved = false
  lastX = e.clientX
  lastY = e.clientY
  if (canvasEl.value.setPointerCapture) {
    try {
      canvasEl.value.setPointerCapture(e.pointerId)
    } catch {
      /* the pointer may already be gone */
    }
  }
}

function onPointerMove(e) {
  if (!dragging) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
  // A small movement is a tap, a longer one is a drag of the field.
  if (!dragMoved && Math.hypot(dx, dy) < 2) return
  dragMoved = true
  battle.panCamera(dx, dy)
}

function onPointerUp() {
  dragging = false
}

function onPointer(e) {
  // A drag pans the field; the click that follows it must not place a flag.
  if (dragMoved) {
    dragMoved = false
    return
  }
  if (!battle.data || battle.data.outcome) return
  // A squad waiting on a move order plants its rally flag here; otherwise the
  // tap moves the commander.
  const p = toField(e)
  battle.tapField(p.x, p.y)
}

// The ground is painted once per battle.
watch(
  () => battle.data?.terrain,
  (terrain) => {
    if (terrain && terrain !== groundTerrain) buildGround(terrain)
  },
  { immediate: true }
)

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
  touch-action: none;
}
</style>
