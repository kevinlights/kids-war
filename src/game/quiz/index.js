/**
 * Public entry for the question bank.
 *
 * Subjects come from the mod registry (built-in packs plus anything under
 * `public/mods/`), and a paper is drawn with the memory-curve scheduler rather
 * than uniformly at random. The exam UI and the reward formula only ever read
 * `prompt`, `options`, `answer`, `type` and `grade`, so a new mod needs no UI
 * change.
 */
import { createRng } from '../rng'
import {
  collectEntries,
  listTypes,
  registerMod,
  typeDef,
  typeKeys
} from './registry'
import { ensureModsLoaded, loadModsFromText, modApi, registerBuiltins } from './mods'
import { MEMORY, applyForgetting, pickWeighted, updateProgress, weightFor } from './scheduler'
import { rewardDelta, flatReward, rewardMul } from '../difficulty'

// Register the built-in packs as soon as the module is imported, so even a
// headless import can generate questions without awaiting the network loader.
registerBuiltins()

export const GRADES = [
  { key: 3, name: '三年级', en: 'Grade 3' },
  { key: 4, name: '四年级', en: 'Grade 4' }
]

// Extra gold on top of the grade base, per subject.
const REWARD_BONUS = { logic: 6, encyclopedia: 4 }

export {
  collectEntries,
  listTypes,
  typeDef,
  typeKeys,
  registerMod,
  ensureModsLoaded,
  loadModsFromText,
  modApi,
  MEMORY,
  weightFor,
  updateProgress,
  applyForgetting
}

// Skip the same template twice in a row when there is a choice.
function pickEntry(entries, weightOf, rng, avoidItem) {
  if (entries.length <= 1) return entries[0]
  for (let attempt = 0; attempt < 4; attempt++) {
    const index = pickWeighted(entries, weightOf, rng)
    if (index < 0) return null
    if (entries.length > 2 && entries[index].item === avoidItem) continue
    return entries[index]
  }
  const index = pickWeighted(entries, weightOf, rng)
  return index < 0 ? null : entries[index]
}

/**
 * Build a single question of one subject. `seed` keeps it reproducible, which
 * the headless harness relies on.
 */
export function makeQuestion(type, grade, seed) {
  const rng = createRng(seed)
  const entries = collectEntries(grade, [type])
  const pool = entries.length ? entries : collectEntries(grade, null)
  if (!pool.length) return { type, grade, prompt: '', options: [], answer: 0 }
  const entry = pool[rng.int(0, pool.length - 1)]
  return { id: `${type}-${grade}-${seed}`, ...entry.make(rng, grade) }
}

/**
 * Build a full exam paper: `count` unique questions drawn from `types`.
 *
 * `weightOf(entry)` is supplied by the caller (normally the player store) and
 * returns the memory-curve weight of an entry, so mastered questions are
 * offered less and shaky ones more. Omitting it gives a uniform draw.
 *
 * `items` restricts the paper to a fixed list of question keys, which is how
 * the two revision modes work: a paper of mistakes and a paper of questions
 * that are due both name the keys they want.
 */
export function generateExam({
  grade = 3,
  types = null,
  count = 5,
  seed = Date.now(),
  weightOf = null,
  items = null
} = {}) {
  const rng = createRng(seed)
  let entries = collectEntries(grade, types)
  // A subject with no questions for this grade must not produce an empty paper.
  if (!entries.length) entries = collectEntries(grade, null)
  // A revision paper only holds the questions that were asked for, and every
  // one of them at most once: a mistake book holds one question per mistake.
  // When none of the wanted questions exist the paper is an ordinary one.
  let revision = false
  if (Array.isArray(items) && items.length) {
    const wanted = new Set(items)
    const filtered = entries.filter((entry) => wanted.has(entry.item))
    if (filtered.length) {
      entries = filtered
      revision = true
    }
  }
  const maxPapers = revision ? Math.min(count, items.length) : count

  const weight = weightOf || (() => 1)
  const papers = []
  const seenPrompts = new Set()
  const usedItems = new Set()
  let lastItem = null
  let guard = 0
  const maxGuard = Math.max(60, count * 120)

  while (papers.length < maxPapers && guard < maxGuard && entries.length) {
    guard++
    // A revision paper asks every wanted question once.
    const pool = revision ? entries.filter((entry) => !usedItems.has(entry.item)) : entries
    if (!pool.length) break
    const entry = pickEntry(pool, weight, rng, lastItem)
    if (!entry) break
    const question = entry.make(rng, grade)
    if (!question || !question.prompt) continue
    // A normal paper never asks the same question twice. A revision paper
    // asks every wanted item once, even when two items happen to look alike.
    if (!revision) {
      if (seenPrompts.has(question.prompt)) continue
      seenPrompts.add(question.prompt)
    }
    lastItem = entry.item
    usedItems.add(entry.item)
    papers.push(question)
  }
  return papers
}

/**
 * Money reward for a single correct answer, scaled by grade and subject.
 *
 * The difficulty setting decides how much gold a correct answer pays:
 *
 *   简单 Easy    a flat price of 5 gold for every question, so the campaign
 *                cannot be farmed on the easy level
 *   普通 Normal  the original numbers, one gold less
 *   困难 Hard    the normal numbers minus two gold, then cut by a fifth
 *
 * The reward never drops below one gold.
 */
export function rewardFor(question, difficulty = 'easy') {
  const flat = flatReward(difficulty)
  if (flat) return flat
  const base = question.grade === 4 ? 26 : 20
  const total = base + (REWARD_BONUS[question.type] || 0) + rewardDelta(difficulty)
  return Math.max(1, Math.round(total * rewardMul(difficulty)))
}

export function typeLabel(key) {
  const def = typeDef(key)
  return def ? def.name : key
}
