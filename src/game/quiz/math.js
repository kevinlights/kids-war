// Math question generators for grade 3 and grade 4.
import { choice, numberWrongs } from './shared'

function intQuestion(prompt, answer, rng, meta) {
  return {
    ...meta,
    ...choice(prompt, answer, numberWrongs(answer, rng, 3, Math.max(4, Math.round(answer * 0.25) + 3)), rng),
    unit: 'number'
  }
}

// Grade 3 generators -------------------------------------------------------
function mul1(rng, grade) {
  const a = rng.int(12, 99)
  const b = rng.int(2, 9)
  return intQuestion(`${a} × ${b} = ？`, a * b, rng, { type: 'math', kind: 'mul-1', grade })
}

function addSub(rng, grade) {
  if (rng.chance(0.5)) {
    const a = rng.int(120, 780)
    const b = rng.int(110, 760)
    return intQuestion(`${a} + ${b} = ？`, a + b, rng, { type: 'math', kind: 'add', grade })
  }
  const a = rng.int(300, 980)
  const b = rng.int(110, 290)
  return intQuestion(`${a} − ${b} = ？`, a - b, rng, { type: 'math', kind: 'sub', grade })
}

function divExact(rng, grade) {
  const b = rng.int(3, 9)
  const q = rng.int(4, 40)
  return intQuestion(`${b * q} ÷ ${b} = ？`, q, rng, { type: 'math', kind: 'div', grade })
}

function unitConvert(rng, grade) {
  const cases = [
    ['1 米 = 多少厘米？', 100],
    ['1 小时 = 多少分钟？', 60],
    ['1 千克 = 多少克？', 1000],
    ['1 分米 = 多少厘米？', 10],
    ['1 千米 = 多少米？', 1000],
    ['1 分钟 = 多少秒？', 60]
  ]
  const [q, a] = rng.pick(cases)
  return intQuestion(q, a, rng, { type: 'math', kind: 'unit', grade })
}

function perimeter(rng, grade) {
  if (rng.chance(0.5)) {
    const a = rng.int(3, 18)
    return intQuestion(`边长 ${a} 厘米的正方形，周长是多少厘米？`, a * 4, rng, { type: 'math', kind: 'perimeter', grade })
  }
  const w = rng.int(4, 20)
  const h = rng.int(3, 15)
  return intQuestion(`长 ${w} 米、宽 ${h} 米的长方形，周长是多少米？`, (w + h) * 2, rng, {
    type: 'math',
    kind: 'perimeter',
    grade
  })
}

// Shopping arithmetic: unit price times quantity.
function money(rng, grade) {
  const price = rng.int(2, 9)
  const count = rng.int(3, 12)
  return intQuestion(`一支铅笔 ${price} 元，买 ${count} 支一共要多少元？`, price * count, rng, {
    type: 'math',
    kind: 'money',
    grade
  })
}

// Elapsed time between two clock readings, answered in minutes.
function timeDiff(rng, grade) {
  const start = rng.int(6, 10) * 60
  const elapsed = rng.int(40, 240)
  const end = start + elapsed
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
  return intQuestion(`从 ${fmt(start)} 到 ${fmt(end)}，一共经过了多少分钟？`, elapsed, rng, {
    type: 'math',
    kind: 'time-diff',
    grade
  })
}

// Grade 4 generators -------------------------------------------------------
function mul2(rng, grade) {
  const a = rng.int(11, 49)
  const b = rng.int(11, 39)
  return intQuestion(`${a} × ${b} = ？`, a * b, rng, { type: 'math', kind: 'mul-2', grade })
}

function divBig(rng, grade) {
  const b = rng.int(3, 12)
  const q = rng.int(12, 88)
  return intQuestion(`${b * q} ÷ ${b} = ？`, q, rng, { type: 'math', kind: 'div-big', grade })
}

function area(rng, grade) {
  if (rng.chance(0.5)) {
    const a = rng.int(3, 25)
    return intQuestion(`边长 ${a} 米的正方形，面积是多少平方米？`, a * a, rng, { type: 'math', kind: 'area', grade })
  }
  const w = rng.int(4, 30)
  const h = rng.int(3, 20)
  return intQuestion(`长 ${w} 米、宽 ${h} 米的长方形，面积是多少平方米？`, w * h, rng, {
    type: 'math',
    kind: 'area',
    grade
  })
}

function angle(rng, grade) {
  const cases = [
    ['一个直角是多少度？', 90],
    ['一个平角是多少度？', 180],
    ['一个周角是多少度？', 360],
    ['一个三角形的内角和是多少度？', 180],
    ['一个四边形的内角和是多少度？', 360]
  ]
  const [q, a] = rng.pick(cases)
  return intQuestion(q, a, rng, { type: 'math', kind: 'angle', grade })
}

function decimalAdd(rng, grade) {
  const a = rng.int(11, 99) / 10
  const b = rng.int(11, 99) / 10
  const sum = Math.round((a + b) * 10) / 10
  const wrongs = [sum + 0.1, sum - 0.1, sum + 1, sum - 1].map((v) => Math.round(v * 10) / 10)
  return {
    type: 'math',
    kind: 'decimal',
    grade,
    ...choice(`${a} + ${b} = ？`, sum, wrongs, rng)
  }
}

function mixedOrder(rng, grade) {
  const a = rng.int(2, 9)
  const b = rng.int(2, 9)
  const c = rng.int(2, 20)
  return intQuestion(`${a} × ${b} + ${c} = ？`, a * b + c, rng, { type: 'math', kind: 'mixed', grade })
}

// Mean of three numbers; the numbers are built so the mean is a whole number.
function average(rng, grade) {
  const avg = rng.int(10, 60)
  const a = avg - rng.int(1, 5)
  const b = avg + rng.int(1, 5)
  const c = 3 * avg - a - b
  return intQuestion(`${a}、${b}、${c} 这三个数的平均数是多少？`, avg, rng, {
    type: 'math',
    kind: 'average',
    grade
  })
}

// Distance from speed and time.
function speed(rng, grade) {
  const kmh = rng.int(30, 90)
  const hours = rng.int(2, 6)
  return intQuestion(`一辆汽车每小时行驶 ${kmh} 千米，${hours} 小时一共行驶多少千米？`, kmh * hours, rng, {
    type: 'math',
    kind: 'speed',
    grade
  })
}

// Same-denominator fraction addition, answered as a "a/b" string.
function fractionSame(rng, grade) {
  const den = rng.int(5, 12)
  const a = rng.int(1, Math.max(1, den - 3))
  const b = rng.int(1, Math.max(1, den - a - 1))
  const sum = a + b
  const correct = `${sum}/${den}`
  const wrongs = [`${sum}/${den + den}`, `${sum + 1}/${den}`, `${a * b}/${den}`, `${sum}/${den + 1}`].filter(
    (x) => x !== correct
  )
  return {
    type: 'math',
    kind: 'fraction',
    grade,
    ...choice(`${a}/${den} + ${b}/${den} = ？`, correct, wrongs, rng)
  }
}

export const MATH_TYPES = {
  3: [mul1, addSub, divExact, unitConvert, perimeter, money, timeDiff],
  4: [mul2, divBig, area, angle, decimalAdd, mixedOrder, average, speed, fractionSame]
}

export function generateMath(rng, grade) {
  const list = MATH_TYPES[grade] || MATH_TYPES[3]
  return rng.pick(list)(rng, grade)
}
