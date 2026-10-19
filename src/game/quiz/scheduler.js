/**
 * Spaced-repetition scheduler for the question bank.
 *
 * Every question the player meets is tracked by a stable key and carries a
 * memory level from 0 (unfamiliar) to 5 (mastered). A paper is not built from
 * a flat random draw: each candidate is weighted, so a question the player
 * keeps answering correctly is offered far less often than one they keep
 * failing. That is the "memory curve" behind the exam.
 *
 *   weight(level) = max(MIN_WEIGHT, DECAY ^ level)
 *     level 0 → 1.00   1 → 0.55   2 → 0.30   3 → 0.17   4 → 0.09   5 → 0.05
 *   correct answer: level + LEVEL_UP   (capped at MAX_LEVEL)
 *   wrong answer:   level − LEVEL_DOWN (floored at 0, so a slipped question
 *                   becomes up to ~4x as likely to come back)
 *   forgetting:     after FORGET_HOURS without a review the level decays by
 *                   one step, which is the Ebbinghaus curve applied across
 *                   sessions instead of only across a single paper.
 */

export const MEMORY = {
  MAX_LEVEL: 5,
  LEVEL_UP: 1,
  LEVEL_DOWN: 2,
  DECAY: 0.55,
  MIN_WEIGHT: 0.05,
  FORGET_HOURS: 20,
  FORGET_MAX_STEPS: 2
}

// A fresh, never-seen question: level 0, no answers recorded.
export function blankProgress() {
  return { level: 0, right: 0, wrong: 0, lastSeen: 0 }
}

export function normalizeProgress(prev) {
  return { ...blankProgress(), ...(prev || {}) }
}

export function levelFor(progress) {
  return normalizeProgress(progress).level
}

// Fold one answer into a progress record and return the new record.
export function updateProgress(prev, correct, now = Date.now()) {
  const p = normalizeProgress(prev)
  if (correct) {
    p.right += 1
    p.level = Math.min(MEMORY.MAX_LEVEL, p.level + MEMORY.LEVEL_UP)
  } else {
    p.wrong += 1
    p.level = Math.max(0, p.level - MEMORY.LEVEL_DOWN)
  }
  p.lastSeen = now
  return p
}

// Selection weight for one progress record; never zero, so mastered questions
// still resurface occasionally for revision.
export function weightFor(progress) {
  const level = levelFor(progress)
  return Math.max(MEMORY.MIN_WEIGHT, Math.pow(MEMORY.DECAY, level))
}

// Apply the forgetting curve to one record. Each full FORGET_HOURS of silence
// costs one level (capped by FORGET_MAX_STEPS per pass), and the clock is
// advanced so the same gap is never charged twice.
export function forgetLevels(progress, now = Date.now()) {
  const p = normalizeProgress(progress)
  const span = MEMORY.FORGET_HOURS * 3600 * 1000
  if (!p.lastSeen || now - p.lastSeen < span) return p
  const steps = Math.min(MEMORY.FORGET_MAX_STEPS, Math.floor((now - p.lastSeen) / span))
  p.level = Math.max(0, p.level - steps)
  p.lastSeen += steps * span
  return p
}

// Run the forgetting pass over a whole progress map, in place, and return it.
export function applyForgetting(store, now = Date.now()) {
  for (const key of Object.keys(store || {})) {
    store[key] = forgetLevels(store[key], now)
  }
  return store
}

// Weighted random index over `entries`, where `weightOf(entry)` may return 0.
// Falls back to a uniform pick when every weight is zero.
export function pickWeighted(entries, weightOf, rng) {
  if (!entries.length) return -1
  let total = 0
  for (const e of entries) total += Math.max(0, weightOf(e) || 0)
  if (total <= 0) return rng.int(0, entries.length - 1)
  let r = rng.next() * total
  for (let i = 0; i < entries.length; i++) {
    r -= Math.max(0, weightOf(entries[i]) || 0)
    if (r <= 0) return i
  }
  return entries.length - 1
}
