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
    { zh: "入口就在首页：「⚡ 快速战斗」与「开始新的征程」「继续上次进度」**同级**，一进来就能用。", en: "The entry is on the home screen: 「⚡ 快速战斗」 sits **on the same level** as 「开始新的征程」 and 「继续上次进度」." }
    ]
  },
  {
    batch: 18,
    title: "反击与队形 Counterattack and formation",
    date: "2026-10-21",
    items: [
    { zh: "被打了就会还手：士兵会记住是谁打了它，转身还手 —— 哪怕它本来在防守或者在赶路。", en: "**Everybody answers an attack**: a soldier remembers who hit it and turns to answer that one, even when it was holding its position or marching somewhere else." },
    { zh: "攻击不再打乱队形：小队转向敌人，前排压上，每个士兵守住自己的位置；队列不会一拥而上。", en: "**An attack keeps the formation**: the squad turns towards the foe, the front rank goes for it and every soldier holds its own slot; the ranks do not mob the enemy." },
    { zh: "远程小队嫌近了是**整队后撤**，不是各自乱跑，队形在后撤中依然保持。", en: "**A ranged squad that is too close steps back as one block**, so the shape survives the retreat." }
    ]
  },
  {
    batch: 19,
    title: "队形会呼吸 The formation breathes",
    date: "2026-10-21",
    items: [
    { zh: "队形不再僵硬：士兵在自己的位置上轻轻晃动，队列是一条活着的线，不是一张网格。", en: "**The formation is no longer stiff**: every soldier sways a little inside its slot, so the line is alive instead of a grid." },
    { zh: "挨打会踉跄：被砍中或被射中的士兵会被推得偏一下，然后自己晃回原位。", en: "**A blow makes it stagger**: a soldier that is hit is shoved aside and then drifts back into its place." },
    { zh: "太挤会互相让开：两个士兵贴得太近时会各让一点，队伍不会挤成一团。", en: "**Crowded soldiers give each other room**: two soldiers that stand too close slide apart, so the squad never piles up." },
    { zh: "枪兵会压上去一点：近战小队列的前排会向敌人压进几步，后排照旧留在后面。", en: "**The spearmen press in**: the front rank of a melee squad leans on the foe while the rest stays behind." },
    { zh: "随机队形也会打：散兵队形没有队列可守，于是**每个士兵自己扑向敌人**，照样砍得到人。", en: "**The scattered formation fights too**: a scatter squad has no block to keep, so **every soldier closes on the foe itself** and lands its blows." },
    { zh: "--", en: "" }
    ]
  },
  {
    batch: 20,
    title: "学习主线四层改进与界面清爽化 The exam spine and a cleaner home screen",
    date: "2026-10-21",
    items: [
    { zh: "一次考试结算得更多：连续答对有连击倍率（最高 ×1.5），整卷全对 ×1.5，12 题长卷 ×1.1，答对一半及格再 +20%。", en: "**A paper is worth more now**: a streak of correct answers multiplies the gold (up to ×1.5), a paper without a mistake pays ×1.5, a paper of twelve questions pays ×1.1 and reaching the pass line adds another 20%." },
    { zh: "答错不扣钱：答错只是这一题没有金币、连击会断，不会倒扣。", en: "**A wrong answer never costs gold**: it simply pays nothing and breaks the streak." },
    { zh: "做题会掉道具：每答对一题有 30% 掉一份军粮，连对 5 题必掉两份；某一科全部答对掉集市券（免费换一次物资）或征兵令（免费招 2 名民兵），整卷全对再掉一匹战马。", en: "**Answers drop gear**: every correct answer has a 30% chance of a ration of food and five in a row always bring two, a subject answered without a mistake drops a market voucher or a recruit order, and a perfect paper brings a horse." },
    { zh: "里程碑道具：累计答对 300 / 500 / 800 / 1200 题，解锁军旗（全军攻击 +5%）、徽章（每战后 +10 金币）、药箱（伤兵恢复 +50%）与驿马（主角移速 +10%）。", en: "**Milestones**: 300, 500, 800 and 1200 correct answers unlock the war banner (+5% attack), the badge (+10 gold after a battle), the medicine chest (+50% recovery) and the post horse (+10% speed)." },
    { zh: "考试就是经验：及格的卷子每答对一题给 1 点经验，50 点换 1 点属性点，自己分配到统御 / 医术 / 工程 / 谋略。", en: "**An exam is experience**: a paper that passes gives one experience point per correct answer, fifty points buy an attribute point, and the child spends it on leadership, surgery, engineering or tactics." },
    { zh: "属性真的有用：统御提高队伍上限与全军攻击，医术加快伤兵恢复，工程缩短围城准备并降低设施造价，谋略在开战前显示敌方构成。", en: "**The attributes really do something**: leadership opens the party cap and strengthens the army, surgery heals the wounded faster, engineering shortens a siege and cheapens the facilities, and tactics reveals the enemy before the fight." },
    { zh: "掌握度地图：考试设置页按科目显示掌握度、已掌握题数与「该复习多少题」。", en: "**A mastery map**: the exam setup shows the mastery of every subject, how many questions are mastered and how many are due." },
    { zh: "两种复习卷：只考错题（只出答错过的题）与复习队列（只出很久没复习、还没掌握的题）。", en: "**Two revision papers**: a paper of mistakes and a review queue of the questions that are due." },
    { zh: "角色详情新增「学习与成长」：经验条、四个属性与加点、掌握度地图与里程碑进度。", en: "**The lord panel grew a learning section**: the experience bar, the four attributes, the mastery map and the milestone progress." },
    { zh: "首页更清爽：只保留一个版本入口，配色更柔和、留白更舒服，手机竖屏一屏看得全。", en: "**A cleaner home screen**: one version entry, a softer palette, more air, and everything readable in a phone held in portrait." },
    { zh: "世界地图上的提示改到屏幕顶部，不再挡住地图中间的主角。", en: "**The message of the world map moved to the top**, so it no longer covers the lord in the middle of the map." }
    ]
  },
  {
    batch: 21,
    title: "题库检索、更多答题形式与更小的金币 The question bank, more shapes and smaller coins",
    date: "2026-10-21",
    items: [
    { zh: "**题库检索**：首页多了一个入口，打开整个题库 —— 搜索框、年级与科目过滤、点开看答案与解析、生成题可以「换一题」，有存档时每行还标着掌握程度。", en: "**The question bank**: a new entry on the home screen opens the whole bank — a search box, the grade and subject filters, the answer and the explanation of every row, another sample for a generated question and the mastery of every row." },
    { zh: "**四种答题形式**：除了四选一，现在还能**填空**（把答案写出来）、**配对**（左右两栏连起来）和**排序**（按顺序点出来），考试界面按题目的形状自动切换。", en: "**Four shapes of a question**: besides the multiple choice there is now a **filled-in answer**, a **matching** question and an **ordering** question; the exam renders whichever shape the question carries." },
    { zh: "**新的题型**：数学的算式填空、英语的拼写填空、语文的诗句配对与二十四节气排序、逻辑的判断对错。", en: "**New kinds**: the maths fill-in, the English spelling fill-in, the Chinese poem matching and solar-term ordering, and the logic true-or-false." },
    { zh: "**简单难度只奖励 5 个金币**：简单档改成练习模式（每题固定 5 金币，不分科目与年级），普通与困难两档沿用原来的数值。", en: "**The easy level pays five gold**: the easy level becomes the practice level (a flat five gold per question), while the normal and the hard level keep their numbers." },
    { zh: "界面细节：题目的提示语会随形状变化（选择 / 写下答案 / 配对 / 排序），配对题的两栏有名字，答错时给出正确配对或正确顺序。", en: "Details: the hint follows the shape, the two columns of a matching question are named, and a wrong answer shows the right pairs or the right order." }
    ]
  },
  {
    batch: 22,
    title: "难度重做：收入、军费与越打越强的世界 A difficulty rebuilt around pay, cost and a world that grows",
    date: "2026-10-23",
    items: [
    { zh: "**三档难度重新分工**：简单是练习档（每题固定 5 金，整卷最多拿到题目基础价的 2 倍，开局 150 金 / 8 粮，敌军更弱）；普通保持原样（三年级 19 / 四年级 25，开局 120 金 / 5 粮）；困难是挑战档（三年级 14 / 四年级 19，开局 90 金 / 3 粮，每战 4 份军粮，招募贵 15%，敌军多一成）。", en: "**The three levels have their own jobs again**: easy is practice (a flat 5 gold an answer, a paper capped at twice its base, 150 gold and 8 food, weaker enemies), normal stays as shipped (19 / 25, 120 gold and 5 food) and hard is the challenge (14 / 19, 90 gold and 3 food, four rations a battle, recruits 15% dearer, a tenth more enemies)." },
    { zh: "**越打越强的世界**：同一局里新增「威胁」，随胜场与占领的城镇上升（简单封顶 1.2、普通 1.8、困难 2.0），敌军新刷与增援的规模、总上限和精锐比例都跟着涨；卡住不前的孩子不会被惩罚。", en: "**A world that grows with the campaign**: a new threat rises with the battles won and the towns taken (capped at 1.2 easy, 1.8 normal, 2.0 hard) and scales the size, the ceiling and the rank mix of the enemies; a child who is stuck is never punished." },
    { zh: "**看得见的难度**：世界地图的 🎚 芯片变成「难度 · 威胁 1.36×」，难度面板列出当前的敌军规模、敌军上限、军粮、招募价与开局资源；首页的难度说明跟着所选档位变化。", en: "**A difficulty you can read**: the 🎚 chip reads 「难度 · 威胁 1.36×」, the sheet spells out the current enemy size, ceiling, food, recruit price and opening resources, and the note on the home screen follows the picked level." },
    { zh: "**练习档不再能刷钱**：简单档的整卷收入封顶，成绩页会用「练习档整卷上限（×2）」单独列出被削掉的金币；答得差时完全不受影响。", en: "**Practice can no longer be farmed**: the easy paper is capped and the result page lists the cut under 「练习档整卷上限（×2）」; a weak paper is never touched." }
    ]
  },
  {
    batch: 23,
    title: "城镇慢钟与战场动画 A slow town clock and a battlefield that moves",
    date: "2026-10-23",
    items: [
    { zh: "**城镇里的时间放慢 60 倍**：进入据点后，现实 1 秒只过去游戏里的 1 分钟，城镇里的一天是 **24 分钟**；看面板、招兵、升级、考试不再顺手烧掉战役天数，据点界面的时钟也会写着「镇内 1 秒 = 1 分钟」。", en: "**Town time is 60 times slower**: inside a settlement one real second is one in-game minute, so a day of town business takes **24 real minutes**; reading panels, recruiting, upgrading and taking exams no longer burn campaign days, and the settlement clock says 「镇内 1 秒 = 1 分钟」." },
    { zh: "**士兵会走会跳**：行军的士兵平滑滑动、一颠一颠地跳并在脚下扬起尘土，站定的士兵轻轻呼吸，不再像一张贴纸挪来挪去。", en: "**Soldiers walk and hop**: a marching soldier glides, bobs with every step and kicks up dust, while a standing one breathes, so it no longer looks like a sticker sliding across the field." },
    { zh: "**受伤与出手都有反应**：挨打时白光一闪、红圈扩散、身体左右晃动；重伤的士兵脚边持续红色脉冲；出手时身体向目标前倾一下。", en: "**Hits and strikes have a reaction**: a blow flashes white, expands a red ring and shakes the body; a badly wounded soldier keeps a red pulse at its feet; a strike leans the body into the target." },
    { zh: "**阵亡不再瞬间消失**：倒下的士兵会向侧面倒下、下沉并淡出，练兵木桩也一样倒下，然后在两秒后重新站起。", en: "**The fallen no longer vanish**: a defeated soldier tips over, drops and fades out, and a training dummy does the same before it stands back up two seconds later." }
    ]
  }
]

/** The newest batch of the game. */
export const LATEST_BATCH = BATCHES[BATCHES.length - 1]
