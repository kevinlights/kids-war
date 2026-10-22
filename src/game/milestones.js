/**
 * Milestones: the gear a long study earns.
 *
 * The count behind them is the number of questions the player has answered
 * correctly over the whole campaign (`player.stats.correct`). It is a plain
 * number, so it survives the pruning of the memory records and never resets.
 *
 *   300 correct answers  the war banner   +5% attack for the whole army
 *   500 correct answers  the badge         +10 gold after every battle
 *   800 correct answers  the medicine box  +50% recovery for the wounded
 *   1200 correct answers the post horse    +10% movement for the lord
 *
 * Every milestone is a permanent change to the campaign, so a long stretch of
 * studying shows up on the map and in the battle.
 */
export const MILESTONES = [
  {
    key: 'banner',
    name: '军旗',
    en: 'War banner',
    icon: '🚩',
    at: 300,
    effect: '全军攻击 +5%',
    note: '答对 300 题后，队伍带着战旗出征，全军攻击 +5%。'
  },
  {
    key: 'badge',
    name: '徽章',
    en: 'Badge',
    icon: '🏅',
    at: 500,
    effect: '每场战斗后 +10 金币',
    note: '答对 500 题后，每打完一场仗多拿 10 金币。'
  },
  {
    key: 'medicine',
    name: '药箱',
    en: 'Medicine chest',
    icon: '💊',
    at: 800,
    effect: '伤兵恢复 +50%',
    note: '答对 800 题后，伤兵恢复速度 +50%。'
  },
  {
    key: 'post',
    name: '驿马',
    en: 'Post horse',
    icon: '🐎',
    at: 1200,
    effect: '主角移动速度 +10%',
    note: '答对 1200 题后，主角赶路快 10%。'
  }
]

/** The milestone record of a key, or null for an unknown key. */
export function milestoneOf(key) {
  return MILESTONES.find((m) => m.key === key) || null
}

/** Every milestone the count has unlocked, in order. */
export function unlockedMilestones(correctCount) {
  const count = Math.max(0, Number(correctCount) || 0)
  return MILESTONES.filter((m) => count >= m.at)
}

/** The next milestone the count has not reached yet, or null. */
export function nextMilestone(correctCount) {
  const count = Math.max(0, Number(correctCount) || 0)
  return MILESTONES.find((m) => count < m.at) || null
}

/**
 * Everything the unlocked milestones do.
 *
 * `armyAtk`    the multiplier on the attack of the whole army
 * `battleGold` the gold a finished battle pays on top of the loot
 * `healMul`    the multiplier on the recovery of the wounded
 * `speed`      the multiplier on the movement of the lord
 */
export function milestoneEffects(correctCount) {
  const unlocked = unlockedMilestones(correctCount)
  const has = (key) => unlocked.some((m) => m.key === key)
  return {
    armyAtk: has('banner') ? 1.05 : 1,
    battleGold: has('badge') ? 10 : 0,
    healMul: has('medicine') ? 1.5 : 1,
    speed: has('post') ? 1.1 : 1,
    unlocked
  }
}
