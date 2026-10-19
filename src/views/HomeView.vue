<template>
  <div class="home scroll">
    <div class="sky"></div>

    <div class="content">
      <header class="brand">
        <div class="crest">⚔️</div>
        <h1>少年战记</h1>
        <p class="sub">KIDS WAR CHRONICLE · 2D 俯视策略游戏</p>
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
        </div>

        <p v-if="canStart && !existingSave" class="hint muted">这个名字是新的，将从零开始建立你的队伍。</p>
        <p v-else-if="canStart && existingSave" class="hint muted">检测到已有的存档，可以继续，也可以重新开始覆盖它。</p>

        <div class="footer-links">
          <button class="link" @click="router.push('/guide')">📖 查看游戏介绍与玩法</button>
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

const router = useRouter()
const name = ref('')
const showIntro = ref(false)
const recent = ref(listUsers())

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
  newGame(trimmed)
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
