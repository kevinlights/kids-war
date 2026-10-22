<template>
  <div class="qbody">
    <!-- Multiple choice: the default shape. -->
    <div v-if="isChoice" class="answers">
      <button
        v-for="(opt, i) in question.options"
        :key="i"
        class="answer"
        :class="answerClass(i)"
        :disabled="disabled"
        @click="choose(i)"
      >
        <span class="letter">{{ 'ABCD'[i] }}</span>
        <span class="text">{{ opt }}</span>
      </button>
    </div>

    <!-- A filled-in answer: the child types it. -->
    <div v-else-if="isInput" class="fill">
      <div class="fill-row">
        <input
          v-model="typed"
          class="fill-input"
          :inputmode="isNumber ? 'numeric' : 'text'"
          :placeholder="isNumber ? '在这里写数字' : '在这里写答案'"
          :disabled="disabled"
          @keyup.enter="submitInput"
        />
        <button class="btn small" :disabled="disabled || !typed.trim()" @click="submitInput">确认</button>
      </div>
      <p class="muted small">
        {{ isNumber ? '直接写出答案：这一次没有选项，蒙不出来。' : '把答案写出来，注意别写错字。' }}
      </p>
    </div>

    <!-- A matching question: the child connects the two sides. -->
    <div v-else-if="isPairs" class="match">
      <p class="muted small">先点左边一项，再点右边配对的那一项。</p>
      <div class="match-cols">
        <div class="match-col">
          <div class="col-title">{{ question.leftLabel || '左边' }}</div>
          <button
            v-for="(pair, i) in question.pairs"
            :key="'l' + i"
            class="match-item"
            :class="{ on: selected === i, done: links[i] !== undefined }"
            :disabled="disabled"
            @click="pickLeft(i)"
          >
            <span>{{ pair[0] }}</span>
            <i v-if="links[i] !== undefined" class="link-mark">{{ question.rights[links[i]] }}</i>
          </button>
        </div>
        <div class="match-col">
          <div class="col-title">{{ question.rightLabel || '右边' }}</div>
          <button
            v-for="(right, i) in question.rights"
            :key="'r' + i"
            class="match-item right"
            :class="{ used: usedRight.includes(i) }"
            :disabled="disabled || usedRight.includes(i)"
            @click="pickRight(i)"
          >
            <span>{{ right }}</span>
          </button>
        </div>
      </div>
      <div class="match-actions">
        <button class="btn small ghost" :disabled="disabled || !Object.keys(links).length" @click="resetPairs">
          ↩ 重来
        </button>
        <button
          class="btn small"
          :disabled="disabled || Object.keys(links).length !== question.pairs.length"
          @click="submitPairs"
        >
          确认
        </button>
      </div>
    </div>

    <!-- An ordering question: the child puts the items in order. -->
    <div v-else-if="isOrder" class="order">
      <p class="muted small">按顺序点下面的词，把它们排好。</p>
      <ol class="order-list">
        <li v-for="(item, i) in placed" :key="'p' + i">
          <span class="idx">{{ i + 1 }}</span>{{ item }}
        </li>
        <li v-if="!placed.length" class="empty muted">还没有选任何一项</li>
      </ol>
      <div class="order-pool">
        <button
          v-for="(item, i) in question.items"
          :key="'i' + i"
          class="pool-item"
          :class="{ used: placed.includes(item) }"
          :disabled="disabled || placed.includes(item)"
          @click="place(item)"
        >
          {{ item }}
        </button>
      </div>
      <div class="match-actions">
        <button class="btn small ghost" :disabled="disabled || !placed.length" @click="undo">↩ 撤销</button>
        <button
          class="btn small"
          :disabled="disabled || placed.length !== question.order.length"
          @click="submitOrder"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * The answer area of a question.
 *
 * A question comes in four shapes and this component renders all of them:
 *
 *   options   multiple choice — tapping an option answers at once
 *   input     a filled-in answer — the child types it and confirms
 *   pairs     a matching question — the child connects the two sides
 *   items     an ordering question — the child puts the items in order
 *
 * The component emits `answered` with `{ correct, detail }`; `detail` is a
 * short description of the right answer, shown in the feedback box.
 */
import { computed, ref, watch } from 'vue'
import { gradeInput } from '@/game/quiz/shared'

const props = defineProps({
  question: { type: Object, required: true },
  // The question was already answered: the area is read only now.
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['answered'])

// The state of the three interactive shapes.
const typed = ref('')
const selected = ref(-1)
const links = ref({})
const usedRight = ref([])
const placed = ref([])

const isChoice = computed(() => Array.isArray(props.question.options))
const isInput = computed(() => !!props.question.input)
const isPairs = computed(() => Array.isArray(props.question.pairs))
const isOrder = computed(() => Array.isArray(props.question.items))
const isNumber = computed(() => props.question.input === 'number')

// A new question starts from a clean slate.
watch(
  () => props.question,
  () => {
    typed.value = ''
    selected.value = -1
    links.value = {}
    usedRight.value = []
    placed.value = []
  }
)

/** The class of one option: right, wrong or dimmed. */
function answerClass(i) {
  if (props.disabled) {
    if (i === props.question.answer) return 'right'
    return 'dim'
  }
  return ''
}

function choose(i) {
  if (props.disabled) return
  const correct = i === props.question.answer
  emit('answered', {
    correct,
    detail: correct ? '' : `正确答案：${props.question.options[props.question.answer]}`
  })
}

function submitInput() {
  if (props.disabled) return
  const correct = gradeInput(props.question, typed.value)
  emit('answered', {
    correct,
    detail: correct ? '' : `正确答案：${[].concat(props.question.answer).join(' / ')}`
  })
}

function pickLeft(i) {
  if (props.disabled) return
  selected.value = selected.value === i ? -1 : i
}

function pickRight(i) {
  if (props.disabled || selected.value < 0) return
  const left = selected.value
  if (links.value[left] !== undefined) return
  links.value = { ...links.value, [left]: i }
  usedRight.value = [...usedRight.value, i]
  selected.value = -1
}

function resetPairs() {
  links.value = {}
  usedRight.value = []
  selected.value = -1
}

function submitPairs() {
  if (props.disabled) return
  const pairs = props.question.pairs
  const rights = props.question.rights
  let correct = true
  for (let i = 0; i < pairs.length; i += 1) {
    const right = links.value[i]
    if (right === undefined || rights[right] !== pairs[i][1]) {
      correct = false
      break
    }
  }
  const detail = pairs.map((pair) => `${pair[0]} → ${pair[1]}`).join('；')
  emit('answered', { correct, detail: correct ? '' : `正确配对：${detail}` })
}

function place(item) {
  if (props.disabled) return
  placed.value = [...placed.value, item]
}

function undo() {
  if (props.disabled) return
  placed.value = placed.value.slice(0, -1)
}

function submitOrder() {
  if (props.disabled) return
  const right = props.question.order
  const correct =
    placed.value.length === right.length && placed.value.every((item, i) => item === right[i])
  emit('answered', {
    correct,
    detail: correct ? '' : `正确顺序：${right.join(' → ')}`
  })
}
</script>

<style scoped>
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

.small {
  font-size: 12.5px;
  margin: 0;
}

/* The filled-in answer. */
.fill-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.fill-input {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.35);
  color: var(--ink);
  font-size: 17px;
  outline: none;
}

.fill-input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(232, 197, 106, 0.16);
}

/* The matching question. */
.match-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.match-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* The title of a column, so the two sides are easy to tell apart. */
.col-title {
  font-size: 12px;
  font-weight: 800;
  color: var(--gold);
  letter-spacing: 1px;
}

.match-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  font-size: 14.5px;
  text-align: left;
  line-height: 1.5;
  transition: all 0.15s;
}

.match-item:hover:not(:disabled) {
  border-color: var(--gold);
}

.match-item.on {
  border-color: var(--gold);
  background: rgba(232, 197, 106, 0.18);
}

.match-item.done {
  opacity: 0.75;
}

.match-item.used {
  opacity: 0.35;
}

.link-mark {
  display: block;
  margin-top: 3px;
  font-style: normal;
  font-size: 11.5px;
  color: var(--gold);
}

.match-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* The ordering question. */
.order-list {
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--line);
  font-size: 14.5px;
}

.order-list .idx {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(232, 197, 106, 0.2);
  color: var(--gold);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.order-list .empty {
  color: var(--ink-dim);
  font-size: 13px;
}

.order-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.pool-item {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--line);
  font-size: 14px;
}

.pool-item:hover:not(:disabled) {
  border-color: var(--gold);
}

.pool-item.used {
  opacity: 0.3;
}

@media (max-width: 560px) {
  .answers {
    grid-template-columns: 1fr;
  }

  .answer {
    font-size: 15px;
    padding: 14px 12px;
  }

  .match-cols {
    grid-template-columns: 1fr;
  }
}
</style>
