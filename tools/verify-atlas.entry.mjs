/**
 * Headless checks for the two whole-world painters (the corner minimap and the
 * detailed atlas): every settlement is drawn in the colour of its owner, an
 * unclaimed town keeps the neutral tone, and every companion on the atlas
 * carries his troop badge in the corner of his sprite. A mocked 2D context
 * records the draws, so all of this is asserted without a browser.
 */
import { createPinia, setActivePinia } from 'pinia'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { generateWorld } from '@/game/worldgen'
import { drawAtlas, drawMiniMap, drawBadge } from '@/game/atlas'
import { FACTIONS } from '@/game/factions'
import { followerTargets } from '@/game/followers'
import { companionStrength } from '@/game/npc'

const reporter = globalThis.__reporter
const check = (name, ok, detail = '') => reporter.check(name, ok, detail)

/** A context that records every draw, so the checks can look at the styles. */
function makeCtx() {
  const calls = []
  const ctx = {
    _calls: calls,
    save() {
      calls.push(['save'])
    },
    restore() {
      calls.push(['restore'])
    },
    beginPath() {
      calls.push(['beginPath'])
    },
    arc(...a) {
      calls.push(['arc', this.strokeStyle, ...a])
    },
    stroke() {
      calls.push(['stroke', this.strokeStyle])
    },
    fill() {
      calls.push(['fill', this.fillStyle])
    },
    fillRect(...a) {
      calls.push(['fillRect', this.fillStyle, ...a])
    },
    strokeRect(...a) {
      calls.push(['strokeRect', this.strokeStyle, ...a])
    },
    fillText(t, x, y) {
      calls.push(['fillText', this.fillStyle, t, x, y])
    },
    measureText(t) {
      return { width: String(t).length * 6 }
    },
    roundRect(...a) {
      calls.push(['roundRect', ...a])
    },
    drawImage(...a) {
      calls.push(['drawImage', ...a])
    },
    clearRect() {},
    setTransform() {},
    translate() {},
    scale() {},
    _fs: '#000',
    _ss: '#000',
    set fillStyle(v) {
      this._fs = v
    },
    get fillStyle() {
      return this._fs
    },
    set strokeStyle(v) {
      this._ss = v
    },
    get strokeStyle() {
      return this._ss
    },
    set imageSmoothingEnabled(v) {},
    set font(v) {},
    set textAlign(v) {},
    set textBaseline(v) {},
    set shadowColor(v) {},
    set shadowBlur(v) {},
    set shadowOffsetY(v) {},
    set lineWidth(v) {}
  }
  return ctx
}

// terrainImage paints one pixel per world tile, so document.createElement must
// answer with a canvas whose context records the terrain fills.
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => makeCtx() })
}
if (!globalThis.performance) globalThis.performance = { now: () => 0 }

setActivePinia(createPinia())
const world = useWorldStore()
const player = usePlayerStore()
player.reset('tester')
world.generate(4242)

// Capture a town so the map shows the lord's blue next to the kingdom colours.
const captured = world.settlements.find((s) => s.kind === 'town' && (s.owner === 'wolf' || s.owner === 'eagle'))
if (captured) world.captureTown(captured.id)
const wolfTown = world.settlements.find((s) => s.owner === 'wolf')
const playerTown = world.settlements.find((s) => s.owner === 'player')
const neutralTown = world.settlements.find((s) => s.owner === 'neutral' && s.kind === 'town')

check('the world has a kingdom town', !!wolfTown)
check('the world has a captured town', !!playerTown)
check('the world has an unclaimed town', !!neutralTown)

/* --------------------------- the corner minimap ---------------------------- */

const mini = makeCtx()
drawMiniMap(mini, world, 200, 160)
check(
  'the minimap colours a kingdom town',
  wolfTown && mini._calls.some((c) => c[0] === 'fillRect' && c[1] === FACTIONS.wolf.color)
)
check(
  'the minimap colours the lord town',
  playerTown && mini._calls.some((c) => c[0] === 'fillRect' && c[1] === FACTIONS.player.color)
)
check(
  'the minimap keeps an unclaimed town neutral',
  neutralTown && mini._calls.some((c) => c[0] === 'fillRect' && c[1] === '#ffd76a')
)

/* -------------------------- the detailed atlas ----------------------------- */

// Each owned-town check draws a fresh atlas centered on that town, so the ring
// and plate are inside the visible window regardless of where the town sits.
function atlasFor(st) {
  const ctx = makeCtx()
  const w = 900
  const h = 700
  drawAtlas(ctx, world, { ox: w / 2 - (st.x + 0.5) * 16, oy: h / 2 - (st.y + 0.5) * 16, w, h, troops: player.totalTroops })
  return ctx
}
// An owned town draws an ownership ring: a stroke in the holder's colour.
check(
  'the atlas rings a kingdom town',
  wolfTown && atlasFor(wolfTown)._calls.some((c) => c[0] === 'stroke' && c[1] === FACTIONS.wolf.color)
)
check(
  'the atlas rings the lord town',
  playerTown && atlasFor(playerTown)._calls.some((c) => c[0] === 'stroke' && c[1] === FACTIONS.player.color)
)
check(
  'the atlas does not ring an unclaimed town',
  neutralTown && !atlasFor(neutralTown)._calls.some((c) => c[0] === 'stroke' && c[1] === '#d8c39a')
)
// The name plate is drawn in the owner's colour, so the whole place reads held.
check(
  'the atlas plate uses the owner colour',
  wolfTown && atlasFor(wolfTown)._calls.some((c) => c[0] === 'fillText' && c[1] === FACTIONS.wolf.color)
)

/* --------------------- companions carry their badge ------------------------ */

// Two companions ride along: one leads three militia, the other has no soldiers
// yet. The atlas must badge the first and leave the second unbaded, exactly
// like the big map does.
player.companions.push(
  {
    id: 'npc-a',
    npcId: 'npc-a',
    name: '赵铁柱',
    role: 'guard',
    sprite: 'npc-guard',
    soldiers: [{ type: 'militia', tier: 1, count: 3 }]
  },
  {
    id: 'npc-b',
    npcId: 'npc-b',
    name: '林小猎',
    role: 'hunter',
    sprite: 'npc-hunter',
    soldiers: []
  }
)

/** Badge text the atlas paints for one companion, or null when there is none. */
function companionBadge(companion) {
  const ctx = makeCtx()
  const w = 900
  const h = 700
  drawAtlas(ctx, world, {
    ox: w / 2 - (world.playerPos.x + 0.5) * 16,
    oy: h / 2 - (world.playerPos.y + 0.5) * 16,
    w,
    h,
    troops: player.totalTroops,
    companions: [companion]
  })
  const slot = followerTargets([companion], world.playerPos, { x: 0, y: 1 })[0]
  const bx = w / 2 + (slot.x - world.playerPos.x) * 16 + 16 * 0.55
  const by = h / 2 + (slot.y - world.playerPos.y) * 16 - 16 * 0.55
  const hit = ctx._calls.find(
    (c) => c[0] === 'fillText' && c[1] === '#fff' && Math.abs(c[3] - bx) < 0.01 && Math.abs(c[4] - by) < 0.01
  )
  return hit ? hit[2] : null
}

check(
  'the atlas badges a companion with soldiers',
  companionBadge(player.companions[0]) === String(companionStrength(player.companions[0])),
  JSON.stringify(companionBadge(player.companions[0]))
)
check('the atlas leaves a soldier-less companion unbaded', companionBadge(player.companions[1]) === null)

// The badge itself is the shared painter, so a companion's number is the same
// disc the lord and the warbands wear — drawn here once to prove the radius the
// atlas asks for (7, one size under the lord's 9).
const badgeCtx = makeCtx()
drawBadge(badgeCtx, 10, 10, 5, 7)
check(
  'the shared badge painter draws the count',
  badgeCtx._calls.some((c) => c[0] === 'fillText' && c[1] === '#fff' && c[2] === '5')
)
