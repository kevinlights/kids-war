/**
 * The day and night cycle of the world map.
 *
 * A day lasts 24 game seconds. The **last fifth of every day is night**: the
 * sky darkens, the world slows down and the lord covers less ground.
 *
 *   00:00 ──────────── 19:12 ────────── 24:00
 *   daylight (80%)      night (20%)
 *
 * The night is not a hard switch: the first and last quarter of it are dusk
 * and dawn, where the darkness fades in and out.
 */

/** The night starts at this share of the day — the last fifth. */
export const NIGHT_START = 0.8

/** How much slower everything moves in the deepest night. */
export const NIGHT_SPEED_FACTOR = 0.75

/** True while the night lasts. */
export function isNight(progress) {
  return progress >= NIGHT_START && progress < 1
}

/**
 * How dark the sky is, from 0 (broad daylight) to 1 (deep night).
 *
 * The night ramps up at dusk, stays dark in the middle and fades again at
 * dawn, so the change never happens in a single frame.
 */
export function darknessOf(progress) {
  if (!isNight(progress)) return 0
  // How far we are into the night, from 0 at dusk to 1 at dawn.
  const t = (progress - NIGHT_START) / (1 - NIGHT_START)
  // A quarter of the night is dusk and dawn.
  const edge = 0.25
  if (t < edge) return t / edge
  if (t > 1 - edge) return (1 - t) / edge
  return 1
}

/**
 * The movement factor of the world: 1 in broad daylight, less at night.
 *
 * The deepest night is a quarter slower, which makes the night cost the lord
 * ground without stopping him.
 */
export function speedFactorOf(progress) {
  return 1 - (1 - NIGHT_SPEED_FACTOR) * darknessOf(progress)
}
