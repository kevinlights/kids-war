/**
 * Builds the saves the browser checks need: the lord standing next to a bandit
 * village, next to a hostile town, or inside a town he already owns.
 */
import { generateWorld, gridToIds } from '@/game/worldgen'
import { makeGarrison, normalizeSettlement } from '@/game/settlement'

function landNeighbour(world, spot) {
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ]) {
    const x = spot.x + dx
    const y = spot.y + dy
    if (world.grid[y] && world.grid[y][x] && world.grid[y][x] !== 'water') return { x, y }
  }
  return { x: spot.x, y: spot.y }
}

/**
 * @param {'bandit'|'siege'|'town'} scenario
 */
export function buildScenarioSave(scenario, { seed = 20261019, username = 'tester' } = {}) {
  const world = generateWorld(seed)
  const settlements = world.settlements.map((s) => normalizeSettlement({ ...s }))

  let target = null
  if (scenario === 'bandit') {
    target = settlements.find((s) => s.owner === 'bandit')
    if (!target) target = settlements.find((s) => s.kind === 'village')
  } else if (scenario === 'siege') {
    target = settlements.find((s) => s.kind === 'town' && (s.owner === 'wolf' || s.owner === 'eagle'))
  } else if (scenario === 'claim') {
    target = settlements.find((s) => s.kind === 'town' && s.owner === 'neutral')
  } else {
    target = settlements.find((s) => s.kind === 'town')
    target.owner = 'player'
    target.level = 2
    target.prosperity = 45
    target.development = 50
    target.funds = 500
    target.facilities = { hospital: 0, barracks: 0 }
    target.garrison = []
  }
  if (!target) throw new Error(`no settlement for the ${scenario} scenario`)

  const playerPos = landNeighbour(world, target)

  return {
    settlement: target,
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

export { makeGarrison }
