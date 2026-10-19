<template>
  <div class="guide scroll">
    <section class="hero">
      <div class="hero-badge">⚔️</div>
      <h1>少年战记</h1>
      <p class="muted">2D 俯视 · 招兵买马 · 答题生财 · 排兵布阵</p>
    </section>

    <section class="card">
      <h2>🎯 游戏目标</h2>
      <p>
        你是一位少年领主。在世界地图上移动，进入村庄与城镇招募兵马、购买物资，
        参加城镇考试赚取金币，然后击败盘踞在地图上的强盗与敌对势力，壮大自己的队伍。
      </p>
    </section>

    <section class="grid">
      <div class="card small">
        <h3>🗺️ 世界地图</h3>
        <p>点击地图任意位置即可移动，地形有平原、森林、沙漠、山地与水域，山地和水域无法通行。</p>
        <p>时间是走出来的：只有主角移动或扎营时时间才流逝，站着不动整个世界都会冻结。</p>
        <p>右上角的小地图能看到整张世界；点它打开详细地图，按住拖动查看不同区域，图标右上角的数字是那支部队的兵力。</p>
      </div>
      <div class="card small">
        <h3>🏰 城镇与村庄</h3>
        <p>村庄只招民兵；城镇随机提供长枪兵、弓箭手、骑兵，从初级到精英都有可能。</p>
        <p>每个据点都有归属：强盗的村庄进不去，要打下来；王国的城镇要先准备围城两天再攻打。</p>
      </div>
      <div class="card small">
        <h3>🏛️ 发展自己的城镇</h3>
        <p>打下来的城镇要靠考试赚钱：收入变成城镇资金，答对的题目提升发展。</p>
        <p>发展带来繁荣度，繁荣度够了城镇就升级；升级后兵源更好、恢复更快，还能建医院和军营。</p>
      </div>
      <div class="card small">
        <h3>🤕 受伤与恢复</h3>
        <p>士兵战败不一定死，可能只是受伤；伤兵会带着伤势进入下一场战斗。</p>
        <p>行军恢复很慢，在城镇里快得多，自己的城镇更快，医院还能再加成。</p>
      </div>
      <div class="card small">
        <h3>💰 考试赚钱</h3>
        <p>在城镇参加考试，答对题目才能拿到资金，用来招募士兵和购买物资。</p>
      </div>
      <div class="card small">
        <h3>⚔️ 战斗</h3>
        <p>
          点击地图上的敌人即可开战。战斗中先点兵种按钮选择部队，再下达 攻击 / 防守 / 跟随 / 移动
          命令，还可以单独设置队形与密度。
        </p>
      </div>
    </section>

    <section class="card">
      <h2>🧩 兵种克制</h2>
      <p>三个主力兵种形成循环克制：<b>克制方伤害 +40%，被克制方伤害 −25%</b>。</p>
      <div class="rps">
        <template v-for="(n, i) in rpsCycle" :key="n.type">
          <div class="rps-node">
            <img class="rps-art" :src="spriteUrl(unitSprite(n.type, 1))" :alt="n.name" />
            <div class="rps-name">{{ n.name }}</div>
            <div class="rps-beat">克 {{ n.beats }}</div>
          </div>
          <div class="rps-arrow">→</div>
        </template>
        <div class="rps-node back">
          <div class="rps-name">循环</div>
          <div class="rps-beat">回到长枪兵</div>
        </div>
      </div>
      <p class="muted">民兵不属于克制循环，只适合前期过渡。</p>
    </section>

    <section class="card">
      <h2>🌱 兵种升级图</h2>
      <p>
        民兵可以升级为长枪兵、弓箭手或骑兵；每个兵种都能一路升级：
        <b>初级 → 中级 → 高级 → 精英</b>。每升一档，攻击、防御、血量都会提高。
      </p>
      <div class="tree">
        <div class="tier-card root">
          <img class="tc-art" :src="spriteUrl('militia')" alt="民兵" />
          <div class="tc-name">民兵</div>
          <div class="tc-stats">攻 {{ militia.atk }} · 防 {{ militia.def }} · 血 {{ militia.hp }}</div>
          <div class="tc-cost">招募 🪙 {{ militia.recruitCost }}</div>
          <div class="tc-note">村庄招募 · 无克制</div>
        </div>

        <div v-for="b in ladders" :key="b.branch" class="branch">
          <div class="branch-head">
            <span class="branch-arrow">升级 🪙 {{ b.entryCost }} ↗</span>
            <b>{{ b.def.name }}</b>
            <span class="muted">{{ b.def.note }}</span>
          </div>
          <div class="ladder">
            <template v-for="(r, i) in b.rows" :key="r.tier">
              <div class="tier-card" :class="'r' + r.tier">
                <img class="tc-art" :src="spriteUrl(r.sprite)" :alt="r.name" />
                <div class="tc-name">{{ r.name }}</div>
                <div class="tc-stats">
                  攻 {{ r.atk }} · 防 {{ r.def }} · 血 {{ r.hp }}
                  <template v-if="r.range"><br />射程 {{ r.range }}</template>
                </div>
                <div class="tc-cost">招募 🪙 {{ r.recruitCost }}</div>
                <div class="tc-note">军饷 {{ r.wage }} / 天</div>
              </div>
              <div v-if="i < 3" class="up-arrow">
                <div class="ua-line">→</div>
                <div class="ua-cost">升级<br />🪙 {{ rankUpCost(b.branch, r.tier) }}</div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <p class="muted">
        逐级升级总花费低于直接招募精英，所以「先招民兵、再慢慢升级」是最省钱的路子；
        城镇只能随机买到部分兵种，升级不受城镇库存限制。
      </p>
    </section>

    <section class="card">
      <h2>⚔️ 战术命令</h2>
      <p>先在上方兵种按钮里选择部队（或选「全军」），再点命令。选中的部队在战场上会有一圈金色光环。</p>
      <div class="table">
        <div v-for="o in ORDERS" :key="o.key" class="table-row">
          <span class="table-icon">{{ o.icon }}</span>
          <span class="table-name">{{ o.name }}</span>
          <span class="table-desc">{{ o.hint }}</span>
        </div>
      </div>
      <p class="muted">选择「移动」后，点击战场放置黄色十字目标，部队会整队走过去并在那里待命。</p>
    </section>

    <section class="card">
      <h2>▦ 队形与密度</h2>
      <p>队形决定部队怎么排，密度决定人与人之间的间隔。两者都会影响战斗数值。</p>
      <div class="table">
        <div v-for="f in FORMATIONS" :key="f.key" class="table-row">
          <span class="table-icon">{{ f.icon }}</span>
          <span class="table-name">{{ f.name }}</span>
          <span class="table-desc">{{ f.note }}</span>
        </div>
        <div v-for="d in DENSITIES" :key="d.key" class="table-row dens">
          <span class="table-icon">{{ d.icon }}</span>
          <span class="table-name">{{ d.name }}</span>
          <span class="table-desc">{{ d.note }}</span>
        </div>
      </div>
      <p class="muted">例：长枪兵「防守 + 三行 + 紧凑」顶住骑兵冲锋，弓箭手「松散」减少被箭雨压制的损失。</p>
    </section>

    <section class="card">
      <h2>🎓 题目分类</h2>
      <p>考试题目分为 <b>三年级</b> 和 <b>四年级</b> 两个等级，每个等级包含多个科目：</p>
      <div class="tags">
        <span v-for="s in subjects" :key="s.key" class="tag">{{ s.icon }} {{ s.name }}</span>
      </div>
      <p class="muted">答对越多，奖励越丰厚；四年级题目的奖励更高，逻辑推理与百科知识还有额外奖励。</p>
    </section>

    <section class="card">
      <h2>🧠 记忆曲线</h2>
      <p>题库会记住你在每一道题上的表现，并按记忆曲线安排出现频率：</p>
      <div class="table">
        <div class="table-row">
          <span class="table-icon">✅</span>
          <span class="table-name">答对</span>
          <span class="table-desc">掌握等级 +1，这道题出现的几率随之降低。</span>
        </div>
        <div class="table-row dens">
          <span class="table-icon">❌</span>
          <span class="table-name">答错</span>
          <span class="table-desc">掌握等级 −2，这道题很快会再考你一次。</span>
        </div>
        <div class="table-row">
          <span class="table-icon">⏳</span>
          <span class="table-name">遗忘</span>
          <span class="table-desc">很久没有复习的题目，会按遗忘曲线重新变得生疏。</span>
        </div>
      </div>
      <p class="muted">掌握等级从 0 到 5，等级越高出现越少，已经完全掌握的题目出现频率约为新题的 1/20。</p>
    </section>

    <section class="card">
      <h2>🔌 题库扩展</h2>
      <p>
        题库支持 mod 扩展：在 <code>public/mods/</code> 目录里放一份 JSON 题目文件，就能增加新的科目和题目，
        不需要改动游戏代码。
      </p>
      <p class="muted">
        一份 mod 需要写出科目标识 key、名称 name、图标 icon、适用年级 grades，
        以及题目数组 questions，每道题包含 id、grade、prompt、options、answer、explain；
        再把文件名写进 <code>public/mods/index.json</code> 即可。
      </p>
    </section>

    <section class="card">
      <h2>🕹️ 操作说明</h2>
      <ul>
        <li><b>移动</b>：点击世界地图上的位置，角色会自动寻路前往，游戏时间随之流逝。</li>
        <li><b>扎营</b>：点「⛺ 扎营」原地休息，时间与敌军照常运转；点「🔥 拔营」或点地图移动即结束。</li>
        <li><b>看全图</b>：点右上角小地图打开详细地图，按住拖动查看不同区域，点「🎯 回到主角」把视野拉回主角。</li>
        <li><b>进入据点</b>：靠近村庄或城镇后点击「进入」按钮。</li>
        <li><b>招募</b>：在据点「招募」页花金币买兵，兵种等级越高越贵。</li>
        <li><b>升级</b>：在据点「升级」页把民兵变成正式兵种，或把部队升到更高档位。</li>
        <li><b>战斗</b>：靠近敌对队伍会自动进入战斗，也可以点击敌人主动靠近。</li>
        <li><b>指挥</b>：战斗中先点兵种按钮，再选 攻击 / 防守 / 跟随 / 移动，并设置队形与密度。</li>
        <li><b>保存</b>：进度会自动保存在浏览器本地，下次选择同一名字即可继续。</li>
      </ul>
    </section>

    <section class="card tip">
      <h2>💡 小提示</h2>
      <p>先到村庄招募民兵，再去城镇参加考试赚钱，升级部队后再去挑战强盗，稳扎稳打才是王道！</p>
    </section>
  </div>
</template>

<script setup>
/**
 * Static onboarding content reused by the home intro and the guide page.
 * The unit upgrade diagram is generated from `game/units.js` and the battle
 * tables from `game/battle.js`, so the guide can never drift from the rules.
 */
import { computed, onMounted, ref } from 'vue'
import { BRANCHES, UNIT_TYPES, unitDef, unitOf, unitSprite, upgradeCost } from '@/game/units'
import { ORDERS, FORMATIONS, DENSITIES } from '@/game/battle'
import { spriteUrl } from '@/game/pixelAssets'
import { ensureModsLoaded, listTypes } from '@/game/quiz'

const militia = UNIT_TYPES.militia

// Exam subjects are read from the mod registry so a new mod appears here too.
const subjects = ref(listTypes())
onMounted(async () => {
  await ensureModsLoaded()
  subjects.value = listTypes()
})

/** Counter cycle, laid out in the order the arrows run on screen. */
const rpsCycle = computed(() =>
  BRANCHES.map((branch) => ({
    type: branch,
    name: unitOf(branch).name,
    beats: unitOf(unitOf(branch).counter).name
  }))
)

/** One ladder of four rank cards per family, with every upgrade cost filled in. */
const ladders = computed(() =>
  BRANCHES.map((branch) => ({
    branch,
    def: unitOf(branch),
    entryCost: upgradeCost('militia', 1, branch, 1),
    rows: [1, 2, 3, 4].map((tier) => ({ ...unitDef(branch, tier), sprite: unitSprite(branch, tier) }))
  }))
)

const rankUpCost = (branch, tier) => upgradeCost(branch, tier, branch, tier + 1)
</script>

<style scoped>
.guide {
  max-width: 820px;
  margin: 0 auto;
  padding: 20px 18px 60px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hero {
  text-align: center;
  padding: 18px 0 6px;
}

.hero-badge {
  font-size: 44px;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5));
}

.hero h1 {
  margin: 8px 0 4px;
  font-size: 34px;
  letter-spacing: 6px;
  color: var(--gold);
  text-shadow: 0 3px 0 #6d5119;
}

.card {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow);
}

.card h2 {
  margin: 0 0 8px;
  font-size: 18px;
  color: var(--gold);
}

.card h3 {
  margin: 0 0 6px;
  font-size: 16px;
  color: var(--gold);
}

.card p,
.card li {
  margin: 4px 0;
  line-height: 1.7;
  font-size: 14.5px;
}

.card ul {
  padding-left: 20px;
  margin: 6px 0 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}

.tag {
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(232, 197, 106, 0.14);
  border: 1px solid var(--line);
  font-weight: 700;
  font-size: 14px;
}

.tip {
  border-color: rgba(74, 163, 255, 0.5);
  background: rgba(30, 52, 74, 0.9);
}

/* ----------------------------- counter cycle ----------------------------- */

.rps {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 10px 0;
}

.rps-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 86px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
}

.rps-node.back {
  justify-content: center;
  color: var(--ink-dim);
}

.rps-art {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.rps-name {
  font-weight: 800;
  font-size: 14px;
}

.rps-beat {
  font-size: 11.5px;
  color: var(--gold);
}

.rps-arrow {
  color: var(--gold);
  font-weight: 800;
  font-size: 18px;
}

/* ------------------------------ upgrade tree ------------------------------ */

.tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0;
}

.tier-card {
  width: 104px;
  flex: none;
  padding: 8px 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  text-align: center;
}

.tier-card.root {
  width: 118px;
  border-color: var(--gold-deep);
  background: rgba(232, 197, 106, 0.1);
}

.tier-card.r1 {
  border-color: rgba(176, 141, 87, 0.75);
}

.tier-card.r2 {
  border-color: rgba(143, 162, 179, 0.8);
}

.tier-card.r3 {
  border-color: rgba(111, 136, 192, 0.85);
}

.tier-card.r4 {
  border-color: var(--gold);
  background: rgba(232, 197, 106, 0.12);
}

.tc-art {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.tc-name {
  font-weight: 800;
  font-size: 13px;
  margin-top: 2px;
}

.tc-stats {
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink);
}

.tc-cost {
  margin-top: 3px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--gold);
}

.tc-note {
  font-size: 11px;
  color: var(--ink-dim);
}

.branch {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.24);
  border: 1px dashed var(--line);
}

.branch-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13.5px;
}

.branch-head .muted {
  font-size: 12px;
}

.branch-arrow {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  color: #2b1e05;
  background: rgba(232, 197, 106, 0.85);
}

.ladder {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.up-arrow {
  flex: none;
  width: 46px;
  text-align: center;
  color: var(--gold);
}

.ua-line {
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.ua-cost {
  font-size: 10.5px;
  line-height: 1.4;
}

/* --------------------------------- tables --------------------------------- */

.table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 8px 0;
}

.table-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  font-size: 13.5px;
}

.table-row.dens {
  background: rgba(232, 197, 106, 0.09);
}

.table-icon {
  width: 22px;
  text-align: center;
  font-size: 15px;
  flex: none;
}

.table-name {
  width: 62px;
  font-weight: 800;
  flex: none;
}

.table-desc {
  color: var(--ink);
  line-height: 1.5;
}

/* Phones: stack the table rows and let the ladders scroll sideways. */
@media (max-width: 560px) {
  .guide {
    padding: 14px 12px 50px;
  }

  .hero h1 {
    font-size: 28px;
    letter-spacing: 4px;
  }

  .card {
    padding: 14px 12px;
  }

  .rps-node {
    min-width: 74px;
    padding: 6px 8px;
  }

  .table-row {
    flex-wrap: wrap;
    gap: 6px;
  }

  .table-name {
    width: auto;
  }

  .table-desc {
    width: 100%;
    font-size: 12.5px;
  }
}
</style>
