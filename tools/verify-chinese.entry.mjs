/**
 * Headless checks for the Chinese question bank: the reading passages, the
 * ancient-poem bank and every generator built on top of them.
 *
 * The checks walk a lot of samples, because a broken bank shows up as a
 * malformed question rather than as a crash.
 */
import { createRng } from '@/game/rng'
import { CHINESE_TYPES, generateChinese } from '@/game/quiz/chinese'
import { collectEntries, typeDef } from '@/game/quiz/registry'
import { registerBuiltins } from '@/game/quiz/mods'

const reporter = globalThis.__reporter
const check = (name, ok, detail = '') => reporter.check(name, ok, detail)

/* ------------------------------- the bank ---------------------------------- */

const grade3 = CHINESE_TYPES[3]
const grade4 = CHINESE_TYPES[4]
check('grade 3 has generators', grade3.length >= 10, `${grade3.length}`)
check('grade 4 has generators', grade4.length >= 10, `${grade4.length}`)

const kinds = new Set([...grade3, ...grade4].map((fn) => fn.name))
for (const wanted of [
  'antonym',
  'synonym',
  'measure',
  'idiom',
  'reading',
  'rhetoric',
  'poem',
  'poemAuthor',
  'poemTitle',
  'poemPrev',
  'poemMeaning',
  'poemFill',
  'comprehension',
  'stroke',
  'radical'
]) {
  check(`the ${wanted} generator exists`, kinds.has(wanted))
}

// The generator names are the memory-curve keys: unique inside one grade, and
// the same kind shares one curve across the two grades.
for (const [grade, list] of [[3, grade3], [4, grade4]]) {
  const names = list.map((fn) => fn.name)
  check(`the grade ${grade} generator names are unique`, new Set(names).size === names.length, `${names.length} names`)
}
const shared = grade3.map((fn) => fn.name).filter((n) => grade4.some((fn) => fn.name === n))
check('the grades share the question kinds', shared.length >= 8, `${shared.length} shared`)

/* --------------------------- sampling the bank ----------------------------- */

const rng = createRng(20261020)
const seenPrompts = new Set()
let duplicate = 0
let bad = 0
let withExplain = 0
const perKind = new Map()
const distinctPerKind = new Map()

for (const grade of [3, 4]) {
  for (const fn of CHINESE_TYPES[grade]) {
    const distinct = new Set()
    for (let i = 0; i < 40; i += 1) {
      const q = generateChinese(rng, grade, fn.name)
      const key = `${grade}:${fn.name}`
      perKind.set(key, (perKind.get(key) || 0) + 1)
      if (!q || !q.prompt || !Array.isArray(q.options) || q.options.length < 2) {
        bad += 1
        continue
      }
      if (q.options.length > 4) bad += 1
      if (new Set(q.options).size !== q.options.length) bad += 1
      if (q.answer < 0 || q.answer >= q.options.length) bad += 1
      if (!q.options[q.answer]) bad += 1
      if (q.kind !== fn.name) bad += 1
      if (q.grade !== grade) bad += 1
      if (q.explain) withExplain += 1
      distinct.add(q.prompt)
      if (seenPrompts.has(q.prompt)) duplicate += 1
      else seenPrompts.add(q.prompt)
    }
    distinctPerKind.set(fn.name, Math.max(distinctPerKind.get(fn.name) || 0, distinct.size))
  }
}
check('every generated question is well formed', bad === 0, `${bad} broken questions`)
check('the poem questions carry an explanation', withExplain > 100, `${withExplain}`)
// Every generator needs a bank worth drawing from, otherwise a paper would
// repeat itself.
const thin = [...distinctPerKind.entries()].filter(([, n]) => n < 4)
check('every generator has a bank of at least four items', thin.length === 0, JSON.stringify(thin))

/* ------------------------ the reading passages ------------------------------ */

// A reading question has to carry its passage, so the prompt is long.
const comprehensionPrompts = []
for (let i = 0; i < 60; i += 1) {
  const q = generateChinese(rng, 4, 'comprehension')
  comprehensionPrompts.push(q.prompt)
}
const withPassage = comprehensionPrompts.filter((p) => p.includes('阅读短文') && p.includes('\n')).length
check('the reading questions carry their passage', withPassage === comprehensionPrompts.length, `${withPassage}/${comprehensionPrompts.length}`)
const passageLengths = comprehensionPrompts.map((p) => p.length)
const shortest = Math.min(...passageLengths)
const longest = Math.max(...passageLengths)
check('the passages are long enough to read', shortest > 60, `${shortest} characters`)
check('the passages stay phone friendly', longest < 400, `${longest} characters`)

/* --------------------------- the exam integration --------------------------- */

registerBuiltins()
const chinese = typeDef('chinese')
check('the Chinese subject registers', !!chinese, 'the built-in pack is missing')
check('the Chinese subject has generators', chinese && chinese.kinds(3).length === grade3.length, chinese && `${chinese.kinds(3).length}`)

const entries = collectEntries(3, ['chinese'])
check('grade 3 collects the Chinese entries', entries.length === grade3.length, `${entries.length} vs ${grade3.length}`)
const entryKeys = new Set(entries.map((e) => e.item))
check('every entry has its own memory key', entryKeys.size === entries.length, `${entryKeys.size} of ${entries.length}`)

const made = entries.map((e) => e.make(createRng(7)))
check('the collected entries make questions', made.every((q) => q.prompt && q.options.length >= 2))
check('the collected entries keep their kind', made.every((q) => q.kind && q.item))

console.log(`\n${perKind.size} generator/grade combinations sampled`)
