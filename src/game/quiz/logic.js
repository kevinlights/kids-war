// Logic and reasoning question generators.
import { choice, numberWrongs } from './shared'

function intQuestion(prompt, answer, rng, meta) {
  return {
    type: 'logic',
    grade: meta.grade,
    ...meta,
    ...choice(prompt, answer, numberWrongs(answer, rng, 3, Math.max(3, Math.round(answer * 0.2) + 2)), rng)
  }
}

// Generate a number sequence and ask for the next term.
function sequence(rng, grade) {
  const kind = rng.int(1, 4)
  let seq
  let next
  if (kind === 1) {
    const step = rng.int(2, 9)
    const start = rng.int(1, 9)
    seq = [start, start + step, start + 2 * step, start + 3 * step]
    next = start + 4 * step
  } else if (kind === 2) {
    const start = rng.int(1, 4)
    seq = [start]
    for (let i = 0; i < 3; i++) seq.push(seq[seq.length - 1] * 2)
    next = seq[seq.length - 1] * 2
  } else if (kind === 3) {
    const start = rng.int(1, 5)
    seq = [start]
    let add = 2
    for (let i = 0; i < 3; i++) {
      seq.push(seq[seq.length - 1] + add)
      add += 1
    }
    next = seq[seq.length - 1] + add
  } else {
    seq = [1, 1]
    for (let i = 0; i < 3; i++) seq.push(seq[seq.length - 1] + seq[seq.length - 2])
    next = seq[seq.length - 1] + seq[seq.length - 2]
    seq = seq.slice(0, 5)
  }
  return intQuestion(`找规律：${seq.join('，')}，（　），下一个数是？`, next, rng, {
    type: 'logic',
    kind: 'sequence',
    grade
  })
}

// Ordering deduction: who is tallest / last.
function ordering(rng, grade) {
  const names = rng.shuffle(['小明', '小红', '小刚', '小丽']).slice(0, 3)
  const [a, b, c] = names
  return {
    type: 'logic',
    kind: 'ordering',
    grade,
    ...choice(
      `${a} 比 ${b} 高，${b} 比 ${c} 高。谁最矮？`,
      c,
      [a, b],
      rng
    )
  }
}

// Age reasoning: simple difference or sum.
function age(rng, grade) {
  if (rng.chance(0.5)) {
    const older = rng.int(8, 12)
    const diff = rng.int(2, 5)
    return intQuestion(`${rng.pick(['哥哥', '姐姐'])}今年 ${older} 岁，比${rng.pick(['弟弟', '妹妹'])}大 ${diff} 岁，小的今年几岁？`, older - diff, rng, {
      type: 'logic',
      kind: 'age',
      grade
    })
  }
  const a = rng.int(7, 12)
  const gap = rng.int(20, 30)
  const dad = a + gap
  return intQuestion(`爸爸今年 ${dad} 岁，小明今年 ${a} 岁，两人的年龄差是多少岁？`, gap, rng, {
    type: 'logic',
    kind: 'age',
    grade
  })
}

// Odd one out from grouped concepts.
function oddOneOut(rng, grade) {
  const groups = [
    { common: ['苹果', '香蕉', '橙子'], odd: '桌子', label: '水果' },
    { common: ['猫', '狗', '兔子'], odd: '石头', label: '动物' },
    { common: ['红色', '蓝色', '绿色'], odd: '圆形', label: '颜色' },
    { common: ['跑步', '游泳', '跳远'], odd: '睡觉', label: '运动' },
    { common: ['铅笔', '尺子', '橡皮'], odd: '苹果', label: '文具' }
  ]
  const g = rng.pick(groups)
  return {
    type: 'logic',
    kind: 'odd-one',
    grade,
    ...choice('下面哪一个和其他三个不是一类？', g.odd, g.common, rng)
  }
}

// Deduction with a small set: find the missing item.
function deduction(rng, grade) {
  const items = rng.shuffle(['红球', '黄球', '蓝球', '白球']).slice(0, 3)
  const [a, b, c] = items
  return {
    type: 'logic',
    kind: 'deduction',
    grade,
    ...choice(`盒子里有 ${a}、${b}、${c}。抽出一个不是 ${a}，也不是 ${b}，那么抽出的是？`, c, [a, b], rng)
  }
}

// Weight balance style reasoning with simple numbers.
function balance(rng, grade) {
  const per = rng.int(2, 6)
  const n = rng.int(2, 4)
  return intQuestion(`1 只小猫重 ${per} 千克，那么 ${n} 只同样重的小猫一共重多少千克？`, per * n, rng, {
    type: 'logic',
    kind: 'balance',
    grade
  })
}

// Sort three distinct numbers into ascending order.
function compare(rng, grade) {
  const set = new Set()
  while (set.size < 3) set.add(rng.int(2, 99))
  const values = [...set]
  const ascending = [...values].sort((a, b) => a - b)
  const correct = ascending.join('、')
  const wrongs = []
  for (const a of values) {
    for (const b of values) {
      for (const c of values) {
        if (a === b || b === c || a === c) continue
        const text = `${a}、${b}、${c}`
        if (text !== correct && !wrongs.includes(text)) wrongs.push(text)
      }
    }
  }
  return {
    type: 'logic',
    kind: 'compare',
    grade,
    ...choice(`把 ${values.join('、')} 按从小到大的顺序排列，正确的是？`, correct, wrongs, rng)
  }
}

// Classic chickens-and-rabbits: solve for the number of rabbits.
function chickenRabbit(rng, grade) {
  const rabbits = rng.int(1, 4)
  const chickens = rng.int(1, 6)
  const heads = rabbits + chickens
  const legs = 4 * rabbits + 2 * chickens
  return intQuestion(`笼子里有鸡和兔一共 ${heads} 只，数一数共有 ${legs} 条腿。兔有几只？`, rabbits, rng, {
    type: 'logic',
    kind: 'chicken-rabbit',
    grade
  })
}

// Permutations: how many ways can n children line up?
function arrange(rng, grade) {
  const n = rng.int(3, 4)
  const total = n === 3 ? 6 : 24
  const wrongs = [n, n * 2, n * 3, total - 1, total + 2].filter((v) => v !== total)
  return {
    type: 'logic',
    kind: 'arrange',
    grade,
    ...choice(`${n} 个小朋友排成一排照相，一共有多少种不同的排法？`, total, wrongs, rng)
  }
}

// Handshake count: each pair shakes once.
function handshake(rng, grade) {
  const n = rng.int(4, 6)
  return intQuestion(`${n} 个人见面，每两个人握一次手，一共要握多少次手？`, (n * (n - 1)) / 2, rng, {
    type: 'logic',
    kind: 'handshake',
    grade
  })
}

export const LOGIC_TYPES = {
  3: [sequence, ordering, age, oddOneOut, deduction, balance, compare],
  4: [sequence, ordering, age, oddOneOut, deduction, balance, compare, chickenRabbit, arrange, handshake]
}

export function generateLogic(rng, grade, kind) {
  const list = LOGIC_TYPES[grade] || LOGIC_TYPES[3]
  if (kind) {
    const found = list.find((f) => f.name === kind)
    if (found) return found(rng, grade)
  }
  return rng.pick(list)(rng, grade)
}
