<template>
  <div class="bank scroll">
    <header class="bar">
      <button class="btn ghost small" @click="router.push('/')">← 返回首页</button>
      <h1>🔎 题库检索</h1>
      <span class="muted small count">{{ filtered.length }} 道题</span>
    </header>

    <div class="content">
      <div class="search-row">
        <input
          v-model="query"
          class="search"
          type="search"
          placeholder="搜索题干，例如「古诗」「乘法」「苹果」"
        />
        <button v-if="query" class="btn small ghost" @click="query = ''">清空</button>
      </div>

      <div class="filters">
        <button class="chip" :class="{ on: gradeFilter === 0 }" @click="gradeFilter = 0">全部年级</button>
        <button
          v-for="g in [3, 4]"
          :key="g"
          class="chip"
          :class="{ on: gradeFilter === g }"
          @click="gradeFilter = g"
        >
          {{ g }} 年级
        </button>
      </div>

      <div class="filters">
        <button class="chip" :class="{ on: subject === 'all' }" @click="subject = 'all'">全部科目</button>
        <button
          v-for="s in subjects"
          :key="s.key"
          class="chip"
          :class="{ on: subject === s.key }"
          @click="subject = s.key"
        >
          {{ s.icon }} {{ s.name }}
        </button>
      </div>

      <p v-if="!filtered.length" class="empty muted">
        没有找到这样的题目，换个词试试。
      </p>

      <div class="list">
        <div v-for="row in visible" :key="row.key" class="row" :class="{ open: isOpen(row) }">
          <button class="row-head" @click="toggle(row)">
            <span class="row-meta">
              {{ row.subjectName }} · {{ row.grade }} 年级
              <i class="kind">{{ row.kindName }}</i>
            </span>
            <span class="row-prompt">{{ row.prompt }}</span>
            <span v-if="row.level !== null" class="level" :class="'lv' + row.level">{{ row.levelText }}</span>
          </button>

          <div v-if="isOpen(row)" class="row-body">
            <p class="prompt">{{ row.prompt }}</p>
            <p v-if="row.answerText" class="answer">答案：{{ row.answerText }}</p>
            <p v-if="row.explain" class="explain muted">💡 {{ row.explain }}</p>
            <div class="row-actions">
              <button v-if="row.isTemplate" class="btn small ghost" @click="reroll(row)">换一题</button>
              <span class="muted small key">{{ row.key }}</span>
            </div>
          </div>
        </div>
      </div>

      <button v-if="visible.length < filtered.length" class="btn ghost more" @click="limit += 40">
        显示更多（还有 {{ filtered.length - visible.length }} 道）
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * The question bank browser.
 *
 * Every question the game can draw is listed here: the questions of the
 * declarative packs (the encyclopedia and the external mods) and one sample
 * of every generated template. The list can be searched and filtered, and
 * every row can be opened to see the answer, the explanation and how well
 * the player knows it.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { collectEntries, listTypes, typeDef } from '@/game/quiz'
import { createRng } from '@/game/rng'

const router = useRouter()
const player = usePlayerStore()

const subjects = listTypes()
const query = ref('')
const subject = ref('all')
const gradeFilter = ref(0)
const limit = ref(40)
// Every row that was asked for a different sample.
const rerolls = ref({})
// The rows that are open, kept outside the list so they stay open while the
// list is rebuilt.
const openKeys = ref({})

/** A stable seed for one row, so the same question shows up again and again. */
function seedOf(key) {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return hash
}

/** The text of the answer of a question, whatever shape it has. */
function answerTextOf(question) {
  if (Array.isArray(question.options)) {
    return `${question.options[question.answer]}（${'ABCD'[question.answer]}）`
  }
  if (question.input) {
    return [].concat(question.answer).join(' / ')
  }
  if (Array.isArray(question.pairs)) {
    return question.pairs.map((pair) => `${pair[0]} → ${pair[1]}`).join('；')
  }
  if (Array.isArray(question.order)) {
    return question.order.join(' → ')
  }
  return ''
}

/** The name of the kind of a question, for the little label. */
function kindNameOf(entry) {
  const kind = String(entry.kind || '')
  if (entry.item.includes('#')) return kind || '生成题'
  return kind || '题目'
}

/** Every question of the bank, one sample per entry and grade. */
const rows = computed(() => {
  const out = []
  for (const grade of [3, 4]) {
    for (const entry of collectEntries(grade, null)) {
      const key = `${entry.item}@${grade}`
      const reroll = rerolls.value[key] || 0
      const question = entry.make(createRng(seedOf(key) + reroll * 7919), grade)
      const def = typeDef(entry.type)
      const progress = player.questionStats?.[entry.item]
      const level = progress ? Number(progress.level) || 0 : null
      out.push({
        key,
        item: entry.item,
        type: entry.type,
        grade,
        subjectName: def?.name || entry.type,
        kindName: kindNameOf(entry),
        isTemplate: entry.item.includes('#'),
        prompt: question.prompt,
        answerText: answerTextOf(question),
        explain: question.explain || '',
        level,
        levelText: level === null ? '' : level >= 4 ? '已掌握' : level >= 2 ? '眼熟' : '生疏'
      })
    }
  }
  return out
})

/** Whether a row is open. */
function isOpen(row) {
  return !!openKeys.value[row.key]
}

/** Open or close a row. */
function toggle(row) {
  openKeys.value = { ...openKeys.value, [row.key]: !openKeys.value[row.key] }
}

/** The rows the filters leave. */
const filtered = computed(() => {
  const text = query.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    if (gradeFilter.value && row.grade !== gradeFilter.value) return false
    if (subject.value !== 'all' && row.type !== subject.value) return false
    if (!text) return true
    return (
      row.prompt.toLowerCase().includes(text) ||
      row.subjectName.toLowerCase().includes(text) ||
      row.kindName.toLowerCase().includes(text)
    )
  })
})

const visible = computed(() => filtered.value.slice(0, limit.value))

/** Draw another sample of a generated template. */
function reroll(row) {
  rerolls.value = { ...rerolls.value, [row.key]: (rerolls.value[row.key] || 0) + 1 }
}
</script>

<style scoped>
.bank {
  height: 100%;
  background:
    radial-gradient(720px 360px at 50% -8%, rgba(96, 142, 122, 0.14), transparent 66%),
    linear-gradient(180deg, #131b17 0%, #0c120e 58%, #090d0a 100%);
}

.bar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(9, 13, 10, 0.9);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(6px);
}

.bar h1 {
  margin: 0;
  font-size: 17px;
  color: var(--gold);
  font-weight: 800;
}

.count {
  margin-left: auto;
}

.content {
  max-width: 760px;
  margin: 0 auto;
  padding: 16px 14px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-row {
  display: flex;
  gap: 8px;
}

.search {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.35);
  color: var(--ink);
  font-size: 16px;
  outline: none;
}

.search:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(232, 197, 106, 0.16);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  font-size: 13px;
  font-weight: 600;
}

.chip.on {
  background: rgba(232, 197, 106, 0.2);
  border-color: var(--gold);
  color: var(--gold);
}

.empty {
  padding: 24px;
  text-align: center;
  font-size: 14px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
  overflow: hidden;
}

.row.open {
  border-color: var(--gold-deep);
}

.row-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: 10px 12px;
  text-align: left;
}

.row-meta {
  font-size: 11.5px;
  color: var(--ink-dim);
}

.row-meta .kind {
  font-style: normal;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.row-prompt {
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.level {
  font-size: 11px;
  font-weight: 800;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--ink-dim);
}

.level.lv0,
.level.lv1 {
  background: rgba(216, 83, 63, 0.3);
  color: #ffd9cd;
}

.level.lv2,
.level.lv3 {
  background: rgba(232, 197, 106, 0.25);
  color: var(--gold);
}

.level.lv4,
.level.lv5 {
  background: rgba(111, 191, 115, 0.28);
  color: #d8f0d8;
}

.row-body {
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.prompt {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.answer {
  margin: 0;
  font-size: 14px;
  color: var(--gold);
  font-weight: 700;
}

.explain {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.key {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.6;
}

.more {
  width: 100%;
}

@media (max-width: 560px) {
  .bar {
    padding: 10px 12px;
  }

  .bar h1 {
    font-size: 15px;
  }
}
</style>
