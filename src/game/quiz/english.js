// English question generators: meaning to word, word to meaning and spelling.
import { choice, inputQuestion } from './shared'

// Curated grade 3 / grade 4 vocabulary bank with Chinese glosses.
const WORDS = [
  // Grade 3
  { w: 'apple', cn: '苹果', g: 3 },
  { w: 'banana', cn: '香蕉', g: 3 },
  { w: 'orange', cn: '橙子', g: 3 },
  { w: 'pencil', cn: '铅笔', g: 3 },
  { w: 'ruler', cn: '尺子', g: 3 },
  { w: 'book', cn: '书', g: 3 },
  { w: 'school', cn: '学校', g: 3 },
  { w: 'teacher', cn: '老师', g: 3 },
  { w: 'student', cn: '学生', g: 3 },
  { w: 'friend', cn: '朋友', g: 3 },
  { w: 'family', cn: '家庭', g: 3 },
  { w: 'mother', cn: '母亲', g: 3 },
  { w: 'father', cn: '父亲', g: 3 },
  { w: 'water', cn: '水', g: 3 },
  { w: 'bread', cn: '面包', g: 3 },
  { w: 'milk', cn: '牛奶', g: 3 },
  { w: 'cat', cn: '猫', g: 3 },
  { w: 'dog', cn: '狗', g: 3 },
  { w: 'bird', cn: '鸟', g: 3 },
  { w: 'flower', cn: '花', g: 3 },
  { w: 'tree', cn: '树', g: 3 },
  { w: 'happy', cn: '快乐的', g: 3 },
  { w: 'big', cn: '大的', g: 3 },
  { w: 'small', cn: '小的', g: 3 },
  { w: 'red', cn: '红色的', g: 3 },
  { w: 'blue', cn: '蓝色的', g: 3 },
  { w: 'morning', cn: '早上', g: 3 },
  { w: 'window', cn: '窗户', g: 3 },
  { w: 'chair', cn: '椅子', g: 3 },
  { w: 'table', cn: '桌子', g: 3 },
  { w: 'hand', cn: '手', g: 3 },
  { w: 'eye', cn: '眼睛', g: 3 },
  { w: 'rice', cn: '米饭', g: 3 },
  { w: 'egg', cn: '鸡蛋', g: 3 },
  { w: 'panda', cn: '熊猫', g: 3 },
  { w: 'rabbit', cn: '兔子', g: 3 },
  { w: 'monkey', cn: '猴子', g: 3 },
  { w: 'duck', cn: '鸭子', g: 3 },
  { w: 'green', cn: '绿色的', g: 3 },
  { w: 'yellow', cn: '黄色的', g: 3 },
  { w: 'black', cn: '黑色的', g: 3 },
  { w: 'white', cn: '白色的', g: 3 },
  { w: 'rain', cn: '雨', g: 3 },
  { w: 'snow', cn: '雪', g: 3 },
  { w: 'wind', cn: '风', g: 3 },
  { w: 'old', cn: '年老的', g: 3 },
  { w: 'young', cn: '年轻的', g: 3 },
  { w: 'long', cn: '长的', g: 3 },
  { w: 'short', cn: '短的', g: 3 },
  { w: 'open', cn: '打开', g: 3 },
  { w: 'close', cn: '关闭', g: 3 },
  { w: 'run', cn: '跑', g: 3 },
  { w: 'jump', cn: '跳', g: 3 },
  { w: 'sing', cn: '唱歌', g: 3 },
  { w: 'dance', cn: '跳舞', g: 3 },
  { w: 'draw', cn: '画画', g: 3 },
  // Grade 4
  { w: 'mountain', cn: '山', g: 4 },
  { w: 'river', cn: '河流', g: 4 },
  { w: 'weather', cn: '天气', g: 4 },
  { w: 'holiday', cn: '假日', g: 4 },
  { w: 'library', cn: '图书馆', g: 4 },
  { w: 'hospital', cn: '医院', g: 4 },
  { w: 'restaurant', cn: '餐馆', g: 4 },
  { w: 'bicycle', cn: '自行车', g: 4 },
  { w: 'umbrella', cn: '雨伞', g: 4 },
  { w: 'breakfast', cn: '早餐', g: 4 },
  { w: 'vegetable', cn: '蔬菜', g: 4 },
  { w: 'dinosaur', cn: '恐龙', g: 4 },
  { w: 'elephant', cn: '大象', g: 4 },
  { w: 'butterfly', cn: '蝴蝶', g: 4 },
  { w: 'dangerous', cn: '危险的', g: 4 },
  { w: 'delicious', cn: '美味的', g: 4 },
  { w: 'beautiful', cn: '美丽的', g: 4 },
  { w: 'careful', cn: '仔细的', g: 4 },
  { w: 'different', cn: '不同的', g: 4 },
  { w: 'important', cn: '重要的', g: 4 },
  { w: 'remember', cn: '记得', g: 4 },
  { w: 'celebrate', cn: '庆祝', g: 4 },
  { w: 'protect', cn: '保护', g: 4 },
  { w: 'practice', cn: '练习', g: 4 },
  { w: 'invite', cn: '邀请', g: 4 },
  { w: 'whisper', cn: '低语', g: 4 },
  { w: 'scientist', cn: '科学家', g: 4 },
  { w: 'adventure', cn: '冒险', g: 4 },
  { w: 'treasure', cn: '宝藏', g: 4 },
  { w: 'festival', cn: '节日', g: 4 },
  { w: 'competition', cn: '比赛', g: 4 },
  { w: 'university', cn: '大学', g: 4 },
  { w: 'magazine', cn: '杂志', g: 4 },
  { w: 'technology', cn: '科技', g: 4 },
  { w: 'environment', cn: '环境', g: 4 },
  { w: 'culture', cn: '文化', g: 4 },
  { w: 'instrument', cn: '乐器', g: 4 },
  { w: 'medicine', cn: '药', g: 4 },
  { w: 'exercise', cn: '锻炼', g: 4 },
  { w: 'knowledge', cn: '知识', g: 4 },
  { w: 'journey', cn: '旅程', g: 4 },
  { w: 'courage', cn: '勇气', g: 4 },
  { w: 'patient', cn: '耐心的', g: 4 },
  { w: 'polite', cn: '有礼貌的', g: 4 },
  { w: 'honest', cn: '诚实的', g: 4 },
  { w: 'powerful', cn: '强大的', g: 4 },
  { w: 'imagine', cn: '想象', g: 4 },
  { w: 'discover', cn: '发现', g: 4 },
  { w: 'improve', cn: '提高', g: 4 },
  { w: 'describe', cn: '描述', g: 4 },
  { w: 'pollution', cn: '污染', g: 4 }
]

function pool(grade) {
  const list = WORDS.filter((x) => x.g === grade)
  return list.length ? list : WORDS
}

function meaningToWord(rng, grade) {
  const target = rng.pick(pool(grade))
  const wrongs = rng.shuffle(WORDS.filter((x) => x.w !== target.w)).slice(0, 3).map((x) => x.w)
  return {
    type: 'english',
    kind: 'meaning-word',
    grade,
    ...choice(`「${target.cn}」的英语单词是哪一个？`, target.w, wrongs, rng)
  }
}

function wordToMeaning(rng, grade) {
  const target = rng.pick(pool(grade))
  const wrongs = rng.shuffle(WORDS.filter((x) => x.cn !== target.cn)).slice(0, 3).map((x) => x.cn)
  return {
    type: 'english',
    kind: 'word-meaning',
    grade,
    ...choice(`英语单词 ${target.w} 的意思是？`, target.cn, wrongs, rng)
  }
}

function missingLetters(rng, grade) {
  const target = rng.pick(pool(grade).filter((x) => x.w.length >= 4))
  const word = target.w
  const hide = rng.int(1, Math.min(2, word.length - 2))
  const positions = rng.shuffle([...word].map((_, i) => i)).slice(0, hide)
  const masked = [...word].map((c, i) => (positions.includes(i) ? '_' : c)).join('')
  let wrongs = rng
    .shuffle(WORDS.filter((x) => x.w !== word && x.w.length === word.length))
    .slice(0, 3)
    .map((x) => x.w)
  // Top up with any other words so there are always four options to pick from.
  if (wrongs.length < 3) {
    const extra = rng
      .shuffle(WORDS.filter((x) => x.w !== word && !wrongs.includes(x.w)))
      .slice(0, 3 - wrongs.length)
      .map((x) => x.w)
    wrongs = wrongs.concat(extra)
  }
  return {
    type: 'english',
    kind: 'spelling',
    grade,
    ...choice(`补全单词：${masked}（${target.cn}）`, word, wrongs, rng)
  }
}

/**
 * 拼写填空：把整个单词写出来。
 *
 * A filled-in answer: the child types the whole word, so the spelling has to
 * be right and not just picked.
 */
function spellingInput(rng, grade) {
  const list = WORDS.filter((w) => (grade === 4 ? w.g >= 3 : w.g === 3))
  const target = rng.pick(list.length ? list : WORDS)
  return {
    type: 'english',
    kind: 'spelling-input',
    grade,
    ...inputQuestion(`写出「${target.cn}」的英文单词。`, target.w, rng, {
      input: 'text',
      explain: `「${target.cn}」的英文是 ${target.w}。`
    })
  }
}

// A small registry keeps index.js simple when picking a generator.
export const ENGLISH_TYPES = {
  'meaning-word': meaningToWord,
  'word-meaning': wordToMeaning,
  spelling: missingLetters,
  'spelling-input': spellingInput
}

export function generateEnglish(rng, grade, kind) {
  const key = kind && ENGLISH_TYPES[kind] ? kind : rng.pick(Object.keys(ENGLISH_TYPES))
  return ENGLISH_TYPES[key](rng, grade)
}
