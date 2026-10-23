/**
 * The versions of the game and their update notes.
 *
 * Every release is one file in this folder (`v0.0.1.js`, `v0.0.2.js`, …) and
 * it holds the batches that release shipped. The batches themselves are
 * generated from `progress.md` by `tools/build-versions.mjs`, so the progress
 * file stays the one place where the shipped work is written down.
 *
 * The version follows `major.minor.patch`. The game is still in its early
 * stage, so only the **patch** number moves: every shipped batch bumps the
 * last digit (v0.0.1 → v0.0.2 → …) while the major and minor numbers stay at
 * zero.
 */
import { BATCHES } from './batches'
import release001 from './v0.0.1'
import release002 from './v0.0.2'
import release003 from './v0.0.3'
import release004 from './v0.0.4'
import release005 from './v0.0.5'
import release006 from './v0.0.6'
import release007 from './v0.0.7'

/** The version of this build. */
export const VERSION = '0.0.7'

/** Every release, newest first. */
export const VERSIONS = [release007, release006, release005, release004, release003, release002, release001]

/** The notes of the current build. */
export const CHANGELOG = VERSIONS

/** Every batch of the game, oldest first. */
export { BATCHES }

/** The version as it is shown in the interface, e.g. `v0.0.1`. */
export function versionLabel(version = VERSION) {
  return `v${version}`
}

/**
 * The next patch number of a version: `0.0.1` becomes `0.0.2`.
 *
 * Only the patch moves while the game is in its early stage, so this is the
 * only bump the release process uses.
 */
export function nextPatchVersion(version = VERSION) {
  const parts = String(version || '')
    .split('.')
    .map((p) => Number.parseInt(p, 10))
  const [major, minor, patch] = parts
  const safe = (value, fallback) => (Number.isFinite(value) ? value : fallback)
  return `${safe(major, 0)}.${safe(minor, 0)}.${safe(patch, 0) + 1}`
}

/** The notes of one version, or every release when no version is given. */
export function changelogOf(version) {
  if (!version) return VERSIONS
  return VERSIONS.filter((entry) => entry.version === version)
}
