/**
 * Headless runner for the whole-world painter checks (minimap + detailed
 * atlas ownership colours).
 */
import { build } from 'esbuild'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const outdir = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const outfile = path.join(outdir, 'atlas.mjs')
await mkdir(outdir, { recursive: true })
await build({
  entryPoints: [path.join(root, 'tools', 'verify-atlas.entry.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile,
  alias: { '@': path.join(root, 'src') },
  logLevel: 'warning'
})
const { createReporter } = await import(path.join(root, 'tools', 'reporter.mjs'))
globalThis.__reporter = createReporter('the minimap and the atlas ownership colours')
await import(pathToFileURL(outfile).href)
globalThis.__reporter.finish()
