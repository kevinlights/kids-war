<template>
  <div class="overlay" @click.self="onBackdrop">
    <div class="exam panel pop">
      <!-- Setup -->
      <div v-if="step === 'setup'" class="body">
        <h2>📜 {{ settlement.name }} · 考试任务</h2>
        <p class="muted">答对题目才能获得资金，题目分为年级与科目，答对越多奖励越多。</p>
        <p class="muted">
          🧠 记忆曲线：答对的题会越出越少、答错的题会反复出现。
          已记录 {{ memory.tracked }} 题，掌握 {{ memory.mastered }} 题。
        </p>

        <div class="field">
          <label>试卷类型</label>
          <div class="options">
            <button class="opt" :class="{ on: mode === 'standard' }" @click="mode = 'standard'">
              📖 标准考试
            </button>
            <button
              class="opt"
              :class="{ on: mode === 'mistakes' }"
              :disabled="!mistakeList.length"
              @click="mode = 'mistakes'"
            >
              🔁 只考错题{{ mistakeList.length ? ' · ' + mistakeList.length : '' }}
            </button>
            <button
              class="opt"
              :class="{ on: mode === 'review' }"
              :disabled="!dueList.length"
              @click="mode = 'review'"
            >
              ⏰ 复习队列{{ dueList.length ? ' · ' + dueList.length : '' }}
            </button>
          </div>
          <p v-if="mode === 'mistakes'" class="muted small">
            这一张卷子只出你答错过的题（{{ mistakeList.length }} 道），答对一次就把它从错题本里划掉。
          </p>
          <p v-else-if="mode === 'review'" class="muted small">
            这一张卷子只出该复习的题（{{ dueList.length }} 道）：很久没见、还没掌握的题先回来一趟。
          </p>
        </div>

        <div v-if="masteryRows.length" class="field">
          <label>掌握度地图</label>
          <div class="mastery">
            <div v-for="row in masteryRows" :key="row.type" class="mastery-row">
              <span class="m-name">{{ row.icon }} {{ row.name }}</span>
              <div class="m-bar"><div class="m-fill" :style="{ width: row.percent + '%' }"></div></div>
              <span class="muted small">{{ row.mastered }}/{{ row.tracked }} 掌握 · 该复习 {{ row.due }}</span>
            </div>
          </div>
        </div>

        <div class="field">
          <label>题目等级</label>
          <div class="options">
            <button
              v-for="g in GRADES"
              :key="g.key"
              class="opt"
              :class="{ on: grade === g.key }"
              @click="grade = g.key"
            >
              {{ g.name }}
            </button>
          </div>
        </div>

        <div class="field">
          <label>科目（可多选）</label>
          <div class="options">
            <button
              v-for="s in subjects"
              :key="s.key"
              class="opt"
              :class="{ on: selected.includes(s.key) }"
              @click="toggleType(s.key)"
            >
              {{ s.icon }} {{ s.name }}
            </button>
          </div>
        </div>

        <div class="field">
          <label>题目数量</label>
          <div class="options">
            <button v-for="n in [5, 8, 12]" :key="n" class="opt" :class="{ on: count === n }" @click="count = n">
              {{ n }} 题
            </button>
          </div>
        </div>

        <div class="actions">
          <button class="btn" :disabled="!selected.length || !canStart" @click="startExam">开始考试</button>
          <button class="btn ghost" @click="$emit('close')">离开</button>
        </div>
      </div>

      <!-- Quiz -->
      <div v-else-if="step === 'quiz'" class="body quiz">
        <div class="exam-top">
          <span class="chip">{{ currentIcon }} {{ currentTypeName }}</span>
          <span class="chip">{{ gradeName }}</span>
          <span v-if="streak > 1" class="chip streak">🔥 连击 ×{{ streak }}</span>
          <span class="progress-text">第 {{ index + 1 }} / {{ paper.length }} 题 · 已答对 {{ correctCount }}</span>
        </div>
        <div class="progress"><div class="bar" :style="{ width: progressPct + '%' }"></div></div>

        <div class="question">{{ current.prompt }}</div>

        <!-- The answer area: multiple choice, a filled-in answer, a matching
             question or an ordering question. -->
        <QuestionBody :question="current" :disabled="chosen !== null" @answered="onAnswered" />

        <div class="feedback" :class="chosen === current.answer ? 'ok' : 'bad'">
          <template v-if="chosen === null">{{ answerPrompt }}</template>
          <template v-else-if="lastCorrect">✅ 答对了！+{{ lastReward }} 金币</template>
          <template v-else>❌ 答错了{{ lastDetail ? '，' + lastDetail : '' }}</template>
          <div v-if="chosen !== null && current.explain" class="explain">💡 {{ current.explain }}</div>
        </div>

        <div class="actions">
          <button class="btn" :disabled="chosen === null" @click="next">
            {{ index + 1 >= paper.length ? '查看成绩' : '下一题' }}
          </button>
          <button class="btn ghost" @click="finishEarly">提前交卷</button>
        </div>
      </div>

      <!-- Result -->
      <div v-else class="body">
        <h2>{{ settlement_.passed ? '🏅 考试通过' : '📄 考试结束' }}</h2>
        <div class="result-grid">
          <div class="result-item">
            <div class="big">{{ settlement_.correct }} / {{ answered }}</div>
            <div class="muted">答对题数</div>
          </div>
          <div class="result-item">
            <div class="big gold">+{{ settlement_.net }}</div>
            <div class="muted">获得金币</div>
          </div>
        </div>

        <div class="field">
          <label>结算明细</label>
          <div class="breakdown">
            <div class="b-row"><span>题目本身</span><b>{{ settlement_.base }} 金币</b></div>
            <div class="b-row">
              <span>🔥 连击 ×{{ settlement_.streakMul.toFixed(1) }}（最长 {{ settlement_.streak }}）</span>
              <b>{{ bonusLine('streak') }}</b>
            </div>
            <div v-if="settlement_.perfect" class="b-row"><span>🌟 全部答对</span><b>{{ bonusLine('perfect') }}</b></div>
            <div v-if="paper.length >= 12" class="b-row"><span>📜 长卷（12 题）</span><b>{{ bonusLine('long') }}</b></div>
            <div v-if="settlement_.passed" class="b-row"><span>🎯 达到及格线 {{ settlement_.passLine }} 题</span><b>{{ bonusLine('pass') }}</b></div>
            <div v-if="settlement_.capped" class="b-row">
              <span>🎚 练习档整卷上限（×{{ settlement_.paperCap }}）</span>
              <b>−{{ settlement_.beforeCap - settlement_.gold }} 金币</b>
            </div>
          </div>
        </div>

        <div v-if="settlement_.drops.length" class="field">
          <label>获得的道具</label>
          <div class="drops">
            <span v-for="drop in settlement_.drops" :key="drop.key" class="drop">
              {{ drop.icon }} {{ drop.name }} ×{{ drop.count }}
            </span>
          </div>
        </div>

        <div v-if="experienceGain" class="field">
          <label>经验与成长</label>
          <div class="breakdown">
            <div class="b-row"><span>⭐ 经验</span><b>+{{ experienceGain.experience }}</b></div>
            <div v-if="player.availableSkillPoints > 0" class="b-row">
              <span>👑 可分配的属性点</span><b>{{ player.availableSkillPoints }} 点</b>
            </div>
            <div v-if="!experienceGain.experience" class="b-row">
              <span class="muted">这一张卷子没有及格，暂不计入经验。</span>
            </div>
          </div>
        </div>

        <p v-if="isPlayerTown(settlement)" class="muted center-text">
          金币已进入你的钱袋；这座城镇的发展 +{{ townDevelopment }}。需要给城镇添置设施时，用「注入资金」把钱放进城镇金库。
        </p>
        <p v-else class="muted center-text">金币已到账，可以用来招募士兵或购买物资。</p>
        <div class="actions">
          <button class="btn" @click="restart">再来一次</button>
          <button class="btn ghost" @click="$emit('close')">结束</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import QuestionBody from '@/components/QuestionBody.vue'
import { GRADES, ensureModsLoaded, generateExam, listTypes, rewardFor, typeDef } from '@/game/quiz'
import { settlePaper } from '@/game/quiz/reward'
import { dueKeys, mistakeKeys } from '@/game/quiz/mastery'
import { examReward, isPlayerTown } from '@/game/settlement'
import { persistGame } from '@/composables/gameState'

const props = defineProps({ settlement: { type: Object, required: true } })
const emit = defineEmits(['close'])

const player = usePlayerStore()

// Development the exam gave the town.
const townDevelopment = ref(0)

const step = ref('setup')
const grade = ref(3)
// Subjects come from the mod registry; external mods may still be loading, so
// the list is refreshed once the loader promises are settled.
const subjects = ref(listTypes())
const selected = ref(subjects.value.map((s) => s.key))
const count = ref(5)
// 'standard' is an ordinary paper, 'mistakes' only asks the questions that
// were answered wrongly and 'review' only asks the ones that are due.
const mode = ref('standard')

const paper = ref([])
const index = ref(0)
const chosen = ref(null)
const correctCount = ref(0)
const answered = ref(0)
const lastReward = ref(0)
// Whether the last answer was right, and what the right answer was.
const lastCorrect = ref(false)
const lastDetail = ref('')
// Every answer of the paper, in the order it was given: the settlement reads
// them to work out the streak and the drops.
const answers = ref([])
// The settlement of the finished paper.
const settlement_ = ref({ base: 0, net: 0, streak: 0, streakMul: 1, correct: 0, wrong: 0, passed: false, passLine: 0, perfect: false, drops: [] })
const experienceGain = ref({ experience: 0, points: 0 })

const current = computed(() => paper.value[index.value] || { prompt: '', options: [], answer: 0, type: 'math', item: '' })
const currentDef = computed(() => typeDef(current.value.type))
const currentIcon = computed(() => currentDef.value?.icon || '❓')
const currentTypeName = computed(() => currentDef.value?.name || current.value.type)
const gradeName = computed(() => GRADES.find((g) => g.key === grade.value)?.name || '')
const progressPct = computed(() => (index.value / Math.max(1, paper.value.length)) * 100)
const memory = computed(() => player.memorySummary)

/** What the interface asks the child to do, which depends on the shape. */
const answerPrompt = computed(() => {
  const question = current.value
  if (question.input) return '写下你的答案'
  if (question.pairs) return '把左右两栏配成一对'
  if (question.items) return '按顺序点出正确的次序'
  return '选择一个答案'
})

// The mistakes worth repeating and the questions that are due for a review.
const mistakeList = computed(() => mistakeKeys(player.questionStats))
const dueList = computed(() => dueKeys(player.questionStats))

/** The longest run of correct answers so far in this paper. */
const streak = computed(() => {
  let best = 0
  let run = 0
  for (const a of answers.value) {
    if (a.correct) {
      run += 1
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
})

/** One row per subject with its mastery bar and how many are due. */
const masteryRows = computed(() => {
  const mastery = player.mastery || {}
  const due = {}
  for (const key of dueList.value) {
    const type = key.includes('#') ? key.split('#')[0] : key.split(':')[0]
    due[type] = (due[type] || 0) + 1
  }
  return Object.values(mastery)
    .map((row) => {
      const def = typeDef(row.type)
      return {
        type: row.type,
        name: def?.name || row.type,
        icon: def?.icon || '❓',
        percent: row.percent,
        tracked: row.tracked,
        mastered: row.mastered,
        due: due[row.type] || 0
      }
    })
    .sort((a, b) => a.percent - b.percent)
})

/** Whether the chosen mode has anything to draw from. */
const canStart = computed(() => {
  if (mode.value === 'mistakes') return mistakeList.value.length > 0
  if (mode.value === 'review') return dueList.value.length > 0
  return true
})

onMounted(async () => {
  await ensureModsLoaded()
  const known = new Set(selected.value)
  subjects.value = listTypes()
  for (const s of subjects.value) if (!known.has(s.key)) selected.value.push(s.key)
})

function toggleType(key) {
  const i = selected.value.indexOf(key)
  if (i >= 0) selected.value.splice(i, 1)
  else selected.value.push(key)
}

async function startExam() {
  await ensureModsLoaded()
  // Let questions the player has not seen for a while drift back in.
  player.applyQuestionForgetting()
  // The two revision modes draw from a fixed list of question keys.
  let items = null
  if (mode.value === 'mistakes') items = mistakeList.value.slice()
  else if (mode.value === 'review') items = dueList.value.slice()

  paper.value = generateExam({
    grade: grade.value,
    types: selected.value,
    count: count.value,
    weightOf: (entry) => player.questionWeight(entry.item),
    items
  })
  index.value = 0
  chosen.value = null
  correctCount.value = 0
  answered.value = 0
  answers.value = []
  step.value = 'quiz'
}

/**
 * The child answered the question.
 *
 * The answer area knows the shape of the question, so it hands back whether
 * the answer was right and, when it was wrong, what the right answer was.
 */
function onAnswered(result) {
  if (chosen.value !== null) return
  chosen.value = 0
  answered.value += 1
  const correct = !!result?.correct
  player.recordAnswer(current.value.item, correct, Date.now(), grade.value)
  answers.value = [...answers.value, { question: current.value, correct }]
  lastCorrect.value = correct
  lastDetail.value = result?.detail || ''
  if (correct) {
    const r = rewardFor(current.value, player.difficulty)
    correctCount.value += 1
    lastReward.value = r
  } else {
    lastReward.value = 0
  }
}

function next() {
  if (index.value + 1 >= paper.value.length) {
    finish()
  } else {
    index.value += 1
    chosen.value = null
  }
}

function finishEarly() {
  finish()
}

/** The share a single bonus added to the gold, for the breakdown list. */
function bonusLine(kind) {
  const s = settlement_.value
  const mul =
    kind === 'streak'
      ? s.streakMul
      : kind === 'perfect'
        ? 1.5
        : kind === 'long'
          ? 1.1
          : 1.2
  return `+${Math.max(0, Math.round(s.base * (mul - 1)))} 金币`
}

function finish() {
  // The settlement decides what the paper is worth: the streak, a perfect
  // paper, a long paper and the pass line all add to the base price.
  const result = settlePaper({
    answers: answers.value,
    difficulty: player.difficulty
  })
  settlement_.value = result

  // The exam always pays the lord personally — even in one of his own towns,
  // where the money would otherwise be stuck in the treasury.
  player.addGold(result.net)
  // The gear the paper dropped goes straight into the baggage train.
  for (const drop of result.drops) player.addSupply(drop.key, drop.count)

  // A town the lord owns grows from the exam as well: the correct answers lift
  // its development.
  const town = isPlayerTown(props.settlement)
  if (town) {
    const gain = examReward(props.settlement, { correct: correctCount.value })
    townDevelopment.value = gain.development
  }

  // An exam is experience: a paper that reached the pass line teaches.
  experienceGain.value = player.awardPaper({ correct: correctCount.value, passed: result.passed })

  player.stats.exams += 1
  player.stats.correct += correctCount.value
  persistGame()
  step.value = 'result'
}

function restart() {
  step.value = 'setup'
}

function onBackdrop() {
  if (step.value !== 'quiz') emit('close')
}
</script>

<style scoped>
.exam {
  width: min(620px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  padding: 22px;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

h2 {
  margin: 0;
  color: var(--gold);
  font-size: 22px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink-dim);
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.opt {
  padding: 9px 16px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--line);
  font-weight: 600;
  font-size: 14px;
  transition: all 0.15s;
}

.opt:disabled {
  opacity: 0.4;
}

.opt:hover:not(:disabled) {
  border-color: var(--gold);
}

.opt.on {
  background: linear-gradient(180deg, var(--gold), var(--gold-deep));
  color: #2b1e05;
  border-color: #fff6d8;
}

.small {
  font-size: 12.5px;
  margin: 0;
}

/* The mastery map: one bar per subject. */
.mastery {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mastery-row {
  display: grid;
  grid-template-columns: 88px 1fr auto;
  align-items: center;
  gap: 8px;
}

.m-name {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.m-bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.m-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-deep), var(--gold));
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.actions .btn {
  flex: 1;
}

.exam-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chip.streak {
  border-color: var(--gold-deep);
  color: var(--gold);
}

.progress-text {
  font-size: 13px;
  color: var(--ink-dim);
  margin-left: auto;
}

.progress {
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.progress .bar {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-deep), var(--gold));
  transition: width 0.25s ease;
}

.question {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.6;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--line);
  /* A reading passage keeps its own line breaks. */
  white-space: pre-wrap;
}



.feedback {
  font-size: 14.5px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--line);
}

.feedback.ok {
  color: var(--ok);
  border-color: rgba(111, 191, 115, 0.6);
}

.feedback.bad {
  color: #f0a99b;
  border-color: rgba(216, 83, 63, 0.6);
}

.explain {
  margin-top: 6px;
  color: var(--ink-dim);
  font-size: 13px;
  line-height: 1.6;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.result-item {
  padding: 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  text-align: center;
}

.big {
  font-size: 30px;
  font-weight: 800;
}

.big.gold {
  color: var(--gold);
}

.center-text {
  text-align: center;
  margin: 0;
}

/* The settlement breakdown and the gear the paper dropped. */
.breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.b-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13.5px;
  padding: 7px 10px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
}

.b-row b {
  color: var(--gold);
  white-space: nowrap;
}

.drops {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.drop {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(232, 197, 106, 0.16);
  border: 1px solid var(--gold-deep);
  color: var(--gold);
  font-size: 13px;
  font-weight: 700;
}

/* Phones: one answer per row and tighter chrome so a whole question fits. */
@media (max-width: 560px) {
  .exam {
    padding: 16px 14px;
    max-height: 94vh;
  }

  h2 {
    font-size: 19px;
  }

  .question {
    font-size: 17px;
    padding: 12px 14px;
  }

  .progress-text {
    margin-left: 0;
    width: 100%;
  }

  .opt {
    min-height: 40px;
    padding: 10px 14px;
  }

  .mastery-row {
    grid-template-columns: 72px 1fr;
  }

  .mastery-row .small {
    grid-column: 1 / -1;
  }
}
</style>
