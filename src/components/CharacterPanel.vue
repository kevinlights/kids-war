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
