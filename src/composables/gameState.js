// Game lifecycle helpers shared by the home screen and the world map.
import { usePlayerStore } from '@/stores/player'
import { useWorldStore } from '@/stores/world'
import { saveGame, loadGame, hasSave } from '@/game/save'

// Start a brand new campaign: reset the player and roll a fresh world.
export function newGame(username) {
  const player = usePlayerStore()
  const world = useWorldStore()
  player.reset(username)
  world.generate(Math.floor(Math.random() * 1e9))
  persistGame()
}

// Resume an existing save slot. Returns false when there is nothing to load.
export function continueGame(username) {
  const data = loadGame(username)
  if (!data) return false
  usePlayerStore().hydrate(data)
  useWorldStore().hydrate(data)
  return true
}

// Write the current state back into the user's localStorage slot.
export function persistGame() {
  const player = usePlayerStore()
  const world = useWorldStore()
  if (!player.username) return
  player.pruneQuestionStats()
  saveGame(player.username, {
    seed: world.seed,
    grid: world.grid,
    settlements: world.settlements,
    parties: world.parties,
    playerPos: world.playerPos,
    day: world.day,
    gold: player.gold,
    troops: player.troops,
    supplies: player.supplies,
    stats: player.stats,
    questionStats: player.questionStats
  })
}

export { hasSave }
