/**
 * Build the update notes of the game out of `progress.md`.
 *
 * The progress file is the single place where the shipped work is written
 * down: its 「已完成功能 · Completed Features」 section lists every batch of
 * the game, and this script turns that section into the data the home screen
 * shows in the update dialog.
 *
 * Usage: node tools/build-versions.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const source = path.join(root, 'progress.md')
const target = path.join(root, 'src', 'game', 'versions', 'batches.js')

const text = readFileSync(source, 'utf8')
const lines = text.split('\n')

// The section that holds the shipped work.
const sectionStart = lines.findIndex((l) => /^## 2\.\s*已完成功能/.test(l))
if (sectionStart < 0) {
  console.error('progress.md has no 「## 2. 已完成功能」 section')
  process.exit(1)
}
const sectionEnd = lines.findIndex((l, i) => i > sectionStart && /^## \d/.test(l))
const section = lines.slice(sectionStart + 1, sectionEnd < 0 ? lines.length : sectionEnd)

/**
 * The batches of the section, in the order they were shipped.
 *
 * Only the player-facing bullets are kept: a bullet that starts with `▶` is a
 * change a player can see or feel, and a bullet that starts with `🔧` is an
 * internal note that stays in the progress file. A batch without a single
 * player-facing bullet (a batch of pure documentation, say) is left out.
 */
const batches = []
let current = null
for (const raw of section) {
  const line = raw.replace(/\s+$/, '')

  // A batch heading: `### 批次 16 · Batch 16 — 版本号与练兵 Version display and the training drill (2026-10-21)`
  const heading = /^###\s*批次\s*(\d+)\s*·\s*Batch\s*\d+\s*—\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\)\s*$/.exec(line)
  if (heading) {
    current = { batch: Number(heading[1]), title: heading[2], date: heading[3], items: [] }
    batches.push(current)
    continue
  }

  if (!current) continue

  // A bullet of the batch: the Chinese line, then its English line.
  const bullet = /^-\s*(?:▶|🔧)?\s*(.*)$/.exec(line)
  if (bullet) {
    // The technical notes are not part of the update notes.
    if (/^-\s*🔧/.test(line)) continue
    current.items.push({ zh: bullet[1], en: '' })
    continue
  }
  // The English line of the bullet above it.
  const english = /^\s{2,}(\S.*)$/.exec(line)
  if (english && current.items.length && !current.items[current.items.length - 1].en) {
    current.items[current.items.length - 1].en = english[1]
  }
}

// A batch without anything the player can see is not part of the notes.
const shipped = batches.filter((b) => b.items.length > 0)

if (!shipped.length) {
  console.error('no batch found in the completed-features section')
  process.exit(1)
}

const body = shipped
  .map((b) => {
    const items = b.items
      .map((item) => `    { zh: ${JSON.stringify(item.zh)}, en: ${JSON.stringify(item.en)} }`)
      .join(',\n')
    return [
      '  {',
      `    batch: ${b.batch},`,
      `    title: ${JSON.stringify(b.title)},`,
      `    date: ${JSON.stringify(b.date)},`,
      '    items: [',
      items,
      '    ]',
      '  }'
    ].join('\n')
  })
  .join(',\n')

const file = `/**
 * The shipped work of the game, extracted from \`progress.md\`.
 *
 * This file is **generated**: run \`node tools/build-versions.mjs\` after the
 * 「已完成功能 · Completed Features」 section of \`progress.md\` changes, and
 * the update dialog of the home screen shows the new work.
 *
 * 本文件由脚本生成：改完 \`progress.md\` 的「已完成功能」一节后，运行
 * \`node tools/build-versions.mjs\` 重新生成，首页的更新对话框就会显示新内容。
 */

/** Every batch of the game, oldest first. */
export const BATCHES = [
${body}
]

/** The newest batch of the game. */
export const LATEST_BATCH = BATCHES[BATCHES.length - 1]
`

mkdirSync(path.dirname(target), { recursive: true })
writeFileSync(target, file)
console.log(`wrote ${path.relative(root, target)} with ${shipped.length} batches`)
for (const b of shipped) console.log(`  batch ${b.batch} · ${b.title} (${b.items.length} items)`)
