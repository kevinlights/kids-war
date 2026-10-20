# 开发进度 · Development Progress

`kids-war-game` — 2D top-down strategy game · 2D 俯视策略游戏
Last updated · 最后更新：2026-10-20

This file tracks what is built, what is verified, and what is still open.
本文件记录已完成的内容、验证过的结论，以及仍未完成的部分。

It is the companion to `README.md`: the README explains how the game works, this file explains how far it has got.
它是 `README.md` 的配套文件：README 讲游戏怎么运作，本文件讲它做到了哪一步。

---

## 1. 进度总览 · Progress Overview

| 需求 / 领域 Area | 状态 Status | 说明 Notes |
| --- | --- | --- |
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
| 局域网联机 LAN multiplayer | ❌ 未开始 Not started | 原需求列为「后续可能扩展」。Listed in the original spec as a possible future extension. |
| 排名 / 排行榜 Leaderboards | ❌ 未开始 Not started | 未实现。Not implemented. |

---

## 2. 已完成功能 · Completed Features

### 批次 1 · Batch 1 — 核心玩法 Core gameplay (2026-10-18)

- 搭建 Vue 3 + Pinia + Vue Router（hash 路由）项目骨架，Vite 开发端口 5180 / 预览 4180，均绑定 `0.0.0.0`。
  Vue 3 + Pinia + hash-router scaffold; Vite dev on 5180 and preview on 4180, both bound to `0.0.0.0`.
- 世界生成：值噪声地形、最大连通陆地筛选、据点与部队按势力锚点聚集、出生点靠近首个城镇。
  World generation: value-noise terrain, largest-connected-landmass filter, settlements and faction parties clustered around anchors, spawn next to the first town.
- A* 寻路（二叉堆 + 对角线穿角保护）与「尽力靠近」回退。
  A* pathfinding (binary heap, diagonal corner protection) with a best-effort fallback.
- 世界地图 canvas：地形绘制、据点/部队/玩家/路径/暗角、相机跟随、点击移动。
  World-map canvas: terrain, settlements, parties, player, path, vignette, camera follow and tap-to-move.
- 据点系统：招募（村庄民兵 / 城镇加权高级兵源）、升级树、市场（军粮、战马）。
  Settlements: recruiting (village militia / weighted town elites), the upgrade tree and a market (food, horses).
- 考试系统：三/四年级 × 英文/语文/数学/逻辑 四科生成器，按答对逐题发金币。
  Exam system: grade 3–4 × English/Chinese/math/logic generators, paying gold per correct answer.
- 战斗系统：平原竞技场、三种战术命令、近战与远程、投射物与命中特效、胜负结算。
  Battle system: plains arena, three orders, melee and ranged combat, projectiles and hit sparks, win/lose settlement.
- 存档系统：按名字隔离的 localStorage 存档位，自动保存与手动保存。
  Save system: per-name localStorage slots, autosave and manual save.

### 批次 2 · Batch 2 — 手机端、分享与战败修复 Mobile, sharing, defeat fix (2026-10-18)

- 手机端适配：`100dvh` 动态视口、关闭橡皮筋滚动与点击灰块、44 px 触控目标、HUD 安全区、560 px 断点（世界地图底部栏竖排 + 四列按钮网格、图例默认收起、列表行折行、考试选项单列）。
  Mobile pass: `100dvh`, no rubber-band scroll or tap highlight, 44 px targets, HUD safe areas and 560 px breakpoints (stacked world bottom bar with a four-button grid, collapsed legend, wrapped list rows, single-column exam answers).
- 性能：世界地图暗角渐变改为每次 resize 生成一次，不再每帧分配。
  Performance: the world-map vignette gradient is built once per resize instead of per frame.
- 二维码分享弹窗：本地编码、剪贴板回退；入口在首页与世界地图，弹窗由 `App.vue` 统一承载。
  QR share popup: local encoding with a clipboard fallback; reachable from the home screen and the world map, owned by `App.vue`.
- **战败逻辑修复**：战败不再凭空补回 4 名民兵——战后队伍等于战场幸存者；敌方部队同步为它的幸存者（被全歼则移除）；删除了失效的 `loseFraction`；无兵时不触发遭遇战。
  **Defeat fix**: a loss no longer grants a free 4 militia — the warband becomes exactly the on-field survivors; the enemy party is rewritten to its own survivors (or removed when wiped); the dead `loseFraction` call was deleted; a troopless lord is not attacked.

### 批次 3 · Batch 3 — 文档 Documentation (2026-10-18)

- 新增本 `progress.md` 与 `README.md`（双语：一行英文一行中文），覆盖玩法、机制、势力兵种、界面、操作、分享、奖励、数据、手机端、部署、维护、结构与排错。
  Added this `progress.md` and `README.md` (bilingual, English line then Chinese line) covering gameplay, mechanics, factions and units, screens, controls, sharing, rewards, data, mobile, deployment, maintenance, structure and troubleshooting.

### 批次 4 · Batch 4 — 角色信息面板 Lord info panel (2026-10-18)

- 新增 `src/components/CharacterPanel.vue`：只读弹窗，从 `player` / `world` store 读数，展示领主名字与天数、当前驻扎地形、金币 / 军粮 / 战马、逐兵种部队列表（等级 T、数量、攻 / 防 / 血、该兵种日薪小计）、每日军饷合计与战绩（胜 / 总、胜率、考试次数、累计答对）。
  Added `src/components/CharacterPanel.vue`: a read-only popup that reads from the player and world stores and shows the lord name and day, the terrain being stood on, gold/food/horses, a per-unit roster (tier, count, atk/def/hp and its daily wage subtotal), the total daily wage and the record (wins/battles, win rate, exams, correct answers).
- 世界地图顶部状态栏新增可点击的 **👤 角色详情** 芯片（金色高亮）打开该面板，`WorldView.vue` 持有 `showCharacter` 状态并在关闭后回到地图。
  A tappable gold-highlighted **👤 lord info** chip was added to the world-map status bar; `WorldView.vue` owns the `showCharacter` flag and returns to the map when the popup closes.
- `player.dailyWage` getter 因此首次被界面引用（仅展示，日薪仍未真正扣除）。
  This makes the `player.dailyWage` getter the first one used by a screen (display only — upkeep is still not deducted).

### 批次 5 · Batch 5 — 像素素材 Pixel art assets (2026-10-18)

- 新增 `tools/pixel-assets/generate.mjs`：自带一个 JS 光栅器（矩形 / 圆 / 椭圆 / 圆角矩形 / 线 / 粗线 / 多边形 / 擦除 / 描边膨胀），经 Pixelorama 桥接按 `create_canvas → draw_pixels → export_image(scale 1) → close_canvas` 逐张出图，导出到 `public/pixel/<分类>/`，并在每次运行结尾写全量 `index.json`。
  Added `tools/pixel-assets/generate.mjs`: a JS rasterizer (rect / circle / ellipse / roundRect / line / stroke / poly / erase / outline dilation) that flushes whole pixel grids through the Pixelorama bridge (`create_canvas → draw_pixels → export_image(scale 1) → close_canvas`) into `public/pixel/<category>/`, always writing the full `index.json` at the end.
- 共 17 张 32×32 素材：`unit/`（民兵、步兵、弓箭手、骑兵、精锐步兵、骑士、神射手、领主 —— 共用一套身体结构，靠头盔和武器区分兵种，骑兵与骑士骑在马上）、`settlement/`（城镇城堡、村庄茅屋）、`banner/`（强盗蒙面旗、苍狼旗、赤鹰旗）、`terrain/`（森林树木、山峰、浪花、沙丘）。
  17 sprites at 32x32: `unit/` (the seven types plus the lord, all sharing one body plan and told apart by helmet and weapon, with the two mounted types on horseback), `settlement/` (town castle, village huts), `banner/` (bandit mask, wolf, eagle) and `terrain/` decorations (trees, peak, foam, dunes).
- 修掉生成器自身的两个缺陷：描边膨胀用 `y*w+x` 建键，`x-1` 会回绕成上一行第 31 列，导致素材对侧边缘出现孤立像素列；骑兵 / 骑士的长枪尖与马尾贴到画布边缘，描边被裁。现在素材四边都留 1 像素余量。
  Fixed two generator defects: the outline pass keyed pixels as `y * w + x`, so testing `x - 1` wrapped to the last column of the row above and painted isolated pixels on the opposite edge; and the mounted units' lance tip and tail touched the canvas edge, clipping their outline. Every sprite now keeps one pixel of margin.
- 新增 `src/game/pixelAssets.js`：素材清单（名字 → 目录）、`loadSprites()` 并行预加载、`drawSprite()`（canvas 最近邻绘制，支持左右翻转）与 `spriteUrl()`；`main.js` 在启动时就发起预加载，玩家进入世界地图时素材已在内存中。
  Added `src/game/pixelAssets.js`: the manifest (name → folder), parallel `loadSprites()` preloading, `drawSprite()` (nearest-neighbour canvas draw with an optional flip) and `spriteUrl()`; `main.js` kicks the preload off at boot so the sprites are already in memory when the player reaches the world map.
- 全部画面接入：世界地图（领主、势力军旗、城镇 2 倍城堡、村庄茅屋、树林 / 山峰 / 浪花 / 沙丘）、战场（兵种素材 + 蓝红阵营底盘 + 血条 + 按朝向翻转，指挥官用领主素材）、招募与升级面板、战斗结算幸存者列表、角色面板兵种图标（均 32 px 且 `image-rendering: pixelated`）。
  Wired into every screen: the world map (lord, faction banners, 2x town castle, village huts, trees / peaks / foam / dunes), the battle arena (unit art on blue and red side discs with health bars and facing flips, the lord sprite for the commander), the recruit and upgrade panels, the battle result survivor list and the lord panel's unit icons (all 32 px with `image-rendering: pixelated`).
- 删除 `UNIT_TYPES` 里已废弃的占位美术字段 `color` 与 `glyph`；`factionOf().color` 与 `TERRAIN.color` 仍在使用，保留。
  Removed the now-dead placeholder art fields `color` and `glyph` from `UNIT_TYPES`; `factionOf().color` and `TERRAIN.color` are still in use and stay.

### 批次 6 · Batch 6 — 兵种标准化与小队战术 Standard roster and squad tactics (2026-10-18)

- **兵种标准化**：删除旧的三级扁平兵种表（militia / infantry / archer / cavalry / veteran / knight / marksman），改成「民兵 + 三个家族 × 四档」；`{ type, tier, count }` 成为全工程唯一的士兵存储形状（玩家部队、城镇库存、敌方部队一致）。档位共用一套乘数：属性 ×1 / 1.3 / 1.65 / 2.05、兵价 ×1 / 1.9 / 3.1 / 4.7、日薪 ×1 / 1.5 / 2 / 2.5，弓箭手射程每档 +10%。
  **Roster standardisation**: the old flat three-tier list (militia / infantry / archer / cavalry / veteran / knight / marksman) became militia plus three families × four ranks, and `{ type, tier, count }` is now the only soldier shape in the project (player warband, town stock and enemy parties alike). Ranks share one multiplier set — stats ×1 / 1.3 / 1.65 / 2.05, price ×1 / 1.9 / 3.1 / 4.7, wage ×1 / 1.5 / 2 / 2.5 — and archer range grows 10% per rank.
- **克制循环**：长枪兵克制骑兵、骑兵克制弓箭手、弓箭手克制长枪兵，克制方攻击 ×1.4、被克制方 ×0.75；民兵不参与循环。等级箭头由 `units.js` 的 `COUNTERS` 单点定义。
  **Counter cycle**: spearman beats cavalry, cavalry beats archer and archer beats spearman, worth ×1.4 attack when countering and ×0.75 when countered; militia sits outside the cycle. The arrows are defined once, in `COUNTERS`.
- **升级经济学**：`upgradeCost = max(8, round((目标价 − 当前价) × 0.7))`，「民兵 → 家族一级」与「家族内逐档升级」共用同一条公式，逐级爬到精英永远比直接买精英便宜（例如长枪兵 13 + 78 < 141）。
  **Upgrade economics**: `upgradeCost = max(8, round((to − from) × 0.7))` serves both the militia → family entry and the rank-by-rank climb, so climbing is always cheaper than buying the elite (spearman: 13 + 78 < 141).
- **城镇兵源重做**：`TOWN_POOL` 改成 12 行「家族 + 档位」加权池（低级常见、精英稀少），城镇随机滚 4 个不重复档位再附加民兵，仍带 ×1.15 加价并固定按据点种子；全村只卖民兵。
  **Town stock rebuilt**: `TOWN_POOL` is now 12 weighted family-and-rank rows (low ranks common, elites rare); a town rolls four distinct rows plus militia, keeps the ×1.15 markup and stays seeded per settlement. Villages still sell militia only.
- **战斗重做**：每支「家族 + 档位」小队独立持有命令 / 队形 / 密度，命令扩到 攻击 / 防守 / 跟随 / 移动（新增「移动」= 点击战场插旗并原地待命），队形 6 种（方队 / 一行 / 两行 / 三行 / 尖形 / 随机）、密度 2 种（松散 / 紧凑），三者都带攻 / 防 / 移速 / 远程减伤修正；点击战场按当前选中小队分流到「插旗」或「移动指挥官」。
  **Battle rebuilt**: every family-and-rank squad owns its order, formation and density; orders grew to 攻击 / 防守 / 跟随 / 移动 (the new 移动 plants a rally flag and waits), with six formations (square / single rank / two ranks / three ranks / wedge / scatter) and two densities (loose / tight), all carrying attack / defence / speed / ranged-damage modifiers; a tap on the field is routed to flag planting or commander movement depending on the selected squad.
- **远程风筝与近战压迫**：攻击命令下的远程小队在敌人进入射程一半时边退边射（防守时不后退）；近战小队冲锋时把队形偏移压到 13 px 以内，避免后排因为偏移量停在接战距离之外。
  **Ranged kiting and melee crowding**: attacking ranged squads back away while still shooting once a foe closes to half their range (defending squads never fall back), and charging melee squads have their slot offsets capped at 13 px so the rear ranks cannot hover out of striking distance.
- **平衡修正（无头对战驱动）**：修复方队行数 `((n-1) % cols) + 1` 导致大编制方块在 y 轴偏离锚点 0.5 格的问题（改为 `min(cols, n)`），并让楔形队最后一排不满时也居中。修完后 8v8 / 16v16 的克制对角线全部 100%，反向全部 0%，民兵对三个家族全部 0%，无平局。
  **Balance fixes, driven by the headless duels**: the square layout's row count `((n-1) % cols) + 1` left large blocks half a gap off-centre in y (now `min(cols, n)`), and a partly filled wedge's last rank is centred too. After the fix every counter-cycle diagonal is 100% at 8v8 and 16v16, every reverse matchup 0%, militia 0% against all three families, and no duel ends in a draw.
- **素材**：新画 `spearman.png` 与 `spearman-elite.png`（生成器新增斜置长枪 `paintWeapon 'spear'`），删除废弃的 `infantry.png` / `veteran.png`；`unitSprite(type, tier)` 把 1–2 档映射到普通外观、3–4 档映射到精英外观，`index.json` 仍为 17 张。
  **Assets**: drew `spearman.png` and `spearman-elite.png` (the generator gained a diagonal pike, `paintWeapon 'spear'`) and deleted the dead `infantry.png` / `veteran.png`; `unitSprite(type, tier)` maps ranks 1–2 to the basic art and 3–4 to the elite art, and `index.json` still lists 17 files.
- **文档**：README 的三大块重写（4.3 招募与升级、4.5 战斗含命令 / 队形 / 密度 / 克制表、5.2 兵种表扩到 13 行），新增「兵种升级图」与「新增兵种 / 旧存档改写」维护说明；本文件补充了总览行、本批次与验证记录。
  **Docs**: three README blocks were rewritten (4.3 recruiting and upgrading, 4.5 battle with the order / formation / density / counter tables, and 5.2's roster table grown to 13 rows), plus new maintenance notes on the upgrade diagram and on adding a unit / migrating old saves; this file gained overview rows, this batch and a verification record.

### 批次 7 · Batch 7 — 移动驱动的时钟、扎营与页签修复 Movement-driven clock, camping and the tab fix (2026-10-18)

- **时间改由移动驱动**：原先 `tick()` 每帧无条件累加 `timeAcc`，一天固定 24 秒真实时间。现在每帧先统计主角实际走过的世界距离 `travelled`，只有 `travelled > 0` 或处于扎营状态才把该帧算进游戏时间（`gdt = flowing ? dt : 0`）；天数、敌方冷却、敌方游荡全部改用 `gdt`，因此主角站着不动时世界一起冻结。状态新增 `timeFlowing`（每帧写入）供界面读取。
  **Time is now movement-driven**: `tick()` used to add every frame to `timeAcc`, so a day was a fixed 24 real seconds. It now measures the world distance the lord actually covered this frame and only counts that frame as game time while `travelled > 0` or while camping (`gdt = flowing ? dt : 0`); the day counter, party cooldowns and party wandering all use `gdt`, so standing still freezes the whole world. A new `timeFlowing` flag is written every tick for the UI.
- **扎营**：新增 `startCamp()` / `stopCamp()` / `toggleCamp()` 与 `camping` 标志；扎营会清空当前路径，让时间与敌军照常流转。`moveTo()` 在目标格与主角当前格不同时会自动拔营（点自己脚下那格则保留营地）。进入据点也会拔营。
  **Camping**: added `startCamp()` / `stopCamp()` / `toggleCamp()` and a `camping` flag; camping clears the current path and lets the clock and every party keep running. `moveTo()` breaks camp whenever the tapped tile differs from the lord's own tile (tapping your own tile keeps it), and entering a settlement breaks camp too.
- **界面**：顶部 📅 天数芯片改为时钟读数（⏸ 停滞 / ⏳ 流逝 / 🔥 扎营，`live` 时文字转绿），底部新增「⛺ 扎营 / 🔥 拔营」切换按钮与随状态变化的提示条，手机端把两个按钮并排、提示条独占一行；角色面板头部改为「第 N 天 · 位于<地形>」加一行时钟状态。
  **UI**: the 📅 day chip became the clock readout (⏸ 停滞 / ⏳ 流逝 / 🔥 扎营, turning green via a `live` class), the bottom bar gained a 「⛺ 扎营 / 🔥 拔营」 toggle with a state-aware hint, and on phones the two buttons sit side by side with the hint on its own row; the lord panel header now reads 第 N 天 · 位于<terrain> with a second line for the clock state.
- **地图表现**：新增 32×32 `terrain/camp.png`（帐篷 + 篝火，生成器里的 `paintCamp`），扎营时在领主身边绘制营地图标与呼吸式火光，同时把选中环改成暖色；素材总数 17 → 18。
  **Map**: added a 32x32 `terrain/camp.png` (a tent plus campfire, via `paintCamp` in the generator), drawn beside the lord while camping with a flickering firelight glow and a warm selection ring; the asset count went 17 → 18.
- **存档**：新增 `day` 字段（`saveGame` / `persistGame` / `world.hydrate`），修掉「刷新后天数回到第 1 天」的旧缺陷；未走完的时钟进度与扎营状态不写入存档，读档后总是原地站立、时钟冻结。
  **Save**: added the `day` field (`saveGame` / `persistGame` / `world.hydrate`), fixing the old bug where the day counter reset to 1 after a reload; the in-flight clock and the camp flag are not saved, so a resumed game always stands still with the clock frozen.
- **修复据点页签空白**：`UpgradePanel.vue` 模板里的 `spriteUrl(unitSprite(...))` 调用了从未导入的 `unitSprite`，渲染函数抛错并中断了整个 `SettlementView` 的更新，表现就是切到「升级」「考试」后内容区被清空（控制台可见 `[Vue warn] Unhandled error during execution of render function`）。补上导入即可，四个页签均恢复显示。
  **Settlement tab fix**: `UpgradePanel.vue`'s template called `unitSprite` without ever importing it, so its render function threw and aborted the whole `SettlementView` update — the content area went blank on the 升级 and 考试 tabs (with `[Vue warn] Unhandled error during execution of render function` in the console). Adding the import brought all four tabs back.
- **文档**：README 新增 4.1 的时间 / 扎营规则、6 世界地图行、7 的移动与扎营操作、10 的 `day` 字段、13 的 `camp` 素材，以及两条排查条目（世界不动、页签空白）；介绍页补了地图卡与操作条目；本文件更新总览行、本批次、限制与验证记录。
  **Docs**: README gained the time / camping rules in 4.1, the world-map screen row in 6, the move and camp controls in 7, the `day` field in 10, the `camp` asset in 13 and two troubleshooting entries (a frozen world, a blank tab); the in-game guide gained the map card line and a control bullet; this file gained overview rows, this batch, limitations and verification records.

### 批次 8 · Batch 8 — 百科题库、记忆曲线与 Mod 扩展 Encyclopedia, memory curve and mods (2026-10-19)

- **百科知识题库**：新增 `src/game/quiz/encyclopedia.js`，共 64 道声明式题目（三年级 32 / 四年级 32），每题都带 `explain` 解析；注册为第五个科目「百科知识 🔬」，考试设置页自动出现。
  **Encyclopedia bank**: added `src/game/quiz/encyclopedia.js` with 64 declarative items (32 for grade 3, 32 for grade 4), each carrying an `explain` note; registered as the fifth subject 「百科知识 🔬」 and picked up by the exam setup automatically.
- **记忆曲线调度**：新增 `src/game/quiz/scheduler.js`——每题 0–5 级，`weight(level) = max(0.05, 0.55^level)`，答对 +1、答错 −2；`forgetLevels()` 按 20 小时掉一级（单次最多两级）实现跨场次遗忘；出卷改用 `pickWeighted()` 加权抽取，并避免同一模板连续出现两次。声明式题按 `<mod>:<itemId>` 记录，程序生成题按 `<mod>#<kind>` 记录。
  **Memory-curve scheduler**: added `src/game/quiz/scheduler.js` — levels 0–5, `weight(level) = max(0.05, 0.55^level)`, +1 for a correct answer and −2 for a wrong one; `forgetLevels()` costs one level per 20 idle hours (at most two per pass) for cross-session forgetting; papers are drawn with `pickWeighted()` and the same template is avoided twice in a row. Declarative items are tracked as `<mod>:<itemId>` and generated items per template as `<mod>#<kind>`.
- **Mod 注册表**：新增 `src/game/quiz/registry.js` 与 `src/game/quiz/mods.js`，所有科目（含四个原科目）统一走 `{ key, name, en, icon, grades, items|questions, kinds }` 契约；`loadMods()` 启动时读 `public/mods/index.json` 与各 JSON 包，坏包跳过、重复 key 先到先得；`window.kidsWarGame.loadModsFromText()` 可在控制台直接试包。示例包 `public/mods/safety.json` 提供 12 道「安全常识 🚦」。
  **Mod registry**: added `src/game/quiz/registry.js` and `src/game/quiz/mods.js`, so every subject (the four originals included) follows one `{ key, name, en, icon, grades, items|questions, kinds }` contract; `loadMods()` reads `public/mods/index.json` plus each JSON pack at boot, skipping broken files and keeping the first duplicate key; `window.kidsWarGame.loadModsFromText()` tries a pack straight from the console. The example `public/mods/safety.json` adds 12 「安全常识 🚦」 items.
- **存储与界面**：player store 新增 `questionStats`、`questionWeight` / `questionLevel` / `memorySummary`、`recordAnswer()`、`applyQuestionForgetting()` 与 `pruneQuestionStats()`；`questionStats` 写进存档并在保存时裁剪到最近 1200 条。`ExamModal.vue` 改为动态科目、出卷前等待 `ensureModsLoaded()`、逐题记录对错、答错时显示解析，设置页新增「已记录 N 题 / 掌握 M 题」；介绍页新增记忆曲线与题库扩展两张卡片，科目标签也改成动态渲染。
  **Storage and UI**: the player store gained `questionStats`, `questionWeight` / `questionLevel` / `memorySummary`, `recordAnswer()`, `applyQuestionForgetting()` and `pruneQuestionStats()`; `questionStats` is saved and pruned to the 1200 most recent records. `ExamModal.vue` now renders subjects dynamically, awaits `ensureModsLoaded()` before drawing, records every answer, shows `explain` after a wrong one, and the setup screen reports 「已记录 N 题 / 掌握 M 题」; the guide gained memory-curve and mod cards and its subject tags are dynamic too.
- **题库扩容**：英文各年级补 25 / 24 个单词；语文新增 `stroke`（笔顺）与 `radical`（部首）题型并补充反义词 / 近义词 / 量词 / 成语 / 读音 / 修辞 / 古诗；数学新增 `money`、`timeDiff`、`average`、`speed`、`fractionSame`；逻辑新增 `compare`、`chickenRabbit`、`arrange`、`handshake`。
  **Bank growth**: English gained 25 / 24 words per grade; Chinese gained the `stroke` and `radical` kinds plus more antonyms, synonyms, measure words, idioms, readings, rhetoric and poems; math gained `money`, `timeDiff`, `average`, `speed` and `fractionSame`; logic gained `compare`, `chickenRabbit`, `arrange` and `handshake`.
- **选项上限修复**：`choice()` 过去允许保留全部干扰项，部分语文题会生成 5–6 个选项，撑破手机单列布局；现在固定最多 3 个干扰项，所有题目统一为 2–4 个选项。
  **Option cap fix**: `choice()` used to keep every distractor, so some Chinese questions produced 5–6 options and broke the single-column phone layout; it now keeps at most three, making every question 2–4 options.
- **奖励**：科目加成改为表驱动 `{ logic: 6, encyclopedia: 4 }`，百科题在年级基础分（20 / 26）上再加 4 金币。
  **Rewards**: subject bonuses are now table-driven (`{ logic: 6, encyclopedia: 4 }`), so an encyclopedia answer pays the grade base (20 / 26) plus 4 gold.
- **文档**：README 4.4 扩写为「科目 + 记忆曲线」，第 6、9、10 节补上百科、奖励与 `questionStats`，第 13 节把「新增题目类型」重写为完整的 Mod 规范（字段表、JSON 示例、加载顺序、内置生成器写法、校验规则），项目树与关键文件同步；本文件补总览行、本批次、限制、路线图、验证记录与变更记录。
  **Docs**: README 4.4 grew into subjects plus the memory curve, sections 6 / 9 / 10 gained the encyclopedia subject, the reward and `questionStats`, and section 13 turned 「新增题目类型」 into the full mod spec (field tables, JSON example, load order, built-in generator path and validation rules), with the project tree and key files updated; this file gained overview rows, this batch, limitations, roadmap items, verification records and a changelog entry.

### 批次 9 · Batch 9 — 小地图、详细地图与将领素材 Minimap, detailed atlas and commander art (2026-10-19)

- **小地图**：新增 `src/components/MiniMap.vue` 与 `src/game/atlas.js` 的 `drawMiniMap()`，在世界地图右上角画出整张世界——方块化地形、每座城镇一个金色方块（带深色描边）、每个村庄一个浅色小方块、每支游荡部队一个势力色圆点、主地图当前视野的白色矩形框，以及作为脉动蓝点的主角。面板宽 124 px（手机 104 px），按世界 80 × 64 的比例用 CSS `aspect-ratio` 定高，canvas 备份尺寸按 `devicePixelRatio`（上限 2）自适应。
  **Minimap**: added `src/components/MiniMap.vue` and `drawMiniMap()` in `src/game/atlas.js`, painting the whole world in the top-right corner of the world map — blocky terrain, a gold square with a dark outline per town, a smaller pale square per village, a faction-coloured dot per roaming warband, a white rectangle for what the main map is looking at, and the lord as a pulsing blue dot. The panel is 124 px wide (104 px on phones), sized from the 80 × 64 world through CSS `aspect-ratio`, with the backing store following `devicePixelRatio` (capped at 2).
- **可拖动的详细地图**：新增 `src/components/WorldAtlas.vue`，点击小地图打开浮层，以 `ATLAS_SCALE = 16` px/格（世界即 1280 × 1024）渲染同一张地图，画上据点素材与名字牌、三位将领与主角（都带兵力角标）。用 pointer 事件加 `setPointerCapture` 拖动平移，`touch-action: none` 让手指拖的是地图而不是页面；`clampPan()` 保证世界始终盖满视口（世界比视口小时居中），打开时自动居中到主角，底部「🎯 回到主角」随时拉回视野，✕ 或 Esc 关闭。浮层打开时世界照常推进（不暂停）。
  **Draggable atlas**: added `src/components/WorldAtlas.vue`; tapping the minimap opens an overlay that renders the same map at `ATLAS_SCALE = 16` px per tile (1280 × 1024 world) with the settlement sprites and name plates plus the three commanders and the lord, each with a troop badge. Pointer events plus `setPointerCapture` drive the panning and `touch-action: none` keeps the finger on the map instead of the page; `clampPan()` guarantees the world always covers the viewport (centred when it is smaller), opening centres on the lord, the 「🎯 回到主角」 button recentres at any time, and ✕ or Esc closes. The world keeps ticking behind the overlay — it is not a pause screen.
- **地形缓存**：`atlas.js` 的 `terrainImage(seed, grid)` 每个世界只建一次「一格一像素」的 80 × 64 画布，两张地图都用 `imageSmoothingEnabled = false` 把它 `drawImage` 放大，因此每帧成本是一次贴图而不再是几千次 `fillRect`。
  **Terrain cache**: `terrainImage(seed, grid)` in `atlas.js` builds one 80 × 64 canvas at one pixel per tile per generated world, and both maps blit it upscaled with `imageSmoothingEnabled = false`, so a frame costs a single `drawImage` instead of thousands of `fillRect` calls.
- **兵力角标**：新增共用的 `drawBadge()`，世界地图的敌将与主角、详细地图上的每个图标都调用它；主角的角标是 `player.totalTroops`，部队的是 `partyTroops(p)`。图例底部补了一行说明「图标右上角数字 = 兵力」。
  **Troop badges**: added a shared `drawBadge()` used by every commander and the lord on the world map and by every icon on the atlas; the lord's badge is `player.totalTroops` and a party's is `partyTroops(p)`. The legend gained a line explaining 「图标右上角数字 = 兵力」.
- **将领素材替换军旗**：`banner/` 分类改名为 `commander/`，三张军旗重画成同一身体结构上的将领——灰色连帽 + 蒙面（`paintMask`，多米诺眼罩）持剑的强盗、紫色盔冠 + 披风 + 狼纹盾（`paintWolfMark`）的队长、骑马的琥珀色枪骑（胸甲上画 `paintEagleMark` 展翅鹰）。`SPRITE_CATEGORY` 里 `bandit / wolf / eagle` 一并改指 `commander`，旧目录与旧代码删除。
  **Commanders replace banners**: the `banner/` category became `commander/`, and the three banners were redrawn as commanders on the shared body plan — a grey hooded, domino-masked, sword-carrying bandit (`paintMask`), a purple crest-helmed captain with a cape and a wolf-marked shield (`paintWolfMark`), and an amber mounted lancer with a spread eagle on his tabard (`paintEagleMark`). `SPRITE_CATEGORY` now maps `bandit / wolf / eagle` to `commander`, and the old folder and code are gone.
- **势力配色单一来源**：生成脚本改为 `import { FACTIONS } from '../../src/game/factions.js'`，衣色直接取 `FACTIONS[key].color`，明暗由新增的 `shade(hex, amount)` 推导（`clothLight` / `clothDark` / `accent`）；`COMMANDERS` 表规定头盔、武器、是否骑马与纹章。**强盗由红改灰**（`#d8533f` → `#9aa2ab`），成为唯一没有王国色的势力，苍狼紫 `#7a5cc0` 与赤鹰琥珀 `#c98a2b` 不变。战场底盘用的是硬编码蓝 / 红，所以改色不影响战斗画面。
  **One source of truth for faction colour**: the generator now does `import { FACTIONS } from '../../src/game/factions.js'` and takes the cloth straight from `FACTIONS[key].color`, deriving the shades through a new `shade(hex, amount)` (`clothLight` / `clothDark` / `accent`); the `COMMANDERS` table decides helmet, weapon, mount and emblem. **Bandits went from red to grey** (`#d8533f` → `#9aa2ab`), the one faction with no kingdom colour, while the purple wolf `#7a5cc0` and the amber eagle `#c98a2b` stay. The arena discs are hardcoded blue / red, so the recolour does not touch battles.
- **图例改为素材驱动**：世界地图的图例不再写死色点，而是按 `FACTIONS` + `NPC_FACTIONS` 生成「主角 + 每个势力一位将领 + 城镇 + 村庄」六行，左边画真实素材、右边画势力色块，敌对势力自动带「(敌)」后缀——以后加势力只要改 `factions.js`，图例、小地图圆点与素材配色会一起跟上。
  **Sprite-driven legend**: the world-map legend no longer hardcodes colour dots; it builds six rows from `FACTIONS` + `NPC_FACTIONS` (the lord, one commander per faction, a town, a village) with the real sprite on the left and the faction colour on the right, adding an 「(敌)」 suffix to hostile factions automatically — a new faction only needs an entry in `factions.js` and the legend, the minimap dots and the sprite cloth follow.
- **world store**：新增 `viewW` / `viewH`，由每帧的 `updateCamera(viewW, viewH)` 写入，供小地图画出视野框。
  **World store**: added `viewW` / `viewH`, written by the per-frame `updateCamera(viewW, viewH)` so the minimap can outline the camera rectangle.
- **修复升级兵种错位**：`upgradesFor()` 生成的升级连线只有家族记录的 `key` 而没有 `type`，而界面和 `player.upgradeTroops()` 都只按 `{ type, tier }` 匹配；于是「全部是民兵」时点任一分支（长枪兵 / 弓箭手 / 骑兵），实际写入的是一个 `type` 为空的兵员——界面按未知兵种回退成民兵显示，价格也退化成 8 金币保底价，三行还共用同一个步进器 key（同一个 `v-for` 报重复 key 警告）。修法是让 `unitDef()` 的定义对象带上 `type: base.key`（升级边直接复用），`upgradesFor()` 的每条边再显式写明目标家族与档位，`player.upgradeTroops()` 查到边之后一律使用 `edge.type / edge.tier / edge.cost`，只允许写入升级树真的出售的家族与档位。
  **Promotion target fix**: the edges built by `upgradesFor()` carried the family record's `key` but no `type`, while the panel and `player.upgradeTroops()` match on `{ type, tier }`; with an all-militia warband, tapping any branch (spearman / archer / cavalry) therefore stored a soldier with an empty type, which the UI fell back to militia for and which cost only the 8-gold floor — the three rows even shared one stepper key (a duplicate-key warning from the same `v-for`). The fix gives `unitDef()` a `type: base.key` field (reused by the edges), spells out the target family and rank on every edge in `upgradesFor()`, and makes `player.upgradeTroops()` use `edge.type / edge.tier / edge.cost` after the lookup, so the store can only ever write a family and rank the tree really sells.
- **文档**：README 新增 4.2 小地图与全图（其后小节顺延为 4.3–4.9）、5.1 的将领与角标、6 的世界地图行、7 的「看全图」操作、11 的触屏拖动、13 的素材分类与生成命令、14 的项目树与关键文件，以及 13 / 15 中与本轮修复相关的升级边契约说明与排查条目；本文件补总览行、本批次、限制、验证记录与变更记录。
  **Docs**: README gained 4.2 on the minimap and the atlas (renumbering the following subsections to 4.3–4.9), the commanders and badges in 5.1, the world-map row in 6, the "open the atlas" control in 7, touch panning in 11, the asset categories and generator command in 13, the project tree and key files in 14, and a new troubleshooting entry in 15; this file gained overview rows, this batch, limitations, verification records and a changelog entry.

### 批次 10 · Batch 10 — 受伤恢复、据点归属与城镇发展 Wounds, ownership and town development (2026-10-20)

- **地图扩大一倍 · The world is twice as big**：世界从 80 × 64 变成 **160 × 128** 格，城镇 **4 → 8**、村庄 **12 → 24**，大陆最小面积阈值同步放大；小地图仍是 1.25 的宽高比，详细地图继续用一张地形贴图，因此性能不受影响（世界生成实测约 7 ms）。
  **The world is twice as big**: 80 × 64 becomes **160 × 128** tiles, with **8** towns and **24** villages; the minimum mainland grows with it. The minimap keeps its 1.25 ratio and the atlas still blits one cached terrain picture, so the size costs nothing (world generation measures about 7 ms).
- **势力会变强 · The factions grow**：每过一天，各势力在自己未到上限时给最强的一支部队补一名士兵（偶尔是二级老兵）；每隔一天还会出现一伙新的强盗，直到地图上有 **50 支**强盗为止。每个势力的兵力上限是 `20 + 0.6 ×（所有已占领城镇的繁荣度之和）`——主角的领地越富，敌人越强。
  **The factions grow**: every day a faction below its cap reinforces its strongest warband by one soldier (a rank-2 veteran now and then), and a new band of bandits wanders onto the map every second day until it holds **50** of them. The cap on a faction's soldiers is `20 + 0.6 × (the prosperity of every captured town)`: the richer the empire, the stronger the rivals.
- **可以只进不占 · Enter without conquering**：强盗的村庄仍然进不去，但**别的势力的城镇可以直接进去**（考试、招募都行），想要据为己有才需要打；**无主的城镇没有守军**，底部按钮「🚩 占领」直接拿下。
  **Entering without conquering**: a bandit village is still closed, but a town held by a kingdom can now be walked into (exams and recruiting included) and only has to be stormed if the lord wants to own it; an unclaimed town has no defenders and is taken with 「🚩 占领」.
- **士兵带伤 · Soldiers carry wounds**：士兵组的形状从 `{ type, tier, count }` 变成 `{ type, tier, count, hp }`，`hp` 与士兵一一对应。战斗里生命值归零的士兵算「被打败」：有 35% 的基础概率只受重伤（1 点生命）活下来，医院每级再 +10%。伤兵带着剩余生命进入下一场战斗，升级会换上新装备因此回满血。
  **Soldiers carry wounds**: a troop group is now `{ type, tier, count, hp }` with one value per soldier. A soldier that reaches 0 HP is defeated: it survives as a wounded soldier (1 HP) with a 35% base chance, +10% per hospital level. A wounded soldier carries its damage into the next battle, and a promotion heals it.
- **恢复速率 · Recovery rates**：行军 / 扎营每点每天 6，在据点休整 24，自己的城镇再按等级 +6 ×(等级 − 1)，医院每级把速率乘 (1 + 0.5)。恢复按「天」结算，因此在城镇里休整时时钟照常流逝（地图上的部队原地不动）。
  **Recovery rates**: 6 hit points a day on the march, 24 while resting in a settlement, more in your own town (+6 per level) and multiplied by (1 + 0.5) per hospital level. Recovery is settled per day, so resting in a settlement keeps the clock running while the warbands on the map hold their ground.
- **据点归属 · Settlement ownership**：每个据点现在有唯一归属（`neutral` / `player` / `bandit` / `wolf` / `eagle`）。**强盗永远不占城镇**，只能控制村庄；被强盗控制的村庄不能进入，但可以「⚔️ 赶走强盗」与驻军作战，赢了就变成无主可进入。地图上每个据点画一圈归属方颜色的光环。
  **Settlement ownership**: every settlement has exactly one owner. **Bandits never hold a town** — only villages; a bandit village cannot be entered but can be cleared with 「⚔️ 赶走强盗」, after which it turns unclaimed and open. The map draws an ownership ring in the holder's colour.
- **驻军与围城 · Garrisons and sieges**：所有据点都有驻军（按归属方兵种生成，城镇更大）。王国城镇不能直接进入，要「🏰 准备围城」**2 天**；准备期间**时间照常流逝**，驻军每天增援（最多 +4），归属方还会派一支援军奔向城镇并在路上反击进攻者。准备结束后「⚔️ 攻打」，打下来城镇就归主角（驻军清空、等级回到 1）。
  **Garrisons and sieges**: every settlement fields a garrison. A kingdom town cannot be entered: 「🏰 准备围城」 takes two days, and **the clock keeps running** — the garrison grows by one soldier a day (up to four extra) and the owner sends a relief warband that marches to the town and turns on the attacker. Then 「⚔️ 攻打」 takes the town: no garrison, level 1.
- **城镇发展 · Town development**：考试收入**永远进主角的钱袋**（即使是自己的城镇，避免出现「自己的城镇考不到钱」），自己城镇里每答对一题额外给城镇 **+2 发展**；城镇面板的「注入资金」按钮把 **100** 金币从钱袋搬进城镇金库（建设施的钱就来自这里），「投入发展」则用 60 城镇资金换 +6 发展。发展高于 40 时繁荣度按 `(发展 − 40) × 0.15` 每天上涨，低于 40 时下滑；城镇每天还有 `繁荣度 × 0.15` 的收入。繁荣度到 **40 / 70 / 90** 就升到 **Lv.2 小镇 / Lv.3 城镇 / Lv.4 大城**，等级显示在城镇界面右上角与地图名字牌上。等级越高，高阶兵源权重越大，自己的城镇恢复也越快。
  **Town development**: the exam always pays the lord personally (even in his own town, so a lord who owns his towns is never short of money), while the correct answers still lift the development of his own town. The town panel's 「注入资金」 button moves 100 gold from the purse into the town treasury (the money the facilities are paid with), and 「投入发展」 turns 60 town money into +6 development. Above 40 development the prosperity climbs by `(development − 40) × 0.15` a day, below 40 it slides back, and the town earns `prosperity × 0.15` gold a day. Prosperity at **40 / 70 / 90** promotes the town to **Lv.2 小镇 / Lv.3 城镇 / Lv.4 大城**; the level is shown in the top-right corner of the town screen and on the map name plate, and a higher level shifts the recruit weights towards the higher ranks and heals faster at home.
- **城镇设施 · Facilities**：两种设施，都用城镇资金建造、各可升三级——**医院**（恢复 ×(1 + 0.5 × 等级)，战败存活率 +10% / 级）与**军营**（全军攻击与防御 +6% / 级）。城镇还可以花 60 资金换 +6 发展（「投入发展」）。
  **Facilities**: two of them, both built with town funds and upgradable three times — a **hospital** (recovery ×(1 + 0.5 × level), +10% survival per level) and a **barracks** (+6% attack and defence for the whole army per level). A town can also spend 60 funds for +6 development.
- **新界面 · New screens**：据点新增「🏛️ 城镇」页签（繁荣度 / 发展 / 资金 / 设施 / 驻军），标题栏右上角显示等级与归属；世界地图底部按钮按归属变成「进入 / ⚔️ 赶走强盗 / 🏰 准备围城 / ⏳ 围城准备中 / ⚔️ 攻打」；角色面板显示伤兵数量与平均体力；战果面板显示阵亡 / 受伤 / 救回。
  **New screens**: a 「🏛️ 城镇」 tab (prosperity / development / funds / facilities / garrison), the town level and owner in the header's top-right corner, world-map buttons that follow the ownership, the wounded count in the lord panel, and 阵亡 / 受伤 / 救回 in the battle result.
- **存档兼容 · Save compatibility**：`normalizeTroops()` 为旧存档补满血，`normalizeSettlement()` 为没有归属的旧据点按 id 稳定地补一个归属，因此旧存档读回来仍有可攻打的城镇。
  **Save compatibility**: `normalizeTroops()` fills the health of an old save, and `normalizeSettlement()` gives a settlement without an owner a deterministic one, so an old save still has towns to take.
- **文档 · Docs**：README 新增 4.10 受伤与恢复、4.11 据点归属与围城、4.12 城镇发展与设施，更新第 6、7、10、13、14、15 节与游戏介绍页；本文件补总览行、本批次、限制、验证记录与变更记录。
  **Docs**: README gained 4.10 on wounds and recovery, 4.11 on ownership and sieges and 4.12 on town development and facilities, and sections 6, 7, 10, 13, 14 and 15 plus the in-game guide were updated; this file gained overview rows, this batch, limitations, verification records and a changelog entry.

### 批次 11 · Batch 11 — 语文题库扩容：阅读理解与古诗 More Chinese: reading comprehension and ancient poems (2026-10-20)

- **阅读理解 · Reading comprehension**：新增 `comprehension` 题型，**12 篇短文 × 3 题 = 36 道题**，题目分三类——主要内容、细节（时间 / 地点 / 原因 / 结果）与词句体会。短文全文拼进题干，界面的题目框加上 `white-space: pre-wrap`，因此手机上也保持段落换行。
  **Reading comprehension**: a new `comprehension` type with **12 passages × 3 questions = 36 items**, covering the main idea, a detail and the meaning of a word. The passage is part of the prompt, and the question box now uses `white-space: pre-wrap` so the paragraphs keep their breaks on a phone.
- **古诗题库 · Ancient poems**：原来的 9 句接龙扩成 **30 首小学必背古诗**的 `POEM_BANK`，每首记录诗题、作者、朝代、主题与全部诗句（静夜思、登鹳雀楼、悯农、春晓、绝句、江雪、望庐山瀑布、早发白帝城、九月九日忆山东兄弟、赠汪伦、咏鹅、池上、村居、所见、小池、晓出净慈寺送林子方、题西林壁、饮湖上初晴后雨、望天门山、山行、清明、元日、鹿柴、敕勒歌、风、夜宿山寺、游子吟、望洞庭等）。
  **The poem bank**: nine lines of 「接龙」 grew into a **30-poem** `POEM_BANK` where every poem records its title, author, dynasty, theme and lines.
- **六种古诗题 · Six poem types**：在原来的「下一句」之外新增 **补全诗句**（缺一个字）、**由诗句猜诗题**、**作者是谁**、**上一句**、**诗意**五种题型，每个题型都是独立的记忆曲线 key；每道古诗题都带解析，答错时告诉孩子诗题、作者与朝代。
  **Six poem types**: next line, fill in the missing character, which poem, who wrote it, the line before and what it expresses — each one its own memory-curve key, and every poem question carries an explanation with the title, the poet and the dynasty.
- **校验 · Verification**：新增 `tools/verify-chinese.mjs`（无头 32 项）与 `tools/verify-chinese-browser.mjs`（真实 Chrome 6 项），前者守住「每个题型至少 4 条题库」「年级内题型名唯一」「上千道采样题全部合法」，后者真的考一张只选语文的卷子并读回题干。
  **Verification**: a new headless suite (32 checks) and a real-Chrome pass (6 checks) that takes a Chinese-only paper and reads the prompts back.
- **文档 · Docs**：README 第 4.4 节新增「语文题型」小节，第 13 节补上两种题库写法的说明，第 14 节补上新的脚本；本文件补本批次、验证记录与变更记录。
  **Docs**: README gained a 「语文题型」 subsection in 4.4, an explanation of the two bank shapes in 13 and the new scripts in 14; this file gained this batch, the verification records and a changelog entry.

---

### 批次 12 · Batch 12 — 难度、战斗速度、战场地形与围城修复 Difficulty, battle speed, battlefield terrain and the siege fixes (2026-10-20)

- **难度设置 · Difficulty**：新增 `src/game/difficulty.js`，三档难度只改**考试金币**——简单是原来的数值（三 / 四年级 20 / 26），普通每题少 1，困难每题少 2（学科加成照常叠加，最低 1 金币）。首页开局时可以直接选，世界地图顶部新增 🎚 芯片随时改；难度写进存档（`difficulty` 字段），旧存档按「简单」处理。
  **Difficulty**: added `src/game/difficulty.js` with three levels that only change the **exam reward** — easy keeps the original numbers (20 / 26 for grade 3 / 4), normal takes one gold off and hard two, with the subject bonus still added and a floor of one gold. The home screen offers the choice before a new campaign, a 🎚 chip on the world map changes it at any time, and the setting is saved (`difficulty`); an old save is an easy game.
- **战斗速度 · Battle speed**：战斗状态新增 `speed`，三档 🐢 慢速（×0.6，**默认**）/ 🚶 正常（×1）/ 🐇 快速（×1.8），`tick()` 用倍率推进模拟。战斗界面右上角新增 ⚙ 工具面板（速度三键 + 地形说明）与 🎯 回中按钮。
  **Battle speed**: the battle store gained a `speed` setting with 🐢 slow (×0.6, **the default**), 🚶 normal (×1) and 🐇 fast (×1.8), and `tick()` advances the simulation by that factor. A ⚙ tools panel (the three speeds plus the terrain legend) and a 🎯 recentre button sit in the corner of the battle screen.
- **战场地形 · Battlefield terrain**：新增 `src/game/arena.js`，战场按 **40 px** 的格子铺 **森林 / 沙地 / 河流 / 湖泊 / 山地** 五种地��：森林给防御 +15% 但移动 −20%，沙地让攻击 −10%，河流让移动 −30%，山地给攻击 +10%，湖泊**不可通行**。地形由战斗种子生成（同一场战斗每次一样），交战双方的伤害会读脚下地形（`damageOf()`），士兵的移动速度也会读脚下地形。
  **Battlefield terrain**: added `src/game/arena.js`; the field is tiled with **forest / desert / river / lake / mountain** cells of 40 px — the forest gives +15% defence for −20% movement, the desert costs 10% attack, the river costs 30% movement and the mountain gives +10% attack, while the **lake is impassable**. The terrain is generated from the battle seed (the same fight always looks the same), the damage of both fighters reads the ground under them (`damageOf()`), and a soldier's speed does too.
- **战场变大 + 镜头 · Bigger field and a camera**：战场从 900 × 560 扩到 **1000 × 680**，两军从 22% / 78% 的位置出发。战场比手机屏幕大，因此新增**镜头**：缩放随两军距离自动变化（0.7 – 1.5），默认跟随战斗；**手指拖动**可以自由查看并停止跟随，🎯 按钮重新跟随。地形一次性画进离屏 canvas，每帧只是一次贴图。
  **A bigger field and a camera**: the arena grew from 900 × 560 to **1000 × 680**, with the armies deploying at 22% and 78%. Since the field is larger than a phone screen it gained a **camera**: the zoom follows the distance between the armies (0.7 – 1.5) and the view follows the fighting by default; a **finger drag** looks around and stops the follow, and the 🎯 button resumes it. The ground is painted once into an offscreen canvas, so a frame is a single blit.
- **围城可中断 · The siege can be called off**：底部按钮在准备期间显示「⏳ 围城准备中 · 还需 N 天」并同时给出「🚫 取消围城」，准备完成后也保留取消按钮；中断后 `settlement.siege` 清空、时钟随之停止，可以重新准备。
  **The siege can be called off**: while the siege is prepared the bottom bar shows the countdown plus a 「🚫 取消围城」 button, and the button stays once the preparation is over; calling it off clears `settlement.siege`, stops the clock and lets the lord prepare again.
- **攻打失败要重新准备 · A failed assault needs a new preparation**：围城战失败时 `settle()` 会把 `settlement.siege` 清空，因此下一次进攻必须重新「🏰 准备围城」等满 2 天。
  **A failed assault needs a new preparation**: when a siege battle is lost, `settle()` clears `settlement.siege`, so the next attack needs a fresh 「🏰 准备围城」 of two days.
- **校验 · Verification**：新增 `tools/verify-battle.mjs`（无头 64 项）与 `tools/verify-battle-browser.mjs`（真实 Chrome 22 项），把难度、速度、地形与围城修复都纳入回归。
  **Verification**: added `tools/verify-battle.mjs` (64 headless checks) and `tools/verify-battle-browser.mjs` (22 real-Chrome checks), so the difficulty, the speed, the terrain and the siege fixes are all part of the regression net.
- **文档 · Docs**：README 新增 4.5 的难度小节、4.6 的战场地形 / 战斗速度 / 镜头三小节，7 的难度 / 速度 / 镜头 / 取消围城操作，9 的奖励表，13 的「新增战场地形」与「新增难度」维护说明，15 的四条排查条目；本文件补总览行、本批次、限制、路线图、验证记录与变更记录。
  **Docs**: README gained the difficulty subsection in 4.5, the battlefield terrain / battle speed / camera subsections in 4.6, the difficulty / speed / camera / cancel-siege controls in 7, the reward table in 9, the 「新增战场地形」 and 「新增难度」 maintenance notes in 13 and four troubleshooting entries in 15; this file gained overview rows, this batch, limitations, roadmap items, verification records and a changelog entry.

### 批次 13 · Batch 13 — 战役时钟显示 The campaign clock (2026-10-20)

- **世界 store 新增 `clock` getter**：把世界时钟累加器读成「当天几点几分」——一天是 24 秒游戏时间，而 **1 秒游戏时间正好是游戏里的 1 小时**，因此累加器直接就是小时数（分钟由小数部分换算）。getter 同时给出 `progress`（当天已过的百分比）。
  **A new `clock` getter in the world store**: the world clock accumulator is read as the hour of the day — a day lasts 24 game seconds and one game second is one in-game hour, so the accumulator *is* the hour (the minutes come from its fraction). The getter also returns `progress`, the share of the day that is gone.
- **新增 `src/components/DayClock.vue`**：一个共用的时钟组件，显示「📅 第 N 天 + 时刻 + 当天进度条」，走动时进度条是绿色、冻结时是金色。世界地图顶部状态栏、据点标题栏都用它；角色信息面板与详细地图的标题里也加上时刻。
  **A new `src/components/DayClock.vue`**: a shared clock showing 「📅 day N + the time + a day-progress bar」, green while it runs and gold while it is frozen. The world-map status bar and the settlement header both use it, and the lord panel and the atlas header carry the time as well.
- **界面效果**：世界地图上原来只有「📅 第 N 天 ⏸ 停滞」的芯片，现在能直接看到时刻从 00:00 走到 23:59、进度条一点点填满、然后天数加一；扎营或行军时可以看到时间在走，站着不动时它就停住。
  **What the player sees**: the chip that used to read 「📅 第 N 天 ⏸ 停滞」 now shows the time running from 00:00 to 23:59, the bar filling up and the day counter turning over — and it freezes the moment the lord stops.
- **校验 · Verification**：`tools/verify-settlements.mjs` 增加 11 项时钟检查（午夜起点、小时换算、进度比例、不越过午夜、世界冻结时时钟冻结、行军时时钟前进、一整天后天数加一、半天即正午）。
  **Verification**: `tools/verify-settlements.mjs` gained 11 clock checks (the midnight start, the hour conversion, the progress share, never crossing midnight, a frozen world freezing the clock, a marching lord moving it, the day turning over, noon at half a day).

### 批次 14 · Batch 14 — 无主城镇也要打下来 An unclaimed town has to be stormed (2026-10-20)

- **新规则 · The new rule**：无主的城镇不再一律白拿。**城里没有守军**时底部是「🚩 占领」，插旗就能拿下；**还有守军**时按钮变成「⚔️ 攻城」并显示守军人数，必须打赢守军才能占领。
  **The new rule**: an unclaimed town is no longer free. With **no soldiers inside** the bottom bar offers 「🚩 占领」 and the flag is planted for free; with **a garrison** the button becomes 「⚔️ 攻城」 (with the number of defenders) and the garrison has to be beaten first.
- **世界生成 · World generation**：无主的城镇有 **45%** 的概率空无一人（其余由本地守卫看守），因此两种路径都存在；`normalizeSettlement()` 不再给无主城镇补驻军，因此旧存档里空着的无主城镇也保持空着。
  **World generation**: an unclaimed town stands empty with a **45%** chance (otherwise a local watch holds it), so both paths exist; `normalizeSettlement()` no longer hands a garrison to an unclaimed town, so an old save with an empty unclaimed town stays empty.
- **战斗流程 · The fight**：新增战斗类型 `claim` —— 打赢就把城镇变成主角的（等级 1、繁荣度 25、驻军清空），打输了城镇仍归原样、守军保留，可以再来一次。`settlement.js` 新增 `claimIsFree()` 与 `needsAssault()` 两个判定，`isAttackable()` 也把「有守军的无主城镇」算作可攻打。
  **The fight**: a new battle kind `claim` — winning hands the town over (level 1, prosperity 25, no garrison), losing leaves the town and its defenders alone so the lord may try again. `settlement.js` gained the `claimIsFree()` and `needsAssault()` tests, and `isAttackable()` now counts a guarded unclaimed town as attackable.
- **校验 · Verification**：`tools/verify-settlements.mjs` 增加 12 项检查（有守军 / 无守军两种无主城镇、可占领判定、免费占领被拒、打赢占领、打输保留守军、30 个世界里两种城镇都存在），`tools/verify-settlements-browser.mjs` 增加 7 项真实 Chrome 检查（按钮文案、显示守军人数、战斗类型 `claim`、打赢后易主）。
  **Verification**: `tools/verify-settlements.mjs` gained 12 checks (guarded and empty unclaimed towns, the claim tests, the refused free claim, winning and losing) and `tools/verify-settlements-browser.mjs` gained 7 real-Chrome checks (the button text, the defender count, the `claim` battle kind and the town changing hands).

### 批次 15 · Batch 15 — 昼夜 Day and night (2026-10-20)

- **新增 `src/game/daynight.js`**：**夜晚占一天的五分之一**（从进度 0.8，即 19:12 开始，到 24:00 结束）。`darknessOf()` 给出黑度曲线——夜晚的前四分之一是黄昏（黑度渐入）、中间一半是深夜（完全黑）、后四分之一是黎明（黑度渐退），因此天色是渐变而不是瞬间切换；`speedFactorOf()` 给出夜晚的减速系数，最深的夜里是 **×0.75**（慢 25%）。
  **A new `src/game/daynight.js`**: **the night is the last fifth of every day** (from progress 0.8, that is 19:12, until midnight). `darknessOf()` returns the darkness curve — the first quarter of the night is dusk, the middle half is deep night and the last quarter is dawn, so the sky changes gradually instead of switching in one frame — and `speedFactorOf()` returns the slowdown, **×0.75** in the deepest night.
- **世界 store** 新增 `dayPhase` getter（`night` / `darkness` / `speedMul` / `label` / `icon`）；`tick()` 用 `dayPhase.speedMul` 缩放**主角**的移动预算（3.9 格/秒）与**所有游荡部队**的速度，因此夜里整个世界一起变慢——相对速度不变，夜晚只是让主角走得更少。
  **The world store** gained a `dayPhase` getter (`night` / `darkness` / `speedMul` / `label` / `icon`), and `tick()` scales the **lord's** movement budget (3.9 tiles/s) and the speed of **every roaming warband** by `dayPhase.speedMul`: the whole world slows down together, so the relative speed stays the same and the night simply costs the lord ground.
- **画面**：世界地图在画完地形、据点与部队后铺一层随黑度加深的**深蓝夜色**，再用 `destination-out` 的径向渐变在主角周围**挖出一圈灯光**，所以夜里主角脚下的地面依旧看得清；主角与篝火画在夜色之上，保持明亮。时钟芯片新增 **☀️ / 🌙** 图标，进度条的最后五分之一用蓝色标出就是夜晚。
  **The look**: the world map paints a **deep blue veil** over the terrain, the settlements and the warbands, then punches a **lantern light** out of it around the lord with a `destination-out` radial gradient, so the ground under him stays readable; the lord and his campfire are drawn on top of the veil and stay bright. The clock chip gained a **☀️ / 🌙** icon, and the last fifth of its bar is tinted blue to show the night.
- **校验 · Verification**：`tools/verify-settlements.mjs` 增加 15 项检查（夜晚起点、黑度曲线、深夜最黑、黎明转亮、夜晚占一天的五分之一、白天全速、夜晚减速、store 的相位读数，以及**同一段时间里夜里主角走的距离明显更短**）。
  **Verification**: `tools/verify-settlements.mjs` gained 15 checks (the start of the night, the darkness curve, the darkest point, the dawn, the night share of the day, the day speed, the night slowdown, the phase readout of the store and the fact that **the lord covers clearly less ground at night in the same time**).

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

---


| 日期 Date | 内容 Change |
| --- | --- |
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
