/**
 * Rewrite the 「已完成功能 · Completed Features」 section of `progress.md`
 * so that every bullet is either a game feature or a technical note.
 *
 * The convention:
 *   - `- ▶ ` a change the player can see or feel — the update dialog shows it.
 *   - `- 🔧 ` an internal change — it stays in the progress file, the dialog
 *     does not show it.
 *
 * Usage: node tools/rewrite-progress-features.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const file = path.join(root, 'progress.md')

const text = readFileSync(file, 'utf8')
const lines = text.split('\n')
const start = lines.findIndex((l) => /^## 2\.\s*已完成功能/.test(l))
const end = lines.findIndex((l, i) => i > start && /^## 3\./.test(l))
if (start < 0 || end < 0) {
  console.error('progress.md has no 「## 2. 已完成功能」 section')
  process.exit(1)
}

/**
 * The section, written out batch by batch: the player-facing features first,
 * the technical note last.
 */
const section = `## 2. 已完成功能 · Completed Features

每个批次的两类条目：**▶** 是玩家在游戏里能看见、能玩到的变化；**🔧** 是开发层面的改动，只留在这份进度文件里，游戏内的「更新内容」对话框只显示前者。
Every batch has two kinds of entries: **▶** marks what a player can see or play, and **🔧** marks the work behind it. Only the ▶ entries reach the update dialog of the game.

### 批次 1 · Batch 1 — 核心玩法 Core gameplay (2026-10-18)

- ▶ 世界生成：地形起伏、城镇与村庄散布、敌军成团聚集，出生点在第一座城镇旁。
  World generation: rolling terrain, towns and villages, enemy warbands clustered around their strongholds, and a spawn next to the first town.
- ▶ 点击地图移动：角色自己找路过去，会绕开水域与山地；地形决定脚程快慢。
  Tap the map to move: the lord finds his own way and skirts water and mountains; the ground decides how fast he walks.
- ▶ 据点玩法：村庄招民兵，城镇有更好的兵源，还能升级兵种、买卖军粮与战马。
  Settlements: villages sell militia, towns offer better soldiers, and both upgrade troops and sell food and horses.
- ▶ 考试赚钱：三、四年级的英文、语文、数学与逻辑，答对才有金币。
  Earn gold with exams: grade 3-4 English, Chinese, math and logic — only a correct answer pays.
- ▶ 战斗：真实时间的战场，每支小队都能单独下令、换队形与密度。
  Battles run in real time, and every squad takes its own order, formation and density.
- ▶ 存档：按领主名字保存，随时可以继续上次的征程。
  Saves are kept per lord name, so a campaign can be resumed at any time.
- 🔧 技术：Vue 3 + Pinia + hash 路由骨架、值噪声地形与最大连通陆地筛选、A* 寻路与尽力靠近回退、世界与战场 canvas 绘制、按名字隔离的存档槽。
  Tech: the Vue 3 + Pinia + hash-router scaffold, value-noise terrain with a largest-connected-landmass filter, A* pathfinding with a best-effort fallback, the world and arena canvases and the per-name save slots.

### 批次 2 · Batch 2 — 手机端、分享与战败修复 Mobile, sharing, defeat fix (2026-10-18)

- ▶ 手机适配：竖屏单手可玩，按钮够大，窄屏上底部栏自动竖排。
  Built for phones: one-handed portrait play, big touch targets and a bottom bar that stacks on narrow screens.
- ▶ 二维码分享：首页与世界地图都能分享，二维码在本机生成，局域网里扫一下就能一起玩。
  QR sharing from the home screen and the world map, encoded on the device so a scan over the LAN opens the game.
- ▶ 战败不再白送兵：打完一场，队伍就是战场上活下来的那些人。
  A lost battle no longer hands out free troops: the warband is exactly what survived the field.
- 🔧 技术：动态视口与安全区、手机断点、二维码依赖、全局分享弹窗、战败结算改为按幸存者写回。
  Tech: the dynamic viewport and safe areas, the phone breakpoint, the QR dependency, the global share modal and the survivor-based defeat settlement.

### 批次 3 · Batch 3 — 文档 Documentation (2026-10-18)

- 🔧 技术：新增双语说明书与进度文档（玩法、机制、势力兵种、界面、操作、分享、奖励、数据、手机端、部署、维护、结构与排错）。
  Tech: the bilingual README and progress file covering the gameplay, mechanics, roster, screens, controls, sharing, rewards, data, mobile support, deployment, maintenance, structure and troubleshooting.

### 批次 4 · Batch 4 — 角色信息面板 Lord info panel (2026-10-18)

- ▶ 角色详情：世界地图顶部点一下就能看到兵力、资金、物资与战绩。
  Lord info: one tap on the world map shows the troops, the treasury, the supplies and the record.
- 🔧 技术：只读的角色信息弹窗，由世界地图持有开关状态。
  Tech: a read-only lord panel opened from the world map.

### 批次 5 · Batch 5 — 像素素材 Pixel art assets (2026-10-18)

- ▶ 全套像素画：士兵、城镇、村庄、敌将与地形都换成 32×32 像素画，地图上每支部队都认得出是哪一伙。
  Every sprite is pixel art now: soldiers, towns, villages, enemy commanders and the terrain are 32x32 pictures, and every warband on the map is recognisable.
- 🔧 技术：素材生成脚本与像素画桥接、17 张素材批量生成与描边，地图、战场与各面板接入素材绘制。
  Tech: the sprite generator and the pixel-art bridge, 17 sprites drawn in one pass with an outline, and the map, the arena and every panel drawing them.

### 批次 6 · Batch 6 — 兵种标准化与小队战术 Standard roster and squad tactics (2026-10-18)

- ▶ 兵种统一：民兵加上长枪兵、弓箭手、骑兵三个家族，每个家族四档，从初级一路升到精英。
  One roster: militia plus the spearman, archer and cavalry families, each with four ranks from basic to elite.
- ▶ 克制循环：长枪兵克制骑兵、骑兵克制弓箭手、弓箭手克制长枪兵。
  A counter cycle: spearmen beat cavalry, cavalry beat archers, archers beat spearmen.
- ▶ 小队战术：每支小队都能单独下令（攻击 / 防守 / 跟随 / 移动）、换六种队形与两种密度。
  Squad tactics: every squad takes its own order (attack / defend / follow / move), its formation (six) and its density (two).
- ▶ 升级更划算：逐级升级比直接买精英便宜，城镇里能买到各种档位的兵。
  Climbing the ranks is cheaper than buying an elite, and towns roll a mixed stock of ranks.
- 🔧 技术：兵种表与升级树重写、克制倍率、升级价格公式、城镇兵源权重池、队形与密度几何、远程风筝与冲锋压迫。
  Tech: the roster and the upgrade tree, the counter multipliers, the upgrade price formula, the weighted town stock, the formation and density geometry, ranged kiting and melee crowding.

### 批次 7 · Batch 7 — 移动驱动的时钟、扎营与页签修复 Movement-driven clock, camping and the tab fix (2026-10-19)

- ▶ 时间随移动流逝：站着不动时天数与敌军都停下，走起来世界才继续。
  Time follows the lord: standing still freezes the day counter and the enemies, and the world only moves when he walks.
- ▶ 扎营：原地扎营休息，时间与敌军照常流转；点「拔营」或点地图即结束。
  Camp: rest in place while the clock and the enemies keep running; 「🔥 拔营」 or a tap on the map breaks the camp.
- ▶ 据点页签不再空白：升级与考试页签能正常显示了。
  The settlement tabs are fixed: the upgrade and exam tabs render properly again.
- 🔧 技术：移动距离驱动时钟、扎营状态与营地图标、存档补上天数字段、修复面板渲染报错。
  Tech: the distance-driven clock, the camp state and its marker, the day field in the save and the fixed panel render error.

### 批次 8 · Batch 8 — 百科题库、记忆曲线与 Mod 扩展 Encyclopedia, memory curve and mods (2026-10-19)

- ▶ 新增百科知识题库：64 道常识题，和其他科目一起考。
  A new encyclopedia bank of 64 general-knowledge questions, taken together with the other subjects.
- ▶ 记忆曲线：答对的题越来越少见，答错的题经常再考，久了还会忘。
  A memory curve: a question you know is asked less often, a question you miss comes back, and everything fades with time.
- ▶ 题库可以自己加：放一个文件就能新增一个科目。
  The question bank is extensible: drop in a file and a new subject shows up.
- 🔧 技术：百科题库、记忆曲线调度器、题库注册表与外部科目加载、逐题记录与解析显示、存档补上题目记忆记录。
  Tech: the encyclopedia bank, the memory-curve scheduler, the subject registry with the external packs, the per-answer records with explanations and the question memory in the save.

### 批次 9 · Batch 9 — 小地图、详细地图与将领素材 Minimap, detailed atlas and commander art (2026-10-19)

- ▶ 右上角小地图：一眼看到地形、据点、敌军与自己的位置，点开还有一张能拖动的全图。
  A corner minimap: the terrain, the settlements, the enemies and the lord at a glance, and a draggable full map behind it.
- ▶ 部队带数字：主角与每位敌将的图标上都有兵力角标。
  Troop badges: the lord and every commander carry their strength.
- ▶ 敌将换成将领画风：强盗是灰袍蒙面，苍狼紫袍持盾，赤鹰骑马持枪。
  The enemy commanders are drawn as people now: a grey hooded bandit, a purple wolf with a shield and an amber lancer on horseback.
- 🔧 技术：小地图与全图组件、地形缓存绘制、兵力角标绘制、势力配色单一来源、图例改为素材驱动。
  Tech: the minimap and atlas components, the cached terrain painter, the troop badge, the single source of faction colours and the sprite-driven legend.

### 批次 10 · Batch 10 — 受伤恢复、据点归属与城镇发展 Wounds, ownership and town development (2026-10-20)

- ▶ 士兵会受伤：阵亡就是阵亡，伤兵带着伤势进入下一场战斗。
  Soldiers can be wounded: the fallen are gone and the wounded carry their injuries into the next battle.
- ▶ 恢复速度：行军慢、城镇快、自己的城镇更快，医院还会再加成。
  Recovery: slow on the march, faster in a settlement, faster still in your own town, and a hospital multiplies it.
- ▶ 据点归属：每个城镇村庄都有主人，能进、能打、能占。
  Every settlement has an owner: some can be entered, some have to be taken.
- ▶ 围城：准备两天、期间时间流逝、驻军会增援，攻打失败要重新准备。
  Sieges: two days of preparation with the clock running and the garrison growing, and a failed assault means starting over.
- ▶ 城镇发展：考试让城镇发展，繁荣度够了就升级，兵源与恢复都更好。
  Town development: the exams lift the town, enough prosperity promotes it, and a better town recruits and heals better.
- ▶ 城镇设施：医院让伤兵回来得更快，军营让全军更强。
  Town facilities: a hospital brings the wounded back faster, a barracks makes the whole army stronger.
- ▶ 地图变大一倍：城镇与村庄更多，敌人会成长，世界一直在变。
  The world is twice as big: more towns and villages, and the factions keep growing.
- 🔧 技术：兵员带生命值、旧存档改写、恢复速率与存活判定、据点归属与驻军、围城流程、城镇经济与设施、存档兼容。
  Tech: hit points on the soldiers, the save migration, the recovery and survival rules, the ownership and garrisons, the siege flow, the town economy and its facilities, and the save compatibility.

### 批次 11 · Batch 11 — 语文题库扩容：阅读理解与古诗 More Chinese: reading comprehension and ancient poems (2026-10-20)

- ▶ 阅读理解：12 篇短文，每篇三道题。
  Reading comprehension: 12 short passages with three questions each.
- ▶ 古诗题库扩到 30 首必背古诗。
  The ancient-poem bank grew to 30 poems every child has to learn.
- ▶ 五种新题型：补字、猜诗题、作者是谁、上一句和诗意，答错还有讲解。
  Five new question types — the missing character, which poem, who wrote it, the line before and what it means — each with an explanation.
- 🔧 技术：阅读理解题型与短文库、古诗题库扩充、题型名与记忆曲线的对应。
  Tech: the reading-comprehension type and its passages, the bigger poem bank and the kind names that key the memory curve.

### 批次 12 · Batch 12 — 难度、战斗速度、战场地形与围城修复 Difficulty, battle speed, battlefield terrain and the siege fixes (2026-10-20)

- ▶ 难度三档：简单 / 普通 / 困难，只改考试给的金币。
  Three difficulties — easy, normal and hard — that change only the exam reward.
- ▶ 战斗速度：慢速默认，还有正常与快速，随时能切。
  Battle speed: slow by default, plus normal and fast, switchable at any time.
- ▶ 战场地形：森林、沙地、河流、湖泊与山地，各自有各的打法，湖泊过不去。
  Battlefield terrain: forest, desert, river, lake and mountain, each with its own tactics — and a lake you cannot cross.
- ▶ 围城可以中断，攻打失败要重新准备。
  A siege can be called off, and a failed assault has to be prepared again.
- 🔧 技术：难度与奖励公式、战斗速度档、战场地形表与不可通行规则、镜头跟随与拖动、围城中断与失败处理。
  Tech: the difficulty and the reward formula, the speed settings, the terrain table and its impassable rule, the following and draggable camera, and the siege fixes.

### 批次 13 · Batch 13 — 战役时钟显示 The campaign clock (2026-10-20)

- ▶ 战役时钟：屏幕上有第几天与当天时刻，一眼看出时间在走还是停着。
  A campaign clock: the day and the hour on the screen, so it is obvious whether time runs or stands still.
- ▶ 时钟在地图、据点与角色面板里都能看到。
  The clock is on the map, in the settlement and in the lord panel.
- 🔧 技术：世界时钟读取与共用的时钟组件。
  Tech: the world clock readout and the shared clock component.

### 批次 14 · Batch 14 — 无主城镇也要打下来 An unclaimed town has to be stormed (2026-10-20)

- ▶ 无主城镇看情况：没人守就插旗占领，有人守就得先打下来。
  An unclaimed town depends: empty, you take it with a flag; defended, you have to storm it first.
- ▶ 攻打城镇：赢了城镇归你，输了城镇还是原样，可以再来。
  Storming a town: win and it is yours, lose and it stays as it was — and you can try again.
- 🔧 技术：世界生成里无主城镇的空置比例、占领与攻打的战斗类型、胜利后的归属转移。
  Tech: the share of empty unclaimed towns, the claim and assault battle kinds and the ownership change on a win.

### 批次 15 · Batch 15 — 昼夜 Day and night (2026-10-20)

- ▶ 昼夜循环：每天最后五分之一是夜晚，地图变暗、所有人走得慢。
  A day and night cycle: the last fifth of every day is night — the map darkens and everyone walks slower.
- ▶ 主角身边有一圈灯光，夜里也看得清脚下。
  The lord keeps a lantern light around him, so the ground stays readable at night.
- 🔧 技术：夜晚时段、黑度曲线与减速系数、夜景色层绘制。
  Tech: the night window, the darkness curve and the slowdown, and the night overlay on the map.

### 批次 16 · Batch 16 — 版本号与练兵 Version display and the training drill (2026-10-21)

- ▶ 首页显示版本号：一眼知道自己在玩哪一版。
  The home screen shows the version number, so it is clear which build is running.
- ▶ 更新内容：点一下版本号就弹出对话框，看这次更新了什么。
  The update notes: tapping the version opens a dialog with what changed.
- ▶ 练兵：扎营时点「🎯 练兵」进入训练场，场上只有自己的士兵和训练木桩。
  Training: while camped, 「🎯 练兵」 opens a drill ground with the lord's own soldiers and wooden dummies.
- ▶ 练兵很安全：没有敌人、不会死人、不会结束，练完点「🏕 结束练兵」回地图。
  A drill is safe: no enemy, no losses and no end — 「🏕 结束练兵」 takes you back to the map.
- 🔧 技术：版本号与更新内容的独立目录、更新内容由进度文件整理生成、训练场与木桩、训练模式不结算任何战役数据。
  Tech: the folder that holds the version and the notes, the notes generated from the progress file, the drill ground and its dummies, and a training session that settles nothing.

### 批次 17 · Batch 17 — 快速战斗模拟器 The quick battle simulator (2026-10-21)

- ▶ 快速战斗：不用打战役，也能问一句「谁打得过谁」。
  Quick battle: ask "who would win?" without playing a campaign.
- ▶ 可以选战场：混战、平原、密林、山地、大河与湖泽六种地形。
  Six battlefields to pick: mixed, plain, forest, mountain, river and lake.
- ▶ 可以选敌我：己方民兵 / 长枪兵 / 弓箭手 / 骑兵，敌方强盗 / 苍狼 / 赤鹰。
  Both sides can be picked: militia, spearmen, archers or cavalry against bandits, the wolf or the eagle.
- ▶ 可以选规模：小队、中队、大队到大军，跑 5 / 20 / 50 场。
  The armies can be sized from a squad to an army, over 5, 20 or 50 fights.
- ▶ 战报：胜率、双方平均阵亡与每场明细一目了然。
  The report shows the win rate, the average casualties of both sides and every round.
- 🔧 技术：战场预设表、模拟器复用真实战斗的模拟、战报统计与界面。
  Tech: the battlefield presets, the simulator running on the real battle simulation, the report and its screen.

`

const out = [...lines.slice(0, start), ...section.split('\n'), ...lines.slice(end)]
writeFileSync(file, out.join('\n'))
console.log('rewrote the completed-features section')
