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
          <button class="btn" :disabled="!selected.length" @click="startExam">开始考试</button>
          <button class="btn ghost" @click="$emit('close')">离开</button>
        </div>
      </div>

      <!-- Quiz -->
      <div v-else-if="step === 'quiz'" class="body quiz">
        <div class="exam-top">
          <span class="chip">{{ currentIcon }} {{ currentTypeName }}</span>
          <span class="chip">{{ gradeName }}</span>
          <span class="progress-text">第 {{ index + 1 }} / {{ paper.length }} 题 · 已答对 {{ correctCount }}</span>
        </div>
        <div class="progress"><div class="bar" :style="{ width: progressPct + '%' }"></div></div>

        <div class="question">{{ current.prompt }}</div>

        <div class="answers">
          <button
            v-for="(opt, i) in current.options"
            :key="i"
            class="answer"
            :class="answerClass(i)"
            :disabled="chosen !== null"
            @click="choose(i)"
          >
            <span class="letter">{{ 'ABCD'[i] }}</span>
            <span class="text">{{ opt }}</span>
          </button>
        </div>

        <div class="feedback" :class="chosen === current.answer ? 'ok' : 'bad'">
          <template v-if="chosen === null">选择一个答案</template>
          <template v-else-if="chosen === current.answer">✅ 答对了！+{{ lastReward }} 金币</template>
          <template v-else>❌ 答错了，正确答案是 {{ 'ABCD'[current.answer] }}.{{ current.options[current.answer] }}</template>
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
        <h2>{{ earned >= passLine ? '🏅 考试通过' : '📄 考试结束' }}</h2>
        <div class="result-grid">
          <div class="result-item">
            <div class="big">{{ correctCount }} / {{ answered }}</div>
            <div class="muted">答对题数</div>
          </div>
          <div class="result-item">
            <div class="big gold">+{{ earned }}</div>
            <div class="muted">获得金币</div>
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
import { GRADES, ensureModsLoaded, generateExam, listTypes, rewardFor, typeDef } from '@/game/quiz'
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

const paper = ref([])
const index = ref(0)
const chosen = ref(null)
const correctCount = ref(0)
const answered = ref(0)
const earned = ref(0)
const lastReward = ref(0)

const current = computed(() => paper.value[index.value] || { prompt: '', options: [], answer: 0, type: 'math', item: '' })
const currentDef = computed(() => typeDef(current.value.type))
const currentIcon = computed(() => currentDef.value?.icon || '❓')
const currentTypeName = computed(() => currentDef.value?.name || current.value.type)
const gradeName = computed(() => GRADES.find((g) => g.key === grade.value)?.name || '')
const progressPct = computed(() => (index.value / Math.max(1, paper.value.length)) * 100)
const passLine = computed(() => Math.ceil(paper.value.length / 2))
const memory = computed(() => player.memorySummary)

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
  paper.value = generateExam({
    grade: grade.value,
    types: selected.value,
    count: count.value,
    weightOf: (entry) => player.questionWeight(entry.item)
  })
  index.value = 0
  chosen.value = null
  correctCount.value = 0
  answered.value = 0
  earned.value = 0
  step.value = 'quiz'
}

function choose(i) {
  if (chosen.value !== null) return
  chosen.value = i
  answered.value += 1
  const correct = i === current.value.answer
  player.recordAnswer(current.value.item, correct)
  if (correct) {
    const r = rewardFor(current.value, player.difficulty)
    correctCount.value += 1
    earned.value += r
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

function finish() {
  // The exam always pays the lord personally — even in one of his own towns,
  // where the money would otherwise be stuck in the treasury.
  player.addGold(earned.value)
  // A town the lord owns grows from the exam as well: the correct answers lift
  // its development.
  const town = isPlayerTown(props.settlement)
  if (town) {
    const gain = examReward(props.settlement, { correct: correctCount.value })
    townDevelopment.value = gain.development
  }
  player.stats.exams += 1
  player.stats.correct += correctCount.value
  persistGame()
  step.value = 'result'
}

function restart() {
  step.value = 'setup'
}

function answerClass(i) {
  if (chosen.value === null) return ''
  if (i === current.value.answer) return 'right'
  if (i === chosen.value) return 'wrong'
  return 'dim'
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

.opt:hover {
  border-color: var(--gold);
}

.opt.on {
  background: linear-gradient(180deg, var(--gold), var(--gold-deep));
  color: #2b1e05;
  border-color: #fff6d8;
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

.answers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.answer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--line);
  font-size: 15.5px;
  text-align: left;
  transition: all 0.15s;
}

.answer:hover:not(:disabled) {
  border-color: var(--gold);
  transform: translateY(-1px);
}

.answer .letter {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}

.answer.right {
  background: rgba(111, 191, 115, 0.28);
  border-color: var(--ok);
}

.answer.wrong {
  background: rgba(216, 83, 63, 0.26);
  border-color: var(--danger);
}

.answer.dim {
  opacity: 0.5;
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

  .answers {
    grid-template-columns: 1fr;
  }

  .progress-text {
    margin-left: 0;
    width: 100%;
  }

  .answer {
    font-size: 15px;
    padding: 14px 12px;
  }

  .opt {
    min-height: 40px;
    padding: 10px 14px;
  }
}
</style>
