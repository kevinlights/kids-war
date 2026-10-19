/**
 * Reproduction check: run the same upgrade regression suite against the
 * pre-fix sources to prove the bug really existed.
 *
 * The working tree is never touched: a copy of `src/` is made under
 * `node_modules/.cache` and the two files of the fix are replaced there with
 * their pre-fix versions.
 *
 * Usage: node tools/verify-upgrade-head.mjs
 */
import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/** The commit right before the promotion fix landed. */
const PRE_FIX_COMMIT = process.env.KWG_PRE_FIX_COMMIT || '291eddaa81d'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const headSrc = path.join(cache, 'head-src')

await rmrf(headSrc)
await mkdir(headSrc, { recursive: true })
await cp(path.join(root, 'src'), headSrc, { recursive: true })

for (const file of ['game/units.js', 'stores/player.js']) {
  const content = execFileSync('git', ['show', `${PRE_FIX_COMMIT}:game-work/kids-war-game/src/${file}`], {
    cwd: path.resolve(root, '..', '..'),
    encoding: 'utf8'
  })
  await writeFile(path.join(headSrc, file), content)
}

const outfile = path.join(cache, 'upgrade-head.mjs')
await build({
  entryPoints: [path.join(root, 'tools', 'verify-upgrade.entry.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile,
  alias: { '@': headSrc },
  logLevel: 'warning'
})

await import(pathToFileURL(outfile).href)

async function rmrf(target) {
  await execFileSync('rm', ['-rf', target])
}
