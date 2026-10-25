<template>
  <div class="battle-view">
    <BattleMap class="map" @end="onEnd" />

    <div class="hud-top">
      <div class="hud-row">
        <div class="side player">
          <span class="dot" style="background: #4aa3ff"></span>
          我方 {{ playerAlive }}
        </div>
        <div class="vs">{{ title }}</div>
        <div class="side enemy">
          <span class="dot" :style="{ background: enemyColor }"></span>
          {{ enemyName }} {{ enemyAlive }}
        </div>
      </div>
      <!-- The two generals: their own hit points and the bodyguards still
           standing in front of them. A general is not a squad — his bar is
           what tells the child whether he can risk a chase. -->
      <div class="gen-row">
        <div class="gen" :class="{ hurt: lord && lord.percent < 34, down: !lord || !lord.alive }">
          <span class="gen-icon">👑</span>
          <span class="gen-bar"><i :style="{ width: (lord ? lord.percent : 0) + '%' }"></i></span>
          <span class="gen-hp">{{ lord ? lord.hp : 0 }}/{{ lord ? lord.maxHp : 0 }}</span>
          <span class="gen-guard" :title="`亲兵 ${lord ? lord.guardsAlive : 0} 人`">
            🛡{{ lord ? lord.guardsAlive : 0 }}
          </span>
        </div>
        <div
          v-if="enemyGeneral"
          class="gen enemy"
          :class="{ hurt: enemyGeneral.percent < 34 }"
          :title="`${enemyGeneral.name} · 被击倒 ${enemyGeneral.downs} 次`"
        >
          <span class="gen-icon">🗡</span>
          <span class="gen-bar"><i :style="{ width: enemyGeneral.percent + '%' }"></i></span>
          <span class="gen-hp">{{ enemyGeneral.hp }}/{{ enemyGeneral.maxHp }}</span>
          <span class="gen-guard">🛡{{ enemyGeneral.guardsAlive }}</span>
        </div>
      </div>
    </div>

    <div v-if="hungry" class="warn">🌾 军粮不足，部队士气低落（攻击下降）</div>

    <div v-if="intel" class="intel">🧠 敌方构成：{{ intel }}</div>

    <!-- The last stand: one side has lost every soldier and its general holds
         the field alone. The bar drains to zero, and then he yields. -->
    <div v-if="lastStand" class="last-stand" :class="{ mine: lastStand.mine }">
      <div class="ls-head">
        <span class="ls-title">{{ lastStand.mine ? '🛡 只剩主将一人！' : '⚔️ 敌军只剩主将' }}</span>
        <span class="ls-time">{{ Math.ceil(lastStand.left) }} 秒</span>
      </div>
      <div class="ls-bar"><i :style="{ width: lastStand.percent + '%' }"></i></div>
      <div class="ls-row">
        <span class="ls-text">
          {{ lastStand.mine ? '士兵都倒下了，主将正在孤军奋战' : '他的士兵都倒下了，还在死撑' }}
        </span>
        <button v-if="lastStand.mine" class="ls-btn" @click="withdraw">🏳 撤退</button>
      </div>
    </div>

    <!-- Battle tools: speed, terrain legend and the camera. A quick battle
         also has its way out: the fight is only practice, so it can be left
         at any moment instead of waiting for one side to break. -->
    <div class="hud-tools">
      <button
        v-if="quick"
        class="tool quit"
        title="退出这场快速战斗，回到设置"
        @click="returnToWorld"
      >
        <span class="quit-icon">←</span><span class="quit-text">返回</span>
      </button>
      <button class="tool" :class="{ on: showTools }" @click="showTools = !showTools">
        <span class="tool-icon">⚙</span><span class="tool-speed">{{ speedInfo.name }}</span>
      </button>
      <button class="tool" title="回到战斗" @click="battle.recenter()">🎯</button>
      <!-- The frame rate of the arena: the number a stutter shows up in. -->
      <span class="fps" :class="fpsTone" :title="fpsTitle">
        <b>{{ fps }}</b><span class="fps-label"> FPS</span>
      </span>
    </div>

    <div v-if="showTools" class="tools-panel panel">
      <div class="tools-title">战斗速度</div>
      <div class="speed-row">
        <button
          v-for="s in SPEEDS"
          :key="s.key"
          class="speed-btn"
          :class="{ on: battle.speed === s.key }"
          :title="s.note"
          @click="battle.setSpeed(s.key)"
        >
          <span class="sp-icon">{{ s.icon }}</span>
          <span class="sp-name">{{ s.name }}</span>
        </button>
      </div>
      <div class="tools-title">战场地形</div>
      <div class="terrain-list">
        <div v-for="t in TERRAINS" :key="t.key" class="terrain-row">
          <i class="terrain-dot" :style="{ background: t.color }"></i>
          <span class="terrain-name">{{ t.name }}</span>
          <span class="terrain-note">{{ t.note }}</span>
        </div>
      </div>
      <p class="tools-hint">用手指拖动战场可以查看别的地方，点「🎯」让镜头回到战斗。</p>
    </div>

    <!-- A phone's edge swipe is a browser back step. The fight is a
         commitment, so the swipe is refused and this says why. -->
    <div v-if="leaveHint" class="leave-hint">{{ leaveHint }}</div>

    <div class="command">
      <!-- Training: the session ends whenever the lord wants it to. -->
      <button v-if="training" class="end-train" @click="returnToWorld">🏕 结束练兵，回到世界地图</button>

      <!-- The opening standoff: both armies hold, the enemy dresses its ranks,
           and this is the order that starts the lord's own advance. -->
      <div v-if="standoff" class="standoff">
        <span class="standoff-text">{{ standoff }}</span>
        <button class="standoff-btn" @click="battle.allAttack()">⚔️ 全军出击</button>
      </div>

      <!-- Squad selector: one chip per family and rank, plus 全军. -->
      <div class="chips">
        <button class="chip all" :class="{ on: battle.selectedGroup === null }" @click="battle.selectGroup(null)">
          <span class="chip-art">🎖️</span>
          <span class="chip-text"><b>全军</b><i>{{ playerAlive }} 名</i></span>
        </button>
        <button
          v-for="g in groups"
          :key="g.key"
          class="chip"
          :class="{ on: battle.selectedGroup === g.key, gone: g.alive === 0 }"
          @click="battle.selectGroup(g.key)"
        >
          <img class="chip-art" :src="spriteUrl(unitSprite(g.type, g.tier))" :alt="g.name" />
          <span class="chip-text">
            <b>{{ g.name }}</b>
            <i>{{ g.alive }}/{{ g.total }} 名</i>
          </span>
          <span class="chip-tag">{{ orderOf(g.order).icon }} {{ formationOf(g.formation).icon }}</span>
        </button>
      </div>

      <!-- Tactics: applied to the selected squad, or to everyone. -->
      <div class="row orders">
        <button
          v-for="o in ORDERS"
          :key="o.key"
          class="cmd"
          :class="{ on: order === o.key }"
          :title="o.hint"
          @click="battle.setOrder(o.key)"
        >
          <span class="cmd-icon">{{ o.icon }}</span>
          <span class="cmd-name">{{ o.name }}</span>
        </button>
      </div>

      <!-- Formation and density, folded away by default to keep the field big. -->
      <button class="sheet-toggle" @click="showSheet = !showSheet">
        <span>▦ 队形 · {{ formationLabel }} · {{ densityLabel }}</span>
        <span class="chev">{{ showSheet ? '▾' : '▴' }}</span>
      </button>

      <div v-if="showSheet" class="sheet">
        <div class="sheet-row">
          <button
            v-for="f in FORMATIONS"
            :key="f.key"
            class="grid-btn"
            :class="{ on: formation === f.key }"
            :title="f.note"
            @click="battle.setFormation(f.key)"
          >
            <span class="gb-icon">{{ f.icon }}</span>
            <span class="gb-name">{{ f.name }}</span>
          </button>
        </div>
        <div class="sheet-row dens">
          <button
            v-for="d in DENSITIES"
            :key="d.key"
            class="grid-btn wide"
            :class="{ on: density === d.key }"
            :title="d.note"
            @click="battle.setDensity(d.key)"
          >
            <span class="gb-icon">{{ d.icon }}</span>
            <span class="gb-name">{{ d.name }}</span>
          </button>
        </div>
        <p class="sheet-note">{{ sheetNote }}</p>
      </div>

      <div class="hint">{{ hint }}</div>
    </div>

    <!-- Result overlay -->
    <div v-if="result" class="overlay">
      <div class="result panel pop">
        <h2 :class="result.outcome === 'general' ? 'lose' : result.outcome">
          {{ result.outcome === 'win' ? '🏆 大获全胜' : result.outcome === 'general' ? '⚔️ 敌将倒下' : '💀 战斗失利' }}
        </h2>

        <div v-if="quick && result.outcome === 'win'" class="loot">
          <div class="loot-item">⚡ 快速战斗 <b>这场练习不计入战绩</b></div>
        </div>
        <div v-else-if="result.outcome === 'win'" class="loot">
          <div class="loot-item">🪙 战利品 <b>+{{ result.loot }}</b></div>
          <div v-if="result.badgeGold" class="loot-item">🏅 徽章 <b>+{{ result.badgeGold }}</b></div>
          <div v-if="result.recruits" class="loot-item">🎖️ 收编俘虏 <b>+{{ result.recruits }} 民兵</b></div>
          <div v-if="result.captured" class="loot-item">🏛️ 占领城镇 <b>这座城镇归你了</b></div>
          <div v-if="result.generalFled" class="loot-item">🗡 敌将 <b>只身逃走，队伍已经打光</b></div>
        </div>
        <p v-else-if="result.outcome === 'general' && !quick" class="muted lose-tip">
          敌人的主将被打倒了，双方都退回地图上的战场周围。追不追、跑不跑，由你决定。
        </p>
        <p v-else-if="result.withdrew && !quick" class="muted lose-tip">
          最后一个士兵也倒下了，主将只身退出战场 —— 这一场不会再扣你什么。
        </p>
        <p v-else-if="quick" class="muted lose-tip">这次的损失只是练习里的事，你的队伍没有少一个士兵。</p>
        <p v-else class="muted lose-tip">部队损失惨重，退回安全地带修养，先去城镇考试赚钱补充兵力吧。</p>

        <!-- The lord himself went down: the battle is lost on the spot and
             this is what it cost. -->
        <div v-if="result.lordDown && !quick" class="lord-down">
          <div class="ld-title">👑 主将倒下，战斗立刻结束</div>
          <div>🩸 士兵散去一半：损失 <b>{{ result.halfLost || 0 }}</b> 名</div>
          <div v-if="result.relocated">🐴 亲兵把你抬回战场附近的一处空地</div>
          <div>❤️ 生命恢复到一半，之后随时间慢慢恢复；在自己的城镇恢复得更快</div>
          <div>🏃 敌人还在附近，可以继续追上来 —— 快带着队伍跑，或者回头再打</div>
        </div>
        <p v-else-if="result.lordDown" class="muted lose-tip">👑 主将在这场练习里倒下了，真实战役不受影响。</p>

        <!-- The warband was wiped out and the lord walked off the field on his
             own two feet: nothing else is taken from him. -->
        <div v-if="result.withdrew && !quick" class="lord-down">
          <div class="ld-title">🛡 士兵全部倒下，主将退出战场</div>
          <div>💔 队伍打光了：这一场不会再损失第二批士兵</div>
          <div v-if="result.saved">🏥 有 {{ result.saved }} 名伤兵被抬了回来（各剩 1 点生命）</div>
          <div v-if="result.relocated">🐴 你退回战场附近的一处空地，还剩 {{ player.lordHp }} 点生命</div>
          <div>🏃 敌人还在这一带 —— 先去城镇考试赚钱，把队伍补起来再回来</div>
        </div>
        <p v-else-if="result.withdrew" class="muted lose-tip">🛡 士兵在这里打光了，主将退出了练习战场。</p>

        <div class="casualties">
          <div class="casualty">🩸 阵亡 <b>{{ result.fallen || 0 }}</b></div>
          <div class="casualty">🤕 受伤 <b>{{ result.wounded || 0 }}</b></div>
          <div v-if="result.saved" class="casualty">🏥 救回 <b>{{ result.saved }}</b></div>
        </div>

        <div class="survivors">
          <div class="survivors-title">幸存部队</div>
          <div class="survivor-list">
            <div v-for="u in survivors" :key="u.key" class="survivor">
              <img class="badge" :src="spriteUrl(unitSprite(u.type, u.tier))" :alt="u.name" />
              {{ u.name }} × {{ u.count }}
            </div>
            <div v-if="!survivors.length" class="muted">没有幸存者</div>
          </div>
        </div>

        <button class="btn big" @click="returnToWorld">{{ quick ? '← 回到快速战斗' : '返回世界地图' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import BattleMap from '@/components/BattleMap.vue'
import { useBattleStore } from '@/stores/battle'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { ORDERS, FORMATIONS, DENSITIES, SPEEDS, orderOf, formationOf, densityOf } from '@/game/battle'
import { LAST_STAND_SECONDS } from '@/game/lord'
import { ARENA_TERRAIN_LIST } from '@/game/arena'
import { factionOf } from '@/game/factions'
import { unitSprite, unitName } from '@/game/units'
import { spriteUrl } from '@/game/pixelAssets'
import { persistGame } from '@/composables/gameState'

const router = useRouter()
const battle = useBattleStore()
const world = useWorldStore()
const player = usePlayerStore()

const result = ref(null)
const showSheet = ref(false)
// Battle tools panel: the speed setting and the terrain legend.
const showTools = ref(false)

// Leaving is the one navigation this screen allows: a swipe from the edge of
// the browser, a back button or the hardware back key would drop the lord out
// of a running fight by accident, so those are refused and this hint is shown
// instead. The button on screen sets the flag first.
let allowLeave = false
const leaveHint = ref('')
let leaveHintTimer = 0

// The frame rate of this screen. The arena is drawn on requestAnimationFrame,
// so the gap between two frames is exactly what a stutter looks like: the
// counter keeps the average over the last half second and the worst frame in
// it, which is what makes a short hitch visible.
const fps = ref(0)
const worstFrame = ref(0)
let fpsRaf = 0
let fpsStart = 0
let fpsLast = 0
let fpsFrames = 0
let fpsWorst = 0

function sampleFrame(now) {
  if (!fpsStart) {
    fpsStart = now
    fpsLast = now
    fpsWorst = 0
  }
  const dt = now - fpsLast
  fpsLast = now
  fpsWorst = Math.max(fpsWorst, dt)
  fpsFrames += 1
  const span = now - fpsStart
  if (span >= 500) {
    fps.value = Math.round((fpsFrames * 1000) / span)
    worstFrame.value = Math.round(fpsWorst)
    fpsStart = now
    fpsFrames = 0
    fpsWorst = 0
  }
  fpsRaf = requestAnimationFrame(sampleFrame)
}

// Green while the fight is smooth, gold once it starts to dip, red when a
// frame takes longer than a twentieth of a second.
const fpsTone = computed(() => (fps.value >= 50 ? 'good' : fps.value >= 30 ? 'ok' : 'bad'))
const fpsTitle = computed(
  () => `帧率：最近半秒 ${fps.value} FPS，最慢一帧 ${worstFrame.value} ms`
)

const groups = computed(() => battle.groups)
const order = computed(() => battle.order)
const formation = computed(() => battle.formation)
const density = computed(() => battle.density)
const hungry = computed(() => !!battle.context?.hungry)
// A training session: no enemy, no losses, the field is the practice ground.
const training = computed(() => battle.isTraining)
// A quick battle: a real fight on a field of the lord's choosing, without a
// campaign around it.
const quick = computed(() => battle.context?.kind === 'quick')
// The name of the fight in the top bar.
const title = computed(() => {
  if (training.value) return '🎯 练兵'
  if (quick.value) return '⚡ 快速战斗'
  return '⚔️ 战斗'
})
// The terrain kinds of the field, for the legend.
const TERRAINS = ARENA_TERRAIN_LIST
const speedInfo = computed(() => battle.speedInfo)

const enemyName = computed(() => {
  if (training.value) return '训练木桩'
  return battle.context ? factionOf(battle.context.faction).name : '敌军'
})
const enemyColor = computed(() => {
  if (training.value) return '#d9b26a'
  return battle.context ? factionOf(battle.context.faction).color : '#d8533f'
})

// The field is raw data (see the battle store), so these read the stamp that
// the simulation bumps a few times a second.
const playerAlive = computed(() => {
  void battle.stamp
  return battle.data ? battle.data.units.filter((u) => u.alive && u.side === 'player').length : 0
})
const enemyAlive = computed(() => {
  void battle.stamp
  return battle.data ? battle.data.units.filter((u) => u.alive && u.side === 'enemy').length : 0
})

// The two generals with their hit points and their bodyguards, read through
// the same stamp as the counts above.
const generals = computed(() => {
  void battle.stamp
  return battle.generals
})
const lord = computed(() => generals.value.lord)
const enemyGeneral = computed(() => generals.value.enemy)

/**
 * The tactics attribute scouts the enemy before the fight: the composition of
 * the other side is written down, so the lord knows what is coming.
 */
const intel = computed(() => {
  if (!player.skillEffects.intel || !battle.data) return ''
  const counts = new Map()
  for (const u of battle.data.units) {
    if (u.side !== 'enemy' || u.isDummy) continue
    const name = unitName(u.type, u.tier)
    counts.set(name, (counts.get(name) || 0) + 1)
  }
  if (!counts.size) return ''
  return [...counts.entries()].map(([name, n]) => `${name} ×${n}`).join(' · ')
})

/**
 * The last stand of a lone general: the side has no soldiers left and its
 * general holds the field on his own. The bar drains to zero, and then he
 * yields — or the child presses 撤退 for him.
 */
const lastStand = computed(() => {
  void battle.stamp
  const d = battle.data
  const stand = d ? d.lastStand : null
  if (!stand || d.outcome) return null
  const left = Math.max(0, LAST_STAND_SECONDS - stand.t)
  return {
    side: stand.side,
    left,
    percent: Math.max(0, Math.min(100, (left / LAST_STAND_SECONDS) * 100)),
    mine: stand.side === 'player'
  }
})

/** Take the lone lord off the field instead of letting him fight it out. */
function withdraw() {
  battle.withdraw()
}

/** Name of whatever the commands apply to right now. */
const scopeName = computed(() => (battle.selectedGroup ? battle.selected?.name || '该部队' : '全军'))

const formationLabel = computed(() => formationOf(formation.value).name)
const densityLabel = computed(() => densityOf(density.value).name)

/** Whether every squad of the lord has been ordered to attack. */
const charged = computed(() => {
  void battle.stamp
  const d = battle.data
  return !!d && d.playerGroups.every((k) => d.groups[k] && d.groups[k].order === 'attack')
})

/**
 * The standoff banner: both armies hold at first, then the enemy dresses its
 * ranks and charges. The banner goes away once the enemy is on its way.
 *
 * It reads the stamp directly instead of going through a computed that returns
 * the opening: the opening is part of the raw battle data and never changes
 * identity, so such a computed would tell Vue the value was unchanged and the
 * banner would stay on screen after 「全军出击」.
 */
const standoff = computed(() => {
  void battle.stamp
  // The lord's own charge ends the wait on screen: the enemy still dresses its
  // ranks for a moment, but the banner has done its job and gets out of the way.
  if (charged.value) return ''
  const o = training.value ? null : battle.data?.opening || null
  if (!o || o.phase === 'advance') return ''
  if (o.phase === 'dress') return '🚩 敌军正在变阵，马上就要冲锋！'
  const left = Math.max(0, Math.ceil(o.wait - o.t))
  return `⏳ 双方对峙：敌军 ${left} 秒后进攻，现在就下令出击！`
})

/** Effect text of the selected formation and density, for the folded panel. */
const sheetNote = computed(
  () => `${formationOf(formation.value).note} · ${densityOf(density.value).note}`
)

const hint = computed(() => {
  if (training.value) return '🎯 练兵：这里没有敌人，练习移动、队形与命令，木桩打倒会自动立起来'
  if (standoff.value) return '⏳ 双方还站着不动：先给部队下令，或者等敌军先冲过来'
  if (order.value === 'move') return `${scopeName.value}：点击战场放置移动目标（黄色十字）`
  if (order.value === 'follow') return `${scopeName.value}跟随指挥官，点击战场可移动指挥官`
  if (order.value === 'defend') return `${scopeName.value}原地结阵防守，远程单位原地射击`
  return `${scopeName.value}冲锋，点击战场可移动指挥官`
})

/** Survivors of the fight, merged by family and rank. */
const survivors = computed(() => {
  const list = result.value?.summary?.remaining || []
  const out = []
  for (const u of list) {
    const found = out.find((x) => x.type === u.type && x.tier === u.tier)
    if (found) found.count += 1
    else out.push({ key: u.group, type: u.type, tier: u.tier, name: u.def?.name || u.type, count: 1 })
  }
  return out
})

function onEnd() {
  if (battle.data?.outcome) {
    result.value = battle.result || { outcome: battle.data.outcome, loot: 0, recruits: 0, summary: { remaining: [] } }
  }
}

// The browser's back step is refused while the fight is on: a swipe from the
// edge of a phone would otherwise leave the battle by accident.
onBeforeRouteLeave(() => {
  if (allowLeave) return true
  if (!battle.active || !battle.data || result.value) return true
  leaveHint.value =
    quick.value || training.value
      ? '战斗进行中，退出请用界面上的返回按钮'
      : '战斗进行中，请先结束这场战斗'
  clearTimeout(leaveHintTimer)
  leaveHintTimer = setTimeout(() => {
    leaveHint.value = ''
  }, 2200)
  return false
})

function returnToWorld() {
  allowLeave = true
  // The context is gone after `close()`, so the kind of fight is read first.
  const wasQuick = quick.value
  world.clearEncounter()
  battle.close()
  // A quick battle has no campaign to go back to: it returns to its setup.
  if (wasQuick) {
    router.push('/quick')
    return
  }
  persistGame()
  router.push('/world')
}

onMounted(() => {
  if (!battle.active || !battle.data) {
    allowLeave = true
    world.clearEncounter()
    router.replace('/world')
    return
  }
  fpsRaf = requestAnimationFrame(sampleFrame)
})

onUnmounted(() => {
  cancelAnimationFrame(fpsRaf)
  clearTimeout(leaveHintTimer)
})

watch(
  () => battle.settled,
  (done) => {
    if (done && !result.value) result.value = battle.result
  }
)
</script>

<style scoped>
.battle-view {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #0e140e;
  /* Pulling the field must not reload the page or bounce the view. */
  overscroll-behavior: none;
}

.map {
  position: absolute;
  inset: 0;
}

.hud-top {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  border-radius: 16px;
  background: rgba(8, 12, 8, 0.72);
  border: 1px solid var(--line);
  z-index: 5;
  white-space: nowrap;
}

.hud-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* The two generals: one compact bar each, with the bodyguard count on the
   right. The lord is gold, the hostile general copper. */
.gen-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 11.5px;
  font-weight: 700;
}

.gen {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #f2dc9e;
}

.gen.enemy {
  color: #f0b3a5;
}

.gen.down {
  color: var(--ink-dim);
}

.gen-icon {
  font-size: 12px;
  line-height: 1;
}

.gen-bar {
  display: block;
  width: 58px;
  height: 5px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.6);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.gen-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #e8c56a, #b98c2a);
}

.gen.enemy .gen-bar i {
  background: linear-gradient(90deg, #ef8f74, #b8473a);
}

.gen.hurt .gen-bar i {
  background: #ff6b52;
}

.gen-hp {
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  opacity: 0.9;
}

.gen-guard {
  font-size: 11px;
  opacity: 0.85;
  font-variant-numeric: tabular-nums;
}

.side {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.side.enemy {
  color: #f0b3a5;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.vs {
  color: var(--gold);
  font-weight: 800;
}

.warn {
  position: absolute;
  top: calc(76px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(120, 60, 30, 0.85);
  border: 1px solid rgba(216, 83, 63, 0.7);
  font-size: 13px;
  z-index: 5;
}

/* The scouting line of the tactics attribute. */
.intel {
  position: absolute;
  top: calc(112px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(20, 30, 48, 0.85);
  border: 1px solid rgba(111, 136, 192, 0.7);
  color: #dfe7ff;
  font-size: 12.5px;
  z-index: 5;
}

/* The last stand of a lone general: a panel with its own clock, so the child
   can see the seconds and decide whether to run him down or take him home. */
.last-stand {
  position: absolute;
  top: calc(150px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  width: min(360px, 88vw);
  padding: 8px 12px 9px;
  border-radius: 14px;
  background: rgba(34, 26, 16, 0.9);
  border: 1px solid rgba(201, 154, 74, 0.75);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  z-index: 6;
}

.last-stand.mine {
  background: rgba(38, 22, 18, 0.92);
  border-color: rgba(216, 120, 80, 0.85);
}

.ls-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13.5px;
  font-weight: 800;
  color: var(--gold);
}

.last-stand.mine .ls-head {
  color: #ffb9a1;
}

.ls-time {
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  opacity: 0.9;
}

.ls-bar {
  position: relative;
  height: 5px;
  margin: 6px 0 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  overflow: hidden;
}

.ls-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #c99a4a, #e8c56a);
  transition: width 0.12s linear;
}

.last-stand.mine .ls-bar i {
  background: linear-gradient(90deg, #a8492f, #e08a5f);
}

.ls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ls-text {
  font-size: 11.5px;
  color: rgba(240, 232, 214, 0.86);
  line-height: 1.4;
}

.ls-btn {
  flex: none;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

/* ------------------------------- command bar ------------------------------- */

/* Battle tools: the speed setting and the camera, kept out of the command
   bar so the field stays as tall as possible on a phone. */
.hud-tools {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 6;
}

.tool {
  min-width: 44px;
  min-height: 40px;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(8, 12, 8, 0.78);
  border: 1px solid var(--line);
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
}

.tool.on {
  border-color: var(--gold);
  color: var(--gold);
}

/* The way out of a quick battle: a plain, always visible back button. */
.tool.quit {
  display: flex;
  align-items: center;
  gap: 4px;
  border-color: rgba(232, 197, 106, 0.42);
  color: var(--gold);
}

.tool.quit .quit-icon {
  font-size: 15px;
  line-height: 1;
}

/* The frame-rate readout: a quiet chip that turns gold and then red when the
   arena starts to stutter. Tabular figures keep it from changing width. */
.fps {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 3px;
  min-width: 54px;
  min-height: 40px;
  padding: 6px 9px;
  border-radius: 12px;
  background: rgba(8, 12, 8, 0.78);
  border: 1px solid var(--line);
  color: #94c983;
  font-size: 12.5px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  z-index: 6;
}

.fps b {
  font-size: 14px;
}

.fps.ok {
  color: var(--gold);
  border-color: rgba(232, 197, 106, 0.5);
}

.fps.bad {
  color: #ff9a8a;
  border-color: rgba(216, 83, 63, 0.65);
  background: rgba(60, 18, 14, 0.82);
}

/* The note shown when a back step is refused: it sits over the field for a
   moment, then goes away on its own. */
.leave-hint {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: calc(100% - 40px);
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(38, 28, 10, 0.95);
  border: 1px solid rgba(232, 197, 106, 0.6);
  color: var(--gold);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  z-index: 8;
  pointer-events: none;
  animation: hint-in 0.18s ease-out;
}

@keyframes hint-in {
  from {
    opacity: 0;
    transform: translate(-50%, -46%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.tools-panel {
  position: absolute;
  top: calc(60px + env(safe-area-inset-top));
  right: 12px;
  width: min(300px, calc(100% - 24px));
  padding: 12px;
  z-index: 6;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tools-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--gold);
}

.speed-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.speed-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 48px;
  padding: 6px 2px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid transparent;
}

.speed-btn.on {
  background: rgba(232, 197, 106, 0.22);
  border-color: var(--gold);
  color: var(--gold);
}

.sp-icon {
  font-size: 17px;
  line-height: 1;
}

.sp-name {
  font-size: 12.5px;
  font-weight: 700;
}

.terrain-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.terrain-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 11.5px;
  line-height: 1.4;
}

.terrain-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex: none;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.terrain-name {
  font-weight: 700;
  color: var(--ink);
  flex: none;
}

.terrain-note {
  color: var(--ink-dim);
}

.tools-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--ink-dim);
}

.command {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
  /* The bar itself is clear: every chip and button carries its own panel, so
     the field shows through the gaps instead of sitting under a dark sheet. */
  background: none;
  z-index: 5;
}

/* The opening standoff: a thin strip above the squad chips, so the field
   stays as tall as possible while the order is still being given. */
.standoff {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(20, 30, 48, 0.92);
  border: 1px solid rgba(111, 136, 192, 0.75);
  color: #dfe7ff;
  font-size: 12.5px;
}

.standoff-text {
  flex: 1;
}

.standoff-btn {
  flex: none;
  min-height: 34px;
  padding: 5px 12px;
  border-radius: 9px;
  background: rgba(232, 197, 106, 0.16);
  border: 1px solid var(--gold-deep);
  color: var(--gold);
  font-size: 12.5px;
  font-weight: 800;
}

.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  min-height: 46px;
  padding: 6px 12px;
  border-radius: 12px;
  background: rgba(12, 16, 12, 0.88);
  border: 1px solid var(--line);
}

.chip.on {
  border-color: var(--gold);
  background: rgba(52, 42, 16, 0.95);
  box-shadow: 0 0 12px rgba(232, 197, 106, 0.35);
}

.chip.gone {
  opacity: 0.45;
}

.chip-art {
  width: 26px;
  height: 26px;
  font-size: 20px;
  line-height: 26px;
  text-align: center;
  image-rendering: pixelated;
  flex: none;
}

.chip-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.chip-text b {
  font-size: 13.5px;
}

.chip-text i {
  font-style: normal;
  font-size: 11px;
  color: var(--ink-dim);
}

.chip-tag {
  font-size: 12px;
  opacity: 0.85;
}

.row {
  display: flex;
  gap: 8px;
}

.orders .cmd {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 52px;
  padding: 6px 4px;
  border-radius: 12px;
  background: rgba(10, 14, 10, 0.88);
  border: 1px solid var(--line);
  transition: all 0.15s;
}

.orders .cmd.on {
  background: linear-gradient(180deg, var(--gold), var(--gold-deep));
  color: #2b1e05;
  border-color: #fff6d8;
  box-shadow: 0 0 14px rgba(232, 197, 106, 0.5);
}

.cmd-icon {
  font-size: 20px;
}

.cmd-name {
  font-size: 13px;
  font-weight: 700;
}

.sheet-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  background: rgba(10, 14, 10, 0.88);
  border: 1px solid var(--line);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}

.chev {
  color: var(--gold);
}

.sheet {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(6, 10, 6, 0.94);
  border: 1px solid var(--line);
}

.sheet-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.sheet-row.dens {
  grid-template-columns: repeat(2, 1fr);
}

.grid-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 44px;
  padding: 5px 2px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid transparent;
  transition: all 0.15s;
}

.grid-btn.on {
  background: rgba(232, 197, 106, 0.22);
  border-color: var(--gold);
  color: var(--gold);
}

.gb-icon {
  font-size: 15px;
  line-height: 1;
}

.gb-name {
  font-size: 12px;
  font-weight: 700;
}

.sheet-note {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink-dim);
}

.hint {
  font-size: 12.5px;
  color: var(--ink-dim);
  text-align: center;
  /* It sits straight on the field now, so it needs its own shadow. */
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.75);
}

/* The button that ends a training session: it sits above the command bar so
   the field stays as big as possible. */
.end-train {
  min-height: 42px;
  padding: 8px 16px;
  border-radius: 12px;
  background: rgba(10, 14, 10, 0.88);
  border: 1px solid var(--gold-deep);
  color: var(--gold);
  font-size: 14px;
  font-weight: 700;
}

.end-train:hover {
  background: rgba(232, 197, 106, 0.18);
}

/* --------------------------------- result --------------------------------- */

.result {
  width: min(520px, 100%);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  text-align: center;
}

.result h2 {
  margin: 0;
  font-size: 28px;
  letter-spacing: 3px;
}

.result h2.win {
  color: var(--gold);
}

.result h2.lose {
  color: #ef9a89;
}

.loot {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.loot-item {
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
}

.loot-item b {
  color: var(--gold);
}

/* Casualty line: dead, wounded and rescued soldiers. */
.casualties {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 10px 0;
}

.casualty {
  font-size: 13.5px;
  color: var(--ink-dim);
}

.casualty b {
  color: var(--gold);
  margin-left: 4px;
}

.lose-tip {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

/* What a lord who went down cost the campaign. */
.lord-down {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(70, 34, 20, 0.72);
  border: 1px solid rgba(216, 128, 90, 0.55);
  font-size: 13.5px;
  line-height: 1.55;
  text-align: left;
}

.lord-down .ld-title {
  color: #ffc9a8;
  font-weight: 800;
}

.lord-down b {
  color: var(--gold);
}

.survivors {
  width: 100%;
  text-align: left;
}

.survivors-title {
  font-size: 13px;
  color: var(--ink-dim);
  margin-bottom: 8px;
}

.survivor-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.survivor {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  font-size: 13.5px;
}

/* Native-size sprite, so the survivor list never resamples the art. */
.badge {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  flex: none;
}

.btn.big {
  padding: 14px 34px;
  font-size: 17px;
}

/* Phones: shrink the top bar and keep every command reachable by a thumb. */
@media (max-width: 560px) {
  .hud-top {
    gap: 8px;
    padding: 6px 12px;
    font-size: 13px;
    /* The battle tools sit in the top-right corner, so the strength bar keeps
       to the left of them on a narrow screen. A quick battle adds its own
       back button there, which makes that corner a little wider. */
    left: 12px;
    right: auto;
    transform: none;
    max-width: calc(100% - 200px);
    overflow: hidden;
  }

  /* The title is decoration: on a phone its room is worth more to the two
     side counts, which must never be cut off. */
  .hud-top .vs {
    display: none;
  }

  /* The speed name lives in the tools panel; the top-right corner keeps only
     the gear, so the strength bar gets the rest of the row. */
  .tool-speed {
    display: none;
  }

  /* On a phone the general row keeps only what a thumb's width allows: two
     icons, two short bars and two bodyguard counts. The numbers are in the
     tooltip, and the bars already say how much is left. */
  .gen-row {
    gap: 8px;
    font-size: 10.5px;
  }

  .gen-bar {
    width: 32px;
  }

  .gen-hp {
    display: none;
  }

  .hud-tools {
    top: calc(10px + env(safe-area-inset-top));
    right: 10px;
    gap: 6px;
  }

  .tool {
    min-width: 40px;
    min-height: 38px;
    padding: 5px 8px;
    font-size: 12px;
  }

  /* The bottom bar gives the field as much height as it can: smaller chips,
     shorter commands and no hint line (the standoff banner and the sheet note
     carry the same words when they matter). */
  .command {
    gap: 6px;
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  }

  .command .hint {
    display: none;
  }

  .orders .cmd {
    min-height: 46px;
    padding: 4px;
  }

  .cmd-icon {
    font-size: 18px;
  }

  .chip {
    min-height: 42px;
    padding: 5px 10px;
  }

  .chip-art {
    width: 22px;
    height: 22px;
    line-height: 22px;
    font-size: 18px;
  }

  .sheet-toggle {
    min-height: 38px;
    font-size: 13px;
  }

  .fps {
    min-width: 38px;
    min-height: 38px;
    padding: 5px 6px;
    font-size: 11px;
  }

  .fps b {
    font-size: 13px;
  }

  /* On a phone the back button is the arrow alone and the frame rate drops the
     word FPS: the corners stay clear and the strength bar keeps its room. */
  .tool.quit .quit-text,
  .fps-label {
    display: none;
  }

  .tools-panel {
    top: calc(54px + env(safe-area-inset-top));
    right: 10px;
    width: min(280px, calc(100% - 20px));
    padding: 10px;
  }

  .warn {
    font-size: 12px;
    padding: 5px 10px;
    max-width: 92vw;
    text-align: center;
    white-space: normal;
  }

  .command {
    gap: 6px;
  }

  .standoff {
    font-size: 12px;
    gap: 8px;
    padding: 5px 8px;
  }

  .chip {
    min-height: 44px;
    padding: 5px 10px;
  }

  .chip-art {
    width: 24px;
    height: 24px;
  }

  .chip-text b {
    font-size: 12.5px;
  }

  .orders .cmd {
    min-height: 50px;
  }

  .cmd-icon {
    font-size: 18px;
  }

  .cmd-name {
    font-size: 12.5px;
  }

  .sheet-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .sheet-row.dens {
    grid-template-columns: repeat(2, 1fr);
  }

  .hint {
    font-size: 12px;
  }

  .result {
    padding: 18px 14px;
  }

  .result h2 {
    font-size: 23px;
  }
}
</style>
