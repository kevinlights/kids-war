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

const POEMS = [
  ['床前明月光，', '疑是地上霜'], ['白日依山尽，', '黄河入海流'], ['锄禾日当午，', '汗滴禾下土'],
  ['春眠不觉晓，', '处处闻啼鸟'], ['两个黄鹂鸣翠柳，', '一行白鹭上青天'], ['千山鸟飞绝，', '万径人踪灭'],
  ['欲穷千里目，', '更上一层楼'], ['野火烧不尽，', '春风吹又生'], ['谁知盘中餐，', '粒粒皆辛苦']
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
  const [first, next] = rng.pick(POEMS)
  const wrongs = distractors(next, POEMS.map((x) => x[1]), rng)
  return {
    type: 'chinese',
    kind: 'poem',
    grade,
    ...choice(`古诗接龙：「${first}」的下一句是？`, next, wrongs, rng)
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
  3: [antonym, synonym, measure, idiom, reading, stroke, radical],
  4: [antonym, synonym, idiom, reading, rhetoric, poem, stroke, radical]
}

export function generateChinese(rng, grade, kind) {
  const list = CHINESE_TYPES[grade] || CHINESE_TYPES[3]
  if (kind) {
    const found = list.find((f) => f.name === kind)
    if (found) return found(rng, grade)
  }
  return rng.pick(list)(rng, grade)
}
