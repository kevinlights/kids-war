/**
 * Headless runner for the Chinese question-bank checks.
 *
 * Usage: node tools/verify-chinese.mjs
 */
import { build } from 'esbuild'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createReporter } from './reporter.mjs'

const root = path.resolve(import.meta.dirname, '..')
const outdir = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const outfile = path.join(outdir, 'chinese.mjs')

await mkdir(outdir, { recursive: true })

await build({
  entryPoints: [path.join(root, 'tools', 'verify-chinese.entry.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile,
  alias: { '@': path.join(root, 'src') },
  logLevel: 'warning'
})

globalThis.__reporter = createReporter('Chinese bank: reading passages and ancient poems')
await import(pathToFileURL(outfile).href)
globalThis.__reporter.finish()
