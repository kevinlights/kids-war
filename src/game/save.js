// localStorage persistence. Each user gets an isolated save slot so several
// players can share one browser, and saves survive page reloads.
import { gridToIds, idsToGrid, WORLD_W, WORLD_H } from './worldgen'

const PREFIX = 'kids-war-game:save:'
const USERS_KEY = 'kids-war-game:users'

export function saveKey(username) {
  return PREFIX + username
}

export function listUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function rememberUser(username) {
  const users = listUsers()
  if (!users.includes(username)) {
    users.push(username)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }
}

// Serialise the whole game state (world + player) into a compact object.
export function saveGame(username, state) {
  const payload = {
    version: 1,
    username,
    savedAt: Date.now(),
    seed: state.seed,
    gridIds: gridToIds(state.grid),
    settlements: state.settlements,
    parties: state.parties,
    playerPos: { x: state.playerPos.x, y: state.playerPos.y },
    day: state.day || 1,
    gold: state.gold,
    troops: state.troops,
    supplies: state.supplies,
    stats: state.stats,
    questionStats: state.questionStats || {},
    difficulty: state.difficulty || 'easy',
    // What the child learned: the experience and the attributes it bought.
    experience: state.experience || 0,
    attributes: state.attributes || {}
  }
  localStorage.setItem(saveKey(username), JSON.stringify(payload))
  rememberUser(username)
}

export function hasSave(username) {
  return !!localStorage.getItem(saveKey(username))
}

export function loadGame(username) {
  try {
    const raw = localStorage.getItem(saveKey(username))
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data.gridIds) return null
    return {
      ...data,
      grid: idsToGrid(data.gridIds, WORLD_W, WORLD_H)
    }
  } catch {
    return null
  }
}

export function deleteGame(username) {
  localStorage.removeItem(saveKey(username))
  const users = listUsers().filter((u) => u !== username)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}
