<script setup>
/**
 * Lord panel: a read-only snapshot of the current character, opened from the
 * world map so the player can check troops, treasury and supplies at a glance.
 */
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useWorldStore } from '@/stores/world'
import { unitOf, unitSprite } from '@/game/units'
import { terrainFromId } from '@/game/terrain'
import { spriteUrl } from '@/game/pixelAssets'
import { ATTRIBUTES, EXP_PER_POINT, pointsFor } from '@/game/skills'
import { typeDef } from '@/game/quiz'
import { persistGame } from '@/composables/gameState'

defineEmits(['close'])

const player = usePlayerStore()
const world = useWorldStore()

// Roster comes from the player store already scaled and sorted by family and rank.
const roster = computed(() => player.roster)

/** Family a soldier is strong against, shown next to its stats. */
function counterName(type) {
  const counter = unitOf(type).counter
  return counter ? unitOf(counter).name : '无'
}

const winRate = computed(() =>
  player.stats.battles ? Math.round((player.stats.wins / player.stats.battles) * 100) : 0
)

// Terrain tile the lord is standing on right now.
const standingOn = computed(() =>
  terrainFromId(world.tile(Math.round(world.playerPos.x), Math.round(world.playerPos.y)))
)

/** The experience bar: how far the next attribute point is. */
const expProgress = computed(() => {
  const into = player.experience % EXP_PER_POINT
  return {
    into,
    need: EXP_PER_POINT,
    percent: Math.round((into / EXP_PER_POINT) * 100),
    total: pointsFor(player.experience)
  }
})

/** One row per subject with its mastery bar. */
const masteryRows = computed(() =>
  Object.values(player.mastery || {})
    .map((row) => {
      const def = typeDef(row.type)
      return {
        type: row.type,
        name: def?.name || row.type,
        icon: def?.icon || '❓',
        percent: row.percent,
        tracked: row.tracked,
        mastered: row.mastered
      }
    })
    .sort((a, b) => a.percent - b.percent)
)

/** Spend one point of an attribute. */
function raise(key) {
  if (player.allocateSkill(key)) persistGame()
}
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="lord panel pop">
      <header class="head">
        <div class="who">
          <span class="crest">👑</span>
          <div>
            <div class="name">{{ player.username || '领主' }}</div>
            <div class="muted small">
              第 {{ world.day }} 天 {{ world.clock.text }} · 位于{{ standingOn.name }}
            </div>
            <div class="muted small">
              {{ world.camping ? '⛺ 扎营中 · 时间流逝' : world.timeFlowing ? '⏳ 行军中 · 时间流逝' : '⏸ 时间停滞' }}
            </div>
          </div>
        </div>
        <button class="close" @click="$emit('close')">✕</button>
      </header>

      <section class="section">
        <div class="sec-title">
          ❤️ 主将状态
          <span class="muted small">{{ player.lordHp }} / {{ player.lordMaxHp }}</span>
        </div>
        <div class="lord-hp">
          <div class="lord-hp-fill" :style="{ width: player.lordHealth + '%' }"></div>
        </div>
        <p class="note muted">
          主将会亲自上阵。他被打到 0 点，这场战斗立刻失败：损失一半士兵，亲兵把你抬回战场附近的一处空地，
          生命恢复到一半，之后随时间慢慢恢复 —— 在自己的城镇里恢复得更快。敌人还在附近，可以追上来，你也可以跑。
        </p>
      </section>

      <section class="section">
        <div class="sec-title">💰 资金与物资</div>
        <div class="stat-grid cols-3">
          <div class="stat">
            <div class="stat-v gold">🪙 {{ player.gold }}</div>
            <div class="stat-k">金币</div>
          </div>
          <div class="stat">
            <div class="stat-v">🌾 {{ player.supplies.food }}</div>
            <div class="stat-k">军粮</div>
          </div>
          <div class="stat">
            <div class="stat-v">🐎 {{ player.supplies.horse }}</div>
            <div class="stat-k">战马</div>
          </div>
        </div>
        <p class="note muted">
          军粮每场战斗消耗 3 份，不足会削弱攻击；每匹战马提升全军 1% 攻击（上限 10%）。
        </p>
      </section>

      <section class="section">
        <div class="sec-title">
          🛡️ 部队
          <span class="muted small">共 {{ player.totalTroops }} 名</span>
        </div>

        <div v-if="player.wounded" class="wound-note">
          🤕 {{ player.wounded }} 名士兵受伤（平均体力 {{ player.health }}%），在城镇里休整恢复更快。
        </div>

        <div v-if="!roster.length" class="empty">队伍里还没有士兵，去村庄或城镇招募吧。</div>

        <div v-else class="roster">
          <div v-for="u in roster" :key="u.key" class="unit-row">
            <img class="badge" :src="spriteUrl(unitSprite(u.type, u.tier))" :alt="u.name" />
            <div class="unit-info">
              <div class="unit-name">
                {{ u.name }}
                <span class="tier" :class="'t' + u.tier">{{ u.rank || '基础' }}</span>
                <span v-if="u.wounded" class="wounded-chip">🤕 {{ u.wounded }}</span>
              </div>
              <div class="muted small">
                攻 {{ u.atk }} · 防 {{ u.def }} · 血 {{ u.hp }}{{ u.ranged ? ' · 射程 ' + u.range : '' }} · 克制
                {{ counterName(u.type) }}
              </div>
            </div>
            <div class="unit-count">
              <div class="qty">× {{ u.count }}</div>
              <div class="muted small">军饷 {{ u.wageTotal }}/天</div>
            </div>
          </div>
        </div>

        <div class="sum-row">
          <span class="muted">每日军饷支出</span>
          <b class="gold">🪙 {{ player.dailyWage }}</b>
        </div>
      </section>

      <section class="section">
        <div class="sec-title">🏆 战绩</div>
        <div class="stat-grid">
          <div class="stat">
            <div class="stat-v">{{ player.stats.wins }} / {{ player.stats.battles }}</div>
            <div class="stat-k">战斗胜 / 总</div>
          </div>
          <div class="stat">
            <div class="stat-v">{{ winRate }}%</div>
            <div class="stat-k">胜率</div>
          </div>
          <div class="stat">
            <div class="stat-v">{{ player.stats.exams }}</div>
            <div class="stat-k">参加考试</div>
          </div>
          <div class="stat">
            <div class="stat-v">{{ player.stats.correct }}</div>
            <div class="stat-k">累计答对</div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="sec-title">
          📚 学习与成长
          <span class="muted small">经验 {{ player.experience }}</span>
        </div>

        <div class="exp-row">
          <div class="exp-bar"><div class="exp-fill" :style="{ width: expProgress.percent + '%' }"></div></div>
          <span class="muted small">
            距下一个属性点 {{ expProgress.need - expProgress.into }} 经验 · 已得 {{ expProgress.total }} 点
          </span>
        </div>

        <div class="attrs">
          <div v-for="a in ATTRIBUTES" :key="a.key" class="attr-row">
            <span class="attr-name">{{ a.icon }} {{ a.name }}</span>
            <span class="attr-value">Lv.{{ player.attributes[a.key] || 0 }}</span>
            <span class="muted small attr-note">{{ a.per }}</span>
            <button
              class="btn small attr-plus"
              :disabled="player.availableSkillPoints <= 0"
              @click="raise(a.key)"
            >
              ＋
            </button>
          </div>
        </div>
        <p v-if="player.availableSkillPoints > 0" class="note muted">
          有 {{ player.availableSkillPoints }} 个属性点可以分配：点 ＋ 加到对应属性上。
        </p>

        <div v-if="masteryRows.length" class="mastery">
          <div v-for="row in masteryRows" :key="row.type" class="mastery-row">
            <span class="m-name">{{ row.icon }} {{ row.name }}</span>
            <div class="m-bar"><div class="m-fill" :style="{ width: row.percent + '%' }"></div></div>
            <span class="muted small">{{ row.mastered }}/{{ row.tracked }} 掌握</span>
          </div>
        </div>

        <div v-if="player.nextMilestone" class="milestone">
          <div class="m-row">
            <span>{{ player.nextMilestone.icon }} {{ player.nextMilestone.name }}</span>
            <span class="muted small">
              {{ player.nextMilestone.count }} / {{ player.nextMilestone.at }} 题 · {{ player.nextMilestone.effect }}
            </span>
          </div>
          <div class="exp-bar"><div class="exp-fill" :style="{ width: player.nextMilestone.percent + '%' }"></div></div>
        </div>
        <div v-if="player.milestones.length" class="drops">
          <span v-for="m in player.milestones" :key="m.key" class="drop">{{ m.icon }} {{ m.name }}</span>
        </div>
      </section>

      <button class="btn close-btn" @click="$emit('close')">知道了</button>
    </div>
  </div>
</template>

<style scoped>
.lord {
  width: min(430px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  padding: 16px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.who {
  display: flex;
  align-items: center;
  gap: 10px;
}

.crest {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  background: rgba(232, 197, 106, 0.16);
  border: 1px solid var(--line);
}

.name {
  font-size: 18px;
  font-weight: 800;
  color: var(--gold);
}

.small {
  font-size: 12px;
}

.close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--line);
  font-size: 15px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sec-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.stat {
  padding: 10px 8px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  text-align: center;
}

.stat-v {
  font-size: 17px;
  font-weight: 800;
}

.stat-k {
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--ink-dim);
}

.gold {
  color: var(--gold);
}

.note {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
}

.empty {
  padding: 16px;
  text-align: center;
  color: var(--ink-dim);
  font-size: 13.5px;
  border-radius: 11px;
  background: rgba(0, 0, 0, 0.28);
}

.roster {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unit-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
}

/* Native-size sprite, so the art is never resampled. */
.badge {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  flex: none;
}

.unit-info {
  flex: 1;
  min-width: 0;
}

.unit-name {
  font-size: 14.5px;
  font-weight: 700;
}

/* Rank badge: bronze for 初级 up to gold for 精英. */
.tier {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  color: #f2e7c9;
  background: rgba(255, 255, 255, 0.12);
}

/* Wounded soldiers in this group. */
.wounded-chip {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  color: #ffd9d0;
  background: rgba(200, 80, 60, 0.35);
}

/* The note above the roster. */
.wound-note {
  font-size: 12.5px;
  color: #ffd9d0;
  background: rgba(200, 80, 60, 0.18);
  border: 1px solid rgba(200, 80, 60, 0.35);
  border-radius: 10px;
  padding: 8px 10px;
  margin-bottom: 8px;
}

.tier.t1 {
  color: #2b1e05;
  background: #c9a878;
}

.tier.t2 {
  color: #1d242c;
  background: #b6c4d2;
}

.tier.t3 {
  color: #f4f6ff;
  background: #4d68a8;
}

.tier.t4 {
  color: #2b1e05;
  background: var(--gold);
}

.unit-count {
  text-align: right;
  flex: none;
}

.qty {
  font-size: 15px;
  font-weight: 800;
}

.sum-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 11px;
  border-radius: 11px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px dashed var(--line);
  font-size: 13.5px;
}

.close-btn {
  width: 100%;
}

/* The learning section: experience, attributes, mastery and milestones. */
.exp-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.exp-bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-deep), var(--gold));
}

.attrs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attr-row {
  display: grid;
  grid-template-columns: 78px 44px 1fr 34px;
  align-items: center;
  gap: 6px;
  padding: 7px 9px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
}

.attr-name {
  font-size: 13.5px;
  font-weight: 700;
}

.attr-value {
  font-size: 13px;
  color: var(--gold);
  font-weight: 800;
}

.attr-note {
  font-size: 11.5px;
}

.attr-plus {
  padding: 4px 0;
  font-size: 15px;
  line-height: 1;
}

.mastery {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mastery-row {
  display: grid;
  grid-template-columns: 78px 1fr auto;
  align-items: center;
  gap: 8px;
}

.m-name {
  font-size: 12.5px;
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

.milestone {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 10px;
  border-radius: 11px;
  background: rgba(232, 197, 106, 0.12);
  border: 1px solid var(--gold-deep);
  font-size: 13px;
  font-weight: 700;
}

.m-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
}

.drops {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.drop {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(232, 197, 106, 0.16);
  border: 1px solid var(--gold-deep);
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
}

/* The lord's own health bar: a wide, quiet bar under a section title. */
.lord-hp {
  height: 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--line);
  overflow: hidden;
  margin: 8px 0;
}

.lord-hp-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #e8c56a, #b98c2a);
  transition: width 0.3s;
}

/* Phones: keep the three-up treasury row readable and stack the roster meta. */
@media (max-width: 560px) {
  .stat-grid.cols-3 .stat-v {
    font-size: 15px;
  }

  .stat-k {
    font-size: 11px;
  }

  .unit-row {
    gap: 8px;
  }

  .unit-count .small {
    font-size: 11px;
  }
}
</style>
