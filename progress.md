# 开发进度 · Development Progress

`kids-war-game` — 2D top-down strategy game · 2D 俯视策略游戏
Last updated · 最后更新：2026-10-25

> 当前版本 / Current release: v0.0.18 —— 招募的随从会跟着主角在世界地图上走：主角身后排成小队，小地图与全图也能看到，路上随时能打开「👥 随从」分配士兵。
> The current release is v0.0.18: a recruited companion now rides with the lord on the world map — walking in a small train behind him, visible on the minimap and the atlas, with 「👥 随从」 reachable from the road.

This file tracks what is built, what is verified, and what is still open.
本文件记录已完成的内容、验证过的结论，以及仍未完成的部分。

It is the companion to `README.md`: the README explains how the game works, this file explains how far it has got.
它是 `README.md` 的配套文件：README 讲游戏怎么运作，本文件讲它做到了哪一步。

---

## 1. 进度总览 · Progress Overview

| 需求 / 领域 Area | 状态 Status | 说明 Notes |
| --- | --- | --- |
| 版本号与更新内容 Version and changelog | ✅ 完成 Done | 首页标题下显示「版本 v0.0.10」徽章，点开一个对话框写着本次发布的更新内容；版本号与更新日志集中在 `src/game/versions/`（每个发布一个文件），**只更新修订号**（v0.0.1 → v0.0.10），批次内容由 `progress.md` 生成。The home screen shows a 「版本 v0.0.10」 badge under the title and tapping it opens a dialog with the update notes of the release; the version and the changelog live in `src/game/versions/` (one file per release) and **only the patch moves** (v0.0.1 → v0.0.9), with the batches generated from `progress.md`. |
| 扎营练兵 Training drill | ✅ 完成 Done | 扎营时底部出现「🎯 练兵」：进入只有自己士兵与八个训练木桩的战场，**没有敌人、不会结束、不会死人**，木桩打倒后两秒自己立起，队伍 / 金币 / 军粮 / 战绩都不受影响。While the camp is pitched the bottom bar grows a 「🎯 练兵」 button: a field with the lord's own soldiers and eight wooden dummies, **no enemy, no end and no losses**; the dummies stand back up two seconds after they are knocked down, and the warband, purse, food and record stay untouched. |
| 世界地图与点击移动 World map and tap-to-move | ✅ 完成 Done | A* + 尽力靠近回退，最大连通陆地保证可达。A* with best-effort fallback on one connected mainland. |
| 游戏时钟与扎营 Game clock and camping | ✅ 完成 Done | 时间只在主角移动或扎营时流逝，站着不动会冻结天数与所有敌军；「⛺ 扎营」原地推进时间，地图上画出帐篷与篝火，**顶部时钟显示天数、当天时刻与进度条**，据点界面与角色面板也有同一个时钟；**每天的最后五分之一是夜晚**，夜里地图变暗、全世界慢 25%；**据点内时间放慢到现实 1 秒 = 游戏 1 分钟**（城镇里一天 24 分钟），管理城镇不再顺手烧掉战役天数。Time runs only while the lord marches or camps — standing still freezes the day counter and every party; camping advances it in place with a tent and campfire on the map, and the **clock chip shows the day, the hour of that day and a progress bar**, with the same clock on the settlement screen and in the lord panel; **the last fifth of every day is night**, when the map darkens and the whole world slows down by 25%; **inside a settlement the clock slows to one real second per in-game minute** (a town day is 24 real minutes), so managing a town no longer burns campaign days. |
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
| 战斗地图 Battle terrain | ✅ 完成 Done | 战场有 **森林 / 沙地 / 河流 / 湖泊 / 山地** 五种地形的格子，地形影响移动、攻击与防御，湖泊不可通行；**每一场战斗都按新的种子重新铺一张地图**（河流走向、湖泊 / 山地 / 森林 / 沙地的位置与大小），同一种子可复现，湖泊只落在战场内部并避开列阵区；深水挡住直线时，士兵会沿平滑后的 A* 路线绕湖，整支小队也走同一条集体路线，近战不能隔湖攻击；战场从 900 × 560 扩到 **1000 × 680**，并配一台会跟随战斗、可用鼠标左键或手指拖动的镜头。The field carries forest / desert / river / lake / mountain cells that change movement, attack and defence, with the lake impassable; **every battle lays out a new field from a fresh seed** (the river's course, the place and size of the lake, mountain, forests and sand), the same seed reproduces it, and the lake stays inside the field and clear of the deployment bands; when deep water blocks the straight line a soldier follows a smoothed A* route around it, the whole squad takes the same group route and melee blows cannot cross the water; the arena grew from 900 × 560 to **1000 × 680** and gained a camera that follows the fighting and can be dragged with the left mouse button or a finger. |
| 战斗速度 Battle speed | ✅ 完成 Done | 战斗有 🐢 慢速 / 🚶 正常 / 🐇 快速三档，**默认慢速**，战斗界面右上角 ⚙ 里切换。Three speeds — 🐢 slow (the default), 🚶 normal and 🐇 fast — switched from the ⚙ tools in the corner of the battle screen. |
| 战场动画 Battle animations | ✅ 完成 Done | 士兵会走、会跳、会呼吸：行军时一颠一颠并扬起尘土，站定时轻轻呼吸；挨打时白光一闪、红圈扩散、身体晃动，重伤者脚边有红色脉冲；出手时向目标前倾；阵亡者会倒下、下沉并淡出，练兵木桩也会倒下再站起。全部**只影响绘制**，战斗数值与胜负不变。Soldiers walk, hop and breathe: a marching soldier bobs and kicks up dust while a standing one breathes; a hit flashes white, expands a red ring and shakes the body, and a badly wounded soldier keeps a red pulse at its feet; a strike leans into the target; the fallen tip over, drop and fade, and a training dummy does the same before it stands back up. All of it is **render-only**: the numbers and the outcome do not change. |
| 战斗开局与下令 Battle opening and orders | ✅ 完成 Done | 进入战场时**敌我双方都原地驻守**，敌军约 5 秒后变阵、再约 2.4 秒后冲锋；主角先动手（下令攻击或先打中敌人）会让敌军立刻应战。底部「⚔️ 全军出击」一次让所有小队出击，也可以先选一支部队单独下令；减员的小队会收拢队形补上前排。Both armies **hold their ground** when the arena opens: the enemy dresses its ranks after about five seconds and charges roughly 2.4 seconds later, and a first blow or an attack order brings its answer at once. The 「⚔️ 全军出击」 banner sends every squad at once, a single squad can be ordered on its own, and a thinned squad closes its ranks to the front. |
| 主将与亲兵 Generals and bodyguard | ✅ 完成 Done | 战场上有**两位主将**：主角的领主与敌方势力的主将。开战前每方自动从自己的近战士兵里抽出 **4 名亲兵**围在主将身边，**亲兵没死光之前主将不会挨一下**；主将走到敌人身边会自动出手。**任何一位主将倒下都立刻结束这场战斗并结算**，双方退回世界地图上**刚刚那片战场周围**（3–7 格）。主角倒下＝判负：损失一半士兵、血量回到一半并随时间慢慢恢复（自己的城镇更快），敌人仍能继续追，主角也可以逃跑；敌将倒下则敌方队伍还在，玩家可以选择立刻追击或离开（战斗要赢仍需消灭全部敌兵）。The field now carries **two generals**: the lord and the hostile faction's commander. Before the fight each side detaches **four melee soldiers** from its own troops to stand around its general, and **the general cannot be hit at all until those guards are gone**; a general strikes whatever comes within reach. **Either general going down ends the battle on the spot** and both sides fall back onto the world map **around the field they fought on** (3–7 tiles). The lord going down is a defeat — half the warband is scattered, his health returns at half and then closes over time (faster in his own town), the enemy may keep chasing and he may run — while a beaten enemy general leaves his warband standing, so the player chooses between chasing it at once and walking away (a win still needs every enemy soldier gone). |
| 孤军奋战 Last stand | ✅ 完成 Done | 一方士兵全部倒下、主将还站着时，战斗**不会当场结束**：主将独自撑 **8 秒**（攻击 ×1.3、出手间隔 ×0.75），时间一到就退场。主角退场＝判负，但**不会再损失第二批士兵**（只剩医院救回的几名伤兵），带着当前生命值退回战场周围；敌将退场＝只身逃走，这一场**算你赢**。只剩主将时面板会出现「🏳 撤退」，可以立刻结束。The battle **does not end the moment a side runs out of soldiers**: the general holds out alone for **8 seconds** (attack ×1.3, a swing every 0.75 of the usual gap) and then leaves the field. The lord leaving is a defeat with **no second army to lose** (only the hospital rescue roll may bring back a few wounded), and he steps back to the field with the health he still had; a hostile general leaving is a flee, so **the battle is won**. While the lord is the last man standing a「🏳 撤退」button ends it at once. |
| 遇敌对话与逃跑 Meeting and fleeing | ✅ 完成 Done | 敌对部队追上主角时**先弹出遭遇对话框**：敌将像素头像、势力身份、敌我兵力对比与按兵种列出的敌方名册；「🏃 逃跑」随机退开 3–6 格并让该部队冷却 30 秒，不损失士兵与金币；「🗣️ 喊话」听敌将回话；「⚔️ 开战」才进入战斗地图。对话期间世界完全暂停。A hostile party that catches the lord **opens a meeting card first**: the leader's pixel portrait, his faction, the two armies' sizes and the enemy roster troop by troop; 「🏃 逃跑」 dashes 3–6 tiles away and cools that party down for 30 seconds without losing a soldier or a coin, 「🗣️ 喊话」 gets an answer, and only 「⚔️ 开战」 opens the battle map. The world freezes while the card is open. |
| 难度设置 Difficulty | ✅ 完成 Done | 简单 / 普通 / 困难三档，同时调整收入、军费与敌军：简单是练习档（5 金/题、整卷封顶 ×2、150 金 8 粮、敌军更弱），普通保持原数值（三年级 19 / 四年级 25、120 金 5 粮），困难是挑战档（14 / 19、90 金 3 粮、军粮 4/战、招募 +15%、敌军 +10%）；同一局内还有随胜场与占领城镇上升的「威胁」，世界地图芯片实时显示。Three levels that change the pay, the costs and the enemies: easy is practice (5 gold an answer, a capped paper, 150 gold and 8 food, weaker enemies), normal keeps the shipped numbers (19 / 25, 120 gold and 5 food) and hard is the challenge (14 / 19, 90 gold and 3 food, four rations a battle, recruits +15%, enemies +10%); a campaign threat rises with wins and captured towns and the world-map chip shows it. |
| 战术命令 攻击 / 防守 / 跟随 / 移动 Tactical orders | ✅ 完成 Done | 四个命令可实时切换，作用于**选中的小队**或全军；点击战场移动指挥官。All four switch live, per squad or army-wide; tapping the field moves the commander. |
| 战斗界面信息与退出 Battle screen readouts and exit | ✅ 完成 Done | 快速战斗右上角有「← 返回」，随时可以退出；右上角的小芯片显示最近半秒的平均帧率（低于 50 变金色、低于 30 变红色），悬停或长按能看到这半秒里最慢的一帧；战场可以用鼠标左键或手指拖动，拖过 4 px 才算拖动、轻点仍然是移动指挥官；战斗中手机左缘的滑动返回会被拦下并给出提示。A quick battle carries a 「← 返回」 button in its corner and can be left at any moment; a small chip shows the average frame rate of the last half second (gold below 50, red below 30) and the slowest frame of that window on hover or long press; the field pans with the left mouse button or a finger, a move counts as a drag past 4 px while a tap still moves the commander, and a phone's edge swipe back is refused with a note while the fight is on. |
| 大战场性能 Big-battle performance | ✅ 完成 Done | 400 v 400（800 名士兵）的战场在桌面 headless Chrome 里稳定 **60 FPS**（p50 16.7 ms、p95 16.8 ms），帧率芯片、双方兵力与小队芯片照常刷新；改动前同一场景只有 **8 FPS**（p50 133 ms）。A 400 v 400 field (800 soldiers) holds a steady **60 FPS** in headless Chrome on the desktop (p50 16.7 ms, p95 16.8 ms) while the frame-rate chip, the troop counts and the squad chips keep updating; the same scene ran at **8 FPS** (p50 133 ms) before the change. |
| 远程后撤 Ranged kiting | ✅ 完成 Done | 攻击命令下远程小队退得太近时**整队后撤**，而且先衡量每个方向还有多少空地：背后是墙或湖就沿墙滑开，必要时从敌人侧翼绕出去，不会把自己逼进角落站着对射。Under the attack order a ranged squad **steps back as a block** when the foe gets close, but first measures how much open ground each way leads into: with a wall or a lake behind it, it slides along the wall and rounds the enemy's flank when needed instead of backing into the corner and standing there. |
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
| 小地图与详细地图 Minimap and detailed atlas | ✅ 完成 Done | 右上角小地图（据点标记、势力色部队、主角、视野框）点击打开可拖动的全图（16 px/格）；主角、每位将领与每位随从的图标右上角都显示兵力角标（随从没有分到兵时不挂）。A corner minimap (settlement markers, faction-coloured parties, the lord, the camera rectangle) that opens a draggable atlas at 16 px per tile; the lord, every commander and every companion carry a troop badge (a companion with no soldiers stays unbaded). |
| 世界地图顶部界面 World-map HUD | ✅ 完成 Done | 地图上方是一块统一的黑色透明玻璃：顶部状态栏的芯片与按钮、右上角的小地图按钮、图例与图例的「收起 / 展开」共用同一背景与描边，悬停只加深黑色；各芯片的文字颜色照旧区分（金 / 白 / 暖 / 蓝）。Everything above the world map is one translucent black glass: the top-bar chips and buttons, the minimap button, the legend and its toggle share one background and border, and a hover only deepens the black; the labels keep their own inks (gold, white, warm, blue). |
| 城镇与村庄地图 Town and village maps | ✅ 完成 Done | 走到城门口点「进入」，主角就站进这座据点自己的地图（城镇 34 × 26 格、村庄 26 × 20 格）：主街、广场喷泉、房屋与设施，点地面寻路、点房子走到门口、点人走过去说话，镜头跟随、居民在自家门口走动，昼夜照样生效。Walking in at the gate puts the lord on the settlement's own map (34 x 26 tiles for a town, 26 x 20 for a village): a main street, a fountain on the square, houses and facilities, tap-to-path movement, a door to walk up to and a person to walk over to, a following camera, townsfolk drifting around their doorsteps and the day/night cycle still on.
| 居民、委托与随从 Townsfolk, quests and companions | ✅ 完成 Done | 每座城镇有 7 位（村庄 4 位）有名字的居民，八个职业各有台词；头顶「?」未接 /「!」进行中 /「✓」已完成。「📜 接受委托」才把当前统计记成起点，做完之后花金币（110–200）招为随从；随从带 4–6 名士兵，士兵从他自己的旗子出发参战、伤亡分开结算；**招募后的随从会跟着主角在世界地图上行走**（身后两人一排的小队），小地图与全图也能看到，路上可用「👥 随从」芯片分配士兵。Every town holds seven named townsfolk (four in a village) across eight trades, each with lines of their own and a mark overhead — 「?」 untaken, 「!」 in progress, 「✓」 done. Only 「📜 接受委托」 records the counter as the starting point; once it is done, 110–200 gold hires the NPC as a companion who leads four to six soldiers under his own banner, with casualties settled separately; **a recruited companion walks with the lord on the world map** (a train two abreast behind him), shows on the minimap and the atlas, and the 「👥 随从」 chip on the road hands out soldiers.
| 委托日志 Quest log | ✅ 完成 Done | 城镇底部「📜 委托」与世界地图顶部「📜 委托」芯片都能打开：进行中 / 已完成、谁托付的、在哪座城、还差多少，做完了给一个「去找他」直接回城；也可以放弃委托。Opened from 「📜 委托」 in a town or the chip on the world map: open and finished jobs, who asked, in which town, what is left, a button that walks back to him once done, and 放弃 for dropping one.
| 像素资产 Pixel art assets | ✅ 完成 Done | 18 张 32×32 素材（含三势力地图将领），经 Pixelorama 桥接生成，世界地图 / 战场 / 各面板均已接入。18 sprites at 32x32 (including the three faction commanders) generated through the Pixelorama bridge and wired into the world map, battle arena and panels. |
| 二维码分享 QR sharing | ✅ 完成 Done | 本地编码二维码，离线局域网可用。Locally encoded QR, works offline on a LAN. |
| 游戏介绍 Onboarding | ✅ 完成 Done | 首次开始前弹出介绍 + 独立介绍页。Intro modal before the first campaign plus a guide page. |
| 版本号与更新内容 Version display and update notes | ✅ 完成 Done | 首页显示「版本 v0.0.9」徽章，**点击后用对话框**展示本次更新内容；内容整理自 `progress.md` 的「已完成功能」一节，由 `tools/build-versions.mjs` 生成到 `src/game/versions/`。A 「版本 v0.0.10」 badge on the home screen; **tapping it opens a dialog** with the update notes, which are organised from the 「已完成功能」 section of `progress.md` and generated into `src/game/versions/` by `tools/build-versions.mjs`. |
| 练兵 Training drill | ✅ 完成 Done | 扎营时世界地图出现「🎯 练兵」按钮，进入没有敌人的训练场：只有自己的士兵和八个训练木桩，木桩只挨打、不会还手，打倒后两秒自己立起；练兵对钱袋 / 军粮 / 队伍 / 战绩零影响。A 「🎯 练兵」 button while the camp is pitched opens a field with no enemies: the lord's own soldiers and eight wooden dummies that only take blows and stand back up on their own; a drill changes nothing in the campaign. |
| 快速战斗 Quick battle | ✅ 完成 Done | 首页的「⚡ 快速战斗」可选战场地图（六种预设）、敌我势力与士兵规模，每个兵种都有加减键和**快速滑杆（0–100）**，跑出胜率与每场明细；模拟复用真实战斗的模拟器。The 「⚡ 快速战斗」 entry on the home screen picks a battlefield (six presets), the two sides and the size of the armies, every kind has a stepper and a **quick slider (0–100)**, and it reports the win rate and every round — running on the real battle simulation. |
| 与《骑马与砍杀：战团》对照 Bannerlord feature comparison | 📝 已分析 Analysed | 逐项对照战团的 24 项特性，写清哪些已经有、哪些只有雏形、哪些完全没有，以及儿童向的改造建议与优先级（见第 6 节）。Every one of the two dozen Bannerlord features is compared against the game, with what exists, what is only a sketch, what is missing, a kid-friendly adaptation and a priority order (section 6). |
| 学习主线 The exam spine | ✅ 四层已落地 Layers shipped | 批次 20 把第 7 节的四层改进全部做完：**A 结算层**（连击 ×1.0–×1.5、全对 ×1.5、长卷 ×1.1、及格 +20%，**答错不扣钱**）、**B 道具掉落**（军粮 / 集市券 / 征兵令 / 战马）与四个**里程碑**（军旗 / 徽章 / 药箱 / 驿马）、**C 掌握度地图**与两种复习卷（只考错题 / 复习队列）、**D 经验换四个属性**（统御 / 医术 / 工程 / 谋略，直接改队伍上限、恢复、造价、围城与全军攻击）。Batch 20 finished the four layers of section 7: the settlement, the gear and the milestones, the mastery map with its two revision papers, and the experience that buys the four attributes. |
| 题库检索 The question bank | ✅ 完成 Done | 批次 21 新增首页入口与 `#/bank` 页面：搜索、年级与科目过滤、展开看答案与解析、生成题换一题、每行的掌握度标记。Batch 21 added the home entry and the `#/bank` page: the search, the grade and subject filters, the answer and the explanation, another sample for a generated question and the mastery of every row. |
| 答题形式 Question shapes | ✅ 完成 Done | 批次 21 把题目契约扩展为四种形状：四选一、**填空**、**配对**、**排序**，并新增算式填空、拼写填空、诗句配对、节气排序与判断对错五种题型。Batch 21 extended the question contract to four shapes — multiple choice, **filled in**, **matching** and **ordering** — with five new kinds. |
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


### 批次 18 · Batch 18 — 反击与队形 Counterattack and formation (2026-10-21)

- ▶ 被打了就会还手：士兵会记住是谁打了它，转身还手 —— 哪怕它本来在防守或者在赶路。
  **Everybody answers an attack**: a soldier remembers who hit it and turns to answer that one, even when it was holding its position or marching somewhere else.
- ▶ 攻击不再打乱队形：小队转向敌人，前排压上，每个士兵守住自己的位置；队列不会一拥而上。
  **An attack keeps the formation**: the squad turns towards the foe, the front rank goes for it and every soldier holds its own slot; the ranks do not mob the enemy.
- ▶ 远程小队嫌近了是**整队后撤**，不是各自乱跑，队形在后撤中依然保持。
  **A ranged squad that is too close steps back as one block**, so the shape survives the retreat.
- 🔧 技术：士兵记住最后一个攻击者（近战与远程箭矢都记录）、优先还击的目标选择、小队按敌人方向翻转队形、整队后撤向量、贴住队形位置的 2 像素判定。
  Tech: the soldier remembers its last attacker (both melee blows and arrows record it), the target choice that answers it, the formation turning towards the foe, the block retreat vector and the tight 2 px slot rule.
- 🔧 校验 · Verification：`tools/verify-battle.mjs` 增加 6 项检查：士兵记住攻击者、转身还手、挨了打掉血；攻击时队形保持（实际宽度不小于队形宽度的 60%）、各排仍有距离、两边都有伤亡。
  Verification: `tools/verify-battle.mjs` gained six checks: the soldier remembers the attacker, turns to answer it and took the blow; the formation holds while attacking (the squad is at least 60% as wide as its formation), the ranks keep their distance and both sides take losses.

### 批次 19 · Batch 19 — 队形会呼吸 The formation breathes (2026-10-21)

- ▶ 队形不再僵硬：士兵在自己的位置上轻轻晃动，队列是一条活着的线，不是一张网格。
  **The formation is no longer stiff**: every soldier sways a little inside its slot, so the line is alive instead of a grid.
- ▶ 挨打会踉跄：被砍中或被射中的士兵会被推得偏一下，然后自己晃回原位。
  **A blow makes it stagger**: a soldier that is hit is shoved aside and then drifts back into its place.
- ▶ 太挤会互相让开：两个士兵贴得太近时会各让一点，队伍不会挤成一团。
  **Crowded soldiers give each other room**: two soldiers that stand too close slide apart, so the squad never piles up.
- ▶ 枪兵会压上去一点：近战小队列的前排会向敌人压进几步，后排照旧留在后面。
  **The spearmen press in**: the front rank of a melee squad leans on the foe while the rest stays behind.
- ▶ 随机队形也会打：散兵队形没有队列可守，于是**每个士兵自己扑向敌人**，照样砍得到人。
  **The scattered formation fights too**: a scatter squad has no block to keep, so **every soldier closes on the foe itself** and lands its blows.
- 🔧 技术：每个士兵带一个「个人空间」（晃动相位、受击推力、邻居推力），总偏移限制在 10 像素内；贴住位置时加入这层偏移；近战小队的锚点向敌人压进 7 像素。
  Tech: every soldier carries a personal space (a sway phase, the shove of a blow, the push of a neighbour) capped at 10 pixels, the slot target adds that offset, and the anchor of a melee squad leans 7 pixels into the foe.
- 🔧 校验 · Verification：`tools/verify-battle.mjs` 增加 6 项检查（共 76 项）：士兵不是僵硬的网格（平均偏离位置大于 1 像素）、个人空间不会大到破坏队形（小于 22 像素）、挨打会被推开；随机队形在攻击模式下**打得到人**、这一场能分出结果、不会卡住。
  Verification: `tools/verify-battle.mjs` gained six checks (76 in total): the soldiers are not a rigid grid (they sit more than a pixel off their slot on average), the personal space stays small enough to keep the formation (under 22 pixels), a blow shoves the soldier aside; and the scattered formation **lands its blows** in attack mode, that fight resolves and that it does not stall.

---

### 批次 20 · Batch 20 — 学习主线四层改进与界面清爽化 The exam spine and a cleaner home screen (2026-10-21)

- ▶ 一次考试结算得更多：连续答对有连击倍率（最高 ×1.5），整卷全对 ×1.5，12 题长卷 ×1.1，答对一半及格再 +20%。
  **A paper is worth more now**: a streak of correct answers multiplies the gold (up to ×1.5), a paper without a mistake pays ×1.5, a paper of twelve questions pays ×1.1 and reaching the pass line adds another 20%.
- ▶ 答错不扣钱：答错只是这一题没有金币、连击会断，不会倒扣。
  **A wrong answer never costs gold**: it simply pays nothing and breaks the streak.
- ▶ 做题会掉道具：每答对一题有 30% 掉一份军粮，连对 5 题必掉两份；某一科全部答对掉集市券（免费换一次物资）或征兵令（免费招 2 名民兵），整卷全对再掉一匹战马。
  **Answers drop gear**: every correct answer has a 30% chance of a ration of food and five in a row always bring two, a subject answered without a mistake drops a market voucher or a recruit order, and a perfect paper brings a horse.
- ▶ 里程碑道具：累计答对 300 / 500 / 800 / 1200 题，解锁军旗（全军攻击 +5%）、徽章（每战后 +10 金币）、药箱（伤兵恢复 +50%）与驿马（主角移速 +10%）。
  **Milestones**: 300, 500, 800 and 1200 correct answers unlock the war banner (+5% attack), the badge (+10 gold after a battle), the medicine chest (+50% recovery) and the post horse (+10% speed).
- ▶ 考试就是经验：及格的卷子每答对一题给 1 点经验，50 点换 1 点属性点，自己分配到统御 / 医术 / 工程 / 谋略。
  **An exam is experience**: a paper that passes gives one experience point per correct answer, fifty points buy an attribute point, and the child spends it on leadership, surgery, engineering or tactics.
- ▶ 属性真的有用：统御提高队伍上限与全军攻击，医术加快伤兵恢复，工程缩短围城准备并降低设施造价，谋略在开战前显示敌方构成。
  **The attributes really do something**: leadership opens the party cap and strengthens the army, surgery heals the wounded faster, engineering shortens a siege and cheapens the facilities, and tactics reveals the enemy before the fight.
- ▶ 掌握度地图：考试设置页按科目显示掌握度、已掌握题数与「该复习多少题」。
  **A mastery map**: the exam setup shows the mastery of every subject, how many questions are mastered and how many are due.
- ▶ 两种复习卷：只考错题（只出答错过的题）与复习队列（只出很久没复习、还没掌握的题）。
  **Two revision papers**: a paper of mistakes and a review queue of the questions that are due.
- ▶ 角色详情新增「学习与成长」：经验条、四个属性与加点、掌握度地图与里程碑进度。
  **The lord panel grew a learning section**: the experience bar, the four attributes, the mastery map and the milestone progress.
- ▶ 首页更清爽：只保留一个版本入口，配色更柔和、留白更舒服，手机竖屏一屏看得全。
  **A cleaner home screen**: one version entry, a softer palette, more air, and everything readable in a phone held in portrait.
- ▶ 世界地图上的提示改到屏幕顶部，不再挡住地图中间的主角。
  **The message of the world map moved to the top**, so it no longer covers the lord in the middle of the map.
- 🔧 技术：新增 `src/game/quiz/reward.js`（结算层）、`src/game/quiz/mastery.js`（掌握度与复习队列）、`src/game/skills.js`（属性）与 `src/game/milestones.js`（里程碑）；考试界面改为记录整张卷子的作答再统一结算，经验与属性写入存档；修掉生产构建会压缩函数名、导致记忆曲线 key 变化的缺陷（题型 kind 改用题目自带的稳定名字）；浏览器自检改为直接启动 vite 二进制，避免残留的预览服务器占住端口。
  Tech: the new `src/game/quiz/reward.js` (the settlement), `src/game/quiz/mastery.js` (the map and the queue), `src/game/skills.js` (the attributes) and `src/game/milestones.js` (the milestones); the exam records a whole paper and settles it in one place, and the experience and the attributes are saved; a production build no longer changes the memory-curve key by minifying the function names (a template now takes the stable kind its questions carry); the browser checks start vite's own binary, so no preview server is left behind on a busy port.

### 批次 21 · Batch 21 — 题库检索、更多答题形式与更小的金币 The question bank, more shapes and smaller coins (2026-10-21)

- ▶ **题库检索**：首页多了一个入口，打开整个题库 —— 搜索框、年级与科目过滤、点开看答案与解析、生成题可以「换一题」，有存档时每行还标着掌握程度。
  **The question bank**: a new entry on the home screen opens the whole bank — a search box, the grade and subject filters, the answer and the explanation of every row, another sample for a generated question and the mastery of every row.
- ▶ **四种答题形式**：除了四选一，现在还能**填空**（把答案写出来）、**配对**（左右两栏连起来）和**排序**（按顺序点出来），考试界面按题目的形状自动切换。
  **Four shapes of a question**: besides the multiple choice there is now a **filled-in answer**, a **matching** question and an **ordering** question; the exam renders whichever shape the question carries.
- ▶ **新的题型**：数学的算式填空、英语的拼写填空、语文的诗句配对与二十四节气排序、逻辑的判断对错。
  **New kinds**: the maths fill-in, the English spelling fill-in, the Chinese poem matching and solar-term ordering, and the logic true-or-false.
- ▶ **简单难度只奖励 5 个金币**：简单档改成练习模式（每题固定 5 金币，不分科目与年级），普通与困难两档沿用原来的数值。
  **The easy level pays five gold**: the easy level becomes the practice level (a flat five gold per question), while the normal and the hard level keep their numbers.
- ▶ 界面细节：题目的提示语会随形状变化（选择 / 写下答案 / 配对 / 排序），配对题的两栏有名字，答错时给出正确配对或正确顺序。
  Details: the hint follows the shape, the two columns of a matching question are named, and a wrong answer shows the right pairs or the right order.
- 🔧 技术：题目契约新增 `input` / `pairs` / `items` 三种形状，注册表校验与出题都按形状分支；新增 `src/components/QuestionBody.vue` 负责答题区；新增 `src/views/BankView.vue` 与 `#/bank` 路由；`src/game/quiz/shared.js` 增加 `inputQuestion` / `pairsQuestion` / `orderQuestion` / `gradeInput`；修掉 `poemFill` 在诗句太短时回退成另一种题型（会让记忆曲线的 key 变掉）的旧缺陷。
  Tech: the question contract grew the `input`, `pairs` and `items` shapes, the registry and the paper builder branch on the shape, a new `src/components/QuestionBody.vue` renders the answer area, a new `src/views/BankView.vue` serves the `#/bank` route, and `src/game/quiz/shared.js` grew the four helpers; the old defect where `poemFill` fell back to another kind (which changed the memory-curve key) is fixed.

### 批次 22 · Batch 22 — 难度重做：收入、军费与越打越强的世界 A difficulty rebuilt around pay, cost and a world that grows (2026-10-23)

- ▶ **三档难度重新分工**：简单是练习档（每题固定 5 金，整卷最多拿到题目基础价的 2 倍，开局 150 金 / 8 粮，敌军更弱）；普通保持原样（三年级 19 / 四年级 25，开局 120 金 / 5 粮）；困难是挑战档（三年级 14 / 四年级 19，开局 90 金 / 3 粮，每战 4 份军粮，招募贵 15%，敌军多一成）。
  **The three levels have their own jobs again**: easy is practice (a flat 5 gold an answer, a paper capped at twice its base, 150 gold and 8 food, weaker enemies), normal stays as shipped (19 / 25, 120 gold and 5 food) and hard is the challenge (14 / 19, 90 gold and 3 food, four rations a battle, recruits 15% dearer, a tenth more enemies).
- ▶ **越打越强的世界**：同一局里新增「威胁」，随胜场与占领的城镇上升（简单封顶 1.2、普通 1.8、困难 2.0），敌军新刷与增援的规模、总上限和精锐比例都跟着涨；卡住不前的孩子不会被惩罚。
  **A world that grows with the campaign**: a new threat rises with the battles won and the towns taken (capped at 1.2 easy, 1.8 normal, 2.0 hard) and scales the size, the ceiling and the rank mix of the enemies; a child who is stuck is never punished.
- ▶ **看得见的难度**：世界地图的 🎚 芯片变成「难度 · 威胁 1.36×」，难度面板列出当前的敌军规模、敌军上限、军粮、招募价与开局资源；首页的难度说明跟着所选档位变化。
  **A difficulty you can read**: the 🎚 chip reads 「难度 · 威胁 1.36×」, the sheet spells out the current enemy size, ceiling, food, recruit price and opening resources, and the note on the home screen follows the picked level.
- ▶ **练习档不再能刷钱**：简单档的整卷收入封顶，成绩页会用「练习档整卷上限（×2）」单独列出被削掉的金币；答得差时完全不受影响。
  **Practice can no longer be farmed**: the easy paper is capped and the result page lists the cut under 「练习档整卷上限（×2）」; a weak paper is never touched.
- 🔧 技术：`src/game/difficulty.js` 从「每题金币增减」扩成 pay / cost / foe 三条轴，新增 `startOf` / `foodPerBattleOf` / `recruitMulOf` / `foeOf` / `threatOf` / `enemySizeMulOf` / `enemyCapMulOf`；`quiz/reward.js` 应用练习档封顶并返回明细，`quiz/index.js` 应用困难档八折；`stores/battle.js` 的军粮改读难度，`game/recruit.js` 与 `RecruitPanel.vue` 应用招募加价；`game/worldgen.js` 的 `generateWorld(seed, { enemyScale })` 缩放开局敌军，`stores/world.js` 新增 `threat` getter 并让 `growFactions()` / `spawnBanditBand()` 按难度与威胁补兵、封顶、上调精锐；`stores/player.js` 的 `reset(username, difficulty)` 按难度发开局资源；新增 `tools/verify-difficulty.mjs`（58 项无头检查），`tools/verify-quiz.mjs` / `verify-battle.mjs` / `verify-battle-browser.mjs` 同步更新。
  Tech: `src/game/difficulty.js` grew from a reward delta into the pay / cost / foe axes with `startOf`, `foodPerBattleOf`, `recruitMulOf`, `foeOf`, `threatOf`, `enemySizeMulOf` and `enemyCapMulOf`; `quiz/reward.js` applies the practice cap and returns the breakdown while `quiz/index.js` applies the hard discount; `stores/battle.js` reads the food per battle, `game/recruit.js` and `RecruitPanel.vue` apply the recruit markup; `game/worldgen.js` scales the opening parties through `generateWorld(seed, { enemyScale })`, `stores/world.js` gained a `threat` getter and makes `growFactions()` / `spawnBanditBand()` reinforce by difficulty and threat, hold the ceiling and raise the ranks; `stores/player.js` starts a campaign with the difficulty's purse and food; added `tools/verify-difficulty.mjs` (58 headless checks) and updated `verify-quiz.mjs`, `verify-battle.mjs` and `verify-battle-browser.mjs`.

### 批次 23 · Batch 23 — 城镇慢钟与战场动画 A slow town clock and a battlefield that moves (2026-10-23)

- ▶ **城镇里的时间放慢 60 倍**：进入据点后，现实 1 秒只过去游戏里的 1 分钟，城镇里的一天是 **24 分钟**；看面板、招兵、升级、考试不再顺手烧掉战役天数，据点界面的时钟也会写着「镇内 1 秒 = 1 分钟」。
  **Town time is 60 times slower**: inside a settlement one real second is one in-game minute, so a day of town business takes **24 real minutes**; reading panels, recruiting, upgrading and taking exams no longer burn campaign days, and the settlement clock says 「镇内 1 秒 = 1 分钟」.
- ▶ **士兵会走会跳**：行军的士兵平滑滑动、一颠一颠地跳并在脚下扬起尘土，站定的士兵轻轻呼吸，不再像一张贴纸挪来挪去。
  **Soldiers walk and hop**: a marching soldier glides, bobs with every step and kicks up dust, while a standing one breathes, so it no longer looks like a sticker sliding across the field.
- ▶ **受伤与出手都有反应**：挨打时白光一闪、红圈扩散、身体左右晃动；重伤的士兵脚边持续红色脉冲；出手时身体向目标前倾一下。
  **Hits and strikes have a reaction**: a blow flashes white, expands a red ring and shakes the body; a badly wounded soldier keeps a red pulse at its feet; a strike leans the body into the target.
- ▶ **阵亡不再瞬间消失**：倒下的士兵会向侧面倒下、下沉并淡出，练兵木桩也一样倒下，然后在两秒后重新站起。
  **The fallen no longer vanish**: a defeated soldier tips over, drops and fades out, and a training dummy does the same before it stands back up two seconds later.
- 🔧 技术：`stores/world.js` 的 `restTick` 改为 `dt / REST_SECONDS_PER_HOUR`（60 秒 = 1 游戏小时，1440 秒 = 一天），世界地图的行军与扎营仍是 24 秒一天；新增 `src/game/battleAnim.js`（`hopOf` / `breathOf` / `walkTilt` / `woundedTilt` / `hurtShake` / `swingLunge` / `dustOf` / `deathPose` 纯函数），`BattleMap.vue` 用逐单位运动记录驱动走动、受击、重伤与死亡绘制，`pixelAssets.js` 的 `drawSprite` 新增 `smooth` 参数保留小数坐标，`battle.js` 的士兵新增只在绘制里使用的 `swing` 计时；`verify-settlements.mjs` 增加 5 项城镇时钟检查（131 项），`verify-battle.mjs` 增加 21 项动画数学与触发检查（111 项）；版本升到 **v0.0.4**。
  Tech: `restTick` in `stores/world.js` now adds `dt / REST_SECONDS_PER_HOUR` (60 seconds per in-game hour, 1440 seconds per day) while marching and camping stay at 24 seconds a day; a new `src/game/battleAnim.js` holds the pure helpers (`hopOf`, `breathOf`, `walkTilt`, `woundedTilt`, `hurtShake`, `swingLunge`, `dustOf`, `deathPose`), `BattleMap.vue` tracks per-unit motion to draw walking, hits, wounds and deaths, `drawSprite` in `pixelAssets.js` gained a `smooth` flag that keeps fractional positions and the soldiers in `battle.js` gained a render-only `swing` timer; `verify-settlements.mjs` gained five town-clock checks (131), `verify-battle.mjs` gained twenty-one animation maths and trigger checks (111), and the version moves to **v0.0.4**.

### 批次 24 · Batch 24 — 遇敌对话与逃跑 Meet the enemy before the fight (2026-10-23)

- ▶ **遇敌先说话**：敌对部队追上主角时不再立刻进入战场，而是弹出遭遇对话框——敌将的像素头像、所属势力、拦路的身份和「敌方 6 兵 / 我方 12 兵」的对比都在卡片上，下面按兵种列出对方的队伍。
  **The enemy speaks first**: a hostile party that catches the lord no longer drags him into the arena; a meeting card opens instead, with the leader's pixel portrait, his faction, what kind of party he leads and the 「their 6 / your 12」 tally, plus the enemy warband listed troop by troop.
- ▶ **可以逃跑**：点「🏃 逃跑」，主角会随机退开 **3–6 格**，遇到的那支敌军在短时间里追不上来；逃跑不损失士兵，也不花金币。
  **Running away works**: 「🏃 逃跑」 dashes the lord a random **3–6 tiles** away and the party that caught him cannot chase again for a while; no soldier and no coin is lost.
- ▶ **也可以喊话或开战**：「🗣️ 喊话」会让敌将再回一句，循环听得到每个势力的所有台词；点「⚔️ 开战」才真正进入战斗地图，敌人就是刚才拦路的那支队伍。
  **Talk back or fight**: 「🗣️ 喊话」 makes the leader answer, and every line of the faction can be heard in turn; only 「⚔️ 开战」 opens the battle map, with the very party that blocked the road.
- ▶ **对话时世界暂停**：对话框打开期间，天数、时钟和地图上的所有部队都停住，读完台词再决定，不会被偷袭。
  **The world waits during the talk**: while the card is open the day, the clock and every party on the map hold still, so the child can read and decide without being ambushed.
- 🔧 技术：新增 `src/game/encounter.js`（`ENCOUNTER_TALK` 三势力台词库、`enemyRoster()`、`fleeCandidates()` / `fleeTarget()` 纯函数与 `FLEE_COOLDOWN` 30 秒），`stores/world.js` 的 `tick` 在 `encounter` 存在时直接冻结世界，新增 `fleeEncounter()`（逃生点必须是走到得了、可站立、离敌人 3–6 格的格子，并把该部队放进冷却），`WorldView.vue` 的遇敌监听从「直接开战」改为只停下行军并打开对话框，新增 `EncounterDialog.vue`（头像、兵力对比、兵种名册、台词气泡与三个选项）；新增 `tools/verify-encounter.mjs`（50 项无头）与 `tools/verify-encounter-browser.mjs`（26 项真实 Chrome），`tools/make-save.entry.mjs` 可把一支敌军放在主角身边以重放遭遇；版本升到 **v0.0.5**。
  Tech: a new `src/game/encounter.js` holds the three faction line banks, `enemyRoster()`, the pure `fleeCandidates()` / `fleeTarget()` and a 30-second `FLEE_COOLDOWN`; `tick` in `stores/world.js` freezes the world whenever `encounter` is set and a new `fleeEncounter()` only accepts landing tiles that are walkable, reachable and 3–6 tiles from the enemy before putting that party on cooldown; the encounter watcher in `WorldView.vue` now stops the march and opens the dialog instead of starting a battle, and the new `EncounterDialog.vue` carries the portrait, the tally, the roster, the speech bubbles and the three choices; added `tools/verify-encounter.mjs` (50 headless checks) and `tools/verify-encounter-browser.mjs` (26 real-Chrome checks), and `tools/make-save.entry.mjs` can drop a party beside the lord to replay a meeting; the version moves to **v0.0.5**.

### 批次 25 · Batch 25 — 开局先对峙，等主角下令 A standoff before the charge, and the lord gives the order (2026-10-23)

- ▶ **开局双方都不动**：刚进入战斗地图时，敌我双方的士兵都驻守在原地——主角有时间看清战场、调整队形，不会被一开场就打乱。
  **Both armies hold when the map opens**: entering the arena no longer starts a charge; every squad on both sides stands its ground, so the lord has time to read the field and dress his own line.
- ▶ **敌军会先变阵再进攻**：对峙约 5 秒后，敌军换阵型（远程散成一线、近战收成楔形），再过约 2.4 秒才冲锋；主角先动手的话，敌军会在 1 秒内应战。
  **The enemy dresses its ranks and then charges**: after about five seconds the enemy changes formation (ranged into a firing line, melee into a wedge) and attacks some 2.4 seconds later — and answers within a second if the lord strikes first.
- ▶ **命令由玩家下**：底部提示条倒数「敌军 N 秒后进攻」，并给出「⚔️ 全军出击」；点它一次全军出动，也可以先选一支小队单独下 ⚔️ 攻击 / 🛡️ 防守 / 🏇 跟随 / 🎯 移动。
  **The orders are the lord's**: the command bar counts the standoff down and offers 「⚔️ 全军出击」 — one tap sends every squad, while a single squad can be picked and given attack / defend / follow / move on its own.
- ▶ **减员会收拢队形**：前排倒下后，幸存者补上前排的位置，人少的小队仍然面朝敌人继续接战，不会出现两边各剩一人却永远够不着的情况。
  **The ranks close up**: survivors take the front slots after the front rank falls, so a thinned squad still faces the foe — no fight stalls with one soldier left on each side, just out of reach.
- 🔧 技术：`battle.js` 新增 `OPENING`（5 秒等待 / 2.4 秒变阵 / 0.8 秒应战）与 `opening` 阶段机（`dressEnemyRanks()` / `enemyAdvance()` / `hastenEnemy()`），双方小队开局命令改为 `defend`，`updateGroupTargets()` 让两边都能原地驻守，`applyDamage()` 与 `setOrder()` 会提前触发敌军，士兵目标槽位改为按存活人数收拢（`group.packed`）；`stores/battle.js` 新增 `allAttack()`，`BattleView.vue` 新增开局提示条与「⚔️ 全军出击」按钮，`quickBattle.js` 的即时模拟自动下达攻击令；`verify-battle.mjs` 增加 19 项检查（138 项），`verify-battle-browser.mjs` 增加 5 项（31 项）；版本升到 **v0.0.6**。
  Tech: `battle.js` gained `OPENING` (5 s wait / 2.4 s dressing / 0.8 s answer) and the `opening` phase machine (`dressEnemyRanks()`, `enemyAdvance()`, `hastenEnemy()`), both sides now open on the `defend` order, `updateGroupTargets()` lets either side hold, `applyDamage()` and `setOrder()` bring the enemy forward early, and a soldier's slot is taken from the survivors (`group.packed`); `stores/battle.js` gained `allAttack()`, `BattleView.vue` the standoff banner with 「⚔️ 全军出击」, and the instant simulation in `quickBattle.js` gives the attack order itself; `verify-battle.mjs` gained nineteen checks (138) and `verify-battle-browser.mjs` five (31); the version moves to **v0.0.6**.

### 批次 26 · Batch 26 — 每一战都是新战场 A fresh battlefield for every battle (2026-10-23)

- ▶ **战场每次都重新生成**：河流的走向、湖泊与山地的大小和位置、森林与沙地都不再固定，每次进入战斗都会按新的种子重新铺一张地图，同一种子才会得到同一张地图；混战 / 平原 / 密林 / 山地 / 河流 / 湖泽六种预设仍然各自保证该有的地形。
  **A new field every time**: the river's course, the size and place of the lake and the mountain and the patches of forest and sand all come from a fresh battle seed, so no two fights share a map, while the same seed still rebuilds the same one; the six presets (mixed, plain, forest, mountain, river, lake) each still promise their own ground.
- ▶ **湖不会切断战场**：湖泊只落在战场内部、避开两侧的列阵区，因此不会把战场分成两半，也不会让士兵或指挥官一开始就站在深水里。
  **The lake never cuts the field in two**: it is always placed inside the field and clear of the two deployment bands, so no army starts in deep water and every route around it stays open.
- 🔧 技术：`arena.js` 的 `generateArenaTerrain()` 改为由种子决定所有地形块的位置与尺寸（河流起点、宽度与摆幅，湖泊 / 山地 / 森林 / 沙地的位置与半径，`span()` / `radiusOf()`），并修正河湖重叠清理改用逐行河位（`riverAt`）；`verify-battle.mjs` 增加 12 项地图生成检查（150 项），另用 60 个随机种子压测过「战斗都能在 120 秒内结束、无人开局站在水里」；版本升到 **v0.0.7**。
  Tech: `generateArenaTerrain()` in `arena.js` now draws every piece's place and size from the seed (the river's start, width and wander, the place and radius of the lake, mountain, forests and sand through `span()` / `radiusOf()`), and the lake-river overlap cleanup uses the per-row river column (`riverAt`); `verify-battle.mjs` gained twelve map checks (150), and a stress run over sixty random seeds confirmed that every fight still ends within 120 s with nobody starting in water; the version moves to **v0.0.7**.

### 批次 27 · Batch 27 — 远程后撤不再钻墙角 Ranged squads stop backing into the wall (2026-10-23)

- ▶ **远程小队会贴着墙、绕着敌人后撤**：攻击命令下退得太近时，弓箭手不再一路直线退到战场边缘站着对射；它会先衡量每个方向还有多少空地，背后是墙或湖时改为沿墙滑开，必要时从敌人侧翼绕出去，不会把自己逼进角落。
  **Ranged squads slip along the wall and round the enemy**: a ranged squad that has to give ground no longer backs straight into the arena edge and trades shots there; it weighs how much open ground each way leads into, slides along a wall or a lake when the way back is closed, and rounds the enemy's flank when that is the only way out of the corner.
- 🔧 技术：`arenaPath.js` 的 `retreatDirection()` 改为在 16 个方向上空地测距（每 30 px 一步、最远 150 px，撞墙 / 深水即止），按空地占比、背离敌人、与敌人保持的距离、地形速度与贴边程度打分，并接受上一帧方向作为惯性；`battle.js` 把最近的敌人与上一帧方向传进去；`verify-battle.mjs` 增加 6 项检查（156 项），其中一条是角落实战：4 名弓箭手被压进角落，2.5 秒内要离开角落至少 60 px；换回旧实现时这 3 条会失败。
  Tech: `retreatDirection()` in `arenaPath.js` now probes sixteen ways for open room (30 px steps up to 150 px, stopping at the wall or deep water) and scores the room, the pull away from the foe, the clearance kept from it, the ground speed and the edge, with the previous frame's direction as inertia; `battle.js` passes the nearest foe and the last direction; `verify-battle.mjs` gained six checks (156), one of them a corner fight in which four archers pressed into the corner must get at least 60 px clear within 2.5 s (three of them fail on the old code); the version moves to **v0.0.8**.

### 批次 28 · Batch 28 — 战斗界面：随时退出、帧率与拖动 Battle screen: leave, frame rate and dragging (2026-10-23)

- ▶ **快速战斗随时可以退出**：快速战斗的右上角多出「← 返回」，什么时候都能回到快速战斗的设置页，不必等一方被打垮；战役里的战斗仍然要分出胜负。
  **A quick battle can be left at any moment**: its corner gained a 「← 返回」 button that goes straight back to the quick battle setup, without waiting for one side to break; a battle in the campaign still has to be decided.
- ▶ **战斗界面显示帧率**：右上角的小芯片写着最近半秒的平均帧率，低于 50 变成金色、低于 30 变成红色；把鼠标停在上面（手机按住）还能看到这半秒里最慢的一帧花了多少毫秒，卡顿一眼就能看出来。
  **The battle screen shows the frame rate**: a small chip in the corner reads the average of the last half second, turning gold below 50 and red below 30, and hovering it (or holding it on a phone) shows the slowest frame of that window in milliseconds, so a stutter is easy to judge.
- ▶ **战场可以用鼠标或手指拖动**：PC 上用左键、手机上用一根手指都能平移战场，拖动会停止自动跟随，点「🎯」让镜头回到战斗；移动不到 4 px 的轻点仍然是移动指挥官，拖动不会再被当成一次点击，多出来的手指也不会把镜头甩走。
  **The field drags with a mouse or a finger**: the left button on a PC and one finger on a phone both pan the field and stop the auto-follow, and 「🎯」 brings the camera back to the fighting; a tap that moves less than 4 px still moves the commander, a drag is never read as a tap, and a second finger cannot throw the camera.
- ▶ **底部按钮不再罩住地图**：小队、命令、队形与提示各自带自己的面板，整条命令栏不再铺一层黑色渐变，战场在按钮之间的空隙里依然看得见。
  **The bottom buttons no longer cover the map**: the squads, the orders, the formation sheet and the hint each carry their own panel, and the whole command bar no longer lays a dark gradient over the field, so the ground shows through the gaps between them.
- ▶ **手机左缘滑动不会退出战斗**：从屏幕左缘往右滑本来是浏览器的「后退」，战斗中会被拦下，并在画面中间提示一句；要离开请用界面上的返回按钮（快速战斗 / 练兵）或打完这一仗。
  **A phone's edge swipe no longer leaves the battle**: the swipe from the left edge of the browser is a back step, and during a fight it is refused with a note over the field; leaving is done with the button on screen (quick battle / drill) or by finishing the fight.
- 🔧 技术：`BattleMap.vue` 的指针处理重写 —— 只认主指针（鼠标只认左键）、按下后累计移动 4 px 才判定为拖动、移动时 `preventDefault`、在 `pointerup` 上判定轻点、`pointercancel` 只清理状态；`BattleView.vue` 新增帧率采样（`requestAnimationFrame` 的半秒窗口与最慢一帧）、`onBeforeRouteLeave` 守卫（未结束且未点返回按钮时拒绝离开，并显示 2.2 秒提示条）与 `overscroll-behavior: none`；`verify-battle-browser.mjs` 增加 11 项检查（42 项），用 CDP 真的发鼠标拖动与触摸拖动，真的走一次 `history.back()` 确认战斗没有被退出，并读回命令栏与按钮的背景样式确认底栏不再罩住地图；版本升到 **v0.0.9**。
  Tech: the pointer handling in `BattleMap.vue` was rewritten — it takes the primary pointer only (the left button of a mouse), waits for 4 px of travel before calling it a drag, calls `preventDefault` while panning, decides a tap on `pointerup`, and lets `pointercancel` clean up the state; `BattleView.vue` gained the frame-rate sampler (a half-second `requestAnimationFrame` window and the slowest frame), the `onBeforeRouteLeave` guard (refusing to leave an unfinished fight unless the on-screen button was used, with a 2.2-second note) and `overscroll-behavior: none`; `verify-battle-browser.mjs` gained eleven checks (42), with CDP sending a real mouse drag and a real touch drag, a real `history.back()` proving the battle is not left, and the computed styles of the command bar and its buttons proving the bar no longer covers the field; the version moves to **v0.0.9**.

### 批次 29 · Batch 29 — 800 人战场稳定 60 帧 A big battle holds 60 frames (2026-10-23)

- ▶ **800 人的战场不再卡顿**：400 v 400 的快速战斗在桌面 headless Chrome 里从 **8 FPS** 提到 **60 FPS**（p50 16.7 ms、p95 16.8 ms、最慢 16.8 ms），帧率芯片、双方兵力与小队芯片在交战过程中照常刷新；镜头缩放与拖动不受影响。
  **A field of 800 soldiers no longer crawls**: a 400 v 400 quick battle went from **8 FPS** to **60 FPS** in headless Chrome on the desktop (p50 16.7 ms, p95 16.8 ms, worst 16.8 ms), with the frame-rate chip, both troop counts and the squad chips keeping up during the fighting; zooming and dragging the camera still work.
- ▶ **找敌人不再全场扫描**：最近的敌人改为在 90 px 的粗网格里按圈搜索，并让每名士兵把目标记住 0.18 秒（按士兵错开刷新），一次搜索从比较全场 800 人降到十几次；视线检查只在敌人已经进入攻击距离时才做，士兵之间的推挤改用平方距离比较。
  **Finding a foe no longer scans the whole field**: the nearest enemy is looked up ring by ring in a coarse 90 px grid, and every soldier keeps its target for 0.18 s (with the refreshes staggered per soldier), so one search drops from comparing all 800 soldiers to a dozen or so; line of sight is checked only once the foe is already within reach, and the push between neighbours compares squared distances.
- ▶ **战场数据不再经过界面框架的响应式代理**：模拟与绘制直接读原始数据，命令栏改由一个每秒更新十次的计数器驱动，因此每帧数百名士兵的坐标与生命值不再逐次穿过代理；兵力数字、命令与队形照常即时更新。
  **The field no longer runs through the interface framework's reactive proxies**: the simulation and the painter read the raw data, while the command bar is driven by a counter that moves ten times a second, so the positions and health of hundreds of soldiers no longer cross a proxy on every read; the troop counts, orders and formations still update at once.
- ▶ **对峙提示条会立刻收起**：点「⚔️ 全军出击」之后，顶上的对峙提示条立刻消失、底部提示换成冲锋说明，不会在敌军变阵的一秒多里继续挂着。
  **The standoff banner leaves at once**: after 「⚔️ 全军出击」 the banner is gone immediately and the hint switches to the charge, instead of hanging on for the second the enemy spends dressing its ranks.
- 🔧 技术：`battle.js` 新增 `targetGrid()` / `TARGET_CELL`（90 px，每 0.12 秒重建）与环形搜索，`unit.foeCache` 保存目标 0.18 秒并按 `id` 相位错开，`foeFor()` 的「最后攻击者」改查网格里的 `byId`，`sighted` 在 `dist > engage` 时短路，邻居推挤改用 `d2`；`stores/battle.js` 的四处 `createBattle()` 结果都套 `markRaw()`，新增 `stamp`（每 0.1 秒 +1）并让 `groups` / `selected` / `order` / `formation` / `density` getter 读取它，`BattleView.vue` 的 `playerAlive` / `enemyAlive` 同样读 `stamp`，对峙提示条也直接读 `stamp`（此前经过一个返回同一原始对象的中间 computed，Vue 认为值没变、提示条就卡在屏幕上），并新增 `charged`（全员攻击）让它在「全军出击」当帧收起；新增 `tools/verify-perf-browser.mjs`（9 项）—— 真实 Chrome 开 400 v 400、等双方接战、采样 6 秒 `requestAnimationFrame`，断言 ≥ 30 FPS 且 p95 ≤ 50 ms，并确认兵力下降、`stamp` 前进、画布有内容、控制台干净；版本升到 **v0.0.10**。
  Tech: `battle.js` gained `targetGrid()` / `TARGET_CELL` (90 px, rebuilt every 0.12 s) with the ring search, `unit.foeCache` holds a target for 0.18 s with the refreshes staggered by `id`, the "last attacker" lookup in `foeFor()` goes through the grid's `byId`, `sighted` short-circuits on `dist > engage`, and the neighbour push compares `d2`; the four `createBattle()` results in `stores/battle.js` are wrapped in `markRaw()`, with a new `stamp` (+1 every 0.1 s) read by the `groups` / `selected` / `order` / `formation` / `density` getters, `playerAlive` / `enemyAlive` in `BattleView.vue` read `stamp` too, and the standoff banner reads it directly (it used to go through a computed that returned the same raw object, so Vue saw no change and the banner stayed on screen), with a new `charged` computed (every squad attacking) clearing it on the 「全军出击」 frame; added `tools/verify-perf-browser.mjs` (9 checks) — real Chrome opens 400 v 400, waits for contact, samples `requestAnimationFrame` for six seconds and asserts ≥ 30 FPS with p95 ≤ 50 ms, then confirms the counts fall, `stamp` advances, the canvas is painted and the console is clean; the version moves to **v0.0.10**.

### 批次 30 · Batch 30 — 手机战场、拖动缓冲与冲锋 A phone battlefield, a drag buffer and the charge (2026-10-23)

- ▶ **战场的面积翻倍**：战场从 1000 × 680 扩到 **1400 × 960**（约为原来的 **1.98 倍面积**，宽高各约 1.4 倍，地形格 35 × 24），两军从 **784 px** 外开始推进，开局多出约四成的行军时间用来排兵布阵；湖泊、森林、山地、沙地与河流按新地图一起放大，各地形占战场的比例保持不变。
  **The battlefield covers twice the ground**: the arena grows from 1000 x 680 to **1400 x 960** (about **1.98 times the area**, each side about 1.4 times longer, with 35 x 24 terrain cells) and the armies start **784 px** apart, which gives roughly forty percent more marching time to form up; the lake, the woods, the mountains, the sand and the river grow with the field so every terrain keeps its share of the map.
- ▶ **镜头可以拖出战场边缘**：手指或鼠标把镜头拖到地图边时还能再拖出 **140 px**，看到战场外围的空地，站在最边上的士兵不再被钉在屏幕边上；左右与上下四个方向都一样，松手后镜头就停在缓冲位置，点 🎯 才回到战斗。
  **The camera can be dragged past the edge of the field**: a finger or a mouse drags it up to **140 px** beyond the map so the empty ground around the battlefield shows and a soldier on the border is no longer pinned to the screen edge; all four sides allow it, the camera rests there when the drag ends, and only 🎯 brings it back to the fight.
- ▶ **手机上的战斗界面**：在 **390 × 844（dpr 3，触摸）** 的手机视口里实测，顶部兵力条不再被截断（手机上隐藏装饰性的「战斗」标题与速度名，兵力条留出 200 px），底部命令栏从 **256 px 压到 220 px**（隐藏底部提示行、缩短命令按钮与队形开关、收窄间距），两条栏之间留出 **580 px（69%）** 的净空；开局镜头缩到 **0.42** 让两支军队同时入镜，接战后自动拉近到 0.7。
  **The battle screen on a phone**: measured in a **390 x 844** viewport (dpr 3, touch on), the top strength bar is no longer clipped (the decorative 「战斗」 title and the speed name are hidden on phones and the bar keeps 200 px) and the command bar shrinks from **256 px to 220 px** (the bottom hint line is hidden and the commands, formation toggle and gaps are tightened), leaving **580 px (69 percent)** of clear field between the bars; the opening camera zooms out to **0.42** so both armies are on screen, then closes to 0.7 once they meet.
- ▶ **近战会冲锋，也会累**：近战士兵的目标超过 **90 px** 时进入冲刺（**+30% 速度**），冲刺会一直持续到接战；体力约 **2.5 秒**耗尽，随后疲劳 **2.5 秒**（−10% 速度），喘匀后可以再冲。士兵的目标是远程兵时，进入 90 px 后会脱离阵位直接扑上去，不再被阵型槽位挡在攻击距离之外。
  **Melee soldiers charge, and they tire**: a melee soldier whose target is over **90 px** away breaks into a sprint (**+30 percent speed**) that carries through to contact; the burst lasts about **2.5 s** and leaves the soldier winded for **2.5 s** (−10 percent speed) before it can charge again. A soldier whose target is a ranged unit leaves its slot once within 90 px and closes on it directly, so the formation can no longer hold the front rank a few pixels short of reach.
- ▶ **齐射之后会慢，贴脸时更危险**：弓箭手每射出一箭都会短暂降速（**0.9 秒 × 0.72**），距离小于 **32 px** 时无法开弓，只能以 **0.85 倍**的速度后撤；因此被近战咬住之后连续风筝越来越难，长矛兵可以把弓箭手拖进肉搏。
  **Slow after a volley, and in real danger at point-blank range**: every arrow leaves the archer slowed for a moment (**0.9 s at 0.72 speed**), it cannot draw its bow under **32 px** and can only back away at **0.85 times** its speed; sustained kiting therefore gets harder once a melee soldier is on it, and spearmen can drag archers into hand-to-hand.
- ▶ **同数量对局的实测**：长矛兵对弓箭手 **8 v 8** 只赢 **1/5**（弓箭手虽赢，但每局要损失 1–4 人）；**20 v 20** 长矛兵 **5/5** 惨胜，打 **27–38 秒**、20 人只剩 **7–11 人**；单挑时一名长矛兵能在 **26 秒**后以 19 点生命取胜。民兵仍打不过同数量弓箭手（0/5），骑兵依旧碾压（5/5，6–7 秒）。
  **The measured equal fights**: spearmen beat archers only **1/5** at **8 v 8** (the archers win but lose one to four soldiers each time); at **20 v 20** the spearmen win **5/5** at a heavy cost, taking **27–38 s** and finishing with **7–11 of 20**; one spearman against one archer wins after **26 s** with 19 health left. Militia still lose to equal archers (0/5) while cavalry still ride them down (5/5 in 6–7 s).
- 🔧 技术：`battle.js` 的 `ARENA` 改为 1400 × 960，新增 `CHARGE_DISTANCE` / `CHARGE_MULT` / `CHARGE_DRAIN` / `CHARGE_REGEN` / `TIRED_TIME` / `TIRED_MULT`、`VOLLEY_SLOW_TIME` / `VOLLEY_SLOW_MULT`、`ARCHER_MIN_RANGE` / `ARCHER_PRESSED_MULT`，士兵新增 `stamina` / `sprinting` / `tired` / `volleyT`，`strike()` 设置齐射减速并在 32 px 内拒绝开弓，`updateGroupTargets()` 的 `pressing` 让近战在 90 px 内直接扑向远程目标；`arena.js` 的 `generateArenaTerrain()` 按 `max(1, round(max(cols / 25, rows / 17)))` 放大每块地形；`stores/battle.js` 的相机夹取加入 `PAN_OUTSIDE = 140`（屏幕像素除以缩放换成战场像素），窄屏（`viewW <= 640`）的缩放下限改为 0.42 并把「不在战场外」的旧注释改正；`BattleView.vue` 的手机媒体查询隐藏标题、速度名与提示行，收窄命令栏；新增 `tools/verify-battle-mobile-browser.mjs`（24 项，390 × 844 dpr 3 的布局、遮挡、按钮尺寸、拖动缓冲、开局双军入镜，以及同样尺寸下的快速战斗顶栏），`verify-battle` 168 项（新增 12 项：地图面积与格子、冲刺与疲劳、齐射减速、贴脸拒绝开弓），`verify-battle-browser` 44 项、`verify-perf-browser` 9 项、`verify-quick-battle-browser` 36 项照旧全过；版本升到 **v0.0.11**。
  Tech: `ARENA` in `battle.js` is 1400 x 960, with new `CHARGE_DISTANCE` / `CHARGE_MULT` / `CHARGE_DRAIN` / `CHARGE_REGEN` / `TIRED_TIME` / `TIRED_MULT`, `VOLLEY_SLOW_TIME` / `VOLLEY_SLOW_MULT` and `ARCHER_MIN_RANGE` / `ARCHER_PRESSED_MULT` constants and new `stamina` / `sprinting` / `tired` / `volleyT` unit fields; `strike()` sets the post-volley slow and refuses to draw under 32 px, and `pressing` in `updateGroupTargets()` sends a melee soldier straight at a ranged target once it is within 90 px; `generateArenaTerrain()` in `arena.js` scales every terrain blob by `max(1, round(max(cols / 25, rows / 17)))`; the camera clamp in `stores/battle.js` gains `PAN_OUTSIDE = 140` (screen px divided by the zoom into field px), the narrow-screen floor (`viewW <= 640`) is 0.42 and the stale "never shows the area outside the field" note is corrected; the phone media query in `BattleView.vue` hides the title, the speed name and the hint line and tightens the command bar; added `tools/verify-battle-mobile-browser.mjs` (24 checks: layout, occlusion, button sizes, drag buffer and both armies on screen at the opening in a 390 x 844 dpr-3 viewport, plus the quick battle's wider top-right tools on the same screen), `verify-battle` is at 168 (12 new: field area and grid, sprint and fatigue, volley slow, point-blank refusal), while `verify-battle-browser` 44, `verify-perf-browser` 9 and `verify-quick-battle-browser` 36 still pass; the version moves to **v0.0.11**.

### 批次 31 · Batch 31 — 驻守：把部队留在自己的城镇 Station your soldiers in your towns (2026-10-24)

- ▶ **可以把自己的部队留驻在己方城镇**：在自己占领的城镇里，「驻守士兵」一栏把每种兵都列成一行，点「➕ 驻守」把部队里的一个士兵留下守城，点「➖ 撤回」再把他带回来；士兵的生命值跟着人走，不会凭空回满，也不会白白丢掉。
  **You can leave your own soldiers behind in a town you own**: in the 「驻守士兵」 panel of your own town every troop family is a row, 「➕ 驻守」 moves one soldier of the warband into the garrison and 「➖ 撤回」 brings one back; each soldier keeps its own hit points across the move, so nothing is healed for free and nothing is lost.
- ▶ **驻军会和城镇一起恢复**：留在城里的士兵会像主角一样，随城镇的等级与医院逐日恢复生命值；地图上这座城镇的兵力角标也会跟着驻军人数的变化实时更新。
  **The garrison heals with the town**: the soldiers you leave behind recover their hit points day by day, exactly like the lord, scaled by the town's level and its hospital, and the garrison badge on the world map follows the soldiers the town now holds.
- 🔧 技术：`settlement.js` 新增 `canGarrison()` / `stationSoldiers()` / `withdrawSoldiers()`，并在 `tickSettlement()` 里让玩家城镇逐日恢复驻军（`healTroops` + `healRate`）；`stores/world.js` 新增 `stationTroops()` / `withdrawTroops()` 动作；`TownPanel.vue` 的「驻守士兵」栏为玩家城镇加入调兵行（`.garrison-ops`）；`verify-settlements` 新增 13 项、`verify-settlements-browser` 新增 4 项真实 Chrome 检查（点「驻守」真的进守军、点「撤回」真的回部队）；版本升到 **v0.0.12**。
  Tech: `settlement.js` gained `canGarrison()` / `stationSoldiers()` / `withdrawSoldiers()` and a player town now heals its garrison day by day inside `tickSettlement()` (`healTroops` + `healRate`); `stores/world.js` gained the `stationTroops()` / `withdrawTroops()` actions; the 「驻守士兵」 panel of `TownPanel.vue` gained the transfer rows (`.garrison-ops`) for player towns; `verify-settlements` gained 13 checks and `verify-settlements-browser` 4 real-Chrome checks (a real 「驻守」 click really fills the garrison, a real 「撤回」 click really returns the soldier); the version moves to **v0.0.12**.

### 批次 32 · Batch 32 — 地图按势力上色：小地图与全图一眼看出归属 Faction colours on the maps (2026-10-24)

- ▶ **世界全图按势力给每个据点上色**：点角落的小地图打开「世界全图」，城堡和村庄周围会画一圈归属色光环，名字牌也用归属色——你的城镇是蓝色、强盗是灰色、苍狼王国是紫色、赤鹰王国是橙色，无主的城镇保持原本的金色/淡色，一眼就能看出每片地盘属于谁。
  **The detailed atlas colours every settlement by its owner**: when you tap the corner minimap to open the world map, each castle and hut is circled by an ownership ring in the holder's colour and its name plate is tinted the same way — your towns are blue, bandits grey, the Wolf Kingdom purple, the Eagle Kingdom orange, and an unclaimed town keeps its original gold/pale tone, so who holds every patch of land is readable at a glance.
- ▶ **角落小地图也按势力上色**：右下角的小地图上，城镇与村庄的方块同样用归属色，和全图保持一致，扫一眼就能看出势力的分布。
  **The corner minimap is coloured too**: on the small minimap the town and village squares carry the same owner colours as the atlas, so the spread of the factions is visible at a glance and matches the big map.
- 🔧 技术：`atlas.js` 统一 `drawMiniMap`（据点方块用归属色）与 `drawAtlas`（据点加归属光环、名字牌用归属色）两处绘制，无主回退 `#d8c39a`；`factions.js` 仍是唯一颜色源（player `#4aa3ff`、bandit `#9aa2ab`、wolf `#7a5cc0`、eagle `#c98a2b`）；新增无头 `tools/verify-atlas.mjs`（10 项，mock 2D 上下文断言归属色绘制）与真实 Chrome `tools/verify-atlas-browser.mjs`（点小地图开全图、取样敌对城镇光环颜色 + 截图）；版本升到 **v0.0.13**。
  Tech: `atlas.js` colours both painters from one source — `drawMiniMap` fills each settlement square with its owner's colour and `drawAtlas` draws an ownership ring around the settlement and tints its name plate, with unclaimed places falling back to `#d8c39a`; `factions.js` stays the single source of the colours (player `#4aa3ff`, bandit `#9aa2ab`, wolf `#7a5cc0`, eagle `#c98a2b`); added the headless `tools/verify-atlas.mjs` (10 checks, a mocked 2D context asserts the ownership draws) and the real-Chrome `tools/verify-atlas-browser.mjs` (opens the atlas from the minimap, samples the hostile town's ring colour and screenshots it); the version moves to **v0.0.13**.

### 批次 33 · Batch 33 — 主将上阵与四方亲兵 The two generals and their bodyguards (2026-10-24)

- ▶ **主角和敌人都有了主将，主将会亲自上阵打架**：战场左右各站着一位主将（主角是领主，敌人是所属势力的大将），他们有独立的血条，走到对方身边就会自动出手砍人，不用再靠士兵代劳。
  **Both sides now have a general who fights in person**: a general stands on each side of the field (the lord for the player, the faction's own commander for the enemy), each with a health bar of its own, and he swings at whoever comes within reach of his arm instead of leaving every blow to the soldiers.
- ▶ **开战前自动给双方主将各配 4 名近战亲兵**：这四名士兵是从你自己的队伍里抽出来的，围着主将站成一圈，**亲兵没死光之前主将一下都挨不到**，所有的攻击都由他们替主将挡下。
  **Four melee bodyguards are assigned to each general before the fight**: they are taken out of that side's own warband and stand in a ring around their general, and **the general cannot be hit at all until all four are gone** — every blow meant for him lands on a guard instead.
- ▶ **主角血量归零＝这场战斗立刻失败**：不会死，但会损失**一半**士兵，然后被亲兵抬到世界地图上**随机一座城镇**附近，血量恢复到一半；之后血量会随时间慢慢恢复，**在自己的城镇里恢复得明显更快**。
  **The lord reaching zero hit points means the battle is lost at once**: he does not die, but **half** his soldiers are scattered, his bodyguard carries him to a spot beside a **random town** on the world map, and his health comes back at half; from there it closes slowly over time and **noticeably faster inside a town of his own**.
- ▶ **敌方主将打不倒：他被抬走，一会儿又回来**：把敌人主将打到 0 点，他只是被随机放到你当前位置附近、血量恢复一半，所以你可以一路追击他；**只有把敌人的士兵全部消灭，战斗才算赢**。
  **A hostile general cannot be finished off: he is carried off and comes back**: bringing him down to zero merely drops him at a random spot near where you stand with half his health, so you can keep chasing him; **the battle is only won once every enemy soldier is gone**.
- 🔧 技术：新增 `src/game/lord.js`（主将血量 120、亲兵 4 名、敌方主将 14/12/120、半血与恢复速率 `lordRegenPerSecond`）；`battle.js` 新增 `makeGeneral` / `splitGuards` / `addGuardSquad` / `generalShielded` / `guardsOf` / `generalDamage` / `respawnEnemyGeneral` / `stepGeneral` / `lordReport`，索敌网格与 `applyDamage` 都改走「有亲兵的主将不可被选中、伤害由亲兵接下」，敌方主将跟着自己军队的后方走；`stores/battle.js` 把主将血量带进带出战场，主将倒下时 `loseHalfTroops` 散去一半士兵并 `relocateLordToTown`；`stores/player.js` 新增 `lordHp` / `lordMaxHp` 与 `healLord`（存档同步 `lordHp`）；`stores/world.js` 新增 `relocateLordToTown` / `landNear` / `healLordTick`（地图与城镇休整都按真实时间回血）；战场 HUD 增加两条主将血条与亲兵计数，战场画出敌将与其势力立绘；新增无头 `tools/verify-general.mjs`（85 项）与 `verify-battle-browser.mjs` 里的 5 项真实 Chrome 检查（战场顶部两条主将血条、双方亲兵、敌将的势力立绘）；版本升到 **v0.0.14**。
  Tech: added `src/game/lord.js` (120 lord hit points, four guards, the hostile general at 14/12/120, half health and the `lordRegenPerSecond` rate); `battle.js` gained `makeGeneral` / `splitGuards` / `addGuardSquad` / `generalShielded` / `guardsOf` / `generalDamage` / `respawnEnemyGeneral` / `stepGeneral` / `lordReport`, the target grid and `applyDamage` now skip a shielded general and hand the blow to his guards, and the hostile general walks behind his own line; `stores/battle.js` carries the lord health in and out of a fight and, when the lord falls, scatters half the warband through `loseHalfTroops` and calls `relocateLordToTown`; `stores/player.js` gained `lordHp` / `lordMaxHp` and `healLord` (saved as `lordHp`); `stores/world.js` gained `relocateLordToTown` / `landNear` / `healLordTick` (real-time healing on the map and while resting in a town); the battle HUD carries two general bars with bodyguard counts and the field draws the hostile general with his faction art; added the headless `tools/verify-general.mjs` (85 checks) and five real-Chrome checks in `verify-battle-browser.mjs` (both general bars at the top of the field, both bodyguards, the hostile general's faction art); the version moves to **v0.0.14**.

### 批次 34 · Batch 34 — 主将倒下即收兵，两军退回战场旁 Generals end the battle; both armies step back to the field (2026-10-24)

- ▶ **主角被打败：结算并回到世界地图，就落在刚才那片战场旁边**：不再被送到随机一座城镇，而是退到开打那格周围 3–7 格的一处空地。代价不变 —— 损失一半士兵、血量回到一半，之后随时间慢慢恢复。
  **A beaten lord is settled and put back on the world map right beside the field**: no more being dropped at a random town — he falls back 3–7 tiles from the very tile the fight broke out on. The price is unchanged: half the warband scattered and his health back at half, then closing over time.
- ▶ **打输不等于脱身：敌人会继续追，你也可以跑**：退回地图后敌方队伍还站在原地，几秒后就能再次咬上来；想脱身就按遇敌面板上的「逃跑」，想翻盘就回头再打。
  **Losing does not mean getting away — the enemy keeps chasing, and you can run**: back on the map the enemy warband still stands where it did and can be on you again within seconds. Press 逃跑 on the meeting panel to get out, or turn around and fight again.
- ▶ **敌方主将被打倒：同样立刻结算、退回战场周围，追不追你说了算**：敌人队伍一个兵都不会凭空消失（只少了战场上阵亡的），所以你可以立刻追上去打第二场，也可以趁他重整的时候离开。要注意：**战斗要算赢，仍然得把敌人的士兵全部消灭**。
  **A beaten enemy general ends the battle the same way — back to the field around the fight, and the chase is your call**: his warband does not vanish (only the soldiers who fell are gone), so you may go after it at once or slip away while it re-forms. Note that **a win still means every enemy soldier is gone**.
- ▶ **战斗里不再有「敌将半血复活」**：主将倒下就是这一场的结尾，结算面板会告诉你发生了什么（新的「⚔️ 敌将倒下」结算，以及主角倒下的「你被抬回战场附近」说明）。
  **No more "the hostile general gets back up at half health" mid-fight**: a general going down is the end of that battle, and the result screen says what happened — a new「⚔️ 敌将倒下」result, and a「carried back to the field」note when the lord goes down.
- 🔧 技术：`battle.js` 删除 `respawnEnemyGeneral` / `respawnSpotNear`，改为 `downEnemyGeneral`（主将 `alive=false`、`generalDowns+1`、`enemyGeneralDown=true`、`outcome='general'`）；`createBattle` 新增 `endOnGeneralDown`（快速推演传 `false`，没有地图可回，倒下就一直躺着，打到一方兵尽为止）；`stores/battle.js` 的 `settle` 增加 `generalDown` 分支（敌兵幸存者写回队伍、冷却 `ENEMY_GENERAL_COOLDOWN=4`、不散兵不回血），主角倒下改走 `LORD_DOWN_COOLDOWN=6` 并调用 `relocateToField(seed,'lord',field)`；`stores/world.js` 用 `relocateToField` / `landNearField` 取代 `relocateLordToTown` / `landNear`（以战场为中心 3–7 格环形取点、跳过敌队 2 格内与水面），`lordDownAt` 改成 `lastReturn`（'lord' | 'enemy'）+ `clearReturn`；`game/lord.js` 新增 `FIELD_RETURN_MIN/MAX` 并删掉旧的城镇/复活常量；战场结算页新增「敌将倒下」标题与文案、战场特效 `down`（原 `respawn`）；世界地图的提示按 `lastReturn` 区分「被抬回战场」与「敌将倒下」；`tools/verify-general.mjs` 扩到 **112 项**；版本升到 **v0.0.15**。
  Tech: `battle.js` dropped `respawnEnemyGeneral` / `respawnSpotNear` for `downEnemyGeneral` (`alive=false`, `generalDowns+1`, `enemyGeneralDown=true`, `outcome='general'`); `createBattle` gained `endOnGeneralDown` (instant rounds pass `false` — there is no map to return to, so a fallen general stays down and the round runs to the last soldier); `settle` in `stores/battle.js` gained a `generalDown` branch (enemy survivors written back, `ENEMY_GENERAL_COOLDOWN=4`, no scattered troops and no health restored) and the lord-down path now uses `LORD_DOWN_COOLDOWN=6` and calls `relocateToField(seed,'lord',field)`; `stores/world.js` replaced `relocateLordToTown` / `landNear` with `relocateToField` / `landNearField` (a 3–7 tile ring around the field, skipping water and tiles within 2 of a hostile warband) and `lordDownAt` became `lastReturn` ('lord' | 'enemy') with `clearReturn`; `game/lord.js` gained `FIELD_RETURN_MIN/MAX` and lost the old town/respawn constants; the result screen gained the「敌将倒下」heading and copy, the field gained the `down` effect (the old `respawn`), the world map toast follows `lastReturn`, and `tools/verify-general.mjs` grew to **112 checks**; the version moves to **v0.0.15**.

### 批次 35 · Batch 35 — 士兵打光之后：孤军奋战与撤退 After the army falls: the last stand (2026-10-24)

- ▶ **士兵全部倒下，战斗不会立刻结束**：最后一名士兵倒下后，主将会独自撑 **8 秒**，这段时间他打得更好（攻击 ×1.3、出手更快），屏幕上会出现一条「🛡 只剩主将一人！」的倒计时。
  **The battle no longer ends when the last soldier falls**: the general holds the field on his own for **8 seconds**, hitting harder and swinging faster, with a「🛡 只剩主将一人！」countdown on screen.
- ▶ **你只剩主将时，可以按「🏳 撤退」**：不用等那 8 秒。撤退＝这一场判负，但**不会再损失第二批士兵**（本来也打光了，只有医院的救回判定可能带回几名 1 点血的伤兵），你带着**当前**的生命值退回战场周围，敌人还在附近。
  **When the lord is the last man standing, a「🏳 撤退」button appears**: no need to wait out those 8 seconds. Retreating loses the battle but **takes no second army from you** (there is none left — only the hospital rescue roll may bring back a few one-hit-point wounded). He steps back to the field around the fight **with the health he still had**, and the enemy is still nearby.
- ▶ **敌方主将撑到最后就只身逃走，这一场算你赢**：他的士兵打光后同样撑 8 秒，时间一到战斗结束 —— **算你获胜**，战利品与占领结算照常，结果面板会写「敌将只身逃走」。
  **A hostile general who holds to the end flees alone and hands you the battle**: he holds for 8 seconds too, and when the clock runs out the fight ends **as your victory** — loot and captures as usual, with「敌将只身逃走」on the result screen.
- 🔧 技术：`game/lord.js` 新增 `LAST_STAND_SECONDS=8` / `LAST_STAND_ATK_MUL=1.3` / `LAST_STAND_SWING_MUL=0.75`；`battle.js` 的结算改为「先看主将、再看最后一人」：新增 `b.lastStand={side,t}`、`b.yielded`、`createBattle({lastStand})`、`isLastStand()`、`yieldBattle()`，`generalDamage` 与 `stepGeneral` 读取孤军加成，`downEnemyGeneral` 在敌方无兵时直接判胜；`stores/battle.js` 新增 `withdraw()` 与 `WITHDRAW_COOLDOWN=5`，`settle` 增加 `withdrew`（不散兵、按当前血量、`relocateToField(seed,'withdraw')`）与 `generalFled`（胜利）；战场新增 `.last-stand` 倒计时面板与「撤退」按钮、结算页新增撤退与敌将逃走的文案；世界地图提示新增 `lastReturn === 'withdraw'`；`verify-general` 扩到 **150 项**、`verify-battle-browser` 扩到 **75 项**（含真实 Chrome 里把士兵逐个打倒 → 出现倒计时 → 按撤退 → 返回地图）；版本升到 **v0.0.16**。
  Tech: `game/lord.js` gained `LAST_STAND_SECONDS=8`, `LAST_STAND_ATK_MUL=1.3` and `LAST_STAND_SWING_MUL=0.75`; the resolution in `battle.js` now checks the generals first and the last man second — `b.lastStand={side,t}`, `b.yielded`, `createBattle({lastStand})`, `isLastStand()` and `yieldBattle()` are new, `generalDamage` and `stepGeneral` read the lone-general bonus, and `downEnemyGeneral` wins outright when the enemy has no soldiers left; `stores/battle.js` gained `withdraw()` and `WITHDRAW_COOLDOWN=5`, and `settle` gained `withdrew` (no scattered troops, current health kept, `relocateToField(seed,'withdraw')`) and `generalFled` (a win); the battle screen gained the `.last-stand` countdown panel with its 撤退 button and the result screen gained the retreat and enemy-flee copy; the world map toast knows `lastReturn === 'withdraw'`; `verify-general` grew to **150 checks** and `verify-battle-browser` to **75** (including a real-Chrome pass that knocks every soldier down, sees the countdown, presses 撤退 and lands back on the map); the version moves to **v0.0.16**.

### 批次 36 · Batch 36 — 走进城镇：街道、居民、委托与随从 Towns you can walk through, their people, jobs and companions (2026-10-25)

- ▶ **据点变成了可以走动的场景**：在世界地图上点「进入」，主角就站进了这座城镇自己的地图 —— 一条主街、一个广场和喷泉、两排房屋，市集 / 兵营 / 学堂 / 医馆 / 铁匠铺 / 酒馆都排在街边。点地面走过去（和世界地图同一套寻路），点房子走到门口推门，点人走过去说话，镜头跟着主角，居民在自家门口一两格内慢慢走动。村庄也有自己的小地图：谷仓、磨坊、水井、几间农舍和城外的田地。
  **A settlement is now a place you walk through**: tapping 「进入」 on the world map puts the lord on the town's own map — a main street, a square with a fountain and two rows of houses, with the market, barracks, school, hospital, smithy and tavern along the street. Tap the ground to walk (the same pathfinder the world map uses), tap a house to walk up to its door, tap a person to walk over and talk; the camera follows the lord and the townsfolk drift a step or two around their own doorsteps. A village has a small map of its own: barn, mill, well, a few cottages and fields on the edge.
- ▶ **推门进去就是原来那些面板**：议事厅 = 城镇管理，集市 = 市场，兵营 = 招募与升级，学堂 = 考试，铁匠铺 = 升级，医馆显示「医院等级 / 每天恢复 / 伤兵 / 领主生命」，酒馆与民居会列出全镇的居民供你挑一个人说话 —— 没有第二套界面，只是把同一个面板搬到门口。
  **A door opens the very panels the game already had**: the hall is the town books, the market the market, the barracks recruiting and upgrading, the school the exam, the smithy the upgrade tree, the hospital shows the healing numbers, and the tavern or a house lists everybody in town so you can pick who to talk to — no second implementation, only the same panels moved to a door.
- ▶ **镇上有名字的人**：每座城镇 7 位、每座村庄 4 位居民，八个职业（卫兵 / 猎人 / 书生 / 铁匠 / 医师 / 吟游诗人 / 商人 / 农夫）各有一套台词与性格；头顶挂着记号 ——「?」有委托还没接、「!」已经接下、「✓」做完了。
  **Named people in town**: seven townsfolk in a town and four in a village across eight trades (guard, hunter, scholar, smith, healer, bard, merchant, farmer), each with lines of their own — and a mark over their head: 「?」 for a job nobody has taken, 「!」 for one in progress, 「✓」 for one that is done.
- ▶ **委托要先接，才算数**：和居民说话会看到他请你做的事 —— 答对 16 道题、赢下 3 场战斗、招募 10 名士兵。点「📜 接受委托」的这一刻才把当前统计（答对题数 / 胜场 / 招募人数）记成起点，之后你为他做的事才计入，之前攒下的战绩不会白送；点「放弃委托」可以退回重接。
  **A job has to be accepted before it counts**: talking to somebody shows what they would like done — answer 16 questions, win 3 fights, hire 10 soldiers. Pressing 「📜 接受委托」 is what records the counter at that moment, and only what the lord does afterwards counts, so an old record never hands out a free quest; 「放弃委托」 gives it back.
- ▶ **委托日志：城镇和世界地图都能打开**：日志写着谁托付的、在哪座城镇、还差多少，并按「进行中 / 已完成」分组；做完的那条变绿并写着「✅ 已完成 —— 回去找他就能招募」，右边一个「去找 某某」按钮直接把你送回那座城镇。
  **A quest log reachable from a town and from the world map**: each row says who asked, in which town and what is left, grouped into open and finished jobs; a finished one turns green with 「✅ 已完成 —— 回去找他就能招募」 and a 「去找 某某」 button that walks the lord straight back to that town.
- ▶ **花金币招随从，再把自己的兵交给他**：委托做完后「🤝 招募为随从」才会亮，价格按职业 110–200 金。招来的随从**身边没有兵**：打开「👥 随从」，左边是你的部队、右边是他的旗子，点「给他」把一名士兵交过去、点「收回」要回来，一顶旗子最多 4–6 人（按职业），士兵连伤口一起转手。
  **Hire a companion with gold, then hand him your own soldiers**: the 「🤝 招募为随从」 button lights up once the job is done, at 110–200 gold depending on the trade. A new companion has **no soldiers of his own**: in 「👥 随从」 the warband sits on the left and his banner on the right, 「给他」 hands a soldier over and 「收回」 takes one back, a banner holds four to six (by trade), and a soldier carries his wounds across.
- ▶ **随从带兵上战场，伤亡各算各的**：带着兵的随从会在战场后排排出自己的小队，队名就是他的名字（「李守信·民兵」），能单独下令与换队形；他的兵死了只少他自己旗子上的人，你的队伍不替他背损失，他本人也不会阵亡。每种职业还给全军一点小加成（卫兵 +2% 防御、猎人 +2% 攻击、医师 +15% 伤兵恢复……）。
  **Companions fight with their own banner, settled separately**: a companion with soldiers forms squads in the rear named after him (「李守信·民兵」) that take orders and formations like any other; his losses thin his banner only, never the lord's roster, and he is never killed. Each trade adds a small army-wide bonus (guard +2% defence, hunter +2% attack, healer +15% recovery …).
- ▶ **39 张新的像素素材**：六张可平铺的地面（草地 / 土路 / 石板路 / 广场砖 / 水 / 田地）、十五张建筑与设施（议事厅 / 三种民居 / 集市 / 酒馆 / 铁匠铺 / 兵营 / 医馆 / 学堂 / 磨坊 / 谷仓 / 城门 / 水井 / 喷泉）、十张街道道具（木桶 / 木箱 / 推车 / 路灯 / 树 / 灌木 / 路牌 / 草堆 / 旗帜 / 栅栏）和八张居民（每个职业一张）。全部 32 × 32，经 Pixelorama 桥接生成，与地图素材共用同一套调色板。
  **39 new pixel sprites**: six tileable grounds (grass, dirt road, cobbles, plaza slabs, water, field), fifteen buildings and facilities (hall, three houses, market, tavern, smithy, barracks, hospital, school, mill, barn, gate, well, fountain), ten street props (barrel, crate, cart, lamp, tree, bush, signpost, haystack, banner, fence) and eight townsfolk, one per trade — all 32 x 32, drawn through the Pixelorama bridge with the same palette as the map art.
- 🔧 技术：像素工具抽出共享的 `tools/pixel-assets/pixkit.mjs`（桥接、光栅器、调色板、`writeIndex` 按分类合并清单），`generate.mjs` 改为引用它（重新生成 `militia` / `town` 与改动前逐字节一致），新增 `generate-town.mjs` 生成全部城镇素材；`src/game/town.js` 用确定性布局生成场景（地块、主街、广场、建筑地块与门、居民落脚点、可行走判定、`scenePath`、`buildingNear` / `npcNear`）；`src/game/npc.js` 保存八个职业、名字池、三类委托（`exam` / `battle` / `recruit`，各自读 `stats.correct` / `stats.wins` / `stats.recruited`）、随从上限与士兵转移；`pathfinding.js` 抽出 `findPathOn(grid, w, h, …)`，世界地图仍走 `findPath`；`pixelAssets.js` 的清单由「分类」改为「路径」（`town-hall` / `prop-tree` / `npc-guard` / `ground-grass`），共 57 张；`stores/player.js` 新增 `companions` / `quests` / `stats.recruited`、`acceptQuest` / `abandonQuest` / `questProgress` / `openQuests` / `allQuests` / `hireCompanion` / `dismissCompanion` / `assignCompanionSoldiers` / `recallCompanionSoldiers`；`battle.js` 的 `createBattle` 新增 `allyTroops`，友军小队带 `owner` / `ownerName` 并按自己的纵向区间列阵，`survivorsByType` / `fallenByType` 增加 `owner` 过滤（`undefined` 全侧、`null` 只要领主的兵、字符串只要该随从的兵）；`stores/battle.js` 传入 `battleCompanions()` 并在结算时 `settleAllies()` 分开掷存亡；`save.js` / `gameState.js` 写入 `companions` / `quests`；新增 `TownView` / `TownMap` / `NpcDialog` / `CompanionPanel` / `QuestPanel` 五个组件与 `#/town` 路由，世界地图的「进入」改为进城、据点页新增「🏘 走进城里」，`SettlementView` 与 `TownView` 互为出入口；`v0.0.17`。
  Tech: the pixel tools were split into a shared `tools/pixel-assets/pixkit.mjs` (bridge, rasterizer, palette and a `writeIndex` that merges the manifest by category) which `generate.mjs` now imports (a regenerated `militia` / `town` is byte-identical to the old files), and `generate-town.mjs` draws every town sprite; `src/game/town.js` builds a scene deterministically (ground, main street, square, building lots and doors, spots for people, the walkable rule, `scenePath`, `buildingNear` / `npcNear`); `src/game/npc.js` holds the eight trades, the name pool, the three kinds of job (`exam` / `battle` / `recruit`, reading `stats.correct` / `stats.wins` / `stats.recruited`), the banner size and the soldier transfers; `pathfinding.js` grew `findPathOn(grid, w, h, …)` while the world map keeps `findPath`; the manifest in `pixelAssets.js` moved from a folder to a path per sprite (`town-hall`, `prop-tree`, `npc-guard`, `ground-grass`) with 57 entries; `stores/player.js` gained `companions`, `quests`, `stats.recruited`, `acceptQuest`, `abandonQuest`, `questProgress`, `openQuests`, `allQuests`, `hireCompanion`, `dismissCompanion`, `assignCompanionSoldiers` and `recallCompanionSoldiers`; `createBattle` in `battle.js` gained `allyTroops`, ally squads carry `owner` / `ownerName` and stand in their own band, and `survivorsByType` / `fallenByType` take an `owner` filter (`undefined` the whole side, `null` only the lord's soldiers, a string only that companion's); `stores/battle.js` passes `battleCompanions()` and settles each banner with `settleAllies()`; `save.js` / `gameState.js` persist `companions` and `quests`; the new `TownView`, `TownMap`, `NpcDialog`, `CompanionPanel` and `QuestPanel` components sit behind the `#/town` route, the world map's 进入 now walks in, the settlement screen gained 「🏘 走进城里」, and the two screens link to each other; **v0.0.17**.

### 批次 37 · Batch 37 — 随从跟着走：地图上的小队 A companion rides along on the world map (2026-10-25)

- ▶ **招募的随从会跟着你走**：不再只在城镇里出现。主角在地图上走，随从就跟在他身后排成一小队（两人一排，越走越靠后拉开），走动时轻轻一颠一颠，停下时围在身后站定；夜里他们和主角一起被提灯照亮。
  **A recruited companion now walks with the lord**: no more showing up only inside a town. When the lord rides, his companions follow in a small train behind him (two abreast, the pairs opening out further back), bobbing a little while they walk and standing behind him when he stops — and at night they share the lord's lantern light.
- ▶ **小地图与全图也看得到**：小地图上主角的白点周围多出一圈小点（每位随从一颗），详细全图里则是随从自己的像素小人，和大地图上的站位一致。
  **The minimap and the atlas show them too**: a ring of small dots around the lord's dot on the minimap (one per companion), and their own pixel sprites on the detailed atlas, standing in the same slots as on the big map.
- ▶ **路上也能管理随从**：世界地图顶部新增「👥 随从 N」芯片，点开就是城镇里那块面板 —— 不必为了给谁分兵特地跑回城里。
  **Companions can be managed on the road**: the world-map bar grew a 「👥 随从 N」 chip that opens the very panel the town uses, so handing out soldiers no longer means riding back to town.
- 🔧 技术：新增 `src/game/followers.js`（`followerTargets` 按行进方向排出「身后两人一排」的槽位、`easeFollower` 用指数追赶做出拖尾、`followerBob` 走路起伏），`WorldMap.vue` 每帧把每位随从平滑地移向槽位并绘制在夜幕之后、主角之下；`atlas.js` 的 `drawMiniMap` 接收 `companions` 画小点、`drawAtlas` 接收 `companions` 用同一套槽位画小人；`MiniMap.vue` / `WorldAtlas.vue` 传入 `player.companions`，`WorldView.vue` 新增随从芯片与 `CompanionPanel` 浮层；`tools/verify-town.mjs` 增加 15 项队形与追赶检查（**123**），`tools/verify-town-browser.mjs` 增加 4 项（**33**）并在真实 Chrome 里断言地图上的随从芯片、路上开面板、面板只挂一份；顺手修好浏览器自检里 `--headless=new` 的 GPU 进程崩溃（加 `--disable-gpu` 等参数）；版本升到 **v0.0.18**。
  Tech: new `src/game/followers.js` (`followerTargets` lays out the "two abreast behind the lord" slots from the direction of travel, `easeFollower` gives the exponential trailing lag, `followerBob` the walking bob); `WorldMap.vue` eases every companion towards its slot each frame and draws the train after the night veil and under the lord; `drawMiniMap` takes `companions` for the ring of dots and `drawAtlas` takes `companions` for the sprites in the same slots; `MiniMap.vue` / `WorldAtlas.vue` pass `player.companions`, and `WorldView.vue` gained the companion chip and the `CompanionPanel` overlay; `tools/verify-town.mjs` grew fifteen formation and catch-up checks (**123**) and `tools/verify-town-browser.mjs` four (**33**) that assert the chip, the panel on the road and that exactly one panel is mounted in the real browser; the headless Chrome GPU crash in the browser suite was fixed along the way (`--disable-gpu` and friends); the version moves to **v0.0.18**.

### 批次 38 · Batch 38 — 全图标都有兵数，顶部一律黑玻璃 Badges on every icon, one black glass above the map (2026-10-25)

- ▶ **详细全图上的随从也有兵力角标**：全图里每位随从的像素小人，右上角都画出一枚兵力徽章 —— 和领主、敌将身上那枚一模一样，只是小一号；没有分到兵的随从不挂徽章。全图底部那句「图标右上角数字是该部队兵力」，现在对每一个图标都算数。
  **A companion on the atlas carries his troop badge too**: every companion sprite on the detailed atlas now wears the badge in his top-right corner — the same disc the lord and the commanders wear, one size smaller; a companion with no soldiers stays unbaded. The atlas footer's promise that the corner number is the troop count now holds for every icon on the map.
- ▶ **世界地图上方统一成黑色透明**：顶部状态栏的芯片与按钮、右上角的小地图按钮、图例和图例里的「收起 / 展开」，现在全是同一块黑色透明玻璃（悬停时只是加深一点黑色，不再闪白色或金色）；文字颜色照旧各自区分，一块玻璃、五种颜色。
  **One black glass above the world map**: the chips and buttons of the top bar, the minimap button in the corner, the legend and its 「收起 / 展开」 toggle all wear the same translucent black — a hover only deepens the black instead of flashing white or gold; the labels keep their own colours, so it is one glass with five inks.
- 🔧 技术：`atlas.js` 的 `drawAtlas` 在随从槽位上补画 `drawBadge`（半径 7，领主与部队是 9），人数取 `npc.js` 的 `companionStrength`，与 `WorldMap.vue` 里随从徽章同一规矩；`WorldView.vue` 把 `.role-btn:hover` 的白色悬停改黑，新增 `.hud-top > button:hover`（选择器刻意压过 `.hud-top > .chip` 的静止态），小地图按钮与图例改用 `--glass` / `--glass-line`，图例开关改成黑色玻璃小药丸；`MiniMap.vue` 同步换玻璃并去掉金色分隔线；`tools/verify-atlas.entry.mjs` 增加 3 项随从角标检查（**13**），新增 `tools/verify-companions-browser.mjs`（14 项）在真实 Chrome 里量角标像素与六块玻璃的计算样式；版本升到 **v0.0.19**。
  Tech: `drawAtlas` now paints `drawBadge` on every companion slot (radius 7 against the lord's 9) with the count from `companionStrength`, the same rule the big map's follower badge follows; `WorldView.vue` turns the white `.role-btn:hover` black and adds `.hud-top > button:hover` — deliberately heavier than the rest-state rule — while the minimap button and the legend move to `--glass` / `--glass-line` and the legend toggle becomes a black-glass pill; `MiniMap.vue` takes the same glass and drops its gold divider; `tools/verify-atlas.entry.mjs` grew three companion-badge checks (**13**) and the new `tools/verify-companions-browser.mjs` adds fourteen more that measure the badge pixels and the computed style of all six glasses in real Chrome; the version moves to **v0.0.19**.

## 3. 已知限制 · Known Limitations
1. **难度仍不改题目，也可以随时下调。** 三档考同一张卷子，难度只改收入、军费与敌军；孩子卡住时能随时切回简单档，所以「困难」不是一把锁死的挑战记录。
   **The difficulty still cannot change the questions, and it can always be lowered.** All three levels ask the same paper and only change the pay, the costs and the enemies; a stuck child can switch back to easy at any time, so 「困难」 is not a locked challenge record.
2. **主将的数值是固定的，难度不会改他，伤口也不跨场带走。** 双方主将都是 120 点血、固定攻防，敌方主将不随难度或势力变强；亲兵的 4 名士兵是从自己队伍里抽出来的（不是额外白送的部队），因此 8 人以下的队伍最多只能分出 4 名、更小的队伍只分出不到 4 名。主将只会近战，没有远程攻击，也不会替士兵挡箭。敌将倒下后只有这一场结束，下一场他仍然满血、仍然带 4 名亲兵——地图上不记录他的伤。
   **The generals' numbers are fixed, the difficulty does not touch them, and a wound does not follow them between battles.** Both generals have 120 hit points with a fixed attack and defence, and the hostile general does not grow with the difficulty or the faction; the four bodyguards are pulled out of that side's own warband rather than added on top, so an army of eight yields four guards and a smaller one yields fewer. A general only fights hand to hand. A beaten hostile general loses only that battle: next time he comes back at full strength with four fresh guards, because the world map does not record his wound.
3. **「孤军奋战」只发生在你看得到的战场，快速推演里没有。** ⚡ 快速战斗的回合是无头推演（没有世界地图可回），所以一方士兵打光就直接结束、按胜负统计，不跑那 8 秒 —— 推演出来的胜率因此和观战时的细节略有出入。
   **The last stand only exists on a battle you can watch.** A ⚡ quick-battle round is simulated headless with no world map to fall back to, so it ends the moment a side runs out of soldiers instead of playing those eight seconds — which is why a simulated win rate can differ slightly from a watched fight.
4. **被击败的王国部队不会重新成军。** 强盗会定期新刷，两个王国也会给现有部队补兵，但整支被消灭的部队与丢掉的据点不会重新出现，因此地图仍可能被逐步清空。
   **Defeated kingdom parties never re-form.** Bandits keep appearing and both kingdoms reinforce the parties they still have, but a wiped party and a lost settlement never come back, so the map can still be emptied step by step.
5. **单机 + 浏览器本地存档。** 存档存在 localStorage，无法跨设备或跨浏览器迁移，也没有导出/导入。
   **Single player with browser-local saves.** Progress lives in localStorage, cannot move between devices or browsers, and there is no export/import.
6. **非玩家势力全部敌对。** 原需求提到「敌人或中立的势力」，目前中立性只体现在中立的城镇/村庄，没有任何中立部队。
   **All NPC factions are hostile.** The original spec mentions enemies *or* neutral forces; today neutrality only exists as neutral settlements — there are no neutral warbands.
7. **经济系统刻意简化。** 军粮只影响攻击力（缺粮 −25%），战马最多 +10% 攻击；每个兵种定义了 `wage`，角色面板会显示每日军饷合计，但**金币并不会真的按日扣除**，该数值目前只是展示。
   **The economy is deliberately simple.** Food only affects attack (−25% when empty) and horses cap at +10% attack; every unit defines a `wage` and the lord panel shows the total daily wage, but **gold is still never deducted per day** — the number is display only.
8. **少量已定义但未使用的字段。** `player.gradePref`、`hasWarband` 与 `player.stats.days` 目前没有任何界面或逻辑引用（考试界面使用自己的本地年级选择，天数以 `world.day` 为准）；`dailyWage` 已由角色面板引用。
   **A few defined-but-unused fields.** `player.gradePref`, `hasWarband` and `player.stats.days` are still not referenced by any UI or logic (the exam modal keeps its own local grade selection and the day counter lives in `world.day`); `dailyWage` is now read by the lord panel.
9. **真机小屏验证未完成。** 批次 7 用真实 Chrome（headless + CDP，390×844 CSS px 设备模拟）在**真正生效的 560 px 媒体查询**下走查了世界 HUD、扎营按钮与提示条，无重叠或溢出；但**仍未在真实 375 px 手机屏上用过触屏**，手势（长按、双击缩放）与 iOS 的 `dvh` 表现未验证。
   **Real-phone small-screen verification is pending.** Batch 7 drove real Chrome (headless over CDP at 390x844 CSS px with device emulation) with the 560 px media query genuinely active, and the world HUD, camp button and hint bar showed no overlap or overflow; however **no touch pass has been done on a real 375 px phone**, and gestures (long press, double-tap zoom) plus iOS `dvh` behaviour remain unverified.
10. **像素素材的浏览器校验仍未覆盖战场。** 批次 7 已在浏览器中实测世界地图（含扎营的帐篷与篝火）与据点四个页签（含升级列表里的兵种图标），但**战场士兵**（阵营底盘、血条、朝向翻转、档位血点）本轮仍未触发；营地图标按 1× TILE 绘制，会与领主立绘轻微重叠，属于刻意取舍。
   **The pixel-art browser pass still skips the arena.** Batch 7 confirmed the world map (including the tent and campfire) and all four settlement tabs (including the unit icons in the upgrade list) in a browser, but the **arena soldiers** (side discs, health bars, facing flips, rank pips) were still not triggered this round; the camp marker is drawn at 1x TILE and overlaps the lord sprite slightly, which is a deliberate trade-off.
11. **战斗平衡只由无头对战校验。** 克制关系与胜负只在无头 8v8 / 16v16 的同阵对冲下验证过，没有真人试玩；2–4 档之间的对战、混编阵容与「移动 / 跟随」命令下的胜负都没有系统测试。
   **Battle balance is verified by headless duels only.** The counter cycle and the outcomes were checked with headless 8v8 / 16v16 mirror duels; there has been no human playtest, and rank-2 to rank-4 duels, mixed compositions and fights under the move / follow orders are not systematically tested.
12. **冲锋会压平队形。** 近战小队冲锋时队形偏移被压到 13 px 以内，因此接战瞬间「方队」与「一行」看不出差别；队形差异主要体现在接敌前的行军与防守站位。
   **Charging flattens the formation.** A charging melee squad's slot offsets are capped at 13 px, so square and single-rank look alike at the moment of contact; formations mainly shape the approach and the defending stance.
13. **冻结的世界＝站着不动的玩家不会被追上。** 时间冻结后所有敌军都停住，因此站在原地不动时（不扎营）敌人永远追不上你，遭遇战只会在主角移动或扎营时发生。这是「时间随移动推进」的直接推论，也是一种反偷袭保护。
   **A frozen world means an idle lord can never be caught.** With time frozen every party stops, so while standing still (and not camping) enemies can never close on you and encounters only happen while marching or camping. That follows directly from the movement-driven clock, and it doubles as ambush protection.
14. **扎营目前只有「原地等时间」一个效果。** 它不消耗军粮、不恢复任何状态，也没有昼夜变化或营地本身的风险；一天固定 24 秒游戏时间，与实际走过的距离无关（地形越差走得越慢，因此穿过森林的一天反而更短）。
   **Camping currently only means "let time pass in place".** It consumes no supplies, restores nothing and carries no day/night cycle or camp risk; a day is a flat 24 seconds of game time regardless of the distance covered (rough terrain is slower, so a day spent in forest is actually shorter).
15. **记忆曲线的裁剪仍会丢掉很早的记录。** 批次 20 之后界面已经能看到按科目与年级的掌握度地图（`src/game/quiz/mastery.js`），但 `pruneQuestionStats()` 仍会在超过 1200 条后按 `lastSeen` 丢弃最久未见的记录，长期游玩会让很早的题目回到 0 级。
    **The pruning of the memory curve still drops the oldest records.** Since batch 20 the interface shows a mastery map per subject and grade (`src/game/quiz/mastery.js`), but `pruneQuestionStats()` still drops the least recently seen records past 1200, so very old questions eventually restart at level 0.
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
21. **玩家可以给自己的城镇派驻军，但别的势力不会来攻城。** 夺下城镇后可以把部队留在城里守城（也能随时撤回，驻军随城镇逐日恢复），但没有任何势力会主动攻打主角的城镇，所以这支驻军暂时只作为「城镇的兵力展示」，不会真的被进攻。
   **The lord can garrison his own towns, but no faction ever attacks them.** After capturing a town he may leave soldiers behind to defend it (and take them back at any time, while the town heals them day by day), yet no faction ever marches on a town the lord owns, so that garrison currently only shows the town's strength rather than being truly fought over.
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
27. **城镇慢钟也让休整回血变慢。** 休整与城镇共用同一口慢钟，所以靠休息养伤要等满 24 分钟才过一天；急着恢复应该去行军或扎营，而不是在城镇里干等。
    **The slow town clock also slows resting.** Resting shares the town clock, so healing by rest means waiting a full 24 real minutes for a day to pass; a player in a hurry should march or camp rather than stand in town.
28. **逃跑必定成功，也没有谈判。** 遭遇对话框只有开战、逃跑与喊话三个选项；逃跑永远成功、不损失任何东西，因此打不过时可以直接跑掉，没有被抓、被抢或花钱买路的选择。
    **Fleeing always works, and there is no negotiation.** The meeting card offers only fight, run and talk back; running never fails and costs nothing, so a losing fight can always be walked away from — there is no capture, no shakedown and no paying for passage.
29. **逃跑后的冷却按游戏时间计。** 同一支部队在 30 秒游戏时间之内不会再次拦住主角；时钟冻结时这段冷却也停住，所以站着不动不会「等掉」它。
    **The escape cooldown runs on game time.** The same party cannot catch the lord again for 30 game seconds, and a frozen clock pauses that cooldown too, so standing still never waits it out.
30. **敌方头像是将领素材放大。** 对话框里的头像是该势力的 32×32 地图将领像素图，而不是单独绘制的半身像；出生点没有单独的「敌人立绘」素材。
    **The enemy portrait is the commander sprite enlarged.** The dialog's portrait is the faction's 32x32 map commander instead of a dedicated bust, because no separate leader art exists yet.
31. **开局对峙的秒数是固定的。** 敌军总是等 5 秒、变阵 2.4 秒后冲锋，不随难度或势力变化；主角也可以一直不下令，敌军照样会先动手，因此「对峙多久」不是一个可玩的策略选择。
    **The standoff timings are fixed.** The enemy always waits five seconds and dresses for 2.4 before it charges, whatever the difficulty or the faction; the lord may also never give an order, because the enemy attacks anyway — so "how long to stand off" is not a real decision.
32. **收拢队形会让人少的队伍挤在一起。** 幸存者补前排的规则只看槽位顺序，不看兵种；一队长枪兵与一队弓箭手减员后都会往前挤，视觉上可能比原来紧凑。
    **The closing ranks pack a thin squad tightly.** The survivors take the front slots in slot order regardless of the troop type, so a thinned spear squad and a thinned archer squad both bunch up and can look tighter than they started.
33. **800 人的帧率只在桌面 headless Chrome 里量过。** 30–60 的目标是在 Mac Mini M4 的桌面 Chrome 上达成的 60 FPS；真实手机（尤其低端机）与高 DPR 屏幕的绘制成本更高，尚未实测，必要时可以再加「单位多时省略血条 / 尘土 / 兵阶点」的降级。
    **The 800-soldier frame rate was only measured in headless Chrome on the desktop.** The 30–60 target is met with 60 FPS in desktop Chrome on a Mac Mini M4; a real phone (especially a low-end one) and a high-DPR screen cost more to paint and are still unmeasured, and a quality fallback (dropping health bars, dust and rank pips when many soldiers are on screen) can be added if needed.
34. **目标缓存让索敌变成近似。** 一名士兵最多会追着 0.18 秒前选中的目标走，网格也最多旧 0.12 秒；在士兵密集、目标频繁死亡的空档里，个别人的目标可能比全场扫描晚一点切换，胜负面不变，但逐帧结果与旧实现不完全一致。
    **The target cache makes targeting approximate.** A soldier can chase a target chosen up to 0.18 s ago, and the grid is at most 0.12 s old; in a thick fight where targets die often, an individual may switch a moment later than a full-field scan would, so the outcome stays sensible but frame-by-frame results differ slightly from the old implementation.

---

35. **委托只有三种衡量方式，也没有额外奖励。** 一份委托只能是「答对 N 题」「赢下 N 场」「招募 N 名士兵」，都读累计计数，因此不打仗、不做题就无法推进；完成后除了「可以花金币招募这位 NPC」之外不给金币或道具，委托本身就是招募的前置。
   **A job only measures three things, and it pays no loot.** A job is always "answer N questions", "win N fights" or "hire N soldiers", all read from lifetime counters, so a lord who neither fights nor studies cannot advance one; finishing it grants no gold or item — the reward is that the NPC may now be hired for gold.
36. **居民不会离开自己的城镇。** 他们在自家门口一两格内走动，没有跨城旅行、没有商队、也不会在你招募之外的方式消失；城镇里也没有守卫拦路、偷窃或商店讨价还价。
   **The townsfolk never leave their town.** They drift a step or two around their own doorstep; there is no travel between towns, no caravans and no way to lose one except hiring him. Nor does a town stop the lord at the gate, and nothing can be stolen or haggled over.
37. **随从只带一面旗子。** 他手下的兵在战场上是普通小队，只能按小队下命令；随从本人不上场作战 —— 他不会受伤，也不会替士兵挡箭，只有他的职业加成会作用于全军。
   **A companion is one banner, not a second general.** His soldiers are ordinary squads and take ordinary squad orders; the companion himself never steps onto the field — he cannot be hurt, he does not shield his men, and only his trade bonus reaches the army.
38. **城镇地图是生成的，不能建造或改造。** 布局按据点种子固定：能走、能进、能和人说话，但没有建造、没有拆房、也没有把村庄升级成城镇；村庄只有谷仓、集市、磨坊、水井、民居这几处。
   **The town map is generated and cannot be built on.** The layout is fixed by the settlement's seed: it can be walked, entered and talked in, but nothing can be built, no house can be moved and a village cannot grow into a town — a village only has its barn, market, mill, well and cottages.

## 4. 路线图 · Roadmap

Ordered roughly from "closest to the original spec" to "nice to have".
大致按「离原需求最近」到「锦上添花」排序。

1. **困难档的每日军饷与难度徽章** — `dailyWage` 已经算好但还没扣；下一步可以让困难档真正发军饷，并给不同难度的通关记录一个徽章或战绩标记。
   **Daily wages and difficulty medals** — `dailyWage` is computed but never charged; the next step is to make hard actually pay wages and to give each difficulty a medal or a record marker.
2. **局域网联机** — 世界状态共享与服务端权威战斗的轻量方案。*(原需求第 6 条)*
   **LAN multiplayer** — a lightweight shared world state with server-authoritative battles. *(spec item 6)*
3. **势力反攻与夺回据点** — 现在会补兵也会新刷强盗，但被消灭的王国部队不会重来；下一步让势力重新成军，并尝试夺回丢掉的地盘。
   **A faction counterattack and recaptured towns** — the parties reinforce and bandits keep coming, but a wiped kingdom party never returns; the next step is to let factions raise new armies and try to take their land back.
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
10. **战斗手感试玩** — 用真人试玩校对克制强度、队形差异与各命令的收益（远程小队的后撤路线已在批次 27 修好）。
   **Battle-feel playtest** — tune the counter strength, the formation differences and the payoff of each order with real plays; the ranged retreat route was fixed in batch 27.
11. **昼夜与扎营深度** — 给天数加昼夜色调（夜晚视野变小、远程命中下降），让扎营消耗军粮、恢复士气或招来夜袭，并让敌军按天补充兵力，使「原地等时间」既有代价也有收益。
   **Day/night cycle and deeper camping** — tint the map by time of day (shorter sight and weaker ranged fire at night), make camping consume supplies, restore morale or attract a night raid, and let factions replenish troops over days so waiting in place has both a cost and a payoff.
13. **分兵与拦截** — 让一支小队拆成 2–3 个小组各自下令，并给近战一个「拦截」命令（预判远程小队的退路而不是追着跑）；配合长枪兵的速度差与射手齐射后的短暂减速，解决「长枪兵永远追不上弓箭手」。
    **Splitting squads and interception** — let a squad break into two or three groups with their own orders and give melee an intercept order that cuts off a ranged squad's retreat instead of chasing it, paired with a spear speed edge and a short slowdown after a volley, to solve "spearmen never catch archers".
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

下面 17–22 条来自第 6 节的《战团》对照分析，优先级高于上面多数条目。
Items 17 to 22 come from the Bannerlord comparison in section 6, and outrank most of the ones above.

17. **战斗要有第三个结果：溃逃** — 给士兵加士气，压制与人数劣势会掉士气，归零的士兵掉头逃跑不再作战；战斗因此有「胜 / 负 / 溃逃」三种结果，围城与任务也能据此判定。只动 `battle.js` 与结算，不改存档结构，性价比最高。
    **A third outcome: routing** — every soldier gets morale; being pressed and outnumbered drains it, and a soldier at zero turns around and runs instead of fighting; a fight can then end in a win, a loss or a rout, which sieges and orders can judge as well. It touches `battle.js` and the settlement alone and changes no save shape, so it buys the most for the least.
18. **军令任务（任务系统）** — 城镇发布限时任务（讨伐贼首、护送商队、三天内招募 N 人、夺回村庄），用战役时钟当天数倒计时，完成给金币与声望，超期失败。现在地图上除了围城和强盗遭遇，没有「玩家想做的事」，这是最大的缺口。
    **Orders (a quest system)** — towns post timed orders (cut down a bandit chief, escort a caravan, recruit N men in three days, retake a village), counted down with the campaign clock and paid in gold and renown; failing costs nothing but the chance. Right now a siege and a bandit encounter are the only things that happen to the player, so this is the largest gap.
19. **声望系统** — 战斗、任务与比武都产出声望，声望解锁城镇爵位、提高驻军上限、开放更好的兵源。它是任务与比武的奖励货币，也是战团「扮演角色」的核心感受，应先于两者落地。
    **Renown** — battles, orders and tournaments earn renown, and renown unlocks town titles, raises the garrison cap and opens the better recruit stock. It is the currency the orders and the tournament pay out in and the core of Bannerlord's role-playing feel, so it should land before them.
20. **比武大会** — 城镇每隔几天办一场比武，用现成的 `createBattle()` / `stepBattle()` 打三轮（枪术 / 骑兵 / 混战），晋级与名次给声望和金币。现有战斗系统可以零改动复用，是性价比第二高的新玩法。
    **Tournaments** — a town holds a tournament every few days, fought with the existing `createBattle()` / `stepBattle()` over three rounds (spear, cavalry, mixed), with the placing paying renown and gold. The battle system is reused untouched, so it is the second-cheapest new feature.
21. **士气之外的战场深度：侧翼包围与新兵种** — 攻击来自侧后时给伤害加成，并加入弩手（慢、破甲）、弓骑兵（移动射击）、长戟兵（加强克制骑兵）三个家族，让「阵型 + 队形 + 兵种」三件事真正互相牵制。
    **Depth beyond morale: flanking and new families** — a blow from the flank or the rear gets a bonus, and three families join the roster — the crossbow (slow, armour-piercing), the mounted archer (shoots while moving) and the polearm (a stronger answer to cavalry) — so formations, orders and the roster really pull against each other.
22. **让学习真的变强：属性与技能** — 答对题目累积属性点（统御 / 医术 / 工程 / 谋略），分别影响队伍上限、伤兵恢复、攻城速度与任务时限；「考试 = 经验」把学与玩接成一条线，这是本作相对战团最该保留也最该强化的一点。
    **Make study actually stronger: attributes and skills** — every correct answer earns attribute points (leadership, surgery, engineering, tactics) that raise the party cap, the recovery rate, the siege speed and the time limit of an order; "an exam is experience" welds learning and playing into one line, and it is the one thing this game should keep — and push further — against Bannerlord.

下面 23–27 条来自第 7 节的学习主线分析，与第 12 / 13 / 22 条一起构成「做题主线」的完整计划。
Items 23 to 27 come from the exam-spine analysis in section 7 and, together with items 12, 13 and 22, they form the full plan for the learning side of the game.

23. **试卷结算层：连击、满分、长卷、及格加成** — 现在每答对一题都是同一个价，做得多与做得快没有区别；结算层给连击倍率（×1.0 → ×1.5）、满分 ×1.5、12 题卷 ×1.1 与及格 +20%；**答错不扣钱**，只是这一题没有金币、连击归零。
    **A paper settlement: streak, perfect, long paper, pass bonus** — every correct answer pays the same today, so doing more or doing faster makes no difference; the settlement gives a streak multiplier (×1.0 to ×1.5), ×1.5 for a perfect paper, ×1.1 for a twelve-question paper and +20% for reaching the pass line; **a wrong answer costs nothing**, it simply pays nothing and breaks the streak.
24. **答对直接掉道具，外加里程碑道具** — 现在「做题」只换金币，军粮与战马还得拿金币去买；答对掉军粮、整科全对掉集市券与征兵令、满分掉战马；累计答对数再解锁军旗（攻击 +5%）、徽章（战后 +10 金币）、药箱（恢复 +50%）、驿马（移速 +10%）四个永久道具。
    **Answers drop gear, and milestones drop more** — answering currently yields only gold, and food and horses still have to be bought with it; a correct answer drops food, a perfect subject drops a market voucher and a recruit order, a perfect paper drops a horse, and the lifetime correct count unlocks four permanent perks: the war banner (+5% attack), the badge (+10 gold after every battle), the medicine chest (+50% recovery) and the post horse (+10% speed).
25. **掌握度地图与复习队列** — 现在只有「已记录 N 题 / 掌握 M 题」两个总数，看不出哪科弱；由 `questionStats` 直接聚合出「科目 × 年级」的平均等级与已掌握数，再加一个「今天该复习的 N 题」队列，不用改存档结构。
    **A mastery map and a review queue** — the interface shows only two totals, so a weak subject is invisible; the existing `questionStats` aggregate straight into a per-subject and per-grade mastery map plus a "N questions to review today" queue, with no change to the save shape.
26. **战后复盘卷** — 打输之后给一次针对性的补考（按这次的敌人兵种或最弱的科目出卷），答对就恢复士气或补回几个兵；这是把「学习」与「打仗」缝在一起最自然的一步。
    **A post-battle revision paper** — after a loss the game offers a targeted paper (drawn from the enemy roster or the weakest subject) whose correct answers restore morale or a few soldiers; it is the most natural way to stitch learning and fighting together.
27. **数字填空题型与题目难度标签** — 数学题现在都是四选一，可以蒙；数据里已经有 `unit: 'number'`，把契约放宽成可选填空就能做数字输入；同时给题目加 `difficulty` 与 `tags`，才谈得上自适应出题和「挑战题」。
    **Fill-in-the-blank maths and question tags** — the maths questions are multiple choice today and can be guessed; the data already carries `unit: 'number'`, so relaxing the contract allows a typed answer, and adding `difficulty` and `tags` to the questions is what adaptive drawing and a challenge pool need.
28. **把更多题型换成填空与配对** — 批次 21 已经把契约放宽成四种形状，数学的算式填空、英语的拼写填空、语文的诗句配对与节气排序、逻辑的判断对错都已上线；下一步把分数、简便运算、单位换算、字词听写都换成相应形状。
    **More kinds in the new shapes** — the contract grew four shapes in batch 21 and the maths fill-in, the English spelling fill-in, the Chinese poem matching and solar-term ordering and the logic true-or-false are in; next the fractions, the short cuts, the units and the dictation all move over.
29. **题目难度与知识点标签** — 题目里还没有难度与知识点标签，出题只能靠记忆曲线；加上标签后就能「只考这一课」「按难度分层」「生成挑战卷」。
    **Question tags** — the questions carry no difficulty or topic yet, so the draw can only lean on the memory curve; with tags the game could ask for one lesson, sort by difficulty or build a challenge paper.
30. **每日目标与连击统计（跨天）** — 连击只在一张卷子里有效；把「今天答对 N 题」做成每日目标，再按天记录连击，学习节奏就有了回看。
    **A daily goal and a streak across days** — the streak only lives inside one paper; a daily goal of N correct answers and a streak counted per day would give the practice a history.
31. **老师工具：布置作业 + 学习报告导出** — 题库检索已经能看题了，再加一个「生成一份作业卷」与「导出掌握度报告」，家长与老师就能真正用起来。
    **Tools for the teacher** — with the bank in place, a way to build a homework paper and to export a mastery report would make the game usable by a parent or a teacher.

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

### 5.16 批次 18 反击与队形校验 · Batch 18 counterattack and formation harness

`tools/verify-battle.mjs` 增加 6 项检查，守住「被打了就还手」与「攻击不乱队形」这两条规则。
Six checks in `tools/verify-battle.mjs` guard the two new rules: answer an attack, and keep the formation while attacking.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-battle.mjs` | **76 项检查全部通过**（新增 12 项）：士兵**记住最后一个攻击者**（近战与远程箭矢都记录）、**转身还手**（哪怕身边还有更近的敌人）、挨了打确实掉血；攻击时**队形保持**（小队的实际宽度不小于队形宽度的 60%）、**各排仍有距离**（不会一拥而上）、两边都有伤亡（攻击不是摆设）。另外 12 场战斗仍然都能在两分钟内分出胜负；**队形会呼吸**（士兵不是僵硬的网格、个人空间不会大到破坏队形、挨打会被推开）；**随机队形也会打**（散兵队形下每个士兵自己扑向敌人，这一场能分出结果且不会卡住）。**All 76 checks passed** (twelve new ones): the soldier **remembers its last attacker** (both melee blows and arrows record it), **turns to answer it** even when a nearer enemy stands next to it, and really lost hit points; **the formation holds while attacking** (the squad keeps at least 60% of its formation width), **the ranks keep their distance** instead of mobbing the enemy, and both sides take losses (the attack is not harmless); **the formation breathes** (the soldiers are not a rigid grid, the personal space stays small enough to keep the formation, a blow shoves a soldier aside); **the scattered formation fights too** (every soldier closes on the foe itself, that fight resolves and does not stall). The twelve battles still all resolve inside two minutes. |

### 5.17 批次 22 难度重做校验 · Batch 22 difficulty redesign harness

`tools/verify-difficulty.mjs` 把新难度的数值写成契约：普通档必须与旧版一模一样，困难档约为普通的 74%，练习档封顶，威胁随战功上升且按档封顶；`verify-quiz.mjs` / `verify-battle.mjs` / 真实 Chrome 走查同步更新。
`tools/verify-difficulty.mjs` turns the redesign into a contract: normal must match the shipped game exactly, hard pays about 74% of normal, the practice paper is capped, and the threat rises with the record and is capped per level; `verify-quiz.mjs`, `verify-battle.mjs` and the real-Chrome walkthrough were updated with it.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-difficulty.mjs` | **58 项检查全部通过**：普通档 5 / 8 / 12 题全对仍是 **239 / 410 / 677**，困难为 **176 / 302 / 499**，简单为 **50 / 80 / 120**（封顶生效，弱卷不封顶）；三档单价、开局金币与军粮、每战军粮、招募价严格单调；威胁从 1.0 起、随胜场与城镇上升、普通封顶 1.8、困难封顶 2.0、永不低于 1；同一种子下困难开局敌军更多、简单更少；城镇招募价按档变化；`world.threat` getter 与真实补兵都按难度和威胁工作，封顶成立。**All 58 checks passed**: normal still pays **239 / 410 / 677** for a perfect 5 / 8 / 12-question paper, hard pays **176 / 302 / 499** and easy **50 / 80 / 120** (the cap binds, a weak paper is untouched); the price, the opening gold and food, the food per battle and the recruit markup all rise monotonically; the threat starts at 1.0, rises with wins and towns, is capped at 1.8 normal and 2.0 hard and never drops below 1; the same seed fields more enemies on hard and fewer on easy; the town prices follow the level; and the `world.threat` getter plus the real reinforcement pass follow the difficulty and the threat with the ceiling holding. |
| `node tools/verify-quiz.mjs` | **135 项检查全部通过**：新增练习档封顶（12 题全对 120、3 / 5 的弱卷不封顶）、困难档单价（三年级 14、四年级 19）与练习档开局 150 金 / 8 粮；原有结算、掉落、掌握度、经验与存档检查全部通过。**All 135 checks passed**, including the new practice cap (120 for a perfect 12-question paper, untouched for a 3 / 5 paper), the hard prices (14 in grade 3, 19 in grade 4) and the practice start (150 gold, 8 food); the settlement, the drops, the mastery, the experience and the save checks all still pass. |
| `node tools/verify-battle.mjs` | **90 项检查全部通过**：困难档单价改为三年级 14 / 四年级 19、逻辑 19；新增开局资源、每战军粮、招募价、练习档封顶、威胁封顶与敌军规模 / 上限的检查；战斗、地形、队形、围城与存档检查保持通过。**All 90 checks passed**: the hard price is now 14 in grade 3 and 19 in grade 4 (19 for logic), with new checks for the opening resources, the food per battle, the recruit markup, the practice cap, the threat caps and the enemy size / ceiling; the battle, terrain, formation, siege and save checks still pass. |
| `node tools/verify-battle-browser.mjs` | 真实 Chrome（headless + CDP）：**25 项检查全部通过**：首页三项难度可点、说明跟着档位换成「挑战 / 封顶」；世界地图 🎚 芯片带威胁，面板列出威胁、军粮与招募价；战斗、地形、镜头、围城与「取消围城」照旧；控制台 0 报错。Real Chrome (headless over CDP): **all 25 checks passed** — the three levels can be picked and the note follows them (「挑战」 / 「封顶」); the 🎚 chip carries the threat and the sheet lists the threat, the food and the recruit price; the battle, terrain, camera and siege flow still work; the console stays clean. |
| `npm run build` | 生产构建通过，无警告。The production build passes without warnings. |

### 5.18 批次 23 城镇慢钟与战场动画校验 · Batch 23 slow town clock and battle animation harness

`verify-settlements.mjs` 把「城镇 1 秒 = 1 分钟」写成契约；`verify-battle.mjs` 检查动画数学与触发；真实 Chrome 走查确认战斗里确实出现了出手与受击的计时。
`verify-settlements.mjs` turns 「one town second is one game minute」 into a contract, `verify-battle.mjs` checks the animation maths and its triggers, and the real-Chrome walkthrough confirms the strike and hit timers really fire in a fight.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-settlements.mjs` | **131 项检查全部通过**（新增 5 项）：城镇里 1 秒走到 00:01、60 秒走到 01:00、1439 秒仍是同一天的 23:59、第 1440 秒天数加一并回到 00:00，休整状态记在据点上；世界地图的 24 秒一天、昼夜、围城与经济检查保持通过。**All 131 checks passed** (five new): one second in town reads 00:01, sixty seconds read 01:00, 1439 seconds are still 23:59 of the same day and the 1440th second turns the day over to 00:00, with the resting settlement recorded; the 24-second world day, day/night, siege and economy checks still pass. |
| `node tools/verify-battle.mjs` | **111 项检查全部通过**（新增 21 项）：跳动只在行军时出现、站定时呼吸；前倾在挥击中间最大、两端归零；受击晃动会衰减；重伤才会侧倾；尘土只在移动时扬起；死亡姿态在 0.9 秒内倒下、下沉并淡出；真实战斗里 `swing` 与 `hitFlash` 都会触发。战斗、地形、队形、难度与围城检查保持通过。**All 111 checks passed** (twenty-one new): the hop only appears while marching and a standing soldier breathes; the lunge peaks in the middle of a swing and rests at both ends; the hit shake fades; only a wounded soldier lists; dust rises only on the move; the death pose tips, drops and fades within 0.9 s; and both `swing` and `hitFlash` fire in a real fight. The battle, terrain, formation, difficulty and siege checks still pass. |
| `node tools/verify-battle-browser.mjs` | 真实 Chrome（headless + CDP）：**26 项检查全部通过**（新增 1 项）：战斗里确实出现出手与受击的计时，慢 / 正常 / 快速、地形、镜头、围城与「取消围城」照旧；控制台 0 报错。Real Chrome (headless over CDP): **all 26 checks passed** (one new) — the strike and hit timers really fire in a fight, and the speeds, terrain, camera and siege flow still work; the console stays clean. |
| `npm run build` | 生产构建通过，无警告。The production build passes without warnings. |

### 5.19 批次 24 遇敌对话与逃跑校验 · Batch 24 meeting and fleeing harness

`verify-encounter.mjs` 把「遇敌先说话、逃跑退开 3–6 格、冷却期间不再遭遇」写成契约；真实 Chrome 走查从预置存档直接触发遭遇，点完三个选项。
`verify-encounter.mjs` turns 「talk first, run 3–6 tiles, no second meeting during the cooldown」 into a contract, and the real-Chrome pass triggers a meeting from a seeded save and clicks through all three choices.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-encounter.mjs` | **50 项检查全部通过**：三势力都有开场白与回话、台词长度适合手机、同种子同台词；三个势力的头像都是 `commander/` 素材；名册按兵种计数；逃生点在平坦地图上是 3–6 格、全部可站立、都在敌人反方向，水域与山地被跳过，整张水面的地图给不出逃生点；对话打开后 1 秒内天数、时钟与敌军位置都不动，且不会自动开战；逃跑后遭遇关闭、敌人冷却 30 秒、主角真的跑出 2 格以上、不损失士兵；冷却期间同一敌人不再触发，冷却过后会再次拦住；点开战能得到一场真正的队伍战。**All 50 checks passed** — the three factions talk and answer, lines fit a phone and a seed repeats its line; all three portraits come from `commander/`; the roster counts every troop; an open map gives a 3–6 tile escape on walkable ground away from the enemy, water and mountains are skipped and a water-only map gives none; during the meeting the day, clock and enemy hold still for a second and no battle starts; running closes the meeting, sets a 30-second cooldown, really moves the lord more than two tiles and costs no soldier; the same party stays away during the cooldown and catches him again afterwards; and the fight option opens a real party battle. |
| `node tools/verify-encounter-browser.mjs` | 真实 Chrome（headless + CDP）：**26 项检查全部通过**（新增 26 项）：对话框在战斗之前弹出、战斗没有自动开始、头像图片真的加载（`/pixel/commander/bandit.png`）、敌方 6 兵与两个兵种都显示、三个选项齐全；两次「喊话」得到不同回答；「逃跑」关闭对话框、敌人进入冷却、主角离敌人更远且兵员与金币不变；重新靠近后「开战」真的进入战场（`kind = party`，敌方 6 人）；控制台 0 报错。Real Chrome (headless over CDP): **all 26 checks passed** — the card opens before the battle, the battle does not start by itself, the portrait image really loads (`/pixel/commander/bandit.png`), the six enemy troops and their two kinds are listed and all three choices are there; two 「喊话」 taps bring different answers; 「逃跑」 closes the card, cools the enemy down and moves the lord farther away with the same soldiers and the same purse; walking back in and tapping 「开战」 really opens the arena (`kind = party`, six enemies); the console stays clean. |
| `npm run build` | 生产构建通过，无警告。The production build passes without warnings. |

### 5.20 批次 25 开局对峙与手动下令校验 · Batch 25 standoff and orders harness

`verify-battle.mjs` 把「开局双方驻守、敌军变阵后冲锋、主角下令才推进、减员收拢队形」写成契约；真实 Chrome 从预置存档进入战场，读回提示条并点下「⚔️ 全军出击」。
`verify-battle.mjs` turns 「both sides hold, the enemy dresses and charges, only the lord's order advances his line, the ranks close up」 into a contract, and the real-Chrome pass enters an arena from a seeded save, reads the banner and clicks 「⚔️ 全军出击」.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-battle.mjs` | **138 项检查全部通过**（新增 19 项）：开局双方所有小队都是 `defend`、`opening` 从 `wait` 开始、1 秒内两边阵线都没动；5 秒后敌军进入 `dress` 并换阵型（远程一线 / 近战楔形），此时仍然原地驻守；再过 2.4 秒全军转为 `attack` 并在 3 秒内真的压上来；主角先下攻击令会跳过等待（`dress`），约 0.8 秒后敌军应战；先打中敌人同样会提前；「全军出击」一次让所有小队攻击；练兵没有对峙、仍保持原有的自由攻击。战斗速度、地形、绕湖、反击、队形与围城检查保持通过。**All 138 checks passed** (nineteen new): both sides open on `defend`, the `opening` starts in `wait` and neither line moves within a second; after five seconds the enemy reaches `dress` and changes formation (ranged into a line, melee into a wedge) while still holding; 2.4 seconds later every enemy squad turns to `attack` and really closes in within three seconds; the lord's attack order skips the wait and the enemy answers in about 0.8 s; a first blow does the same; 「全军出击」 orders every squad; and a drill has no standoff and keeps its free attack. The speed, terrain, path-around-the-lake, counterattack, formation and siege checks still pass. |
| `node tools/verify-battle-browser.mjs` | 真实 Chrome（headless + CDP）：**31 项检查全部通过**（新增 5 项）：进战场时 `opening.phase = wait`、双方小队都是 `defend`、底部提示条写着「对峙」并带「⚔️ 全军出击」；真的点它会读到每支小队都变成 `attack`、`opening` 离开 `wait`；随后的速度、地形、出手 / 受击计时与镜头检查照旧；控制台 0 报错。Real Chrome (headless over CDP): **all 31 checks passed** (five new) — entering the arena leaves `opening.phase = wait` with both sides on `defend` and the banner reading 「对峙」 with 「⚔️ 全军出击」; a real click turns every squad to `attack` and moves `opening` out of `wait`; the speed, terrain, strike/hit timers and camera checks still pass; the console stays clean. |
| `npm run build` | 生产构建通过，无警告。The production build passes without warnings. |

### 5.21 批次 26 每战一张新地图校验 · Batch 26 fresh battlefield harness

`verify-battle.mjs` 把「每场战斗重新生成战场、同种子可复现、湖泊不贴边也不进列阵区、预设仍有该有的地形」写成契约，另外用 60 个随机种子压测「战斗都能结束、无人开局站在深水里」。
`verify-battle.mjs` turns 「a new field every battle, the same seed rebuilds it, the lake stays off the edge and out of the deployment bands, a preset keeps its ground」 into a contract, and a stress run over sixty random seeds checks that every fight still ends with nobody standing in deep water.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-battle.mjs` | **150 项检查全部通过**（新增 12 项）：12 个种子得到 12 张不同布局、同一 `generateArenaTerrain(7919)` 两次结果一致、每张布局都含全部五种地形；20 个种子的湖泊没有一个格子贴到战场边缘或落进左右列阵区；六种预设仍各自带该有的地形（平原只有平原）；12 张随机战场上没有一个士兵或指挥官开局站在深水里。原有的对峙、地形、绕湖、反击、队形、十二场战斗与围城检查保持通过。**All 150 checks passed** (twelve new): twelve seeds give twelve different layouts, `generateArenaTerrain(7919)` rebuilds the same field twice, every layout holds all five kinds of ground; across twenty seeds no lake cell touches the edge or a deployment band; each preset keeps its own ground (plain has nothing else); and on twelve random fields no soldier or commander starts in deep water. The standoff, terrain, path-around-the-lake, counterattack, formation, twelve-battle and siege checks still pass. |
| `npm run build` | 生产构建通过，无警告。The production build passes without warnings. |

### 5.22 批次 28 战斗界面拖动、帧率与退出校验 · Batch 28 drag, frame rate and exit harness

`verify-battle-browser.mjs` 在真实 Chrome 里发真正的鼠标拖动与触摸拖动（不是直接调 store），读回镜头与指挥官位置，并真的执行一次 `history.back()` 确认战斗没有被退出。
`verify-battle-browser.mjs` sends a real mouse drag and a real touch drag in Chrome (not a call to the store), reads the camera and the commander back, and runs a real `history.back()` to confirm the battle is not left.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-battle-browser.mjs` | **42 项检查全部通过**（新增 11 项）：帧率芯片有数字、真的测到大于 0 的帧率、带颜色档位与最慢一帧的说明；鼠标拖动真的平移了镜头并停止跟随、拖动没有移动指挥官；触摸拖动同样停止跟随；点 🎯 恢复跟随；不带拖动的轻点仍然移动指挥官；`history.back()` 后仍在战斗里并弹出提示条；命令栏的背景是透明的、按钮各自带面板；控制台 0 报错。**All 42 checks passed** (eleven new): the frame-rate chip has a number, a rate above zero, a tone class and a slowest-frame note; a real mouse drag pans the camera and stops the follow without moving the commander; a real touch drag stops the follow too; 🎯 restores it; a tap without a drag still moves the commander; a real `history.back()` leaves the battle running and shows the note; the command bar is transparent while the chips and orders keep their own panels; the console stays clean. |
| `npm run build` | 生产构建通过，无警告。The production build passes without warnings. |

### 5.23 批次 29 大战场帧率校验 · Batch 29 big-battle frame rate harness

`verify-perf-browser.mjs` 在真实 Chrome 里开一场 400 v 400 的快速战斗，等双方接战后再采样 6 秒，避免把开局对峙当成负载；同时读回命令栏与画布，确认性能优化没有把界面更新或绘制弄坏。
`verify-perf-browser.mjs` opens a 400 v 400 quick battle in real Chrome, waits until the armies meet before sampling six seconds so the standoff is not mistaken for the load, and reads the command bar and the canvas back to prove the optimisation did not break the interface or the painting.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-perf-browser.mjs` | **9 项检查全部通过**：800 名士兵在场；双方接战；6 秒采样为 **60 FPS**（p50 16.7 ms、p95 16.8 ms、最慢 16.8 ms），≥30 FPS 与 p95 ≤50 ms 两条断言均通过；阵亡让存活数下降；`stamp` 在采样期间前进；顶部兵力文字发生变化；画布不是空白；控制台 0 报错。同一场景在改动前为 **8 FPS**（p50 133.3 ms）。**All 9 checks passed**: 800 soldiers on the field; the armies meet; the six-second sample reads **60 FPS** (p50 16.7 ms, p95 16.8 ms, worst 16.8 ms), clearing both the ≥30 FPS and p95 ≤50 ms assertions; casualties bring the alive count down; `stamp` advances during the sample; the top bar's strength text changes; the canvas is painted; and the console stays clean. The same scene read **8 FPS** (p50 133.3 ms) before the change. |
| `node tools/verify-battle-browser.mjs` | 44 项全部通过（新增 2 项）：点下「⚔️ 全军出击」后对峙提示条真的从 DOM 里消失、底部提示不再写着「对峙」；拖动、帧率芯片、返回、提示条与透明命令栏未受性能改动影响。All 44 checks pass (two new): after a real 「⚔️ 全军出击」 click the banner really leaves the DOM and the hint stops saying 「对峙」; dragging, the frame-rate chip, the back button, the note and the transparent command bar are untouched by the performance work. |
| `node tools/verify-quick-battle-browser.mjs` | 36 项全部通过。All 36 checks pass. |
| `npm run build` | 生产构建通过，无警告。The production build passes without warnings. |

### 5.24 批次 30 手机战场与冲锋校验 · Batch 30 phone battlefield and charge harness

`verify-battle-mobile-browser.mjs` 用真实 Chrome 的 390 × 844（dpr 3、触摸）手机视口开一场真实的战役战斗，量出每一块面板的矩形、互相的重叠、按钮的拇指尺寸与两条栏之间留给战场的净空，再发真正的手指拖动把镜头拖出战场四边。
`verify-battle-mobile-browser.mjs` opens a real campaign battle in Chrome with a 390 x 844 phone viewport (dpr 3, touch on), measures every panel's rectangle, the overlaps, the thumb size of the buttons and the clear field between the two bars, then sends real finger drags to push the camera past all four edges of the field.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-battle.mjs` | **168 项检查全部通过**（新增 12 项）：战场面积约为旧战场的两倍、格子数随战场（35 × 24）；远处的近战士兵真的冲刺、1 秒走出 100 px 以上、体力下降；停下命令立刻取消冲刺；2.5 秒后体力耗尽并进入疲劳；齐射后的弓箭手 1 秒走的距离不到正常时的 80%（且仍在走）；一次射击会点亮减速计时；贴到 20 px 时弓箭手不再放箭。**All 168 checks passed** (twelve new): the field covers about twice the old area with the grid following it (35 x 24); a distant melee soldier really sprints, covering over 100 px in one second while its stamina drops; a hold order cancels the sprint at once; the burst is spent after 2.5 s and leaves the soldier tired; an archer slowed by a volley covers under 80 percent of its normal ground in a second (and still walks); a shot lights the slow clock; and an archer with a foe 20 px away does not loose. |
| `node tools/verify-battle-mobile-browser.mjs` | **24 项检查全部通过**：390 × 844 视口、页面不横竖滚动；画布fullscreen；顶栏与工具不重叠、都在屏幕内、顶栏文字不被截断；两条栏之间留出 **580 px（69%）** 净空、命令栏不超过屏幕的三分之一；底部提示不在机身外；每个按钮都 ≥38 px；开局两支军队全部在画面内（缩放 0.42）；手指拖动真的平移镜头；镜头停在右边缘的缓冲（屏幕上留出 **140 px** 空地）、左边缘同样；点 🎯 恢复跟随；换成快速战斗（多一个「← 返回」按钮、工具最宽）后顶栏仍不被工具压住、文字不被截断、返回按钮留在屏幕内；控制台 0 报错。**All 24 checks passed**: a 390 x 844 viewport with no sideways or vertical page scroll; the canvas fills the screen; the top bar and the tools neither overlap nor leave the screen and the top-bar text is not cut off; **580 px (69 percent)** of clear field sits between the bars and the command bar stays under a third of the screen; the bottom hint stays on the phone; every button is at least 38 px; both armies are on screen at the opening (zoom 0.42); a finger drag really pans; the camera stops at the right-edge buffer (**140 px** of ground on screen) and the left one too; 🎯 restores the follow; a quick battle (which carries the extra back button and therefore the widest tools) keeps the top bar clear of the tools, its text unclipped and the back button on screen; and the console stays clean. |
| `node tools/verify-battle-browser.mjs` | 44 项全部通过（战场的尺寸改为从 terrain 读取，不再写死 1000 × 680）。All 44 checks pass (the field size now comes from the terrain instead of a hard-coded 1000 x 680). |
| `node tools/verify-perf-browser.mjs` | 9 项全部通过：800 名士兵仍然 **60 FPS**（p50 16.7 ms、p95 16.8 ms）。All 9 checks pass: 800 soldiers still hold **60 FPS** (p50 16.7 ms, p95 16.8 ms). |
| `node tools/verify-quick-battle-browser.mjs` | 36 项全部通过。All 36 checks pass. |
| `node .agents/skills/kids-war-game-testing/scripts/run-checks.mjs --browser` | 20 个步骤全部符合预期（新增手机战斗走查一步）。All 20 steps behaved as expected (the phone battle pass is one new step). |
| `npm run build` | 生产构建通过，无警告。The production build passes without warnings. |

### 5.25 批次 36 城镇 / 委托 / 随从校验 · Batch 36 town, quest and companion harness

城镇场景是「据点 → 场景」的纯函数，因此可以在 node 里重建出与浏览器完全一致的布局；委托与随从走真实的 Pinia store；最后用真实 Chrome 点像素走一遍。
The town scene is a pure function of the settlement, so the very same layout can be rebuilt in node; the quest and companion rules run through the real Pinia stores; and a real Chrome pass then taps actual pixels.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-town.mjs` | **108 项检查全部通过**：城镇 34 × 26、村庄 26 × 20；城镇必有议事厅 / 集市 / 兵营 / 学堂 / 酒馆 / 医馆 / 铁匠铺 / 民居，村庄必有谷仓 / 集市 / 磨坊 / 民居 / 水井；每扇门都站在可行走地面、每个建筑占地格都不可走、每扇门与每位居民都能从城门走到；同一据点重建两次布局完全一致且命中缓存；**整张世界地图的 32 个据点全部布局干净**；八个职业都有名字与素材；委托记录只在你按下「接受委托」时写下、`base` 记的是当天计数（之前攒的 5 题 / 2 胜 / 3 兵不算）、未接的委托不能招募、放弃后可以重接；随从转移士兵会真的把兵从队伍移到旗下（连同伤口）、上限精确停在 4–6、收回与解散都能把兵还回去；`createBattle({allyTroops})` 生成带 `owner` 的友军小队、`survivorsByType(…, null)` 只数领主的兵、跑满 60 秒模拟后两池之和等于玩家侧总数；存档写入 / 读回 `companions` 与 `quests`，旧存档按「没有随从、没有委托」处理。
**All 108 checks pass**: a town is 34 x 26 and a village 26 x 20; a town holds the hall, market, barracks, school, tavern, hospital, smithy and houses, and a village its barn, market, mill, houses and well; every door stands on open ground, every footprint is unwalkable, and every door and every townsperson can be walked to from the gate; rebuilding a settlement twice gives the same layout and hits the cache; **all 32 settlements of the map lay out cleanly**; the eight trades all carry a name and a sprite; a quest record is only written when 「接受委托」 is pressed and its `base` is the counter of that day (the five answers, two wins and three recruits earned earlier do not count), an unaccepted job cannot be hired for, and an abandoned one can be taken again; transferring soldiers really moves them out of the warband into a banner with their wounds, the limit stops at four to six exactly, and both recall and dismiss hand them back; `createBattle({allyTroops})` builds tagged ally squads, `survivorsByType(…, null)` counts only the lord's soldiers, and after sixty seconds of simulation the two pools add up to the whole player side; a save round-trips `companions` and `quests`, and an old save loads with neither.
| `node tools/verify-town-browser.mjs` | **29 项检查全部通过**（真实 Chrome，1280 × 1100）：画布铺满、场景居中、像素真的画上去了、`/pixel/index.json` 有 57 条且城镇素材 39 张都能取到；点一户人家门口 → 主角真的走过去并弹出该建筑的面板；点一位可招募居民 → 先出现「?」的委托、「📜 接受委托」按下后变「✅ 已接下」并进入委托日志；把统计推到目标 → 招募按钮解禁、点下去队伍多一人；「👥 随从」里点「给他」→ 随从旗下从 0 变 1；城镇时钟在走动；「📜 委托」在城镇与世界地图都能打开，已完成的那条显示为绿色；控制台 0 报错。
**All 29 checks pass** in real Chrome at 1280 x 1100: the canvas fills the window, the scene is centred and really painted, `/pixel/index.json` serves 57 rows with all 39 town sprites reachable; tapping a house door walks the lord there and opens that building's panel; tapping a recruitable townsperson shows his 「?」 job, and 「📜 接受委托」 turns it into 「✅ 已接下」 and writes it into the log; pushing the counters to the target enables the hire button and one tap adds him to the party; 「给他」 in 「👥 随从」 moves the banner from 0 to 1; the town clock keeps running; 「📜 委托」 opens from both the town and the world map with the finished job in green; and the console stays clean.
| 其余无头校验 Other headless suites | `verify-battle` **168**、`verify-general` **150**、`verify-settlements` **146**、`verify-upgrade` **99**、`verify-training` **62**、`verify-difficulty` **58**、`verify-quick-battle` **58**、`verify-quiz` **135**、`verify-chinese` **32**、`verify-encounter` **50**、`verify-atlas` **10** —— 全部通过（战斗的 `createBattle` 与存档字段改动没有破坏旧规则）。
`verify-battle` **168**, `verify-general` **150**, `verify-settlements` **146**, `verify-upgrade` **99**, `verify-training` **62**, `verify-difficulty` **58**, `verify-quick-battle` **58**, `verify-quiz` **135**, `verify-chinese` **32**, `verify-encounter` **50** and `verify-atlas` **10** — all pass, so the `createBattle` and save-field changes broke no older rule.
| 素材回归 Asset regression | 抽出 `pixkit.mjs` 后重新生成 `unit/militia.png` 与 `settlement/town.png`，shasum 与改动前 **逐字节一致**。After the `pixkit.mjs` split, regenerating `unit/militia.png` and `settlement/town.png` gives a **byte-identical** shasum to the files before the change.
| `npm run build` | 生产构建通过。The production build passes. |


### 5.26 批次 37 随从跟随校验 · Batch 37 companion follow harness

队形是纯函数，所以它的位置可以逐条断言；「有没有画上去」则由真实 Chrome 截图与面板结构确认。
The formation is a pure function, so its slots can be asserted one by one; whether it is actually painted is confirmed by a real Chrome pass and its screenshots.

| 脚本 Script | 结果 Result |
| --- | --- |
| `node tools/verify-town.mjs` | **123 项检查全部通过**（新增 15 项）：每位随从都拿到槽位、整队都在主角身后（向南走时 y 更小）、没人站在主角身上（距离 > 0.5 格）、第一排两人并排、第二排更靠后、人越多队形越开；向北走则整队在南、向东走则整队在西（转身时整体翻转）；主角站定也照常列队；空队伍没有槽位；同一输入槽位稳定；追赶函数在 200 帧后收敛到槽位 0.02 格内、不会越过目标、单帧 5 秒也不会冲过头。
**All 123 checks pass** (fifteen new): every companion gets a slot, the whole train stands behind the lord (smaller y when he walks south), nobody stands on him (further than 0.5 tiles), the first pair walks abreast, the second pair further back and the party opens out as it grows; walking north puts the train south and walking east puts it west, so turning around turns the whole party; a standing lord still lays it out; an empty party has no slots; the slots are stable for the same input; and the catch-up function closes to within 0.02 tiles in two hundred frames, never overshoots and survives a single five-second frame.
| `node tools/verify-town-browser.mjs` | **33 项检查全部通过**（新增 4 项，真实 Chrome）：世界地图顶部有「👥 随从 1」芯片、点开能打开随从面板、面板只挂载一份且列出城里招来的那位随从；截图 `09-world-followers.png` 里主角正在走动、随从跟在身后。First 29 checks unchanged plus four new ones in real Chrome: the world map carries a 「👥 随从 1」 chip, tapping it opens the companion panel, exactly one panel is mounted and it lists the companion hired in town; the screenshot `09-world-followers.png` shows the lord walking with his companion behind him.
| 其余校验 Other suites | `verify-battle` 168、`verify-general` 150、`verify-settlements` 146、`verify-upgrade` 99、`verify-training` **62**、`verify-difficulty` 58、`verify-quick-battle` 58、`verify-quiz` 135、`verify-chinese` 32、`verify-encounter` 50、`verify-atlas` 10 —— 全部通过，`npm run build` 通过。
`verify-battle` 168, `verify-general` 150, `verify-settlements` 146, `verify-upgrade` 99, `verify-training` **62**, `verify-difficulty` 58, `verify-quick-battle` 58, `verify-quiz` 135, `verify-chinese` 32, `verify-encounter` 50 and `verify-atlas` 10 — all pass, and `npm run build` passes.


---

| 日期 Date | 内容 Change |
| --- | --- |
| 2026-10-25 | 批次 37：**随从跟着走** —— 招募的随从不再只在城镇里出现：主角行走时他们排在身后（两人一排、逐排后移），停下时围在身后，夜里与主角共享提灯；小地图上主角点周围多出一圈随从小点，详细全图用同一套槽位画出随从像素小人；世界地图顶部新增「👥 随从 N」芯片，路上即可打开随从面板分配士兵；新增 `src/game/followers.js`（槽位 / 追赶 / 起伏），`verify-town` 123 项、`verify-town-browser` 33 项全过；版本升到 **v0.0.18**。Batch 37: **a companion rides along** — a recruited companion no longer appears only inside a town: he walks in a train behind the lord (two abreast, each pair further back), stands behind him when he stops and shares his lantern at night; the minimap grows a ring of follower dots around the lord's dot while the atlas draws their sprites in the same slots; the world map gained a 「👥 随从 N」 chip that opens the companion panel on the road; new `src/game/followers.js` (slots, catch-up, bob); `verify-town` at 123 and `verify-town-browser` at 33 pass; the version moves to **v0.0.18**. |
| 2026-10-25 | 批次 36：**走进城镇：居民、委托与随从** —— 据点变成可以走动的场景（城镇 34 × 26、村庄 26 × 20），主街 / 广场喷泉 / 房屋与设施按桶子确定性布局，点地面寻路、点房子走到门口、点人走过去说话，居民在自家门口游走并头顶「?」「!」「✓」；每城 7 位（村庄 4 位）有名字的居民，八个职业各三到五句台词；委托必须按「📜 接受委托」才开始计数（`base` 记当天统计），城镇与世界地图都有「📜 委托」日志，做完可一键回城；委托完成后花 110–200 金招为随从，再把士兵交给他的旗子（4–6 人上限，伤口随人走），参战时形成以他命名的小队、伤亡分开结算；新增 39 张 32×32 城镇像素素材（`pixkit.mjs` + `generate-town.mjs`），清单扩到 57 张；`verify-town` 108 项、`verify-town-browser` 29 项全过，其余无头校验全绿；版本升到 **v0.0.17**。Batch 36: **towns you can walk through, with their people, jobs and companions** — the settlement became a scene (34 x 26 for a town, 26 x 20 for a village) with a deterministic main street, square fountain, houses and facilities; tap the ground to path, a house to walk to its door, a person to walk over and talk, with townsfolk drifting around their doorsteps under 「?」「!」「✓」 marks; seven named townsfolk per town (four per village) across eight trades with three to five lines each; a job only starts counting when 「📜 接受委托」 is pressed (`base` is that day's counter), the log opens from the town and from the world map and walks the lord back once a job is done; a finished job lets 110–200 gold hire the NPC as a companion, whose banner takes four to six of the lord's own soldiers (wounds travel with them) and fights as squads named after him with casualties settled separately; 39 new 32 x 32 town sprites landed through `pixkit.mjs` + `generate-town.mjs` for 57 in the manifest; `verify-town` (108) and `verify-town-browser` (29) pass and every older suite stays green; the version moves to **v0.0.17**. |
| 2026-10-23 | 批次 30：**手机战场、拖动缓冲与大战场冲锋** —— 战场面积翻倍（1000 × 680 → **1400 × 960**，约 1.98 倍面积、35 × 24 格），两军相距 784 px，开局多出四成时间排兵布阵；镜头可拖出地图边缘 **140 px** 看到外围空地；390 × 844（dpr 3）手机实测顶栏不再截断、命令栏 256 → **220 px**、中间留出 580 px（69%）净空、开局缩放 **0.42** 让两支军队同时入镜；近战在 90 px 外冲刺（+30%），2.5 秒后疲劳 2.5 秒；弓箭手齐射后 0.9 秒内只有 0.72 倍速度、32 px 内无法开弓且只能以 0.85 倍速度后撤；同数量对局长矛兵 8v8 只赢 1/5、20v20 惨胜 5/5（剩 7–11 人、27–38 秒），民兵 0/5、骑兵 5/5；新增 `tools/verify-battle-mobile-browser.mjs`（24 项），`verify-battle` 168 项（新增 12 项），其余浏览器走查全过；版本升到 **v0.0.11**。Batch 30: **a phone battlefield, a drag buffer and the charge** — the field covers twice the ground (1000 x 680 to **1400 x 960**, about 1.98 times the area with 35 x 24 cells) and the armies start 784 px apart, leaving forty percent more time to form up; the camera drags **140 px** past the map edge to show the surrounding ground; on a 390 x 844 (dpr 3) phone the top bar is no longer clipped, the command bar shrinks from 256 to **220 px**, **580 px (69 percent)** of clear field remains between the bars and the **0.42** opening zoom puts both armies on screen; a melee soldier sprints beyond 90 px (+30 percent) then tires for 2.5 s; an archer is slowed to 0.72 speed for 0.9 s after a volley, cannot draw under 32 px and can only back away at 0.85 speed; in equal fights spearmen win only 1/5 at 8v8 but 5/5 at 20v20 with a heavy cost (7–11 of 20 left after 27–38 s), militia lose 0/5 and cavalry win 5/5; added `tools/verify-battle-mobile-browser.mjs` (24 checks), `verify-battle` is at 168 (12 new) and the other browser passes still hold; the version moves to **v0.0.11**. |
| 2026-10-23 | 批次 29：**800 人战场稳定 60 帧** —— 400 v 400（800 名士兵）的快速战斗在桌面 headless Chrome 里从 **8 FPS**（p50 133.3 ms）提到 **60 FPS**（p50 16.7 ms、p95 16.8 ms），帧率芯片与兵力数字照常刷新。索敌从「每帧扫描全场」改为 90 px 网格按圈搜索（每 0.12 秒重建）+ 每名士兵 0.18 秒目标缓存（按 `id` 相位错开）；视线检查只在敌人进入攻击距离时才做，邻居推挤改用平方距离；四处 `createBattle()` 结果套 `markRaw()`，新增每秒十次的 `stamp` 驱动命令栏，模拟与绘制不再穿过 Vue 代理；新增 `tools/verify-perf-browser.mjs`（9 项，真实 Chrome 采样 6 秒并断言 ≥30 FPS、p95 ≤50 ms）；同时修好「全军出击后对峙提示条不消失」——提示条改为直接读 `stamp`，并用 `charged` 在全员攻击时当帧收起，`verify-battle-browser` 44 项（新增 2 项）；版本升到 **v0.0.10**。Batch 29: **800 soldiers hold 60 frames** — a 400 v 400 quick battle went from **8 FPS** (p50 133.3 ms) to **60 FPS** (p50 16.7 ms, p95 16.8 ms) in headless Chrome on the desktop, with the frame-rate chip and the troop counts keeping up. Targeting moved from a whole-field scan every frame to a 90 px grid searched ring by ring (rebuilt every 0.12 s) plus a 0.18 s target cache per soldier (staggered by `id`); line of sight is only checked once the foe is within reach, and the neighbour push compares squared distances; the four `createBattle()` results are wrapped in `markRaw()` and a ten-times-a-second `stamp` drives the command bar, so the simulation and the painter no longer cross Vue proxies; added `tools/verify-perf-browser.mjs` (9 checks, real Chrome sampling six seconds and asserting ≥30 FPS with p95 ≤50 ms); the standoff banner bug is fixed too — it reads `stamp` directly and a `charged` computed clears it on the charge frame, with `verify-battle-browser` at 44 (two new); the version moves to **v0.0.10**. |
| 2026-10-23 | 批次 27：**远程后撤不再钻墙角** —— 攻击命令下的远程小队退得太近时不再一路直线退到战场边缘：先在 16 个方向上量空地，背后是墙或湖就沿墙滑开，必要时从敌人侧翼绕出去，不会把自己逼进角落站着对射。`arenaPath.js` 的 `retreatDirection()` 改为按空地占比、背离敌人、与敌人的距离、地形速度与贴边程度打分，并带上一帧方向的惯性；`battle.js` 传入最近的敌人与上一帧方向；`verify-battle` 156 项（新增 6 项，含角落实战）全部通过，换回旧实现时 3 条会失败；版本升到 **v0.0.8**。Batch 27: **ranged squads slip out of the corner** — a ranged squad that has to give ground no longer backs straight into the arena edge; it measures the open ground in sixteen directions first, slides along a wall or lake behind it, and rounds the enemy's flank when it must instead of trading shots from the corner. `retreatDirection()` in `arenaPath.js` now scores the room, the pull away from the foe, the clearance, the ground speed and the edge, carrying the previous direction as inertia; `battle.js` passes the nearest foe and the last direction; `verify-battle` (156, six new, with a corner fight) all passes and three of them fail on the old code; the version moves to **v0.0.8**. |
| 2026-10-23 | 批次 28：**战斗界面：随时退出、帧率与拖动** —— 快速战斗右上角多了「← 返回」，不必等胜负就能回到设置页；右上角显示最近半秒的平均帧率与最慢一帧（低于 50 金色、低于 30 红色）；战场用鼠标左键或手指都能拖动，拖过 4 px 才算拖动、轻点仍然移动指挥官；战斗中手机左缘的滑动返回被拦下并给出提示；`BattleMap.vue` 的指针处理重写（主指针、4 px 阈值、`pointerup` 判定轻点、`pointercancel` 清理），`BattleView.vue` 新增帧率采样、路由离开守卫与 `overscroll-behavior: none`；`verify-battle-browser` 42 项（新增 11 项，含真实鼠标 / 触摸拖动、`history.back()` 与命令栏透明底）全部通过；命令栏改成透明底、按钮各自成块，提示行加文字阴影保持可读；版本升到 **v0.0.9**。Batch 28: **the battle screen — leave, frame rate and dragging** — a quick battle carries a 「← 返回」 button that returns to the setup without waiting for the outcome; the corner reads the average frame rate of the last half second and the slowest frame in it (gold below 50, red below 30); the field drags with the left mouse button or a finger, a move counts as a drag past 4 px while a tap still moves the commander; during a fight a phone's edge swipe back is refused with a note; `BattleMap.vue`'s pointer handling was rewritten (primary pointer, a 4 px threshold, the tap decided on `pointerup`, `pointercancel` cleaning up) and `BattleView.vue` gained the frame-rate sampler, the route-leave guard and `overscroll-behavior: none`; `verify-battle-browser` (42, eleven new, with a real mouse drag, a real touch drag, a real `history.back()` and the transparent command bar) all passes; the version moves to **v0.0.9**. |
| 2026-10-23 | 批次 26：**每一战都是新战场** —— 河流的走向、湖泊 / 山地 / 森林 / 沙地的位置与大小都改为按新的战斗种子生成，因此每场战斗的地图都不一样，同一种子仍可复现；六种预设各自保证该有的地形；湖泊只落在战场内部并避开两侧列阵区，不会把战场切断，也不会让士兵开局站在深水里。`arena.js` 的 `generateArenaTerrain()` 用 `span()` / `radiusOf()` 从种子取出每块地形的位置与半径，河湖重叠清理改用逐行河位；`verify-battle` 150 项全部通过，另以 60 个随机种子压测「战斗都能结束、无人开局在水里」；版本升到 **v0.0.7**。Batch 26: **a new battlefield every battle** — the river's course and the place and size of the lake, mountain, forests and sand now come from a fresh battle seed, so no two fights share a map while the same seed still rebuilds one; every preset keeps its own ground, and the lake stays inside the field and clear of the deployment bands so it never cuts the field and nobody starts in deep water. `generateArenaTerrain()` in `arena.js` draws each piece's place and radius from the seed through `span()` / `radiusOf()`, and the lake-river cleanup uses the per-row river column; `verify-battle` (150) all passes, with a sixty-seed stress run confirming every fight ends and nobody starts in water; the version moves to **v0.0.7**. |
| 2026-10-23 | 批次 25：**开局对峙与手动下令** —— 刚进战场时敌我双方都驻守原地，约 5 秒后敌军先变阵（远程一线、近战楔形）、再过约 2.4 秒才冲锋，主角先动手则敌军 1 秒内应战；底部提示条倒数并给出「⚔️ 全军出击」，也可以单选一支小队下攻击 / 防守 / 跟随 / 移动；减员的小队会收拢队形补上前排，长时间的战斗不再卡住。`battle.js` 新增 `OPENING` 与 `opening` 阶段机（`dressEnemyRanks()` / `enemyAdvance()` / `hastenEnemy()`）与存活人数收拢槽位，`stores/battle.js` 新增 `allAttack()`，`BattleView.vue` 新增开局提示条，`quickBattle.js` 的即时模拟自行下达攻击令；`verify-battle` 138 项、`verify-battle-browser` 31 项全部通过；版本升到 **v0.0.6**。Batch 25: **the standoff and the lord's order** — both armies hold their ground when the arena opens, the enemy dresses its ranks after about five seconds (ranged into a line, melee into a wedge) and charges some 2.4 seconds later, while a first blow brings its answer within a second; the command bar counts the standoff down and offers 「⚔️ 全军出击」, a single squad can still be ordered to attack / defend / follow / move, and a thinned squad closes its ranks so no long fight stalls. `battle.js` gained `OPENING`, the `opening` phase machine (`dressEnemyRanks()`, `enemyAdvance()`, `hastenEnemy()`) and survivor-packed slots, `stores/battle.js` gained `allAttack()`, `BattleView.vue` the standoff banner and the instant simulation in `quickBattle.js` gives the attack order itself; `verify-battle` (138) and `verify-battle-browser` (31) all pass, and the version moves to **v0.0.6**. |
| 2026-10-23 | 批次 24：**遇敌对话与逃跑** —— 敌对部队追上主角时不再直接进入战场，而是先弹出遭遇对话框：敌将像素头像、势力身份、敌我兵力对比与按兵种列出的敌方名册；「🏃 逃跑」随机退开 3–6 格并让该部队冷却 30 秒（不损失士兵与金币），「🗣️ 喊话」听敌将回话，「⚔️ 开战」才进入战斗地图；对话期间天数、时钟与所有部队完全暂停。新增 `src/game/encounter.js`（台词库、名册、逃生点纯函数）、`EncounterDialog.vue`、`stores/world.js` 的 `fleeEncounter()` 与遇敌冻结，新增 `tools/verify-encounter.mjs`（50 项无头）与 `tools/verify-encounter-browser.mjs`（26 项真实 Chrome）；版本升到 **v0.0.5**。Batch 24: **the meeting and the escape** — a hostile party no longer drags the lord straight into the arena; a meeting card opens first with the leader's pixel portrait, his faction, the two armies' sizes and the enemy roster troop by troop; 「🏃 逃跑」 dashes 3–6 tiles away and cools the party down for 30 seconds (no soldier and no coin lost), 「🗣️ 喊话」 gets an answer and only 「⚔️ 开战」 opens the battle map; the day, the clock and every party freeze while the card is open. Added `src/game/encounter.js` (the line banks, the roster and the pure escape helpers), `EncounterDialog.vue`, `fleeEncounter()` and the meeting freeze in `stores/world.js`, plus `tools/verify-encounter.mjs` (50 headless checks) and `tools/verify-encounter-browser.mjs` (26 real-Chrome checks); the version moves to **v0.0.5**. |
| 2026-10-23 | 批次 23：**城镇慢钟** —— 据点内时间放慢 60 倍，现实 1 秒 = 游戏 1 分钟（城镇里一天 24 分钟），管理城镇不再烧掉战役天数，据点时钟写明「镇内 1 秒 = 1 分钟」；**战场动画** —— 行军跳动与尘土、站定呼吸、受击白闪 / 红圈 / 晃动、重伤红色脉冲、出手前倾、阵亡倒下下沉淡出（练兵木桩倒下后再站起），全部只影响绘制，战斗数值与胜负不变；`restTick` 改读 `REST_SECONDS_PER_HOUR`，新增 `src/game/battleAnim.js`、`drawSprite` 的 `smooth` 坐标与 `battle.js` 的 `swing` 计时；版本升到 **v0.0.4**，`verify-settlements` 131 项、`verify-battle` 111 项、浏览器走查 26 项全部通过。Batch 23: **the slow town clock** — time inside a settlement is 60 times slower, one real second is one in-game minute (a town day lasts 24 real minutes), managing a town no longer burns campaign days and the settlement clock says 「镇内 1 秒 = 1 分钟」; **battle animations** — a walking hop with dust, standing breath, a white flash / red ring / shake on a hit, a red pulse for the badly wounded, a lunge into a strike and a death that tips, drops and fades (a training dummy falls and then stands back up), all render-only with the numbers and the outcome untouched; `restTick` reads `REST_SECONDS_PER_HOUR`, a new `src/game/battleAnim.js` holds the maths, `drawSprite` gained smooth coordinates and `battle.js` a `swing` timer; the version moves to **v0.0.4** and the settlement (131), battle (111) and browser (26) checks all pass. |
| 2026-10-23 | 批次 22：**难度重做** —— 三档从「只改考试金币」扩成收入 / 军费 / 敌军三条轴：简单是练习档（5 金/题、整卷封顶 ×2、150 金 8 粮、敌军 ×0.9），普通保持原样（19 / 25、120 金 5 粮、每战 3 粮），困难是挑战档（14 / 19、90 金 3 粮、每战 4 粮、招募 +15%、敌军 ×1.1 且成长更快）；同一局新增随**胜场与占领城镇**上升的「威胁」（简单 1.2 / 普通 1.8 / 困难 2.0 封顶），缩放敌军新刷规模、总上限与精锐比例；世界地图芯片显示「难度 · 威胁」、难度面板列出全部数值，练习档成绩页说明封顶；新增 `tools/verify-difficulty.mjs`（58 项无头），`verify-quiz` / `verify-battle` / 浏览器走查同步更新。Batch 22: **the difficulty rebuilt** — the three levels grew from the exam pay alone into the pay / cost / enemy axes: easy is practice (5 gold an answer, a paper capped at ×2, 150 gold and 8 food, enemies ×0.9), normal stays as shipped (19 / 25, 120 gold and 5 food, three rations a battle) and hard is the challenge (14 / 19, 90 gold and 3 food, four rations, recruits +15%, enemies ×1.1 and faster growth); a new campaign **threat** rises with the **battles won and the towns taken** (capped at 1.2 easy, 1.8 normal, 2.0 hard) and scales the size, the ceiling and the rank mix of new enemies; the world-map chip reads 「难度 · 威胁」, the sheet spells out every number and the practice result page explains the cap; added `tools/verify-difficulty.mjs` (58 headless checks) and updated `verify-quiz`, `verify-battle` and the real-Chrome walkthrough. |
| 2026-10-21 | 批次 20：学习主线四层改进全部落地 —— **A 结算层**（`src/game/quiz/reward.js`：连击倍率 ×1.0–×1.5、整卷全对 ×1.5、12 题长卷 ×1.1、及格 +20%，**答错不扣钱**）、**B 道具掉落**（答对掉军粮、整科全对掉集市券或征兵令、全对掉战马）与四个**里程碑**（`src/game/milestones.js`：军旗 / 徽章 / 药箱 / 驿马）、**C 掌握度地图**（`src/game/quiz/mastery.js`：按科目与年级统计）与两种复习卷（只考错题 / 复习队列）、**D 经验换四个属性**（`src/game/skills.js`：统御 / 医术 / 工程 / 谋略，直接改队伍上限、伤兵恢复、围城准备、设施造价与全军攻击，谋略还在战前显示敌方构成）；角色详情新增「学习与成长」，世界地图新增属性点芯片；**首页只保留一个版本徽章**并换成更清爽的配色与竖屏友好的布局，世界地图的消息提示从屏幕正中移到顶部状态栏之下；修掉生产构建压缩函数名导致记忆曲线 key 变化的缺陷；新增 `tools/verify-quiz.mjs`（99 项无头）与 `tools/verify-quiz-browser.mjs`（34 项真实 Chrome），浏览器自检改为直接启动 vite 二进制，不再留下占用端口的预览服务器。Batch 20: the four layers of the exam spine shipped — the settlement, the gear and the milestones, the mastery map with its two revision papers, and the experience that buys the four attributes; the lord panel grew a learning section and the world map an attribute points chip; **the home screen keeps a single version badge** with a calmer palette and a portrait-friendly layout, and the message of the world map moved from the middle of the screen to below the status bar; a production build no longer changes the memory-curve key; added `tools/verify-quiz.mjs` (99 headless checks) and `tools/verify-quiz-browser.mjs` (34 real-Chrome checks), and the browser checks start vite's own binary so no preview server is left behind. |
| 2026-10-21 | 批次 16：新增**版本号与更新内容**（`src/game/versions/`：`VERSION` 从 **v0.0.1** 起、只更新修订号、`CHANGELOG` 记每个版本的更新内容；首页标题下显示「版本 v0.0.1」徽章，底部徽章**点击后用对话框**展示更新内容，内容整理自 `progress.md` 的「已完成功能」一节并由 `tools/build-versions.mjs` 生成；该节每条内容以 **▶（玩家功能）** 或 **🔧（技术细节）** 开头，**对话框只显示玩家功能**，不出现文件名与脚本名）；新增**扎营练兵**（扎营时底部出现「🎯 练兵」，进入只有自己士兵与八个训练木桩的战场，没有敌人、不会结束、不会死人，木桩打倒后两秒自己立起，队伍 / 金币 / 军粮 / 战绩都不受影响；战斗界面新增「🏕 结束练兵」按钮）；新增 `tools/verify-training.mjs`（58 项无头检查）与 `tools/verify-training-browser.mjs`（25 项真实 Chrome 检查）。Batch 16: added the **version display and the update notes** (`src/game/versions/`: `VERSION` starts at **v0.0.1** and only the patch moves, `CHANGELOG` holds the notes of every release; the home screen shows a 「版本 v0.0.1」 badge under the title and a badge at the bottom **opens a dialog** with the notes, which are organised from the 「已完成功能」 section of `progress.md` and generated by `tools/build-versions.mjs`) and the **training drill** (a 「🎯 练兵」 button while camped opens a field with the lord's own soldiers and eight wooden dummies — no enemy, no end, no losses; the dummies stand back up two seconds after they are knocked down and the warband, purse, food and record stay untouched; the battle screen gained a 「🏕 结束练兵」 button); added `tools/verify-training.mjs` (58 headless checks) and `tools/verify-training-browser.mjs` (25 real-Chrome checks). |
| 2026-10-21 | 批次 17：新增**快速战斗模拟器** —— 首页「⚡ 快速战斗」入口进入 `QuickBattleView.vue`；`src/game/arena.js` 新增 `ARENA_MAPS` 六种战场预设（混战 / 平原 / 密林 / 山地 / 大河 / 湖泽）并让 `generateArenaTerrain()` / `createBattle()` 接受战场预设；`src/game/quickBattle.js` 复用真实战斗的 `createBattle()` 与 `stepBattle()`，可选己方兵种（民兵 / 长枪兵 / 弓箭手 / 骑兵）、敌方势力（强盗 / 苍狼 / 赤鹰）、士兵规模（8×8 / 16×16 / 32×32 / 64×64）与场次（5 / 20 / 50），每个兵种的数量可用加减键**任意设置**；点「⚡ 进入战场」**真的站上战场**打一场（战役数据不受影响），另有点「📊 先看看胜率」的即时模拟；跑出胜率、平均阵亡与每场明细；「⚡ 快速战斗」入口与首页的「开始新的征程」「继续上次进度」**同级**；新增 `tools/verify-quick-battle.mjs`（57 项无头检查）与 `tools/verify-quick-battle-browser.mjs`（28 项真实 Chrome 检查）。Batch 17: a new **quick battle simulator** — the 「⚡ 快速战斗」 entry on the home screen opens `QuickBattleView.vue`; `src/game/arena.js` gains `ARENA_MAPS` with six battlefield presets and `generateArenaTerrain()` / `createBattle()` take a preset; `src/game/quickBattle.js` reuses the real `createBattle()` and `stepBattle()` and lets you pick the friendly army, the enemy faction, the size of the armies and the number of rounds, the count of every kind can be set freely, 「⚡ 进入战场」 **really puts the lord on the field** to fight it out (the campaign is untouched) and 「📊 先看看胜率」 gives the odds at once; it then reports the win rate, the average casualties and every round, and its entry sits **on the same level** as the start and continue buttons on the home screen; a new `tools/verify-quick-battle.mjs` (57 headless checks) and `tools/verify-quick-battle-browser.mjs` (28 real-Chrome checks). |
| 2026-10-21 | 批次 18：战斗规则改了两条 —— **被打了就会还手**（士兵记住是谁打了它并转身还手，哪怕它本来在防守或赶路；近战与远程箭矢都记录攻击者），**攻击不再打乱队形**（小队转向敌人、前排压上、每个士兵守住自己的位置，队列不会一拥而上；远程小队嫌近了整队一起后撤）；`tools/verify-battle.mjs` 增加 6 项检查（共 70 项）。Batch 18: two rules of the fight changed — **everybody answers an attack** (a soldier remembers who hit it and turns to answer it, even when it was defending or marching; both melee blows and arrows record the attacker) and **an attack keeps the formation** (the squad turns towards the foe, the front rank goes for it and every soldier holds its own slot instead of mobbing the enemy; a ranged squad steps back as one block); `tools/verify-battle.mjs` gained six checks (70 in total). |
| 2026-10-21 | 批次 19：队形**会呼吸** —— 士兵在自己的位置上轻轻晃动、挨打会被推开踉跄、贴太近会互相让开，近战前排会向敌人压进一点；**随机队形下每个士兵自己扑向敌人**；队形还是那个队形，但不再是一张僵硬的网格。`tools/verify-battle.mjs` 增加 6 项检查（共 76 项）。Batch 19: the formation **breathes** — every soldier sways a little inside its slot, a blow shoves it aside, two soldiers that crowd each other slide apart and the front rank of a melee squad leans into the foe and **with the scattered formation every soldier closes on the foe itself**; the shape is the same, but it is no longer a stiff grid; `tools/verify-battle.mjs` gained six checks (76 in total). |
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

---

## 6. 与《骑马与砍杀：战团》对照分析 · Comparison with Mount & Blade: Bannerlord

### 6.1 这次对照要回答什么 · What this comparison is for

《骑马与砍杀 II：战团》（Mount & Blade II: Bannerlord）是「骑马与砍杀」类型的标杆，本作的世界地图 + 实时小队战斗正是它的 2D 简化版。
But Mount & Blade II: Bannerlord is the benchmark for the genre, and the world map plus the real-time squad battle of this game is its two-dimensional simplification.

但两者的**目的**不同：战团的核心是经营一个领主、操控一支军队、卷入党派与政治；本作的核心是**金币只能靠答对题目获得**，学习曲线必须始终接在玩法上。
The two differ in **purpose**, though: Bannerlord is about running a lord, commanding an army and getting caught up in factions and politics, while here gold comes **only from answering questions correctly**, so the learning loop has to stay wired into the play.

因此这次对照**不是**照抄战团的全部特性，而是回答两个问题：哪些战团里「真好玩」的机制在这套 2D 俯视框架里还能成立？哪些机制能自然地和「考试 → 金币 → 变强」这条线缝在一起？
So the comparison is **not** about copying everything; it answers two questions: which of Bannerlord's genuinely fun mechanics still work in this 2D top-down frame, and which of them can be stitched onto the "exam → gold → stronger" line.

### 6.2 已经有对应物的部分 · What the game already answers

| 战团机制 Bannerlord mechanic | 本作对应物 The counterpart here |
| --- | --- |
| 小队级战术指令 Squad-level orders | 攻击 / 防守 / 跟随 / 移动四个命令，作用于选中小队或全军（`battle.js` 的 `ORDERS`） |
| 阵型与队形密度 Formations and spacing | 六种队形 × 两种密度，改动立即生效（`FORMATIONS` / `DENSITIES`） |
| 兵种相克 Troop counters | 长枪兵 > 骑兵 > 弓箭手 > 长枪兵，+40% / −25%（`units.js` 的 `COUNTERS`） |
| 地形影响 Terrain | 战场森林 / 沙地 / 河流 / 湖泊 / 山地，影响移动、攻防与不可通行（`arena.js`） |
| 围城 Siege | 准备 2 天 → 攻打；期间时钟走、驻军增援、归属方派援军（`settlement.js`） |
| 城镇发展与工坊 Town growth and workshops | 繁荣度 → 等级，医院 / 军营两种设施（`settlement.js` 的 `FACILITIES`） |
| 兵源与征募 Recruiting | 城镇按权重滚出四个档位组合，民兵 → 三家族 × 四档（`recruit.js`） |
| 竞技场 / 练兵 Arena and drill | 快速战斗模拟器与扎营练兵（`quickBattle.js`、训练木桩） |
| 行军节奏 Travel rhythm | 点击寻路、扎营、昼夜与战役时钟（`world.js`、`daynight.js`） |

### 6.3 世界与经营 · World and economy

| 战团特性 Bannerlord feature | 本作现状 Current state | 好玩的缺口 The gap | 儿童向改造建议 The kid-friendly adaptation |
| --- | --- | --- | --- |
| 第一 / 第三人称 3D 战斗 First-person 3D combat | 2D 俯视 canvas | 不追求 | 不做：手机画布与 8–12 岁定位都不合适。Not for phones or this age group. |
| 城堡与封臣 Castles and vassals | 只有城镇与村庄 | 世界缺尺度感 | 给城镇加城墙，攻时分「破防 → 巷战」两段。Walls on the towns, an assault in two stages: break the wall, then the streets. |
| 势力关系与外交 Faction relations | 势力之间从不开战（限制 20） | 世界是死的 | 加关系矩阵：交战 / 停战 / 结盟；盟友在你攻城时参战，敌对势力互相消耗。A relations matrix — war, peace, alliance — with allies joining your siege. |
| 战争迷雾与侦查 Fog of war and scouting | 一开始全图可见（限制 19） | 探索没有代价 | 视野半径 + 已探索区域（路线图 14）。A sight radius plus explored ground. |
| 四季 Seasons | 只有昼夜（批次 15） | 缺少长期节奏 | 四季影响移动、村庄产出与兵源权重。四 seasons change movement, village output and the recruit weights. |
| 商队与物价 Caravan trade and prices | 市场只有军粮与战马 | 经济只有一条进项 | 商品 + 随天波动的价格；商队按两地差价获利。Goods with a drifting price, and a caravan that earns the spread. |
| 工坊与生产链 Workshops and production | 医院 / 军营只是加成的设施 | 城镇发展只有一条路 | 工坊按城镇等级产出商品，产物换成军粮与战马。Workshops turn the town level into goods, and the goods into food and horses. |
| 每日开销 Wages and upkeep | 日薪只展示不扣除（限制 6） | 金币没有压力 | 日薪按天真扣，扎营等待变成要花钱的决定。Wages are really paid, so camping and waiting cost something. |
| 同伴与英雄 Companions | 没有 | 队伍里没有「人」 | 酒馆招募 1–3 名同伴（教练 / 医师 / 工兵），分别加队伍上限、恢复速度与攻城速度。Companions from the tavern: a coach, a surgeon, an engineer. |
| 任务与悬赏 Quests and bounties | 地图上只有围城与强盗遭遇 | 玩家没有「想做的事」 | 城镇发布限时**军令**，用战役时钟倒计时（路线图 18）。Timed orders counted down with the campaign clock. |
| 俘虏与赎金 Prisoners and ransom | 打赢 60% 概率 +4 民兵 | 胜利没有后续 | 战后产生俘虏，可赎金换金币或直接招入（看声望）。Prisoners can be ransomed for gold or recruited, gated by renown. |
| 声望与荣誉 Renown | 没有 | 长期目标缺席 | 战斗 / 军令 / 比武产出声望，声望解锁城镇爵位与更好兵源（路线图 19）。Renown earned in battle, orders and tournaments. |
| 家族、婚姻与继承 Family and inheritance | 没有 | — | 不做：与 8–12 岁的定位不符。Out of scope for 8–12 year olds. |
| 队伍人数上限 Party cap | 没有上限 | 扩张没有成本 | 上限由「统御」属性决定，而统御靠答题。The party cap follows a leadership attribute that exams raise. |

### 6.4 战斗 · Combat

| 战团特性 Bannerlord feature | 本作现状 Current state | 好玩的缺口 The gap | 儿童向改造建议 The kid-friendly adaptation |
| --- | --- | --- | --- |
| 士气与溃逃 Morale and routing | 只有胜 / 负两种结果 | 战斗没有「崩」的感觉 | 士兵带士气，被压制时下降，归零就掉头逃跑；战斗变成胜 / 负 / 溃逃三种结果（路线图 17）。Morale, and a soldier at zero runs: a fight ends in a win, a loss or a rout. |
| 侧翼与包围 Flanking | 只有相克倍率 | 队形没有空间意义 | 侧后受击给伤害加成（侧 +20% / 后 +35%），让「围住」真的有价值。A flank and rear bonus, so encircling pays. |
| 兵种厚度 Roster depth | 民兵 + 三家族 | 兵种与队形牵制不够 | 加弩手（慢、破甲）、弓骑兵（移动射击）、长戟兵（加强克制骑兵）。A crossbow, a mounted archer and a polearm. |
| 冲锋 / 停射 / 自由射击 Charge, hold fire, fire at will | 四个命令 | 命令层次偏薄 | 加「冲锋」（散队冲击）与「停射 / 自由射击」，并让指挥官能「鼓舞」。A charge order, a hold-fire toggle and a commander rally. |
| 盾墙与齐射 Shield wall and volley | 队形只改数值 | 队形没有专属玩法 | 长枪兵可结盾墙（正面受伤 −35%），弓箭手可齐射（一次多箭、冷却更长）。A shield wall and a volley, each with its own rule. |
| 战前部署 Deployment | 自动部署 | 开局几秒是被动的 | 开战前拖部署线，决定初始位置与朝向。A deployment line before the fight. |
| 增援与规模调整 Reinforcements and scaling | 没有增援 | 每场都是一波打完 | 敌方按时间表增援，战斗规模随双方兵力自动伸缩。Reinforcements on a timer, and a battle that scales with the armies. |
| 攻城阶段 Siege phases | 准备 2 天 + 一场战斗 | 攻城没有过程 | 三段：围城（守军士气 / 投降）→ 破墙（攻城槌 / 云梯）→ 巷战。Three phases: surround, breach, streets. |
| 指挥官可被击倒 A vulnerable commander | 指挥官 120 血但打不到（限制 2） | 「跟随」没有分量 | 敌人可攻击指挥官；指挥官倒下即判负，鼓舞与跟随才有意义。Enemies can hit the commander, and losing it loses the battle. |
| 战报与缴获 Breakdown of the spoils | 只有 35% 战利品 | 胜利没有细节 | 战果分项：阵亡 / 受伤 / 俘虏 / 缴获 / 声望 / 城镇影响。Captures, seized goods, renown and the effect on the town. |
| 家族与领主特质 Noble traits | 没有 | — | 简化为城镇与势力各有「特质」，影响驻军与兵源。Simplified into traits on towns and factions. |

### 6.5 角色与养成 · Character and progression

| 战团特性 Bannerlord feature | 本作现状 Current state | 好玩的缺口 The gap | 儿童向改造建议 The kid-friendly adaptation |
| --- | --- | --- | --- |
| 属性与技能树 Attributes and skills | 考试是唯一的成长来源 | 学习没有直接变强 | **考试 = 经验**：答对累积统御 / 医术 / 工程 / 谋略，分别影响队伍上限、恢复速度、攻城速度与任务时限（路线图 22）。An exam is experience: four attributes that feed the cap, the recovery, the siege and the deadlines. |
| 铁匠与装备 Smithy and equipment | 没有 | 只有四档位 | 铁匠铺给全军加装备等级。A smithy that lifts the whole army's gear. |
| 竞技场与升级赛 Arena ladder | 快速战斗与练兵 | 有练习没排名 | 比武大会三轮淘汰（枪术 / 骑兵 / 混战），名次给声望与金币（路线图 20）。A three-round tournament ladder. |
| 声望解锁内容 Renown unlocks | 没有 | — | 声望解锁城镇爵位、驻军上限与更好的兵源（路线图 19）。Renown unlocks town titles, garrison caps and better recruits. |
| 声望等级与爵位 Rank and titles | 城镇只有 Lv.1–4 | — | 城镇爵位与声望挂钩，显示在城镇名牌上。Town titles tied to renown and shown on the name plate. |

### 6.6 明确不做的部分 · What we deliberately skip

| 战团特性 Bannerlord feature | 不做的原因 Why it is skipped |
| --- | --- |
| 第一 / 第三人称 3D 战斗 | 手机画布与像素画风承受不起，且会挤掉「考试 = 经验」这条主线。The phone canvas and the pixel style cannot carry it, and it would crowd out the "an exam is experience" spine. |
| 联机对战 | 局域网联机已在路线图里列为独立议题，与玩法内容分开推进。LAN multiplayer is its own roadmap item and is kept separate from the gameplay content. |
| 家族继承与联姻 | 与 8–12 岁的定位不符。Out of place for 8–12 year olds. |
| 完整王国政治与朝廷 | 复杂度远超本作目标；只保留「势力关系」这一层。Far beyond the scope; only the layer of faction relations is kept. |

### 6.7 优先级与工作量 · Priorities and effort

| 优先级 Priority | 特性 Feature | 依赖 Depends on | 主要改动 Main changes | 大致工作量 Effort |
| --- | --- | --- | --- | --- |
| P0 | 士气与溃逃 Morale and routing | 无 None | `src/game/battle.js`、`src/stores/battle.js`、`BattleView.vue` | 1 批次 one batch |
| P0 | 声望 Renown | 无 None | 新增 `src/game/renown.js`、`src/stores/player.js`、`src/game/save.js` | 1 批次 one batch |
| P1 | 比武大会 Tournament | 声望 Renown | 新增 `src/game/tournament.js`、`SettlementView.vue`、`BattleView.vue` | 1–2 批次 |
| P1 | 军令任务 Orders | 声望 + 战役时钟 | 新增 `src/game/orders.js`、`src/stores/player.js`、`WorldView.vue`、`SettlementView.vue` | 2 批次 |
| P1 | 属性与技能 Attributes and skills | 考试结算 Exam result | 新增 `src/game/skills.js`、`ExamModal.vue`、`CharacterPanel.vue` | 1–2 批次 |
| P2 | 侧翼包围与新兵种 Flanking and new families | 无 None | `src/game/units.js`、`battle.js`、`recruit.js`、像素素材 | 2 批次 |
| P2 | 俘虏与赎金 Prisoners and ransom | 战后结算 | `src/stores/battle.js`、`src/stores/player.js` | 1 批次 |
| P2 | 势力关系 Faction relations | 据点归属 | `src/game/factions.js`、`worldgen.js`、`world.js` | 2 批次 |
| P3 | 攻城三阶段 Siege phases | 围城流程 | `src/game/settlement.js`、`battle.js` | 2 批次 |
| P3 | 商队与工坊 Caravan and workshops | 经济 | 新增 `src/game/trade.js`、`TownPanel.vue` | 2 批次 |
| P3 | 迷雾 / 四季 / 战前部署 Fog, seasons, deployment | 无 None | `atlas.js`、`daynight.js`、`battle.js` | 2 批次 |

### 6.8 第一批的详细设计：士气与溃逃 · Detailed design of the first batch: morale and routing

这是性价比最高的一批：只改战斗内部与结算，**不动存档结构**，但让战斗第一次有了「崩盘」这件事。
This is the cheapest batch with the biggest effect: it stays inside the battle and its settlement, **changes no save shape**, and gives a fight a sense of collapse for the first time.

**规则 · Rules**

| 事件 Event | 士气变化 Morale change | 说明 Note |
| --- | --- | --- |
| 开局 Start | 100 | 每个士兵都是满士气。Every soldier starts at full morale. |
| 挨打 Hit taken | −1.2 | 挨一下就慌一点。One blow shakes them. |
| 被压制 Pressed | −0.8 / 秒 | 附近敌人比友军多时持续掉士气。Drains while more enemies than friends are close. |
| 同伴阵亡 A squad-mate falls | −3 | 看到身边的人倒下会害怕。Fear when the neighbour falls. |
| 己方小队守住了 Holding | +1.5 / 秒 | 防守命令下不掉士气，反而回升。A squad holding recovers. |
| 指挥官活着 Commander alive | +0.6 / 秒 | 指挥官在附近时回升，这正是「跟随」的价值。The commander nearby is worth more morale. |
| 敌人溃逃 An enemy squad routs | +4 | 看到敌人逃跑会提气。Momentum when the enemy breaks. |
| 士气归零 Morale hits 0 | 溃逃 Rout | 掉头往自己出发方向跑，不再攻击、不再听命令。Turns around, runs for its own side, stops fighting and ignores the orders. |

**结果判定 · Outcomes**

| 情况 Situation | 结果 Outcome | 战役影响 Campaign effect |
| --- | --- | --- |
| 敌方全部阵亡 All the enemy dies | 胜 Win | 战利品 35%，正常结算。Loot at 35%. |
| 敌方全部溃逃（无人生还）All the enemy routs | 溃胜 Routed win | 战利品降到 20%，但俘虏更多、伤兵更少。Loot drops to 20%, with more captures and fewer wounded. |
| 己方全部阵亡 The lord is wiped | 负 Loss | 与现在一致：队伍只剩幸存者。As today: the warband keeps only its survivors. |
| 己方全部溃逃 The lord routs | 溃败 Routed loss | 队伍损失惨重：溃逃的士兵不再回队。The rout costs the warband: those soldiers never come back. |

**数据形状 · Data shape**

```js
// 每个士兵（battle.js 的 b.units 里）
{ id, side, group, type, tier, hp, maxHp, morale: 100, routed: false, ... }

// 每个小队（b.groups 里）新增
{ key, side, order, formation, density, morale: 100, ... }  // morale 是队内平均士气，界面上画成一条小条
```

**改动清单 · Change list**

| 文件 File | 改什么 What changes |
| --- | --- |
| `src/game/battle.js` | 士兵加 `morale` / `routed`；`stepBattle()` 里结算士气与溃逃；`battleSummary()` 报告溃逃人数；`outcome` 增加 `'rout'` |
| `src/stores/battle.js` | 结算时区分「胜 / 溃胜 / 负 / 溃败」，战利品与俘虏按结果调整 |
| `src/components/BattleMap.vue` | 溃逃的士兵变灰、倒转方向、跑向自己一侧；小队条下画士气条 |
| `src/views/BattleView.vue` | 战果面板增加「溃逃」一栏与第三种结果的文案 |
| `tools/verify-battle.mjs` | 增加自检（见下） |

**自检项 · Self-checks**

1. 每个士兵开局士气为 100，队伍士气条显示 100。
   Every soldier starts at 100 and the squad bar shows 100.
2. 挨打会掉士气，掉到 0 的士兵进入溃逃状态。
   A blow drains morale, and a soldier at zero routs.
3. 被压制（附近敌人更多）的小队掉士气比不被压制的快。
   A pressed squad drains faster than an unpressed one.
4. 溃逃的士兵不再造成伤害也不再挨打，并且朝自己一侧移动。
   A routed soldier neither deals nor takes damage, and moves towards its own side.
5. 敌方全部溃逃时战斗以 `rout` 结束，战利品按 20% 计算。
   An enemy rout ends the fight as `rout` with the loot at 20%.
6. 练兵模式不产生溃逃（木桩不还手，士兵不会被打崩）。
   A drill never routs, because the dummies never strike back.
7. 十二场既有的无头对局仍然都能在两分钟内分出结果。
   The twelve existing headless duels still resolve inside two minutes.

---

## 7. 学习主线：现状、缺口与改进清单 · The exam spine: where it stands and what to add

这一节专门回答「核心是做题与考试」这条要求：**做题 → 得道具与资金 → 变强**这条链上，哪一环还是空的。
This section is about the requirement that the core of the game is answering questions: on the chain **answer → earn gear and money → get stronger**, which link is still missing.

### 7.1 现在的循环（按代码） · The loop as it is implemented

| 环节 Link | 现状 Current | 代码位置 Code |
| --- | --- | --- |
| 入口 Entry | 只能进**城镇**才能考试；村庄与野外都没有 | `SettlementView.vue` 的「考试」页签 |
| 出卷 Draw | 按年级（3/4）× 多科目 × 题量（5/8/12）出卷 | `generateExam()`（`quiz/index.js`） |
| 选题 Selection | 记忆曲线加权：熟练的题少出、错的题多出 | `scheduler.js` 的 `weightFor()` |
| 记忆 Memory | 每题 0–5 级；答对 +1、答错 −2；20 小时不复习掉一级 | `MEMORY` 与 `updateProgress()` |
| 奖励 Reward | 每答对一题发金币：简单固定 5；普通三年级 19 / 四年级 25；困难三年级 14 / 四年级 19；逻辑 +6、百科 +4 在普通与困难照常叠加 | `rewardFor()`（`quiz/index.js`） |
| 通过 Pass | `correct ≥ ceil(题数 / 2)` 只影响标题是「🏅 考试通过」还是「📄 考试结束」，**不影响任何奖励** | `ExamModal.vue` 的 `passLine` |
| 花钱 Spend | 金币 → 招募 / 升级 / 军粮 / 战马 / 城镇设施 | `recruit.js`、`units.js`、`MarketPanel.vue`、`settlement.js` |
| 副产出 Side output | 只有**自己的城镇**里每答对一题 +2 开发 | `examReward()`（`settlement.js`） |

一句话：**今天「做题」直接换到的只有金币，别的道具要么没有，要么得拿金币去买。**
In one sentence: **today, answering a question directly yields only gold; every other item either does not exist or has to be bought with that gold.**

### 7.2 结构性缺口 · The structural gaps

| # | 缺口 Gap | 证据 Evidence | 影响 Impact | 改法 Fix |
| --- | --- | --- | --- | --- |
| 1 | 奖励是平的 | `rewardFor()` 每题同价，与连击、用时、试卷长度无关 | 做得多与做得快没有区别，学习动机弱 | 试卷结算层：连击倍率 + 满分奖励 + 长卷奖励（见 7.5 A） |
| 2 | 「道具」不是做出来的 | `supplies` 只有 food / horse，且只能 `MarketPanel` 用金币买 | 需求里「做题得到道具」这一半是空的 | 答对直接掉道具（见 7.5 B） |
| 3 | 长期目标缺失 | 只有金币一个数字；精英骑兵 216 金币，靠金币攒 | 没有「我在朝什么努力」的可见进度 | 里程碑道具：累计答对数解锁永久加成（见 7.5 B） |
| 4 | 学习不可见 | `memorySummary` 只有「已记录 N 题 / 掌握 M 题」两个总数 | 孩子不知道自己哪科弱，家长无法评估 | 掌握度地图（按科目 × 年级），由 `questionStats` 直接派生，不用改存档（见 7.5 C） |
| 5 | 题目没有难度与标签 | `normalizeItem()` 只认 id/grade/prompt/options/answer | 无法自适应出题、无法按知识点分组、无法出「挑战题」 | 契约加 `difficulty` 与 `tags`，生成器题型也带上 |
| 6 | 通过与否没有后果 | `passLine` 只改标题 | 考试没有紧张感，也就没有「一定要考好」 | 及格给额外奖励 / 解锁，不及格扣一点声望或错过当日任务 |
| 7 | 数学只能四选一 | 数学题是 `choice()` 生成的数字选项（数据里已有 `unit: 'number'`） | 可以蒙，检验不了计算能力 | 填空模式：数字输入（数据层已留了 `unit` 字段） |
| 8 | 错题不能重考 | `questionStats` 只存等级与对错次数，没有「最近错题」列表 | 错题就沉在曲线里 | 错题本 + 「只考错题」模式（路线图 12） |
| 9 | 两条时钟不一致 | 遗忘按**真实小时**（20 h），战役按**游戏天**（1 天 = 24 秒） | 现在是对的（间隔重复本来就该按真实时间），但容易被后人误改 | 在文档里写死这条，并给出「复习队列」界面（见 7.5 C） |
| 10 | 记录会被裁剪 | `pruneQuestionStats(1200)` 按 `lastSeen` 丢弃 | 长期游玩的掌握度会回退 | 里程碑计数单独存，不进裁剪范围 |
| 11 | 家长 / 老师没有入口 | 只能手改 `public/mods/index.json`（限制 16） | 老师无法布置作业、无法看报告 | 题库管理界面 + 学习报告导出（路线图 13） |
| 12 | 没有「今天的任务」 | 打开游戏只能自己想起去考试 | 学习节奏全靠孩子自觉 | 每日目标（今天答对 N 题）与连击统计 |

### 7.3 四层改进方向 · Four layers of improvement

**A 层：让一次考试更有戏 · Make one paper exciting**
连击、满分奖励、长卷奖励、及格加成，以及**考试倒计时**（战役时钟当天数计）。答错不扣钱，只是没有金币。
Streaks, a perfect-score bonus, a long-paper bonus, a scored mode where a wrong answer costs, and a countdown on the campaign clock.

**B 层：让题目变成道具 · Turn answers into gear**
答对直接掉军粮 / 战马 / 征兵令 / 集市券；累计答对数解锁**永久道具**（军旗、徽章、药箱、驿马）。
Correct answers drop food, horses, a recruit order and a market voucher; the lifetime correct count unlocks permanent gear.

**C 层：让学习看得见 · Make the learning visible**
掌握度地图、连击与今日进度、复习队列（「今天该复习的 N 题」）、错题本、成绩趋势。
A mastery map, streaks and today's progress, a review queue, a mistake book and a score trend.

**D 层：让学习改变战斗 · Let the learning change the fight**
**考试 = 经验**：答对一题 +1 经验，经验换属性点（统御 / 医术 / 工程 / 谋略），属性直接改队伍上限、恢复速度、攻城速度与情报；掌握度还能**解锁兵种**。
**An exam is experience**: a correct answer is one experience point, experience buys attribute points (leadership, surgery, engineering, tactics) that change the party cap, the recovery rate, the siege speed and the scouting, and mastery can **unlock troop families**.

### 7.4 推荐的实现顺序 · Recommended order

> 状态 · Status: 第 1–5 项已在 **批次 20** 做完（2026-10-21），第 6 项还没做。数字填空题型、题目难度标签、每日目标与老师工具仍未开始。
> Items 1 to 5 shipped in **batch 20** (2026-10-21); item 6 has not been built yet. The fill-in-the-blank type, the question tags, the daily goal and the teacher tools are still open.

| 优先级 Priority | 项目 Item | 改动文件 Files | 依赖 Depends on | 工作量 Effort | 状态 Status |
| --- | --- | --- | --- | --- | --- |
| P0 | 试卷结算层（连击 / 满分 / 长卷 / 及格） | 新增 `src/game/quiz/reward.js`、`ExamModal.vue`、`tools/verify-quiz.mjs` | 无 None | 1 批次 | ✅ 已做 Done |
| P0 | 答对直接掉道具（军粮 / 战马 / 征兵令 / 集市券） | `src/game/quiz/reward.js`、`src/stores/player.js`、`MarketPanel.vue`、`RecruitPanel.vue` | 上条 The row above | 1 批次 | ✅ 已做 Done |
| P0 | 掌握度地图 + 复习队列 | 新增 `src/game/quiz/mastery.js`、`ExamModal.vue`、`CharacterPanel.vue` | 无 None（由 `questionStats` 派生） | 1 批次 | ✅ 已做 Done |
| P1 | 属性 = 经验（统御 / 医术 / 工程 / 谋略） | 新增 `src/game/skills.js`、`src/stores/player.js`、`battle.js`、`settlement.js`、`CharacterPanel.vue` | 试卷结算层 | 2 批次 | ✅ 已做 Done |
| P1 | 错题本 + 「只考错题」 | `src/game/quiz/mastery.js`、`ExamModal.vue` | 掌握度地图 | 1 批次 | ✅ 已做 Done |
| P1 | 战后复盘卷（打输了给一次补考机会） | `src/stores/battle.js`、`ExamModal.vue`（带 `context` 参数） | 属性 = 经验 | 1 批次 | ⏳ 未做 Not yet |
| P2 | 里程碑道具（军旗 / 徽章 / 药箱 / 驿马） | 新增 `src/game/milestones.js`、`player.js`、`battle.js`、`CharacterPanel.vue` | 试卷结算层 | 1–2 批次 | ✅ 已做 Done |
| P2 | 数字填空题型（契约放宽 + 输入界面） | `registry.js`、`shared.js`、`ExamModal.vue`、`math.js` | 无 None | 1 批次 | ✅ 已做 Done（批次 21） |
| P2 | 题目难度与知识点标签 | `registry.js`、各题型文件 | 无 None | 1 批次 | ⏳ 未做 Not yet |
| P2 | 每日目标与连击统计 | `src/stores/player.js`（stats）、`HomeView.vue` / `WorldView.vue` 芯片 | 试卷结算层 | 1 批次 | ⏳ 未做 Not yet |
| P3 | 老师工具：布置作业 + 学习报告导出 | 新增 `src/game/report.js`、据点 / 首页界面、`tools/` | 掌握度地图 | 2 批次 | ⏳ 未做 Not yet |

### 7.5 重点项的设计规格 · Design notes for the key items

> 状态 · Status: A–D 四项已按下面的规格实现（批次 20）。规格保留在这里，方便以后调数值。
> Items A to D are built as written below (batch 20). The numbers are kept here so they can be tuned later.

**A. 试卷结算层 · The paper settlement**

保持 `rewardFor()` 不动（它已被 `tools/verify-battle.mjs` 的难度检查依赖），把新规则放在**结算层**：

```js
// 一张卷子的结算（新文件 src/game/quiz/reward.js）
settlePaper({ answers, difficulty, rng }) {
  const base = answers.filter(a => a.correct).reduce((n, a) => n + rewardFor(a.question, difficulty), 0)
  const streak = longestStreak(answers)                   // 最长连击
  const streakMul = 1 + Math.min(streak - 1, 5) * 0.1      // ×1.0 … ×1.5
  const perfect = answers.length > 0 && answers.every(a => a.correct)
  const longPaper = answers.length >= 12                  // 12 题卷 +10%
  const passed = correct >= passLineOf(answers.length)
  const gold = Math.round(base * streakMul * (perfect ? 1.5 : 1) * (longPaper ? 1.1 : 1) * (passed ? 1.2 : 1))
  return { base, gold, net: gold, streak, perfect, passed, drops: rollDrops({ answers, perfect, rng }) }
}
```

| 项 Item | 数值 Value | 说明 Note |
| --- | --- | --- |
| 连击倍率 Streak | ×1.0 → ×1.5（每连对 +10%，最多 5 步） | 卷面顶部显示「🔥 连击 ×N」 |
| 满分奖励 Perfect | 本卷金币 ×1.5 | 并掉 1 匹战马 |
| 长卷奖励 Long paper | 12 题卷 ×1.1 | 鼓励一次多做几题 |
| 及格奖励 Pass | 达到 `passLine` 再 +20% | 让「通过」真的有点分量 |
| 答错 Wrong answer | 0 | **不扣钱**：这一题没有金币，连击归零。Nothing is deducted. |

**B. 道具与里程碑 · Gear and milestones**

| 来源 Source | 掉落 Drop | 说明 Note |
| --- | --- | --- |
| 每答对一题 Correct answer | 30% 掉 🌾 军粮 ×1 | 连对 5 题必掉 🌾 ×2 |
| 某一科全对 A subject perfected | 数学 → 🌾 ×2；语文 / 百科 → 🎟️ 集市券 ×1；逻辑 → 📜 征兵令 ×1（免费招 2 名民兵） | 集市券与征兵令是**新道具**，要进 `supplies` |
| 整卷满分 A perfect paper | 🐎 战马 ×1 | 战马 +1% 全军攻击 |
| 里程碑 Milestones | 累计答对 300 → 🚩 军旗（全军攻击 +5%）；500 → 🏅 徽章（每战后 +10 金币）；800 → 💊 药箱（伤兵恢复 +50%）；1200 → 🐎 驿马（移动速度 +10%） | 计数**单独存**，不受 `pruneQuestionStats` 裁剪 |

**C. 掌握度地图 · The mastery map**

不新增存档字段：由 `questionStats` 的 key 前缀（`type:item` 或 `type#kind`）直接聚合出「科目 × 年级」的平均等级、已记录与已掌握数量。

```js
// src/game/quiz/mastery.js（新增）
masteryBySubject(questionStats)   // → { math: { tracked, mastered, avgLevel, grades: {3:…, 4:…} } }
dueQueue(questionStats, now)      // → level < 4 且距离上次复习超过 N 小时的题目 key 列表
```

| 界面 Where | 内容 Content |
| --- | --- |
| 考试设置页 Exam setup | 每个科目一行：掌握度条 + 「已记录 / 已掌握」+「该复习 N 题」 |
| 角色详情面板 Lord panel | 整体掌握度 + 里程碑进度条（军旗 / 徽章 / 药箱 / 驿马） |
| 考试结果页 Result | 本卷新增掌握题数、连击、掉落道具清单 |

**D. 属性 = 经验 · An exam is experience**

| 属性 Attribute | 每点效果 Per point | 孩子能感到的差别 |
| --- | --- | --- |
| 统御 Leadership | 队伍上限 +2 | 能带的兵更多 |
| 医术 Surgery | 伤兵恢复速度 +10% | 打完仗伤兵回得更快 |
| 工程 Engineering | 围城准备 −0.5 天、城镇设施造价 −5% | 围城更快、城镇更便宜 |
| 谋略 Tactics | 战斗开始时显示敌方兵种构成，并给全军 +5% 攻击 | 看得懂对面，带着优势打 |

经验规则：答对一题 +1 经验（不及格不给经验）；每 50 经验换 1 点属性点，属性点由孩子在角色面板里自己分配。

### 7.6 不建议做的 · What not to do

| 想法 Idea | 不做的原因 Why not |
| --- | --- |
| 默认开倒计时 | 8–12 岁的孩子会紧张到不敢做题；连击已经提供了「快一点」的动机，不需要计时 |
| 体力值 / 每日次数限制 | 限制的是游戏时长，不是学习时长；应该鼓励多做 |
| 联网排行榜 | 需要服务端，与「局域网单机」的部署前提冲突；先做本机报告导出 |
| 商城 / 付费道具 | 与「金币只能靠做题获得」的原则冲突 |
| **让答错直接扣金币** | **不做**：答错只损失「机会」（这一题没有金币、连击归零、记忆等级下降），绝不倒扣孩子的金币。**Not doing it**: a wrong answer only costs a chance (no gold for that question, the streak breaks, the memory level drops); the child's coins are never deducted. |
