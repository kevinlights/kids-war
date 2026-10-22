/**
 * An exam is experience: what the child learns becomes what the lord can do.
 *
 * Every correct answer is one experience point. Fifty points buy one point of
 * an attribute, and the lord spends those points himself, so the child sees
 * exactly what studying bought.
 *
 *   统御 Leadership   a bigger warband and a stronger army
 *   医术 Surgery      the wounded come back faster
 *   工程 Engineering  a shorter siege and cheaper town facilities
 *   谋略 Tactics      the enemy is scouted before the fight and hits softer
 *
 * The module holds the tables and the formulas only: the store keeps the
 * points and the systems read the effects.
 */
import { SIEGE_PREPARE_DAYS } from './settlement'

/** How much experience one attribute point costs. */
export const EXP_PER_POINT = 50

/** The attributes the lord can put his experience into. */
export const ATTRIBUTES = [
  {
    key: 'leadership',
    name: '统御',
    en: 'Leadership',
    icon: '👑',
    per: '队伍上限 +2、全军攻击 +1%',
    note: '带得动更大的队伍，队伍也更听指挥。'
  },
  {
    key: 'surgery',
    name: '医术',
    en: 'Surgery',
    icon: '🩺',
    per: '伤兵恢复 +10%',
    note: '伤兵恢复得更快，阵亡的人更少。'
  },
  {
    key: 'engineering',
    name: '工程',
    en: 'Engineering',
    icon: '⚙️',
    per: '围城准备 −0.5 天、设施造价 −5%',
    note: '围城更快，城镇设施更便宜。'
  },
  {
    key: 'tactics',
    name: '谋略',
    en: 'Tactics',
    icon: '🧠',
    per: '全军攻击 +5%、战前显示敌方构成',
    note: '开打前就看清对面是什么兵。'
  }
]

/** A fresh set of attributes. */
export function emptyAttributes() {
  const out = {}
  for (const attribute of ATTRIBUTES) out[attribute.key] = 0
  return out
}

/** How many attribute points a given amount of experience buys. */
export function pointsFor(experience) {
  return Math.floor(Math.max(0, Number(experience) || 0) / EXP_PER_POINT)
}

/** The attribute record of a key, or the first one for an unknown key. */
export function attributeOf(key) {
  return ATTRIBUTES.find((a) => a.key === key) || ATTRIBUTES[0]
}

/**
 * Everything the attributes do.
 *
 * `partyCap`      the biggest warband the lord may field
 * `healMul`       the multiplier on the recovery of the wounded
 * `siegeDays`     the days a siege needs before the assault
 * `buildDiscount` the share every town facility costs less
 * `armyAtk`       the multiplier on the attack of the whole army
 * `intel`         true when the enemy composition is revealed before a fight
 */
export function skillEffects(attributes = {}) {
  const leadership = Math.max(0, Number(attributes.leadership) || 0)
  const surgery = Math.max(0, Number(attributes.surgery) || 0)
  const engineering = Math.max(0, Number(attributes.engineering) || 0)
  const tactics = Math.max(0, Number(attributes.tactics) || 0)

  return {
    partyCap: 40 + leadership * 2,
    healMul: 1 + surgery * 0.1,
    siegeDays: Math.max(0.5, SIEGE_PREPARE_DAYS - engineering * 0.5),
    buildDiscount: Math.min(0.5, engineering * 0.05),
    armyAtk: 1 + leadership * 0.01 + tactics * 0.05,
    intel: tactics > 0
  }
}
