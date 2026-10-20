/**
 * Browser check for the Chinese question bank: a real exam paper that carries
 * a reading passage and an ancient-poem question, read back from the DOM.
 *
 * Usage: node tools/verify-chinese-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4190'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9336)
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

/* -------------------------------- the saves --------------------------------- */

await mkdir(cache, { recursive: true })
const saveOut = path.join(cache, 'make-chinese-save.mjs')
await build({
  entryPoints: [path.join(root, 'tools', 'make-chinese-save.entry.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: saveOut,
  alias: { '@': path.join(root, 'src') },
  logLevel: 'warning'
})
const { buildScenarioSave } = await import(pathToFileURL(saveOut).href)

/* -------------------------------- start the site ---------------------------- */

const site = spawn('npx', ['vite', 'preview', '--port', String(SITE_PORT), '--host', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore'
})
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${path.join(cache, 'chrome-profile-chinese')}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1200,900',
  'about:blank'
], { stdio: 'ignore' })

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
  const waitFor = async (expression, label, timeout = 15000) => {
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

  /* ------------------------- a paper with the new kinds --------------------- */
  const { payload } = buildScenarioSave()
  await waitFor("!!document.querySelector('input')", 'the home screen')
  await evaluate(`
    localStorage.setItem('kids-war-game:save:tester', ${JSON.stringify(JSON.stringify(payload))});
    localStorage.setItem('kids-war-game:users', '["tester"]');
    true
  `)
  await send('Page.navigate', { url: SITE })
  await waitFor("!!document.querySelector('input')", 'the home screen again')
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
  await clickByText('.hud-bottom button', '进入')
  await waitFor("!!document.querySelector('.tabs')", 'the settlement screen')
  await sleep(400)

  /** Take one Chinese paper and collect the questions it asked. */
  const runPaper = async () => {
    await clickByText('.tab', '考试')
    await waitFor("!!document.querySelector('.exam-card')", 'the exam card')
    await clickByText('.exam-card button', '开始考试')
    await waitFor("!!document.querySelector('.exam .body')", 'the exam modal')
    // Only the Chinese subject, so the paper is all reading and poems.
    await evaluate(`
      (() => {
        const field = [...document.querySelectorAll('.exam .field')].find((f) => f.textContent.includes('科目'))
        if (!field) return false
        const opts = [...field.querySelectorAll('.opt')]
        opts.forEach((o) => {
          if (!o.textContent.includes('语文') && o.classList.contains('on')) o.click()
        })
        return true
      })()
    `)
    await sleep(200)
    // A long paper, so the reading passages and the poems both show up.
    await clickByText('.exam .opt', '12 题')
    await sleep(200)
    await clickByText('.exam .actions button', '开始考试')
    await waitFor("!!document.querySelector('.answers .answer')", 'the first question')

    // Walk the whole paper and remember what it asked.
    for (let i = 0; i < 20; i += 1) {
      const done = await evaluate(`
        (() => {
          const answers = [...document.querySelectorAll('.answers .answer')]
          if (!answers.length) return true
          const prompt = document.querySelector('.question')?.textContent || ''
          window.__paper = window.__paper || []
          if (window.__paper[window.__paper.length - 1] !== prompt) window.__paper.push(prompt)
          const box = document.querySelector('.question')
          if (box && !window.__layout) {
            window.__layout = { whiteSpace: getComputedStyle(box).whiteSpace, height: box.clientHeight }
          }
          if (!answers[0].disabled) answers[0].click()
          return false
        })()
      `)
      if (done) break
      await sleep(220)
      await evaluate(`
        (() => {
          const next = [...document.querySelectorAll('.exam .actions button')].find((b) => b.textContent.includes('下一题') || b.textContent.includes('查看成绩'))
          if (next && !next.disabled) next.click()
          return true
        })()
      `)
    }
    await sleep(400)
    // Hand the paper in and leave the exam.
    await clickByText('.exam .actions button', '提前交卷')
    await sleep(300)
    await clickByText('.exam .actions button', '结束')
    await sleep(300)
    return evaluate('window.__paper || []')
  }

  // A reading passage is one question among many, so a few papers are drawn
  // before the check gives up.
  let paper = []
  for (let attempt = 0; attempt < 3; attempt += 1) {
    paper = await runPaper()
    if (paper.some((p) => p.includes('阅读短文'))) break
  }
  const passages = paper.filter((p) => p.includes('阅读短文'))
  const poems = paper.filter((p) => p.includes('古诗') || p.includes('《'))
  check('the paper carries a reading passage', passages.length > 0, `${passages.length} of ${paper.length}`)
  check('the paper carries an ancient poem question', poems.length > 0, `${poems.length} of ${paper.length}`)
  check('the paper has no repeated question', new Set(paper).size === paper.length, `${paper.length} questions, ${new Set(paper).size} distinct`)
  check(
    'the reading passage keeps its line breaks',
    passages.length === 0 || passages[0].split('\n').length >= 3,
    passages[0] ? JSON.stringify(passages[0].slice(0, 40)) : ''
  )

  // The passage must be readable: the question box keeps the line breaks.
  const layout = await evaluate('window.__layout || null')
  check('the question box keeps the passage breaks', layout && layout.whiteSpace === 'pre-wrap', JSON.stringify(layout))

  check('the console stayed clean', consoleErrors.length === 0, consoleErrors.join(' | '))
} finally {
  await cleanup()
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
