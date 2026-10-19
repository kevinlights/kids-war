/**
 * Builds a save payload with the lord standing next to a village, so the
 * browser check can walk straight into a settlement.
 */
import { generateWorld, gridToIds } from '@/game/worldgen'

export function buildSave(seed = 20261019, username = 'tester') {
  const world = generateWorld(seed)
  // A village the lord may actually walk into: a bandit village is closed.
  const village =
    world.settlements.find((s) => s.kind === 'village' && s.owner === 'neutral') ||
    world.settlements.find((s) => s.kind === 'village' && s.owner !== 'bandit') ||
    world.settlements.find((s) => s.kind === 'village') ||
    world.settlements[0]

  // A neighbouring land tile keeps the lord inside the "enter" radius (1.4).
  let playerPos = { x: village.x, y: village.y }
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ]) {
    const x = village.x + dx
    const y = village.y + dy
    if (world.grid[y] && world.grid[y][x] && world.grid[y][x] !== 'water') {
      playerPos = { x, y }
      break
    }
  }

  return {
    payload: {
      version: 1,
      username,
      savedAt: Date.now(),
      seed: world.seed,
      gridIds: gridToIds(world.grid),
      settlements: world.settlements,
      parties: world.parties,
      playerPos,
      day: 1,
      gold: 500,
      troops: [{ type: 'militia', tier: 1, count: 8 }],
      supplies: { food: 5, horse: 0 },
      stats: { days: 1, battles: 0, wins: 0, exams: 0, correct: 0 },
      questionStats: {}
    },
    settlement: village
  }
}
