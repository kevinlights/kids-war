/**
 * Pixel art manifest for kids-war-game.
 *
 * The PNGs under `public/pixel/<category>/` are produced by
 * `tools/pixel-assets/generate.mjs`, which draws them through the Pixelorama
 * MCP bridge declared in the repository root `.mcp.json`. Every file is
 * authored and exported on the same 32x32 grid, so the game always draws them
 * at an integer screen scale and never smears them with a fractional one.
 *
 * This module is the only place that knows which file backs which game object:
 * a unit type, a settlement kind, a faction or a terrain decoration.
 */

/** Static URL space, so a sprite can be swapped on disk without a rebuild. */
export const PIXEL_BASE = '/pixel'

/** Design grid of every sprite, in art pixels. */
export const SPRITE_SIZE = 32

/** Sprite name -> folder under `public/pixel`. */
export const SPRITE_CATEGORY = {
  // Soldiers: one basic and one elite sprite per family, plus the lord.
  militia: 'unit',
  spearman: 'unit',
  'spearman-elite': 'unit',
  archer: 'unit',
  marksman: 'unit',
  cavalry: 'unit',
  knight: 'unit',
  lord: 'unit',
  town: 'settlement',
  village: 'settlement',
  // One commander figure per hostile faction, drawn for a roaming party.
  bandit: 'commander',
  wolf: 'commander',
  eagle: 'commander',
  forest: 'terrain',
  mountain: 'terrain',
  water: 'terrain',
  desert: 'terrain',
  // Map marker: the tent shown where the lord has pitched camp.
  camp: 'terrain'
}

/** Public URL for one sprite, or null when the name is unknown. */
export function spriteUrl(name) {
  const category = SPRITE_CATEGORY[name]
  return category ? `${PIXEL_BASE}/${category}/${name}.png` : null
}

/** Revealed by the world map and battle arena, terrain decoration keys. */
export const TERRAIN_SPRITES = ['forest', 'mountain', 'water', 'desert']

const images = new Map()
let loading = null

/**
 * Download every sprite once, in parallel. Calling it again reuses the same
 * promise, and a file that fails to load simply leaves that sprite missing.
 */
export function loadSprites() {
  if (loading) return loading
  loading = Promise.all(
    Object.keys(SPRITE_CATEGORY).map(
      (name) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = () => {
            images.set(name, img)
            resolve()
          }
          // A file that fails to load just leaves that sprite out of the set.
          img.onerror = () => resolve()
          img.src = spriteUrl(name)
        })
    )
  ).then(() => images)
  return loading
}

/** The loaded image for a sprite, or null while it is still in flight. */
export function sprite(name) {
  return images.get(name) || null
}

/**
 * Draw one sprite centred on (x, y) at an integer scale, with smoothing off so
 * the browser never interpolates between art pixels.
 */
/**
 * Draw one sprite centred on a point.
 *
 * `smooth` keeps the fractional position instead of snapping to whole pixels.
 * The map and the interface stay pixel-crisp by default; the battle field asks
 * for smooth placement so a walking soldier glides instead of stepping.
 */
export function drawSprite(ctx, name, x, y, size, flip = false, smooth = false) {
  const img = sprite(name)
  if (!img) return false
  const half = size / 2
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.translate(smooth ? x : Math.round(x), smooth ? y : Math.round(y))
  if (flip) ctx.scale(-1, 1)
  ctx.drawImage(img, -half, -half, size, size)
  ctx.restore()
  return true
}
