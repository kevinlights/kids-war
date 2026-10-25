/**
 * Scene data for the browser checks.
 *
 * The town layout is a pure function of the settlement, so a test can rebuild
 * exactly the same scene in node and then click the right pixel in the browser.
 */
import { generateWorld } from '@/game/worldgen'
import { buildScene } from '@/game/town'

export function sceneInfo(seed, kind = 'town', index = 0) {
  const world = generateWorld(seed)
  const list = world.settlements.filter((s) => s.kind === kind)
  const settlement = list[Math.min(index, list.length - 1)]
  if (!settlement) return null
  const scene = buildScene(settlement)
  return {
    id: settlement.id,
    name: settlement.name,
    owner: settlement.owner,
    w: scene.w,
    h: scene.h,
    spawn: scene.spawn,
    buildings: scene.buildings.map((b) => ({
      key: b.key,
      name: b.name,
      panel: b.panel,
      x: b.x,
      y: b.y,
      w: b.w,
      h: b.h,
      door: b.door
    })),
    npcs: scene.npcs.map((n) => ({
      id: n.id,
      name: n.name,
      role: n.role,
      follower: n.follower,
      x: n.x,
      y: n.y
    }))
  }
}
