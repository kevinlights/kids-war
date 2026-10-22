/**
 * Browser check for the settlement upgrade panel.
 *
 * It seeds a save with the lord next to a village, walks into the village in
 * real Chrome, opens the 升级 tab and upgrades militia into spearmen, then
 * checks the rendered roster and the treasury.
 *
 * Usage: node tools/verify-upgrade-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = process.env.KWG_ROOT
  ? path.resolve(process.env.KWG_ROOT)
  : path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4187'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9333)
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
const saveOut = path.join(cache, 'make-save.mjs')
await build({
  entryPoints: [path.join(root, 'tools', 'make-save.entry.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: saveOut,
  alias: { '@': path.join(root, 'src') },
  logLevel: 'warning'
})
const { buildSave } = await import(pathToFileURL(saveOut).href)
const { payload, settlement } = buildSave()
console.log(`seed ${payload.seed}, village ${settlement.name} at ${settlement.x},${settlement.y}`)

/* ------------------------------- start the site ---------------------------- */

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
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${path.join(cache, 'chrome-profile')}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1200,900',
  'about:blank'
], { stdio: 'ignore' })

async function cleanup() {
  site.kill()
  chrome.kill()
}
process.on('exit', cleanup)

try {
  // Wait for both servers.
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

  /* --------------------------------- CDP ---------------------------------- */

  const target = await (
    await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(SITE)}`, {
      method: 'PUT'
    })
  ).json()

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let msgId = 0
  const pending = new Map()
  const consoleErrors = []
  const events = []

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(JSON.stringify(msg.error)))
      else resolve(msg.result)
      return
    }
    events.push(msg)
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
    const res = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    })
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || ''))
    }
    return res.result.value
  }

  await send('Page.enable')
  await send('Runtime.enable')

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

  await waitFor("!!document.querySelector('input')", 'the home screen')
  await evaluate(`
    localStorage.setItem('kids-war-game:save:tester', ${JSON.stringify(JSON.stringify(payload))});
    localStorage.setItem('kids-war-game:users', '["tester"]');
    true
  `)
  await send('Page.reload')
  await waitFor("!!document.querySelector('input')", 'the home screen after reload')

  // Type the lord name and resume the seeded save.
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
  await evaluate(`
    (() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('继续上次进度'))
      if (!btn) return false
      btn.click()
      return true
    })()
  `)

  await waitFor("!!document.querySelector('.enter-btn')", 'the enter-settlement button')
  const enterText = await evaluate("document.querySelector('.enter-btn').textContent.trim()")
  check('the world map offers the nearby village', enterText.includes(settlement.name), enterText)
  check('the enter button is the only way in', enterText.includes('进入'), enterText)

  await evaluate("document.querySelector('.enter-btn').click()")
  await waitFor("!!document.querySelector('.tabs')", 'the settlement screen')

  // Open the upgrade tab.
  await evaluate(`
    (() => {
      const tab = [...document.querySelectorAll('.tab')].find((b) => b.textContent.includes('升级'))
      if (!tab) return false
      tab.click()
      return true
    })()
  `)
  await waitFor("!!document.querySelector('.troop-block')", 'the upgrade list')
  await sleep(300)

  const readRoster = `(() => {
    const rows = [...document.querySelectorAll('.troop-block')].map((b) => {
      const head = b.querySelector('.troop-head')
      return {
        name: head.querySelector('b').textContent.trim(),
        tier: head.querySelector('.tier').textContent.trim(),
        count: head.querySelector('.muted').textContent.trim(),
        options: [...b.querySelectorAll('.up-row')].map((r) => r.querySelector('.up-info b').textContent.trim())
      }
    })
    const gold = document.querySelector('.chip.gold').textContent.trim()
    return { rows, gold }
  })()`

  const before = await evaluate(readRoster)
  check('the militia block is listed', before.rows.some((r) => r.name === '民兵'), JSON.stringify(before.rows))
  check(
    'the militia row offers the three families',
    before.rows[0] && before.rows[0].options.length === 3,
    JSON.stringify(before.rows[0] && before.rows[0].options)
  )

  // Raise the stepper to three soldiers, then upgrade into the spearman row.
  await evaluate(`
    (() => {
      const row = [...document.querySelectorAll('.up-row')].find((r) => r.querySelector('.up-info b').textContent.includes('长枪兵'))
      if (!row) return false
      const plus = [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === '＋')
      plus.click()
      plus.click()
      return true
    })()
  `)
  await sleep(200)
  await evaluate(`
    (() => {
      const row = [...document.querySelectorAll('.up-row')].find((r) => r.querySelector('.up-info b').textContent.includes('长枪兵'))
      if (!row) return false
      const btn = [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === '升级')
      btn.click()
      return true
    })()
  `)
  await sleep(500)

  const after = await evaluate(readRoster)
  const spearmen = after.rows.find((r) => r.name === '初级长枪兵')
  const militia = after.rows.find((r) => r.name === '民兵')
  check('the spearman group appears in the roster', !!spearmen, JSON.stringify(after.rows))
  check('the spearman group holds three soldiers', spearmen && spearmen.count.includes('3'), spearmen && spearmen.count)
  check('the spearman group is rank 1', spearmen && spearmen.tier === '初级', spearmen && spearmen.tier)
  check('the militia shrank to five', militia && militia.count.includes('5'), militia && militia.count)

  const goldBefore = Number(before.gold.replace(/[^\d]/g, ''))
  const goldAfter = Number(after.gold.replace(/[^\d]/g, ''))
  check('the treasury paid for the upgrade', goldAfter === goldBefore - 39, `${goldBefore} -> ${goldAfter}`)

  // The same panel must also promote a spearman to the next rank.
  await evaluate(`
    (() => {
      const block = [...document.querySelectorAll('.troop-block')].find((b) => b.querySelector('.troop-head b').textContent.trim() === '初级长枪兵')
      if (!block) return false
      const row = block.querySelector('.up-row')
      const btn = [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === '升级')
      btn.click()
      return true
    })()
  `)
  await sleep(500)
  const ranked = await evaluate(readRoster)
  const midSpear = ranked.rows.find((r) => r.name === '中级长枪兵')
  const basicSpear = ranked.rows.find((r) => r.name === '初级长枪兵')
  check('the rank climb creates a 中级长枪兵', !!midSpear, JSON.stringify(ranked.rows))
  check('the promoted soldier is rank 2', midSpear && midSpear.tier === '中级', midSpear && midSpear.tier)
  check('the promoted soldier is alone in the new group', midSpear && midSpear.count.includes('1'), midSpear && midSpear.count)
  check('the basic group shrank to two', basicSpear && basicSpear.count.includes('2'), basicSpear && basicSpear.count)

  check('the console stayed clean', consoleErrors.length === 0, consoleErrors.join(' | '))
} finally {
  await cleanup()
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
