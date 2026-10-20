/**
 * Builds the save the Chinese browser check needs: the lord next to a town he
 * owns, so the exam of that town is one click away.
 */
import { generateWorld, gridToIds } from '@/game/worldgen'
import { normalizeSettlement } from '@/game/settlement'

export function buildScenarioSave({ seed = 20261019, username = 'tester' } = {}) {
  const world = generateWorld(seed)
  const settlements = world.settlements.map((s) => normalizeSettlement({ ...s }))
  const town = settlements.find((s) => s.kind === 'town')
  town.owner = 'player'
  town.level = 2
  town.prosperity = 45
  town.development = 50
  town.funds = 500
  town.garrison = []
  normalizeSettlement(town)

  let playerPos = { x: town.x, y: town.y }
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ]) {
    const x = town.x + dx
    const y = town.y + dy
    if (world.grid[y] && world.grid[y][x] && world.grid[y][x] !== 'water') {
      playerPos = { x, y }
      break
    }
  }

  return {
    settlement: town,
    payload: {
      version: 1,
      username,
      savedAt: Date.now(),
      seed: world.seed,
      gridIds: gridToIds(world.grid),
      settlements,
      parties: world.parties.map((p) => ({ ...p })),
      playerPos,
      day: 1,
      gold: 500,
      troops: [{ type: 'militia', tier: 1, count: 8 }],
      supplies: { food: 5, horse: 0 },
      stats: { days: 1, battles: 0, wins: 0, exams: 0, correct: 0 },
      questionStats: {}
    }
  }
}
