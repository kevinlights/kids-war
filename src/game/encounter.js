/**
 * Meeting a hostile warband on the world map.
 *
 * A party that reaches the lord does not drag him straight into the arena any
 * more: the two sides stop and talk first. This module owns the words, the
 * enemy roster readout and the place the lord can run to, so the dialog stays
 * a thin view and the rules can be checked without a browser.
 *
 * 与敌军在世界地图上相遇时，双方先停下来说话，而不是直接进入战场。
 * 本模块负责台词、敌军构成与逃跑落点，界面只负责显示，规则可以在无浏览器的情况下校验。
 */
import { factionOf } from './factions'
import { TERRAIN } from './terrain'
import { WORLD_W, WORLD_H } from './worldgen'
import { unitName, unitSprite } from './units'

/** The shortest and longest dash the lord can make when he runs. */
export const FLEE_MIN_DISTANCE = 3
export const FLEE_MAX_DISTANCE = 6

/**
 * Real seconds the party waits before it may chase the lord again. It is
 * counted in game time, so a frozen clock also freezes the grace period.
 * 敌人再次追赶前等待的游戏秒数；时钟冻结时这段宽限也一并冻结。
 */
export const FLEE_COOLDOWN = 30

/**
 * What each hostile faction says when it corners the lord.
 *
 * The greeting is the opening line of the dialog, a reply is what the leader
 * shouts back when the child picks 「🗣️ 喊话」. Every line is short enough to
 * fit a phone screen without scrolling.
 * 每个敌对势力在拦住主角时说的话。开场白用于对话框，回答用于「🗣️ 喊话」。
 */
export const ENCOUNTER_TALK = {
  bandit: {
    mood: '拦路的强盗',
    greeting: [
      '站住！这条路今天归我们管。把干粮和金币留下，人可以走。',
      '哟，肥羊自己送上门了。瞧你这点人马，还想从这儿过去？',
      '别紧张，我们只抢东西，不抢命——除非你非要反抗。'
    ],
    replies: [
      '少废话！兄弟们，围上去！',
      '胆子不小。可惜你的兵看起来比你的嘴软。',
      '哈哈，等你打赢了，再说大话也不迟！'
    ]
  },
  wolf: {
    mood: '苍狼王国的巡逻队',
    greeting: [
      '苍狼王国的土地上，不允许来历不明的队伍通行。报上名来。',
      '你的旗帜我从未见过。是敌是友，用刀剑说清楚。',
      '放下武器可以免死；顽抗，就葬在这片山坡上。'
    ],
    replies: [
      '那就让苍狼的旗，再染一次血。',
      '你的勇气用错了地方。',
      '很好。我正缺一场像样的战斗。'
    ]
  },
  eagle: {
    mood: '赤鹰王国的铁骑',
    greeting: [
      '赤鹰的铁骑已经围住你了。放下武器，还能留一条命。',
      '前面是赤鹰王国的疆界，你的队伍已经越界了。',
      '我数到三。要么滚回去，要么被马蹄踩碎。'
    ],
    replies: [
      '一、二——冲锋！',
      '你的步兵挡不住马蹄。',
      '有胆量，可惜不够聪明。'
    ]
  }
}

/** The talk records of one faction, falling back to the bandits. */
export function talkOf(faction) {
  return ENCOUNTER_TALK[faction] || ENCOUNTER_TALK.bandit
}

/**
 * One line of a faction, picked from its bank by a seed.
 *
 * The seed comes from the party, so a dialog that is opened again for the same
 * encounter says the same thing, while two different meetings differ.
 * 按种子从该势力的台词库里取一句；同一个种子每次都得到同一句，不同的相遇则不同。
 */
export function encounterLine(faction, kind = 'greeting', seed = 0) {
  const talk = talkOf(faction)
  const bank = talk[kind] || talk.greeting
  const n = Number.isFinite(seed) ? Math.abs(Math.floor(seed)) : 0
  return bank[n % bank.length]
}

/**
 * A readable roster of a warband: every group with its display name, sprite
 * and live count, plus the total head count. Wounded soldiers are included,
 * because the enemy fields them too.
 * 把敌军整理成可读的名册：每个兵种档位的名字、素材与人数，以及总兵力。
 */
export function enemyRoster(party) {
  const groups = ((party && party.units) || [])
    .filter((g) => g && g.count > 0)
    .map((g) => ({
      type: g.type,
      tier: g.tier || 1,
      count: g.count,
      name: unitName(g.type, g.tier),
      sprite: unitSprite(g.type, g.tier)
    }))
  const total = groups.reduce((sum, g) => sum + g.count, 0)
  return {
    groups,
    total,
    summary: groups.map((g) => `${g.name}×${g.count}`).join(' · ')
  }
}

/** True when the world grid allows a soldier to stand on that tile. */
function walkableAt(grid, x, y) {
  if (!grid || !grid[y]) return false
  if (x < 1 || y < 1 || x >= WORLD_W - 1 || y >= WORLD_H - 1) return false
  const terrain = TERRAIN[grid[y][x]]
  return !!(terrain && terrain.walkable)
}

/**
 * Places the lord may dash to when he runs from a party, best first.
 *
 * The direction is the one pointing away from the enemy, with a random spread
 * so that two escapes do not look identical; the distance is a short 3–6
 * tiles. Water, mountains and the map edge are skipped, and so is the enemy's
 * own tile. The caller still checks that the place is reachable, because an
 * open tile can sit on the far side of a lake.
 * 主角逃跑时可以去的位置，越靠前越好：方向背对敌人并随机散开，距离是短短的 3–6 格；
 * 水域、山地、地图边缘与敌人脚下的格子都会被跳过。调用方还要再确认那里走得到。
 */
export function fleeCandidates({ grid, player, party, rng, limit = 24 }) {
  if (!grid || !player || !party || !rng) return []
  const away = Math.atan2(player.y - party.y, player.x - party.x)
  const spreads = rng.shuffle([0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 0.45, -0.45])
  const distances = rng.shuffle([4, 5, 3, 6])
  const out = []
  const seen = new Set()
  for (const spread of spreads) {
    for (const distance of distances) {
      const angle = away + spread
      const x = Math.round(player.x + Math.cos(angle) * distance)
      const y = Math.round(player.y + Math.sin(angle) * distance)
      const key = `${x}:${y}`
      if (seen.has(key)) continue
      seen.add(key)
      if (!walkableAt(grid, x, y)) continue
      // Never land on top of the enemy or right beside it.
      if (Math.hypot(x - party.x, y - party.y) < distance * 0.6) continue
      // Rounding the tile can add a little to the travelled distance: keep
      // only dashes that really are 3–6 tiles long.
      const actual = Math.hypot(x - player.x, y - player.y)
      if (actual < FLEE_MIN_DISTANCE || actual > FLEE_MAX_DISTANCE) continue
      out.push({
        x,
        y,
        distance: Math.round(actual * 10) / 10,
        angle
      })
      if (out.length >= limit) return out
    }
  }
  return out
}

/** The preferred escape tile, or null when the lord is truly cornered. */
export function fleeTarget(options) {
  const [first] = fleeCandidates(options)
  return first || null
}

/** Name of the faction as the dialog shows it, using the shared faction table. */
export function encounterFaction(faction) {
  return factionOf(faction)
}
