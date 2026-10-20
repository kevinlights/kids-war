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
import { rewardDelta } from '../difficulty'

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
 */
export function generateExam({ grade = 3, types = null, count = 5, seed = Date.now(), weightOf = null } = {}) {
  const rng = createRng(seed)
  let entries = collectEntries(grade, types)
  // A subject with no questions for this grade must not produce an empty paper.
  if (!entries.length) entries = collectEntries(grade, null)

  const weight = weightOf || (() => 1)
  const papers = []
  const seenPrompts = new Set()
  let lastItem = null
  let guard = 0
  const maxGuard = Math.max(60, count * 120)

  while (papers.length < count && guard < maxGuard && entries.length) {
    guard++
    const entry = pickEntry(entries, weight, rng, lastItem)
    if (!entry) break
    const question = entry.make(rng, grade)
    if (!question || !question.prompt || seenPrompts.has(question.prompt)) continue
    seenPrompts.add(question.prompt)
    lastItem = entry.item
    papers.push(question)
  }
  return papers
}

/**
 * Money reward for a single correct answer, scaled by grade and subject.
 *
 * The difficulty setting takes a few gold off every correct answer: the easy
 * mode pays the original numbers, the normal mode one gold less and the hard
 * mode two gold less. The reward never drops below one gold.
 */
export function rewardFor(question, difficulty = 'easy') {
  const base = question.grade === 4 ? 26 : 20
  const total = base + (REWARD_BONUS[question.type] || 0) + rewardDelta(difficulty)
  return Math.max(1, total)
}

export function typeLabel(key) {
  const def = typeDef(key)
  return def ? def.name : key
}
