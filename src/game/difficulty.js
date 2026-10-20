/**
 * Difficulty setting.
 *
 * The game only has one knob so far: how much gold a correct exam answer pays.
 * The numbers the game shipped with are the easy ones, so:
 *
 *   简单 Easy    每题答对按原数值结算（三年级 20、四年级 26 金币）
 *   普通 Normal  每题答对少 1 个金币
 *   困难 Hard    每题答对少 2 个金币
 *
 * The setting belongs to the lord, so it is part of the save and can be
 * changed at any time from the home screen or from the world map.
 */

/** The three difficulty levels, in the order they are shown. */
export const DIFFICULTIES = [
  {
    key: 'easy',
    name: '简单',
    en: 'Easy',
    icon: '🟢',
    rewardDelta: 0,
    note: '每答对一题，按原数值拿金币（三年级 20，四年级 26）。',
    en_note: 'Every correct answer pays the original amount (20 for grade 3, 26 for grade 4).'
  },
  {
    key: 'normal',
    name: '普通',
    en: 'Normal',
    icon: '🟡',
    rewardDelta: -1,
    note: '每答对一题少拿 1 个金币，赚金币更费劲。',
    en_note: 'Every correct answer pays one gold less, so gold is harder to earn.'
  },
  {
    key: 'hard',
    name: '困难',
    en: 'Hard',
    icon: '🔴',
    rewardDelta: -2,
    note: '每答对一题少拿 2 个金币，只有高年级认真考才养得起军队。',
    en_note: 'Every correct answer pays two gold less, so only a good paper keeps the army fed.'
  }
]

/** The difficulty a fresh game starts with. */
export const DEFAULT_DIFFICULTY = 'easy'

/** The difficulty record of a key, falling back to the default one. */
export function difficultyOf(key) {
  return DIFFICULTIES.find((d) => d.key === key) || DIFFICULTIES[0]
}

/** A safe difficulty key: only the three known keys are accepted. */
export function difficultyKey(key) {
  return difficultyOf(key).key
}

/** How much gold a correct answer loses on this difficulty. */
export function rewardDelta(key) {
  return difficultyOf(key).rewardDelta
}

/** The difficulty records, for a settings panel. */
export function difficultyList() {
  return DIFFICULTIES
}
