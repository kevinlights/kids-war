/**
 * The mastery map: what the player knows, what is shaky and what is due.
 *
 * Everything here is derived from the memory curve the scheduler already
 * keeps (`questionStats`), so the map costs nothing to store and an old save
 * without a grade on its records still works — those records are simply
 * counted under an unknown grade.
 *
 * A question key is either `<subject>:<itemId>` for a declarative question or
 * `<subject>#<kind>` for a generated one, so the subject is the part in front
 * of the first separator.
 */
import { MEMORY } from './scheduler'

/** The subject a question key belongs to. */
export function subjectOfKey(key) {
  if (!key) return 'unknown'
  const colon = key.indexOf(':')
  const hash = key.indexOf('#')
  let cut = -1
  if (colon >= 0 && hash >= 0) cut = Math.min(colon, hash)
  else if (colon >= 0) cut = colon
  else cut = hash
  return cut > 0 ? key.slice(0, cut) : 'unknown'
}

/** A question counts as mastered at level four of five. */
export function isMastered(progress) {
  return (Number(progress?.level) || 0) >= MEMORY.MAX_LEVEL - 1
}

/**
 * The mastery of every subject.
 *
 * Returns `{ [subject]: { type, tracked, mastered, wrong, avgLevel, percent,
 * grades: { [grade]: { tracked, mastered, avgLevel, percent } } } }`.
 */
export function masteryBySubject(questionStats) {
  const out = {}
  for (const [key, raw] of Object.entries(questionStats || {})) {
    const progress = raw || {}
    const type = subjectOfKey(key)
    const subject =
      out[type] ||
      (out[type] = { type, tracked: 0, mastered: 0, wrong: 0, levelSum: 0, grades: {} })

    const level = Number(progress.level) || 0
    subject.tracked += 1
    subject.levelSum += level
    subject.wrong += Number(progress.wrong) || 0
    if (isMastered(progress)) subject.mastered += 1

    const grade = Number(progress.grade) || 0
    const bucket =
      subject.grades[grade] ||
      (subject.grades[grade] = { grade, tracked: 0, mastered: 0, levelSum: 0 })
    bucket.tracked += 1
    bucket.levelSum += level
    if (isMastered(progress)) bucket.mastered += 1
  }

  for (const subject of Object.values(out)) {
    subject.avgLevel = subject.tracked ? subject.levelSum / subject.tracked : 0
    subject.percent = Math.round((subject.avgLevel / MEMORY.MAX_LEVEL) * 100)
    for (const bucket of Object.values(subject.grades)) {
      bucket.avgLevel = bucket.tracked ? bucket.levelSum / bucket.tracked : 0
      bucket.percent = Math.round((bucket.avgLevel / MEMORY.MAX_LEVEL) * 100)
    }
  }
  return out
}

/**
 * The questions that are due for a revision: they were seen a while ago and
 * are not mastered yet.
 *
 * The forgetting curve works on real hours (a day in the campaign is only 24
 * seconds), so this is the honest "come back to this tomorrow" list.
 */
export function dueKeys(questionStats, now = Date.now(), hours = MEMORY.FORGET_HOURS) {
  const span = hours * 3600 * 1000
  const out = []
  for (const [key, progress] of Object.entries(questionStats || {})) {
    if (!progress) continue
    const level = Number(progress.level) || 0
    if (level >= MEMORY.MAX_LEVEL) continue
    if (!progress.lastSeen) continue
    if (now - progress.lastSeen < span) continue
    out.push({ key, level, lastSeen: progress.lastSeen })
  }
  // The shakiest questions come first.
  return out.sort((a, b) => a.level - b.level || a.lastSeen - b.lastSeen).map((r) => r.key)
}

/**
 * The mistakes worth repeating: a question that was answered wrongly and is
 * still shaky. The most recent slip comes first.
 */
export function mistakeKeys(questionStats) {
  const out = []
  for (const [key, progress] of Object.entries(questionStats || {})) {
    if (!progress) continue
    const level = Number(progress.level) || 0
    const wrong = Number(progress.wrong) || 0
    if (!wrong || level > 1) continue
    out.push({ key, level, wrong, lastSeen: progress.lastSeen || 0 })
  }
  return out.sort((a, b) => b.wrong - a.wrong || b.lastSeen - a.lastSeen).map((r) => r.key)
}

/** How many questions of a subject are due for a revision. */
export function dueCountBySubject(questionStats, now = Date.now()) {
  const out = {}
  for (const key of dueKeys(questionStats, now)) {
    const type = subjectOfKey(key)
    out[type] = (out[type] || 0) + 1
  }
  return out
}
