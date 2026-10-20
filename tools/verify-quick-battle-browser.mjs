/**
 * Browser check for the quick battle simulator and for the update dialog.
 *
 * It drives real Chrome over the DevTools protocol: it opens the home
 * screen, opens the update dialog and reads it back, then walks the quick
 * battle screen and runs a simulation.
 *
 * Usage: node tools/verify-quick-battle-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4192'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9339)
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

const site = spawn('npx', ['vite', 'preview', '--port', String(SITE_PORT), '--host', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore'
})
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${path.join(cache, 'chrome-profile-quick')}`,
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
  await mkdir(cache, { recursive: true })
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

  /* ---------------------------- 1. the home screen ---------------------------- */
  console.log('home screen')
  await send('Page.navigate', { url: SITE })
  await waitFor("!!document.querySelector('input')", 'the home screen')

  const buttons = await evaluate(`
    [...document.querySelectorAll('.actions button')].map((b) => b.textContent.trim())
  `)
  check('the quick battle sits with the game buttons', buttons.some((t) => t.includes('快速战斗')), JSON.stringify(buttons))
  check(
    'the game buttons are still there',
    buttons.some((t) => t.includes('开始新的征程')) && buttons.some((t) => t.includes('继续上次进度')),
    JSON.stringify(buttons)
  )

  /* ---------------------------- 2. the update dialog -------------------------- */
  console.log('update dialog')
  const notesBefore = await evaluate("!!document.querySelector('.notes-wrap')")
  check('the update dialog starts closed', notesBefore === false)
  await clickByText('button.version-badge', '版本')
  await waitFor("!!document.querySelector('.notes-wrap')", 'the update dialog')
  const notes = await evaluate(`
    (() => {
      const el = document.querySelector('.notes-body')
      return el ? el.textContent.trim() : null
    })()
  `)
  const dialog = await evaluate(`
    (() => {
      const el = document.querySelector('.notes-wrap')
      return el ? el.textContent.trim() : null
    })()
  `)
  check('the badge opens the update dialog', !!notes, String(notes))
  check('the dialog names the version', !!dialog && dialog.includes('v0.0.1'), String(dialog).slice(0, 80))
  check('the dialog lists the batches', !!notes && notes.includes('批次'))
  check(
    'the dialog carries no development details',
    !!notes && !/src\/|tools\/|\.mjs|\.vue|Pinia|localStorage|校验/.test(notes),
    notes ? notes.slice(0, 120) : ''
  )
  await clickByText('.notes-close', '✕')
  await sleep(300)
  const notesAfter = await evaluate("!!document.querySelector('.notes-wrap')")
  check('the dialog closes again', notesAfter === false)

  /* --------------------------- 3. the quick battle ---------------------------- */
  console.log('quick battle')
  await clickByText('.actions button', '快速战斗')
  await waitFor("!!document.querySelector('.quick')", 'the quick battle screen')
  await sleep(300)

  const options = await evaluate(`
    (() => {
      const groups = [...document.querySelectorAll('.block')]
      return {
        maps: groups[0] ? groups[0].querySelectorAll('.pick').length : 0,
        sides: groups[1] ? groups[1].querySelectorAll('.pick').length : 0,
        scales: groups[2] ? groups[2].querySelectorAll('.scales .pick').length : 0,
        rounds: groups[2] ? groups[2].querySelectorAll('.rounds-grid .pick').length : 0,
        title: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : null
      }
    })()
  `)
  check('the screen is the quick battle', !!options.title && options.title.includes('快速战斗'), String(options))
  check('six battlefields can be picked', options.maps === 6, String(options.maps))
  check('the two sides can be picked', options.sides === 7, String(options.sides))
  check('four army sizes can be picked', options.scales === 4, String(options.scales))
  check('three round counts can be picked', options.rounds === 3, String(options.rounds))

  // Pick another battlefield, another enemy and a bigger army.
  await clickByText('.block .pick', '密林')
  await clickByText('.block .pick', '赤鹰')
  await clickByText('.scales .pick', '大队')
  await sleep(200)
  const picked = await evaluate(`
    (() => {
      const on = [...document.querySelectorAll('.pick.on')].map((b) => b.textContent.trim())
      return on
    })()
  `)
  check('the picks can be changed', picked.length >= 3, JSON.stringify(picked))

  // Run the simulation.
  await clickByText('button.go', '开始模拟')
  await waitFor("!!document.querySelector('.result')", 'the report', 60000)
  await sleep(300)
  const report = await evaluate(`
    (() => {
      const rate = document.querySelector('.winrate b')
      const rounds = document.querySelectorAll('.round-row').length
      const stats = [...document.querySelectorAll('.stat b')].map((b) => b.textContent.trim())
      return {
        rate: rate ? rate.textContent.trim() : null,
        rounds,
        stats,
        setup: document.querySelector('.setup') ? document.querySelector('.setup').textContent.trim() : null
      }
    })()
  `)
  check('the report shows a win rate', !!report.rate && /%$/.test(report.rate), JSON.stringify(report))
  check('every round is listed', report.rounds === 20, String(report.rounds))
  check('the report holds the averages', report.stats.length === 4, JSON.stringify(report.stats))
  check('the report names the setup', !!report.setup && report.setup.includes('密林'), String(report.setup))

  check('the console stayed clean', consoleErrors.length === 0, consoleErrors.join(' | '))
} catch (err) {
  failed += 1
  console.log(`  FAIL the browser walkthrough — ${err.message}`)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
