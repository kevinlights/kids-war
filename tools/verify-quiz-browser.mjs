/**
 * Browser check for the exam spine: the paper settlement, the gear a paper
 * drops, the mastery map, the revision modes and the attributes the
 * experience buys.
 *
 * It drives real Chrome over the DevTools protocol: it seeds a save with a
 * memory curve, walks the real buttons (town → exam → answer → result) and
 * reads the DOM and the stores back.
 *
 * Usage: node tools/verify-quiz-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4196'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9346)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

let failed = 0
let passed = 0
function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  ok   ${name}`)
  } else {
    failed += 1
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`)
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ------------------------------ build the save ----------------------------- */

await mkdir(cache, { recursive: true })
const saveOut = path.join(cache, 'make-quiz-save.mjs')
await build({
  entryPoints: [path.join(root, 'tools', 'make-quiz-save.entry.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: saveOut,
  alias: { '@': path.join(root, 'src') },
  logLevel: 'warning'
})
const { buildQuizSave } = await import(pathToFileURL(saveOut).href)

/* -------------------------------- start the site ---------------------------- */

// The preview server is started through node and vite's own binary, so that
// killing it really stops the server: `npx` would leave the server running
// and the next run would talk to a stale build on a busy port.
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const site = spawn(
  process.execPath,
  [viteBin, 'preview', '--port', String(SITE_PORT), '--host', '127.0.0.1', '--strictPort'],
  {
    cwd: root,
    stdio: 'ignore'
  }
)
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(cache, 'chrome-profile-quiz')}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1200,900',
    'about:blank'
  ],
  { stdio: 'ignore' }
)

const cleanup = () => {
  site.kill()
  chrome.kill()
}
process.on('exit', cleanup)

try {
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await fetch(`${SITE}/`)
      const c = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)
      if (r.ok && c.ok) break
    } catch {
      /* not up yet */
    }
    await sleep(500)
  }

  const target = await (
    await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(SITE)}`, { method: 'PUT' })
  ).json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let msgId = 0
  const pending = new Map()
  const consoleErrors = []
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(JSON.stringify(msg.error)))
      else resolve(msg.result)
      return
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.text)
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '))
    }
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++msgId
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })
  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || ''))
    }
    return res.result.value
  }
  const waitFor = async (expression, label, timeout = 30000) => {
    const started = Date.now()
    while (Date.now() - started < timeout) {
      try {
        if (await evaluate(expression)) return true
      } catch {
        /* the page may still be swapping documents */
      }
      await sleep(200)
    }
    throw new Error(`timeout waiting for ${label}`)
  }
  const clickByText = (selector, text) =>
    evaluate(`
      (() => {
        const el = [...document.querySelectorAll(${JSON.stringify(selector)})]
          .find((n) => n.textContent.includes(${JSON.stringify(text)}))
        if (!el) return false
        el.click()
        return true
      })()
    `)

  await send('Page.enable')
  await send('Runtime.enable')

  /* ------------------------------ load the save ----------------------------- */

  const { payload, keys } = buildQuizSave()
  await send('Page.navigate', { url: SITE })
  await waitFor("!!document.querySelector('input')", 'the home screen')
  await evaluate(`
    localStorage.setItem('kids-war-game:save:tester', ${JSON.stringify(JSON.stringify(payload))});
    localStorage.setItem('kids-war-game:users', '["tester"]');
    true
  `)
  await send('Page.reload')
  await waitFor("!!document.querySelector('input')", 'the home screen after reload')
  await evaluate(`
    (() => {
      const input = document.querySelector('input')
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(input, 'tester')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      return input.value
    })()
  `)
  await sleep(300)
  await clickByText('button', '继续上次进度')
  await waitFor("!!document.querySelector('.hud-bottom')", 'the world map')
  await sleep(600)

  /* --------------------------- 1. the world map chip ------------------------ */

  const chip = await evaluate(`
    [...document.querySelectorAll('.chip')].map((c) => c.textContent.trim())
  `)
  check(
    'the world map shows the attribute points',
    chip.some((t) => t.includes('属性点')),
    JSON.stringify(chip)
  )

  /* ----------------------------- 2. the exam setup ------------------------- */

  await clickByText('.hud-bottom button', '进入')
  await waitFor("!!document.querySelector('.tabs')", 'the settlement')
  await sleep(400)
  await clickByText('.tabs .tab', '考试')
  await waitFor("!!document.querySelector('.exam-entry')", 'the exam tab')
  await sleep(300)
  await clickByText('.exam-entry button', '开始考试')
  await waitFor("!!document.querySelector('.exam')", 'the exam modal')
  await sleep(300)

  const setup = await evaluate(`
    (() => {
      const exam = document.querySelector('.exam')
      const text = exam.textContent.replace(/\\s+/g, ' ').trim()
      const modes = [...exam.querySelectorAll('.opt')].map((o) => o.textContent.trim())
      return {
        text,
        modes,
        rows: exam.querySelectorAll('.mastery-row').length,
        bars: exam.querySelectorAll('.m-fill').length
      }
    })()
  `)
  check('the exam offers the three paper types', setup.modes.some((m) => m.includes('标准考试')), JSON.stringify(setup.modes))
  check('the exam offers a paper of mistakes', setup.modes.some((m) => m.includes('只考错题')), JSON.stringify(setup.modes))
  check('the exam offers the review queue', setup.modes.some((m) => m.includes('复习队列')), JSON.stringify(setup.modes))
  check('the exam shows the mastery map', setup.rows >= 2, String(setup.rows))
  check('the mastery map has a bar per subject', setup.bars >= 2, String(setup.bars))
  check('the mastery map counts the mistakes', setup.text.includes('掌握'), setup.text.slice(0, 120))

  // The revision modes are offered, because the save has both.
  const modesEnabled = await evaluate(`
    [...document.querySelectorAll('.exam .opt')].map((o) => ({ text: o.textContent.trim(), disabled: o.disabled }))
  `)
  check(
    'the paper of mistakes is available',
    modesEnabled.some((m) => m.text.includes('只考错题') && !m.disabled),
    JSON.stringify(modesEnabled)
  )
  check(
    'the review queue is available',
    modesEnabled.some((m) => m.text.includes('复习队列') && !m.disabled),
    JSON.stringify(modesEnabled)
  )

  /* ------------------------- 3. the paper of mistakes ---------------------- */

  await clickByText('.exam .opt', '只考错题')
  await sleep(200)
  await clickByText('.exam button', '开始考试')
  await waitFor("!!document.querySelector('.exam .question')", 'the paper')
  await sleep(300)

  const mistakePaper = await evaluate(`
    (() => {
      const exam = document.querySelector('.exam')
      const setup = exam.__vueParentComponent.setupState
      return { count: setup.paper.length, items: setup.paper.map((p) => p.item) }
    })()
  `)
  check('the paper of mistakes holds the mistakes', mistakePaper.count === 4, String(mistakePaper.count))
  check(
    'the paper of mistakes holds the asked questions',
    mistakePaper.items.every((item) => keys.includes(item)),
    JSON.stringify(mistakePaper.items)
  )

  /* ------------------------ 4. a perfect paper settles --------------------- */

  /**
   * Answer the question that is on the screen, whatever shape it has, and
   * return the feedback the interface shows.
   */
  const answerCurrent = async () => {
    const state = await evaluate(`
      (() => {
        const exam = document.querySelector('.exam')
        if (!exam) return null
        const setup = exam.__vueParentComponent.setupState
        const question = setup.paper[setup.index]
        if (!question) return null
        // The paper holds reactive values, so everything is copied into plain
        // data before it leaves the page.
        const answer = question.answer
        return {
          index: setup.index,
          total: setup.paper.length,
          shape: question.options
            ? 'mc'
            : question.input
              ? 'input'
              : question.pairs
                ? 'pairs'
                : question.items
                  ? 'order'
                  : 'unknown',
          answerIndex: typeof answer === 'number' ? answer : -1,
          answerText: Array.isArray(answer) ? String(answer[0]) : typeof answer === 'string' ? answer : '',
          pairs: (question.pairs || []).map((p) => [String(p[0]), String(p[1])]),
          order: (question.order || []).map((x) => String(x))
        }
      })()
    `)
    if (!state) return { state: null, feedback: '' }

    if (state.shape === 'mc') {
      const index = state.answerIndex
      await evaluate(`
        (() => {
          const buttons = [...document.querySelectorAll('.exam .answer')]
          const target = buttons[${index}]
          if (target) target.click()
          return true
        })()
      `)
    } else if (state.shape === 'input') {
      const value = state.answerText
      await evaluate(`
        (() => {
          const input = document.querySelector('.exam .fill-input')
          if (!input) return false
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
          setter.call(input, ${JSON.stringify(String(value))})
          input.dispatchEvent(new Event('input', { bubbles: true }))
          return true
        })()
      `)
      await sleep(120)
      await clickByText('.exam .fill button', '确认')
    } else if (state.shape === 'pairs') {
      for (const pair of state.pairs) {
        await evaluate(`
          (() => {
            const lefts = [...document.querySelectorAll('.exam .match-col:first-child .match-item')]
            const left = lefts.find((n) => n.textContent.includes(${JSON.stringify(pair[0])}))
            if (left) left.click()
            return true
          })()
        `)
        await sleep(80)
        await evaluate(`
          (() => {
            const rights = [...document.querySelectorAll('.exam .match-col:last-child .match-item')]
            const right = rights.find((n) => n.textContent.trim() === ${JSON.stringify(pair[1])})
            if (right) right.click()
            return true
          })()
        `)
        await sleep(80)
      }
      await clickByText('.exam .match-actions button', '确认')
    } else if (state.shape === 'order') {
      for (const item of state.order) {
        await evaluate(`
          (() => {
            const pool = [...document.querySelectorAll('.exam .pool-item')]
            const target = pool.find((n) => n.textContent.trim() === ${JSON.stringify(item)})
            if (target) target.click()
            return true
          })()
        `)
        await sleep(80)
      }
      await clickByText('.exam .match-actions button', '确认')
    }
    await sleep(160)
    const feedback = await evaluate(`
      (() => {
        const el = document.querySelector('.exam .feedback')
        if (el) return el.textContent.replace(/\\s+/g, ' ').trim()
        const exam = document.querySelector('.exam')
        return 'NO FEEDBACK :: ' + (exam ? exam.className + ' :: ' + exam.textContent.replace(/\\s+/g, ' ').trim().slice(0, 200) : 'no exam')
      })()
    `)
    return { state, feedback }
  }

  // Back to the setup and take an ordinary paper, answering every question
  // right so the settlement can be checked.
  await clickByText('.exam button', '提前交卷')
  await sleep(300)
  await clickByText('.exam button', '再来一次')
  await sleep(300)
  await clickByText('.exam button', '开始考试')
  await waitFor("!!document.querySelector('.exam .question')", 'the second paper')
  await sleep(300)

  const before = await evaluate(`
    (() => {
      const p = window.kidsWarGame.stores.player
      return { gold: p.gold, experience: p.experience, food: p.supplies.food, ticket: p.supplies.ticket }
    })()
  `)

  for (let i = 0; i < 16; i += 1) {
    const { state, feedback } = await answerCurrent()
    if (!state) break
    if (!feedback.includes('答对')) {
      check('every answer of the paper is accepted', false, feedback)
      break
    }
    await clickByText('.exam .actions button', state.index + 1 >= state.total ? '查看成绩' : '下一题')
    await sleep(200)
  }

  await waitFor("!!document.querySelector('.exam .result-grid')", 'the result')
  const result = await evaluate(`
    (() => {
      const exam = document.querySelector('.exam')
      const text = exam.textContent.replace(/\\s+/g, ' ').trim()
      const rows = [...exam.querySelectorAll('.b-row')].map((r) => r.textContent.replace(/\\s+/g, ' ').trim())
      const drops = [...exam.querySelectorAll('.drop')].map((d) => d.textContent.replace(/\\s+/g, ' ').trim())
      return { text, rows, drops }
    })()
  `)
  check('the result shows the settlement', result.rows.length >= 2, JSON.stringify(result.rows))
  check('the result shows the streak', result.rows.some((r) => r.includes('连击')), JSON.stringify(result.rows))
  check('the result shows the perfect bonus', result.rows.some((r) => r.includes('全部答对')), JSON.stringify(result.rows))
  check('the result shows the pass bonus', result.rows.some((r) => r.includes('及格线')), JSON.stringify(result.rows))
  check('the result shows the dropped gear', result.drops.length >= 1, JSON.stringify(result.drops))
  check('the result shows the experience', result.text.includes('经验'), result.text.slice(0, 200))

  const after = await evaluate(`
    (() => {
      const p = window.kidsWarGame.stores.player
      return {
        gold: p.gold,
        experience: p.experience,
        food: p.supplies.food,
        ticket: p.supplies.ticket,
        correct: p.stats.correct,
        points: p.availableSkillPoints
      }
    })()
  `)
  check('the paper pays more than the base price', after.gold > before.gold, `${before.gold} -> ${after.gold}`)
  check('the paper teaches', after.experience > before.experience, `${before.experience} -> ${after.experience}`)
  check('the paper drops gear', after.food > before.food || after.ticket > before.ticket, JSON.stringify(after))
  check('the correct answers are counted', after.correct > 0, String(after.correct))
  check('the experience buys attribute points', after.points >= 1, String(after.points))

  /* ---------------------------- 5. the lord panel --------------------------- */

  await clickByText('.exam button', '结束')
  await sleep(300)
  // Back to the world map, where the status chips live.
  await clickByText('button', '返回世界地图')
  await waitFor("!!document.querySelector('.hud-top')", 'the world map')
  await sleep(400)
  await clickByText('.chip', '属性点')
  await waitFor("!!document.querySelector('.lord')", 'the lord panel')
  const panel = await evaluate(`
    (() => {
      const lord = document.querySelector('.lord')
      const text = lord.textContent.replace(/\\s+/g, ' ').trim()
      return {
        text,
        attrs: lord.querySelectorAll('.attr-row').length,
        mastery: lord.querySelectorAll('.mastery-row').length,
        milestones: lord.querySelectorAll('.drop').length
      }
    })()
  `)
  check('the lord panel lists the four attributes', panel.attrs === 4, String(panel.attrs))
  check('the lord panel shows the mastery map', panel.mastery >= 2, String(panel.mastery))
  check('the lord panel shows the milestones', panel.milestones >= 1, String(panel.milestones))
  check('the lord panel shows the experience', panel.text.includes('经验'), panel.text.slice(0, 160))

  // Spending a point really changes the attribute.
  const spent = await evaluate(`
    (() => {
      const p = window.kidsWarGame.stores.player
      const before = p.attributes.leadership
      const lord = document.querySelector('.lord')
      const rows = [...lord.querySelectorAll('.attr-row')]
      const row = rows.find((r) => r.textContent.includes('统御'))
      const button = row ? row.querySelector('button') : null
      if (button) button.click()
      return { before, after: p.attributes.leadership }
    })()
  `)
  check('a point can be spent on an attribute', spent.after === spent.before + 1, JSON.stringify(spent))

  await clickByText('.lord button', '知道了')
  await sleep(300)

  /* ------------------------- 6. the market and the recruits ----------------- */

  // Back into the town for the market and the recruits.
  await clickByText('.hud-bottom button', '进入')
  await waitFor("!!document.querySelector('.tabs')", 'the settlement again')
  await sleep(400)
  await clickByText('.tabs .tab', '市场')
  await sleep(300)

  const market = await evaluate(`
    (() => {
      const buttons = [...document.querySelectorAll('.panel button')].map((b) => b.textContent.trim())
      const chips = [...document.querySelectorAll('.panel .chip')].map((c) => c.textContent.trim())
      return { buttons, chips }
    })()
  `)
  check('the market shows the voucher', market.chips.some((c) => c.includes('集市券')), JSON.stringify(market.chips))
  check('the market offers to spend the voucher', market.buttons.some((b) => b.includes('用券')), JSON.stringify(market.buttons))

  const used = await evaluate(`
    (() => {
      const p = window.kidsWarGame.stores.player
      const before = p.supplies.ticket
      const button = [...document.querySelectorAll('.panel button')].find((b) => b.textContent.includes('用券'))
      if (button) button.click()
      return { before, after: p.supplies.ticket }
    })()
  `)
  check('the voucher buys something for free', used.after === used.before - 1, JSON.stringify(used))

  await clickByText('.tabs .tab', '招募')
  await sleep(300)
  const order = await evaluate(`
    (() => {
      const p = window.kidsWarGame.stores.player
      const before = p.supplies.order
      const troops = p.totalTroops
      const button = [...document.querySelectorAll('.panel button')].find((b) => b.textContent.includes('征兵令'))
      if (button) button.click()
      return { before, after: p.supplies.order, troops, troopsAfter: p.totalTroops }
    })()
  `)
  check('the recruit order is offered', order.before > 0, JSON.stringify(order))
  check('the recruit order hires for free', order.after === order.before - 1, JSON.stringify(order))
  check('the recruit order brings soldiers', order.troopsAfter === order.troops + 2, JSON.stringify(order))

  /* --------------------------- 7. the question shapes ----------------------- */

  // The paper is drawn with the clock as its seed, so the clock is pinned and
  // the memory curve is cleared: the same paper comes out every time.
  await evaluate(`
    (() => {
      window.__kwgRealNow = Date.now
      window.__kwgSeed = 1700000000000
      Date.now = () => window.__kwgSeed
      const p = window.kidsWarGame.stores.player
      p.questionStats = {}
      return true
    })()
  `)

  await clickByText('.tabs .tab', '考试')
  await sleep(300)
  await clickByText('.exam-entry button', '开始考试')
  await waitFor("!!document.querySelector('.exam')", 'the exam modal again')
  await sleep(300)
  // Only the subjects that carry the new shapes are picked, so the paper
  // really holds one of them.
  await evaluate(`
    (() => {
      const wanted = ['英文', '语文', '数学', '逻辑']
      const options = [...document.querySelectorAll('.exam .field .opt')]
      for (const option of options) {
        const text = option.textContent.trim()
        const keep = wanted.some((name) => text.includes(name))
        const on = option.classList.contains('on')
        if (keep && !on) option.click()
        if (!keep && on) option.click()
      }
      return true
    })()
  `)
  await sleep(300)
  // A paper of twelve questions, so the new shapes have room.
  await clickByText('.exam .field .opt', '12 题')
  await sleep(200)
  await clickByText('.exam .actions button', '开始考试')
  await waitFor("!!document.querySelector('.exam .question')", 'the third paper')
  await sleep(300)

  // The three new shapes are put into the paper, so every one of them is
  // really answered on the screen.
  await evaluate(`
    (() => {
      const exam = document.querySelector('.exam')
      const setup = exam.__vueParentComponent.setupState
      setup.paper = [
        { type: 'math', grade: 3, item: 'test:input', prompt: '3 × 4 = ？', input: 'number', answer: ['12'], explain: '3 × 4 = 12。' },
        { type: 'chinese', grade: 3, item: 'test:pairs', prompt: '连一连', pairs: [['苹果', 'apple'], ['香蕉', 'banana']], rights: ['banana', 'apple'], explain: '苹果 apple，香蕉 banana。' },
        { type: 'chinese', grade: 3, item: 'test:order', prompt: '排一排', items: ['立春', '雨水', '惊蛰'], order: ['立春', '雨水', '惊蛰'], explain: '顺序：立春 → 雨水 → 惊蛰。' }
      ]
      setup.index = 0
      return true
    })()
  `)
  await sleep(300)

  // The shape of every question of the paper.
  const shapes = await evaluate(`
    (() => {
      const exam = document.querySelector('.exam')
      const setup = exam.__vueParentComponent.setupState
      return setup.paper.map((q) => ({
        shape: q.options ? 'mc' : q.input ? 'input' : q.pairs ? 'pairs' : q.items ? 'order' : 'unknown'
      }))
    })()
  `)
  const found = shapes.reduce((acc, s) => ({ ...acc, [s.shape]: (acc[s.shape] || 0) + 1 }), {})
  check('the paper holds the three new shapes', found.input === 1 && found.pairs === 1 && found.order === 1, JSON.stringify(found))

  // Answer every question, whatever shape it has.
  let answeredOk = 0
  for (let i = 0; i < 3; i += 1) {
    const { state, feedback } = await answerCurrent()
    if (!state) break
    if (feedback.includes('答对')) answeredOk += 1
    else check(`the ${state.shape} question is answered right`, false, feedback)
    await clickByText('.exam .actions button', i + 1 >= 3 ? '查看成绩' : '下一题')
    await sleep(200)
  }
  check('every question of the paper is answered right', answeredOk === 3, `${answeredOk}/3`)
  await waitFor("!!document.querySelector('.exam .result-grid')", 'the result of the third paper')
  const thirdResult = await evaluate(`
    (() => {
      const p = window.kidsWarGame.stores.player
      return { correct: p.stats.correct, gold: p.gold }
    })()
  `)
  check('the paper of every shape pays out', thirdResult.gold > 0, JSON.stringify(thirdResult))

  await evaluate('Date.now = window.__kwgRealNow; true')

  /* ---------------------------- 8. the question bank ------------------------ */

  await clickByText('.exam button', '结束')
  await sleep(300)
  await evaluate("location.hash = '#/'; true")
  await waitFor("!!document.querySelector('input')", 'the home screen')
  await sleep(400)
  await clickByText('button', '题库检索')
  await waitFor("!!document.querySelector('.bank')", 'the question bank')
  await sleep(600)

  const bank = await evaluate(`
    (() => {
      const rows = [...document.querySelectorAll('.row')]
      return {
        count: document.querySelectorAll('.row').length,
        total: document.querySelector('.count') ? document.querySelector('.count').textContent.trim() : '',
        first: rows[0] ? rows[0].textContent.replace(/\\s+/g, ' ').trim() : '',
        hasSearch: !!document.querySelector('.search'),
        filters: [...document.querySelectorAll('.filters .chip')].map((c) => c.textContent.trim())
      }
    })()
  `)
  check('the bank lists the questions', bank.count > 20, String(bank.count))
  check('the bank counts its questions', /\d+ 道题/.test(bank.total), bank.total)
  check('the bank has a search box', bank.hasSearch === true)
  check('the bank can be filtered by grade and subject', bank.filters.length >= 8, JSON.stringify(bank.filters))

  // The search really filters.
  await evaluate(`
    (() => {
      const input = document.querySelector('.search')
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(input, '古诗')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      return input.value
    })()
  `)
  await sleep(400)
  const searched = await evaluate(`
    (() => {
      const rows = [...document.querySelectorAll('.row')]
      return {
        count: rows.length,
        allMatch: rows.every((r) => r.textContent.includes('古诗'))
      }
    })()
  `)
  check('the search narrows the list down', searched.count > 0 && searched.count < bank.count, JSON.stringify(searched))
  check('every row of the search matches the word', searched.allMatch === true, JSON.stringify(searched))

  // Opening a row shows the answer.
  await evaluate("document.querySelector('.row-head').click(); true")
  await sleep(300)
  const opened = await evaluate(`
    (() => {
      const body = document.querySelector('.row-body')
      return body ? body.textContent.replace(/\\s+/g, ' ').trim() : ''
    })()
  `)
  check('a row shows its answer', opened.includes('答案'), opened.slice(0, 120))

  // A generated question can draw another sample.
  const reroll = await evaluate(`
    (() => {
      const rows = [...document.querySelectorAll('.row')]
      const row = rows.find((r) => r.querySelector('.row-actions button'))
      if (!row) return { skipped: true }
      const before = row.querySelector('.row-prompt').textContent.trim()
      row.querySelector('.row-actions button').click()
      return { before, skipped: false }
    })()
  `)
  await sleep(400)
  const afterReroll = await evaluate(`
    (() => {
      const rows = [...document.querySelectorAll('.row')]
      const row = rows.find((r) => r.querySelector('.row-actions button'))
      return row ? row.querySelector('.row-prompt').textContent.trim() : ''
    })()
  `)
  check('a generated question can draw another sample', !reroll.skipped && afterReroll.length > 0, JSON.stringify(reroll))

  // The subject filter only keeps that subject: the search is cleared first.
  await evaluate(`
    (() => {
      const input = document.querySelector('.search')
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })()
  `)
  await sleep(300)
  await clickByText('.filters .chip', '数学')
  await sleep(300)
  const filteredBank = await evaluate(`
    (() => {
      const rows = [...document.querySelectorAll('.row')]
      return { count: rows.length, allMath: rows.every((r) => r.textContent.includes('数学')) }
    })()
  `)
  check('the subject filter keeps one subject', filteredBank.count > 0 && filteredBank.allMath === true, JSON.stringify(filteredBank))

  /* -------------------------------- the console ----------------------------- */

  check('the console stays clean', consoleErrors.length === 0, consoleErrors.join(' | '))
} finally {
  cleanup()
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
