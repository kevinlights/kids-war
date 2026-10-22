/**
 * Visual-only motion helpers for the battle field.
 *
 * The simulation already moves every soldier smoothly and records wounds in
 * `hp`, `hitFlash` and `swing`. These functions turn those numbers into the
 * little movements the eye expects: a walk with a hop, breathing while the
 * soldier waits, a shove when a blow lands and a fall when the soldier dies.
 * Nothing here changes the fight; the renderer is free to drop any of it.
 */

/** Speed, in field pixels per second, where a soldier counts as walking. */
export const WALK_SPEED = 10

/** How long the fall of a dead soldier is drawn, in seconds. */
export const DEATH_TIME = 0.9

/** How long the lunge after a strike lasts, in seconds. */
export const SWING_TIME = 0.16

/** How long a hit flash lasts, in seconds. */
export const HIT_FLASH_TIME = 0.18

/** The walk cycle: a small hop that grows with the speed of the march. */
export function hopOf(speed, phase) {
  const k = Math.max(0, Math.min(1, (speed - WALK_SPEED) / 70))
  if (k <= 0) return 0
  return Math.abs(Math.sin(phase)) * (1.5 + k * 3.5)
}

/** Standing soldiers breathe; walking ones let the hop do the talking. */
export function breathOf(speed, phase) {
  const k = Math.max(0, Math.min(1, 1 - speed / WALK_SPEED))
  return Math.sin(phase * 0.9) * 0.6 * k
}

/** A slight forward-back lean while walking. */
export function walkTilt(speed, phase) {
  const k = Math.max(0, Math.min(1, (speed - WALK_SPEED) / 70))
  if (k <= 0) return 0
  return Math.sin(phase * 0.5) * 0.035 * k
}

/** A wounded soldier lists to one side, and the closer to death the more. */
export function woundedTilt(hpPct, time, phase) {
  const hurt = Math.max(0, Math.min(1, 1 - hpPct / 0.34))
  if (hurt <= 0) return 0
  return Math.sin(time * 7 + phase) * 0.1 * hurt
}

/** The shove of a fresh hit: a fast side-to-side shake that fades out. */
export function hurtShake(flash, time, phase) {
  const k = Math.max(0, Math.min(1, flash / HIT_FLASH_TIME))
  if (k <= 0) return 0
  return Math.sin(time * 70 + phase) * 3 * k
}

/** The lean into a blow: it peaks halfway through the swing and returns. */
export function swingLunge(swing) {
  if (!(swing > 0)) return 0
  const k = Math.max(0, Math.min(1, 1 - swing / SWING_TIME))
  return Math.sin(k * Math.PI) * 3.2
}

/** Dust kicked up by a walking soldier, as an opacity between 0 and 1. */
export function dustOf(speed, phase) {
  const k = Math.max(0, Math.min(1, (speed - WALK_SPEED) / 70))
  if (k <= 0) return 0
  return Math.max(0, Math.sin(phase * 2)) * (0.12 + k * 0.22)
}

/**
 * The pose of a falling soldier.
 *
 * `progress` runs from 0 at the moment of death to 1 when the body is gone.
 * It falls to its side, drops a little and fades out, so a lost soldier is
 * readable for a moment instead of blinking away.
 */
export function deathPose(elapsed, duration = DEATH_TIME) {
  const progress = Math.max(0, Math.min(1, elapsed / duration))
  return {
    progress,
    alpha: 1 - progress * 0.85,
    rotation: progress * 1.35,
    drop: progress * 9,
    scale: 1 - progress * 0.1
  }
}
