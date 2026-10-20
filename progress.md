# 开发进度 · Development Progress

`kids-war-game` — 2D top-down strategy game · 2D 俯视策略游戏
Last updated · 最后更新：2026-10-21

This file tracks what is built, what is verified, and what is still open.
本文件记录已完成的内容、验证过的结论，以及仍未完成的部分。

It is the companion to `README.md`: the README explains how the game works, this file explains how far it has got.
它是 `README.md` 的配套文件：README 讲游戏怎么运作，本文件讲它做到了哪一步。

---

## 1. 进度总览 · Progress Overview

| 需求 / 领域 Area | 状态 Status | 说明 Notes |
| --- | --- | --- |
| 版本号与更新内容 Version and changelog | ✅ 完成 Done | 首页标题下显示「版本 v0.0.1」徽章，底部徽章点开一个对话框写着本次发布的更新内容；版本号与更新日志集中在 `src/game/versions/`（每个发布一个文件），**只更新修订号**（v0.0.1 → v0.0.2），批次内容由 `progress.md` 生成。The home screen shows a 「版本 v0.0.1」 badge under the title and a badge at the bottom opens a dialog with the update notes of the release; the version and the changelog live in `src/game/versions/` (one file per release) and **only the patch moves** (v0.0.1 → v0.0.2), with the batches generated from `progress.md`. |
| 扎营练兵 Training drill | ✅ 完成 Done | 扎营时底部出现「🎯 练兵」：进入只有自己士兵与八个训练木桩的战场，**没有敌人、不会结束、不会死人**，木桩打倒后两秒自己立起，队伍 / 金币 / 军粮 / 战绩都不受影响。While the camp is pitched the bottom bar grows a 「🎯 练兵」 button: a field with the lord's own soldiers and eight wooden dummies, **no enemy, no end and no losses**; the dummies stand back up two seconds after they are knocked down, and the warband, purse, food and record stay untouched. |
| 世界地图与点击移动 World map and tap-to-move | ✅ 完成 Done | A* + 尽力靠近回退，最大连通陆地保证可达。A* with best-effort fallback on one connected mainland. |
| 游戏时钟与扎营 Game clock and camping | ✅ 完成 Done | 时间只在主角移动或扎营时流逝，站着不动会冻结天数与所有敌军；「⛺ 扎营」原地推进时间，地图上画出帐篷与篝火，**顶部时钟显示天数、当天时刻与进度条**，据点界面与角色面板也有同一个时钟；**每天的最后五分之一是夜晚**，夜里地图变暗、全世界慢 25%。Time runs only while the lord marches or camps — standing still freezes the day counter and every party; camping advances it in place with a tent and campfire on the map, and the **clock chip shows the day, the hour of that day and a progress bar**, with the same clock on the settlement screen and in the lord panel; **the last fifth of every day is night**, when the map darkens and the whole world slows down by 25%. |
| 据点页签渲染 Settlement tab rendering | ✅ 完成 Done | 修复升级 / 考试页签空白：`UpgradePanel.vue` 模板调用了未导入的 `unitSprite`，渲染异常中断了整个页面更新。Fixed the blank 升级 / 考试 tabs: `UpgradePanel.vue`'s template called an unimported `unitSprite`, and the render error aborted the whole page update. |
| 随机世界生成并本地保存 Random world + local save | ✅ 完成 Done | 种子驱动，地形压缩为 id 数组存入 localStorage。Seed driven, terrain stored as a compact id array. |
| 世界规模 World size | ✅ 完成 Done | 160 × 128 格（宽高各扩一倍），8 城 + 24 村；小地图与全图仍按 1.25 比例绘制。160 x 128 tiles (twice as big in each direction) with 8 towns and 24 villages; the minimap and the atlas keep their 1.25 ratio. |
| 势力成长 Faction growth | ✅ 完成 Done | 势力每天补兵，新强盗随机出现在地图上（上限 50 支），势力兵力上限 = 20 + 0.6 × 已占领城镇的繁荣度之和。The factions reinforce every day, new bandit bands appear at random (up to 50 warbands) and a faction's strength is capped at 20 + 0.6 × the prosperity of the captured towns. |
| 村庄 / 城镇与进入 Villages, towns and entering | ✅ 完成 Done | 最多 4 城 + 12 村，靠近约 1.4 格可进入；强盗村庄与王国城镇不能直接进入，要打下来。Up to 4 towns + 12 villages, enter within ~1.4 tiles; bandit villages and kingdom towns have to be taken by force. |
| 据点归属、驻军与围城 Ownership, garrisons, sieges | ✅ 完成 Done | 每个据点一个归属（无主 / 主角 / 强盗 / 苍狼 / 赤鹰），强盗永不占城镇；据点都有驻军（**无主城镇可能空无一人**，那样就能直接「🚩 占领」，否则要「⚔️ 攻城」），城镇要准备 2 天才能攻打，准备期间时间流逝、驻军增援、归属方派援军；围城**随时可以中断**，**攻打失败要重新准备**。Exactly one owner per settlement (neutral / player / bandit / wolf / eagle), bandits never hold a town; every settlement fields a garrison (**an unclaimed town may stand empty**, in which case 「🚩 占领」 works, otherwise it has to be stormed with 「⚔️ 攻城」), and a town needs two days of preparation before it can be stormed, during which the clock runs, the garrison grows and the owner sends a relief warband; the siege can be **called off at any time** and a **failed assault means preparing it again**. |
| 城镇发展、繁荣度与等级 Town development, prosperity, level | ✅ 完成 Done | 考试把 60% 收入变成城镇资金、每答对一题 +2 发展；发展高于 40 则繁荣度上涨，否则下滑；繁荣度到阈值就升级城镇（Lv.1–4），等级越高兵源越好、自己城镇恢复越快。The exam turns 60% of the reward into town funds and adds +2 development per correct answer; prosperity rises while development is above 40 and falls below it; a threshold promotes the town (Lv.1–4), and a higher level means better recruits and faster healing at home. |
| 城镇设施 Town facilities | ✅ 完成 Done | 医院（恢复 ×(1+0.5/级)、战败存活 +10%/级）与军营（全军攻防 +6%/级），都用城镇资金建造，各可升三级。Hospital (recovery ×(1+0.5/level), +10% survival per level) and barracks (+6% attack and defence per level), both built with town funds and upgradable three times. |
| 受伤与恢复 Wounds and recovery | ✅ 完成 Done | 士兵组变成 `{ type, tier, count, hp }`，每人一个生命值；战败者可能阵亡或成为伤兵，伤兵随时间恢复（行军 6/天、城镇 24/天、自有城镇更快，医院再乘）。A soldier group is now `{ type, tier, count, hp }` with one value per soldier; a defeated soldier either dies or survives as a wounded soldier, and wounds heal over time (6/day marching, 24/day in a settlement, faster in your own town, multiplied by the hospital). |
| 兵力与物资 Recruitment and supplies | ⚠️ 部分 Partial | 招兵/升级/军粮/战马完整；城镇设施仅「市场」一种。Recruiting, upgrades, food and horses are complete; the market is the only town facility. |
| 势力分布 Faction distribution | ⚠️ 部分 Partial | 按锚点聚集；强盗为特殊势力并以灰袍与蒙面区分，苍狼紫、赤鹰琥珀。归属已经落到据点上（强盗只占村庄），但各势力之间仍不会互相开战。Clustered around anchors, with bandits set apart by a grey hood and mask against the purple wolf and amber eagle. Ownership now lives on the settlements (bandits only hold villages), but the factions still never fight each other. |
| 战斗地图 Battle terrain | ✅ 完成 Done | 战场有 **森林 / 沙地 / 河流 / 湖泊 / 山地** 五种地形的格子，地形影响移动、攻击与防御，湖泊不可通行；战场从 900 × 560 扩到 **1000 × 680**，并配一台会跟随战斗、可拖动的镜头。The field carries forest / desert / river / lake / mountain cells that change movement, attack and defence, with the lake impassable; the arena grew from 900 × 560 to **1000 × 680** and gained a camera that follows the fighting and can be dragged. |
| 战斗速度 Battle speed | ✅ 完成 Done | 战斗有 🐢 慢速 / 🚶 正常 / 🐇 快速三档，**默认慢速**，战斗界面右上角 ⚙ 里切换。Three speeds — 🐢 slow (the default), 🚶 normal and 🐇 fast — switched from the ⚙ tools in the corner of the battle screen. |
| 难度设置 Difficulty | ✅ 完成 Done | 简单 / 普通 / 困难三档，只影响考试金币：原始数值 / 每题少 1 / 每题少 2；首页开局选择，世界地图上 🎚 芯片随时更改，随存档保存。Three levels that only change the exam reward (the original numbers, one gold less, two gold less); picked on the home screen, changeable any time with the 🎚 chip on the world map, and saved with the campaign. |
| 战术命令 攻击 / 防守 / 跟随 / 移动 Tactical orders | ✅ 完成 Done | 四个命令可实时切换，作用于**选中的小队**或全军；点击战场移动指挥官。All four switch live, per squad or army-wide; tapping the field moves the commander. |
| 队形与密度 Formations and densities | ✅ 完成 Done | 每小队独立设置 6 种队形 × 2 种密度，立即生效并影响攻/防/移速/远程减伤。Six formations × two densities per squad, applied live and modifying attack, defence, speed and ranged damage taken. |
| 兵种标准化与克制循环 Standard roster and counter cycle | ✅ 完成 Done | 民兵 → 长枪兵/弓箭手/骑兵，四档升级；长枪兵克制骑兵、骑兵克制弓箭手、弓箭手克制长枪兵（+40% / −25%）。Militia into spearman/archer/cavalry over four ranks, with the spearman > cavalry > archer > spearman cycle (+40% / −25%). |
| 兵种升级树 Unit upgrade tree | ✅ 完成 Done | 民兵 → 长枪兵 / 弓箭手 / 骑兵，每家族再升 中级 / 高级 / 精英；逐级升级比直接买精英便宜。Militia → spearman/archer/cavalry, then each family climbs 中级 / 高级 / 精英; the ladder is cheaper than buying the elite outright. |
| 兵种升级图 Unit upgrade diagram | ✅ 完成 Done | 游戏介绍里按 `units.js` 自动生成路线图、逐档属性与逐档升级价。The guide generates the tree, per-rank stats and per-rank upgrade prices straight from `units.js`. |
| 城镇考试与题目分级 Town exams and grading | ✅ 完成 Done | 三/四年级 × 英文/语文/数学/逻辑/百科知识，答对才给钱；考试设置页显示记忆曲线进度。Grades 3–4 × English/Chinese/math/logic/encyclopedia; only correct answers pay, and the setup screen shows the memory-curve progress. |
| 记忆曲线出题 Memory-curve scheduling | ✅ 完成 Done | 每题 0–5 级，权重 `0.55^level`（下限 0.05）；答对 +1、答错 −2，20 小时未复习掉一级（每次最多两级）。Levels 0–5 per question weighted `0.55^level` (floor 0.05); correct +1, wrong −2, and one level lost per 20 hours without review (max two per pass). |
| 题库 Mod 扩展 Question mods | ✅ 完成 Done | 内置与外置科目共用一套契约；`public/mods/` 放 JSON 即自动出现在考试科目里，示例为「安全常识」12 题。Built-in and external subjects share one contract; a JSON file in `public/mods/` becomes an exam subject automatically, demonstrated by the 12-question 安全常识 pack. |
| 语文题库 Chinese bank | ✅ 完成 Done | 阅读理解 12 篇短文 × 3 题；古诗 30 首，六种题型（接龙 / 补字 / 猜诗题 / 作者 / 上一句 / 诗意），每题带解析。Reading comprehension with 12 passages of three questions, plus 30 ancient poems in six question types, every one with an explanation. |
| 单机 + 本地存档 Single player + local saves | ✅ 完成 Done | 按领主名字隔离存档位，自动保存。Per-name save slots with autosave. |
| 局域网访问 LAN access | ✅ 完成 Done | dev/preview 均绑定 `0.0.0.0`。Both bind to `0.0.0.0`. |
| 手机端适配 Mobile support | ✅ 完成 Done | 560 px 断点、安全区、44 px 触控目标、`100dvh`。560 px breakpoint, safe areas, 44 px targets, `100dvh`. |
| 角色信息面板 Lord info panel | ✅ 完成 Done | 世界地图顶部 👤 角色详情 芯片打开弹窗，展示兵力 / 资金 / 物资 / 战绩。Opened from the 👤 chip on the world map; shows troops, treasury, supplies and record. |
| 小地图与详细地图 Minimap and detailed atlas | ✅ 完成 Done | 右上角小地图（据点标记、势力色部队、主角、视野框）点击打开可拖动的全图（16 px/格）；主角与每位将领的图标右上角都显示兵力角标。A corner minimap (settlement markers, faction-coloured parties, the lord, the camera rectangle) that opens a draggable atlas at 16 px per tile; the lord and every commander carry a troop badge. |
| 像素资产 Pixel art assets | ✅ 完成 Done | 18 张 32×32 素材（含三势力地图将领），经 Pixelorama 桥接生成，世界地图 / 战场 / 各面板均已接入。18 sprites at 32x32 (including the three faction commanders) generated through the Pixelorama bridge and wired into the world map, battle arena and panels. |
| 二维码分享 QR sharing | ✅ 完成 Done | 本地编码二维码，离线局域网可用。Locally encoded QR, works offline on a LAN. |
| 游戏介绍 Onboarding | ✅ 完成 Done | 首次开始前弹出介绍 + 独立介绍页。Intro modal before the first campaign plus a guide page. |
| 版本号与更新内容 Version display and update notes | ✅ 完成 Done | 首页显示「版本 v0.0.1」徽章，**点击后用对话框**展示本次更新内容；内容整理自 `progress.md` 的「已完成功能」一节，由 `tools/build-versions.mjs` 生成到 `src/game/versions/`。A 「版本 v0.0.1」 badge on the home screen; **tapping it opens a dialog** with the update notes, which are organised from the 「已完成功能」 section of `progress.md` and generated into `src/game/versions/` by `tools/build-versions.mjs`. |
| 练兵 Training drill | ✅ 完成 Done | 扎营时世界地图出现「🎯 练兵」按钮，进入没有敌人的训练场：只有自己的士兵和八个训练木桩，木桩只挨打、不会还手，打倒后两秒自己立起；练兵对钱袋 / 军粮 / 队伍 / 战绩零影响。A 「🎯 练兵」 button while the camp is pitched opens a field with no enemies: the lord's own soldiers and eight wooden dummies that only take blows and stand back up on their own; a drill changes nothing in the campaign. |
| 快速战斗 Quick battle | ✅ 完成 Done | 首页的「⚡ 快速战斗」可选战场地图（六种预设）、敌我势力与士兵规模，跑出胜率与每场明细；模拟复用真实战斗的模拟器。The 「⚡ 快速战斗」 entry on the home screen picks a battlefield (six presets), the two sides and the size of the armies, and reports the win rate and every round — running on the real battle simulation. |
| 局域网联机 LAN multiplayer | ❌ 未开始 Not started | 原需求列为「后续可能扩展」。Listed in the original spec as a possible future extension. |
| 排名 / 排行榜 Leaderboards | ❌ 未开始 Not started | 未实现。Not implemented. |

---

## 2. 已完成功能 · Completed Features

每个批次的两类条目：**▶** 是玩家在游戏里能看见、能玩到的变化；**🔧** 是开发层面的改动，只留在这份进度文件里，游戏内的「更新内容」对话框只显示前者。
Every batch has two kinds of entries: **▶** marks what a player can see or play, and **🔧** marks the work behind it. Only the ▶ entries reach the update dialog of the game.

生成脚本 `tools/build-versions.mjs` 只取 `▶` 条目，因此更新内容里不会出现文件名、脚本名或检查项数量；一条 `▶` 都没有的批次（比如批次 3 的纯文档工作）不会出现在对话框里。
The generator `tools/build-versions.mjs` keeps only the ▶ entries, so the update dialog never shows file names, script names or test counts — and a batch without a single ▶ entry (batch 3, pure documentation) does not appear there at all.

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
- ▶ 兵力可以随便填：民兵、长枪兵、弓箭手、骑兵，**每一种的数量都能用加减键任意设置**，四档规模只是帮你一键铺开。
  The numbers are yours to set: militia, spearmen, archers and cavalry, and **the count of every kind can be raised or lowered freely** — the four sizes are only a shortcut.
- ▶ 可以选敌我势力：己方一键换成整队民兵 / 长枪兵 / 弓箭手 / 骑兵，敌方一键换成强盗 / 苍狼 / 赤鹰的兵种配比，之后仍可逐个改。
  Both sides can be picked: the lord switches to a whole band of militia / spearmen / archers / cavalry, the enemy to the mix of the bandits / the wolf / the eagle, and every number stays editable.
- ▶ 打完是真打一场：点「⚡ 进入战场」就站上战场，像平常一样下令、换队形、打完看战报。
  The fight is a real one: 「⚡ 进入战场」 puts the lord on the field, where the orders and formations work exactly as usual.
- ▶ 快速战斗不打乱战役：这一场只是练习，你的队伍、金币与战绩都不会变。
  A quick battle leaves the campaign alone: it is a drill, so the warband, the purse and the record do not move.
- ▶ 想先看胜率也行：点「📊 先看看胜率」用同样的两支队伍跑 20 场，直接给出胜率与平均阵亡。
  Or look at the odds first: 「📊 先看看胜率」 runs the same two armies through 20 fights and reports the win rate and the average casualties.
- ▶ 入口就在首页：「⚡ 快速战斗」与「开始新的征程」「继续上次进度」**同级**，一进来就能用。
  The entry is on the home screen: 「⚡ 快速战斗」 sits **on the same level** as 「开始新的征程」 and 「继续上次进度」.
- 🔧 技术：战场预设表、逐兵种的兵力表、模拟器复用真实战斗的模拟、战报统计与界面。
  Tech: the battlefield presets, the per-kind counts, the simulator running on the real battle simulation, the report and its screen.


---

## 3. 已知限制 · Known Limitations
1. **难度只影响考试金币。** 敌人、驻军、价格与任务都不随难度变化，因此「困难」只是让赚钱更慢，而不是让仗更难打。
   **The difficulty only touches the exam reward.** The enemies, the garrisons, the prices and the quests stay the same, so 「困难」 only makes gold harder to earn — it does not make the war harder.
2. **指挥官不会受伤。** 敌方单位的目标搜索只遍历 `b.units`，而指挥官不在其中，所以它的 120 HP 血条永远不掉；它目前只是「防守 / 跟随」命令的参照点。
   **The commander never takes damage.** Enemy targeting only scans `b.units`, and the commander is not in that list, so its 120 HP bar never drops; it acts purely as the anchor for the defend/follow orders.
3. **被击败的敌人不会重生。** 世界不会补充新的敌军，因此地图可以被清空。
   **Defeated enemies never respawn.** The world spawns no replacements, so the map can eventually be cleared.
4. **单机 + 浏览器本地存档。** 存档存在 localStorage，无法跨设备或跨浏览器迁移，也没有导出/导入。
   **Single player with browser-local saves.** Progress lives in localStorage, cannot move between devices or browsers, and there is no export/import.
5. **非玩家势力全部敌对。** 原需求提到「敌人或中立的势力」，目前中立性只体现在中立的城镇/村庄，没有任何中立部队。
   **All NPC factions are hostile.** The original spec mentions enemies *or* neutral forces; today neutrality only exists as neutral settlements — there are no neutral warbands.
6. **经济系统刻意简化。** 军粮只影响攻击力（缺粮 −25%），战马最多 +10% 攻击；每个兵种定义了 `wage`，角色面板会显示每日军饷合计，但**金币并不会真的按日扣除**，该数值目前只是展示。
   **The economy is deliberately simple.** Food only affects attack (−25% when empty) and horses cap at +10% attack; every unit defines a `wage` and the lord panel shows the total daily wage, but **gold is still never deducted per day** — the number is display only.
7. **少量已定义但未使用的字段。** `player.gradePref`、`hasWarband` 与 `player.stats.days` 目前没有任何界面或逻辑引用（考试界面使用自己的本地年级选择，天数以 `world.day` 为准）；`dailyWage` 已由角色面板引用。
   **A few defined-but-unused fields.** `player.gradePref`, `hasWarband` and `player.stats.days` are still not referenced by any UI or logic (the exam modal keeps its own local grade selection and the day counter lives in `world.day`); `dailyWage` is now read by the lord panel.
8. **真机小屏验证未完成。** 批次 7 用真实 Chrome（headless + CDP，390×844 CSS px 设备模拟）在**真正生效的 560 px 媒体查询**下走查了世界 HUD、扎营按钮与提示条，无重叠或溢出；但**仍未在真实 375 px 手机屏上用过触屏**，手势（长按、双击缩放）与 iOS 的 `dvh` 表现未验证。
   **Real-phone small-screen verification is pending.** Batch 7 drove real Chrome (headless over CDP at 390x844 CSS px with device emulation) with the 560 px media query genuinely active, and the world HUD, camp button and hint bar showed no overlap or overflow; however **no touch pass has been done on a real 375 px phone**, and gestures (long press, double-tap zoom) plus iOS `dvh` behaviour remain unverified.
9. **像素素材的浏览器校验仍未覆盖战场。** 批次 7 已在浏览器中实测世界地图（含扎营的帐篷与篝火）与据点四个页签（含升级列表里的兵种图标），但**战场士兵**（阵营底盘、血条、朝向翻转、档位血点）本轮仍未触发；营地图标按 1× TILE 绘制，会与领主立绘轻微重叠，属于刻意取舍。
   **The pixel-art browser pass still skips the arena.** Batch 7 confirmed the world map (including the tent and campfire) and all four settlement tabs (including the unit icons in the upgrade list) in a browser, but the **arena soldiers** (side discs, health bars, facing flips, rank pips) were still not triggered this round; the camp marker is drawn at 1x TILE and overlaps the lord sprite slightly, which is a deliberate trade-off.
10. **战斗平衡只由无头对战校验。** 克制关系与胜负只在无头 8v8 / 16v16 的同阵对冲下验证过，没有真人试玩；2–4 档之间的对战、混编阵容与「移动 / 跟随」命令下的胜负都没有系统测试。
   **Battle balance is verified by headless duels only.** The counter cycle and the outcomes were checked with headless 8v8 / 16v16 mirror duels; there has been no human playtest, and rank-2 to rank-4 duels, mixed compositions and fights under the move / follow orders are not systematically tested.
11. **远程风筝可能把自己逼到墙角。** 攻击命令下的远程小队只会沿直线后退，退到战场边缘后就只能站着对射；没有绕开敌人的寻路。
   **Kiting can corner itself.** Attacking ranged squads only ever back away in a straight line, so once they reach the arena edge they can only stand and trade; there is no pathfinding to steer them around the enemy.
12. **冲锋会压平队形。** 近战小队冲锋时队形偏移被压到 13 px 以内，因此接战瞬间「方队」与「一行」看不出差别；队形差异主要体现在接敌前的行军与防守站位。
   **Charging flattens the formation.** A charging melee squad's slot offsets are capped at 13 px, so square and single-rank look alike at the moment of contact; formations mainly shape the approach and the defending stance.
13. **冻结的世界＝站着不动的玩家不会被追上。** 时间冻结后所有敌军都停住，因此站在原地不动时（不扎营）敌人永远追不上你，遭遇战只会在主角移动或扎营时发生。这是「时间随移动推进」的直接推论，也是一种反偷袭保护。
   **A frozen world means an idle lord can never be caught.** With time frozen every party stops, so while standing still (and not camping) enemies can never close on you and encounters only happen while marching or camping. That follows directly from the movement-driven clock, and it doubles as ambush protection.
14. **扎营目前只有「原地等时间」一个效果。** 它不消耗军粮、不恢复任何状态，也没有昼夜变化或营地本身的风险；一天固定 24 秒游戏时间，与实际走过的距离无关（地形越差走得越慢，因此穿过森林的一天反而更短）。
   **Camping currently only means "let time pass in place".** It consumes no supplies, restores nothing and carries no day/night cycle or camp risk; a day is a flat 24 seconds of game time regardless of the distance covered (rough terrain is slower, so a day spent in forest is actually shorter).
15. **记忆曲线只按题目记录，没有科目 / 年级视图。** 界面只显示「已记录 N 题 / 掌握 M 题」两个总数，看不到哪一科薄弱；`pruneQuestionStats()` 在超过 1200 条后按 `lastSeen` 丢弃最久未见的记录，长期游玩会让很早的题目回到 0 级。
    **The memory curve is tracked per question only, with no subject or grade view.** The UI shows just two totals (recorded / mastered), so a weak subject is invisible; past 1200 records `pruneQuestionStats()` drops the least recently seen ones by `lastSeen`, so very old questions eventually restart at level 0.
16. **Mod 只是客户端静态 JSON。** 没有签名、沙箱或界面管理，增删科目只能改 `public/mods/index.json`；加载失败只会在 `loadMods()` 的返回值里计数，界面不会提示哪个包被跳过。
    **Mods are plain client-side static JSON.** There is no signing, sandbox or management UI — adding or removing a subject means editing `public/mods/index.json` — and a failed file is only counted in the `loadMods()` report, with no UI hint about which pack was skipped.
17. **记忆曲线不影响通过线、奖励与惩罚。** 权重只决定抽题概率：答错照旧只损失该题金币，不会倒扣，也不会降低考试通过线。
    **The memory curve only shapes the draw.** It does not change the pass line, the reward or any penalty: a wrong answer still only forfeits that question's gold, with no deduction and no effect on passing.
18. **详细地图不画地形装饰。** `drawAtlas()` 只铺地形底色与据点 / 将领 / 主角标记，没有森林树木、山峰、浪花与沙丘，因此全图比大地图「干净」；这是刻意的性能取舍（1280 × 1024 的画布每帧重绘，几千个装饰会成倍放大绘制量）。
   **The atlas skips terrain decoration.** `drawAtlas()` paints the terrain colours plus the settlement / commander / lord markers but no forest trees, peaks, foam or dunes, so the atlas looks flatter than the main map; that is a deliberate performance trade-off (a 1280x1024 canvas repainted every frame would multiply the draw cost by the decoration count).
19. **小地图与全图没有战争迷雾。** 所有据点与敌军从一开始就全图可见，侦查因此没有意义；若以后要加迷雾，可见性判断应当写进 `atlas.js` 的两个画法里，而不是分别加在两个组件上。
   **Neither the minimap nor the atlas has fog of war.** Every settlement and warband is visible from the start, so scouting has no value; adding fog later means putting the visibility test inside the two painters in `atlas.js` rather than in the two components.
20. **势力之间不会开战。** 归属只影响「谁能进、谁能打」，苍狼与赤鹰之间没有战争，援军只会被打散，不会主动攻城。
   **The factions never fight each other.** Ownership decides who may enter and who may be attacked, but there is no war between the two kingdoms, and a relief warband only scatters instead of taking a town.
21. **主角的城镇没有驻军。** 夺下城镇后驻军清空，靠城市的等级与设施保护自己；没有别的势力会来攻城。
   **A town the lord owns fields no garrison.** Its garrison is empty after the capture, so the town relies on its level and facilities; no other faction ever attacks it.
22. **恢复按「天」结算，不是按秒。** 伤兵在一天之内不会回血，只有跨过一天才会结算一次，因此在城镇里站几秒看不到变化。
   **Recovery is settled per day, not per second.** A wounded soldier does not heal within a day; the change lands when the day turns, so standing in a town for a few seconds shows nothing.
23. **围城只有一次援军。** 准备期间归属方只会派一支援军，驻军每天也最多多四名，因此拖延围城有上限收益。
   **A siege gets one relief warband.** The owner sends a single relief force and the garrison grows by at most four, so a long siege has a limited payoff.
24. **城镇经济是线性的。** 繁荣度与发展都按固定公式线性变化，没有人口、士气或事件，因此发展路线比较单一。
   **The town economy is linear.** Prosperity and development move along fixed formulas with no population, morale or events, so there is only one obvious development route.
25. **战场地形是「格子」而不是连续地形。** 地形按 40 px 的格子判定，边界是直的；士兵绕开湖泊靠的是两轴分开移动与卡住时的侧向推开，因此可能出现「沿着湖边绕很久」的情况。
    **The battlefield terrain is grid based, not continuous.** A tile is 40 px with straight borders, and soldiers get around a lake by moving on each axis separately plus a sideways nudge when stuck, so a unit can spend a while walking along the shore.
26. **镜头不会自动回到战斗。** 拖动过战场之后镜头停在原处，需要点 🎯 才能重新跟随；战斗开始时也没有「回到开局位置」的按钮。
    **The camera does not come back on its own.** After a drag the camera stays where the finger left it, and the 🎯 button is needed to follow the fighting again; there is no "back to the start" button.

---

## 4. 路线图 · Roadmap

Ordered roughly from "closest to the original spec" to "nice to have".
大致按「离原需求最近」到「锦上添花」排序。

1. **难度影响更多系统** — 现在难度只改考试金币；下一步可以让它同时影响敌军强度、驻军数量与价格，让「困难」既难赚钱也难打仗。
   **Let the difficulty touch more systems** — today it only changes the exam reward; the next step is to let it scale the enemy strength, the garrison size and the prices, so 「困难」 is hard both to earn and to fight.
2. **局域网联机** — 世界状态共享与服务端权威战斗的轻量方案。*(原需求第 6 条)*
   **LAN multiplayer** — a lightweight shared world state with server-authoritative battles. *(spec item 6)*
3. **敌人重生与势力扩张** — 让势力随着天数补充部队，避免地图被清空。
   **Enemy respawn and faction growth** — parties replenish over days so the map cannot be emptied.
4. **指挥官参与战斗** — 敌方可攻击指挥官，指挥官被击倒即判负，让「跟随」命令更有价值。
   **Make the commander a combatant** — enemies can attack it and losing it loses the battle, which gives the follow order real weight.
5. **中立势力** — 加入不主动攻击的中立部队，完善「敌人或中立势力」的分布。
   **Neutral forces** — add non-aggressive warbands to complete the enemy-or-neutral distribution.
6. **完整经济** — 启用 `wage` 日薪与更细的军粮消耗，让金币有持续压力；天数现在只随移动 / 扎营推进，正好可以按月计薪，让「扎营等待」变成要花钱的决定。
   **Full economy** — enable the `wage` upkeep and finer food consumption so gold has ongoing pressure; days now advance only through movement or camping, which makes per-day wages a natural fit and turns "camp and wait" into a decision with a price.
7. **存档导出 / 导入** — 用一段文本或二维码在设备之间迁移进度。
   **Save export / import** — move progress between devices with a text blob or a QR code.
8. **更多城镇设施** — 酒馆（随机任务）、铁匠铺（装备加成）。
   **More town facilities** — a tavern with random quests and a smithy with equipment bonuses.
9. **真机验证与手感打磨** — 375 px 真机走查，调整间距、字号与画布性能。
   **Real-device pass and feel polish** — a 375 px walkthrough tuning spacing, font sizes and canvas performance.
10. **战斗手感试玩与远程寻路** — 用真人试玩校对克制强度、队形差异与各命令的收益，并让攻击命令下的远程小队绕开敌人后退，而不是一路退到墙角。
   **Battle-feel playtest and ranged pathing** — tune the counter strength, the formation differences and the payoff of each order with real plays, and let attacking ranged squads retreat around the enemy instead of backing into the wall.
11. **昼夜与扎营深度** — 给天数加昼夜色调（夜晚视野变小、远程命中下降），让扎营消耗军粮、恢复士气或招来夜袭，并让敌军按天补充兵力，使「原地等时间」既有代价也有收益。
   **Day/night cycle and deeper camping** — tint the map by time of day (shorter sight and weaker ranged fire at night), make camping consume supplies, restore morale or attract a night raid, and let factions replenish troops over days so waiting in place has both a cost and a payoff.
12. **错题本与复习模式** — 直接复用 `questionStats`：按科目列出 level 0–2 的题目，生成一张只含弱项的复习卷，并在考试结果页提示「今天最该复习的三题」。
    **Mistake book and revision mode** — reuse `questionStats` to list level 0–2 questions per subject, build a revision paper from weak items only, and surface "the three questions to review today" on the result screen.
13. **题库管理界面** — 让家长 / 老师在设置页导入、停用或删除 mod，并显示每个科目的题量、掌握度与最近错误率，而不是只能手改 `public/mods/index.json`。
    **Question-bank management UI** — let a parent or teacher import, disable or delete mods from a settings screen, with per-subject item counts, mastery and recent error rates, instead of hand-editing `public/mods/index.json`.
14. **地图迷雾与侦查** — 小地图与全图现在一开始就显示一切；改成只显示主角视野内或已探索过的区域，让「看清地图」本身成为要付出代价的目标。可见性判断放进 `atlas.js` 的两个画法即可同时生效。
    **Fog of war and scouting** — the minimap and atlas currently show everything from turn one; make them reveal only what the lord can see or has already explored, so mapping the world becomes a goal with a cost. One visibility test inside the two painters in `atlas.js` would cover both.
15. **全图交互增强** — 在全图上点据点查看信息或直接寻路过去、点敌军看兵力对比、把小地图上的行军路径也画出来。
    **Richer atlas interaction** — tap a settlement on the atlas for its details or to path straight there, tap a warband to compare armies, and draw the lord's current path on the minimap too.
16. **战场地形的连续化** — 现在地形是 40 px 的方格，边界生硬；下一步可以用噪声场把边界揉圆，并给森林 / 山地加上真正的掩体规则（站在树后只被一部分方向攻击）。
    **Continuous battlefield terrain** — the tiles are hard 40 px squares today; the next step is to round the borders with a noise field and to give forests and mountains real cover rules (only part of the incoming fire reaches a soldier behind a tree).

---

## 5. 验证记录 · Verification Log

All checks below were run against the current source on 2026-10-19; the project builds clean with `npm run build`.
以下检查均于 2026-10-19 针对当前源码执行；`npm run build` 构建通过。

### 5.1 无头逻辑校验 · Headless logic harness

| 项目 Check | 规模 Scale | 结论 Result |
| --- | --- | --- |
| 世界生成 | 40 个种子 | 地图尺寸、据点数量、部队数量、出生点可通行、强盗存在——全部通过。Dimensions, settlement/party counts, walkable spawn and bandit presence all pass. |
| 连通性 | 60 个种子 | 出生点可达的陆地占比最低 59.6%；0 个种子出现「少于 2 个可达据点」。Worst spawn-reachable land share 59.6%; 0 seeds with fewer than 2 reachable settlements. |
| 题库 | 3000 道题 | 题干非空、选项 ≥2 且互不重复、答案下标合法、数值题答案为数字——全部通过。Non-empty prompts, ≥2 unique options, valid answer index and numeric answers all pass. |
| 战斗 | 60 场 | 全部收敛到胜或负，幸存者均为存活单位。All fights resolve to win/lose with living survivors. |
| 点击寻路 | 3625 次 | 修复「尽力靠近」后，**0** 次空路径（修复前为 3.2%）。After the best-effort fix: **0** empty paths (3.2% before). |

### 5.2 状态机校验 · Pinia store harness

- 移动：从出生点走到最远城镇 65.4 格，路径 86 个节点，用时 24.3 秒，到达误差 < 0.6 格。
  Movement: walked 65.4 tiles to the farthest town along an 86-node path in 24.3 s, arriving within 0.6 tiles.
- 经济：加/扣金币、招募、升级、非法升级拒绝、战败后仍保有兵员——全部通过。
  Economy: add/spend gold, recruiting, upgrading, rejecting invalid upgrades and surviving a defeat all pass.
- 战败结算：全歼 → 0 兵（无凭空补兵）；24 场败仗均「队伍 = 战场幸存者」且敌方部队同步为它的幸存者；胜利移除敌方部队；无兵不触发遭遇战——全部通过。
  Defeat accounting: a wipe leaves 0 troops (no free refill); across 24 losses the warband always equals the on-field survivors and the enemy party is rewritten to its own survivors; a win removes the party; a troopless lord is never attacked.

### 5.3 浏览器走查 · Browser walkthrough

| 界面 Screen | 结论 Result |
| --- | --- |
| 首页 / 介绍 Home and guide | 渲染正常，输入名字后可开始 / 继续，首次介绍弹窗可滚动。Renders correctly, name entry starts or continues a game, and the first-run intro modal scrolls. |
| 世界地图 World map | canvas 非空白，点击后虚线路径出现、地形滚动、天数递增；图例可收起。Canvas is not blank; a tap draws a dashed path, the terrain scrolls and the day counter advances; the legend collapses. |
| 据点 Settlement | 四个页签、标题栏与金币/兵力图章正常。All four tabs, the header and the gold/troop chips work. |
| 考试 Exam | 四选一选项、答对/答错反馈、结果页金币结算均正常。Four-option questions, answer feedback and the coin result screen all work. |
| 战斗 Battle | 平原战场绘制正常，顶部双方兵力与「攻击 / 防守 / 跟随」三个命令按钮可用。The plains arena renders, the strength bar shows both sides and the three order buttons work. |
| 分享 Share | 弹窗渲染出可扫描的二维码、网址文本与复制/关闭按钮。The popup renders a scannable QR, the URL text and the copy/close buttons. |
| 角色面板 Lord panel | 点击 👤 角色详情 后弹出；领主名与驻扎地形、金币/军粮/战马、民兵 T1 ×8（含攻防血）、每日军饷支出、战绩四格全部显示；点「知道了」后关闭并回到地图。Opens from the 👤 chip; the name and terrain, gold/food/horses, militia T1 ×8 with atk/def/hp, the daily wage row and all four record stats render, and "知道了" closes it back to the map. |
| 手机断点 Phone breakpoint | 首页、分享弹窗、介绍弹窗、世界 HUD 与底部四按钮在手机规则生效时无重叠或溢出。Home, share popup, intro modal, world HUD and the four bottom buttons show no overlap or overflow with the phone rules active. |

浏览器走查全程无控制台报错；唯一未完成项是真实 375 px 手机视口走查（见「已知限制」第 8 条）。
The browser walkthrough produced no console errors; the only gap is a walkthrough on a real 375 px phone viewport (see known limitation 8).

批次 7 复测（真实 Chrome，headless + CDP，390×844）：世界 HUD 与扎营按钮布局正常；据点「升级」页签在批次 6 之后曾整块空白（`UpgradePanel.vue` 缺 `unitSprite` 导入导致渲染抛错），修复后升级 / 考试页签与另外两个页签一样正常渲染内容。
Batch 7 re-check (real Chrome, headless over CDP, 390x844): the world HUD and camp button lay out correctly, and the 升级 tab — which had gone blank after batch 6 because `UpgradePanel.vue` called an unimported `unitSprite` and threw during render — now renders content like the other three tabs.

### 5.4 像素素材校验 · Pixel asset checks

| 项目 Check | 结论 Result |
| --- | --- |
| 导出 Export | 18 张素材全部经桥接导出成功，均为 32×32、透明底（`bridge ok: pix-mcp-bridge / v1.2.3-stable`）。All 18 export through the bridge at 32x32 on a transparent background. |
| 边界 Bounds | 逐张核对不透明像素包围盒：除地形装饰外，素材四边都留有余量，且修复回绕缺陷后不再出现对侧游离像素列。Per-file bounding boxes checked: apart from the terrain tiles every sprite keeps its margin, and no stray pixels remain on the opposite edge after the row-wrap fix. |
| 视觉 Visual | 用 6 倍最近邻对照图复核三轮，修掉了兜帽遮脸、弓与箭尖出界、马匹糊成一团、披风过大；现在七个兵种在 32 px 下靠头盔 / 武器 / 坐骑 / 披风可区分。Reviewed as a 6x nearest-neighbour contact sheet over three passes, fixing hoods that hid the face, out-of-bounds bow and lance tips, a blob-like horse and an oversized cape; the seven types are now told apart at 32 px by helmet, weapon, mount and cape. |
| 浏览器世界地图 Browser, world map | 领主、势力军旗、城镇城堡（明显大于村庄茅屋）、村庄、森林树木、山峰、浪花、沙丘全部以像素画渲染，没有残留的彩色圆点或 emoji，控制台无报错。Lord, faction banners, the town castle (clearly larger than the village huts), villages and the forest / mountain / water / desert decorations all render as pixel art with no leftover colour discs or emoji, and the console stays clean. |
| 浏览器战场与据点 Browser, battle and settlement | 批次 7 已补上据点部分：四个页签（含升级列表的兵种图标）与角色面板的兵种图标均已在真实 Chrome 中确认；**战场仍未触发**（见「已知限制」第 9 条）。Batch 7 closed the settlement half — all four tabs (including the unit icons in the upgrade list) and the lord panel icons are confirmed in real Chrome; **the arena is still untriggered** (see known limitation 9). |

### 5.5 批次 6 无头校验 · Batch 6 headless harness

十一组检查（`node` 直跑 `src/game/*`，经一个临时的 `@/` 解析钩子把 `@/...` 与无扩展名相对导入映射到 `src/`）全部通过，输出结尾为 `ALL CHECKS PASSED`；该钩子脚本是批次验证时临时生成的，并不留在仓库里。
Eleven check groups (a plain `node` process importing `src/game/*` through a throwaway `@/` resolver hook that maps `@/...` and extensionless relative imports into `src/`) all pass, ending in `ALL CHECKS PASSED`; the hook was generated for this verification pass and is not kept in the repo.

| 项目 Check | 规模 Scale | 结论 Result |
| --- | --- | --- |
| 兵种表 Unit table | 3 家族 × 4 档 | 攻 / 防 / 血 / 兵价逐档递增，日薪不下降。Attack, defence, HP and price rise with every rank and wages never fall. |
| 克制循环 Counter cycle | 6 条边 | 对角线 +40%、反向 −25%、民兵 ×1。The diagonal is +40%, the reverse −25% and militia is neutral. |
| 升级经济学 Economics | 3 家族 | 逐级爬到精英总价（78 / 89 / 119）均低于直接买精英（141 / 160 / 216）；精英无后续升级。Climbing to the elite (78 / 89 / 119) always undercuts buying it (141 / 160 / 216), and the elite has no further edge. |
| 队形几何 Formation geometry | 6 队形 × 2 密度 × 8 编制 | 槽位数与人数一致、结构队形在 y 轴严格居中、楔形随朝向镜像、随机散布不出界。Slot counts match, structured layouts are exactly centred in y, the wedge mirrors with the facing and the scatter stays in bounds. |
| 旧存档迁移 Migration | 8 条旧记录 | 合并为 6 组、12 名士兵；`infantry`→长枪兵 T2、`veteran`→T4、`marksman`→弓箭手 T4、`knight`→骑兵 T4；未知兵种被丢弃。Merged into 6 groups and 12 soldiers with infantry/veteran/marksman/knight mapped to the matching family and rank; unknown types are dropped. |
| 城镇兵源 Town stock | 400 个城镇 | 每个城镇 5 行且不重复、必卖民兵、售价 ≥ 招募价；13 / 13 个「家族 + 档位」组合都能滚到。Five unique rows per town, militia always stocked, prices at or above the recruit price, and all 13 family-and-rank combos reachable. |
| 世界部队 World parties | 30 个种子 | 每支部队的兵种都是已知家族、档位在 1–4、人数为正。Every party unit is a known family at rank 1–4 with a positive count. |
| 对战矩阵 Duel matrix | 9 组双方 × 8v8（40 局）/ 16v16（20 局） | 克制对角线 100%（长枪兵胜骑兵、骑兵胜弓箭手、弓箭手胜长枪兵），反向全部 0%，民兵对三个家族全部 0%，540 场对局无平局。The counter diagonal is 100% (spearman beats cavalry, cavalry beats archer, archer beats spearman), every reverse matchup 0%, militia 0% against all three families, and no draw in 540 fights. |
| 混编战斗 Mixed battle | 6 种队形 | 全部在 14–15 秒内以胜利收场，小队存活数与战场实际存活数一致。All six resolve to a win in 14–15 s with the squad readout matching the soldiers actually left. |
| 命令端到端 Orders | 防守 + 移动 | 防守小队 5/5 守在目标点，移动小队 6/6 到达目标点。The defending squad holds its rally point 5/5 and the moving squad arrives 6/6. |
| 远程风筝 Kiting | 3 档弓箭手 vs 1 档长枪兵 | 攻击命令下最近接战距离 89 px，防守命令下 26 px；6 名弓箭手 vs 6 名长枪兵仍在 13.4 秒内正常分出胜负。Under attack the closest approach is 89 px versus 26 px under defend, and a 6v6 archer/spearman fight still resolves in 13.4 s. |

### 5.6 批次 7 浏览器校验 · Batch 7 browser harness

用一个临时脚本直接驱动本机 Chrome（headless + CDP over WebSocket，零依赖，通过 `document.querySelector('#app').__vue_app__` + 动态 `import()` 拿到 Pinia store），既做逐帧逻辑校验，也在 390×844 手机视口下发真实点击、读真实 DOM 与截图；脚本与截图都在系统临时目录，不进仓库。
A throwaway script drove the local Chrome build directly (headless over CDP on a WebSocket, no dependencies, reaching the Pinia store through `document.querySelector('#app').__vue_app__` plus dynamic `import()`); it ran frame-by-frame logic checks *and* real clicks at a 390x844 phone viewport, reading the real DOM and taking screenshots. Both the script and the shots live in the system temp directory, not the repo.

| 项目 Check | 规模 Scale | 结论 Result |
| --- | --- | --- |
| 站着不动 Idle | 400 帧（20 秒） | 天数不变（1 → 1）、`timeFlowing` 为假、敌军位移恰好 0。Day unchanged (1 → 1), `timeFlowing` false and party displacement exactly 0. |
| 扎营 Camping | 600 帧（30 秒） | 天数 1 → 2、`timeFlowing` 为真、主角位移 0、敌军移动 14.3 格。Day 1 → 2, `timeFlowing` true, lord displacement 0 and a party covering 14.3 tiles. |
| 拔营 Break camp | 400 帧（20 秒） | 天数不变（2 → 2）、`timeFlowing` 为假。Day unchanged (2 → 2) and `timeFlowing` false. |
| 行军 Marching | 600 帧（30 秒，每帧重新下令） | 600 / 600 帧都在流逝、天数 2 → 3、主角走过 24.4 格、扎营状态被自动清除。600 of 600 ticks flowing, day 2 → 3, the lord covering 24.4 tiles and camp auto-cleared. |
| 走出营地 Walking out | 1 次移动指令 | 扎营立刻结束、路径 19 格。Camp ends immediately and a 19-node path is built. |
| 按钮与提示 Camp UI | 3 次点击 | 「⛺ 扎营」→「🔥 拔营」且天数芯片转绿并显示「🔥 扎营」；再点回「⛺ 扎营」芯片转回「⏸ 停滞」；点地图后扎营自动结束。Pitching camp flips the button to 「🔥 拔营」 and turns the day chip green with 「🔥 扎营」, the second click returns it to 「⏸ 停滞」, and a map tap ends camp by itself. |
| 据点页签 Settlement tabs | 4 个页签 | 修复后四者都渲染出首个子元素与非空文本；修复前 升级 / 市场 / 考试 三个页签的内容区为空节点，控制台报 `[Vue warn] Unhandled error during execution of render function`（`UpgradePanel`）。After the fix all four render a child element and non-empty text; before it, 升级 / 市场 / 考试 had an empty content area with `[Vue warn] Unhandled error during execution of render function` (`UpgradePanel`) in the console. |
| 素材回流 Sprite refresh | 1 张 | `terrain/camp.png` 经桥接导出为 32×32（382 个不透明像素），`index.json` 列出 18 张。`terrain/camp.png` exported through the bridge at 32x32 (382 opaque pixels) and `index.json` lists 18 files. |
| 介绍页与角色面板 Guide and lord panel | 2 屏 | 介绍页出现「时间是走出来的」与扎营操作条目；角色面板头部显示「第 1 天 · 位于平原」与「⏸ 时间停滞」；整轮走查 0 条控制台报错 / 警告。The guide shows the "time is walked out" rule and the camping control, the lord panel header reads 第 1 天 · 位于平原 with ⏸ 时间停滞, and the whole run logged zero console errors or warnings. |

### 5.7 批次 8 题库校验 · Batch 8 question-bank harness

题库与调度用一次性无头脚本验证（esbuild 打包 + `@/` 别名，脚本留在系统临时目录），随后用真实 Chrome 走查考试界面。
The bank and the scheduler were checked with a throwaway headless script (esbuild bundle with the `@/` alias, kept in the system temp directory), then the exam UI was walked through in real Chrome.

| 项目 Check | 规模 Scale | 结论 Result |
| --- | --- | --- |
| 题库规模 Bank size | 5 个科目 | 百科 64 条（三 / 四年级各 32）、示例 Mod 12 条，题干 / 选项 / 答案 / `id` 全部合法。64 encyclopedia items (32 per grade) and 12 example-mod items all pass the prompt / option / answer / id checks. |
| 选项数量 Options | 全题库抽样 | 最少 3 个、最多 4 个互不重复的选项；修复前部分语文题会生成 5–6 个。At least three and at most four distinct options per question; before the fix some Chinese questions produced 5–6. |
| 记忆权重 Weight | 0–5 级 | 权重依次为 1.00 / 0.55 / 0.30 / 0.17 / 0.09 / 0.05，熟练题与新题的抽中比 20.1×（理论 20×）。Weights run 1.00 / 0.55 / 0.30 / 0.17 / 0.09 / 0.05, giving a mastered-to-new draw ratio of 20.1x against the theoretical 20x. |
| 加权出卷 Weighted paper | 多个种子 | 同一模板刷到 5 级后，抽样卷面中的占比降到 0.0%，题干在单张卷内不重复。After driving one template to level 5 its share of sampled papers fell to 0.0%, and no prompt repeats inside a paper. |
| 多科目组卷 Multi-subject paper | 多个种子 | 每张 12 题且题干唯一，所选科目混合出现。Every paper holds 12 unique prompts mixed across the chosen subjects. |
| 构建 Build | — | `npm run build` 通过，`dist/mods/` 含 `index.json` 与 `safety.json`。`npm run build` passes and `dist/mods/` contains `index.json` plus `safety.json`. |

真实 Chrome（headless + CDP，预览端口 4180）走查结果：
The real-Chrome walkthrough (headless over CDP against the preview server on 4180):

| 项目 Check | 结论 Result |
| --- | --- |
| 科目按钮 Subjects | 6 个：英文 / 语文 / 数学 / 逻辑推理 / 百科知识 / 安全常识，全部来自注册表。Six buttons — English / Chinese / math / logic / encyclopedia / safety — all read from the registry. |
| 百科题 Encyclopedia question | 一道百科题渲染出 4 个选项；作答后 store 写入 `encyclopedia:g3-fish-breathe`，`level` 与 `right` 同步递增。An encyclopedia question rendered four options, and answering wrote `encyclopedia:g3-fish-breathe` into the store with `level` and `right` both incremented. |
| 解析 Explanation | 答错后显示该题的 `explain` 文本。A wrong answer revealed the item's `explain` text. |
| 介绍页 Guide | 记忆曲线与题库扩展两张卡片存在，科目标签按注册表动态渲染。Both the memory-curve and mod cards are present, and the subject tags render from the registry. |
| 控制台 Console | 整轮 0 条报错或警告。Zero errors or warnings across the run. |

### 5.8 批次 9 小地图与全图校验 · Batch 9 minimap and atlas harness

沿用批次 7 的现场取数方式（headless Chrome + CDP，零依赖脚本，经 `#app.__vue_app__` 拿 Pinia store 并动态 `import()` 源码模块），在 390 × 844 手机视口下先注入 `fillText` 钩子逐帧记录画布文字，再打真实 DOM 与像素读回；脚本与截图都留在系统临时目录。**37 项检查全部通过**，`ALL CHECKS PASSED`。
The batch-7 approach again (headless Chrome over CDP, a dependency-free script reaching the Pinia store through `#app.__vue_app__` plus dynamic `import()` of the source modules), driven at a 390x844 phone viewport: a `fillText` hook was installed first to log every canvas text draw, then the real DOM and the canvas pixels were read back. The script and the screenshots stay in the system temp directory. **All 37 checks passed**, ending in `ALL CHECKS PASSED`.

| 项目 Check | 规模 Scale | 结论 Result |
| --- | --- | --- |
| 小地图 Minimap | 390 × 844 视口 | canvas 为 102 × 82 CSS px、比例恰好 1.25（世界 80 × 64）；地形占全画面 47%，4 座城镇的金色方块、主角蓝点（86 px）与视野白框（718 px）全部存在。The canvas measures 102x82 CSS px at exactly 1.25 (the 80x64 world); terrain covers 47% of it, and the four town squares, the lord's blue dot (86 px) and the camera rectangle (718 px) are all present. |
| 图例 Legend | 6 行 | 素材依次为 lord / commander ×3 / town / village，色块与 `factions.js` 逐通道相等；强盗色块 `#9aa2ab` 的三通道极差 17，属低饱和灰。Six rows with the sprites lord / three commanders / town / village, every swatch equal to `factions.js` channel by channel; the bandit swatch `#9aa2ab` has a 17-channel spread, a low-saturation grey. |
| 将领素材 Commander art | 3 张 | 强盗 549 个不透明像素中 83% 为低饱和灰、狼 600 px 含 80+ 紫色、鹰 706 px 含 60+ 琥珀；大地图上三种颜色都能采到（灰 470 / 紫 800 / 琥珀 8877），旧的 `/pixel/banner/bandit.png` 已 404、目录删除。Of the bandit's 549 opaque pixels 83% are low-saturation grey, the wolf (600 px) shows 80+ purple ones and the eagle (706 px) 60+ amber ones; all three colours appear on the big map (grey 470 / purple 800 / amber 8877), and the old `/pixel/banner/bandit.png` now 404s with the folder deleted. |
| 兵力角标 Troop badges | 2 处 | 逐帧记录 `fillText`（本轮 668 次）：主角的 128 与敌将的 11 都落在各自图标右上角 ±3.5 px 内；详细地图上主角角标同样命中。Frame-by-frame `fillText` logging (668 draws this run): the lord's 128 and a commander's 11 both land within ±3.5 px of their icon's top-right corner, and the lord's badge hits on the atlas too. |
| 详细地图 Atlas | 346 × 624 视口 | 点击小地图后浮层出现；据点素材（4290 px 石色）、两个据点名（晨曦城 / 石泉村）、灰 / 紫 / 琥珀三种将领色（612 / 362 / 2171 px）与主角角标全部命中。Tapping the minimap opened the overlay, and the settlement sprites (4290 stone px), two settlement names, all three commander colours (612 / 362 / 2171 px) and the lord's badge were all found. |
| 拖动平移 Drag | 2 次真实指针拖动 | 左拖后采样像素和改变（905769 → 1026236）；向东南拖 900 px 后四角仍是地形（水 61,120,168 / 草地），说明 `clampPan()` 生效、拖不出世界留白。The sampled pixel sum changed after a left drag (905769 → 1026236), and after dragging 900 px south-east all four corners still show terrain (water 61,120,168 / grass), proving `clampPan()` keeps the world covering the viewport. |
| 关闭 Close | 3 条路径 | Esc 关、✕ 关，关闭后世界地图 canvas 仍在。Escape closes it, the ✕ closes it, and the world-map canvas is still mounted afterwards. |
| 控制台 Console | 整轮 | 0 条报错或警告。Zero errors or warnings across the run. |

---

### 5.9 批次 9 升级修复校验 · Batch 9 promotion fix harness

同一套 headless Chrome + CDP 现场取数（390 × 844）：先把队伍设成 4 名民兵、金币 400，再进入城镇的「升级」页签，**真实点击**按钮后逐项读回 DOM 与 store。**18 项检查全部通过**，`ALL CHECKS PASSED`。
The same headless Chrome over CDP approach (390x844): the warband was first set to four militia with 400 gold, then the town's 升级 tab was opened and the buttons were **really clicked**, reading the DOM and the store back item by item. **All 18 checks passed**, ending in `ALL CHECKS PASSED`.

| 项目 Check | 规模 Scale | 结论 Result |
| --- | --- | --- |
| 分支列表 Branches | 4 名民兵 | 三条分支为「初级长枪兵 / 初级弓箭手 / 初级骑兵」，价格 13 / 15 / 24 各不相同（不再共用 8 金币保底价），三个数量步进器各自独立，控制台无重复 key 警告。Three branches named 初级长枪兵 / 初级弓箭手 / 初级骑兵 priced 13 / 15 / 24 (no longer sharing the 8-gold floor), each with its own stepper, and no duplicate-key warning. |
| 点击升级 Click | 点第 2 行「初级弓箭手」 | store 变为 `militia ×3 + archer ×1` 且 `type` 全为合法字符串，金币 400 → 385（15 / 名），兵种块显示「初级弓箭手 · 初级」并使用 `/pixel/unit/archer.png`，没有误入长枪兵。The store became `militia x3 + archer x1` with every `type` a real string, gold went 400 -> 385 (15 each), and the block reads 初级弓箭手 / 初级 with the `/pixel/unit/archer.png` sprite — no accidental spearman. |
| 同级内升档 Rank-up | 2 名初级弓箭手 | 一次升档保留家族：store 变为 `archer ×1 初级 + archer ×1 中级`，金币 400 → 378（22 / 名，步进器默认 1 名），两块仍用弓箭手素材（1–2 档共用一张，靠档位标签与战场血点区分）。One rank-up keeps the family: the store became `archer x1 rank 1 + archer x1 rank 2`, gold 400 -> 378 (22 each, the stepper defaults to one soldier), and both blocks keep the archer sprite (ranks 1-2 share one sheet, told apart by the tier chip and the arena pips). |
| 精英无后继 Elite dead end | 2 名精英骑兵 | 「精英骑兵」的升级列表为 0 条边，不提供无效升级。The 精英骑兵 listing has 0 edges, so no invalid promotion is offered. |
| 控制台 Console | 整轮 | 0 条报错或警告。Zero errors or warnings across the run. |

### 5.10 升级路径自检脚本 · Upgrade self-check scripts

上面的 5.9 是一次性走查；本轮把这套校验固化成 `tools/` 下三支零依赖脚本（用 Vite 自带的 esbuild 打包 Vue 源码，`node` 直接跑），可以随时复跑，也能在改动升级树后立刻回归。
Section 5.9 was a one-off walkthrough; this round froze that kind of check into three dependency-free scripts under `tools/` (they bundle the Vue sources with the esbuild that ships with Vite, so plain `node` runs them), ready to be re-run and to guard the upgrade tree after every change.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-upgrade.mjs` | **99 项检查全部通过**：每条升级边的 `type` / `tier` / 价格、民兵 → 三个家族、家族内逐档升级、精英无后继、非法边被拒、钱不够不动兵、升满整组后源条目被清掉，以及界面那条「把边的 `type` / `tier` 原样喂回 store」的路径（这正是旧缺陷发作的地方）。**All 99 checks passed**: every edge's `type` / `tier` / price, militia into the three families, the rank-by-rank climb, the elite dead end, illegal edges refused, a broke lord keeping his soldiers, the emptied source group being dropped, and the panel path that feeds an edge's `type` / `tier` back into the store — exactly where the old defect lived. |
| `node tools/verify-upgrade-head.mjs` | 同一套用例跑在修复前的源码（`291eddaa81d`）上：**32 项失败**，症状与玩家报告完全一致——升级后写入的是一个 `type` 为空的兵员（界面回退显示成民兵），只扣 8 金币保底价（长枪兵 13 / 弓箭手 15 / 骑兵 24 全部变成 8）。The same suite against the pre-fix sources (`291eddaa81d`): **32 checks fail**, with the player's exact symptom — the upgrade writes a soldier with an empty `type` (the panel falls back to militia) and charges only the 8-gold floor (13 / 15 / 24 all became 8). |
| `node tools/verify-upgrade-browser.mjs` | 真实 Chrome（headless + CDP，1200 × 900）：预置「主角站在村庄旁」的存档 → 读档 → 进村 → 打开「升级」页签 → **真的点击**「升级」按钮 → 读回 DOM 与金币。修复后 **14 项全部通过**（民兵 8 → 5，新增「初级长枪兵 ×3」，金币 500 → 461 再 → 439；控制台 0 报错）。跑在修复前的构建上则复现故障：升级后列表里仍是两块「民兵」（×5 与 ×3），金币只从 500 掉到 476。Real Chrome (headless over CDP at 1200x900): a seeded save with the lord next to a village, resume, enter the village, open the 升级 tab, **really click** 升级, then read the DOM and the treasury back. After the fix **all 14 checks pass** (militia 8 -> 5, a new 初级长枪兵 x3, gold 500 -> 461 -> 439, no console errors); against the pre-fix build the failure returns — the list still shows two 民兵 blocks (x5 and x3) and gold only drops from 500 to 476. |

### 5.11 批次 10 据点玩法校验 · Batch 10 settlement harness

本轮新增两支自检脚本：无头的 `tools/verify-settlements.mjs` 与真实 Chrome 的 `tools/verify-settlements-browser.mjs`，把归属、围城、伤兵与城镇经济四块新玩法都纳入回归。
This round added two more self-check scripts — the headless `tools/verify-settlements.mjs` and the real-Chrome `tools/verify-settlements-browser.mjs` — so ownership, sieges, wounds and the town economy are all part of the regression net.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-settlements.mjs` | **87 项检查全部通过**：30 个随机世界里没有一座城镇被强盗占据、每个据点都有驻军且驻军带生命值；`{ type, tier, count, hp }` 的形状与旧档迁移（`infantry` → 二级长枪兵且满血、生命值被夹在上限内）；恢复速率的行军 < 城镇 < 自有城镇 < 医院四级关系；战败存活判定（`rng` 恒 0 时全部救回且血量为 1，恒 1 时全部阵亡）；围城（需要 2 天、准备期间时钟运行、驻军增长、派出援军、准备完成后可攻打、攻下即易主）；强盗村庄不可进入但可攻打、打下来变成无主；城镇经济（考试只给发展不给城镇钱、注入资金把 100 金币搬进金库、发展高则繁荣涨 / 低则跌、阈值升级、投入发展扣 60 加 6、建医院与军营按价扣款、军营给全军 +6%）；以及等级越高兵源越好（60 组样本的均值比较）。**All 87 checks passed**: no bandit town in 30 random worlds, every settlement fields a garrison with hit points, the `{ type, tier, count, hp }` shape and its migration, the marching < settlement < own town < hospital recovery ladder, the survival roll (a fixed 0 saves everyone at 1 HP, a fixed 1 loses everyone), the siege (two days, the clock running, a growing garrison, a relief warband, the capture), the bandit village, the town economy (the exam only lifts the development, the injection fills the treasury, development → prosperity → level, the investment, the facilities, the barracks bonus) and the richer recruit list of a higher town. |
| `node tools/verify-settlements-browser.mjs` | 真实 Chrome（headless + CDP，1200 × 900）：四份存档分别把主角放在强盗村庄旁、王国城镇旁、自有城镇旁与无主城镇旁。**37 项检查全部通过**：强盗村庄只出现「⚔️ 赶走强盗」而没有「进入」，地图上该据点画着强盗灰色的归属光环（像素取样验证），角色面板报出 2 名伤兵，打败驻军后战斗以 `bandits` 类型结算；王国城镇可以「进入」也可以「🏰 准备围城」，点击后围城开始且还需 2 天，把日期推到准备完成日后按钮变成「⚔️ 攻打」，点开后战斗以 `siege` 类型结算且敌方正是驻军；自有城镇底部只有「进入」，没有「占领」「围城」「攻打」按钮；标题栏左上角显示「Lv.2 小镇」、右侧显示归属，新增的「🏛️ 城镇」页签给出繁荣度、资金与两种设施，真实点击「建造」后资金从 500 降到 380 且医院升到 1 级，点击「投入」后发展 +6、资金再减 60，点击「注入资金」后城镇金库 +100 而主角钱袋 −100；在自己城镇里真的考完一张卷子后，主角钱袋增加而城镇金库分文未动；无主城镇出现「🚩 占领」，点击后归属变成 player 且从 1 级 25 繁荣度重新开始；控制台 0 报错。Real Chrome (headless over CDP at 1200x900): four saves place the lord next to a bandit village, a kingdom town, a town he owns and an unclaimed town. **All 37 checks passed**: the bandit village offers 「⚔️ 赶走强盗」 and no 「进入」, the map draws the grey ownership ring (verified by sampling a canvas pixel), the lord panel reports two wounded, the fight settles as `bandits`; the kingdom town can be entered and also offers 「🏰 准备围城」, the siege needs two days and then turns into 「⚔️ 攻打」, which settles as `siege` against the garrison; the lord's own town offers only 「进入」 — no claim, no siege and no storm button — and shows 「Lv.2 小镇」 in the top-left corner with its owner on the right, the new 「🏛️ 城镇」 tab shows prosperity, funds and both facilities, a real click on 建造 takes the funds from 500 to 380 and raises the hospital to level 1, and 投入 adds 6 development for 60 funds while 「注入资金」 moves 100 gold into the treasury and out of the purse; a real paper in his own town pays the lord and leaves the treasury untouched; the unclaimed town offers 「🚩 占领」, and clicking it hands the town over at level 1 and 25 prosperity; the console stays clean. |

---

### 5.12 批次 11 语文题库校验 · Batch 11 Chinese bank harness

新增两支脚本守住语文题库：一支无头地检查题型契约与题库规模，一支在真实 Chrome 里真的考一张语文卷并把题干读回来。
Two new scripts guard the Chinese bank: a headless one checks the type contract and the size of every bank, a real-Chrome one takes a Chinese paper and reads the prompts back.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-chinese.mjs` | **32 项检查全部通过**：15 种题型（含 `comprehension` 与 6 种古诗题）全部存在；年级内题型名唯一（它们是记忆曲线的 key）且两个年级共享题型；1040 次采样生成的每一道题都合法（2–4 个选项、选项不重复、答案在选项中、`kind` 与 `grade` 正确）；古诗题都带解析；阅读理解题都带着短文全文，短文长度 60–400 字之间（适合手机）；每个题型的题库至少 4 条（否则一份卷子会重复出题）；语文科目在注册表里正常注册，收敛出的条目各有自己的记忆 key 且都能生成题目。**All 32 checks passed**: all 15 types exist (reading comprehension plus six poem types), the type names are unique per grade and shared across the two grades, all 1040 sampled questions are well formed (2–4 unique options, the answer among them, the right kind and grade), the poem questions carry an explanation, the reading questions carry their passage (60–400 characters, phone friendly), every generator has a bank of at least four items, and the Chinese subject registers with one memory key per entry. |
| `node tools/verify-chinese-browser.mjs` | 真实 Chrome（headless + CDP，1200 × 900）：预置「主角站在自己城镇旁」的存档 → 进镇 → 「考试」页签 → 只选「语文」+ 12 题 → **真的答完整张卷子**并把题干逐题读回。**6 项检查全部通过**：卷子里有**阅读理解短文**与**古诗题**；同一份卷子里没有重复题目；短文在题目框里保持换行（`white-space: pre-wrap`）；控制台 0 报错。Real Chrome (headless over CDP at 1200x900): a seeded save with the lord next to his own town, into the town, the 考试 tab, only 语文 and 12 questions, then **a real paper answered to the end** with every prompt read back. **All 6 checks passed**: the paper carries a **reading passage** and an **ancient-poem question**, no question repeats inside the paper, the passage keeps its line breaks (`white-space: pre-wrap`) and the console stays clean. |

---

### 5.13 批次 12 难度 / 速度 / 地形 / 围城校验 · Batch 12 difficulty, speed, terrain and siege harness

新增两支脚本守住本轮四块改动：无头的 `tools/verify-battle.mjs` 与真实 Chrome 的 `tools/verify-battle-browser.mjs`。
Two new scripts guard this round's four changes: the headless `tools/verify-battle.mjs` and the real-Chrome `tools/verify-battle-browser.mjs`.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-battle.mjs` | **64 项检查全部通过**：难度（新局默认简单、三档金币 20/19/18 与 26/25/24、逻辑加成照常、奖励不低于 1、未知难度回退简单、存档往返保留难度、旧存档按简单）；战斗速度（默认慢速、三档倍率递增、同样时间慢速推进更少）；战场地形（五种地形都会生成、每格都是已知地形、湖泊不可通行而其余可走、森林加防御、沙地减攻击、河流减速、山地加攻击、战场比旧的 900 × 560 大、森林里的士兵比平原慢、河流更慢、森林里的挨打伤害低于平原、湖心不可走而湖岸可走）；**12 场战斗全部能分出胜负**（地形不会把战斗卡死）；围城（能准备、需要 2 天、准备期间时钟走、可中断、中断后时钟停、可重新准备、准备完成后也能中断、**攻打失败后围城作废要重新准备**、打赢即占领）。**All 64 checks passed**: the difficulty (a new game starts easy, the three levels pay 20/19/18 and 26/25/24, the logic bonus survives, a reward never drops below one, an unknown key falls back to easy, the save keeps the difficulty and an old save is easy); the battle speed (slow by default, the three multipliers rise, the slow speed advances less in the same time); the battlefield terrain (all five kinds are generated, every cell is a known terrain, the lake is impassable while the rest is walkable, the forest adds defence, the desert costs attack, the river slows, the mountain adds attack, the field is bigger than the old 900 × 560, a soldier in the forest is slower than on the plain and slower still in the river, the forest takes less damage than open ground, the middle of the lake cannot be walked on while the shore can); **twelve battles all resolve** (the terrain cannot stall a fight); and the sieges (they can be prepared, they need two days, the clock runs, they can be called off, the clock stops afterwards, they can be prepared again, a ready one can be called off too, **a failed assault voids the siege and it must be prepared again**, and a won assault takes the town). |
| `node tools/verify-battle-browser.mjs` | 真实 Chrome（headless + CDP，1200 × 900）：**22 项检查全部通过**：首页的难度选择器有三个按钮且能选中「困难」；世界地图顶部有 🎚 芯片，点击弹出难度面板，选「普通」后 store 变成 `normal`；王国城镇可以「🏰 准备围城」，准备中底部出现「🚫 取消围城」，点它之后围城消失、时钟停止、按钮回到「准备围城」；战斗界面默认慢速，⚙ 面板里有三档速度与五行地形说明，战场 canvas 有多种颜色（地形确实画出来了），镜头缩放在 0.5–2 之间，拖动会移动镜头并停止自动跟随，🎯 会重新跟随；控制台 0 报错。Real Chrome (headless over CDP at 1200x900): **all 22 checks passed** — the home screen offers three difficulties and 「困难」 can be picked; the world map carries a 🎚 chip that opens the difficulty sheet and picking 「普通」 changes the store; a kingdom town offers 「🏰 准备围城」 and the bottom bar then shows 「🚫 取消围城」, and tapping it clears the siege, stops the clock and brings the 「准备围城」 button back; the battle starts slow, the ⚙ panel holds the three speeds and the five terrain rows, the arena canvas carries many colours (the terrain really is painted), the camera zoom sits between 0.5 and 2, a drag moves the camera and stops the follow, and 🎯 resumes it; the console stays clean. |

### 5.14 批次 16 版本号与练兵校验 · Batch 16 version and training harness

新增一支无头脚本守住本轮两块新功能：版本号展示与练兵训练场。
A new headless script guards this round's two new features: the version display and the training drill.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-training.mjs` | **61 项检查全部通过**：版本号（三个数字、从 v0.0.1 起、只更新修订号、0.0.9 → 0.0.10、最新条目就是当前版本、每条都有日期与更新内容、更新内容提到版本号与练兵、**更新内容与 `progress.md` 里玩家看得见的批次一一对应**、**更新内容里没有任何开发细节**（没有文件名、脚本名与「校验」字样）、版本内容放在**独立文件夹**里）；练兵场（store 认得出这是训练、战斗被标记为训练、上下文类型是 `training`、场上有八个木桩、**没有真正的敌人**、主角带自己的士兵、木桩站在场地另一侧并守住位置、**训练永远不会结束**、**士兵不会受伤**、**木桩真的挨打**、**木桩打倒后自己立起来并恢复满血**）；练兵对战役零影响（队伍 / 钱袋 / 军粮 / 战绩都不变，强行结算也不变）；普通战斗仍然会分出胜负；界面上确实有版本号、更新内容、练兵按钮（只在扎营时出现）与「结束练兵」按钮。**All 61 checks passed**: the version (three numbers, it starts at v0.0.1, only the patch moves, 0.0.9 rolls over to 0.0.10, the newest entry is the current version, every entry has a date and its notes, and the notes mention the version and the drill, **the notes match the player-facing batches of the progress file**, **the notes carry no development details** and they live in a folder of their own); the drill ground (the store knows it is a training session, the battle is flagged as one, the context kind is `training`, the eight dummies stand on the field, **there is no real enemy**, the lord brings his own soldiers, the dummies stand on the far side and hold their post, **the session never ends**, **nobody is hurt**, **the dummies really take the blows** and **they stand back up whole**); that a drill changes nothing in the campaign (warband / purse / food / record, even under a forced settlement); that a plain battle still ends; and that the interface really carries the version, the update notes, the drill button (only while camped) and the end-of-drill button. |

---


### 5.15 批次 17 快速战斗校验 · Batch 17 quick battle harness

新增两支脚本守住快速战斗模拟器与更新对话框。
Two new scripts guard the quick battle simulator and the update dialog.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-quick-battle.mjs` | **57 项检查全部通过**：六种战场预设（混战 / 平原 / 密林 / 山地 / 大河 / 湖泽）各自生成正确的地形、湖泽的深水不可通行；四个兵种的**数量可以任意设置**（清零、加满、按规模缩放时配比不变）、每名士兵都带满血；四个己方整队与三个敌方势力的配比都对；两支队伍的规模与要求一致；`battle.startQuick()` 用选好的两支队伍与选好的战场开战，**战斗真的会分出胜负并结算**，而**战役数据（队伍 / 钱袋 / 战绩）纹丝不动**；五场模拟的胜 / 负 / 平相加等于场次、胜率与胜场一致；模拟足够快。**All 57 checks passed**: the six battlefield presets lay out the right ground and the deep water of the lake map is impassable; **the count of every kind can be set freely** (cleared, filled, scaled with the mix kept) and every soldier starts healthy; the four friendly bands and the three enemy mixes are right; the two armies add up to the asked size; `battle.startQuick()` opens the fight with the chosen armies on the chosen field, **the fight really ends and settles**, and **the campaign data (warband, purse, record) does not move**; the wins, losses and draws of five rounds add up and the win rate follows the wins; and the simulation is quick. |
| `node tools/verify-quick-battle-browser.mjs` | 真实 Chrome（headless + CDP，1200 × 900）：**19 项检查全部通过**：首页的「⚡ 快速战斗」与「开始新的征程」「继续上次进度」**同级**；点版本徽章弹出**更新对话框**（写着 v0.0.1、列出批次、**没有任何开发细节**）、点 ✕ 关闭；快速战斗页有六种战场、七个敌我选项、四个规模与三档场次，选项可以改；模拟跑出胜率、20 场明细与四项平均数据；控制台 0 报错。Real Chrome (headless over CDP at 1200x900): **all 19 checks passed** — the 「⚡ 快速战斗」 entry sits **on the same level** as the start and continue buttons; tapping the version badge opens the **update dialog** (the version, the batches and **no development details**) and ✕ closes it; the quick battle screen offers six battlefields, seven side choices, four army sizes and three round counts, and the picks can be changed; the simulation reports the win rate, 20 rounds and four averages; the console stays clean. |

---

| 日期 Date | 内容 Change |
| --- | --- |
| 2026-10-21 | 批次 16：新增**版本号与更新内容**（`src/game/versions/`：`VERSION` 从 **v0.0.1** 起、只更新修订号、`CHANGELOG` 记每个版本的更新内容；首页标题下显示「版本 v0.0.1」徽章，底部徽章**点击后用对话框**展示更新内容，内容整理自 `progress.md` 的「已完成功能」一节并由 `tools/build-versions.mjs` 生成；该节每条内容以 **▶（玩家功能）** 或 **🔧（技术细节）** 开头，**对话框只显示玩家功能**，不出现文件名与脚本名）；新增**扎营练兵**（扎营时底部出现「🎯 练兵」，进入只有自己士兵与八个训练木桩的战场，没有敌人、不会结束、不会死人，木桩打倒后两秒自己立起，队伍 / 金币 / 军粮 / 战绩都不受影响；战斗界面新增「🏕 结束练兵」按钮）；新增 `tools/verify-training.mjs`（58 项无头检查）与 `tools/verify-training-browser.mjs`（25 项真实 Chrome 检查）。Batch 16: added the **version display and the update notes** (`src/game/versions/`: `VERSION` starts at **v0.0.1** and only the patch moves, `CHANGELOG` holds the notes of every release; the home screen shows a 「版本 v0.0.1」 badge under the title and a badge at the bottom **opens a dialog** with the notes, which are organised from the 「已完成功能」 section of `progress.md` and generated by `tools/build-versions.mjs`) and the **training drill** (a 「🎯 练兵」 button while camped opens a field with the lord's own soldiers and eight wooden dummies — no enemy, no end, no losses; the dummies stand back up two seconds after they are knocked down and the warband, purse, food and record stay untouched; the battle screen gained a 「🏕 结束练兵」 button); added `tools/verify-training.mjs` (58 headless checks) and `tools/verify-training-browser.mjs` (25 real-Chrome checks). |
| 2026-10-21 | 批次 17：新增**快速战斗模拟器** —— 首页「⚡ 快速战斗」入口进入 `QuickBattleView.vue`；`src/game/arena.js` 新增 `ARENA_MAPS` 六种战场预设（混战 / 平原 / 密林 / 山地 / 大河 / 湖泽）并让 `generateArenaTerrain()` / `createBattle()` 接受战场预设；`src/game/quickBattle.js` 复用真实战斗的 `createBattle()` 与 `stepBattle()`，可选己方兵种（民兵 / 长枪兵 / 弓箭手 / 骑兵）、敌方势力（强盗 / 苍狼 / 赤鹰）、士兵规模（8×8 / 16×16 / 32×32 / 64×64）与场次（5 / 20 / 50），每个兵种的数量可用加减键**任意设置**；点「⚡ 进入战场」**真的站上战场**打一场（战役数据不受影响），另有点「📊 先看看胜率」的即时模拟；跑出胜率、平均阵亡与每场明细；「⚡ 快速战斗」入口与首页的「开始新的征程」「继续上次进度」**同级**；新增 `tools/verify-quick-battle.mjs`（57 项无头检查）与 `tools/verify-quick-battle-browser.mjs`（28 项真实 Chrome 检查）。Batch 17: a new **quick battle simulator** — the 「⚡ 快速战斗」 entry on the home screen opens `QuickBattleView.vue`; `src/game/arena.js` gains `ARENA_MAPS` with six battlefield presets and `generateArenaTerrain()` / `createBattle()` take a preset; `src/game/quickBattle.js` reuses the real `createBattle()` and `stepBattle()` and lets you pick the friendly army, the enemy faction, the size of the armies and the number of rounds, the count of every kind can be set freely, 「⚡ 进入战场」 **really puts the lord on the field** to fight it out (the campaign is untouched) and 「📊 先看看胜率」 gives the odds at once; it then reports the win rate, the average casualties and every round, and its entry sits **on the same level** as the start and continue buttons on the home screen; a new `tools/verify-quick-battle.mjs` (57 headless checks) and `tools/verify-quick-battle-browser.mjs` (28 real-Chrome checks). |
| 2026-10-18 | 批次 1：项目骨架与核心玩法（世界生成、寻路、据点、考试、战斗、存档）。Batch 1: scaffold and core gameplay (world generation, pathfinding, settlements, exams, battles, saves). |
| 2026-10-18 | 修复：地图碎裂导致远距离点击无反应 —— 只保留最大连通陆地；canvas `pointerdown` 不触发 —— 改用 `click`。Fixes: fragmented maps broke long-range tapping (keep the largest connected landmass) and canvas `pointerdown` never fired (switched to `click`). |
| 2026-10-18 | 批次 2：手机端适配、二维码分享、战败结算修复。Batch 2: mobile pass, QR sharing and the defeat-accounting fix. |
| 2026-10-18 | 批次 3：新增 `README.md` 与 `progress.md`。Batch 3: added `README.md` and `progress.md`. |
| 2026-10-18 | 批次 4：世界地图新增 👤 角色详情 面板（`CharacterPanel.vue`），展示兵力 / 资金 / 物资 / 战绩与每日军饷合计。Batch 4: added the 👤 lord info panel (`CharacterPanel.vue`) to the world map, showing troops, treasury, supplies, record and the total daily wage. |
| 2026-10-18 | 批次 5：全部游戏素材改为 32×32 像素画（`tools/pixel-assets/generate.mjs` 经 Pixelorama 桥接生成，`src/game/pixelAssets.js` 预加载与绘制），世界地图、战场与各面板全部接入；同时修掉生成器的描边回绕缺陷。Batch 5: all game art redrawn as 32x32 pixel sprites (`tools/pixel-assets/generate.mjs` through the Pixelorama bridge, loaded and drawn via `src/game/pixelAssets.js`) and wired into the world map, the battle arena and every panel; the generator's outline row-wrap defect was fixed. |
| 2026-10-18 | 批次 6：兵种标准化为「民兵 + 三家族 × 四档」并引入克制循环（+40% / −25%），城镇改为按权重随机出售 12 种档位组合；战斗新增每小队选项 —— 移动命令、6 种队形、2 种密度、远程风筝与冲锋压迫，并修掉方队 / 楔形的 y 轴居中缺陷；新增长枪兵两档素材；README 4.3 / 4.5 / 5.2 与维护章节重写。Batch 6: standardised the roster to militia plus three families × four ranks with the +40% / −25% counter cycle and weighted town stock over 12 rank combos; battles gained per-squad options — the move order, six formations, two densities, ranged kiting and melee crowding — plus y-centring fixes for the square and wedge, two new spearman sprites and rewritten README sections 4.3 / 4.5 / 5.2 and maintenance. |
| 2026-10-18 | 批次 7：游戏时间改为随主角移动而流逝（站着不动冻结天数与所有敌军），世界地图新增「⛺ 扎营 / 🔥 拔营」原地推进时间并画出帐篷与篝火；存档补上 `day` 字段；修复据点「升级 / 考试」页签空白（`UpgradePanel.vue` 缺少 `unitSprite` 导入导致整页渲染中断）。Batch 7: game time is now driven by movement (standing still freezes the day counter and every party), the world map gained a 「⛺ 扎营 / 🔥 拔营」 toggle that advances time in place with a tent and campfire marker, the save gained the `day` field, and the blank 升级 / 考试 settlement tabs were fixed (a missing `unitSprite` import in `UpgradePanel.vue` aborted the whole page render). |
| 2026-10-19 | 批次 8：新增 64 题「百科知识」题库与按记忆曲线加权的出卷调度（答对降频、答错升频、20 小时遗忘），题库改为 mod 注册表 —— 内置五科与 `public/mods/` 外部 JSON 共用一套契约，示例包「安全常识」12 题；考试界面改为动态科目、逐题记录并显示解析，存档新增 `questionStats`；同时给英文 / 语文 / 数学 / 逻辑补题，修掉部分题目 5–6 个选项的布局问题。Batch 8: added a 64-item encyclopedia bank and a memory-curve scheduler (correct answers fade, wrong ones return, 20-hour forgetting), turned the bank into a mod registry where the five built-ins and external JSON under `public/mods/` share one contract (with a 12-item 安全常识 example), made the exam subjects dynamic with per-answer recording and explanations, persisted `questionStats`, expanded English / Chinese / math / logic, and capped every question at four options. |
| 2026-10-19 | 批次 9：世界地图新增右上角小地图（据点标记 + 势力色部队 + 主角 + 视野框）与可拖动的详细地图浮层（16 px/格、手指拖动平移、回到主角），主角与每位将领的图标右上角显示兵力角标；三张势力军旗改为将领素材（`banner/` → `commander/`），强盗由红改灰、苍狼紫与赤鹰琥珀不变，配色统一取自 `factions.js`；图例改为素材 + 势力色驱动。Batch 9: added a corner minimap (settlement markers, faction-coloured parties, the lord, the camera rectangle) and a draggable atlas overlay (16 px per tile, finger-drag panning, recentre on the lord) to the world map, with troop badges on the lord and every commander; the three faction banners became commander sprites (`banner/` to `commander/`), bandits went from red to grey while the purple wolf and amber eagle stayed, all colours now read from `factions.js`, and the legend became sprite- and faction-colour-driven. |
| 2026-10-19 | 修复升级兵种错位：「全部是民兵」时点任一分支升级后出现的仍是民兵 —— `upgradesFor()` 的升级边只有 `key` 没有 `type`，界面按未知兵种回退成民兵显示，且三行共用步进器 key、只扣 8 金币保底价；`unitDef()` 补上 `type: base.key`，升级边写明目标家族与档位，`upgradeTroops()` 一律按查到的边写入。Fix: promotions landed on the wrong unit — with an all-militia warband any branch left it militia, because `upgradesFor()`'s edges carried `key` without `type` (the UI fell back to militia for an unknown type), all three rows shared one stepper key and only the 8-gold floor was charged; `unitDef()` now carries `type: base.key`, the edges name their target family and rank, and `upgradeTroops()` writes only what the matched edge sells. |
| 2026-10-20 | 批次 11：语文题库扩容 —— 新增 **阅读理解** 题型（12 篇短文 × 3 题，短文全文进题干并保留换行），古诗题库从 9 句扩成 **30 首必背古诗**并新增「补全诗句 / 由诗句猜诗题 / 作者是谁 / 上一句 / 诗意」五种题型（各自独立记忆曲线，答错带诗题作者朝代解析）；新增 `tools/verify-chinese.mjs`（32 项无头）与 `tools/verify-chinese-browser.mjs`（6 项真实 Chrome）。Batch 11: the Chinese bank grew a **reading comprehension** type (12 passages × 3 questions, the passage inside the prompt with its line breaks) and the ancient-poem bank grew from 9 lines to **30 poems** with five new types (fill in the missing character, which poem, who wrote it, the line before, what it expresses), each with its own memory curve and an explanation; added `tools/verify-chinese.mjs` (32 headless checks) and `tools/verify-chinese-browser.mjs` (6 real-Chrome checks). |
| 2026-10-20 | 批次 10：新增受伤与恢复（士兵组变为 `{ type, tier, count, hp }`，战败可能阵亡也可能成为伤兵，伤兵随天数恢复，城镇里更快、医院再加成）、据点归属与驻军（每个据点一个归属，强盗永不占城镇，地图画出归属光环）、围城（准备 2 天，期间时间流逝、驻军增援、归属方派援军，攻下即易主）、城镇发展（考试收入变成城镇资金与发展，发展推繁荣度，繁荣度升级城镇，等级带来更好的兵源与更快的恢复）、城镇设施（医院与军营，各可升三级）、世界规模翻倍（160 × 128、8 城 + 24 村）、势力成长（每天补兵、新强盗随机出现、上限 50 支，势力兵力上限跟已占领城镇的繁荣度挂钩）、无主城镇可「🚩 占领」、别人的城镇可进可不占，以及新的「🏛️ 城镇」页签。Batch 10: added wounds and recovery (troop groups are now `{ type, tier, count, hp }`, a defeated soldier may die or survive wounded, and wounds heal with the day — faster in a settlement, multiplied by the hospital), settlement ownership and garrisons (one owner per settlement, bandits never hold a town, the map draws an ownership ring), sieges (two days of preparation with the clock running, a growing garrison, a relief warband, and the town changes hands when it falls), town development (the exam feeds the town funds and development, development lifts prosperity, prosperity promotes the town, and the level brings better recruits and faster healing), town facilities (hospital and barracks, three levels each), a world twice as big (160 x 128 with 8 towns and 24 villages), growing factions (daily reinforcements, random bandit bands up to 50, a strength cap tied to the prosperity of the captured towns), claiming an unclaimed town with 「🚩 占领」, entering another faction's town without taking it, and the new 「🏛️ 城镇」 tab. |
| 2026-10-19 | 把升级校验固化成三支自检脚本：`tools/verify-upgrade.mjs`（无头 99 项检查）、`tools/verify-upgrade-head.mjs`（在修复前的源码上复现旧缺陷，32 项失败）、`tools/verify-upgrade-browser.mjs`（真实 Chrome 走一遍「升级」页签，13 项检查；修复前的构建会复现「升级后仍是民兵、只扣 8 金币」）。Added three self-check scripts for the upgrade path: `tools/verify-upgrade.mjs` (99 headless checks), `tools/verify-upgrade-head.mjs` (reproduces the old defect on the pre-fix sources, 32 failures) and `tools/verify-upgrade-browser.mjs` (real Chrome walking the 升级 tab, 13 checks; the pre-fix build brings back "still militia, only 8 gold"). |
| 2026-10-20 | 批次 12：新增**难度设置**（简单 / 普通 / 困难，只改考试金币：原始数值 / 每题少 1 / 每题少 2；首页选择、世界地图 🎚 芯片随时改、随存档保存）；**战斗速度**三档（🐢 慢速默认 / 🚶 正常 / 🐇 快速，战斗界面 ⚙ 面板切换）；**战场地形**（森林 / 沙地 / 河流 / 湖泊 / 山地，各自影响移动、攻击与防御，湖泊不可通行）并把战场从 900 × 560 扩到 **1000 × 680**，配一台会跟随战斗、可用手指拖动的镜头；**修复围城无法中断**（准备期间与准备完成后都有「🚫 取消围城」）与**攻打失败后必须重新准备围城**；新增 `tools/verify-battle.mjs`（64 项无头）与 `tools/verify-battle-browser.mjs`（22 项真实 Chrome）。Batch 12: added a **difficulty setting** (easy / normal / hard, changing only the exam reward — the original numbers, one gold less, two gold less; picked on the home screen, changeable with the 🎚 chip on the world map, saved with the campaign), **three battle speeds** (🐢 slow by default, 🚶 normal, 🐇 fast, switched from the ⚙ panel), **battlefield terrain** (forest / desert / river / lake / mountain, each changing movement, attack and defence, with the lake impassable) and grew the arena from 900 × 560 to **1000 × 680** with a camera that follows the fighting and can be dragged; **fixed the siege that could not be called off** (a 「🚫 取消围城」 button during and after the preparation) and **a failed assault now needs the siege prepared again**; added `tools/verify-battle.mjs` (64 headless checks) and `tools/verify-battle-browser.mjs` (22 real-Chrome checks). |
| 2026-10-20 | 批次 15：新增**昼夜循环** —— **夜晚占一天的五分之一**（19:12 – 24:00），新增 `src/game/daynight.js`（黑度曲线 + 减速系数）与 world store 的 `dayPhase` getter；夜里**地图变暗**（深蓝夜色 + 主角身边的灯光），**主角与所有游荡部队都慢 25%**；时钟芯片新增 ☀️ / 🌙 图标，进度条最后五分之一标成蓝色；`tools/verify-settlements.mjs` 增加 15 项检查。Batch 15: added a **day and night cycle** — **the night is the last fifth of every day** (19:12 to midnight) with a new `src/game/daynight.js` (the darkness curve and the slowdown) and a `dayPhase` getter in the world store; at night the **map darkens** (a deep blue veil with a lantern light around the lord) and **the lord and every warband slow down by 25%**; the clock chip gained a ☀️ / 🌙 icon and its last fifth is tinted blue; `tools/verify-settlements.mjs` gained 15 checks. |
| 2026-10-20 | 批次 14：无主的城镇不再一律白拿 —— **没有守军**时底部是「🚩 占领」，插旗拿下；**还有守军**时按钮变成「⚔️ 攻城」并显示守军人数，必须打赢才能占领（新增战斗类型 `claim`：打赢城镇归你，打输城镇与守军原样保留）。世界生成让 **45%** 的无主城镇空无一人，`normalizeSettlement()` 不再给无主城镇补驻军；`settlement.js` 新增 `claimIsFree()` / `needsAssault()`；`tools/verify-settlements.mjs` 增加 12 项检查，`tools/verify-settlements-browser.mjs` 增加 7 项真实 Chrome 检查。Batch 14: an unclaimed town is no longer free — with **no garrison** the bottom bar offers 「🚩 占领」, with **a garrison** it becomes 「⚔️ 攻城」 with the defender count and has to be stormed (a new `claim` battle kind: winning takes the town, losing leaves it and its defenders alone). World generation leaves **45%** of the unclaimed towns empty, `normalizeSettlement()` no longer hands a garrison to an unclaimed town, `settlement.js` gained `claimIsFree()` / `needsAssault()`, and the settlement suites gained 12 headless and 7 real-Chrome checks. |
| 2026-10-20 | 批次 13：界面新增**战役时钟** —— 新增 `src/components/DayClock.vue` 与 world store 的 `clock` getter（一天 24 秒 = 游戏里的 24 小时），世界地图顶部状态栏显示「📅 第 N 天 + 时刻 + 当天进度条」（走动时绿色、冻结时金色），据点标题栏与角色信息面板、详细地图标题也带上时刻；`tools/verify-settlements.mjs` 增加 11 项时钟检查。Batch 13: the interface gained a **campaign clock** — a new `src/components/DayClock.vue` and a `clock` getter in the world store (24 game seconds per day = 24 in-game hours), the world-map status bar now shows 「📅 day N + the time + a day-progress bar」 (green while it runs, gold while frozen), and the settlement header, the lord panel and the atlas header carry the time as well; `tools/verify-settlements.mjs` gained 11 clock checks. |
