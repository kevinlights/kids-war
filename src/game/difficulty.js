/**
 * Difficulty setting: the one knob that decides how hard the campaign is.
 *
 * The difficulty never changes the questions: every level asks exactly the
 * same paper. It changes three things instead, all of them through numbers in
 * this file:
 *
 *   pay    what one correct answer is worth, and how much a whole paper can
 *          pay (easy caps the paper, so it cannot be farmed)
 *   cost   the gold and the food the army costs to raise and to march
 *   foe    how many soldiers the factions field and how fast they grow
 *
 *   简单 Easy    practice: a flat 5 gold per answer, the paper is capped at
 *                twice its base price, a generous start and weaker enemies
 *   普通 Normal  the game as it shipped: grade 3 pays 19, grade 4 pays 25
 *   困难 Hard    the challenge: the same numbers as normal cut by a fifth,
 *                a tighter start, dearer food and more, better enemies
 *
 * On top of the level, the world escalates inside one campaign: `threatOf()`
 * reads the battles won and the towns taken, so the factions grow faster the
 * further the lord gets — without punishing a child who is stuck.
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
    // The price of one correct answer: a flat, low price for practice.
    rewardDelta: 0,
    flatReward: 5,
    payMul: 1,
    // The base price times this is the most one paper may pay; 0 means no cap.
    paperCap: 2,
    // A new lord starts with this purse and this much food.
    startGold: 150,
    startFood: 8,
    // What the war costs.
    foodPerBattle: 2,
    recruitMul: 0.9,
    // The factions: smaller parties, slower growth, a lower ceiling.
    foeSize: 0.9,
    foeGrowth: 0.75,
    foeCap: 0.85,
    foeTierStart: 99,
    foeTierMax: 1,
    // A new band of bandits appears every this many days.
    banditDays: 3,
    // The campaign-wide escalation, driven by wins and captured towns.
    threatWins: 0.01,
    threatTowns: 0.02,
    threatCap: 1.2,
    note: '练习模式：每题 5 金、整卷收益封顶，开局更宽裕，敌军更弱。',
    en_note: 'Practice: a flat five gold per answer, a capped paper, a generous start and weaker enemies.'
  },
  {
    key: 'normal',
    name: '普通',
    en: 'Normal',
    icon: '🟡',
    rewardDelta: -1,
    flatReward: 0,
    payMul: 1,
    paperCap: 0,
    startGold: 120,
    startFood: 5,
    foodPerBattle: 3,
    recruitMul: 1,
    foeSize: 1,
    foeGrowth: 1,
    foeCap: 1,
    foeTierStart: 1.25,
    foeTierMax: 2,
    banditDays: 2,
    threatWins: 0.02,
    threatTowns: 0.04,
    threatCap: 1.8,
    note: '标准模式：三年级 19 / 四年级 25 金，敌军会随战功变强。',
    en_note: 'Standard: 19 gold in grade 3 and 25 in grade 4, and the factions grow as the lord wins.'
  },
  {
    key: 'hard',
    name: '困难',
    en: 'Hard',
    icon: '🔴',
    rewardDelta: -2,
    // The normal numbers are cut by a fifth after the difference is taken.
    payMul: 0.8,
    flatReward: 0,
    paperCap: 0,
    startGold: 90,
    startFood: 3,
    foodPerBattle: 4,
    recruitMul: 1.15,
    foeSize: 1.1,
    foeGrowth: 1.25,
    foeCap: 1.15,
    foeTierStart: 1.2,
    foeTierMax: 3,
    banditDays: 2,
    threatWins: 0.025,
    threatTowns: 0.05,
    threatCap: 2,
    note: '挑战模式：金币再打 8 折，开局更紧、军粮更贵、敌军更多更精锐。',
    en_note: 'Challenge: a fifth less gold, a tighter start, dearer food and more, better enemies.'
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

/**
 * The flat price of a correct answer on this difficulty, or 0 when the
 * difficulty pays by grade and subject.
 */
export function flatReward(key) {
  return difficultyOf(key).flatReward || 0
}

/** The multiplier the grade-and-subject price is cut by on this difficulty. */
export function rewardMul(key) {
  return difficultyOf(key).payMul || 1
}

/** The most one paper may pay, in multiples of its base price (0 = no cap). */
export function paperCapOf(key) {
  return difficultyOf(key).paperCap || 0
}

/** The purse and the food a new lord of this difficulty starts with. */
export function startOf(key) {
  const d = difficultyOf(key)
  return { gold: d.startGold, food: d.startFood }
}

/** Rations one battle eats on this difficulty. */
export function foodPerBattleOf(key) {
  return difficultyOf(key).foodPerBattle || 3
}

/** The markup a settlement adds to a recruit on this difficulty. */
export function recruitMulOf(key) {
  return difficultyOf(key).recruitMul || 1
}

/** The enemy numbers of a difficulty: size, growth, ceiling and rank mix. */
export function foeOf(key) {
  const d = difficultyOf(key)
  return {
    size: d.foeSize,
    growth: d.foeGrowth,
    cap: d.foeCap,
    tierStart: d.foeTierStart,
    tierMax: d.foeTierMax,
    banditDays: d.banditDays
  }
}

/** How strong the factions are at the start of a campaign, before any win. */
export function foeSizeOf(key) {
  return difficultyOf(key).foeSize || 1
}

/**
 * The campaign-wide escalation: 1.0 at the first day, then slowly up with the
 * battles won and the towns taken, capped per difficulty.
 */
export function threatOf({ wins = 0, towns = 0 } = {}, key = 'easy') {
  const d = difficultyOf(key)
  const raw = 1 + Math.max(0, wins) * d.threatWins + Math.max(0, towns) * d.threatTowns
  return Math.round(Math.min(d.threatCap, raw) * 100) / 100
}

/** The size multiplier of a newly raised party at this threat. */
export function enemySizeMulOf(threat = 1, key = 'easy') {
  const t = Math.max(1, threat)
  return (difficultyOf(key).foeSize || 1) * (1 + (t - 1) * 0.5)
}

/** The multiplier of the faction soldier ceiling at this threat. */
export function enemyCapMulOf(threat = 1, key = 'easy') {
  const t = Math.max(1, threat)
  return (difficultyOf(key).foeCap || 1) * t
}

/** The difficulty records, for a settings panel. */
export function difficultyList() {
  return DIFFICULTIES
}
