/**
 * Paper settlement: what one exam is really worth.
 *
 * `rewardFor()` in `./index` prices a single correct answer. This module
 * settles a whole paper on top of that base price, so the reward follows how
 * the paper was answered instead of being a flat number per question:
 *
 *   base        the sum of the per-question rewards
 *   streak      consecutive correct answers multiply the base (×1.0 … ×1.5)
 *   perfect     a paper without a single mistake pays ×1.5
 *   long paper  a paper of twelve questions pays ×1.1
 *   passed      a paper that reaches the pass line pays ×1.2
 *   cap         the practice level caps a paper at twice its base price
 *
 * A wrong answer never costs anything: it simply pays nothing and breaks the
 * streak. Losing gold would punish a child for trying.
 *
 * The settlement also rolls the gear a paper drops, which is the other half of
 * the promise that answering questions earns gear and not only money:
 *
 *   every correct answer   a 30% chance of one ration of food
 *   five in a row           two rations of food, guaranteed
 *   a subject perfected     the subject's own gift (see SUBJECT_DROPS)
 *   a perfect paper         one horse
 *
 * The random source is injected, so the headless checks can pin it.
 */
import { rewardFor } from './index'
import { difficultyOf, paperCapOf } from '../difficulty'

/** Every number the settlement runs on. */
export const REWARD_RULES = {
  // One extra step of the streak adds this share; the streak is capped.
  STREAK_STEP: 0.1,
  STREAK_MAX_STEPS: 5,
  // A paper without a mistake pays this share more.
  PERFECT_BONUS: 0.5,
  // A long paper pays this share more.
  LONG_PAPER_BONUS: 0.1,
  LONG_PAPER_SIZE: 12,
  // A paper that reaches the pass line pays this share more.
  PASS_BONUS: 0.2,
  // The chance that one correct answer drops a ration of food.
  DROP_CHANCE: 0.3,
  // Every this many correct answers in a row the food is guaranteed.
  DROP_STREAK: 5
}

/**
 * The gift of a subject that was answered without a single mistake. An
 * unknown subject falls back to a ration of food.
 */
export const SUBJECT_DROPS = {
  math: { key: 'food', name: '军粮', icon: '🌾', count: 2 },
  english: { key: 'food', name: '军粮', icon: '🌾', count: 1 },
  chinese: { key: 'ticket', name: '集市券', icon: '🎟️', count: 1 },
  encyclopedia: { key: 'ticket', name: '集市券', icon: '🎟️', count: 1 },
  logic: { key: 'order', name: '征兵令', icon: '📜', count: 1 }
}

/** The gift an unknown subject gets. */
export const DEFAULT_DROP = { key: 'food', name: '军粮', icon: '🌾', count: 1 }

/** The number of correct answers a paper needs to pass. */
export function passLineOf(count) {
  return Math.ceil(Math.max(0, count) / 2)
}

/**
 * The longest run of correct answers in the paper.
 *
 * `answers` is a list of `{ question, correct }` in the order they were
 * answered.
 */
export function longestStreak(answers) {
  let best = 0
  let run = 0
  for (const a of answers || []) {
    if (a.correct) {
      run += 1
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

/** The streak multiplier of a streak of `streak` correct answers. */
export function streakMultiplier(streak) {
  const steps = Math.min(Math.max(streak - 1, 0), REWARD_RULES.STREAK_MAX_STEPS)
  return 1 + steps * REWARD_RULES.STREAK_STEP
}

/**
 * The gear a paper drops.
 *
 * `answers` holds `{ question, correct }` pairs; the subject of a question
 * comes from its `type`. The drops are merged, so two gifts of the same kind
 * arrive as one line with a bigger count.
 */
export function rollDrops({ answers = [], perfect = false, rng = Math.random } = {}) {
  const drops = new Map()

  const add = (key, name, icon, count) => {
    const found = drops.get(key)
    if (found) found.count += count
    else drops.set(key, { key, name, icon, count })
  }

  // One subject counter per subject in the paper.
  const subjects = new Map()
  let run = 0

  for (const answer of answers) {
    const type = answer.question?.type || 'unknown'
    const record = subjects.get(type) || { total: 0, correct: 0 }
    record.total += 1
    if (answer.correct) record.correct += 1
    subjects.set(type, record)

    if (!answer.correct) {
      run = 0
      continue
    }
    run += 1
    if (run % REWARD_RULES.DROP_STREAK === 0) add('food', '军粮', '🌾', 2)
    else if (rng() < REWARD_RULES.DROP_CHANCE) add('food', '军粮', '🌾', 1)
  }

  // A subject that was answered without a single mistake gives its gift.
  for (const [type, record] of subjects) {
    if (!record.total || record.correct !== record.total) continue
    const drop = SUBJECT_DROPS[type] || DEFAULT_DROP
    add(drop.key, drop.name, drop.icon, drop.count)
  }

  // A paper without a single mistake also brings a horse.
  if (perfect) add('horse', '战马', '🐎', 1)

  return [...drops.values()]
}

/**
 * Settle one paper.
 *
 * Returns the whole breakdown, so the result screen can show where the gold
 * came from instead of a single number.
 *
 *   base      the sum of the per-question rewards
 *   gold      the base with the streak, perfect, long paper and pass bonuses,
 *             capped on the practice level
 *   net       what the lord actually receives (the gold, never less than zero)
 *   beforeCap the gold before the practice cap was applied
 *   paperCap  the cap in multiples of the base price (0 = no cap)
 *   capped    true when the practice cap cut the gold down
 *   difficulty the difficulty key the paper was settled on
 *   streak    the longest run of correct answers
 *   perfect   true when nothing was answered wrongly
 *   passed    true when the paper reached the pass line
 *   drops     the gear the paper dropped
 */
export function settlePaper({ answers = [], difficulty = 'easy', rng = Math.random } = {}) {
  const correct = answers.filter((a) => a.correct).length
  const wrong = answers.length - correct
  const base = answers.reduce((n, a) => n + (a.correct ? rewardFor(a.question, difficulty) : 0), 0)

  const streak = longestStreak(answers)
  const streakMul = streakMultiplier(streak)
  const perfect = answers.length > 0 && wrong === 0
  const passed = correct >= passLineOf(answers.length)

  let gold = base * streakMul
  if (perfect) gold *= 1 + REWARD_RULES.PERFECT_BONUS
  if (answers.length >= REWARD_RULES.LONG_PAPER_SIZE) gold *= 1 + REWARD_RULES.LONG_PAPER_BONUS
  if (passed) gold *= 1 + REWARD_RULES.PASS_BONUS
  const beforeCap = Math.round(gold)

  // The practice level can only ever pay twice the price of its questions, so
  // a paper cannot be farmed into a big army.
  const cap = paperCapOf(difficulty)
  const goldAfterCap = cap > 0 && base > 0 ? Math.min(beforeCap, Math.round(base * cap)) : beforeCap

  return {
    base,
    gold: goldAfterCap,
    net: Math.max(0, goldAfterCap),
    beforeCap,
    paperCap: cap,
    capped: goldAfterCap < beforeCap,
    difficulty: difficultyOf(difficulty).key,
    streak,
    streakMul,
    perfect,
    passed,
    passLine: passLineOf(answers.length),
    correct,
    wrong,
    drops: rollDrops({ answers, perfect, rng })
  }
}
