/**
 * Pixel asset generator for the town and village scenes.
 *
 * The world map has its own generator (`generate.mjs`) for soldiers, settlements
 * and terrain. This script draws what only exists once the lord walks through
 * the gate: the ground he stands on, the houses and facilities around the
 * square, the props that make a street look lived in, and the townsfolk
 * themselves.
 *
 * Every asset is authored on the same 32x32 design grid, streamed to Pixelorama
 * through the shared toolkit (`pixkit.mjs`) in one batched flush and exported at
 * `scale: 1`, so the PNG on disk matches the authored grid pixel for pixel. The
 * town scene draws those files at integer screen scales with smoothing off,
 * which is what keeps the art crisp next to the world map.
 *
 * Usage (Pixelorama must be open with the bridge listening on :7373):
 *   node tools/pixel-assets/generate-town.mjs               # every town asset
 *   node tools/pixel-assets/generate-town.mjs town prop     # only some categories
 *   node tools/pixel-assets/generate-town.mjs well          # one single asset
 */

import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BRIDGE_URL,
  Pix,
  cmd,
  writeIndex,
  OUTLINE,
  SKIN,
  SKIN_DARK,
  METAL,
  METAL_DARK,
  LEATHER,
  LEATHER_DARK,
  WOOD,
  WOOD_DARK,
  GOLD,
  GOLD_DARK,
  STONE,
  STONE_DARK,
  STONE_LIGHT,
  STRAW,
  STRAW_DARK,
  CANOPY,
  CANOPY_DARK,
  CANOPY_LIGHT,
  SNOW,
  shade
} from './pixkit.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT_ROOT = join(ROOT, 'public/pixel')
const SIZE = 32

/* -------------------------------- palette -------------------------------- */

const PLASTER = '#ddcda6'
const PLASTER_DARK = '#b8a67e'
const TIMBER = '#7d5734'
const TIMBER_DARK = '#573a21'
const ROOF_RED = '#a8492f'
const ROOF_RED_DARK = '#7b3220'
const ROOF_SLATE = '#54697c'
const ROOF_SLATE_DARK = '#39495a'
const ROOF_THATCH = '#c8a356'
const ROOF_THATCH_DARK = '#96763a'
const CLOTH_RED = '#b2433f'
const CLOTH_BLUE = '#3f6fa8'
const CLOTH_GREEN = '#4f8a46'
const CLOTH_PURPLE = '#7b5590'
const CLOTH_WHITE = '#efe6d2'
const CLOTH_YELLOW = '#d9a92f'
const GRASS = '#4a7a3c'
const GRASS_DARK = '#39602e'
const GRASS_LIGHT = '#5f9446'
const DIRT = '#a68a63'
const DIRT_DARK = '#866c4b'
const COBBLE = '#97917f'
const COBBLE_DARK = '#736e60'
const WATER = '#3a6c9a'
const WATER_LIGHT = '#5b91c1'
const WATER_DARK = '#2a4f74'
const SOIL = '#7a5738'
const SOIL_DARK = '#5d4128'
const GLASS = '#8fc0d8'
const FIRE = '#f09040'
const SMOKE = '#c9c6bd'

/* -------------------------------- helpers -------------------------------- */

/**
 * Stable per-pixel pseudo random in 0..1.
 *
 * The ground tiles are drawn with a little speckle, and the speckle has to be
 * the same every run: a texture that changes on every export would show up as a
 * diff in the repository for no reason.
 */
function hash(x, y, salt = 0) {
  let h = (x + salt * 31) * 374761393 + (y + salt * 17) * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}

/** Fill the whole canvas with one colour, the base of every ground tile. */
function fillAll(pix, color) {
  pix.rect(0, 0, pix.w, pix.h, color, true)
}

/** A row of bricks: courses of three rows with the joints staggered. */
function brickWall(pix, x, y, w, h, fill, dark) {
  pix.rect(x, y, w, h, fill, true)
  for (let j = 0; j < h; j += 3) {
    for (let i = 0; i < w; i += 1) pix.set(x + i, y + j, dark)
    const shift = (j / 3) % 2 === 0 ? 0 : 3
    for (let i = (shift % 6); i < w; i += 6) pix.set(x + i, y + j + 1, dark)
  }
}

/** Vertical timber framing, the look of a half-timbered house. */
function timberFrame(pix, x, y, w, h, color) {
  for (let i = 0; i < w; i += 5) pix.rect(x + i, y, 1, h, color, true)
  pix.rect(x, y, w, 1, color, true)
  pix.rect(x, y + h - 1, w, 1, color, true)
}

/**
 * A pitched roof.
 *
 * `ridge` is the width of the flat top, `eaves` the width of the bottom, so one
 * helper draws both the narrow gable of a hut and the broad roof of a hall.
 */
function gableRoof(pix, { y, height, ridge, eaves, fill, dark, light }) {
  for (let j = 0; j < height; j += 1) {
    const t = height <= 1 ? 1 : j / (height - 1)
    const half = Math.round((ridge + (eaves - ridge) * t) / 2)
    const rowY = y + j
    for (let i = -half; i <= half; i += 1) {
      const edge = i === -half || i === half
      pix.set(16 + i, rowY, edge ? dark : fill)
    }
    // A light streak down the left slope reads as sun on the tiles.
    if (j > 1) pix.set(16 - half + 1, rowY, light)
  }
  // Eaves: the bottom row is the shadow under the roof.
  const halfEave = Math.round(eaves / 2)
  for (let i = -halfEave; i <= halfEave; i += 1) pix.set(16 + i, y + height, dark)
}

/** Windows: a lit pane with a frame, so a house looks inhabited. */
function window2(pix, x, y, lit = true) {
  pix.rect(x, y, 5, 4, TIMBER_DARK, true)
  pix.rect(x + 1, y + 1, 3, 2, lit ? GLASS : '#5c7484', true)
  pix.set(x + 2, y + 1, lit ? SNOW : '#7f96a4')
}

/** A door with a frame and a handle. */
function door(pix, x, y, w, h, color = WOOD_DARK, frame = TIMBER_DARK) {
  pix.rect(x - 1, y - 1, w + 2, h + 1, frame, true)
  pix.rect(x, y, w, h, color, true)
  pix.set(x + w - 2, y + Math.floor(h / 2), GOLD)
}

/* --------------------------------- ground -------------------------------- */

function paintGrass(pix) {
  fillAll(pix, GRASS)
  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 32; x += 1) {
      const n = hash(x, y, 1)
      if (n > 0.9) pix.set(x, y, GRASS_LIGHT)
      else if (n < 0.12) pix.set(x, y, GRASS_DARK)
    }
  }
  // A few tufts, drawn as two-pixel blades so the tile does not look like noise.
  for (let i = 0; i < 6; i += 1) {
    const x = Math.floor(hash(i, 7, 3) * 30) + 1
    const y = Math.floor(hash(i, 11, 5) * 28) + 2
    pix.set(x, y, GRASS_LIGHT)
    pix.set(x, y - 1, GRASS_LIGHT)
    pix.set(x + 1, y, GRASS_DARK)
  }
}

function paintPath(pix) {
  fillAll(pix, DIRT)
  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 32; x += 1) {
      const n = hash(x, y, 2)
      if (n > 0.93) pix.set(x, y, '#bda078')
      else if (n < 0.1) pix.set(x, y, DIRT_DARK)
    }
  }
  // Cart ruts, worn into the middle of the road.
  for (let x = 0; x < 32; x += 1) {
    if (hash(x, 0, 9) > 0.35) pix.set(x, 9, DIRT_DARK)
    if (hash(x, 1, 9) > 0.35) pix.set(x, 22, DIRT_DARK)
  }
}

function paintCobble(pix) {
  fillAll(pix, '#6f6a5c')
  for (let row = 0; row < 7; row += 1) {
    const y = row * 5
    const shift = row % 2 === 0 ? 0 : 4
    for (let col = -1; col < 5; col += 1) {
      const x = col * 8 + shift
      for (let j = 0; j < 4; j += 1) {
        for (let i = 0; i < 7; i += 1) {
          const px = x + i
          const py = y + j
          if (px < 0 || px > 31 || py > 31) continue
          // Cut the corners so a stone reads as a round pebble, not a brick.
          if ((i === 0 || i === 6) && (j === 0 || j === 3)) continue
          const tone = hash(px, py, 4) > 0.72 ? '#a49e8b' : COBBLE
          pix.set(px, py, tone)
        }
      }
    }
  }
}

function paintPlaza(pix) {
  fillAll(pix, STONE_DARK)
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = col * 8
      const y = row * 8
      for (let j = 1; j < 8; j += 1) {
        for (let i = 1; i < 8; i += 1) {
          const light = (i + j) % 9 === 0
          pix.set(x + i, y + j, light ? STONE_LIGHT : STONE)
        }
      }
    }
  }
}

function paintWaterTile(pix) {
  fillAll(pix, WATER)
  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 32; x += 1) {
      const n = hash(x, y, 6)
      if (n > 0.9) pix.set(x, y, WATER_LIGHT)
      else if (n < 0.16) pix.set(x, y, WATER_DARK)
    }
  }
  // Two ripple lines, the only thing that reads as water at this size.
  for (let x = 3; x < 15; x += 1) {
    pix.set(x, 12, WATER_LIGHT)
    pix.set(x + 1, 13, WATER_LIGHT)
  }
  for (let x = 17; x < 29; x += 1) {
    pix.set(x, 23, WATER_LIGHT)
    pix.set(x + 1, 24, WATER_LIGHT)
  }
}

function paintFarm(pix) {
  fillAll(pix, SOIL)
  for (let row = 0; row < 4; row += 1) {
    const y = row * 8
    pix.rect(0, y + 6, 32, 2, SOIL_DARK, true)
    for (let x = 1; x < 32; x += 4) {
      pix.set(x, y + 3, CLOTH_GREEN)
      pix.set(x, y + 2, shade(CLOTH_GREEN, 0.15))
    }
  }
}

/* ------------------------------- buildings ------------------------------- */

/**
 * One habitable house: walls, a pitched roof, a door and two lit windows.
 *
 * Everything that makes a house its own building — a shop's awning, a tavern's
 * sign, a smithy's chimney — is layered on top by the painter that calls this.
 */
function paintHouse(pix, art) {
  // Walls.
  if (art.wallStyle === 'stone') brickWall(pix, 5, 15, 22, 14, art.wall, art.wallDark)
  else {
    pix.rect(5, 15, 22, 14, art.wall, true)
    pix.rect(5, 15, 22, 1, art.wallDark, true)
    pix.rect(5, 28, 22, 1, art.wallDark, true)
    if (art.wallStyle === 'timber') timberFrame(pix, 5, 15, 22, 14, TIMBER_DARK)
  }
  // Floor shadow under the eaves.
  pix.rect(5, 15, 22, 2, art.wallDark, true)

  gableRoof(pix, {
    y: art.roofY ?? 5,
    height: art.roofHeight ?? 11,
    ridge: 4,
    eaves: 26,
    fill: art.roof,
    dark: art.roofDark,
    light: art.roofLight ?? shade(art.roof, 0.16)
  })

  door(pix, 14, 21, 5, 8, art.doorColor ?? WOOD_DARK)
  window2(pix, 7, 18, art.lit !== false)
  window2(pix, 21, 18, art.lit !== false)
}

const HOUSE_ART = {
  'house-a': {
    wall: PLASTER,
    wallDark: PLASTER_DARK,
    wallStyle: 'timber',
    roof: ROOF_RED,
    roofDark: ROOF_RED_DARK
  },
  'house-b': {
    wall: STONE,
    wallDark: STONE_DARK,
    wallStyle: 'stone',
    roof: ROOF_SLATE,
    roofDark: ROOF_SLATE_DARK,
    lit: false
  },
  'house-c': {
    wall: WOOD,
    wallDark: WOOD_DARK,
    wallStyle: 'plank',
    roof: ROOF_THATCH,
    roofDark: ROOF_THATCH_DARK
  }
}

/** The town hall: the tallest building, with a tower and the town's banner. */
function paintHall(pix) {
  brickWall(pix, 3, 14, 26, 16, STONE, STONE_DARK)
  gableRoof(pix, { y: 4, height: 11, ridge: 6, eaves: 30, fill: ROOF_RED, dark: ROOF_RED_DARK, light: '#c46a4a' })
  // A little clock tower on the left shoulder of the roof.
  pix.rect(4, 6, 8, 12, STONE_LIGHT, true)
  pix.rect(4, 6, 8, 1, STONE_DARK, true)
  pix.rect(3, 4, 10, 3, ROOF_SLATE, true)
  pix.rect(3, 3, 10, 1, ROOF_SLATE_DARK, true)
  pix.rect(7, 8, 3, 3, GLASS, true)
  pix.set(8, 9, GOLD)
  // The banner: gold trim on a dark pole, the one thing that says "this is the
  // seat of whoever holds the town".
  pix.rect(24, 1, 1, 8, TIMBER_DARK, true)
  pix.rect(25, 1, 5, 4, CLOTH_RED, true)
  pix.rect(25, 1, 5, 1, GOLD, true)
  // Arched double door with gold studs.
  pix.rect(13, 20, 7, 10, TIMBER_DARK, true)
  pix.rect(14, 21, 5, 9, WOOD_DARK, true)
  pix.set(15, 25, GOLD)
  pix.set(18, 25, GOLD)
  window2(pix, 5, 17)
  window2(pix, 23, 17)
}

/** The market stall: a striped awning over a table of goods. */
function paintShop(pix) {
  // Back wall and shelf.
  pix.rect(6, 13, 20, 12, PLASTER, true)
  pix.rect(6, 13, 20, 1, PLASTER_DARK, true)
  // Awning: red and cream stripes, sloping towards the viewer.
  for (let j = 0; j < 6; j += 1) {
    for (let i = 0; i < 26; i += 1) {
      const x = 3 + i
      const y = 7 + j
      pix.set(x, y, Math.floor(i / 3) % 2 === 0 ? CLOTH_RED : CLOTH_WHITE)
    }
  }
  pix.rect(3, 13, 26, 1, shade(CLOTH_RED, -0.3), true)
  // Posts.
  pix.rect(4, 13, 2, 15, TIMBER, true)
  pix.rect(26, 13, 2, 15, TIMBER, true)
  // Table with wares: crates, a pot and a bolt of cloth.
  pix.rect(6, 22, 20, 2, WOOD, true)
  pix.rect(7, 18, 4, 4, WOOD_DARK, true)
  pix.rect(12, 19, 4, 3, '#b8875a', true)
  pix.rect(17, 18, 3, 4, CLOTH_BLUE, true)
  pix.rect(21, 19, 4, 3, CLOTH_YELLOW, true)
}

/** The tavern: two floors, a hanging sign and a barrel by the door. */
function paintTavern(pix) {
  paintHouse(pix, {
    wall: PLASTER,
    wallDark: PLASTER_DARK,
    wallStyle: 'timber',
    roof: ROOF_THATCH,
    roofDark: ROOF_THATCH_DARK,
    roofY: 4,
    roofHeight: 10
  })
  // Hanging sign: a board on an iron arm.
  pix.rect(24, 17, 5, 1, METAL_DARK, true)
  pix.rect(28, 17, 1, 3, METAL_DARK, true)
  pix.rect(24, 20, 5, 5, WOOD_DARK, true)
  pix.rect(25, 21, 3, 3, GOLD_DARK, true)
  // A barrel at the door and a lantern over it.
  pix.rect(9, 25, 4, 5, WOOD, true)
  pix.rect(9, 26, 4, 1, METAL_DARK, true)
  pix.rect(9, 28, 4, 1, METAL_DARK, true)
  pix.rect(2, 18, 2, 2, GOLD, true)
}

/** The smithy: a squat stone shed with a chimney and a glowing forge. */
function paintSmithy(pix) {
  brickWall(pix, 5, 16, 22, 13, STONE, STONE_DARK)
  gableRoof(pix, { y: 8, height: 9, ridge: 5, eaves: 26, fill: ROOF_SLATE, dark: ROOF_SLATE_DARK })
  // Chimney with a curl of smoke.
  pix.rect(21, 3, 5, 10, STONE_DARK, true)
  pix.rect(21, 3, 5, 1, STONE_LIGHT, true)
  pix.set(22, 2, SMOKE)
  pix.set(23, 1, SMOKE)
  pix.set(24, 0, SMOKE)
  // The forge itself: an open doorway glowing orange.
  pix.rect(12, 20, 8, 9, TIMBER_DARK, true)
  pix.rect(13, 22, 6, 7, FIRE, true)
  pix.rect(14, 24, 4, 4, '#ffe08a', true)
  // Anvil and hammer outside, so the building reads as a workshop.
  pix.rect(26, 25, 4, 2, METAL_DARK, true)
  pix.rect(27, 27, 2, 3, METAL, true)
  pix.rect(22, 27, 3, 1, WOOD_DARK, true)
}


/** The hospital: pale walls, a red cross and pots of herbs. */
function paintHospital(pix) {
  paintHouse(pix, {
    wall: CLOTH_WHITE,
    wallDark: '#cfc4a8',
    wallStyle: 'plank',
    roof: ROOF_SLATE,
    roofDark: ROOF_SLATE_DARK,
    roofY: 5,
    roofHeight: 10
  })
  // The cross, in the one colour everybody reads as "healing".
  pix.rect(15, 16, 3, 9, CLOTH_RED, true)
  pix.rect(12, 19, 9, 3, CLOTH_RED, true)
  // Herb pots by the step.
  pix.rect(4, 27, 3, 3, '#b06a45', true)
  pix.set(5, 26, CLOTH_GREEN)
  pix.rect(25, 27, 3, 3, '#b06a45', true)
  pix.set(26, 26, CLOTH_GREEN)
}

/** The school: a long hall with a flag and a scroll over the door. */
function paintSchool(pix) {
  paintHouse(pix, {
    wall: PLASTER,
    wallDark: PLASTER_DARK,
    wallStyle: 'timber',
    roof: ROOF_SLATE,
    roofDark: ROOF_SLATE_DARK,
    roofY: 6,
    roofHeight: 9
  })
  // Flag on the ridgeline.
  pix.rect(23, 1, 1, 7, TIMBER_DARK, true)
  pix.rect(24, 1, 5, 3, CLOTH_BLUE, true)
  pix.set(25, 2, SNOW)
  // A scroll board above the door: an open book for the school.
  pix.rect(13, 17, 7, 4, CLOTH_WHITE, true)
  pix.rect(16, 17, 1, 4, PLASTER_DARK, true)
  pix.set(14, 18, STONE_DARK)
  pix.set(18, 19, STONE_DARK)
}


/** The barn: broad red-brown walls under an aged roof, with a braced door. */
function paintBarn(pix) {
  // Walls: horizontal planks, lit from the left.
  pix.rect(4, 13, 24, 16, '#8e4a2c', true)
  for (let y = 15; y < 29; y += 3) pix.rect(4, y, 24, 1, '#733a21', true)
  pix.rect(4, 13, 2, 16, '#6b3520', true)
  pix.rect(26, 13, 2, 16, '#6b3520', true)

  // Roof: a broad gable with a lighter ridge cap.
  gableRoof(pix, { y: 3, height: 10, ridge: 8, eaves: 28, fill: '#7d6a45', dark: '#544733', light: '#96805a' })
  pix.rect(13, 2, 7, 1, '#b9a479', true)

  // Double doors with the white cross-brace every barn has.
  pix.rect(10, 16, 12, 13, STONE_LIGHT, true)
  pix.rect(11, 17, 10, 12, WOOD_DARK, true)
  pix.rect(15, 17, 2, 12, TIMBER_DARK, true)
  for (let s = 0; s < 9; s += 1) {
    pix.set(11 + s, 28 - s, STONE_LIGHT)
    pix.set(20 - s, 28 - s, STONE_LIGHT)
  }

  // Hay bales stacked at the side.
  pix.rect(23, 22, 5, 6, STRAW, true)
  pix.rect(23, 24, 5, 1, STRAW_DARK, true)
  pix.rect(23, 26, 5, 1, STRAW_DARK, true)
}

/** The mill: a tapered stone tower with four broad sails. */
function paintMill(pix) {
  // Tower, wider at the base.
  for (let j = 0; j < 20; j += 1) {
    const half = 9 - Math.round((j / 19) * 5)
    for (let i = -half; i <= half; i += 1) {
      const edge = i === -half || i === half
      pix.set(16 + i, 9 + j, edge ? STONE_DARK : STONE)
    }
  }
  pix.rect(13, 9, 6, 1, STONE_LIGHT, true)
  gableRoof(pix, { y: 3, height: 7, ridge: 8, eaves: 14, fill: ROOF_THATCH, dark: ROOF_THATCH_DARK })

  // Sails: four arms, each a wooden spar with a cloth blade beside it.
  const arms = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 }
  ]
  for (const { dx, dy } of arms) {
    for (let s = 2; s <= 13; s += 1) pix.set(16 + dx * s, 13 + dy * s, TIMBER_DARK)
    for (let s = 5; s <= 13; s += 1) {
      for (let w = 1; w <= 3; w += 1) {
        const x = 16 + dx * s + (dy !== 0 ? w : 0)
        const y = 13 + dy * s + (dx !== 0 ? w : 0)
        pix.set(x, y, CLOTH_WHITE)
      }
    }
  }
  pix.rect(15, 12, 3, 3, TIMBER_DARK, true)
  door(pix, 14, 21, 4, 8, WOOD_DARK)
  window2(pix, 12, 15, false)
}

/** The barracks: a campaign tent with a racked spear wall and shields. */
function paintBarracks(pix) {
  // Tent: a striped canvas cone with a ridge pole through the top.
  for (let j = 0; j < 17; j += 1) {
    const half = 3 + Math.round((j / 16) * 11)
    for (let i = -half; i <= half; i += 1) {
      const edge = i === -half || i === half
      const stripe = Math.floor((i + 20) / 4) % 2 === 0
      pix.set(16 + i, 9 + j, edge ? '#2c4560' : stripe ? CLOTH_BLUE : '#4f79a3')
    }
  }
  pix.rect(15, 5, 2, 22, TIMBER_DARK, true)
  pix.rect(13, 5, 6, 2, GOLD_DARK, true)
  // Door flaps.
  pix.rect(12, 19, 8, 7, '#2c4560', true)
  pix.rect(14, 20, 4, 6, '#182b3d', true)

  // Spear wall on the right: four spears leaning on a rail.
  pix.rect(24, 18, 1, 11, WOOD_DARK, true)
  pix.rect(30, 18, 1, 11, WOOD_DARK, true)
  for (const x of [25, 27, 29]) {
    pix.rect(x, 11, 1, 12, WOOD, true)
    pix.rect(x - 1, 9, 3, 2, METAL, true)
  }
  pix.rect(24, 18, 7, 1, WOOD_DARK, true)

  // A shield and a helmet by the entrance.
  pix.circle(7, 24, 4, CLOTH_RED, true)
  pix.circle(7, 24, 2, GOLD, true)
  pix.rect(5, 29, 5, 2, METAL_DARK, true)
}

/** The town gate: a stone arch with a tower on each side. */
function paintGate(pix) {
  brickWall(pix, 1, 10, 30, 18, STONE, STONE_DARK)
  // The archway: a dark passage under a rounded top.
  pix.rect(11, 16, 10, 12, '#2a2418', true)
  pix.circle(16, 16, 5, '#2a2418', true, 12, 16)
  pix.circle(16, 16, 6, STONE_DARK, false, 10, 16)
  // Battlements.
  for (let x = 1; x < 30; x += 4) pix.rect(x, 7, 2, 3, STONE_LIGHT, true)
  // Banners on both towers.
  pix.rect(3, 2, 1, 6, TIMBER_DARK, true)
  pix.rect(4, 2, 4, 3, CLOTH_BLUE, true)
  pix.rect(27, 2, 1, 6, TIMBER_DARK, true)
  pix.rect(24, 2, 4, 3, CLOTH_RED, true)
}

/* ---------------------------------- props --------------------------------- */

function paintWell(pix) {
  pix.ellipse(16, 24, 10, 5, STONE_DARK, true)
  pix.ellipse(16, 23, 9, 4, STONE, true)
  pix.ellipse(16, 23, 6, 2, WATER, true)
  pix.ellipse(16, 23, 4, 1, WATER_LIGHT, true)
  // Two posts and a little tiled roof over the water.
  pix.rect(7, 10, 2, 12, WOOD_DARK, true)
  pix.rect(23, 10, 2, 12, WOOD_DARK, true)
  pix.rect(6, 8, 20, 2, ROOF_SLATE_DARK, true)
  pix.rect(8, 6, 16, 2, ROOF_SLATE, true)
  // Bucket on a rope.
  pix.rect(15, 15, 1, 5, STRAW_DARK, true)
  pix.rect(13, 20, 5, 4, WOOD, true)
  pix.rect(13, 21, 5, 1, METAL_DARK, true)
}

function paintFountain(pix) {
  pix.ellipse(16, 22, 12, 7, STONE_DARK, true)
  pix.ellipse(16, 21, 11, 6, STONE, true)
  pix.ellipse(16, 21, 8, 4, WATER, true)
  pix.ellipse(16, 20, 5, 2, WATER_LIGHT, true)
  // The column and its basin.
  pix.rect(15, 10, 3, 12, STONE_LIGHT, true)
  pix.rect(13, 8, 7, 3, STONE, true)
  pix.rect(14, 7, 5, 1, STONE_LIGHT, true)
  // Water falling from the top basin.
  for (const x of [11, 21]) {
    for (let y = 12; y < 20; y += 1) if (hash(x, y, 8) > 0.4) pix.set(x, y, WATER_LIGHT)
  }
}

function paintBarrel(pix) {
  pix.rect(11, 12, 11, 18, WOOD, true)
  pix.rect(11, 12, 2, 18, WOOD_DARK, true)
  pix.rect(20, 12, 2, 18, WOOD_DARK, true)
  pix.ellipse(16, 12, 5, 2, '#a9793f', true)
  pix.ellipse(16, 29, 5, 2, WOOD_DARK, true)
  pix.rect(10, 17, 12, 2, METAL_DARK, true)
  pix.rect(10, 25, 12, 2, METAL_DARK, true)
}

function paintCrate(pix) {
  pix.rect(8, 14, 17, 15, WOOD, true)
  pix.rect(8, 14, 17, 1, '#a9793f', true)
  pix.rect(8, 14, 1, 15, WOOD_DARK, true)
  pix.rect(24, 14, 1, 15, WOOD_DARK, true)
  pix.rect(8, 28, 17, 1, WOOD_DARK, true)
  for (let s = 0; s < 13; s += 1) {
    pix.set(9 + s, 15 + s, WOOD_DARK)
    pix.set(23 - s, 15 + s, WOOD_DARK)
  }
}

function paintCart(pix) {
  pix.rect(4, 14, 24, 3, WOOD, true)
  pix.rect(4, 20, 24, 3, WOOD, true)
  pix.rect(4, 14, 2, 9, WOOD_DARK, true)
  pix.rect(26, 14, 2, 9, WOOD_DARK, true)
  pix.rect(6, 17, 20, 3, WOOD_DARK, true)
  // Load: sacks and a crate.
  pix.rect(8, 9, 7, 5, '#c8b184', true)
  pix.rect(16, 8, 7, 6, WOOD, true)
  // Wheels.
  pix.circle(9, 25, 5, WOOD_DARK, false)
  pix.circle(9, 25, 1, WOOD_DARK, true)
  pix.circle(23, 25, 5, WOOD_DARK, false)
  pix.circle(23, 25, 1, WOOD_DARK, true)
}

function paintLamp(pix) {
  pix.rect(15, 12, 2, 19, METAL_DARK, true)
  pix.rect(12, 29, 8, 2, STONE_DARK, true)
  // Lantern with a warm pane.
  pix.rect(11, 6, 10, 8, METAL_DARK, true)
  pix.rect(12, 7, 8, 6, '#ffe6a6', true)
  pix.rect(13, 8, 6, 4, '#fff6d8', true)
  pix.rect(15, 3, 2, 3, METAL_DARK, true)
}

function paintTree(pix) {
  pix.rect(14, 20, 4, 10, WOOD_DARK, true)
  pix.rect(14, 20, 1, 10, '#6b4526', true)
  pix.circle(16, 13, 10, CANOPY_DARK, true)
  pix.circle(16, 12, 8, CANOPY, true)
  pix.circle(14, 10, 5, CANOPY_LIGHT, true)
  pix.circle(20, 15, 3, CANOPY, true)
}

function paintBush(pix) {
  pix.ellipse(16, 24, 9, 6, CANOPY_DARK, true)
  pix.ellipse(16, 23, 8, 5, CANOPY, true)
  pix.circle(13, 20, 3, CANOPY_LIGHT, true)
  pix.set(20, 21, CANOPY_LIGHT)
}

function paintSignpost(pix) {
  pix.rect(15, 12, 2, 18, WOOD_DARK, true)
  pix.rect(5, 8, 22, 7, WOOD, true)
  pix.rect(5, 8, 22, 1, '#a9793f', true)
  pix.rect(5, 14, 22, 1, WOOD_DARK, true)
  // Two carved lines: the lettering, too small to read at 32px.
  pix.rect(8, 10, 12, 1, WOOD_DARK, true)
  pix.rect(8, 12, 8, 1, WOOD_DARK, true)
}

function paintHaystack(pix) {
  pix.ellipse(16, 26, 11, 5, STRAW_DARK, true)
  pix.ellipse(16, 24, 10, 7, STRAW, true)
  pix.ellipse(16, 20, 7, 6, '#e6c974', true)
  for (let i = 0; i < 8; i += 1) {
    const x = 10 + i * 2
    pix.set(x, 22 + (i % 3), STRAW_DARK)
  }
  pix.rect(15, 10, 2, 8, WOOD_DARK, true)
}

function paintBanner(pix) {
  pix.rect(15, 2, 2, 28, TIMBER_DARK, true)
  pix.rect(13, 29, 6, 2, STONE_DARK, true)
  for (let j = 0; j < 12; j += 1) {
    const w = 9 - Math.round(j / 3)
    for (let i = 0; i < w; i += 1) pix.set(17 + i, 3 + j, j % 4 === 0 ? GOLD_DARK : CLOTH_RED)
  }
  pix.set(20, 7, GOLD)
  pix.set(20, 10, GOLD)
}

function paintFence(pix) {
  pix.rect(0, 16, 32, 2, WOOD, true)
  pix.rect(0, 23, 32, 2, WOOD, true)
  for (const x of [3, 12, 21, 29]) {
    pix.rect(x, 12, 2, 18, WOOD_DARK, true)
    pix.set(x, 11, WOOD)
  }
}

/* ---------------------------------- people -------------------------------- */

/**
 * One townsperson: the same chibi body plan the soldiers use, so the folk of a
 * town look like they belong to the same world as the armies that march past it.
 */
function paintPerson(pix, art) {
  // Legs or a long robe.
  if (art.robe) {
    for (let j = 0; j < 12; j += 1) {
      const half = 4 + Math.round((j / 11) * 3)
      for (let i = -half; i <= half; i += 1) pix.set(16 + i, 18 + j, art.cloth)
    }
    pix.rect(11, 27, 11, 2, art.clothDark, true)
  } else {
    pix.rect(12, 22, 4, 8, art.pants ?? art.clothDark, true)
    pix.rect(17, 22, 4, 8, art.pants ?? art.clothDark, true)
    pix.rect(11, 29, 5, 2, LEATHER_DARK, true)
    pix.rect(17, 29, 5, 2, LEATHER_DARK, true)
  }

  // Torso, belt and arms.
  pix.rect(11, 14, 11, 8, art.cloth, true)
  pix.rect(10, 14, 13, 3, art.cloth, true)
  pix.rect(10, 21, 13, 2, art.belt ?? LEATHER, true)
  pix.rect(8, 15, 3, 7, art.clothDark, true)
  pix.rect(22, 15, 3, 7, art.clothDark, true)

  // Head, then hair and hat.
  pix.circle(16, 9, 5, SKIN, true)
  pix.rect(14, 13, 5, 1, SKIN_DARK, true)
  pix.set(14, 11, OUTLINE)
  pix.set(18, 11, OUTLINE)
  paintHair(pix, art)
  pix.rect(8, 22, 3, 3, SKIN, true)
  pix.rect(22, 22, 3, 3, SKIN, true)
}

/** Hair styles and hats, one per trade. */
function paintHair(pix, art) {
  const hair = art.hair ?? '#4a3324'
  switch (art.hat) {
    case 'straw':
      pix.ellipse(16, 7, 11, 3, STRAW, true)
      pix.ellipse(16, 6, 6, 3, STRAW_DARK, true)
      pix.circle(16, 5, 4, STRAW, true, 2, 5)
      break
    case 'cap':
      pix.circle(16, 7, 6, art.hatColor ?? CLOTH_GREEN, true, 2, 7)
      pix.rect(16, 7, 7, 2, art.hatColor ?? CLOTH_GREEN, true)
      break
    case 'hood':
      pix.circle(16, 8, 6, art.hatColor ?? CLOTH_GREEN, true, 2, 8)
      pix.rect(9, 8, 3, 6, art.hatColor ?? CLOTH_GREEN, true)
      pix.rect(20, 8, 3, 6, art.hatColor ?? CLOTH_GREEN, true)
      break
    case 'feather':
      pix.circle(16, 7, 6, CLOTH_PURPLE, true, 2, 6)
      pix.rect(9, 6, 14, 2, CLOTH_PURPLE, true)
      pix.rect(19, 1, 1, 4, CLOTH_WHITE, true)
      pix.set(20, 2, CLOTH_YELLOW)
      break
    case 'helm':
      pix.circle(16, 7, 6, METAL, true, 2, 7)
      pix.rect(15, 7, 3, 5, METAL_DARK, true)
      pix.rect(10, 7, 13, 1, GOLD_DARK, true)
      break
    case 'bald':
      pix.circle(16, 8, 5, SKIN, true, 2, 4)
      pix.rect(11, 6, 3, 2, hair, true)
      pix.rect(19, 6, 3, 2, hair, true)
      break
    default:
      pix.circle(16, 7, 6, hair, true, 1, 6)
      pix.rect(10, 6, 13, 2, hair, true)
  }
}

const NPC_ART = {
  merchant: { cloth: '#b98a4b', clothDark: '#8f6733', hat: 'cap', hatColor: CLOTH_GREEN, hold: 'bag' },
  guard: { cloth: CLOTH_BLUE, clothDark: '#2d4f7a', hat: 'helm', belt: LEATHER_DARK, hold: 'spear' },
  scholar: { cloth: CLOTH_PURPLE, clothDark: '#5b3d6c', robe: true, hold: 'scroll' },
  hunter: { cloth: '#6a7a4a', clothDark: '#4d5a34', hat: 'hood', hatColor: '#3f5a33', hold: 'bow' },
  smith: { cloth: '#8a6a4a', clothDark: '#6a4e33', hat: 'bald', hold: 'hammer' },
  farmer: { cloth: '#c0a06a', clothDark: '#96794c', hat: 'straw', hold: 'fork' },
  bard: { cloth: CLOTH_PURPLE, clothDark: '#5b3d6c', hat: 'feather', hold: 'lute' },
  healer: { cloth: CLOTH_WHITE, clothDark: '#cfc4a8', robe: true, hair: '#8a7060', hold: 'basket' }
}

/** Draw whatever the person carries in the right hand. */
function paintHeld(pix, kind) {
  switch (kind) {
    case 'spear':
      pix.rect(25, 4, 1, 22, WOOD_DARK, true)
      pix.rect(24, 2, 3, 2, METAL, true)
      break
    case 'hammer':
      pix.rect(24, 18, 1, 8, WOOD_DARK, true)
      pix.rect(22, 16, 5, 3, METAL_DARK, true)
      break
    case 'bow':
      for (let j = 0; j < 14; j += 1) {
        const x = 25 + Math.round(Math.sin((j / 13) * Math.PI) * 3)
        pix.set(x, 8 + j, WOOD)
      }
      pix.rect(25, 10, 1, 10, STONE_LIGHT, true)
      break
    case 'scroll':
      pix.rect(23, 18, 5, 6, CLOTH_WHITE, true)
      pix.rect(24, 19, 3, 1, STONE_DARK, true)
      pix.rect(24, 21, 3, 1, STONE_DARK, true)
      break
    case 'lute':
      pix.ellipse(25, 22, 3, 4, WOOD, true)
      pix.rect(24, 13, 2, 8, WOOD_DARK, true)
      pix.set(25, 21, GOLD)
      break
    case 'fork':
      pix.rect(25, 8, 1, 22, WOOD_DARK, true)
      pix.rect(23, 6, 1, 4, METAL, true)
      pix.rect(26, 6, 1, 4, METAL, true)
      pix.rect(23, 9, 4, 1, METAL, true)
      break
    case 'basket':
      pix.rect(22, 24, 7, 4, STRAW_DARK, true)
      pix.rect(23, 25, 5, 2, STRAW, true)
      pix.set(24, 23, CLOTH_GREEN)
      break
    case 'bag':
      pix.rect(23, 22, 5, 5, LEATHER, true)
      pix.rect(24, 21, 3, 1, LEATHER_DARK, true)
      break
    default:
      break
  }
}

/* ------------------------------- asset table ------------------------------ */

/** Every asset of the town scene: name, category, painter and outline pass. */
function buildAssets() {
  const assets = []
  const add = (category, name, paint, outline = true) =>
    assets.push({ category, name, width: SIZE, height: SIZE, paint, outline })

  // Ground: seamless 32x32 tiles, drawn edge to edge, never outlined.
  add('ground', 'grass', paintGrass, false)
  add('ground', 'path', paintPath, false)
  add('ground', 'cobble', paintCobble, false)
  add('ground', 'plaza', paintPlaza, false)
  add('ground', 'water', paintWaterTile, false)
  add('ground', 'farm', paintFarm, false)

  // Buildings and facilities.
  add('town', 'hall', paintHall)
  for (const name of Object.keys(HOUSE_ART)) {
    add('town', name, (pix) => paintHouse(pix, HOUSE_ART[name]))
  }
  add('town', 'shop', paintShop)
  add('town', 'tavern', paintTavern)
  add('town', 'smithy', paintSmithy)
  add('town', 'barracks', paintBarracks)
  add('town', 'hospital', paintHospital)
  add('town', 'school', paintSchool)
  add('town', 'mill', paintMill)
  add('town', 'barn', paintBarn)
  add('town', 'gate', paintGate)
  add('town', 'well', paintWell)
  add('town', 'fountain', paintFountain)

  // Street props.
  add('prop', 'barrel', paintBarrel)
  add('prop', 'crate', paintCrate)
  add('prop', 'cart', paintCart)
  add('prop', 'lamp', paintLamp)
  add('prop', 'tree', paintTree)
  add('prop', 'bush', paintBush)
  add('prop', 'signpost', paintSignpost)
  add('prop', 'haystack', paintHaystack)
  add('prop', 'banner', paintBanner)
  add('prop', 'fence', paintFence)

  // Townsfolk: one sprite per trade, both resident and recruitable.
  for (const name of Object.keys(NPC_ART)) {
    add('npc', name, (pix) => {
      paintPerson(pix, NPC_ART[name])
      paintHeld(pix, NPC_ART[name].hold)
    })
  }

  return assets
}

/* --------------------------------- pipeline -------------------------------- */

/**
 * Draw one asset: fresh transparent canvas, paint, one batched flush, export,
 * then close the tab so Pixelorama does not pile up 40 open projects.
 */
async function drawAsset(asset) {
  const path = join(OUT_ROOT, asset.category, `${asset.name}.png`)
  mkdirSync(dirname(path), { recursive: true })

  await cmd('create_canvas', {
    width: asset.width,
    height: asset.height,
    name: asset.name,
    fill_color: 'transparent'
  })
  const pix = new Pix(asset.width, asset.height)
  asset.paint(pix)
  if (asset.outline) pix.outline(OUTLINE)
  const pixels = pix.toPixels()
  if (pixels.length) await cmd('draw_pixels', { pixels })
  await cmd('export_image', { path, frame: 0, scale: 1 })
  await cmd('close_canvas', {})
  return {
    category: asset.category,
    name: asset.name,
    width: asset.width,
    height: asset.height,
    pixels: pixels.length
  }
}

async function main() {
  const wanted = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  const all = buildAssets().sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  const assets = wanted.length
    ? all.filter((a) => wanted.includes(a.category) || wanted.includes(a.name))
    : all
  if (!assets.length) {
    console.error(`no assets matched ${wanted.join(', ') || '(nothing)'}`)
    process.exit(1)
  }

  try {
    const health = await fetch(`${BRIDGE_URL}/health`).then((r) => r.json())
    console.log(`bridge ok: ${health.server} / ${health.pixelorama_version}`)
  } catch {
    console.error(`cannot reach the Pixelorama bridge at ${BRIDGE_URL} — is Pixelorama open?`)
    process.exit(1)
  }

  for (const asset of assets) {
    const info = await drawAsset(asset)
    console.log(`  ✓ ${info.category}/${info.name}.png  ${info.width}x${info.height}  (${info.pixels} px)`)
  }

  // The manifest lists the complete set of this generator, merged with the
  // rows the world-map generator owns.
  const index = all.map((a) => ({ category: a.category, name: a.name, width: a.width, height: a.height }))
  const merged = writeIndex(join(OUT_ROOT, 'index.json'), index)
  console.log(`\n${assets.length} assets drawn, ${merged.length} listed in public/pixel/index.json`)
}

main().catch((error) => {
  console.error(`\nFAILED: ${error.message}`)
  process.exit(1)
})
