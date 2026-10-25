/**
 * Whole-world painters shared by the two "at a glance" maps on the world
 * screen: the corner minimap and the draggable atlas that opens when it is
 * tapped. Both render the very same world state through the very same helpers,
 * so the two views can never disagree about where a settlement or a warband is.
 */

import { TERRAIN } from './terrain'
import { drawSprite } from './pixelAssets'
import { followerTargets } from './followers'
import { FACTIONS, factionOf } from './factions'
import { companionStrength } from './npc'
import { ownerOf } from './settlement'
import { TILE, WORLD_W, WORLD_H } from './worldgen'

/** Pixels per world tile on the detailed atlas: bigger than a phone screen. */
export const ATLAS_SCALE = 16

/** Soldiers in one roaming party, for the troop badge. */
export function partyTroops(party) {
  return party.units.reduce((n, u) => n + u.count, 0)
}

/**
 * Troop badge for the top-right corner of an icon: a dark disc with the count
 * in white. The world map, the atlas and the legend all call this, so every
 * figure carries a badge of the same size and style.
 */
export function drawBadge(ctx, x, y, count, r = 9) {
  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${count >= 100 ? Math.round(r * 1.05) : Math.round(r * 1.2)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(count), x, y)
  ctx.restore()
}

let terrainTiles = null
let terrainSeed = null

/**
 * One pixel per world tile, built once per generated world. Both maps blit
 * this single image with smoothing off instead of filling thousands of tiny
 * rectangles on every frame, which is what keeps them cheap enough to redraw.
 */
export function terrainImage(seed, grid) {
  if (terrainTiles && terrainSeed === seed) return terrainTiles
  const canvas = document.createElement('canvas')
  canvas.width = WORLD_W
  canvas.height = WORLD_H
  const ctx = canvas.getContext('2d')
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      ctx.fillStyle = (TERRAIN[grid[y] && grid[y][x]] || TERRAIN.plain).color
      ctx.fillRect(x, y, 1, 1)
    }
  }
  terrainTiles = canvas
  terrainSeed = seed
  return canvas
}

/** Blit the terrain picture into a rectangle, nearest-neighbour. */
function blitTerrain(ctx, world, x, y, w, h) {
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(terrainImage(world.seed, world.grid), Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  ctx.restore()
}

/**
 * Corner minimap: blocky terrain, one marker per settlement, the roaming
 * warbands in their faction colour, the rectangle the big map is looking at
 * and the lord. Everything is a plain shape, so it stays readable at ~100 px.
 */
export function drawMiniMap(ctx, world, w, h, companions = []) {
  const sx = w / WORLD_W
  const sy = h / WORLD_H
  ctx.clearRect(0, 0, w, h)
  blitTerrain(ctx, world, 0, 0, w, h)

  // Settlements: a square in the owner's colour, so the minimap reads as a
  // map of who holds what. A town is a bigger square with a dark rim, a
  // village a smaller pale square; an unclaimed place keeps the neutral tone.
  for (const st of world.settlements) {
    const town = st.kind === 'town'
    const size = town ? 5 : 3
    const x = Math.round(st.x * sx - size / 2)
    const y = Math.round(st.y * sy - size / 2)
    const owner = ownerOf(st)
    ctx.fillStyle = st.owner === 'neutral' ? (town ? '#ffd76a' : '#f4ecd6') : owner.color
    ctx.fillRect(x, y, size, size)
    if (town) {
      ctx.strokeStyle = 'rgba(70, 44, 0, 0.9)'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1)
    }
  }

  // Roaming warbands: a dot in the faction colour, so the minimap doubles as a
  // threat view (grey for bandits, the two kingdom colours for the rest).
  for (const p of world.parties) {
    ctx.fillStyle = factionOf(p.faction).color
    ctx.beginPath()
    ctx.arc(p.x * sx, p.y * sy, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // The companions ride in a tight cluster around the lord: at this scale a
  // dot per follower is all there is room for, but it reads as a party.
  if (companions.length) {
    const cx = (world.playerPos.x + 0.5) * sx
    const cy = (world.playerPos.y + 0.5) * sy
    ctx.fillStyle = 'rgba(255, 236, 180, 0.9)'
    companions.slice(0, 6).forEach((_, i) => {
      const angle = (i / Math.max(1, Math.min(6, companions.length))) * Math.PI * 2 - Math.PI / 2
      ctx.beginPath()
      ctx.arc(cx + Math.cos(angle) * 2.1, cy + Math.sin(angle) * 2.1, 1.1, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  // The rectangle the big map is showing right now.
  if (world.viewW && world.viewH) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)'
    ctx.lineWidth = 1
    ctx.strokeRect(
      Math.round((world.camX / TILE) * sx) + 0.5,
      Math.round((world.camY / TILE) * sy) + 0.5,
      Math.max(3, Math.round((world.viewW / TILE) * sx)),
      Math.max(3, Math.round((world.viewH / TILE) * sy))
    )
  }

  // The lord: the one dot that pulses, drawn last so nothing covers it.
  const px = (world.playerPos.x + 0.5) * sx
  const py = (world.playerPos.y + 0.5) * sy
  const pulse = 3.2 + Math.sin(performance.now() / 320) * 0.9
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.beginPath()
  ctx.arc(px, py, pulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = FACTIONS.player.color
  ctx.beginPath()
  ctx.arc(px, py, pulse - 1.2, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Detailed atlas: the whole world at ATLAS_SCALE pixels per tile, with the
 * world origin at (ox, oy). Terrain is a single blit; settlements, warband
 * commanders, the companions and the lord are drawn on top with their name
 * plates and troop badges, so the atlas reads as the zoomed-in version of the
 * minimap.
 */
export function drawAtlas(ctx, world, { ox, oy, w, h, troops, companions = [] }) {
  ctx.clearRect(0, 0, w, h)
  blitTerrain(ctx, world, ox, oy, WORLD_W * ATLAS_SCALE, WORLD_H * ATLAS_SCALE)

  // Settlements: the same castle and hut sprites the big map uses, with the
  // same name plate and an ownership ring in the holder's colour, so a place
  // looks the same on both maps and its owner is readable at a glance.
  for (const st of world.settlements) {
    const cx = ox + (st.x + 0.5) * ATLAS_SCALE
    const cy = oy + (st.y + 0.5) * ATLAS_SCALE
    if (cx < -80 || cy < -80 || cx > w + 80 || cy > h + 80) continue
    const town = st.kind === 'town'
    const size = town ? ATLAS_SCALE * 2 : ATLAS_SCALE * 1.5
    const owner = ownerOf(st)

    // Ownership ring in the colour of the holder, the same signal the big map
    // uses: a circle around the castle or hut says whose flag flies there.
    // An unclaimed place stays colourless.
    if (st.owner && st.owner !== 'neutral') {
      ctx.strokeStyle = owner.color
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(cx, cy, size / 2 + 3, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 4
    drawSprite(ctx, town ? 'town' : 'village', cx, cy, size)
    ctx.restore()

    ctx.font = 'bold 12px "PingFang SC", sans-serif'
    const plate = ctx.measureText(st.name).width + 12
    const plateY = cy + size / 2 + 2
    ctx.fillStyle = 'rgba(10, 14, 10, 0.72)'
    ctx.beginPath()
    ctx.roundRect(cx - plate / 2, plateY, plate, 17, 8)
    ctx.fill()
    ctx.fillStyle = owner.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(st.name, cx, plateY + 9)
  }

  // Warband commanders, each with the troop badge in its top-right corner.
  for (const p of world.parties) {
    const cx = ox + (p.x + 0.5) * ATLAS_SCALE
    const cy = oy + (p.y + 0.5) * ATLAS_SCALE
    if (cx < -80 || cy < -80 || cx > w + 80 || cy > h + 80) continue
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 6
    drawSprite(ctx, p.faction, cx, cy, ATLAS_SCALE * 1.4)
    ctx.restore()
    drawBadge(ctx, cx + ATLAS_SCALE * 0.55, cy - ATLAS_SCALE * 0.55, partyTroops(p))
  }

  // The companions first, in the same slots the big map uses, so the party is
  // one block on both maps; the lord is drawn over them afterwards.
  if (companions.length) {
    const slots = followerTargets(companions, world.playerPos, { x: 0, y: 1 })
    for (const slot of slots) {
      const cx = ox + (slot.x + 0.5) * ATLAS_SCALE
      const cy = oy + (slot.y + 0.5) * ATLAS_SCALE
      if (cx < -40 || cy < -40 || cx > w + 40 || cy > h + 40) continue
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 5
      drawSprite(ctx, slot.companion.sprite, cx, cy, ATLAS_SCALE * 1.1)
      ctx.restore()
      // The same troop badge the lord and the warbands wear, one size smaller:
      // a companion's banner is worth reading at a glance here too, and the
      // atlas footer already promises a number on every icon.
      const soldiers = companionStrength(slot.companion)
      if (soldiers > 0) drawBadge(ctx, cx + ATLAS_SCALE * 0.55, cy - ATLAS_SCALE * 0.55, soldiers, 7)
    }
  }

  // The lord, on top of everything, with his own troop badge.
  const px = ox + (world.playerPos.x + 0.5) * ATLAS_SCALE
  const py = oy + (world.playerPos.y + 0.5) * ATLAS_SCALE
  const pulse = 1 + Math.sin(performance.now() / 320) * 0.12
  ctx.beginPath()
  ctx.arc(px, py, ATLAS_SCALE * 0.78 * pulse, 0, Math.PI * 2)
  ctx.strokeStyle = world.camping ? 'rgba(255, 186, 96, 0.85)' : 'rgba(74, 163, 255, 0.75)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
  ctx.shadowBlur = 8
  drawSprite(ctx, 'lord', px, py, ATLAS_SCALE * 1.4)
  ctx.restore()
  drawBadge(ctx, px + ATLAS_SCALE * 0.55, py - ATLAS_SCALE * 0.55, troops)
}
