// Shared helpers for question generators: build options, shuffle, and grading.

export function shuffle(list, rng) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Build a multiple-choice question from a correct answer plus wrong ones.
// `options` are raw values; the returned question stores them as strings and
// keeps the index of the correct answer. The paper format is four options, so
// at most three distractors are kept — generators may pass more candidates.
export function choice(prompt, correct, wrongs, rng, meta = {}) {
  const uniq = []
  const seen = new Set([String(correct)])
  for (const w of wrongs) {
    if (uniq.length >= 3) break
    const s = String(w)
    if (seen.has(s)) continue
    seen.add(s)
    uniq.push(s)
  }
  const pool = shuffle([{ v: String(correct), ok: true }, ...uniq.map((v) => ({ v, ok: false }))], rng)
  return {
    prompt,
    options: pool.map((o) => o.v),
    answer: pool.findIndex((o) => o.ok),
    ...meta
  }
}

// Numeric distractors around a correct integer answer.
export function numberWrongs(correct, rng, count = 3, spread = 6) {
  const set = new Set()
  let guard = 0
  while (set.size < count && guard++ < 60) {
    const delta = rng.int(1, spread) * (rng.chance(0.5) ? 1 : -1)
    const v = correct + delta
    if (v !== correct && v >= 0) set.add(v)
  }
  while (set.size < count) set.add(correct + set.size + 1)
  return [...set]
}

/**
 * A question the child fills in: the answer is typed instead of picked.
 *
 * `input` is `number` for a number and `text` for a word. `answer` may be a
 * list of accepted answers.
 */
export function inputQuestion(prompt, answer, rng, meta = {}) {
  const accepted = Array.isArray(answer) ? answer : [answer]
  return { ...meta, prompt, input: meta.input || 'text', answer: accepted }
}

/**
 * A matching question: the child connects the two sides.
 *
 * `pairs` holds the pairs in the right order; the right-hand column is
 * shuffled for the presentation. `leftLabel` and `rightLabel` name the two
 * columns, so the child knows what is being matched.
 */
export function pairsQuestion(prompt, pairs, rng, meta = {}) {
  const list = pairs.map((pair) => [String(pair[0]), String(pair[1])])
  return {
    ...meta,
    prompt,
    pairs: list,
    rights: shuffle(list.map((pair) => pair[1]), rng)
  }
}

/**
 * An ordering question: the child puts the items in the right order.
 *
 * `items` are given in the right order and shuffled for the presentation.
 */
export function orderQuestion(prompt, items, rng, meta = {}) {
  const list = items.map((item) => String(item))
  return { ...meta, prompt, items: shuffle(list, rng), order: list }
}

/**
 * Grade a filled-in answer.
 *
 * A number is compared by value, so `3` and `3.0` are the same answer; a
 * word is compared without its spaces and its case. A question may accept
 * more than one spelling.
 */
export function gradeInput(question, value) {
  const typed = String(value ?? '').trim()
  if (!typed) return false
  const accepted = Array.isArray(question.answer) ? question.answer : [question.answer]
  if (question.input === 'number') {
    const given = Number(typed)
    if (!Number.isFinite(given)) return false
    return accepted.some((a) => Number(a) === given)
  }
  const clean = (text) => String(text).trim().replace(/\s+/g, ' ').toLowerCase()
  return accepted.some((a) => clean(a) === clean(typed))
}
