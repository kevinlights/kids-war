<template>
  <div class="home scroll">
    <div class="sky"></div>

    <div class="content">
      <header class="brand">
        <div class="crest">⚔️</div>
        <h1>少年战记</h1>
        <p class="sub">KIDS WAR CHRONICLE · 2D 俯视策略游戏</p>
        <div class="version-badge" :title="`游戏版本 ${versionLabel(VERSION)}`">版本 {{ versionLabel(VERSION) }}</div>
      </header>

      <section class="panel login pop">
        <label class="field">
          <span>领主名字</span>
          <input
            v-model="name"
            maxlength="12"
            placeholder="输入你的名字，例如：小明"
            @keyup.enter="startNew"
          />
        </label>

        <div class="actions">
          <button class="btn" :disabled="!canStart" @click="startNew">🛡️ 开始新的征程</button>
          <button class="btn ghost" :disabled="!canStart || !existingSave" @click="continueExisting">
            📜 继续上次进度
          </button>
          <!-- The quick battle sits on the same level as the two game buttons. -->
          <button class="btn ghost" @click="router.push('/quick')">⚡ 快速战斗</button>
        </div>

        <!-- Difficulty: it decides how much gold a correct exam answer pays. -->
        <div class="difficulty">
          <div class="field-label">
            <span>难度</span>
            <span class="muted diff-note">{{ difficultyNote }}</span>
          </div>
          <div class="diff-row">
            <button
              v-for="d in difficulties"
              :key="d.key"
              class="diff-btn"
              :class="{ on: difficulty === d.key }"
              @click="difficulty = d.key"
            >
              <span class="diff-icon">{{ d.icon }}</span>
              <span class="diff-name">{{ d.name }}</span>
            </button>
          </div>
        </div>

        <p v-if="canStart && !existingSave" class="hint muted">这个名字是新的，将从零开始建立你的队伍。</p>
        <p v-else-if="canStart && existingSave" class="hint muted">检测到已有的存档，可以继续，也可以重新开始覆盖它。</p>

        <div class="footer-links">
          <button class="link" @click="router.push('/guide')">📖 查看游戏介绍与玩法</button>
          <button class="link" @click="showChangelog = true">📋 更新内容</button>
          <button class="link" @click="openShare">📤 分享给好友</button>
        </div>
      </section>

      <section v-if="recent.length" class="recent">
        <div class="recent-title muted">最近玩过的领主</div>
        <div class="chips">
          <button v-for="u in recent" :key="u" class="chip" @click="name = u">{{ u }}</button>
        </div>
      </section>

      <div class="tips">
        <div class="tip-card">🗺️ 点击地图移动，探索世界</div>
        <div class="tip-card">🏰 进入据点招兵买马</div>
        <div class="tip-card">💰 考试答题赚金币</div>
        <div class="tip-card">⚔️ 排兵布阵击败强盗</div>
      </div>

      <!-- Version badge: tapping it opens the update notes in a dialog. -->
      <section class="version">
        <button class="version-badge" @click="showChangelog = true">
          <span class="v-mark">版本</span>
          <span class="v-label">{{ versionLabel(VERSION) }}</span>
          <span class="v-toggle">更新内容 ▼</span>
        </button>
      </section>
    </div>

    <!-- The update notes, in a dialog of their own. -->
    <div v-if="showChangelog" class="overlay" @click.self="showChangelog = false">
      <div class="notes-wrap pop">
        <div class="notes-head">
          <div>
            <div class="notes-version">{{ versionLabel(release.version) }}</div>
            <div class="notes-title">{{ release.title }}</div>
            <div class="notes-date muted">{{ release.date }}</div>
          </div>
          <button class="notes-close" @click="showChangelog = false">✕</button>
        </div>

        <div class="notes-body">
          <ul class="notes-summary">
            <li v-for="(line, i) in release.summary" :key="i">{{ line }}</li>
          </ul>

          <div v-for="b in release.batches" :key="b.batch" class="notes-batch">
            <div class="notes-batch-head">
              <b>批次 {{ b.batch }}</b>
              <span class="notes-batch-title">{{ b.title }}</span>
              <i class="muted">{{ b.date }}</i>
            </div>
            <ul class="notes-items">
              <li v-for="(item, i) in b.items" :key="i">
                <span class="zh">{{ item.zh }}</span>
                <span v-if="item.en" class="en">{{ item.en }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="notes-actions">
          <button class="btn" @click="showChangelog = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- First-time intro shown before the campaign begins -->
    <div v-if="showIntro" class="overlay">
      <div class="intro-wrap pop">
        <GuideContent />
        <div class="intro-actions">
          <button class="btn" @click="confirmStart">开始游戏 →</button>
          <button class="btn ghost" @click="showIntro = false">再想想</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import GuideContent from '@/components/GuideContent.vue'
import { newGame, continueGame, hasSave } from '@/composables/gameState'
import { openShare } from '@/composables/share'
import { listUsers } from '@/game/save'
import { DEFAULT_DIFFICULTY, difficultyList, difficultyOf } from '@/game/difficulty'
import { VERSION, CHANGELOG, versionLabel } from '@/game/versions'

const router = useRouter()
const name = ref('')
const showIntro = ref(false)
const recent = ref(listUsers())
// The version of the game and its update notes, shown in a dialog.
const release = CHANGELOG[0]
const showChangelog = ref(false)
// The difficulty of a new campaign: it only changes the exam reward.
const difficulty = ref(DEFAULT_DIFFICULTY)

const difficulties = difficultyList()
const difficultyNote = computed(() => difficultyOf(difficulty.value).note)

const canStart = computed(() => name.value.trim().length > 0)
const existingSave = computed(() => (canStart.value ? hasSave(name.value.trim()) : false))

function startNew() {
  if (!canStart.value) return
  const trimmed = name.value.trim()
  if (hasSave(trimmed) && !window.confirm(`「${trimmed}」已有存档，重新开始会覆盖它，确定吗？`)) return
  showIntro.value = true
}

function confirmStart() {
  const trimmed = name.value.trim()
  newGame(trimmed, difficulty.value)
  router.push('/world')
}

function continueExisting() {
  const trimmed = name.value.trim()
  if (continueGame(trimmed)) {
    router.push('/world')
  } else {
    window.alert('没有找到可用的存档。')
  }
}
</script>

<style scoped>
.home {
  position: relative;
  height: 100%;
  background:
    radial-gradient(1000px 500px at 50% -5%, rgba(232, 197, 106, 0.14), transparent 62%),
    linear-gradient(180deg, #1a2418, #0c110c);
}

.sky {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 26px 26px;
  opacity: 0.5;
  pointer-events: none;
}

.content {
  position: relative;
  max-width: 560px;
  margin: 0 auto;
  padding: 48px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.brand {
  text-align: center;
}

.crest {
  font-size: 56px;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.6));
}

h1 {
  margin: 6px 0 4px;
  font-size: 42px;
  letter-spacing: 10px;
  color: var(--gold);
  text-shadow: 0 4px 0 #6d5119, 0 10px 24px rgba(0, 0, 0, 0.6);
}

.sub {
  margin: 0;
  font-size: 12.5px;
  letter-spacing: 3px;
  color: var(--ink-dim);
}

.login {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
}

.field input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.4);
  color: var(--ink);
  font-size: 16px;
  outline: none;
}

.field input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(232, 197, 106, 0.16);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.actions .btn {
  flex: 1;
  min-width: 160px;
}

/* Difficulty picker: three big buttons, one per level. */
.difficulty {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
  font-weight: 700;
}

.diff-note {
  font-size: 12px;
  font-weight: 400;
  text-align: right;
}

.diff-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.diff-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 52px;
  padding: 8px 4px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  transition: all 0.15s;
}

.diff-btn.on {
  background: rgba(232, 197, 106, 0.2);
  border-color: var(--gold);
  color: var(--gold);
}

.diff-icon {
  font-size: 18px;
}

.diff-name {
  font-size: 14px;
  font-weight: 700;
}

.hint {
  margin: 0;
  font-size: 13px;
}

.link {
  align-self: center;
  font-size: 14px;
  color: var(--gold);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.footer-links {
  display: flex;
  gap: 10px 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.recent {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.recent-title {
  font-size: 13px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.chip:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.tips {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 6px;
}

.tip-card {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  font-size: 13.5px;
  text-align: center;
}

/* Version badge and the update notes it opens. */
.version {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.version-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--ink-dim);
}

.v-mark {
  color: var(--ink-dim);
}

.v-label {
  font-weight: 800;
  color: var(--gold);
  letter-spacing: 1px;
}

.v-toggle {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* The update notes: a dialog of their own. */
.notes-wrap {
  width: min(680px, 100%);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: #141a13;
  border: 1px solid var(--gold-deep);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.notes-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--line);
  background: rgba(232, 197, 106, 0.08);
}

.notes-version {
  font-size: 24px;
  font-weight: 800;
  color: var(--gold);
  letter-spacing: 2px;
}

.notes-title {
  font-size: 13.5px;
  color: var(--ink);
}

.notes-date {
  font-size: 12px;
}

.notes-close {
  font-size: 18px;
  line-height: 1;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  color: var(--ink-dim);
}

.notes-close:hover {
  color: var(--gold);
  border-color: var(--gold);
}

.notes-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.notes-summary {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--gold);
}

.notes-batch {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
}

.notes-batch-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}

.notes-batch-head b {
  color: var(--gold);
}

.notes-batch-title {
  color: var(--ink);
}

.notes-batch-head i {
  font-style: normal;
  font-size: 11.5px;
}

.notes-items {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.notes-items li {
  font-size: 13px;
  line-height: 1.55;
}

.notes-items .zh {
  display: block;
  color: var(--ink);
}

.notes-items .en {
  display: block;
  font-size: 11.5px;
  color: var(--ink-dim);
}

.notes-actions {
  display: flex;
  justify-content: center;
  padding: 12px;
  border-top: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.3);
}

.intro-wrap {
  width: min(820px, 100%);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #141a13;
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.intro-wrap :deep(.guide) {
  overflow-y: auto;
}

.intro-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 14px;
  border-top: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.3);
}

/* Phones: tighter padding and a smaller title so the login card stays above
   the fold on a phone that is mainly played in portrait. */
@media (max-width: 560px) {
  .content {
    padding: 30px 16px 40px;
    gap: 14px;
  }

  .crest {
    font-size: 46px;
  }

  h1 {
    font-size: 34px;
    letter-spacing: 6px;
  }

  .sub {
    font-size: 11px;
    letter-spacing: 2px;
  }

  .login {
    padding: 18px 16px;
  }

  .actions .btn {
    min-width: 0;
  }

  .intro-actions .btn {
    flex: 1;
  }
}
</style>
