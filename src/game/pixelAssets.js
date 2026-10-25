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

/**
 * Sprite name -> path under `public/pixel`, without the `.png`.
 *
 * Three folders hold the world map (soldiers, commanders, terrain, the two
 * settlement icons) and three hold the town scenes (ground tiles, buildings and
 * street props, townsfolk). The town art is namespaced — `town-hall`,
 * `prop-tree`, `npc-guard` — so a name can never collide with a world sprite
 * that happens to use the same word (`water`, `path`).
 */
export const SPRITE_PATH = {
  // Soldiers: one basic and one elite sprite per family, plus the lord.
  militia: 'unit/militia',
  spearman: 'unit/spearman',
  'spearman-elite': 'unit/spearman-elite',
  archer: 'unit/archer',
  marksman: 'unit/marksman',
  cavalry: 'unit/cavalry',
  knight: 'unit/knight',
  lord: 'unit/lord',
  town: 'settlement/town',
  village: 'settlement/village',
  // One commander figure per hostile faction, drawn for a roaming party.
  bandit: 'commander/bandit',
  wolf: 'commander/wolf',
  eagle: 'commander/eagle',
  forest: 'terrain/forest',
  mountain: 'terrain/mountain',
  water: 'terrain/water',
  desert: 'terrain/desert',
  // Map marker: the tent shown where the lord has pitched camp.
  camp: 'terrain/camp',

  // --- the town scene -------------------------------------------------------
  // Ground tiles: 32x32, seamless, drawn edge to edge.
  'ground-grass': 'ground/grass',
  'ground-path': 'ground/path',
  'ground-cobble': 'ground/cobble',
  'ground-plaza': 'ground/plaza',
  'ground-water': 'ground/water',
  'ground-farm': 'ground/farm',
  // Buildings and facilities.
  'town-hall': 'town/hall',
  'town-market': 'town/shop',
  'town-barracks': 'town/barracks',
  'town-hospital': 'town/hospital',
  'town-school': 'town/school',
  'town-tavern': 'town/tavern',
  'town-smithy': 'town/smithy',
  'town-barn': 'town/barn',
  'town-mill': 'town/mill',
  'town-well': 'town/well',
  'town-gate': 'town/gate',
  'town-fountain': 'town/fountain',
  'town-house-a': 'town/house-a',
  'town-house-b': 'town/house-b',
  'town-house-c': 'town/house-c',
  // Street props.
  'prop-barrel': 'prop/barrel',
  'prop-crate': 'prop/crate',
  'prop-cart': 'prop/cart',
  'prop-lamp': 'prop/lamp',
  'prop-tree': 'prop/tree',
  'prop-bush': 'prop/bush',
  'prop-signpost': 'prop/signpost',
  'prop-haystack': 'prop/haystack',
  'prop-banner': 'prop/banner',
  'prop-fence': 'prop/fence',
  // Townsfolk, one sprite per trade.
  'npc-guard': 'npc/guard',
  'npc-hunter': 'npc/hunter',
  'npc-scholar': 'npc/scholar',
  'npc-smith': 'npc/smith',
  'npc-healer': 'npc/healer',
  'npc-bard': 'npc/bard',
  'npc-merchant': 'npc/merchant',
  'npc-farmer': 'npc/farmer'
}

/** Old name of the table, kept for the panels that only read the folder. */
export const SPRITE_CATEGORY = SPRITE_PATH

/** Public URL for one sprite, or null when the name is unknown. */
export function spriteUrl(name) {
  const path = SPRITE_PATH[name]
  return path ? `${PIXEL_BASE}/${path}.png` : null
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
    Object.keys(SPRITE_PATH).map(
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
