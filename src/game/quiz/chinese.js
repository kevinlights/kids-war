// Chinese language question generators for grade 3 and grade 4.
import { choice, numberWrongs } from './shared'

const ANTONYMS = [
  ['大', '小'], ['高', '矮'], ['冷', '热'], ['快', '慢'], ['明亮', '黑暗'],
  ['勤劳', '懒惰'], ['诚实', '虚伪'], ['简单', '复杂'], ['安全', '危险'], ['安静', '吵闹'],
  ['前进', '后退'], ['慷慨', '吝啬'], ['勇敢', '胆怯'], ['清晰', '模糊'], ['节约', '浪费'],
  ['团结', '分裂'], ['虚心', '骄傲'], ['温暖', '寒冷'], ['喜欢', '讨厌'], ['整齐', '凌乱'],
  ['沉重', '轻盈'], ['陌生', '熟悉'], ['成功', '失败'], ['保护', '破坏'], ['光明', '黑暗']
]

const SYNONYMS = [
  ['美丽', '漂亮'], ['高兴', '快乐'], ['立刻', '马上'], ['著名', '有名'], ['寒冷', '冰冷'],
  ['安静', '宁静'], ['勇敢', '英勇'], ['帮助', '协助'], ['明白', '清楚'], ['忽然', '突然'],
  ['喜悦', '欢喜'], ['珍贵', '宝贵'], ['连忙', '赶快'], ['奇怪', '古怪'], ['注视', '凝视'],
  ['希望', '盼望'], ['喜爱', '喜欢'], ['丰富', '富饶'], ['仔细', '细心']
]

const MEASURE_WORDS = [
  ['一（　）马', '匹'], ['一（　）牛', '头'], ['一（　）鱼', '条'], ['一（　）花', '朵'],
  ['一（　）船', '艘'], ['一（　）桥', '座'], ['一（　）纸', '张'], ['一（　）伞', '把'],
  ['一（　）衣服', '件'], ['一（　）书', '本'], ['一（　）笔', '支'], ['一（　）鸟', '只'],
  ['一（　）鞋', '双'], ['一（　）画', '幅'], ['一（　）星星', '颗'], ['一（　）小溪', '条']
]

const IDIOMS = [
  ['画蛇添（　）', '足'], ['守株待（　）', '兔'], ['亡羊补（　）', '牢'], ['井底之（　）', '蛙'],
  ['掩耳盗（　）', '铃'], ['叶公好（　）', '龙'], ['刻舟求（　）', '剑'], ['狐假虎（　）', '威'],
  ['对牛弹（　）', '琴'], ['班门弄（　）', '斧'], ['守口如（　）', '瓶'], ['一鸣惊（　）', '人'],
  ['一心一（　）', '意'], ['万紫千（　）', '红'], ['水落石（　）', '出'], ['精卫填（　）', '海'],
  ['望梅止（　）', '渴'], ['画龙点（　）', '睛'], ['鸡飞狗（　）', '跳'], ['千里之（　）', '行'],
  ['百发百（　）', '中']
]

// Every distinct idiom answer, used as the distractor pool.
const IDIOM_ANSWERS = [...new Set(IDIOMS.map((x) => x[1]))]

const READINGS = [
  ['快乐', 'kuài lè'], ['朋友', 'péng you'], ['音乐', 'yīn yuè'], ['长大', 'zhǎng dà'],
  ['重新', 'chóng xīn'], ['干净', 'gān jìng'], ['银行', 'yín háng'], ['地球', 'dì qiú'],
  ['闷热', 'mēn rè'], ['好奇', 'hào qí'], ['散步', 'sàn bù'], ['的确', 'dí què']
]

const RHETORIC = [
  ['弯弯的月亮像一条小船。', '比喻'],
  ['春天像刚落地的娃娃。', '比喻'],
  ['风儿轻轻地抚摸着我的脸。', '拟人'],
  ['小鸟在枝头唱着歌。', '拟人'],
  ['飞流直下三千尺。', '夸张'],
  ['难道我们不应该保护环境吗？', '反问'],
  ['四海无闲田，农夫犹饿死。', '对比'],
  ['桃花潭水深千尺，不及汪伦送我情。', '夸张']
]

const POEM_BANK = [
  { title: '静夜思', author: '李白', dynasty: '唐', theme: '思念家乡',
    lines: ['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'] },
  { title: '登鹳雀楼', author: '王之涣', dynasty: '唐', theme: '劝人努力向上',
    lines: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'] },
  { title: '悯农（其二）', author: '李绅', dynasty: '唐', theme: '劝人珍惜粮食',
    lines: ['锄禾日当午，', '汗滴禾下土。', '谁知盘中餐，', '粒粒皆辛苦。'] },
  { title: '春晓', author: '孟浩然', dynasty: '唐', theme: '描写春天',
    lines: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'] },
  { title: '绝句（两个黄鹂鸣翠柳）', author: '杜甫', dynasty: '唐', theme: '描写春天',
    lines: ['两个黄鹂鸣翠柳，', '一行白鹭上青天。', '窗含西岭千秋雪，', '门泊东吴万里船。'] },
  { title: '江雪', author: '柳宗元', dynasty: '唐', theme: '写雪景的冷清',
    lines: ['千山鸟飞绝，', '万径人踪灭。', '孤舟蓑笠翁，', '独钓寒江雪。'] },
  { title: '望庐山瀑布', author: '李白', dynasty: '唐', theme: '写山水壮丽',
    lines: ['日照香炉生紫烟，', '遥看瀑布挂前川。', '飞流直下三千尺，', '疑是银河落九天。'] },
  { title: '早发白帝城', author: '李白', dynasty: '唐', theme: '写江上快舟',
    lines: ['朝辞白帝彩云间，', '千里江陵一日还。', '两岸猿声啼不住，', '轻舟已过万重山。'] },
  { title: '九月九日忆山东兄弟', author: '王维', dynasty: '唐', theme: '思念家乡',
    lines: ['独在异乡为异客，', '每逢佳节倍思亲。', '遥知兄弟登高处，', '遍插茱萸少一人。'] },
  { title: '赠汪伦', author: '李白', dynasty: '唐', theme: '表达朋友情谊',
    lines: ['李白乘舟将欲行，', '忽闻岸上踏歌声。', '桃花潭水深千尺，', '不及汪伦送我情。'] },
  { title: '咏鹅', author: '骆宾王', dynasty: '唐', theme: '描写动物',
    lines: ['鹅，鹅，鹅，', '曲项向天歌。', '白毛浮绿水，', '红掌拨清波。'] },
  { title: '池上', author: '白居易', dynasty: '唐', theme: '写儿童生活',
    lines: ['小娃撑小艇，', '偷采白莲回。', '不解藏踪迹，', '浮萍一道开。'] },
  { title: '村居', author: '高鼎', dynasty: '清', theme: '写儿童生活',
    lines: ['草长莺飞二月天，', '拂堤杨柳醉春烟。', '儿童散学归来早，', '忙趁东风放纸鸢。'] },
  { title: '所见', author: '袁枚', dynasty: '清', theme: '写儿童生活',
    lines: ['牧童骑黄牛，', '歌声振林樾。', '意欲捕鸣蝉，', '忽然闭口立。'] },
  { title: '小池', author: '杨万里', dynasty: '宋', theme: '描写夏天',
    lines: ['泉眼无声惜细流，', '树阴照水爱晴柔。', '小荷才露尖尖角，', '早有蜻蜓立上头。'] },
  { title: '晓出净慈寺送林子方', author: '杨万里', dynasty: '宋', theme: '描写夏天',
    lines: ['毕竟西湖六月中，', '风光不与四时同。', '接天莲叶无穷碧，', '映日荷花别样红。'] },
  { title: '题西林壁', author: '苏轼', dynasty: '宋', theme: '写看事物的道理',
    lines: ['横看成岭侧成峰，', '远近高低各不同。', '不识庐山真面目，', '只缘身在此山中。'] },
  { title: '饮湖上初晴后雨', author: '苏轼', dynasty: '宋', theme: '写西湖景色',
    lines: ['水光潋滟晴方好，', '山色空蒙雨亦奇。', '欲把西湖比西子，', '淡妆浓抹总相宜。'] },
  { title: '望天门山', author: '李白', dynasty: '唐', theme: '写山水壮丽',
    lines: ['天门中断楚江开，', '碧水东流至此回。', '两岸青山相对出，', '孤帆一片日边来。'] },
  { title: '山行', author: '杜牧', dynasty: '唐', theme: '描写秋天',
    lines: ['远上寒山石径斜，', '白云生处有人家。', '停车坐爱枫林晚，', '霜叶红于二月花。'] },
  { title: '清明', author: '杜牧', dynasty: '唐', theme: '写节日气氛',
    lines: ['清明时节雨纷纷，', '路上行人欲断魂。', '借问酒家何处有，', '牧童遥指杏花村。'] },
  { title: '元日', author: '王安石', dynasty: '宋', theme: '写节日气氛',
    lines: ['爆竹声中一岁除，', '春风送暖入屠苏。', '千门万户曈曈日，', '总把新桃换旧符。'] },
  { title: '鹿柴', author: '王维', dynasty: '唐', theme: '写夜晚的宁静',
    lines: ['空山不见人，', '但闻人语响。', '返景入深林，', '复照青苔上。'] },
  { title: '敕勒歌', author: '北朝民歌', dynasty: '南北朝', theme: '写草原风光',
    lines: ['敕勒川，阴山下。', '天似穹庐，', '笼盖四野。', '天苍苍，野茫茫，', '风吹草低见牛羊。'] },
  { title: '风', author: '李峤', dynasty: '唐', theme: '描写自然界的风',
    lines: ['解落三秋叶，', '能开二月花。', '过江千尺浪，', '入竹万竿斜。'] },
  { title: '夜宿山寺', author: '李白', dynasty: '唐', theme: '写山寺夜色',
    lines: ['危楼高百尺，', '手可摘星辰。', '不敢高声语，', '恐惊天上人。'] },
  { title: '游子吟', author: '孟郊', dynasty: '唐', theme: '写母爱',
    lines: ['慈母手中线，', '游子身上衣。', '临行密密缝，', '意恐迟迟归。'] },
  { title: '望洞庭', author: '刘禹锡', dynasty: '唐', theme: '写湖光山色',
    lines: ['湖光秋月两相和，', '潭面无风镜未磨。', '遥望洞庭山水翠，', '白银盘里一青螺。'] },
  { title: '绝句（迟日江山丽）', author: '杜甫', dynasty: '唐', theme: '描写春天',
    lines: ['迟日江山丽，', '春风花草香。', '泥融飞燕子，', '沙暖睡鸳鸯。'] }
]

// Every theme, used as the distractor pool of the "what does it express" question.
const POEM_THEMES = [...new Set(POEM_BANK.map((p) => p.theme))]
// Every poet, used as the distractor pool of the author question.
const POEM_AUTHORS = [...new Set(POEM_BANK.map((p) => p.author))]
// Every title, used as the distractor pool of the "which poem" question.
const POEM_TITLES = POEM_BANK.map((p) => p.title)
// Every character of every line, used as the distractor pool of the fill-in question.
const POEM_CHARS = [...new Set(POEM_BANK.flatMap((p) => p.lines.join('').replace(/[，。？！、；：]/g, '').split('')))]


// 汉字笔画 bank: character to stroke count.
/**
 * 阅读理解短文。每一篇配三道题：主要内容、细节与词句体会。
 * Reading passages: each one carries three questions — the main idea, a detail
 * and the meaning of a word.
 */
const PASSAGES = [
  {
    title: '小蚂蚁搬米粒',
    text: '一只小蚂蚁在草丛边发现了一粒饱满的米。它用力推，米粒纹丝不动；它用力拉，米粒还是一动不动。小蚂蚁跑回洞里，不一会儿，几十只蚂蚁排着队来了。它们有的推，有的拉，有的在前面带路。太阳快落山的时候，那粒米被它们抬回了洞里。',
    questions: [
      { q: '这段话主要讲了什么？', a: '一群小蚂蚁齐心协力把米粒搬回了家', wrongs: ['一只小蚂蚁怎么找回家的路', '米粒被雨水冲走了', '小蚂蚁放弃了那粒米'] },
      { q: '小蚂蚁一开始为什么搬不动米粒？', a: '因为米粒太大，一只蚂蚁的力气不够', wrongs: ['因为米粒被泥巴粘住了', '因为它不想搬米粒', '因为天已经太黑了'] },
      { q: '最后米粒是怎么被搬回家的？', a: '许多蚂蚁一起推一起拉，排着队抬了回去', wrongs: ['一只蚂蚁在半夜偷偷搬的', '风把米粒吹进了洞里', '小鸟把米粒叼进了洞里'] }
    ]
  },
  {
    title: '秋天的树林',
    text: '秋天到了，树林换上了新装。银杏树的叶子黄黄的，像一把把小扇子；枫树的叶子红红的，像一团团燃烧的火焰。风一吹，叶子从枝头跳下来，在地上铺成一条彩色的路。松树却还穿着绿衣裳，站在那里一动不动，像一位不肯换衣服的老爷爷。',
    questions: [
      { q: '短文把银杏叶和枫叶分别比作什么？', a: '扇子和火焰', wrongs: ['小船和雪球', '蝴蝶和小鸟', '雨点和棉花'] },
      { q: '为什么说松树像一位不肯换衣服的老爷爷？', a: '因为别的树都变黄变红了，只有松树还是绿的', wrongs: ['因为松树最高', '因为松树长在山脚下', '因为松树冬天也不落叶'] },
      { q: '这段话写了什么季节的景色？', a: '秋天', wrongs: ['春天', '冬天', '夏天'] }
    ]
  },
  {
    title: '蚂蚁和蝈蝈',
    text: '夏天，蚂蚁们忙着把粮食搬回家，蝈蝈却在树上唱歌。蚂蚁说：“冬天很快就到了，我们得把粮食存起来。”蝈蝈笑着说：“天气这么好，唱歌多快乐呀！”冬天来了，北风呼呼地吹。蝈蝈又冷又饿，再也唱不出歌来，它敲开了蚂蚁家的门。蚂蚁打开门，把一小块粮食递给了它。',
    questions: [
      { q: '这个故事想告诉我们什么？', a: '要提前做好准备，懒惰的人到了冬天会挨饿', wrongs: ['朋友之间应该互相帮助', '冬天很好玩', '唱歌比搬粮食有意思'] },
      { q: '蝈蝈冬天为什么会又冷又饿？', a: '因为它整个夏天只顾着唱歌，没有准备粮食', wrongs: ['因为它离开了家', '因为别的蝈蝈把粮食抢走了', '因为冬天来得太突然，动物们都没有准备'] },
      { q: '蚂蚁最后为什么愿意给蝈蝈粮食？', a: '它虽然不原谅蝈蝈懒惰，但也不愿意看着朋友饿死', wrongs: ['因为它终于学会了唱歌', '因为它需要蝈蝈帮忙', '因为它把蝈蝈当成了最好的朋友'] }
    ]
  },
  {
    title: '雨后',
    text: '一场大雨过后，空气里都是青草的香味。太阳从云缝里钻出来，挂在树叶上，亮晶晶的。池塘里的水满了，青蛙“呱呱”地唱起来。燕子低低地飞过水面，蜻蜓停在荷花上，抖了抖翅膀。孩子们跑出家门，在水洼里踩出一串串水花。',
    questions: [
      { q: '短文一共写了几种小动物？', a: '三种：青蛙、燕子和蜻蜓', wrongs: ['两种：青蛙和燕子', '四种：青蛙、燕子、蜻蜓和蝴蝶', '一种：青蛙'] },
      { q: '“亮晶晶的”写的是什么？', a: '挂在树叶上的阳光', wrongs: ['树叶上的露珠', '池塘里的水', '孩子们头上的帽子'] },
      { q: '雨后的空气是什么味道？', a: '青草的香味', wrongs: ['泥土的腥味', '花朵的甜味', '雨水的酸味'] }
    ]
  },
  {
    title: '第一次做饭',
    text: '妈妈加班，我决定给自己做一碗鸡蛋面。我打开火，油在锅里噼里啪啦地响，吓得我后退了一步。等油热了，我把蛋液倒进去，锅里立刻鼓起一个金黄的泡泡。面条软了，鸡蛋也熟了，我撒了一点盐，一尝——咸得皱眉。妈妈回来尝了一口，笑着说：“比食堂的还香。”',
    questions: [
      { q: '“我”第一次做饭的结果怎么样？', a: '做了一碗咸了点但很香的鸡蛋面', wrongs: ['饭糊了，什么都没吃上', '做得很好吃，一点也不咸', '没有做成，只好点外卖'] },
      { q: '油在锅里响的时候，“我”有什么反应？', a: '吓得后退了一步', wrongs: ['把锅端了起来', '关了火跑出门', '大声叫妈妈'] },
      { q: '妈妈为什么说比食堂的还香？', a: '因为这是孩子第一次自己做的饭', wrongs: ['因为妈妈今天特别饿', '因为食堂那天没有开门', '因为碗里多放了很多盐'] }
    ]
  },
  {
    title: '校园的角落',
    text: '教学楼后面有一个小小的角落，那里有一张旧木桌和两把椅子。桌角上摆着一盆不知名的绿苗，是不知谁带来的。每天课间，总有几个同学坐在那里，聊聊班级的事，或者什么也不说，只是看看那盆绿苗。校长说，校园里要有这样一个让人安静下来的地方。',
    questions: [
      { q: '这个角落有什么？', a: '一张旧木桌、两把椅子和一盆绿苗', wrongs: ['一张长椅和一盆花', '一个书架和一张桌子', '一棵大树和一片空地'] },
      { q: '同学们在角落里做什么？', a: '聊天，或者安静地看看绿苗', wrongs: ['都在做作业', '都在打扫卫生', '都在练跑步'] },
      { q: '校长为什么希望有这样的地方？', a: '因为校园里应该有一个让人安静下来的地方', wrongs: ['因为那里可以堆放杂物', '因为那里能停车', '因为那里离办公室近'] }
    ]
  },
  {
    title: '小水滴的旅行',
    text: '我是一颗小水滴。太阳一晒，我觉得身子轻飘飘的，就跟着热气飞上了天。在天上，我遇见了许多和我一样的小水滴，我们抱在一起，变成了一朵白白的云。风把我们推向远处，越飞越冷，越来越重。有一天，我们落了下来，有的落进河里，有的落进田里，人们叫我“雨”。',
    questions: [
      { q: '小水滴是怎么飞上天的？', a: '被太阳晒过之后变成水汽升上去', wrongs: ['被风吹上去的', '被小鸟带上去的', '自己长出翅膀飞上去的'] },
      { q: '小水滴们抱在一起变成了什么？', a: '白云', wrongs: ['雨', '雾', '雪'] },
      { q: '小水滴落到地上以后，人们叫它什么？', a: '雨', wrongs: ['露', '霜', '云'] }
    ]
  },
  {
    title: '爷爷的菜园',
    text: '爷爷在屋后开了一块小菜园。园子里有西红柿、黄瓜和豆角。西红柿红了，爷爷摘下最大的一个塞给我；豆角长得很长，挂在竹架上像一串风铃。爷爷每天清早去浇水，菜叶上常常挂着露珠。有一年台风来了，豆角全被打落了，爷爷却笑了：“明年再种。”',
    questions: [
      { q: '短文用什么来打比方？', a: '把豆角比作一串风铃', wrongs: ['把西红柿比作灯笼', '把菜园比作花园', '把爷爷比作园丁'] },
      { q: '台风过后爷爷为什么笑？', a: '因为来年还可以再种，他并不灰心', wrongs: ['因为他觉得菜很好吃', '因为他不用再浇水了', '因为豆角结得更多了'] },
      { q: '爷爷每天清早做什么？', a: '给菜浇水', wrongs: ['给豆角搭架子', '去菜市卖菜', '收拾工具'] }
    ]
  },
  {
    title: '蜜蜂和花',
    text: '春天来了，花园里开满了花。一只蜜蜂飞过来，落在最红的那朵花上。它把身子钻进花心里，采了满满一篮花粉，又把花蜜带回了蜂巢。蜜蜂走后，那朵花的花瓣上留下一点点黄色的粉末。第二年春天，同样的位置开出了一朵更艳的花。',
    questions: [
      { q: '蜜蜂从花那里带走了什么？', a: '花粉和花蜜', wrongs: ['花瓣和树枝', '露水和雨水', '种子和叶子'] },
      { q: '蜜蜂走后花瓣上留下了什么？', a: '一点点黄色的花粉', wrongs: ['一滴露水', '一片小叶子', '一根细树枝'] },
      { q: '第二年同样的位置为什么开出了更艳的花？', a: '因为蜜蜂传播了花粉，帮助花授粉', wrongs: ['因为那朵花被太阳晒得更久', '因为风把种子吹到了那里', '因为园丁又种了一次'] }
    ]
  },
  {
    title: '整理房间',
    text: '星期六下午，妈妈说：“你的房间该整理了。”我一开始不想动，可是一看，桌上堆着课本，椅子上搭着衣服，床下还藏着两个空瓶子。我决定大干一场：书按科目放好，衣服叠好放进箱子，瓶子扔进垃圾袋。忙了一个多小时，房间亮堂了。妈妈说：“看起来真舒服。”',
    questions: [
      { q: '“我”一开始为什么不想整理？', a: '因为嫌麻烦，看到乱糟糟的样子就不想动', wrongs: ['因为没有时间', '因为房间太大', '因为找不到东西'] },
      { q: '整理用了多长时间？', a: '一个多小时', wrongs: ['十分钟', '整个下午', '一整天'] },
      { q: '书是怎样整理的？', a: '按科目放好', wrongs: ['按大小叠成一摞', '放在椅子上', '全部装进垃圾袋'] }
    ]
  },
  {
    title: '老槐树',
    text: '学校门口有一棵老槐树，据说已经站了一百多年。夏天，树下是同学最爱的地方：有人看书，有人下棋，有人靠着树干讲故事。秋天，槐花落了一地，踩上去软软的，甜甜的香气飘得很远。老槐树的树干上有一道很深的疤，据说是雷劈的，可它还是年年开花。',
    questions: [
      { q: '同学们最喜欢在老槐树的哪个季节待着？', a: '夏天', wrongs: ['春天', '冬天', '秋天'] },
      { q: '老槐树身上有什么痕迹？', a: '一道被雷劈出来的很深的疤', wrongs: ['一圈老藤', '一块褪色的木牌', '一个树洞'] },
      { q: '槐花有什么特点？', a: '踩上去软软的，还有甜甜的香气', wrongs: ['踩上去很硬，没有味道', '只在冬天开花', '颜色是深红色的'] }
    ]
  },
  {
    title: '种下一棵树',
    text: '植树节那天，老师带我们到山坡上种树。挖坑、扶苗、填土、浇水，四个步骤做完，我们的手上全是泥。班长说：“小树苗要长好多年才能像大树一样，我们今天种的树，爷爷退休以后也许还能看见。”我把一棵小苗的位置牢牢记在心里。',
    questions: [
      { q: '种树一共有哪四个步骤？', a: '挖坑、扶苗、填土、浇水', wrongs: ['挖坑、播种、施肥、盖土', '剪枝、浇水、施肥、绑绳', '选苗、挖坑、种下、回家'] },
      { q: '同学们种完树后手上有什么？', a: '全是泥', wrongs: ['全是树叶', '都是水', '很干净'] },
      { q: '班长的话说明了什么？', a: '小树长成大树需要很多年', wrongs: ['种树很难', '大树没有用', '山坡上不适合种树'] }
    ]
  }
]

// 汉字笔画 bank: character to stroke count.
const STROKES = [
  ['一', 1], ['二', 2], ['十', 2], ['人', 2], ['大', 3], ['小', 3], ['山', 3],
  ['木', 4], ['水', 4], ['火', 4], ['中', 4], ['手', 4], ['日', 4], ['月', 4],
  ['田', 5], ['目', 5], ['生', 5], ['鸟', 5], ['白', 5], ['耳', 6], ['竹', 6],
  ['米', 6], ['花', 7], ['走', 7], ['雨', 8], ['青', 8], ['学', 8], ['朋', 8]
]

// 偏旁部首 bank: character to its radical.
const RADICALS = [
  ['江', '氵'], ['河', '氵'], ['湖', '氵'], ['他', '亻'], ['你', '亻'], ['们', '亻'],
  ['妈', '女'], ['姐', '女'], ['花', '艹'], ['草', '艹'], ['说', '讠'], ['语', '讠'],
  ['树', '木'], ['林', '木'], ['码', '石'], ['明', '日'], ['爸', '父'], ['饭', '饣']
]
const RADICAL_SET = [...new Set(RADICALS.map((x) => x[1]))]

function distractors(correct, universe, rng, n = 3) {
  return rng.shuffle([...new Set(universe)].filter((x) => x !== correct)).slice(0, n)
}

function antonym(rng, grade) {
  const [a, b] = rng.pick(ANTONYMS)
  return {
    type: 'chinese',
    kind: 'antonym',
    grade,
    ...choice(`与「${a}」意思相反的词是？`, b, distractors(b, ANTONYMS.flat(), rng), rng)
  }
}

function synonym(rng, grade) {
  const [a, b] = rng.pick(SYNONYMS)
  return {
    type: 'chinese',
    kind: 'synonym',
    grade,
    ...choice(`与「${a}」意思最接近的词是？`, b, distractors(b, SYNONYMS.flat(), rng), rng)
  }
}

function measure(rng, grade) {
  const [q, a] = rng.pick(MEASURE_WORDS)
  return {
    type: 'chinese',
    kind: 'measure',
    grade,
    ...choice(`选择合适的量词：${q}`, a, distractors(a, MEASURE_WORDS.map((x) => x[1]), rng), rng)
  }
}

function idiom(rng, grade) {
  const [q, a] = rng.pick(IDIOMS)
  return {
    type: 'chinese',
    kind: 'idiom',
    grade,
    ...choice(`补全成语：${q}`, a, distractors(a, IDIOM_ANSWERS, rng), rng)
  }
}

function reading(rng, grade) {
  const [w, a] = rng.pick(READINGS)
  const wrongs = distractors(a, READINGS.map((x) => x[1]).concat(['cháng dà', 'yuè yīn', 'gān jìn']), rng)
  return {
    type: 'chinese',
    kind: 'reading',
    grade,
    ...choice(`「${w}」的正确读音是？`, a, wrongs, rng)
  }
}

function rhetoric(rng, grade) {
  const [s, a] = rng.pick(RHETORIC)
  return {
    type: 'chinese',
    kind: 'rhetoric',
    grade,
    ...choice(`「${s}」用了什么修辞手法？`, a, distractors(a, ['比喻', '拟人', '夸张', '反问'], rng), rng)
  }
}

function poem(rng, grade) {
  const poem = rng.pick(POEM_BANK)
  // A line that is not the last one of the poem has a successor.
  const index = rng.int(0, poem.lines.length - 2)
  const first = poem.lines[index]
  const next = poem.lines[index + 1]
  const wrongs = distractors(next, POEM_BANK.flatMap((p) => p.lines), rng)
  return {
    type: 'chinese',
    kind: 'poem',
    grade,
    ...choice(`古诗接龙：「${first}」的下一句是？`, next, wrongs, rng, {
      explain: `《${poem.title}》是${poem.dynasty}代诗人${poem.author}的作品。`
    })
  }
}

// Who wrote this poem?
function poemAuthor(rng, grade) {
  const poem = rng.pick(POEM_BANK)
  return {
    type: 'chinese',
    kind: 'poemAuthor',
    grade,
    ...choice(`《${poem.title}》的作者是谁？`, poem.author, distractors(poem.author, POEM_AUTHORS, rng), rng, {
      explain: `《${poem.title}》是${poem.dynasty}代诗人${poem.author}写的。`
    })
  }
}

// Which poem do these lines come from?
function poemTitle(rng, grade) {
  const poem = rng.pick(POEM_BANK)
  const first = poem.lines[0]
  const second = poem.lines[1] || poem.lines[0]
  return {
    type: 'chinese',
    kind: 'poemTitle',
    grade,
    ...choice(`「${first}${second}」出自哪一首诗？`, poem.title, distractors(poem.title, POEM_TITLES, rng), rng, {
      explain: `《${poem.title}》的作者是${poem.dynasty}代诗人${poem.author}。`
    })
  }
}

// The line before this one.
function poemPrev(rng, grade) {
  const poem = rng.pick(POEM_BANK)
  const index = rng.int(1, poem.lines.length - 1)
  const prev = poem.lines[index - 1]
  const current = poem.lines[index]
  return {
    type: 'chinese',
    kind: 'poemPrev',
    grade,
    ...choice(`古诗接龙：「${current}」的上一句是？`, prev, distractors(prev, POEM_BANK.flatMap((p) => p.lines), rng), rng, {
      explain: `这两句出自《${poem.title}》（${poem.dynasty}·${poem.author}）。`
    })
  }
}

// What does the poem express?
function poemMeaning(rng, grade) {
  const poem = rng.pick(POEM_BANK)
  return {
    type: 'chinese',
    kind: 'poemMeaning',
    grade,
    ...choice(`《${poem.title}》主要表达了什么？`, poem.theme, distractors(poem.theme, POEM_THEMES, rng), rng, {
      explain: `《${poem.title}》（${poem.dynasty}·${poem.author}）写的是${poem.theme}。`
    })
  }
}

// Fill in the missing character.
function poemFill(rng, grade) {
  const poem = rng.pick(POEM_BANK)
  const line = rng.pick(poem.lines)
  const chars = line.replace(/[，。？！、；：]/g, '').split('')
  if (chars.length < 4) return poemAuthor(rng, grade)
  const answer = rng.pick(chars)
  const masked = line.replace(answer, '（　）')
  return {
    type: 'chinese',
    kind: 'poemFill',
    grade,
    ...choice(`补全诗句：${masked}`, answer, distractors(answer, POEM_CHARS, rng), rng, {
      explain: `这句出自《${poem.title}》（${poem.dynasty}·${poem.author}）：${line}`
    })
  }
}

// 阅读理解：读懂一段话，再回答问题。
function comprehension(rng, grade) {
  const passage = rng.pick(PASSAGES)
  const item = rng.pick(passage.questions)
  return {
    type: 'chinese',
    kind: 'comprehension',
    grade,
    ...choice(
      `阅读短文，回答问题。\n《${passage.title}》\n${passage.text}\n\n${item.q}`,
      item.a,
      item.wrongs,
      rng
    )
  }
}

// How many strokes does this character have?
function stroke(rng, grade) {
  const [ch, count] = rng.pick(STROKES)
  return {
    type: 'chinese',
    kind: 'stroke',
    grade,
    ...choice(`汉字「${ch}」一共有多少笔？`, count, numberWrongs(count, rng, 3, 3), rng)
  }
}

// Which radical does this character use?
function radical(rng, grade) {
  const [ch, rad] = rng.pick(RADICALS)
  return {
    type: 'chinese',
    kind: 'radical',
    grade,
    ...choice(`汉字「${ch}」的偏旁部首是什么？`, rad, distractors(rad, RADICAL_SET, rng), rng)
  }
}

export const CHINESE_TYPES = {
  3: [antonym, synonym, measure, idiom, reading, stroke, radical, poem, poemAuthor, poemTitle, poemFill, comprehension],
  4: [antonym, synonym, idiom, reading, rhetoric, poem, poemPrev, poemAuthor, poemTitle, poemMeaning, poemFill, stroke, radical, comprehension]
}

export function generateChinese(rng, grade, kind) {
  const list = CHINESE_TYPES[grade] || CHINESE_TYPES[3]
  if (kind) {
    const found = list.find((f) => f.name === kind)
    if (found) return found(rng, grade)
  }
  return rng.pick(list)(rng, grade)
}
