/**
 * Pixel asset generator for kids-war-game.
 *
 * Drives Pixelorama through the local REST bridge registered as the
 * `pixelorama` MCP server in the repository root `.mcp.json`. The bridge
 * exposes the same command names the MCP tools wrap, so a plain script can
 * rasterize art with no MCP client attached:
 *
 *   create_canvas -> draw_pixels -> export_image -> close_canvas
 *
 * Every asset is authored on a 32x32 design grid and exported at `scale: 1`,
 * so the PNG on disk matches the authored grid pixel for pixel. The game then
 * draws those files at integer screens scales (`image-rendering: pixelated` in
 * the DOM, nearest-neighbour on canvas), which is what keeps the art crisp.
 *
 * Palette and shapes follow the game's own art direction: warm parchment,
 * gold trim and dark brown outlines, flat top-down shapes with a two-tone
 * body so a 32px sprite still reads against the terrain.
 *
 * Usage (Pixelorama must be open with the bridge listening on :7373):
 *   node tools/pixel-assets/generate.mjs                  # every asset
 *   node tools/pixel-assets/generate.mjs unit commander   # only some categories
 *   node tools/pixel-assets/generate.mjs militia          # one single asset
 */

import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// The faction table is the single source of truth for the faction colours: the
// world map legend, the minimap and this generator all read the same values.
import { FACTIONS } from '../../src/game/factions.js'

import {
  BRIDGE_URL,
  Pix,
  cmd,
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
  HORSE,
  HORSE_DARK,
  HOOF,
  CANOPY,
  CANOPY_DARK,
  CANOPY_LIGHT,
  STONE,
  STONE_DARK,
  STONE_LIGHT,
  SNOW,
  SAND,
  SAND_DARK,
  FOAM,
  STRAW,
  STRAW_DARK,
  CAPE_RED,
  shade,
  writeIndex
} from './pixkit.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT_ROOT = join(ROOT, 'public/pixel')
const SIZE = 32


/* ---------------------------- shared shapes ---------------------------- */

/**
 * Boots, legs, torso, belt, arms, hands and a bare head. Everything else
 * (helmet, weapon, shield, cape, horse) is layered on top by the callers, so
 * every unit sprite shares one body plan and reads as one army.
 */
function paintBody(pix, art) {
  // Legs and boots.
  pix.rect(12, 21, 4, 8, art.clothDark, true)
  pix.rect(17, 21, 4, 8, art.clothDark, true)
  pix.rect(11, 28, 5, 3, LEATHER, true)
  pix.rect(17, 28, 5, 3, LEATHER, true)
  pix.rect(11, 30, 5, 1, LEATHER_DARK, true)
  pix.rect(17, 30, 5, 1, LEATHER_DARK, true)

  // Torso, with a dark collar row so the head never melts into the shoulders.
  pix.rect(11, 14, 11, 8, art.cloth, true)
  pix.rect(10, 14, 13, 3, art.cloth, true)
  pix.rect(10, 13, 13, 1, art.clothDark, true)
  pix.rect(10, 21, 13, 2, LEATHER, true)
  pix.rect(15, 21, 3, 2, GOLD, true)

  // Arms are one tone darker than the tunic, so they read as separate limbs
  // instead of one wide block at 32px.
  pix.rect(8, 15, 3, 7, art.clothDark, true)
  pix.rect(22, 15, 3, 7, art.clothDark, true)
  pix.rect(8, 22, 3, 3, SKIN, true)
  pix.rect(22, 22, 3, 3, SKIN, true)

  // Head. A chibi r5 head is what keeps the silhouette readable at this size.
  pix.circle(16, 9, 5, SKIN, true)
  pix.rect(14, 13, 5, 1, SKIN_DARK, true)
  pix.set(14, 11, OUTLINE)
  pix.set(18, 11, OUTLINE)
}

/** Helmet styles: a peasant cap, a nose-guarded helm, a hood, a crest and a plume. */
function paintHelm(pix, art) {
  const kind = art.helm
  if (kind === 'hood') {
    // The dome stops one row above the eyes and the side panels frame the
    // face, so the hood still shows a face rather than a green blob.
    pix.circle(16, 9, 6, art.clothDark, true, 3, 9)
    pix.rect(9, 9, 3, 6, art.clothDark, true)
    pix.rect(20, 9, 3, 6, art.clothDark, true)
    pix.rect(11, 3, 10, 2, art.cloth, true)
    pix.rect(12, 9, 8, 1, art.cloth, true)
    return
  }

  pix.circle(16, 8, 5, METAL, true, 3, 8)
  pix.rect(11, 8, 10, 1, METAL_DARK, true)
  pix.rect(12, 4, 6, 1, METAL)
  if (kind === 'cap') {
    pix.circle(16, 8, 5, art.cloth, true, 3, 8)
    pix.rect(10, 8, 13, 1, art.clothDark, true)
    pix.rect(10, 7, 13, 1, GOLD_DARK, true)
    return
  }
  // Spearman, elite spearman and knight share the metal dome, then differ by
  // finish (crest, plume or none).
  pix.rect(15, 8, 3, 4, METAL_DARK, true)
  if (kind === 'crest') {
    pix.rect(15, 1, 3, 3, art.accent, true)
    pix.rect(16, 0, 1, 1, GOLD)
  } else if (kind === 'plume') {
    pix.rect(14, 0, 5, 3, art.accent, true)
    pix.rect(16, 0, 1, 4, GOLD_DARK, true)
  }
}

/** Weapons: club, sword, spear, bow and lance. */
function paintWeapon(pix, art) {
  switch (art.weapon) {
    case 'club':
      pix.stroke(22, 23, 26, 13, 3, WOOD)
      pix.circle(26, 11, 3, WOOD, true)
      pix.circle(26, 11, 3, WOOD_DARK, false)
      break
    case 'sword':
      pix.rect(25, 5, 2, 14, METAL, true)
      pix.rect(25, 5, 1, 14, METAL_DARK, true)
      pix.rect(23, 18, 7, 2, GOLD_DARK, true)
      pix.rect(25, 20, 2, 4, LEATHER_DARK, true)
      break
    case 'spear': {
      // Footman's pike: a long shaft angled up out of the right hand, with a
      // metal leaf tip above the shoulder. It runs from (21, 27) to (28, 5) and
      // the tip polygon stops two pixels short of the right edge, so the
      // outline pass still has room on every side.
      pix.stroke(21, 27, 27, 5, 3, WOOD)
      pix.stroke(21, 28, 28, 6, 1, WOOD_DARK)
      pix.poly(
        [
          [25, 8],
          [28, 1],
          [30, 10]
        ],
        METAL
      )
      break
    }
    case 'bow':
      // Longbow held vertically: the chord doubles as the string and the belly
      // bulges to the right, leaving one pixel for the outline.
      for (let i = 0; i <= 20; i += 1) {
        const a = ((-88 + (176 * i) / 20) * Math.PI) / 180
        pix.set(22 + Math.cos(a) * 8, 16 + Math.sin(a) * 8, WOOD)
        pix.set(22 + Math.cos(a) * 7.2, 16 + Math.sin(a) * 7.2, WOOD_DARK)
      }
      pix.line(22, 8, 22, 24, '#efe7d2')
      break
    case 'lance': {
      // A rider's hand sits higher on the reins than a foot soldier's.
      const sy = art.mounted ? 17 : 24
      const ty = art.mounted ? 6 : 5
      pix.stroke(21, sy, 27, ty, 3, WOOD)
      pix.stroke(21, sy + 1, 27, ty + 1, 1, WOOD_DARK)
      pix.poly(
        [
          [26, ty + 2],
          [29, ty - 3],
          [30, ty + 5]
        ],
        METAL
      )
      break
    }
  }
}

/** Round shield with a gold boss, hung on the left arm. */
function paintShield(pix, art) {
  pix.roundRect(3, 13, 8, 11, 3, art.clothDark, true)
  pix.roundRect(4, 14, 6, 9, 2, art.cloth, true)
  pix.circle(7, 18, 2, GOLD, true)
  pix.rect(3, 17, 8, 1, art.accent || GOLD_DARK, true)
}

/** A cloak behind the torso: narrow at the shoulders, flaring to the hem. */
function paintCape(pix, color) {
  for (let y = 12; y <= 24; y += 1) {
    const grow = Math.round((y - 12) * 0.45)
    pix.rect(10 - grow, y, 12 + grow * 2, 1, color, true)
  }
  pix.rect(6, 24, 20, 1, OUTLINE, true)
  pix.rect(10, 12, 12, 1, GOLD_DARK, true)
}

/* ------------------------------ characters ------------------------------ */

/**
 * The roster art: militia plus a basic and an elite look for each tiered
 * family. Lower ranks (初级 / 中级) wear the plain sprite, upper ranks
 * (高级 / 精英) the crest, plume or caped version of it.
 */
const UNIT_ART = {
  militia: { cloth: '#c2aa73', clothDark: '#8c7748', helm: 'cap', weapon: 'club' },
  spearman: { cloth: '#8fa2b3', clothDark: '#5c6e80', helm: 'helm', weapon: 'spear', shield: true, accent: '#5c6e80' },
  'spearman-elite': { cloth: '#6f88c0', clothDark: '#455c8c', helm: 'crest', weapon: 'spear', shield: true, accent: '#d8533f' },
  archer: { cloth: '#a6c98a', clothDark: '#6c8f57', helm: 'hood', weapon: 'bow' },
  marksman: { cloth: '#7fc7b0', clothDark: '#4f8d78', helm: 'hood', weapon: 'bow', accent: '#e8c56a', cape: true },
  cavalry: { cloth: '#c99a6a', clothDark: '#8f6a44', helm: 'cap', weapon: 'lance', mounted: true },
  knight: { cloth: '#d8b45a', clothDark: '#a17f2c', helm: 'plume', weapon: 'lance', mounted: true, accent: '#d8533f' }
}

/** A rider on a horse: the horse sits below the saddle line, the rider above. */
function paintMount(pix, art) {
  // Horse body, with the chest and rump shaded either side of the caparison.
  pix.roundRect(2, 16, 24, 9, 4, HORSE, true)
  pix.rect(2, 18, 2, 6, HORSE_DARK, true)
  pix.rect(24, 18, 2, 6, HORSE_DARK, true)
  // Hind legs then forelegs, with hooves along the bottom row.
  pix.rect(5, 24, 3, 8, HORSE_DARK, true)
  pix.rect(10, 24, 3, 8, HORSE, true)
  pix.rect(18, 24, 3, 8, HORSE, true)
  pix.rect(23, 24, 3, 8, HORSE_DARK, true)
  for (const x of [5, 10, 18, 23]) pix.rect(x, 30, 3, 1, HOOF, true)
  // Neck, head, ears, mane and tail, clear of the canvas edges.
  pix.stroke(21, 20, 26, 12, 5, HORSE)
  pix.rect(24, 9, 6, 5, HORSE, true)
  pix.rect(27, 12, 3, 3, HORSE_DARK, true)
  pix.rect(24, 7, 2, 2, HORSE_DARK, true)
  pix.rect(28, 7, 2, 2, HORSE_DARK, true)
  pix.set(28, 11, OUTLINE)
  pix.stroke(22, 17, 26, 10, 2, HORSE_DARK)
  pix.stroke(6, 17, 3, 23, 2, HORSE_DARK)
  // Caparison and saddle cover the middle of the back only.
  pix.roundRect(7, 16, 14, 6, 2, art.clothDark, true)
  pix.rect(8, 18, 12, 1, art.cloth, true)
  pix.rect(7, 21, 14, 1, GOLD_DARK, true)

  // Rider: torso above the saddle, arms on the reins, then head and helmet.
  pix.rect(11, 8, 10, 9, art.cloth, true)
  pix.rect(10, 8, 12, 2, art.clothDark, true)
  pix.rect(8, 11, 3, 5, art.clothDark, true)
  pix.rect(21, 11, 3, 5, art.clothDark, true)
  pix.rect(13, 7, 6, 1, SKIN_DARK, true)
  pix.circle(16, 4, 5, SKIN, true)
  pix.set(14, 7, OUTLINE)
  pix.set(18, 7, OUTLINE)
  pix.circle(16, 3, 5, METAL, true, 0, 3)
  pix.rect(11, 3, 10, 1, METAL_DARK, true)
  pix.rect(15, 3, 3, 4, METAL_DARK, true)
  if (art.helm === 'plume') {
    pix.rect(14, 0, 5, 2, art.accent, true)
    pix.rect(16, 0, 1, 3, GOLD_DARK, true)
  }
  // Stirruped leg hanging down the horse's flank.
  pix.rect(8, 16, 3, 6, art.cloth, true)
  pix.rect(8, 22, 3, 2, LEATHER, true)
}

/** The lord: gold plate, a red cloak, a raised sword and a starred shield. */
function paintLord(pix, art) {
  paintCape(pix, CAPE_RED)
  paintBody(pix, art)
  pix.rect(15, 14, 3, 6, GOLD, true)
  pix.rect(10, 17, 13, 1, GOLD_DARK, true)
  pix.circle(16, 8, 5, METAL, true, 3, 8)
  pix.rect(11, 8, 10, 1, GOLD_DARK, true)
  pix.rect(15, 8, 3, 4, METAL_DARK, true)
  pix.rect(14, 1, 5, 3, CAPE_RED, true)
  pix.rect(16, 0, 1, 4, GOLD, true)
  pix.rect(25, 4, 2, 16, METAL, true)
  pix.rect(25, 4, 1, 16, METAL_DARK, true)
  pix.rect(23, 18, 7, 2, GOLD, true)
  pix.rect(25, 20, 2, 4, LEATHER_DARK, true)
  pix.roundRect(3, 12, 9, 12, 3, METAL_DARK, true)
  pix.roundRect(4, 13, 7, 10, 2, GOLD, true)
  pix.circle(7, 18, 2, GOLD_DARK, true)
}

/* ------------------------------ settlements ------------------------------ */

/** Walled town: two battlement towers, a curtain wall, a gate and a pennant. */
function paintTown(pix) {
  // Curtain wall with mortar lines.
  pix.rect(5, 17, 22, 13, STONE, true)
  for (let y = 19; y <= 29; y += 3) pix.rect(6, y, 20, 1, STONE_DARK, true)
  pix.rect(5, 17, 22, 2, STONE_LIGHT, true)
  // Towers with crenellations.
  pix.rect(2, 8, 8, 22, STONE, true)
  pix.rect(22, 8, 8, 22, STONE, true)
  pix.rect(2, 8, 8, 2, STONE_LIGHT, true)
  pix.rect(22, 8, 8, 2, STONE_LIGHT, true)
  for (let x = 2; x <= 9; x += 3) pix.rect(x, 5, 2, 3, STONE, true)
  for (let x = 22; x <= 29; x += 3) pix.rect(x, 5, 2, 3, STONE, true)
  // Gate with a portcullis and a torch-lit arch.
  pix.circle(16, 24, 5, OUTLINE, true, 22, 27)
  pix.rect(12, 24, 9, 6, '#4a3826', true)
  pix.rect(15, 24, 3, 6, OUTLINE, true)
  pix.rect(11, 27, 11, 3, STONE_DARK, true)
  // Pennant on the left tower.
  pix.rect(5, 1, 1, 5, LEATHER_DARK, true)
  pix.poly(
    [
      [6, 1],
      [12, 3],
      [6, 5]
    ],
    GOLD
  )
}

/** Village: two thatched huts with doors, plus a hay bale between them. */
function paintVillage(pix) {
  const hut = (ox, oy, w, roofH) => {
    pix.rect(ox + 2, oy + roofH, w - 4, 10, '#e0d3b4', true)
    pix.rect(ox + 2, oy + roofH, w - 4, 2, '#c8b998', true)
    pix.poly(
      [
        [ox - 1, oy + roofH + 1],
        [ox + w / 2, oy - 1],
        [ox + w, oy + roofH + 1]
      ],
      STRAW
    )
    pix.poly(
      [
        [ox - 1, oy + roofH + 1],
        [ox + w / 2, oy - 1],
        [ox + w / 2, oy + roofH + 1]
      ],
      STRAW_DARK
    )
    pix.rect(ox + Math.floor(w / 2) - 2, oy + roofH + 4, 4, 6, OUTLINE, true)
  }
  hut(3, 9, 14, 9)
  hut(18, 13, 12, 7)
  pix.roundRect(15, 24, 5, 5, 2, STRAW, true)
  pix.rect(15, 27, 5, 1, STRAW_DARK, true)
}

/* ------------------------------- commanders ------------------------------- */

/**
 * Map marker for a roaming warband: one commander figure per hostile faction,
 * with the faction colour on his cloth, so the party icon the world map draws,
 * the legend beside it and the minimap all agree about who is who. The helmet,
 * cape, shield and horse keep the three silhouettes apart at 32 px.
 *
 * Colours come from `src/game/factions.js`, the same table the legend reads.
 */
const COMMANDERS = {
  bandit: { helm: 'hood', weapon: 'sword', mask: true },
  wolf: { helm: 'crest', weapon: 'sword', cape: true, shield: true, mark: 'wolf' },
  eagle: { helm: 'plume', weapon: 'lance', mounted: true, mark: 'eagle' }
}

/** Faction colour plus the light and dark shades the shared body plan wants. */
function commanderArt(key) {
  const cloth = FACTIONS[key].color
  return {
    ...COMMANDERS[key],
    cloth,
    clothLight: shade(cloth, 0.2),
    clothDark: shade(cloth, -0.32),
    accent: shade(cloth, 0.35)
  }
}

/** Bandit domino mask: a dark band across the eye line with two pale eye holes. */
function paintMask(pix) {
  pix.roundRect(12, 10, 9, 3, 1, '#2f2a24', true)
  pix.rect(13, 11, 2, 1, '#f2ead6', true)
  pix.rect(18, 11, 2, 1, '#f2ead6', true)
}

/** Wolf mark where the shield boss would be: two ears, a muzzle, a dark eye. */
function paintWolfMark(pix, cx, cy) {
  pix.poly(
    [
      [cx - 1, cy - 1],
      [cx - 3, cy - 4],
      [cx - 3, cy]
    ],
    '#e6eaf0'
  )
  pix.poly(
    [
      [cx + 1, cy - 1],
      [cx + 3, cy - 4],
      [cx + 3, cy]
    ],
    '#e6eaf0'
  )
  pix.roundRect(cx - 3, cy - 1, 6, 5, 2, '#e6eaf0', true)
  pix.rect(cx + 2, cy + 1, 2, 2, '#c6ccd6', true)
  pix.set(cx - 1, cy, '#26262a')
  pix.set(cx + 2, cy, '#26262a')
}

/** Eagle charge on the knight's tabard: two dark wings, a body, a gold head. */
function paintEagleMark(pix, cx, cy) {
  pix.poly(
    [
      [cx, cy],
      [cx - 4, cy - 2],
      [cx - 4, cy + 2]
    ],
    '#2b2116'
  )
  pix.poly(
    [
      [cx, cy],
      [cx + 4, cy - 2],
      [cx + 4, cy + 2]
    ],
    '#2b2116'
  )
  pix.rect(cx - 1, cy - 2, 3, 5, '#2b2116', true)
  pix.set(cx, cy - 3, GOLD)
  pix.set(cx + 1, cy - 3, GOLD_DARK)
}

/**
 * Commanders reuse the shared body plan, so a faction leader still reads as
 * part of the same army as the soldiers: cape first (it sits behind the torso),
 * then body, helmet, face mask, shield with its heraldic mark, then the weapon.
 */
function paintCommander(pix, art) {
  if (art.mounted) {
    paintMount(pix, art)
    // The charge sits on the rider's tabard: the chest is the one large flat
    // area of a mounted sprite that nothing else covers.
    if (art.mark === 'eagle') paintEagleMark(pix, 16, 12)
    paintWeapon(pix, art)
    return
  }
  if (art.cape) paintCape(pix, art.clothDark)
  paintBody(pix, art)
  paintHelm(pix, art)
  if (art.mask) paintMask(pix)
  if (art.shield) {
    paintShield(pix, art)
    if (art.mark === 'wolf') paintWolfMark(pix, 7, 18)
  }
  paintWeapon(pix, art)
}

/* -------------------------------- terrain -------------------------------- */

/** Forest tile decoration: a broadleaf tree and a pine, both on trunks. */
function paintForest(pix) {
  pix.rect(9, 18, 3, 12, WOOD_DARK, true)
  pix.rect(10, 19, 1, 11, WOOD, true)
  pix.roundRect(2, 5, 17, 15, 7, CANOPY, true)
  pix.roundRect(4, 7, 8, 4, 2, CANOPY_LIGHT, true)
  pix.roundRect(14, 12, 6, 5, 2, CANOPY_DARK, true)
  pix.rect(22, 20, 3, 10, WOOD_DARK, true)
  pix.rect(23, 21, 1, 9, WOOD, true)
  pix.poly(
    [
      [24, 6],
      [17, 16],
      [31, 16]
    ],
    CANOPY_DARK
  )
  pix.poly(
    [
      [24, 11],
      [19, 20],
      [29, 20]
    ],
    CANOPY
  )
}

/** Mountain tile decoration: a single peak with a snow cap and a light face. */
function paintMountain(pix) {
  pix.poly(
    [
      [1, 30],
      [15, 4],
      [30, 30]
    ],
    STONE
  )
  pix.poly(
    [
      [15, 4],
      [30, 30],
      [16, 30]
    ],
    STONE_DARK
  )
  pix.poly(
    [
      [15, 4],
      [10, 12],
      [15, 10],
      [20, 13]
    ],
    SNOW
  )
  pix.line(15, 13, 8, 27, STONE_LIGHT)
  pix.line(16, 14, 23, 27, '#6f6659')
}

/** Water tile decoration: two foam crests riding on the blue tile behind. */
function paintWater(pix) {
  const wave = (x0, y0, w) => {
    pix.stroke(x0, y0, x0 + w / 2, y0 - 5, 2, FOAM)
    pix.stroke(x0 + w / 2, y0 - 5, x0 + w, y0, 2, FOAM)
    pix.set(x0 + w / 2 + 2, y0 - 6, '#cfe6f2')
  }
  wave(2, 14, 13)
  wave(16, 24, 13)
}

/** Desert tile decoration: a dune ridge with pebbles and dry tufts. */
function paintDesert(pix) {
  pix.poly(
    [
      [2, 28],
      [11, 14],
      [22, 28]
    ],
    SAND
  )
  pix.poly(
    [
      [16, 28],
      [24, 16],
      [31, 28]
    ],
    SAND_DARK
  )
  pix.rect(3, 27, 26, 2, SAND_DARK, true)
  pix.rect(6, 22, 2, 2, '#9c8248', true)
  pix.rect(26, 24, 2, 2, '#9c8248', true)
  pix.stroke(21, 27, 22, 22, 1, '#8a7238')
  pix.stroke(22, 27, 24, 23, 1, '#8a7238')
  pix.stroke(23, 27, 26, 24, 1, '#8a7238')
}

/* --------------------------------- camp ---------------------------------- */

/**
 * Camp marker drawn on the world map while the lord is camping: a ridge tent
 * with a campfire burning beside it, so a frozen clock is visible at a glance.
 */
function paintCamp(pix) {
  const CLOTH = '#e3d2a8'
  const CLOTH_DARK = '#bda275'
  const CLOTH_SHADE = '#8c7444'
  const FIRE = '#e0873a'
  const FIRE_CORE = '#ffe9a8'

  // Tent: cone with a shaded right face, a dark doorway and a ridge pole.
  pix.poly(
    [
      [12, 5],
      [2, 25],
      [22, 25]
    ],
    CLOTH
  )
  pix.poly(
    [
      [12, 5],
      [22, 25],
      [12, 25]
    ],
    CLOTH_DARK
  )
  pix.poly(
    [
      [12, 13],
      [7, 25],
      [17, 25]
    ],
    CLOTH_SHADE
  )
  pix.poly(
    [
      [12, 13],
      [17, 25],
      [12, 25]
    ],
    OUTLINE
  )
  pix.rect(11, 4, 2, 3, WOOD_DARK, true)

  // Campfire: crossed logs, flame and a bright core.
  pix.rect(21, 24, 8, 2, WOOD_DARK, true)
  pix.rect(23, 22, 4, 2, WOOD, true)
  pix.poly(
    [
      [25, 13],
      [21, 24],
      [29, 24]
    ],
    FIRE
  )
  pix.poly(
    [
      [25, 17],
      [23, 24],
      [27, 24]
    ],
    GOLD
  )
  pix.rect(25, 20, 1, 3, FIRE_CORE, true)
}

/* --------------------------------- runner --------------------------------- */

function buildAssets() {
  const assets = []
  const add = (category, name, paint, outline = true) =>
    assets.push({ category, name, width: SIZE, height: SIZE, paint, outline })

  // Units: one body plan, one sprite per look.
  for (const [name, art] of Object.entries(UNIT_ART)) {
    if (art.cape) add('unit', name, (pix) => {
      paintCape(pix, art.clothDark)
      paintBody(pix, art)
      paintHelm(pix, art)
      paintWeapon(pix, art)
    })
    else if (art.mounted) add('unit', name, (pix) => {
      paintMount(pix, art)
      paintWeapon(pix, art)
    })
    else add('unit', name, (pix) => {
      paintBody(pix, art)
      paintHelm(pix, art)
      if (art.shield) paintShield(pix, art)
      paintWeapon(pix, art)
    })
  }

  add('unit', 'lord', (pix) => paintLord(pix, { cloth: '#cfae58', clothDark: '#8f7429' }))

  add('settlement', 'town', paintTown)
  add('settlement', 'village', paintVillage)

  // One commander per hostile faction: the icon the world map draws for a
  // roaming warband, and the icon the legend shows next to the faction colour.
  for (const name of Object.keys(COMMANDERS)) {
    add('commander', name, (pix) => paintCommander(pix, commanderArt(name)))
  }

  add('terrain', 'forest', paintForest, false)
  add('terrain', 'mountain', paintMountain, false)
  add('terrain', 'water', paintWater, false)
  add('terrain', 'desert', paintDesert, false)
  add('terrain', 'camp', paintCamp)

  return assets
}

/**
 * Draw one asset: fresh transparent canvas, paint, one batched flush, export,
 * then close the tab so Pixelorama does not pile up 30 open projects.
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
  // Sorted so the index file is stable and easy to diff.
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

  // The manifest always lists the complete set, never just this run's subset.
  // The town generator writes the same file for its own categories, so the
  // write merges instead of replacing the whole list.
  const index = all.map((a) => ({ category: a.category, name: a.name, width: a.width, height: a.height }))
  const merged = writeIndex(join(OUT_ROOT, 'index.json'), index)
  console.log(`\n${assets.length} assets drawn, ${merged.length} listed in public/pixel/index.json`)
}

main().catch((error) => {
  console.error(`\nFAILED: ${error.message}`)
  process.exit(1)
})
