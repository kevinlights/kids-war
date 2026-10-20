/**
 * The shipped work of the game, extracted from `progress.md`.
 *
 * This file is **generated**: run `node tools/build-versions.mjs` after the
 * 「已完成功能 · Completed Features」 section of `progress.md` changes, and
 * the update dialog of the home screen shows the new work.
 *
 * 本文件由脚本生成：改完 `progress.md` 的「已完成功能」一节后，运行
 * `node tools/build-versions.mjs` 重新生成，首页的更新对话框就会显示新内容。
 */

/** Every batch of the game, oldest first. */
export const BATCHES = [
  {
    batch: 1,
    title: "核心玩法 Core gameplay",
    date: "2026-10-18",
    items: [
    { zh: "世界生成：地形起伏、城镇与村庄散布、敌军成团聚集，出生点在第一座城镇旁。", en: "World generation: rolling terrain, towns and villages, enemy warbands clustered around their strongholds, and a spawn next to the first town." },
    { zh: "点击地图移动：角色自己找路过去，会绕开水域与山地；地形决定脚程快慢。", en: "Tap the map to move: the lord finds his own way and skirts water and mountains; the ground decides how fast he walks." },
    { zh: "据点玩法：村庄招民兵，城镇有更好的兵源，还能升级兵种、买卖军粮与战马。", en: "Settlements: villages sell militia, towns offer better soldiers, and both upgrade troops and sell food and horses." },
    { zh: "考试赚钱：三、四年级的英文、语文、数学与逻辑，答对才有金币。", en: "Earn gold with exams: grade 3-4 English, Chinese, math and logic — only a correct answer pays." },
    { zh: "战斗：真实时间的战场，每支小队都能单独下令、换队形与密度。", en: "Battles run in real time, and every squad takes its own order, formation and density." },
    { zh: "存档：按领主名字保存，随时可以继续上次的征程。", en: "Saves are kept per lord name, so a campaign can be resumed at any time." }
    ]
  },
  {
    batch: 2,
    title: "手机端、分享与战败修复 Mobile, sharing, defeat fix",
    date: "2026-10-18",
    items: [
    { zh: "手机适配：竖屏单手可玩，按钮够大，窄屏上底部栏自动竖排。", en: "Built for phones: one-handed portrait play, big touch targets and a bottom bar that stacks on narrow screens." },
    { zh: "二维码分享：首页与世界地图都能分享，二维码在本机生成，局域网里扫一下就能一起玩。", en: "QR sharing from the home screen and the world map, encoded on the device so a scan over the LAN opens the game." },
    { zh: "战败不再白送兵：打完一场，队伍就是战场上活下来的那些人。", en: "A lost battle no longer hands out free troops: the warband is exactly what survived the field." }
    ]
  },
  {
    batch: 4,
    title: "角色信息面板 Lord info panel",
    date: "2026-10-18",
    items: [
    { zh: "角色详情：世界地图顶部点一下就能看到兵力、资金、物资与战绩。", en: "Lord info: one tap on the world map shows the troops, the treasury, the supplies and the record." }
    ]
  },
  {
    batch: 5,
    title: "像素素材 Pixel art assets",
    date: "2026-10-18",
    items: [
    { zh: "全套像素画：士兵、城镇、村庄、敌将与地形都换成 32×32 像素画，地图上每支部队都认得出是哪一伙。", en: "Every sprite is pixel art now: soldiers, towns, villages, enemy commanders and the terrain are 32x32 pictures, and every warband on the map is recognisable." }
    ]
  },
  {
    batch: 6,
    title: "兵种标准化与小队战术 Standard roster and squad tactics",
    date: "2026-10-18",
    items: [
    { zh: "兵种统一：民兵加上长枪兵、弓箭手、骑兵三个家族，每个家族四档，从初级一路升到精英。", en: "One roster: militia plus the spearman, archer and cavalry families, each with four ranks from basic to elite." },
    { zh: "克制循环：长枪兵克制骑兵、骑兵克制弓箭手、弓箭手克制长枪兵。", en: "A counter cycle: spearmen beat cavalry, cavalry beat archers, archers beat spearmen." },
    { zh: "小队战术：每支小队都能单独下令（攻击 / 防守 / 跟随 / 移动）、换六种队形与两种密度。", en: "Squad tactics: every squad takes its own order (attack / defend / follow / move), its formation (six) and its density (two)." },
    { zh: "升级更划算：逐级升级比直接买精英便宜，城镇里能买到各种档位的兵。", en: "Climbing the ranks is cheaper than buying an elite, and towns roll a mixed stock of ranks." }
    ]
  },
  {
    batch: 7,
    title: "移动驱动的时钟、扎营与页签修复 Movement-driven clock, camping and the tab fix",
    date: "2026-10-19",
    items: [
    { zh: "时间随移动流逝：站着不动时天数与敌军都停下，走起来世界才继续。", en: "Time follows the lord: standing still freezes the day counter and the enemies, and the world only moves when he walks." },
    { zh: "扎营：原地扎营休息，时间与敌军照常流转；点「拔营」或点地图即结束。", en: "Camp: rest in place while the clock and the enemies keep running; 「🔥 拔营」 or a tap on the map breaks the camp." },
    { zh: "据点页签不再空白：升级与考试页签能正常显示了。", en: "The settlement tabs are fixed: the upgrade and exam tabs render properly again." }
    ]
  },
  {
    batch: 8,
    title: "百科题库、记忆曲线与 Mod 扩展 Encyclopedia, memory curve and mods",
    date: "2026-10-19",
    items: [
    { zh: "新增百科知识题库：64 道常识题，和其他科目一起考。", en: "A new encyclopedia bank of 64 general-knowledge questions, taken together with the other subjects." },
    { zh: "记忆曲线：答对的题越来越少见，答错的题经常再考，久了还会忘。", en: "A memory curve: a question you know is asked less often, a question you miss comes back, and everything fades with time." },
    { zh: "题库可以自己加：放一个文件就能新增一个科目。", en: "The question bank is extensible: drop in a file and a new subject shows up." }
    ]
  },
  {
    batch: 9,
    title: "小地图、详细地图与将领素材 Minimap, detailed atlas and commander art",
    date: "2026-10-19",
    items: [
    { zh: "右上角小地图：一眼看到地形、据点、敌军与自己的位置，点开还有一张能拖动的全图。", en: "A corner minimap: the terrain, the settlements, the enemies and the lord at a glance, and a draggable full map behind it." },
    { zh: "部队带数字：主角与每位敌将的图标上都有兵力角标。", en: "Troop badges: the lord and every commander carry their strength." },
    { zh: "敌将换成将领画风：强盗是灰袍蒙面，苍狼紫袍持盾，赤鹰骑马持枪。", en: "The enemy commanders are drawn as people now: a grey hooded bandit, a purple wolf with a shield and an amber lancer on horseback." }
    ]
  },
  {
    batch: 10,
    title: "受伤恢复、据点归属与城镇发展 Wounds, ownership and town development",
    date: "2026-10-20",
    items: [
    { zh: "士兵会受伤：阵亡就是阵亡，伤兵带着伤势进入下一场战斗。", en: "Soldiers can be wounded: the fallen are gone and the wounded carry their injuries into the next battle." },
    { zh: "恢复速度：行军慢、城镇快、自己的城镇更快，医院还会再加成。", en: "Recovery: slow on the march, faster in a settlement, faster still in your own town, and a hospital multiplies it." },
    { zh: "据点归属：每个城镇村庄都有主人，能进、能打、能占。", en: "Every settlement has an owner: some can be entered, some have to be taken." },
    { zh: "围城：准备两天、期间时间流逝、驻军会增援，攻打失败要重新准备。", en: "Sieges: two days of preparation with the clock running and the garrison growing, and a failed assault means starting over." },
    { zh: "城镇发展：考试让城镇发展，繁荣度够了就升级，兵源与恢复都更好。", en: "Town development: the exams lift the town, enough prosperity promotes it, and a better town recruits and heals better." },
    { zh: "城镇设施：医院让伤兵回来得更快，军营让全军更强。", en: "Town facilities: a hospital brings the wounded back faster, a barracks makes the whole army stronger." },
    { zh: "地图变大一倍：城镇与村庄更多，敌人会成长，世界一直在变。", en: "The world is twice as big: more towns and villages, and the factions keep growing." }
    ]
  },
  {
    batch: 11,
    title: "语文题库扩容：阅读理解与古诗 More Chinese: reading comprehension and ancient poems",
    date: "2026-10-20",
    items: [
    { zh: "阅读理解：12 篇短文，每篇三道题。", en: "Reading comprehension: 12 short passages with three questions each." },
    { zh: "古诗题库扩到 30 首必背古诗。", en: "The ancient-poem bank grew to 30 poems every child has to learn." },
    { zh: "五种新题型：补字、猜诗题、作者是谁、上一句和诗意，答错还有讲解。", en: "Five new question types — the missing character, which poem, who wrote it, the line before and what it means — each with an explanation." }
    ]
  },
  {
    batch: 12,
    title: "难度、战斗速度、战场地形与围城修复 Difficulty, battle speed, battlefield terrain and the siege fixes",
    date: "2026-10-20",
    items: [
    { zh: "难度三档：简单 / 普通 / 困难，只改考试给的金币。", en: "Three difficulties — easy, normal and hard — that change only the exam reward." },
    { zh: "战斗速度：慢速默认，还有正常与快速，随时能切。", en: "Battle speed: slow by default, plus normal and fast, switchable at any time." },
    { zh: "战场地形：森林、沙地、河流、湖泊与山地，各自有各的打法，湖泊过不去。", en: "Battlefield terrain: forest, desert, river, lake and mountain, each with its own tactics — and a lake you cannot cross." },
    { zh: "围城可以中断，攻打失败要重新准备。", en: "A siege can be called off, and a failed assault has to be prepared again." }
    ]
  },
  {
    batch: 13,
    title: "战役时钟显示 The campaign clock",
    date: "2026-10-20",
    items: [
    { zh: "战役时钟：屏幕上有第几天与当天时刻，一眼看出时间在走还是停着。", en: "A campaign clock: the day and the hour on the screen, so it is obvious whether time runs or stands still." },
    { zh: "时钟在地图、据点与角色面板里都能看到。", en: "The clock is on the map, in the settlement and in the lord panel." }
    ]
  },
  {
    batch: 14,
    title: "无主城镇也要打下来 An unclaimed town has to be stormed",
    date: "2026-10-20",
    items: [
    { zh: "无主城镇看情况：没人守就插旗占领，有人守就得先打下来。", en: "An unclaimed town depends: empty, you take it with a flag; defended, you have to storm it first." },
    { zh: "攻打城镇：赢了城镇归你，输了城镇还是原样，可以再来。", en: "Storming a town: win and it is yours, lose and it stays as it was — and you can try again." }
    ]
  },
  {
    batch: 15,
    title: "昼夜 Day and night",
    date: "2026-10-20",
    items: [
    { zh: "昼夜循环：每天最后五分之一是夜晚，地图变暗、所有人走得慢。", en: "A day and night cycle: the last fifth of every day is night — the map darkens and everyone walks slower." },
    { zh: "主角身边有一圈灯光，夜里也看得清脚下。", en: "The lord keeps a lantern light around him, so the ground stays readable at night." }
    ]
  },
  {
    batch: 16,
    title: "版本号与练兵 Version display and the training drill",
    date: "2026-10-21",
    items: [
    { zh: "首页显示版本号：一眼知道自己在玩哪一版。", en: "The home screen shows the version number, so it is clear which build is running." },
    { zh: "更新内容：点一下版本号就弹出对话框，看这次更新了什么。", en: "The update notes: tapping the version opens a dialog with what changed." },
    { zh: "练兵：扎营时点「🎯 练兵」进入训练场，场上只有自己的士兵和训练木桩。", en: "Training: while camped, 「🎯 练兵」 opens a drill ground with the lord's own soldiers and wooden dummies." },
    { zh: "练兵很安全：没有敌人、不会死人、不会结束，练完点「🏕 结束练兵」回地图。", en: "A drill is safe: no enemy, no losses and no end — 「🏕 结束练兵」 takes you back to the map." }
    ]
  },
  {
    batch: 17,
    title: "快速战斗模拟器 The quick battle simulator",
    date: "2026-10-21",
    items: [
    { zh: "快速战斗：不用打战役，也能问一句「谁打得过谁」。", en: "Quick battle: ask \"who would win?\" without playing a campaign." },
    { zh: "可以选战场：混战、平原、密林、山地、大河与湖泽六种地形。", en: "Six battlefields to pick: mixed, plain, forest, mountain, river and lake." },
    { zh: "兵力可以随便填：民兵、长枪兵、弓箭手、骑兵，**每一种的数量都能用加减键任意设置**，四档规模只是帮你一键铺开。", en: "The numbers are yours to set: militia, spearmen, archers and cavalry, and **the count of every kind can be raised or lowered freely** — the four sizes are only a shortcut." },
    { zh: "可以选敌我势力：己方一键换成整队民兵 / 长枪兵 / 弓箭手 / 骑兵，敌方一键换成强盗 / 苍狼 / 赤鹰的兵种配比，之后仍可逐个改。", en: "Both sides can be picked: the lord switches to a whole band of militia / spearmen / archers / cavalry, the enemy to the mix of the bandits / the wolf / the eagle, and every number stays editable." },
    { zh: "打完是真打一场：点「⚡ 进入战场」就站上战场，像平常一样下令、换队形、打完看战报。", en: "The fight is a real one: 「⚡ 进入战场」 puts the lord on the field, where the orders and formations work exactly as usual." },
    { zh: "快速战斗不打乱战役：这一场只是练习，你的队伍、金币与战绩都不会变。", en: "A quick battle leaves the campaign alone: it is a drill, so the warband, the purse and the record do not move." },
    { zh: "想先看胜率也行：点「📊 先看看胜率」用同样的两支队伍跑 20 场，直接给出胜率与平均阵亡。", en: "Or look at the odds first: 「📊 先看看胜率」 runs the same two armies through 20 fights and reports the win rate and the average casualties." },
    { zh: "入口就在首页：「⚡ 快速战斗」与「开始新的征程」「继续上次进度」**同级**，一进来就能用。", en: "The entry is on the home screen: 「⚡ 快速战斗」 sits **on the same level** as 「开始新的征程」 and 「继续上次进度」." },
    { zh: "--", en: "" }
    ]
  }
]

/** The newest batch of the game. */
export const LATEST_BATCH = BATCHES[BATCHES.length - 1]
