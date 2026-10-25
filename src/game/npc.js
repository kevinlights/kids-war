/**
 * The people of a town: who they are, what they say, what they ask for and how
 * one of them ends up riding with the lord.
 *
 * A town is not only a row of facilities — it is a place with people in it. Every
 * NPC of a scene is generated from the settlement it stands in and from the index
 * it holds inside that settlement, so the same town always has the same baker,
 * the same guard and the same quest, and a save only has to remember how far the
 * lord got with each of them.
 *
 * Three things live here:
 *
 *   roles      what a townsperson does, what they cost to hire and what they
 *              bring to a fight
 *   quests     the small job an NPC asks for before he agrees to follow the lord
 *   companions the NPC once hired: how many soldiers he may lead and how those
 *              soldiers are moved in and out of the lord's warband
 */
import { createRng } from './rng'
import { normalizeTroops, troopCount, unitDef } from './units'

/**
 * One role per trade.
 *
 * `follower` marks the trades that will ride with the lord once their quest is
 * done; the others are townsfolk to talk to, and they never leave their town.
 * `cost` is the gold the lord pays on the day the NPC joins.
 */
export const ROLES = {
  guard: {
    key: 'guard',
    name: '卫兵',
    en: 'Guard',
    sprite: 'npc-guard',
    follower: true,
    cost: 140,
    squadCap: 6,
    buff: { def: 0.02 },
    intro: '他靠在城门边，长矛立在手边，眼睛一直盯着大路。',
    lines: [
      '这条路上不太平，强盗比去年多了三倍。',
      '我的矛不快，可我不会先跑。',
      '你要是肯带上我，我保证站你左边。'
    ]
  },
  hunter: {
    key: 'hunter',
    name: '猎人',
    en: 'Hunter',
    sprite: 'npc-hunter',
    follower: true,
    cost: 120,
    squadCap: 5,
    buff: { atk: 0.02 },
    intro: '他背着一张旧弓，靴子上还沾着林子的泥。',
    lines: [
      '林子里的狼比人听话，也比人危险。',
      '箭要省着用，一箭就该换一只兔子。',
      '打猎和打仗差不多，都是等风来。'
    ]
  },
  scholar: {
    key: 'scholar',
    name: '书生',
    en: 'Scholar',
    sprite: 'npc-scholar',
    follower: true,
    cost: 160,
    squadCap: 4,
    buff: { atk: 0.03 },
    intro: '他抱着一卷书，抬头看你的时候，镜片反着光。',
    lines: [
      '书里写着一百场仗，可惜写字的人都没上过阵。',
      '你答得对，我才敢把命交给你。',
      '谋略不是聪明，是先想好退路。'
    ]
  },
  smith: {
    key: 'smith',
    name: '铁匠',
    en: 'Blacksmith',
    sprite: 'npc-smith',
    follower: true,
    cost: 180,
    squadCap: 6,
    buff: { def: 0.03 },
    intro: '炉火照着他的脸，锤子一下一下敲在通红的铁上。',
    lines: [
      '好钢要打三遍，好兵要练三月。',
      '你这把剑卷刃了，拿来我给你整整。',
      '跟着你走，我就把炉子留在镇上。'
    ]
  },
  healer: {
    key: 'healer',
    name: '医师',
    en: 'Healer',
    sprite: 'npc-healer',
    follower: true,
    cost: 200,
    squadCap: 4,
    buff: { heal: 0.15 },
    intro: '她袖口卷着，正在把草药一把一把捆好。',
    lines: [
      '伤口先洗干净，再谈别的。',
      '我这篮子药，能救的人比刀杀的多。',
      '你们打仗，我只想多带几个活人回来。'
    ]
  },
  bard: {
    key: 'bard',
    name: '吟游诗人',
    en: 'Bard',
    sprite: 'npc-bard',
    follower: true,
    cost: 110,
    squadCap: 4,
    buff: { atk: 0.02 },
    intro: '他坐在井沿上拨着琴弦，唱着一首关于你的、还没写完的歌。',
    lines: [
      '你的事迹我编了三段，第四段还没想好怎么夸。',
      '打仗的人多，会讲打仗故事的人少。',
      '带上我吧，你的名字会出现在我的歌里。'
    ]
  },
  merchant: {
    key: 'merchant',
    name: '商人',
    en: 'Merchant',
    sprite: 'npc-merchant',
    follower: false,
    cost: 0,
    squadCap: 0,
    buff: {},
    intro: '他守着一车布匹，算盘珠子拨得飞快。',
    lines: [
      '兵荒马乱的，货价一天一个样。',
      '你要是缺粮，市场上什么都有。',
      '生意人不上战场，账本比刀快。'
    ]
  },
  farmer: {
    key: 'farmer',
    name: '农夫',
    en: 'Farmer',
    sprite: 'npc-farmer',
    follower: false,
    cost: 0,
    squadCap: 0,
    buff: {},
    intro: '他拄着草叉，脚边的地里刚冒出新芽。',
    lines: [
      '今年雨水好，麦子长得比人高。',
      '别把兵带进田里，压坏了就少一季粮。',
      '镇子能安稳，比什么都强。'
    ]
  }
}

/** Every role, in a stable order. */
export const ROLE_KEYS = Object.keys(ROLES)

/** The trades that will follow a lord. */
export const FOLLOWER_KEYS = ROLE_KEYS.filter((k) => ROLES[k].follower)

const SURNAMES = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '沈', '韩', '杨', '朱']
const GIVEN = [
  '大勇', '小满', '铁柱', '阿禾', '青石', '长庚', '三顺', '子期', '守信', '玉兰',
  '秋生', '冬儿', '有田', '平安', '永年', '林川', '半山', '禾生', '念念', '启明'
]

/** A name for one townsfolk, drawn from the seed so it never changes. */
export function npcName(seed) {
  const rng = createRng(seed)
  return `${rng.pick(SURNAMES)}${rng.pick(GIVEN)}`
}

/* --------------------------------- quests --------------------------------- */

/**
 * The three jobs an NPC may ask for.
 *
 * Each one is measured on a counter the player already keeps: correct answers,
 * battles won and soldiers recruited. The quest stores the value of that counter
 * on the day it was accepted, so the progress is exactly what the lord did *for*
 * this NPC — an old score never counts.
 */
export const QUEST_KINDS = {
  exam: {
    key: 'exam',
    unit: '题',
    counter: (player) => player.stats.correct || 0,
    label: (n) => `答对 ${n} 道考题`
  },
  battle: {
    key: 'battle',
    unit: '场',
    counter: (player) => player.stats.wins || 0,
    label: (n) => `赢下 ${n} 场战斗`
  },
  recruit: {
    key: 'recruit',
    unit: '名',
    counter: (player) => player.stats.recruited || 0,
    label: (n) => `招募 ${n} 名士兵`
  }
}

/** Which job a trade tends to ask for. */
const QUEST_BY_ROLE = {
  guard: 'battle',
  hunter: 'battle',
  smith: 'recruit',
  farmer: 'recruit',
  merchant: 'recruit',
  scholar: 'exam',
  healer: 'exam',
  bard: 'exam'
}

/** How big a job each kind of NPC asks for, by the size of the town. */
const TARGETS = {
  exam: { small: 8, big: 16 },
  battle: { small: 1, big: 3 },
  recruit: { small: 4, big: 10 }
}

/**
 * Build the quest of one NPC.
 *
 * `big` asks for a longer job: the followers worth more gold want more proof, so
 * a town of a higher level — and every recruitable NPC — asks for the long form.
 */
export function makeQuest({ id, role, seed, big = false }) {
  const rng = createRng(seed)
  const kind = QUEST_BY_ROLE[role] || rng.pick(Object.keys(QUEST_KINDS))
  const def = QUEST_KINDS[kind]
  const target = TARGETS[kind][big ? 'big' : 'small']
  return {
    npcId: id,
    kind,
    target,
    label: def.label(target),
    unit: def.unit,
    // The quest is written down with a little flavour, so two NPCs asking for
    // the same kind of job do not read like the same line twice.
    offer: OFFERS[kind][rng.int(0, OFFERS[kind].length - 1)]
  }
}

const OFFERS = {
  exam: [
    '我这儿有几道题，你要是能答对，我就信你认得路。',
    '想让我跟着走？先答对我的考题，我不跟糊涂人走。',
    '镇上的人说你识字，考一考就知道了。'
  ],
  battle: [
    '这条路上强盗成群，你替我打退几场，我就跟你走。',
    '刀口上见真章：赢下几场仗，我认你当主将。',
    '我不看你说什么，只看你打赢了什么。'
  ],
  recruit: [
    '队伍得有人。你先招几个兵，再来找我。',
    '光杆将军走不远，把队伍拉起来给我看看。',
    '人多才成军，你去招些人来。'
  ]
}

/** The reply an NPC gives once his quest is done. */
export const QUEST_DONE_LINES = [
  '行，我服了。你要是愿意出钱，我现在就跟你走。',
  '说得出做得到，这样的主将值得跟。',
  '你做到了。我的行李早收拾好了。'
]

/* -------------------------------- companions ------------------------------- */

/**
 * How many soldiers one companion may lead.
 *
 * A follower brings his own trade to the field but not an army: the lord has to
 * hand him soldiers out of his own warband, and only so many fit under one
 * banner.
 */
export function companionCap(npc) {
  return ROLES[npc.role]?.squadCap || 4
}

/** Soldiers a companion currently leads. */
export function companionStrength(companion) {
  return troopCount(companion?.soldiers || [])
}

/**
 * What the companions do for the army as a whole.
 *
 * Each one adds a small bonus according to his trade — a guard steadies the
 * line, a hunter and a scholar sharpen the attack, a healer speeds recovery.
 * The numbers are deliberately small: a companion is a friend at your side, not
 * a free army.
 */
export function companionEffects(companions) {
  const out = { atk: 0, def: 0, heal: 0 }
  for (const c of companions || []) {
    const buff = ROLES[c.role]?.buff || {}
    out.atk += buff.atk || 0
    out.def += buff.def || 0
    out.heal += buff.heal || 0
  }
  return out
}

/**
 * The companions that ride into the next battle: only those with soldiers under
 * them. A companion with an empty banner stays in town and waits.
 */
export function battleCompanions(companions) {
  return (companions || [])
    .filter((c) => companionStrength(c) > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      sprite: c.sprite,
      troops: normalizeTroops(c.soldiers)
    }))
}

/** A fresh companion record for a NPC that has just been hired. */
export function makeCompanion(npc, townId) {
  return {
    id: npc.id,
    npcId: npc.id,
    name: npc.name,
    role: npc.role,
    sprite: npc.sprite,
    townId,
    // The soldiers the lord has handed over. Empty on the day of hiring.
    soldiers: []
  }
}

/** Soldiers a companion may still take, given his banner's limit. */
export function roomFor(companion) {
  const npc = { role: companion.role }
  return Math.max(0, companionCap(npc) - companionStrength(companion))
}

/**
 * Move soldiers from the lord's warband under a companion's banner.
 *
 * The soldiers are moved, not copied: they leave the warband and they keep the
 * wounds they already had, so handing a wounded soldier over does not heal him.
 */
export function assignSoldiers(companion, warband, type, tier, count) {
  const room = roomFor(companion)
  const from = warband.find((g) => g.type === type && g.tier === tier)
  if (!from || from.count <= 0) return 0
  const move = Math.min(from.count, Math.floor(count), room)
  if (move <= 0) return 0
  const maxHp = unitDef(type, tier).hp
  const hp = from.hp || new Array(from.count).fill(maxHp)
  const movedHp = hp.splice(hp.length - move, move)
  from.count -= move
  while (hp.length > from.count) hp.pop()
  if (from.count === 0) {
    const i = warband.indexOf(from)
    if (i >= 0) warband.splice(i, 1)
  }
  const found = companion.soldiers.find((g) => g.type === type && g.tier === tier)
  if (found) {
    found.count += move
    found.hp = (found.hp || []).concat(movedHp)
  } else {
    companion.soldiers.push({ type, tier, count: move, hp: movedHp })
  }
  return move
}

/** Take soldiers back out of a companion's banner into the lord's warband. */
export function recallSoldiers(companion, warband, type, tier, count) {
  const from = companion.soldiers.find((g) => g.type === type && g.tier === tier)
  if (!from || from.count <= 0) return 0
  const move = Math.min(from.count, Math.floor(count))
  const maxHp = unitDef(type, tier).hp
  const hp = from.hp || new Array(from.count).fill(maxHp)
  const movedHp = hp.splice(hp.length - move, move)
  from.count -= move
  while (hp.length > from.count) hp.pop()
  if (from.count === 0) {
    const i = companion.soldiers.indexOf(from)
    if (i >= 0) companion.soldiers.splice(i, 1)
  }
  const found = warband.find((g) => g.type === type && g.tier === tier)
  if (found) {
    found.count += move
    found.hp = (found.hp || []).concat(movedHp)
  } else {
    warband.push({ type, tier, count: move, hp: movedHp })
  }
  return move
}

/* ------------------------------- the roster -------------------------------- */

/**
 * Every person of one scene.
 *
 * `spots` are the walkable places the scene has reserved for people; each NPC
 * takes one of them as home and wanders around it. Recruitable trades are placed
 * first, so every town is guaranteed to hold people worth talking to.
 */
export function makeNpcs({ settlement, seed, spots, count = 7, followers = 3 }) {
  const rng = createRng(seed)
  const list = []
  const pool = []
  // Recruitable trades first, then residents, so a town always has both.
  for (let i = 0; i < followers; i += 1) pool.push(rng.pick(FOLLOWER_KEYS))
  const residentKeys = ROLE_KEYS.filter((k) => !ROLES[k].follower)
  while (pool.length < count) pool.push(rng.pick(residentKeys))

  const taken = new Set()
  for (let i = 0; i < pool.length; i += 1) {
    const spot = spots.find((s) => !taken.has(`${s.x},${s.y}`)) || spots[0]
    if (!spot) break
    taken.add(`${spot.x},${spot.y}`)
    const role = pool[i]
    const id = `${settlement.id}:n${i}`
    const nameSeed = seed + i * 977 + 13
    const npc = {
      id,
      role,
      name: npcName(nameSeed),
      title: ROLES[role].name,
      sprite: ROLES[role].sprite,
      follower: ROLES[role].follower,
      cost: ROLES[role].cost,
      // Wander state, owned by the scene view; the data module only seeds it.
      x: spot.x + rng.float(-0.2, 0.2),
      y: spot.y + rng.float(-0.2, 0.2),
      homeX: spot.x,
      homeY: spot.y,
      wanderTimer: rng.float(0, 3)
    }
    npc.quest = makeQuest({ id, role, seed: nameSeed + 7, big: npc.follower })
    list.push(npc)
  }
  return list
}
