/**
 * Built-in question packs and the external mod loader.
 *
 * Every subject — including the four original ones — is registered as a normal
 * mod, so there is exactly one extension path. The built-in packs expose the
 * procedural generators from `english/chinese/math/logic` as `kinds`; the
 * encyclopedia and any external JSON pack contribute declarative `items`.
 *
 * External mods live under `public/mods/` and are listed in
 * `public/mods/index.json`:
 *   { "mods": ["safety.json", "world-stories.json"] }
 * Each file is either one mod object or `{ "mods": [ … ] }`.
 */
import { registerMod } from './registry'
import { ENGLISH_TYPES } from './english'
import { CHINESE_TYPES } from './chinese'
import { MATH_TYPES } from './math'
import { LOGIC_TYPES } from './logic'
import { ENCYCLOPEDIA_ITEMS } from './encyclopedia'

// Wrap one generator as a scheduler template entry.
function template(kind, fn) {
  return { kind, make: (rng, grade) => fn(rng, grade) }
}

// Turn a `{ 3: [fn, …], 4: [fn, …] }` generator table into the `kinds`
// contract of the registry. `fn.name` is the stable kind used by the memory
// scheduler, so never rename a generator without a migration in mind.
function kindsFromTable(table) {
  return (grade) => (table[grade] || table[3] || []).map((fn) => template(fn.name, fn))
}

const BUILTIN_MODS = [
  {
    key: 'english',
    name: '英文',
    en: 'English',
    icon: '🔤',
    grades: [3, 4],
    kinds: () => Object.entries(ENGLISH_TYPES).map(([kind, fn]) => template(kind, fn))
  },
  {
    key: 'chinese',
    name: '语文',
    en: 'Chinese',
    icon: '📖',
    grades: [3, 4],
    kinds: kindsFromTable(CHINESE_TYPES)
  },
  {
    key: 'math',
    name: '数学',
    en: 'Math',
    icon: '➗',
    grades: [3, 4],
    kinds: kindsFromTable(MATH_TYPES)
  },
  {
    key: 'logic',
    name: '逻辑推理',
    en: 'Logic',
    icon: '🧩',
    grades: [3, 4],
    kinds: kindsFromTable(LOGIC_TYPES)
  },
  {
    key: 'encyclopedia',
    name: '百科知识',
    en: 'Encyclopedia',
    icon: '🔬',
    grades: [3, 4],
    items: ENCYCLOPEDIA_ITEMS
  }
]

// Register the built-in packs. Safe to call any number of times: the registry
// rejects duplicate keys, so a second call is a no-op.
export function registerBuiltins() {
  const results = BUILTIN_MODS.map((mod) => registerMod({ ...mod, source: 'builtin' }))
  return results
}

const MODS_BASE = 'mods/'
let loadingPromise = null

// Load and register external mods from `public/mods/`. Never throws: a missing
// or broken manifest just means "no extra mods". Returns a small report.
export async function loadMods({ base = MODS_BASE, fetchImpl } = {}) {
  registerBuiltins()
  const request = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  if (!request) return { loaded: 0, skipped: 0, files: [] }

  const report = { loaded: 0, skipped: 0, files: [] }
  let manifest
  try {
    const res = await request(`${base}index.json`)
    manifest = await res.json()
  } catch {
    return report
  }

  const files = Array.isArray(manifest) ? manifest : Array.isArray(manifest.mods) ? manifest.mods : []
  for (const file of files) {
    let packs
    try {
      const res = await request(`${base}${file}`)
      const json = await res.json()
      packs = Array.isArray(json) ? json : Array.isArray(json.mods) ? json.mods : [json]
    } catch {
      report.skipped += 1
      continue
    }
    for (const pack of packs) {
      const result = registerMod({ ...pack, source: 'mod' })
      if (result.ok) report.loaded += 1
      else report.skipped += 1
    }
    report.files.push(file)
  }
  return report
}

// Boot once and reuse the same promise; the exam awaits it so a mod that is
// still downloading cannot produce a short paper.
export function ensureModsLoaded(options) {
  if (!loadingPromise) loadingPromise = loadMods(options)
  return loadingPromise
}

// Register a mod straight from JSON text, e.g. pasted into the console:
//   kidsWarGame.loadModsFromText('{"key":"my-pack", …}')
export function loadModsFromText(text) {
  registerBuiltins()
  const json = JSON.parse(text)
  const packs = Array.isArray(json) ? json : Array.isArray(json.mods) ? json.mods : [json]
  return packs.map((pack) => registerMod({ ...pack, source: 'mod' }))
}

// Exposed on `window.kidsWarGame` by main.js for quick experiments.
export function modApi() {
  return { loadMods, ensureModsLoaded, loadModsFromText, registerMod }
}
