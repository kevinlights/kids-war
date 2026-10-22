/**
 * Builds the save the exam-spine browser check needs: the lord standing next
 * to a town he owns, with a memory curve that has mastered questions, shaky
 * questions and questions that are due for a revision.
 */
import { generateWorld, gridToIds } from '@/game/worldgen'
import { normalizeSettlement } from '@/game/settlement'
import { collectEntries } from '@/game/quiz'

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

const DAY = 24 * 3600 * 1000

export function buildQuizSave({ seed = 20261021, username = 'tester' } = {}) {
  const world = generateWorld(seed)
  const settlements = world.settlements.map((s) => normalizeSettlement({ ...s }))

  // A town the lord owns: he may take an exam there.
  const target = settlements.find((s) => s.kind === 'town')
  target.owner = 'player'
  target.level = 2
  target.prosperity = 45
  target.development = 50
  target.funds = 500
  target.facilities = { hospital: 0, barracks: 0 }
  target.garrison = []

  const playerPos = landNeighbour(world, target)

  // Real question keys, so the mistake book and the review queue have
  // something to point at.
  const entries = collectEntries(3, null)
  const keys = []
  for (const entry of entries) {
    if (!keys.includes(entry.item)) keys.push(entry.item)
    if (keys.length === 6) break
  }

  const now = Date.now()
  const questionStats = {
    // Mastered: never due, never a mistake.
    [keys[0]]: { level: 5, right: 6, wrong: 0, lastSeen: now, grade: 3 },
    // Shaky and recently seen: a mistake worth repeating.
    [keys[1]]: { level: 1, right: 1, wrong: 3, lastSeen: now, grade: 3 },
    [keys[2]]: { level: 0, right: 0, wrong: 2, lastSeen: now, grade: 3 },
    // Seen long ago and still shaky: due for a revision and a mistake.
    [keys[3]]: { level: 1, right: 2, wrong: 1, lastSeen: now - 40 * DAY, grade: 3 },
    [keys[4]]: { level: 1, right: 1, wrong: 1, lastSeen: now - 30 * DAY, grade: 4 }
  }

  return {
    settlement: target,
    keys,
    payload: {
      version: 1,
      username,
      savedAt: now,
      seed: world.seed,
      gridIds: gridToIds(world.grid),
      settlements,
      parties: world.parties.map((p) => ({ ...p })),
      playerPos,
      day: 1,
      gold: 500,
      troops: [{ type: 'militia', tier: 1, count: 8 }],
      supplies: { food: 5, horse: 0, ticket: 1, order: 1 },
      stats: { days: 1, battles: 0, wins: 0, exams: 0, correct: 320 },
      questionStats,
      difficulty: 'easy',
      experience: 260,
      attributes: { leadership: 1, surgery: 0, engineering: 0, tactics: 0 }
    }
  }
}
