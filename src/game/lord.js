/**
 * The lord and the enemy general: two people on the battle field who are not
 * ordinary soldiers.
 *
 * A general fights like a soldier — whoever he touches is struck — but he is
 * not part of a squad, and he has a bodyguard of four melee soldiers. Going
 * down ends the battle and puts both armies back on the world map, around the
 * spot where the fight happened:
 *
 *   the lord          the battle is lost at once, half of his soldiers are
 *                     scattered and he wakes up at half health near the field
 *   the enemy general the enemy army is not beaten, so both sides step back —
 *                     the lord can go after him again, or walk away
 *
 * The lord also carries his wounds from one fight to the next: this module
 * owns his hit points and how fast they come back on the world map.
 *
 * 主将不是普通士兵：他会亲自挥刀，却有自己的四名亲兵挡在身前。
 * 主将倒下即结束战斗，双方都退回世界地图、落在战场周围：
 * 领主倒下即判负（散一半兵、半血、被抬回战场旁）；
 * 敌军主将倒下则双方各自退开，玩家可以继续追击，也可以离开。
 */

/** Hit points of the lord when he is unhurt. */
export const LORD_MAX_HP = 120

/** How many soldiers of a side step in front of its general. */
export const LORD_GUARD_COUNT = 4

/** The lord's own blow: a little stronger than a spearman, slower to swing. */
export const LORD_ATK = 16
export const LORD_DEF = 10
export const LORD_SPEED = 150

/** The enemy general: tougher than the lord, a touch slower on his feet. */
export const ENEMY_GENERAL_ATK = 14
export const ENEMY_GENERAL_DEF = 12
export const ENEMY_GENERAL_SPEED = 120

/** Real seconds between two blows of a general. */
export const GENERAL_SWING_COOLDOWN = 1.1

/**
 * The last stand of a general whose soldiers have all fallen.
 *
 * A battle is not lost the moment the last soldier drops: the general holds
 * the field on his own for a few seconds, hits harder and swings faster while
 * he does, and then either falls or yields.
 * 士兵倒光不等于当场结束：主将会独自支撑 `LAST_STAND_SECONDS` 秒，
 * 这段时间里他攻击更高、出手更快，撑不住就倒下或撤退。
 */
export const LAST_STAND_SECONDS = 8
export const LAST_STAND_ATK_MUL = 1.3
export const LAST_STAND_SWING_MUL = 0.75

/**
 * The ring both armies fall back into after a battle, in world tiles, around
 * the spot where the fight happened.
 *
 * Near enough that the child can see the enemy warband and decide what to do
 * with it, far enough that the fight does not restart on the same frame.
 */
export const FIELD_RETURN_MIN = 3
export const FIELD_RETURN_MAX = 7

/** How much of the lord's health a defeat leaves him with. */
export const LORD_REVIVED_FRACTION = 0.5

/**
 * Hit points the lord recovers per real second on the world map.
 *
 * The map runs two different clocks (a day of marching is 24 real seconds, a
 * day of resting in a town is 24 real minutes), so the lord's own healing is
 * written in real time: half a point a second on the road, much faster inside
 * a town, fastest in a town of his own with a hospital.
 * 地图上有两种时钟（行军一天是 24 秒，城镇休整一天是 24 分钟），
 * 所以领主的恢复按真实时间计算：路上每秒 0.5 点，城镇里快得多，自己的城镇加医院最快。
 */
export function lordRegenPerSecond({ inSettlement = false, ownTown = false, hospital = 0 } = {}) {
  let rate = 0.5
  if (inSettlement) rate = 1.6
  if (ownTown) rate *= 1.6
  if (hospital > 0) rate *= 1 + 0.2 * hospital
  return rate
}

/** Half of the lord's health, at least one point. */
export function halfLordHp(maxHp = LORD_MAX_HP) {
  return Math.max(1, Math.round(maxHp * LORD_REVIVED_FRACTION))
}

/** A hit-point value clamped into a valid range. */
export function clampLordHp(hp, maxHp = LORD_MAX_HP) {
  const value = Number(hp)
  if (!Number.isFinite(value)) return maxHp
  return Math.max(0, Math.min(maxHp, Math.round(value)))
}
