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
  },
  {
    batch: 24,
    title: "遇敌对话与逃跑 Meet the enemy before the fight",
    date: "2026-10-23",
    items: [
    { zh: "**遇敌先说话**：敌对部队追上主角时不再立刻进入战场，而是弹出遭遇对话框——敌将的像素头像、所属势力、拦路的身份和「敌方 6 兵 / 我方 12 兵」的对比都在卡片上，下面按兵种列出对方的队伍。", en: "**The enemy speaks first**: a hostile party that catches the lord no longer drags him into the arena; a meeting card opens instead, with the leader's pixel portrait, his faction, what kind of party he leads and the 「their 6 / your 12」 tally, plus the enemy warband listed troop by troop." },
    { zh: "**可以逃跑**：点「🏃 逃跑」，主角会随机退开 **3–6 格**，遇到的那支敌军在短时间里追不上来；逃跑不损失士兵，也不花金币。", en: "**Running away works**: 「🏃 逃跑」 dashes the lord a random **3–6 tiles** away and the party that caught him cannot chase again for a while; no soldier and no coin is lost." },
    { zh: "**也可以喊话或开战**：「🗣️ 喊话」会让敌将再回一句，循环听得到每个势力的所有台词；点「⚔️ 开战」才真正进入战斗地图，敌人就是刚才拦路的那支队伍。", en: "**Talk back or fight**: 「🗣️ 喊话」 makes the leader answer, and every line of the faction can be heard in turn; only 「⚔️ 开战」 opens the battle map, with the very party that blocked the road." },
    { zh: "**对话时世界暂停**：对话框打开期间，天数、时钟和地图上的所有部队都停住，读完台词再决定，不会被偷袭。", en: "**The world waits during the talk**: while the card is open the day, the clock and every party on the map hold still, so the child can read and decide without being ambushed." }
    ]
  },
  {
    batch: 25,
    title: "开局先对峙，等主角下令 A standoff before the charge, and the lord gives the order",
    date: "2026-10-23",
    items: [
    { zh: "**开局双方都不动**：刚进入战斗地图时，敌我双方的士兵都驻守在原地——主角有时间看清战场、调整队形，不会被一开场就打乱。", en: "**Both armies hold when the map opens**: entering the arena no longer starts a charge; every squad on both sides stands its ground, so the lord has time to read the field and dress his own line." },
    { zh: "**敌军会先变阵再进攻**：对峙约 5 秒后，敌军换阵型（远程散成一线、近战收成楔形），再过约 2.4 秒才冲锋；主角先动手的话，敌军会在 1 秒内应战。", en: "**The enemy dresses its ranks and then charges**: after about five seconds the enemy changes formation (ranged into a firing line, melee into a wedge) and attacks some 2.4 seconds later — and answers within a second if the lord strikes first." },
    { zh: "**命令由玩家下**：底部提示条倒数「敌军 N 秒后进攻」，并给出「⚔️ 全军出击」；点它一次全军出动，也可以先选一支小队单独下 ⚔️ 攻击 / 🛡️ 防守 / 🏇 跟随 / 🎯 移动。", en: "**The orders are the lord's**: the command bar counts the standoff down and offers 「⚔️ 全军出击」 — one tap sends every squad, while a single squad can be picked and given attack / defend / follow / move on its own." },
    { zh: "**减员会收拢队形**：前排倒下后，幸存者补上前排的位置，人少的小队仍然面朝敌人继续接战，不会出现两边各剩一人却永远够不着的情况。", en: "**The ranks close up**: survivors take the front slots after the front rank falls, so a thinned squad still faces the foe — no fight stalls with one soldier left on each side, just out of reach." }
    ]
  },
  {
    batch: 26,
    title: "每一战都是新战场 A fresh battlefield for every battle",
    date: "2026-10-23",
    items: [
    { zh: "**战场每次都重新生成**：河流的走向、湖泊与山地的大小和位置、森林与沙地都不再固定，每次进入战斗都会按新的种子重新铺一张地图，同一种子才会得到同一张地图；混战 / 平原 / 密林 / 山地 / 河流 / 湖泽六种预设仍然各自保证该有的地形。", en: "**A new field every time**: the river's course, the size and place of the lake and the mountain and the patches of forest and sand all come from a fresh battle seed, so no two fights share a map, while the same seed still rebuilds the same one; the six presets (mixed, plain, forest, mountain, river, lake) each still promise their own ground." },
    { zh: "**湖不会切断战场**：湖泊只落在战场内部、避开两侧的列阵区，因此不会把战场分成两半，也不会让士兵或指挥官一开始就站在深水里。", en: "**The lake never cuts the field in two**: it is always placed inside the field and clear of the two deployment bands, so no army starts in deep water and every route around it stays open." }
    ]
  },
  {
    batch: 27,
    title: "远程后撤不再钻墙角 Ranged squads stop backing into the wall",
    date: "2026-10-23",
    items: [
    { zh: "**远程小队会贴着墙、绕着敌人后撤**：攻击命令下退得太近时，弓箭手不再一路直线退到战场边缘站着对射；它会先衡量每个方向还有多少空地，背后是墙或湖时改为沿墙滑开，必要时从敌人侧翼绕出去，不会把自己逼进角落。", en: "**Ranged squads slip along the wall and round the enemy**: a ranged squad that has to give ground no longer backs straight into the arena edge and trades shots there; it weighs how much open ground each way leads into, slides along a wall or a lake when the way back is closed, and rounds the enemy's flank when that is the only way out of the corner." }
    ]
  },
  {
    batch: 28,
    title: "战斗界面：随时退出、帧率与拖动 Battle screen: leave, frame rate and dragging",
    date: "2026-10-23",
    items: [
    { zh: "**快速战斗随时可以退出**：快速战斗的右上角多出「← 返回」，什么时候都能回到快速战斗的设置页，不必等一方被打垮；战役里的战斗仍然要分出胜负。", en: "**A quick battle can be left at any moment**: its corner gained a 「← 返回」 button that goes straight back to the quick battle setup, without waiting for one side to break; a battle in the campaign still has to be decided." },
    { zh: "**战斗界面显示帧率**：右上角的小芯片写着最近半秒的平均帧率，低于 50 变成金色、低于 30 变成红色；把鼠标停在上面（手机按住）还能看到这半秒里最慢的一帧花了多少毫秒，卡顿一眼就能看出来。", en: "**The battle screen shows the frame rate**: a small chip in the corner reads the average of the last half second, turning gold below 50 and red below 30, and hovering it (or holding it on a phone) shows the slowest frame of that window in milliseconds, so a stutter is easy to judge." },
    { zh: "**战场可以用鼠标或手指拖动**：PC 上用左键、手机上用一根手指都能平移战场，拖动会停止自动跟随，点「🎯」让镜头回到战斗；移动不到 4 px 的轻点仍然是移动指挥官，拖动不会再被当成一次点击，多出来的手指也不会把镜头甩走。", en: "**The field drags with a mouse or a finger**: the left button on a PC and one finger on a phone both pan the field and stop the auto-follow, and 「🎯」 brings the camera back to the fighting; a tap that moves less than 4 px still moves the commander, a drag is never read as a tap, and a second finger cannot throw the camera." },
    { zh: "**底部按钮不再罩住地图**：小队、命令、队形与提示各自带自己的面板，整条命令栏不再铺一层黑色渐变，战场在按钮之间的空隙里依然看得见。", en: "**The bottom buttons no longer cover the map**: the squads, the orders, the formation sheet and the hint each carry their own panel, and the whole command bar no longer lays a dark gradient over the field, so the ground shows through the gaps between them." },
    { zh: "**手机左缘滑动不会退出战斗**：从屏幕左缘往右滑本来是浏览器的「后退」，战斗中会被拦下，并在画面中间提示一句；要离开请用界面上的返回按钮（快速战斗 / 练兵）或打完这一仗。", en: "**A phone's edge swipe no longer leaves the battle**: the swipe from the left edge of the browser is a back step, and during a fight it is refused with a note over the field; leaving is done with the button on screen (quick battle / drill) or by finishing the fight." }
    ]
  },
  {
    batch: 29,
    title: "800 人战场稳定 60 帧 A big battle holds 60 frames",
    date: "2026-10-23",
    items: [
    { zh: "**800 人的战场不再卡顿**：400 v 400 的快速战斗在桌面 headless Chrome 里从 **8 FPS** 提到 **60 FPS**（p50 16.7 ms、p95 16.8 ms、最慢 16.8 ms），帧率芯片、双方兵力与小队芯片在交战过程中照常刷新；镜头缩放与拖动不受影响。", en: "**A field of 800 soldiers no longer crawls**: a 400 v 400 quick battle went from **8 FPS** to **60 FPS** in headless Chrome on the desktop (p50 16.7 ms, p95 16.8 ms, worst 16.8 ms), with the frame-rate chip, both troop counts and the squad chips keeping up during the fighting; zooming and dragging the camera still work." },
    { zh: "**找敌人不再全场扫描**：最近的敌人改为在 90 px 的粗网格里按圈搜索，并让每名士兵把目标记住 0.18 秒（按士兵错开刷新），一次搜索从比较全场 800 人降到十几次；视线检查只在敌人已经进入攻击距离时才做，士兵之间的推挤改用平方距离比较。", en: "**Finding a foe no longer scans the whole field**: the nearest enemy is looked up ring by ring in a coarse 90 px grid, and every soldier keeps its target for 0.18 s (with the refreshes staggered per soldier), so one search drops from comparing all 800 soldiers to a dozen or so; line of sight is checked only once the foe is already within reach, and the push between neighbours compares squared distances." },
    { zh: "**战场数据不再经过界面框架的响应式代理**：模拟与绘制直接读原始数据，命令栏改由一个每秒更新十次的计数器驱动，因此每帧数百名士兵的坐标与生命值不再逐次穿过代理；兵力数字、命令与队形照常即时更新。", en: "**The field no longer runs through the interface framework's reactive proxies**: the simulation and the painter read the raw data, while the command bar is driven by a counter that moves ten times a second, so the positions and health of hundreds of soldiers no longer cross a proxy on every read; the troop counts, orders and formations still update at once." },
    { zh: "**对峙提示条会立刻收起**：点「⚔️ 全军出击」之后，顶上的对峙提示条立刻消失、底部提示换成冲锋说明，不会在敌军变阵的一秒多里继续挂着。", en: "**The standoff banner leaves at once**: after 「⚔️ 全军出击」 the banner is gone immediately and the hint switches to the charge, instead of hanging on for the second the enemy spends dressing its ranks." }
    ]
  },
  {
    batch: 30,
    title: "手机战场、拖动缓冲与冲锋 A phone battlefield, a drag buffer and the charge",
    date: "2026-10-23",
    items: [
    { zh: "**战场的面积翻倍**：战场从 1000 × 680 扩到 **1400 × 960**（约为原来的 **1.98 倍面积**，宽高各约 1.4 倍，地形格 35 × 24），两军从 **784 px** 外开始推进，开局多出约四成的行军时间用来排兵布阵；湖泊、森林、山地、沙地与河流按新地图一起放大，各地形占战场的比例保持不变。", en: "**The battlefield covers twice the ground**: the arena grows from 1000 x 680 to **1400 x 960** (about **1.98 times the area**, each side about 1.4 times longer, with 35 x 24 terrain cells) and the armies start **784 px** apart, which gives roughly forty percent more marching time to form up; the lake, the woods, the mountains, the sand and the river grow with the field so every terrain keeps its share of the map." },
    { zh: "**镜头可以拖出战场边缘**：手指或鼠标把镜头拖到地图边时还能再拖出 **140 px**，看到战场外围的空地，站在最边上的士兵不再被钉在屏幕边上；左右与上下四个方向都一样，松手后镜头就停在缓冲位置，点 🎯 才回到战斗。", en: "**The camera can be dragged past the edge of the field**: a finger or a mouse drags it up to **140 px** beyond the map so the empty ground around the battlefield shows and a soldier on the border is no longer pinned to the screen edge; all four sides allow it, the camera rests there when the drag ends, and only 🎯 brings it back to the fight." },
    { zh: "**手机上的战斗界面**：在 **390 × 844（dpr 3，触摸）** 的手机视口里实测，顶部兵力条不再被截断（手机上隐藏装饰性的「战斗」标题与速度名，兵力条留出 200 px），底部命令栏从 **256 px 压到 220 px**（隐藏底部提示行、缩短命令按钮与队形开关、收窄间距），两条栏之间留出 **580 px（69%）** 的净空；开局镜头缩到 **0.42** 让两支军队同时入镜，接战后自动拉近到 0.7。", en: "**The battle screen on a phone**: measured in a **390 x 844** viewport (dpr 3, touch on), the top strength bar is no longer clipped (the decorative 「战斗」 title and the speed name are hidden on phones and the bar keeps 200 px) and the command bar shrinks from **256 px to 220 px** (the bottom hint line is hidden and the commands, formation toggle and gaps are tightened), leaving **580 px (69 percent)** of clear field between the bars; the opening camera zooms out to **0.42** so both armies are on screen, then closes to 0.7 once they meet." },
    { zh: "**近战会冲锋，也会累**：近战士兵的目标超过 **90 px** 时进入冲刺（**+30% 速度**），冲刺会一直持续到接战；体力约 **2.5 秒**耗尽，随后疲劳 **2.5 秒**（−10% 速度），喘匀后可以再冲。士兵的目标是远程兵时，进入 90 px 后会脱离阵位直接扑上去，不再被阵型槽位挡在攻击距离之外。", en: "**Melee soldiers charge, and they tire**: a melee soldier whose target is over **90 px** away breaks into a sprint (**+30 percent speed**) that carries through to contact; the burst lasts about **2.5 s** and leaves the soldier winded for **2.5 s** (−10 percent speed) before it can charge again. A soldier whose target is a ranged unit leaves its slot once within 90 px and closes on it directly, so the formation can no longer hold the front rank a few pixels short of reach." },
    { zh: "**齐射之后会慢，贴脸时更危险**：弓箭手每射出一箭都会短暂降速（**0.9 秒 × 0.72**），距离小于 **32 px** 时无法开弓，只能以 **0.85 倍**的速度后撤；因此被近战咬住之后连续风筝越来越难，长矛兵可以把弓箭手拖进肉搏。", en: "**Slow after a volley, and in real danger at point-blank range**: every arrow leaves the archer slowed for a moment (**0.9 s at 0.72 speed**), it cannot draw its bow under **32 px** and can only back away at **0.85 times** its speed; sustained kiting therefore gets harder once a melee soldier is on it, and spearmen can drag archers into hand-to-hand." },
    { zh: "**同数量对局的实测**：长矛兵对弓箭手 **8 v 8** 只赢 **1/5**（弓箭手虽赢，但每局要损失 1–4 人）；**20 v 20** 长矛兵 **5/5** 惨胜，打 **27–38 秒**、20 人只剩 **7–11 人**；单挑时一名长矛兵能在 **26 秒**后以 19 点生命取胜。民兵仍打不过同数量弓箭手（0/5），骑兵依旧碾压（5/5，6–7 秒）。", en: "**The measured equal fights**: spearmen beat archers only **1/5** at **8 v 8** (the archers win but lose one to four soldiers each time); at **20 v 20** the spearmen win **5/5** at a heavy cost, taking **27–38 s** and finishing with **7–11 of 20**; one spearman against one archer wins after **26 s** with 19 health left. Militia still lose to equal archers (0/5) while cavalry still ride them down (5/5 in 6–7 s)." }
    ]
  },
  {
    batch: 31,
    title: "驻守：把部队留在自己的城镇 Station your soldiers in your towns",
    date: "2026-10-24",
    items: [
    { zh: "**可以把自己的部队留驻在己方城镇**：在自己占领的城镇里，「驻守士兵」一栏把每种兵都列成一行，点「➕ 驻守」把部队里的一个士兵留下守城，点「➖ 撤回」再把他带回来；士兵的生命值跟着人走，不会凭空回满，也不会白白丢掉。", en: "**You can leave your own soldiers behind in a town you own**: in the 「驻守士兵」 panel of your own town every troop family is a row, 「➕ 驻守」 moves one soldier of the warband into the garrison and 「➖ 撤回」 brings one back; each soldier keeps its own hit points across the move, so nothing is healed for free and nothing is lost." },
    { zh: "**驻军会和城镇一起恢复**：留在城里的士兵会像主角一样，随城镇的等级与医院逐日恢复生命值；地图上这座城镇的兵力角标也会跟着驻军人数的变化实时更新。", en: "**The garrison heals with the town**: the soldiers you leave behind recover their hit points day by day, exactly like the lord, scaled by the town's level and its hospital, and the garrison badge on the world map follows the soldiers the town now holds." }
    ]
  },
  {
    batch: 32,
    title: "地图按势力上色：小地图与全图一眼看出归属 Faction colours on the maps",
    date: "2026-10-24",
    items: [
    { zh: "**世界全图按势力给每个据点上色**：点角落的小地图打开「世界全图」，城堡和村庄周围会画一圈归属色光环，名字牌也用归属色——你的城镇是蓝色、强盗是灰色、苍狼王国是紫色、赤鹰王国是橙色，无主的城镇保持原本的金色/淡色，一眼就能看出每片地盘属于谁。", en: "**The detailed atlas colours every settlement by its owner**: when you tap the corner minimap to open the world map, each castle and hut is circled by an ownership ring in the holder's colour and its name plate is tinted the same way — your towns are blue, bandits grey, the Wolf Kingdom purple, the Eagle Kingdom orange, and an unclaimed town keeps its original gold/pale tone, so who holds every patch of land is readable at a glance." },
    { zh: "**角落小地图也按势力上色**：右下角的小地图上，城镇与村庄的方块同样用归属色，和全图保持一致，扫一眼就能看出势力的分布。", en: "**The corner minimap is coloured too**: on the small minimap the town and village squares carry the same owner colours as the atlas, so the spread of the factions is visible at a glance and matches the big map." }
    ]
  },
  {
    batch: 33,
    title: "主将上阵与四方亲兵 The two generals and their bodyguards",
    date: "2026-10-24",
    items: [
    { zh: "**主角和敌人都有了主将，主将会亲自上阵打架**：战场左右各站着一位主将（主角是领主，敌人是所属势力的大将），他们有独立的血条，走到对方身边就会自动出手砍人，不用再靠士兵代劳。", en: "**Both sides now have a general who fights in person**: a general stands on each side of the field (the lord for the player, the faction's own commander for the enemy), each with a health bar of its own, and he swings at whoever comes within reach of his arm instead of leaving every blow to the soldiers." },
    { zh: "**开战前自动给双方主将各配 4 名近战亲兵**：这四名士兵是从你自己的队伍里抽出来的，围着主将站成一圈，**亲兵没死光之前主将一下都挨不到**，所有的攻击都由他们替主将挡下。", en: "**Four melee bodyguards are assigned to each general before the fight**: they are taken out of that side's own warband and stand in a ring around their general, and **the general cannot be hit at all until all four are gone** — every blow meant for him lands on a guard instead." },
    { zh: "**主角血量归零＝这场战斗立刻失败**：不会死，但会损失**一半**士兵，然后被亲兵抬到世界地图上**随机一座城镇**附近，血量恢复到一半；之后血量会随时间慢慢恢复，**在自己的城镇里恢复得明显更快**。", en: "**The lord reaching zero hit points means the battle is lost at once**: he does not die, but **half** his soldiers are scattered, his bodyguard carries him to a spot beside a **random town** on the world map, and his health comes back at half; from there it closes slowly over time and **noticeably faster inside a town of his own**." },
    { zh: "**敌方主将打不倒：他被抬走，一会儿又回来**：把敌人主将打到 0 点，他只是被随机放到你当前位置附近、血量恢复一半，所以你可以一路追击他；**只有把敌人的士兵全部消灭，战斗才算赢**。", en: "**A hostile general cannot be finished off: he is carried off and comes back**: bringing him down to zero merely drops him at a random spot near where you stand with half his health, so you can keep chasing him; **the battle is only won once every enemy soldier is gone**." }
    ]
  },
  {
    batch: 34,
    title: "主将倒下即收兵，两军退回战场旁 Generals end the battle; both armies step back to the field",
    date: "2026-10-24",
    items: [
    { zh: "**主角被打败：结算并回到世界地图，就落在刚才那片战场旁边**：不再被送到随机一座城镇，而是退到开打那格周围 3–7 格的一处空地。代价不变 —— 损失一半士兵、血量回到一半，之后随时间慢慢恢复。", en: "**A beaten lord is settled and put back on the world map right beside the field**: no more being dropped at a random town — he falls back 3–7 tiles from the very tile the fight broke out on. The price is unchanged: half the warband scattered and his health back at half, then closing over time." },
    { zh: "**打输不等于脱身：敌人会继续追，你也可以跑**：退回地图后敌方队伍还站在原地，几秒后就能再次咬上来；想脱身就按遇敌面板上的「逃跑」，想翻盘就回头再打。", en: "**Losing does not mean getting away — the enemy keeps chasing, and you can run**: back on the map the enemy warband still stands where it did and can be on you again within seconds. Press 逃跑 on the meeting panel to get out, or turn around and fight again." },
    { zh: "**敌方主将被打倒：同样立刻结算、退回战场周围，追不追你说了算**：敌人队伍一个兵都不会凭空消失（只少了战场上阵亡的），所以你可以立刻追上去打第二场，也可以趁他重整的时候离开。要注意：**战斗要算赢，仍然得把敌人的士兵全部消灭**。", en: "**A beaten enemy general ends the battle the same way — back to the field around the fight, and the chase is your call**: his warband does not vanish (only the soldiers who fell are gone), so you may go after it at once or slip away while it re-forms. Note that **a win still means every enemy soldier is gone**." },
    { zh: "**战斗里不再有「敌将半血复活」**：主将倒下就是这一场的结尾，结算面板会告诉你发生了什么（新的「⚔️ 敌将倒下」结算，以及主角倒下的「你被抬回战场附近」说明）。", en: "**No more \"the hostile general gets back up at half health\" mid-fight**: a general going down is the end of that battle, and the result screen says what happened — a new「⚔️ 敌将倒下」result, and a「carried back to the field」note when the lord goes down." }
    ]
  },
  {
    batch: 35,
    title: "士兵打光之后：孤军奋战与撤退 After the army falls: the last stand",
    date: "2026-10-24",
    items: [
    { zh: "**士兵全部倒下，战斗不会立刻结束**：最后一名士兵倒下后，主将会独自撑 **8 秒**，这段时间他打得更好（攻击 ×1.3、出手更快），屏幕上会出现一条「🛡 只剩主将一人！」的倒计时。", en: "**The battle no longer ends when the last soldier falls**: the general holds the field on his own for **8 seconds**, hitting harder and swinging faster, with a「🛡 只剩主将一人！」countdown on screen." },
    { zh: "**你只剩主将时，可以按「🏳 撤退」**：不用等那 8 秒。撤退＝这一场判负，但**不会再损失第二批士兵**（本来也打光了，只有医院的救回判定可能带回几名 1 点血的伤兵），你带着**当前**的生命值退回战场周围，敌人还在附近。", en: "**When the lord is the last man standing, a「🏳 撤退」button appears**: no need to wait out those 8 seconds. Retreating loses the battle but **takes no second army from you** (there is none left — only the hospital rescue roll may bring back a few one-hit-point wounded). He steps back to the field around the fight **with the health he still had**, and the enemy is still nearby." },
    { zh: "**敌方主将撑到最后就只身逃走，这一场算你赢**：他的士兵打光后同样撑 8 秒，时间一到战斗结束 —— **算你获胜**，战利品与占领结算照常，结果面板会写「敌将只身逃走」。", en: "**A hostile general who holds to the end flees alone and hands you the battle**: he holds for 8 seconds too, and when the clock runs out the fight ends **as your victory** — loot and captures as usual, with「敌将只身逃走」on the result screen." }
    ]
  },
  {
    batch: 36,
    title: "走进城镇：街道、居民、委托与随从 Towns you can walk through, their people, jobs and companions",
    date: "2026-10-25",
    items: [
    { zh: "**据点变成了可以走动的场景**：在世界地图上点「进入」，主角就站进了这座城镇自己的地图 —— 一条主街、一个广场和喷泉、两排房屋，市集 / 兵营 / 学堂 / 医馆 / 铁匠铺 / 酒馆都排在街边。点地面走过去（和世界地图同一套寻路），点房子走到门口推门，点人走过去说话，镜头跟着主角，居民在自家门口一两格内慢慢走动。村庄也有自己的小地图：谷仓、磨坊、水井、几间农舍和城外的田地。", en: "**A settlement is now a place you walk through**: tapping 「进入」 on the world map puts the lord on the town's own map — a main street, a square with a fountain and two rows of houses, with the market, barracks, school, hospital, smithy and tavern along the street. Tap the ground to walk (the same pathfinder the world map uses), tap a house to walk up to its door, tap a person to walk over and talk; the camera follows the lord and the townsfolk drift a step or two around their own doorsteps. A village has a small map of its own: barn, mill, well, a few cottages and fields on the edge." },
    { zh: "**推门进去就是原来那些面板**：议事厅 = 城镇管理，集市 = 市场，兵营 = 招募与升级，学堂 = 考试，铁匠铺 = 升级，医馆显示「医院等级 / 每天恢复 / 伤兵 / 领主生命」，酒馆与民居会列出全镇的居民供你挑一个人说话 —— 没有第二套界面，只是把同一个面板搬到门口。", en: "**A door opens the very panels the game already had**: the hall is the town books, the market the market, the barracks recruiting and upgrading, the school the exam, the smithy the upgrade tree, the hospital shows the healing numbers, and the tavern or a house lists everybody in town so you can pick who to talk to — no second implementation, only the same panels moved to a door." },
    { zh: "**镇上有名字的人**：每座城镇 7 位、每座村庄 4 位居民，八个职业（卫兵 / 猎人 / 书生 / 铁匠 / 医师 / 吟游诗人 / 商人 / 农夫）各有一套台词与性格；头顶挂着记号 ——「?」有委托还没接、「!」已经接下、「✓」做完了。", en: "**Named people in town**: seven townsfolk in a town and four in a village across eight trades (guard, hunter, scholar, smith, healer, bard, merchant, farmer), each with lines of their own — and a mark over their head: 「?」 for a job nobody has taken, 「!」 for one in progress, 「✓」 for one that is done." },
    { zh: "**委托要先接，才算数**：和居民说话会看到他请你做的事 —— 答对 16 道题、赢下 3 场战斗、招募 10 名士兵。点「📜 接受委托」的这一刻才把当前统计（答对题数 / 胜场 / 招募人数）记成起点，之后你为他做的事才计入，之前攒下的战绩不会白送；点「放弃委托」可以退回重接。", en: "**A job has to be accepted before it counts**: talking to somebody shows what they would like done — answer 16 questions, win 3 fights, hire 10 soldiers. Pressing 「📜 接受委托」 is what records the counter at that moment, and only what the lord does afterwards counts, so an old record never hands out a free quest; 「放弃委托」 gives it back." },
    { zh: "**委托日志：城镇和世界地图都能打开**：日志写着谁托付的、在哪座城镇、还差多少，并按「进行中 / 已完成」分组；做完的那条变绿并写着「✅ 已完成 —— 回去找他就能招募」，右边一个「去找 某某」按钮直接把你送回那座城镇。", en: "**A quest log reachable from a town and from the world map**: each row says who asked, in which town and what is left, grouped into open and finished jobs; a finished one turns green with 「✅ 已完成 —— 回去找他就能招募」 and a 「去找 某某」 button that walks the lord straight back to that town." },
    { zh: "**花金币招随从，再把自己的兵交给他**：委托做完后「🤝 招募为随从」才会亮，价格按职业 110–200 金。招来的随从**身边没有兵**：打开「👥 随从」，左边是你的部队、右边是他的旗子，点「给他」把一名士兵交过去、点「收回」要回来，一顶旗子最多 4–6 人（按职业），士兵连伤口一起转手。", en: "**Hire a companion with gold, then hand him your own soldiers**: the 「🤝 招募为随从」 button lights up once the job is done, at 110–200 gold depending on the trade. A new companion has **no soldiers of his own**: in 「👥 随从」 the warband sits on the left and his banner on the right, 「给他」 hands a soldier over and 「收回」 takes one back, a banner holds four to six (by trade), and a soldier carries his wounds across." },
    { zh: "**随从带兵上战场，伤亡各算各的**：带着兵的随从会在战场后排排出自己的小队，队名就是他的名字（「李守信·民兵」），能单独下令与换队形；他的兵死了只少他自己旗子上的人，你的队伍不替他背损失，他本人也不会阵亡。每种职业还给全军一点小加成（卫兵 +2% 防御、猎人 +2% 攻击、医师 +15% 伤兵恢复……）。", en: "**Companions fight with their own banner, settled separately**: a companion with soldiers forms squads in the rear named after him (「李守信·民兵」) that take orders and formations like any other; his losses thin his banner only, never the lord's roster, and he is never killed. Each trade adds a small army-wide bonus (guard +2% defence, hunter +2% attack, healer +15% recovery …)." },
    { zh: "**39 张新的像素素材**：六张可平铺的地面（草地 / 土路 / 石板路 / 广场砖 / 水 / 田地）、十五张建筑与设施（议事厅 / 三种民居 / 集市 / 酒馆 / 铁匠铺 / 兵营 / 医馆 / 学堂 / 磨坊 / 谷仓 / 城门 / 水井 / 喷泉）、十张街道道具（木桶 / 木箱 / 推车 / 路灯 / 树 / 灌木 / 路牌 / 草堆 / 旗帜 / 栅栏）和八张居民（每个职业一张）。全部 32 × 32，经 Pixelorama 桥接生成，与地图素材共用同一套调色板。", en: "**39 new pixel sprites**: six tileable grounds (grass, dirt road, cobbles, plaza slabs, water, field), fifteen buildings and facilities (hall, three houses, market, tavern, smithy, barracks, hospital, school, mill, barn, gate, well, fountain), ten street props (barrel, crate, cart, lamp, tree, bush, signpost, haystack, banner, fence) and eight townsfolk, one per trade — all 32 x 32, drawn through the Pixelorama bridge with the same palette as the map art." }
    ]
  },
  {
    batch: 37,
    title: "随从跟着走：地图上的小队 A companion rides along on the world map",
    date: "2026-10-25",
    items: [
    { zh: "**招募的随从会跟着你走**：不再只在城镇里出现。主角在地图上走，随从就跟在他身后排成一小队（两人一排，越走越靠后拉开），走动时轻轻一颠一颠，停下时围在身后站定；夜里他们和主角一起被提灯照亮。", en: "**A recruited companion now walks with the lord**: no more showing up only inside a town. When the lord rides, his companions follow in a small train behind him (two abreast, the pairs opening out further back), bobbing a little while they walk and standing behind him when he stops — and at night they share the lord's lantern light." },
    { zh: "**小地图与全图也看得到**：小地图上主角的白点周围多出一圈小点（每位随从一颗），详细全图里则是随从自己的像素小人，和大地图上的站位一致。", en: "**The minimap and the atlas show them too**: a ring of small dots around the lord's dot on the minimap (one per companion), and their own pixel sprites on the detailed atlas, standing in the same slots as on the big map." },
    { zh: "**路上也能管理随从**：世界地图顶部新增「👥 随从 N」芯片，点开就是城镇里那块面板 —— 不必为了给谁分兵特地跑回城里。", en: "**Companions can be managed on the road**: the world-map bar grew a 「👥 随从 N」 chip that opens the very panel the town uses, so handing out soldiers no longer means riding back to town." }
    ]
  },
  {
    batch: 38,
    title: "全图标都有兵数，顶部一律黑玻璃 Badges on every icon, one black glass above the map",
    date: "2026-10-25",
    items: [
    { zh: "**详细全图上的随从也有兵力角标**：全图里每位随从的像素小人，右上角都画出一枚兵力徽章 —— 和领主、敌将身上那枚一模一样，只是小一号；没有分到兵的随从不挂徽章。全图底部那句「图标右上角数字是该部队兵力」，现在对每一个图标都算数。", en: "**A companion on the atlas carries his troop badge too**: every companion sprite on the detailed atlas now wears the badge in his top-right corner — the same disc the lord and the commanders wear, one size smaller; a companion with no soldiers stays unbaded. The atlas footer's promise that the corner number is the troop count now holds for every icon on the map." },
    { zh: "**世界地图上方统一成黑色透明**：顶部状态栏的芯片与按钮、右上角的小地图按钮、图例和图例里的「收起 / 展开」，现在全是同一块黑色透明玻璃（悬停时只是加深一点黑色，不再闪白色或金色）；文字颜色照旧各自区分，一块玻璃、五种颜色。", en: "**One black glass above the world map**: the chips and buttons of the top bar, the minimap button in the corner, the legend and its 「收起 / 展开」 toggle all wear the same translucent black — a hover only deepens the black instead of flashing white or gold; the labels keep their own colours, so it is one glass with five inks." }
    ]
  }
]

/** The newest batch of the game. */
export const LATEST_BATCH = BATCHES[BATCHES.length - 1]
