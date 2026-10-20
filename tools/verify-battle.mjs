/**
 * Headless runner for the battle checks.
 *
 * The sources use the `@` alias, so the entry file is bundled with esbuild
 * into the project's own `node_modules/.cache` folder (so that `pinia` and
 * `vue` still resolve) and then executed with plain node.
 *
 * Usage: node tools/verify-battle.mjs
 */
import { build } from 'esbuild'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const outdir = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const outfile = path.join(outdir, 'battle.mjs')

await mkdir(outdir, { recursive: true })

await build({
  entryPoints: [path.join(root, 'tools', 'verify-battle.entry.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile,
  alias: { '@': path.join(root, 'src') },
  logLevel: 'warning'
})

// The check file reports through a global, so it can be bundled as-is.
const { createReporter } = await import(path.join(root, 'tools', 'reporter.mjs'))
globalThis.__kwgRoot = root
globalThis.__reporter = createReporter('difficulty, battle speed, terrain and the siege fixes')
await import(pathToFileURL(outfile).href)
globalThis.__reporter.finish()
