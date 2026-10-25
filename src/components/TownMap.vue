<template>
  <canvas ref="canvasEl" class="town-canvas" @click="onPointer"></canvas>
</template>

<script setup>
/**
 * The walkable scene of a town or a village.
 *
 * The canvas draws the ground the scene generated, then the buildings, the
 * street props, the townsfolk and the lord, sorted by the depth of their feet so
 * a house covers the tiles behind it. Clicking the ground sends the lord there
 * with the same pathfinder the world map uses; clicking a person or a door
 * walks him there and reports the target to the screen, which opens the
 * conversation.
 *
 * 城镇场景画布：地面、房屋、道具、居民与领主按脚底高度排序绘制；点地面寻路，
 * 点人或门口就走过去并交给上层界面处理。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { drawSprite } from '@/game/pixelAssets'
import { TOWN_TILE, isWalkable, scenePath, buildingNear, npcNear } from '@/game/town'

/** Colours used while a ground sprite has not arrived yet (or is missing). */
const GROUND_FALLBACK = {
  grass: '#4a7a3c',
  path: '#a68a63',
  cobble: '#97917f',
  plaza: '#b3ada0',
  farm: '#7a5738',
  water: '#3a6c9a'
}

const props = defineProps({
  scene: { type: Object, required: true }
})
const emit = defineEmits(['interact', 'near-change'])

const world = useWorldStore()
const player = usePlayerStore()
const canvasEl = ref(null)

const TILE = TOWN_TILE

let ctx = null
let dpr = 1
let W = 0
let H = 0
let raf = 0
let last = 0

// The lord's own position inside the scene, in tiles.
const pos = { x: 0, y: 0 }
let path = []
// A target the lord was sent to on purpose: the door he tapped, or a person.
let pending = null
let facing = 1
let stepPhase = 0
const cam = { x: 0, y: 0 }

function resize() {
  const el = canvasEl.value
  if (!el) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = el.clientWidth
  H = el.clientHeight
  el.width = Math.floor(W * dpr)
  el.height = Math.floor(H * dpr)
  ctx = el.getContext('2d')
  // The camera is clamped to the map, so a scene smaller than the screen is
  // centred instead of sticking to the top-left corner.
  centreCamera(true)
}

/** Put the camera on the lord, or on the whole scene when it fits. */
function centreCamera(snap = false) {
  const sceneW = props.scene.w * TILE
  const sceneH = props.scene.h * TILE
  const tx = sceneW <= W ? (sceneW - W) / 2 : Math.max(0, Math.min(sceneW - W, pos.x * TILE + TILE / 2 - W / 2))
  const ty = sceneH <= H ? (sceneH - H) / 2 : Math.max(0, Math.min(sceneH - H, pos.y * TILE + TILE / 2 - H / 2))
  if (snap) {
    cam.x = tx
    cam.y = ty
  } else {
    cam.x += (tx - cam.x) * 0.16
    cam.y += (ty - cam.y) * 0.16
  }
}

/* --------------------------------- drawing -------------------------------- */

function drawGround() {
  const scene = props.scene
  const x0 = Math.max(0, Math.floor(cam.x / TILE))
  const y0 = Math.max(0, Math.floor(cam.y / TILE))
  const x1 = Math.min(scene.w - 1, Math.floor((cam.x + W) / TILE))
  const y1 = Math.min(scene.h - 1, Math.floor((cam.y + H) / TILE))
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const key = scene.ground[y][x]
      const sx = x * TILE - cam.x
      const sy = y * TILE - cam.y
      if (!drawSprite(ctx, `ground-${key}`, sx + TILE / 2, sy + TILE / 2, TILE)) {
        ctx.fillStyle = GROUND_FALLBACK[key] || '#4a7a3c'
        ctx.fillRect(sx, sy, TILE + 1, TILE + 1)
      }
    }
  }
}

function drawBuilding(b) {
  const scene = props.scene
  const size = Math.max(b.w, b.h) * TILE
  const sx = (b.x + b.w / 2) * TILE - cam.x
  const sy = (b.y + b.h / 2) * TILE - cam.y
  if (sx < -size || sy < -size || sx > W + size || sy > H + size) return
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 4
  drawSprite(ctx, b.sprite, sx, sy, size)
  ctx.restore()

  // Name plate under the building, so the town reads as a map of places.
  const label = b.name
  ctx.font = 'bold 11px "PingFang SC", sans-serif'
  const w = ctx.measureText(label).width + 10
  const plateY = (b.y + b.h) * TILE - cam.y + 1
  ctx.fillStyle = 'rgba(10,14,10,0.7)'
  ctx.beginPath()
  ctx.roundRect(sx - w / 2, plateY, w, 15, 7)
  ctx.fill()
  ctx.fillStyle = '#ffe9a8'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, sx, plateY + 8)
  void scene
}

function drawProp(p) {
  const sx = p.x * TILE + TILE / 2 - cam.x
  const sy = p.y * TILE + TILE / 2 - cam.y
  if (sx < -TILE || sy < -TILE || sx > W + TILE || sy > H + TILE) return
  if (!drawSprite(ctx, p.sprite, sx, sy, TILE)) return
}

/** A townsfolk: sprite, name, and the state of his quest over his head. */
function drawNpc(n) {
  const sx = n.x * TILE + TILE / 2 - cam.x
  const sy = n.y * TILE + TILE / 2 - cam.y
  if (sx < -TILE || sy < -TILE || sx > W + TILE || sy > H + TILE) return

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 5
  ctx.shadowOffsetY = 2
  drawSprite(ctx, n.sprite, sx, sy, TILE)
  ctx.restore()

  // The quest marker: 「?」 for a job nobody has taken, 「!」 for one in progress
  // and 「✓」 once it is done. It reads the record without creating one: merely
  // walking past a townsperson must not start his job.
  const state = player.quests[n.id]
  const mark = !state ? '?' : state.done ? '✓' : '!'
  const markColor = !state ? '#9fc6ff' : state.done ? '#8fe08a' : '#ffd76a'
  ctx.beginPath()
  ctx.arc(sx + 11, sy - 13, 6, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(12,16,12,0.85)'
  ctx.fill()
  ctx.fillStyle = markColor
  ctx.font = 'bold 10px "PingFang SC", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(mark, sx + 11, sy - 12)

  // Name plate, small enough to never cover the people behind it.
  ctx.font = '10px "PingFang SC", sans-serif'
  const w = ctx.measureText(n.name).width + 8
  ctx.fillStyle = 'rgba(10,14,10,0.62)'
  ctx.beginPath()
  ctx.roundRect(sx - w / 2, sy + 11, w, 13, 6)
  ctx.fill()
  ctx.fillStyle = n.follower ? '#ffe9a8' : '#e6dfc8'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(n.name, sx, sy + 17)
}

function drawPlayer() {
  const sx = pos.x * TILE + TILE / 2 - cam.x
  const sy = pos.y * TILE + TILE / 2 - cam.y
  // A soft shadow and a pulse, so the lord is easy to find in a busy square.
  const pulse = 1 + Math.sin(performance.now() / 340) * 0.1
  ctx.beginPath()
  ctx.ellipse(sx, sy + 10, 11 * pulse, 5 * pulse, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(sx, sy, 17 * pulse, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(74,163,255,0.65)'
  ctx.lineWidth = 2
  ctx.stroke()

  // A small hop while walking, so movement reads at 32 pixels.
  const bob = Math.sin(stepPhase) * 1.6
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 6
  drawSprite(ctx, 'lord', sx, sy + bob, TILE, facing < 0)
  ctx.restore()
}

/** Highlight the person or the door the lord can use right now. */
function drawHighlight() {
  const target = currentNear()
  if (!target) return
  const p = target.kind === 'npc' ? { x: target.npc.x, y: target.npc.y } : { x: target.building.door.x, y: target.building.door.y }
  const sx = p.x * TILE + TILE / 2 - cam.x
  const sy = p.y * TILE + TILE - cam.y
  ctx.save()
  ctx.strokeStyle = 'rgba(255,215,106,0.85)'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.ellipse(sx, sy, 15, 7, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

/** The night veil, the same one the world map draws. */
function drawNight() {
  const phase = world.dayPhase
  if (phase.darkness <= 0.01) return
  ctx.save()
  ctx.fillStyle = `rgba(9,14,36,${0.55 * phase.darkness})`
  ctx.fillRect(0, 0, W, H)
  const lx = pos.x * TILE + TILE / 2 - cam.x
  const ly = pos.y * TILE + TILE / 2 - cam.y
  const radius = TILE * 3
  const glow = ctx.createRadialGradient(lx, ly, radius * 0.15, lx, ly, radius)
  glow.addColorStop(0, `rgba(0,0,0,${0.9 * phase.darkness})`)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(lx, ly, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function render() {
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  drawGround()

  // Depth sort: everything is drawn by the bottom edge of its footprint, so a
  // house hides the tiles behind it and a person in front of it hides the wall.
  const items = []
  for (const b of props.scene.buildings) items.push({ y: b.y + b.h, fn: () => drawBuilding(b) })
  for (const p of props.scene.props) items.push({ y: p.y + 0.9, fn: () => drawProp(p) })
  for (const n of props.scene.npcs) items.push({ y: n.y + 0.9, fn: () => drawNpc(n) })
  items.push({ y: pos.y + 0.95, fn: drawPlayer })
  items.sort((a, b) => a.y - b.y)
  for (const item of items) item.fn()

  drawHighlight()
  drawNight()
}

/* -------------------------------- movement -------------------------------- */

function walkAlongPath(dt) {
  if (!path.length) return
  let remaining = 3.4 * dt
  let guard = 0
  while (remaining > 0 && path.length && guard++ < 60) {
    const next = path[0]
    const dx = next.x - pos.x
    const dy = next.y - pos.y
    const dist = Math.hypot(dx, dy)
    if (dist < 1e-3) {
      path.shift()
      continue
    }
    const step = Math.min(dist, remaining)
    pos.x += (dx / dist) * step
    pos.y += (dy / dist) * step
    if (Math.abs(dx) > 1e-3) facing = dx > 0 ? 1 : -1
    stepPhase += step * 5
    remaining -= step
    if (step >= dist - 1e-3) path.shift()
  }
  if (!path.length) {
    stepPhase = 0
    // Arrived: if the walk was aimed at a person or a door, say so.
    if (pending) {
      const target = pending
      pending = null
      if (withinReach(target)) emit('interact', target)
    }
  }
}

function withinReach(target) {
  if (!target) return false
  if (target.kind === 'npc') return Math.hypot(target.npc.x - pos.x, target.npc.y - pos.y) < 1.5
  return Math.hypot(target.building.door.x - pos.x, target.building.door.y - pos.y) < 1.5
}

/** Everyone drifts around their own doorstep, a few steps at a time. */
function wanderNpcs(dt) {
  const scene = props.scene
  for (const n of scene.npcs) {
    if (!n.path || !n.path.length) {
      n.wanderTimer = (n.wanderTimer || 0) - dt
      if (n.wanderTimer > 0) continue
      n.wanderTimer = 3 + Math.random() * 5
      // A townsperson drifts a step or two from his doorstep, never across the
      // square: he has to stay where a child last saw him.
      const tx = Math.round(n.homeX + (Math.random() - 0.5) * 2)
      const ty = Math.round(n.homeY + (Math.random() - 0.5) * 2)
      if (!isWalkable(scene, tx, ty)) continue
      const next = scenePath(scene, { x: n.x, y: n.y }, { x: tx, y: ty })
      if (next.length) n.path = next
      continue
    }
    const step = 1.05 * dt
    const next = n.path[0]
    const dx = next.x - n.x
    const dy = next.y - n.y
    const dist = Math.hypot(dx, dy)
    if (dist < step) {
      n.x = next.x
      n.y = next.y
      n.path.shift()
    } else {
      n.x += (dx / dist) * step
      n.y += (dy / dist) * step
    }
  }
}

/** What the lord can use where he stands: a person first, then a door. */
function currentNear() {
  const npc = npcNear(props.scene, pos)
  if (npc) return { kind: 'npc', npc }
  const building = buildingNear(props.scene, pos)
  if (building) return { kind: 'building', building }
  return null
}

let lastNearKey = ''
function reportNear() {
  const target = currentNear()
  const key = target ? `${target.kind}:${target.npc?.id || target.building?.id}` : ''
  if (key === lastNearKey) return
  lastNearKey = key
  emit('near-change', target)
}

function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0)
  last = ts
  walkAlongPath(dt)
  wanderNpcs(dt)
  centreCamera()
  render()
  reportNear()
  raf = requestAnimationFrame(loop)
}

/* --------------------------------- input ---------------------------------- */

function onPointer(e) {
  const rect = canvasEl.value.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const gx = (sx + cam.x) / TILE
  const gy = (sy + cam.y) / TILE

  // Tapping a person or a door walks there and opens it; tapping the ground is
  // just a walk order.
  // People are a forgiving target: a tap within a tile of them counts, because a
  // 32 px sprite on a phone is smaller than a fingertip.
  const npc = props.scene.npcs.find((n) => Math.hypot(n.x + 0.5 - gx, n.y + 0.5 - gy) < 1.1)
  const target = npc
    ? { kind: 'npc', npc }
    : (() => {
        const b = props.scene.buildings.find(
          (bd) =>
            gx >= bd.x && gx <= bd.x + bd.w && gy >= bd.y && gy <= bd.y + bd.h
        )
        if (b) return { kind: 'building', building: b }
        const door = props.scene.buildings.find((bd) => Math.hypot(bd.door.x + 0.5 - gx, bd.door.y + 0.5 - gy) < 1)
        return door ? { kind: 'building', building: door } : null
      })()

  if (target) {
    // A door is approached from the tile in front of it, never from inside the
    // wall: the building itself is blocked ground.
    const goal = target.kind === 'building' ? target.building.door : { x: Math.round(target.npc.x), y: Math.round(target.npc.y) }
    if (withinReach(target)) {
      pending = null
      path = []
      emit('interact', target)
      return
    }
    const next = scenePath(props.scene, pos, goal)
    if (next.length) {
      path = next
      pending = target
      return
    }
  }
  pending = null
  path = scenePath(props.scene, pos, { x: Math.round(gx), y: Math.round(gy) })
}

/** Walk to a target from the outside (the button in the bottom bar uses it). */
function goTo(target) {
  if (!target) return
  if (withinReach(target)) {
    emit('interact', target)
    return
  }
  const goal = target.kind === 'building' ? target.building.door : { x: Math.round(target.npc.x), y: Math.round(target.npc.y) }
  const next = scenePath(props.scene, pos, goal)
  if (!next.length) return
  path = next
  pending = target
}

defineExpose({ goTo, position: pos })

onMounted(() => {
  pos.x = props.scene.spawn.x
  pos.y = props.scene.spawn.y
  resize()
  window.addEventListener('resize', resize)
  centreCamera(true)
  last = performance.now()
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.town-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
  touch-action: manipulation;
}
</style>
