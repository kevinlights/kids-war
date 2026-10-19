/**
 * Question bank registry.
 *
 * A "mod" is a self-contained pack that adds a subject to the exam. Built-in
 * subjects and third-party mods use the exact same contract, so extending the
 * bank never requires touching the exam UI.
 *
 * Mod shape
 *   key        unique id, /^[a-z0-9-]+$/i — also the question `type`
 *   name       Chinese label shown in the UI
 *   en         English label
 *   icon       a single emoji
 *   grades     which exam grades the subject serves, e.g. [3, 4]
 *   items      declarative questions (JSON field alias: `questions`)
 *   kinds      optional `(grade) => [{ kind, make(rng, grade) }]` procedural
 *              templates, for questions generated from numbers or lists
 *
 * What you write:
 *   { key: 'safety', name: '安全常识', icon: '🚦', grades: [3, 4],
 *     questions: [ { id: 'fire-119', grade: 3, prompt: '…', options: ['…'], answer: 0 } ] }
 *
 * Every question handed to the exam carries a stable `item` key:
 *   declarative → `${mod.key}:${item.id}`   (scheduled one by one)
 *   procedural  → `${mod.key}#${kind}`      (scheduled per template)
 */
import { choice } from './shared'

const KEY_RE = /^[a-z0-9-]+$/i
const mods = new Map()

function toText(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value)
}

// Validate and normalise one declarative question. Returns null when broken.
function normalizeItem(raw, fallbackGrade) {
  if (!raw || typeof raw !== 'object') return null
  const id = toText(raw.id).trim()
  const prompt = toText(raw.prompt).trim()
  const options = Array.isArray(raw.options) ? raw.options.map((o) => toText(o)) : []
  const answer = Number(raw.answer)
  if (!id || !prompt || options.length < 2) return null
  if (options.some((o) => o === '')) return null
  if (new Set(options).size !== options.length) return null
  if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) return null
  return {
    id,
    grade: Number(raw.grade) || fallbackGrade,
    prompt,
    options,
    answer,
    explain: toText(raw.explain)
  }
}

// Turn a raw mod (built-in object or parsed JSON) into the registry shape.
export function normalizeMod(raw) {
  if (!raw || typeof raw !== 'object') return null
  const key = toText(raw.key).trim()
  if (!KEY_RE.test(key)) return null

  const grades =
    Array.isArray(raw.grades) && raw.grades.length ? raw.grades.map(Number).filter(Boolean) : [3, 4]
  const fallbackGrade = grades[0] || 3

  const list = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.questions) ? raw.questions : []
  const seen = new Set()
  const items = []
  for (const candidate of list) {
    const item = normalizeItem(candidate, fallbackGrade)
    if (!item || seen.has(item.id)) continue
    seen.add(item.id)
    items.push(item)
  }

  const kinds = typeof raw.kinds === 'function' ? raw.kinds : null
  if (!items.length && !kinds) return null

  return {
    key,
    name: toText(raw.name, key),
    en: toText(raw.en, toText(raw.name, key)),
    icon: toText(raw.icon, '❓'),
    grades,
    items,
    kinds,
    source: toText(raw.source, 'builtin')
  }
}

// Register a mod. Rejects invalid packs and duplicate keys (first one wins),
// so re-running the built-in registration is always safe.
export function registerMod(raw) {
  const mod = normalizeMod(raw)
  if (!mod) return { ok: false, reason: 'invalid' }
  if (mods.has(mod.key)) return { ok: false, reason: 'duplicate' }
  mods.set(mod.key, mod)
  return { ok: true, mod }
}

export function hasType(key) {
  return mods.has(key)
}

export function typeDef(key) {
  return mods.get(key) || null
}

export function listMods() {
  return [...mods.values()]
}

export function typeKeys() {
  return listMods().map((mod) => mod.key)
}

// UI-friendly subject descriptors, in registration order.
export function listTypes() {
  return listMods().map((mod) => {
    let generators = 0
    if (mod.kinds) {
      try {
        generators = (mod.kinds(mod.grades[0]) || []).length
      } catch {
        generators = 0
      }
    }
    return {
      key: mod.key,
      name: mod.name,
      en: mod.en,
      icon: mod.icon,
      grades: mod.grades,
      items: mod.items.length,
      generators,
      source: mod.source
    }
  })
}

export function clearMods() {
  mods.clear()
}

// Materialise one declarative question: options are reshuffled for every
// presentation so the answer position cannot be memorised.
export function materializeItem(mod, item, rng) {
  const correct = item.options[item.answer]
  const wrongs = item.options.filter((_, i) => i !== item.answer)
  return {
    type: mod.key,
    kind: item.id,
    grade: item.grade,
    item: `${mod.key}:${item.id}`,
    explain: item.explain,
    ...choice(item.prompt, correct, wrongs, rng)
  }
}

/**
 * Every question the exam can draw for `grade` out of `types`, flattened into
 * scheduler entries: `{ item, type, kind, make(rng, grade) }`. Unknown type
 * keys are dropped; an empty `types` means "every registered subject".
 */
export function collectEntries(grade, types) {
  const keys = (types && types.length ? types : typeKeys()).filter((k) => mods.has(k))
  const out = []
  for (const key of keys) {
    const mod = mods.get(key)
    for (const item of mod.items) {
      if (item.grade !== grade) continue
      out.push({
        item: `${key}:${item.id}`,
        type: key,
        kind: item.id,
        make: (rng) => materializeItem(mod, item, rng)
      })
    }
    if (mod.kinds) {
      for (const template of mod.kinds(grade) || []) {
        const itemKey = `${key}#${template.kind}`
        out.push({
          item: itemKey,
          type: key,
          kind: template.kind,
          make: (rng, g) => ({ type: key, kind: template.kind, item: itemKey, ...template.make(rng, g) })
        })
      }
    }
  }
  return out
}
