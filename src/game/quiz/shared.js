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
