/**
 * Headless checks for the exam spine: the paper settlement, the gear a paper
 * drops, the mastery map, the revision modes and the attributes the
 * experience buys.
 *
 * These run against the real stores and the real question bank, so a broken
 * rule shows up here before it ever reaches a browser.
 */
import { createPinia, setActivePinia } from 'pinia'
import { usePlayerStore } from '@/stores/player'
import { useWorldStore } from '@/stores/world'
import { generateExam, listTypes, rewardFor, collectEntries } from '@/game/quiz'
import { REWARD_RULES, SUBJECT_DROPS, longestStreak, passLineOf, settlePaper, streakMultiplier } from '@/game/quiz/reward'
import { dueKeys, masteryBySubject, mistakeKeys, subjectOfKey } from '@/game/quiz/mastery'
import { gradeInput, inputQuestion, orderQuestion, pairsQuestion } from '@/game/quiz/shared'
import { normalizeMod } from '@/game/quiz/registry'
import { ENGLISH_TYPES } from '@/game/quiz/english'
import { CHINESE_TYPES } from '@/game/quiz/chinese'
import { MATH_TYPES } from '@/game/quiz/math'
import { LOGIC_TYPES } from '@/game/quiz/logic'
import { createRng } from '@/game/rng'
import { ATTRIBUTES, EXP_PER_POINT, emptyAttributes, pointsFor, skillEffects } from '@/game/skills'
import { MILESTONES, milestoneEffects, nextMilestone, unlockedMilestones } from '@/game/milestones'
import { facilityCost, healRate } from '@/game/settlement'

const check = (name, condition, detail = '') => globalThis.__reporter.check(name, condition, detail)

setActivePinia(createPinia())
const player = usePlayerStore()
const world = useWorldStore()

/* ------------------------------ 1. the settlement ----------------------------- */

const q = (type = 'math', grade = 3) => ({ type, grade, prompt: 'q', options: ['a', 'b'], answer: 0 })

// A paper of five right answers: the base price and nothing else.
const allRight = { answers: [q(), q(), q(), q(), q()].map((question) => ({ question, correct: true })) }
// The settlement is checked on the normal level, which keeps the original
// prices; the easy level has a flat price of five gold (see section 11).
const plain = settlePaper({ answers: allRight.answers, difficulty: 'normal' })
check('a straight paper pays the base price', plain.base === 5 * 19, String(plain.base))
check('a straight paper passes the pass line', plain.passed === true && plain.passLine === 3)
check('the pass line is half the paper', passLineOf(5) === 3 && passLineOf(12) === 6 && passLineOf(8) === 4)
check('a perfect paper pays more than the base', plain.gold > plain.base, `${plain.gold} vs ${plain.base}`)
// Five right answers in a row also carry the streak multiplier.
check(
  'the perfect paper pays the streak, the perfect and the pass bonus',
  plain.gold === Math.round(plain.base * 1.4 * 1.5 * 1.2),
  String(plain.gold)
)

// A streak multiplies the base, a broken streak does not.
check('a run of three is worth three', longestStreak([{ correct: true }, { correct: true }, { correct: true }]) === 3)
check('a broken streak resets', longestStreak([{ correct: true }, { correct: false }, { correct: true }]) === 1)
check('the streak multiplier grows', streakMultiplier(1) === 1 && streakMultiplier(3) === 1.2)
check('the streak multiplier is capped', streakMultiplier(99) === 1 + REWARD_RULES.STREAK_MAX_STEPS * 0.1)

const withStreak = settlePaper({
  answers: [q(), q(), q()].map((question) => ({ question, correct: true })),
  difficulty: 'normal'
})
const mixed = settlePaper({
  answers: [
    { question: q(), correct: true },
    { question: q(), correct: true },
    { question: q(), correct: false },
    { question: q(), correct: true },
    { question: q(), correct: true }
  ],
  difficulty: 'normal'
})
check('a streak pays more than the same answers without one', withStreak.gold > mixed.gold, `${withStreak.gold} vs ${mixed.gold}`)

// A wrong answer costs nothing: it simply pays nothing.
check('a wrong answer never costs gold', mixed.net === mixed.gold && mixed.gold >= 0)
check('a wrong answer is not counted as correct', mixed.correct === 4 && mixed.wrong === 1)
check('a failed paper still pays for the right answers', mixed.base === 4 * 19 && mixed.gold > 0)

// A long paper pays a little more.
const longPaper = settlePaper({
  answers: Array.from({ length: 12 }, () => ({ question: q(), correct: true })),
  difficulty: 'normal'
})
check('a paper of twelve pays more than a paper of five', longPaper.gold > plain.gold, `${longPaper.gold} vs ${plain.gold}`)
// Twelve in a row cap the streak at 1.5, and the perfect and long bonuses add
// another tenth and a half.
check(
  'the long paper pays the streak, the perfect, the long and the pass bonus',
  longPaper.gold === Math.round(longPaper.base * 1.5 * 1.5 * 1.1 * 1.2),
  String(longPaper.gold)
)

// The difficulty still reaches the settlement.
const hard = settlePaper({ answers: allRight.answers, difficulty: 'hard' })
check('the hard difficulty pays less than the normal one', hard.base === 5 * 14 && hard.base < plain.base)
check('the hard difficulty cuts the normal price by a fifth', rewardFor(q(), 'hard') === Math.round(18 * 0.8))
// The easy level caps a paper at twice the price of its questions.
const easyPerfect = settlePaper({
  answers: Array.from({ length: 12 }, () => ({ question: q(), correct: true })),
  difficulty: 'easy'
})
check('the easy paper is capped at twice its base', easyPerfect.gold === 120 && easyPerfect.capped === true, String(easyPerfect.gold))
check('the cap never touches a poor paper', settlePaper({
  answers: [q(), q(), q(), q(), q()].map((question, i) => ({ question, correct: i < 3 })),
  difficulty: 'easy'
}).capped === false)

/* -------------------------------- 2. the drops -------------------------------- */

const lucky = settlePaper({
  answers: [{ question: q('math'), correct: true }],
  difficulty: 'normal',
  rng: () => 0
})
check('a correct answer can drop food', lucky.drops.some((d) => d.key === 'food' && d.count === 3), JSON.stringify(lucky.drops))

const unlucky = settlePaper({
  answers: [{ question: q('math'), correct: true }],
  difficulty: 'normal',
  rng: () => 0.99
})
check('a perfect subject drops its own gift', unlucky.drops.some((d) => d.key === 'food' && d.count === 2), JSON.stringify(unlucky.drops))

const logicPaper = settlePaper({
  answers: [{ question: q('logic'), correct: true }],
  difficulty: 'normal',
  rng: () => 0.99
})
check('a perfect logic paper drops a recruit order', logicPaper.drops.some((d) => d.key === 'order'))

const poemPaper = settlePaper({
  answers: [{ question: q('chinese'), correct: true }],
  difficulty: 'normal',
  rng: () => 0.99
})
check('a perfect chinese paper drops a market voucher', poemPaper.drops.some((d) => d.key === 'ticket'))

const horsePaper = settlePaper({
  answers: [
    { question: q('math'), correct: true },
    { question: q('math'), correct: true }
  ],
  difficulty: 'normal',
  rng: () => 0.99
})
check('a perfect paper drops a horse', horsePaper.drops.some((d) => d.key === 'horse' && d.count === 1))

const noGift = settlePaper({
  answers: [
    { question: q('math'), correct: true },
    { question: q('math'), correct: false }
  ],
  difficulty: 'normal',
  rng: () => 0.99
})
check('a paper with a mistake drops no horse', !noGift.drops.some((d) => d.key === 'horse'))
check('a subject with a mistake drops no gift', !noGift.drops.some((d) => d.key === 'order' || d.key === 'ticket'))
check('every subject has a gift', Object.keys(SUBJECT_DROPS).length >= 5)

// Five in a row always brings food.
const streakDrops = settlePaper({
  answers: Array.from({ length: 5 }, () => ({ question: q('math'), correct: true })),
  difficulty: 'normal',
  rng: () => 0.99
})
check('five in a row always drops food', streakDrops.drops.some((d) => d.key === 'food' && d.count >= 2))

/* ------------------------------- 3. the mastery map ---------------------------- */

check('the subject of a declarative key is read', subjectOfKey('math:times-tables') === 'math')
check('the subject of a generated key is read', subjectOfKey('math#mul-1') === 'math')
check('an unknown key has no subject', subjectOfKey('') === 'unknown')

const stats = {
  'math:hard': { level: 5, right: 5, wrong: 0, lastSeen: Date.now(), grade: 4 },
  'math:easy': { level: 1, right: 1, wrong: 2, lastSeen: Date.now(), grade: 3 },
  'logic:one': { level: 0, right: 0, wrong: 1, lastSeen: Date.now() - 40 * 3600 * 1000, grade: 3 }
}
const mastery = masteryBySubject(stats)
check('the map counts the tracked questions', mastery.math.tracked === 2)
check('the map counts the mastered ones', mastery.math.mastered === 1)
check('the map splits by grade', mastery.math.grades[4].tracked === 1 && mastery.math.grades[3].tracked === 1)
check('the map has a percentage', mastery.math.percent >= 0 && mastery.math.percent <= 100)
check('the map knows the mistakes', mastery.math.wrong === 2)

check('a question nobody saw again is due', dueKeys(stats).includes('logic:one'))
check('a fresh question is not due', !dueKeys(stats).includes('math:hard'))
check('the mistake book holds the shaky ones', mistakeKeys(stats).includes('math:easy'))
check('the mistake book leaves the mastered ones out', !mistakeKeys(stats).includes('math:hard'))

/* ---------------------------- 4. the revision modes --------------------------- */

const subjects = listTypes().map((s) => s.key)
check('the bank has subjects', subjects.length >= 5)

const paper = generateExam({ grade: 3, types: subjects, count: 5, seed: 7 })
check('a standard paper is drawn', paper.length === 5, String(paper.length))
check('a standard paper holds no duplicate', new Set(paper.map((p) => p.prompt)).size === paper.length)

// A revision paper draws from the questions that were asked for, so the keys
// have to be real ones from the bank.
const entries = collectEntries(3, null)
const twoKeys = []
for (const entry of entries) {
  if (!twoKeys.includes(entry.item)) twoKeys.push(entry.item)
  if (twoKeys.length === 2) break
}
const onlyTwo = generateExam({
  grade: 3,
  types: subjects,
  count: 5,
  seed: 7,
  items: twoKeys
})
check('a revision paper only holds the asked questions', onlyTwo.length === 2, String(onlyTwo.length))
check('a revision paper holds the right questions', onlyTwo.every((p) => twoKeys.includes(p.item)))
check('a revision paper with unknown keys falls back to a normal paper', generateExam({ grade: 3, types: subjects, count: 5, seed: 7, items: ['nope:1'] }).length === 5)

/* ------------------------------ 5. the experience ----------------------------- */

check('an empty sheet buys no attribute point', pointsFor(0) === 0)
check('fifty experience buys one point', pointsFor(EXP_PER_POINT) === 1)
check('a hundred experience buys two points', pointsFor(100) === 2)

const before = player.experience
const failed = player.awardPaper({ correct: 8, passed: false })
check('a failed paper teaches nothing', failed.experience === 0 && player.experience === before)
const passed = player.awardPaper({ correct: 8, passed: true })
check('a passed paper teaches', passed.experience === 8 && player.experience === before + 8)

player.experience = 120
check('the points are available', player.availableSkillPoints === 2)
check('a point can be spent', player.allocateSkill('leadership') === true)
check('the attribute went up', player.attributes.leadership === 1)
check('one point is left', player.availableSkillPoints === 1)
check('an unknown attribute is refused', player.allocateSkill('sorcery') === false)
player.experience = 10
check('a point cannot be spent without experience', player.availableSkillPoints === 0 && player.allocateSkill('surgery') === false)

/* ------------------------------ 6. what the points do ------------------------- */

const none = skillEffects(emptyAttributes())
check('without points nothing changes', none.partyCap === 40 && none.healMul === 1 && none.buildDiscount === 0)
check('without points the siege still takes two days', none.siegeDays === 2)

const some = skillEffects({ leadership: 2, surgery: 3, engineering: 4, tactics: 5 })
check('leadership opens room for the warband', some.partyCap === 44)
check('surgery heals the wounded faster', Math.abs(some.healMul - 1.3) < 0.0001)
check('engineering shortens the siege', some.siegeDays < 2)
check('engineering makes the facilities cheaper', some.buildDiscount > 0)
check('tactics strengthens the army', some.armyAtk > 1)
check('tactics scouts the enemy', some.intel === true)

check('there are four attributes', ATTRIBUTES.length === 4)
check('every attribute has a name and a note', ATTRIBUTES.every((a) => a.name && a.per && a.note))

// The effects really reach the systems that read them.
const fastHeal = healRate({ inSettlement: true, surgery: 2 })
const plainHeal = healRate({ inSettlement: true })
check('the surgery attribute reaches the healing', fastHeal > plainHeal, `${fastHeal} vs ${plainHeal}`)
const medic = healRate({ inSettlement: true, medicine: true })
check('the medicine chest reaches the healing', medic > plainHeal, `${medic} vs ${plainHeal}`)
check('the engineering discount reaches the price', facilityCost('hospital', 0, 0.2) < facilityCost('hospital', 0))
check('the discount never goes below half', facilityCost('hospital', 0, 5) === Math.round(120 * 0.5))

/* ------------------------------- 7. the milestones ---------------------------- */

check('nothing is unlocked at the start', unlockedMilestones(0).length === 0)
check('the banner needs 300 answers', unlockedMilestones(299).length === 0)
check('the banner is unlocked at 300', unlockedMilestones(300).some((m) => m.key === 'banner'))
check('all four are unlocked at 1200', unlockedMilestones(1200).length === 4)
check('the next milestone is the banner first', nextMilestone(0).key === 'banner')
check('there is no milestone after the last one', nextMilestone(99999) === null)
check('the milestones never go down', MILESTONES.every((m, i) => i === 0 || m.at > MILESTONES[i - 1].at))

const banner = milestoneEffects(300)
check('the banner strengthens the army', banner.armyAtk > 1)
check('the badge pays after a battle', milestoneEffects(500).battleGold === 10)
check('the medicine chest heals faster', milestoneEffects(800).healMul > 1)
check('the post horse speeds the lord up', milestoneEffects(1200).speed > 1)

/* -------------------------------- 8. the store -------------------------------- */

player.reset('tester')
check('a new lord starts without experience', player.experience === 0)
check('a new lord starts without attributes', player.attributes.leadership === 0)
check('a new lord starts with the practice start', player.supplies.food === 8 && player.gold === 150 && player.supplies.horse === 0)
check('a new lord starts without a voucher', player.supplies.ticket === 0)
check('a new lord starts without a recruit order', player.supplies.order === 0)

player.addSupply('ticket', 2)
check('a voucher can be added', player.supplies.ticket === 2)
check('a voucher can be spent', player.useSupply('ticket', 1) === true && player.supplies.ticket === 1)
check('a voucher that is not there cannot be spent', player.useSupply('ticket', 5) === false && player.supplies.ticket === 1)

// An old save without the new fields still loads.
player.hydrate({ username: 'old', gold: 10, troops: [], supplies: { food: 3 }, stats: {} })
check('an old save keeps its supplies', player.supplies.food === 3)
check('an old save gets the new supplies as zero', player.supplies.ticket === 0 && player.supplies.order === 0)
check('an old save starts without experience', player.experience === 0)
check('an old save starts without attributes', player.attributes.leadership === 0)

// A new save keeps everything.
player.experience = 250
player.attributes.tactics = 3
player.addSupply('order', 1)
player.hydrate({
  username: 'new',
  gold: 10,
  troops: [],
  supplies: { food: 1, horse: 0, ticket: 2, order: 1 },
  stats: { correct: 400 },
  experience: 250,
  attributes: { tactics: 3 }
})
check('a new save keeps the experience', player.experience === 250)
check('a new save keeps the attributes', player.attributes.tactics === 3)
check('a new save keeps the gear', player.supplies.ticket === 2 && player.supplies.order === 1)
check('the milestones follow the lifetime count', player.milestones.some((m) => m.key === 'banner'))

// The warband ceiling follows the leadership attribute.
player.hydrate({ username: 'cap', gold: 9999, troops: [], supplies: {}, stats: {} })
check('the ceiling starts at forty', player.partyCap === 40)
player.experience = 500
player.allocateSkill('leadership')
player.allocateSkill('leadership')
check('leadership opens the ceiling', player.partyCap === 44, String(player.partyCap))

/* --------------------------------- 9. the world -------------------------------- */

const siegeDays = player.skillEffects.siegeDays
check('the siege is prepared in whole days', Math.ceil(siegeDays) === Math.ceil(siegeDays))
check('the world knows the day counter', typeof world.day === 'number')

/* ---------------------------- 10. the new question shapes -------------------- */

const mc = normalizeMod({
  key: 'mc-pack',
  name: '选择',
  questions: [{ id: 'a', prompt: '1 + 1 = ?', options: ['2', '3'], answer: 0 }]
})
const filled = normalizeMod({
  key: 'fill-pack',
  name: '填空',
  questions: [{ id: 'a', prompt: '1 + 1 = ?', input: 'number', answer: '2' }]
})
const matching = normalizeMod({
  key: 'match-pack',
  name: '配对',
  questions: [{ id: 'a', prompt: '连一连', pairs: [['苹果', 'apple'], ['香蕉', 'banana']] }]
})
const ordering = normalizeMod({
  key: 'order-pack',
  name: '排序',
  questions: [{ id: 'a', prompt: '排一排', items: ['立春', '雨水', '惊蛰'] }]
})
check('a multiple choice question is accepted', !!mc && mc.items.length === 1)
check('a filled-in question is accepted', !!filled && filled.items[0].input === 'number')
check('a matching question is accepted', !!matching && matching.items[0].pairs.length === 2)
check('an ordering question is accepted', !!ordering && ordering.items[0].items.length === 3)
check('a question without options is rejected', !normalizeMod({ key: 'x-pack', questions: [{ id: 'a', prompt: 'p' }] }))
check('a broken pair is rejected', !normalizeMod({ key: 'y-pack', questions: [{ id: 'a', prompt: 'p', pairs: [['only']] }] }))
check('a filled-in question without an answer is rejected', !normalizeMod({ key: 'z-pack', questions: [{ id: 'a', prompt: 'p', input: 'text' }] }))

// Grading a typed answer.
check('a number is graded by its value', gradeInput({ input: 'number', answer: ['3'] }, '3') === true)
check('a number with a decimal is graded by its value', gradeInput({ input: 'number', answer: ['3'] }, '3.0') === true)
check('a wrong number is not accepted', gradeInput({ input: 'number', answer: ['3'] }, '4') === false)
check('a word is graded without its case', gradeInput({ input: 'text', answer: ['Apple'] }, 'apple') === true)
check('a word with spaces is graded', gradeInput({ input: 'text', answer: ['New York'] }, ' new york ') === true)
check('an empty answer is wrong', gradeInput({ input: 'text', answer: ['apple'] }, '  ') === false)
check('a question may accept two spellings', gradeInput({ input: 'text', answer: ['colour', 'color'] }, 'color') === true)

// The generators of the new shapes.
check('the Chinese bank has a matching question', CHINESE_TYPES[3].some((f) => f.name === 'poemMatch'))
check('the Chinese bank has an ordering question', CHINESE_TYPES[3].some((f) => f.name === 'solarTerms'))
check('the English bank has a filled-in question', !!ENGLISH_TYPES['spelling-input'])
check('the maths bank has a filled-in question', MATH_TYPES[3].some((f) => f.name === 'mulInput'))
check('the logic bank has a true-or-false question', LOGIC_TYPES[3].some((f) => f.name === 'trueFalse'))

const shapeRng = createRng(11)
const poemPair = CHINESE_TYPES[3].find((f) => f.name === 'poemMatch')(shapeRng, 3)
check('the matching question carries its pairs', Array.isArray(poemPair.pairs) && poemPair.pairs.length === 4)
check('the matching question carries a shuffled column', Array.isArray(poemPair.rights) && poemPair.rights.length === 4)
check('the matching question keeps every right answer', poemPair.pairs.every((p) => poemPair.rights.includes(p[1])))
const termOrder = CHINESE_TYPES[3].find((f) => f.name === 'solarTerms')(shapeRng, 3)
check('the ordering question carries the right order', Array.isArray(termOrder.order) && termOrder.order.length === 4)
check('the ordering question shuffles the items', termOrder.items.join() !== termOrder.order.join())
const mulFill = MATH_TYPES[3].find((f) => f.name === 'mulInput')(shapeRng, 3)
check('the filled-in maths question asks for a number', mulFill.input === 'number' && !!mulFill.answer)

// The helpers the generators use.
const built = inputQuestion('1 + 1 = ?', 2, shapeRng, { input: 'number' })
check('the fill helper keeps the answer', built.answer.includes(2))
const builtPairs = pairsQuestion('连一连', [['a', '1'], ['b', '2']], shapeRng)
check('the pairing helper keeps both sides', builtPairs.pairs.length === 2 && builtPairs.rights.length === 2)
const builtOrder = orderQuestion('排一排', ['x', 'y'], shapeRng)
check('the ordering helper keeps the right order', builtOrder.order.join() === 'x,y')

/* ------------------------------ 11. the rewards ------------------------------- */

check('the easy level pays five gold', rewardFor({ grade: 3, type: 'math' }, 'easy') === 5)
check('the easy level pays five gold for grade four', rewardFor({ grade: 4, type: 'math' }, 'easy') === 5)
check('the normal level pays the original numbers', rewardFor({ grade: 3, type: 'math' }, 'normal') === 19)
check('the hard level cuts the normal price by a fifth', rewardFor({ grade: 4, type: 'math' }, 'hard') === 19)
check('the easy level ignores the subject bonus', rewardFor({ grade: 3, type: 'logic' }, 'easy') === 5)
