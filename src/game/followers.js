/**
 * Where the companions walk.
 *
 * A companion has no position of his own on the world map: he is always a step
 * or two behind the lord, in the small party formation a riding lord would
 * keep. That keeps the map honest — one party, one position, one path — while
 * still showing everybody who rides along.
 *
 * The slots are laid out behind the direction of travel: the first two at the
 * lord's shoulders, the next pair behind them, and so on in pairs, so a party of
 * four or six reads as a column rather than a pile.
 */

/** How far behind the lord the first pair walks, in tiles. */
const FIRST_DEPTH = 0.98
/** Extra depth per row. */
const ROW_DEPTH = 0.46
/** Half the gap between the two companions of one row, in tiles. */
const FIRST_SPREAD = 0.58
/** Extra spread per row. */
const ROW_SPREAD = 0.26
/** Beyond this many rows the party walks in a wider block instead of deeper. */
const MAX_ROWS = 3

/** Normalise a direction, falling back to "walking south" when it is zero. */
function direction(facing) {
  const x = Number(facing?.x) || 0
  const y = Number(facing?.y) || 0
  const len = Math.hypot(x, y)
  if (len < 1e-4) return { x: 0, y: 1 }
  return { x: x / len, y: y / len }
}

/**
 * The tile position of every companion, given the lord's position and the way he
 * is walking.
 *
 * Returns one record per companion, in the order they were recruited, so the
 * caller can draw them without matching ids by hand.
 */
export function followerTargets(companions, player, facing) {
  const dir = direction(facing)
  // Behind is the opposite of travel; the party spreads along the shoulder.
  const behind = { x: -dir.x, y: -dir.y }
  const side = { x: -dir.y, y: dir.x }
  const list = companions || []
  const out = []
  for (let i = 0; i < list.length; i += 1) {
    const row = Math.floor(i / 2)
    // Past a few rows the party stops deepening and waits in a slightly wider
    // block, so a big following does not stretch across half the map.
    const rowIndex = Math.min(row, MAX_ROWS)
    const spread = FIRST_SPREAD + ROW_SPREAD * rowIndex
    const lateral = (i % 2 === 0 ? -1 : 1) * spread
    const depth = FIRST_DEPTH + ROW_DEPTH * rowIndex
    const extra = row > MAX_ROWS ? (row - MAX_ROWS) * 0.18 : 0
    out.push({
      id: list[i].id,
      companion: list[i],
      x: player.x + behind.x * (depth + extra) + side.x * lateral,
      y: player.y + behind.y * (depth + extra) + side.y * lateral
    })
  }
  return out
}

/**
 * Move the drawn position of a companion towards its slot.
 *
 * The lag is the point: a follower that sat exactly on its slot would look glued
 * to the lord, and one that never caught up would be left behind at the edge of
 * the screen. A short exponential catch-up gives the little delay that makes the
 * party look like it is walking.
 */
export function easeFollower(current, target, dt, rate = 7) {
  const k = Math.min(1, Math.max(0, dt * rate))
  return {
    x: current.x + (target.x - current.x) * k,
    y: current.y + (target.y - current.y) * k
  }
}

/** A walking bob, so a companion in motion is not a frozen stamp. */
export function followerBob(phase) {
  return Math.sin(phase) * 1.4
}
