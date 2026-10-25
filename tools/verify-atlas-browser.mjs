/**
 * Browser check for the detailed atlas ownership colours: it seeds a save with
 * the lord next to a hostile town, opens the atlas by clicking the minimap, and
 * asserts the hostile town's ring is drawn in its faction colour on the real
 * canvas. It also saves a screenshot of the open atlas.
 *
 * Usage: node tools/verify-atlas-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4189'
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

await mkdir(cache, { recursive: true })
const saveOut = path.join(cache, 'make-settlement-save.mjs')
await build({
  entryPoints: [path.join(root, 'tools', 'make-settlement-save.entry.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: saveOut,
  alias: { '@': path.join(root, 'src') },
  logLevel: 'warning'
})
const { buildScenarioSave } = await import(pathToFileURL(saveOut).href)

const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const site = spawn(
  process.execPath,
  [viteBin, 'preview', '--port', String(SITE_PORT), '--host', '127.0.0.1', '--strictPort'],
  { cwd: root, stdio: 'ignore' }
)
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(cache, 'chrome-profile-atlas')}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,900',
    'about:blank'
  ],
  { stdio: 'ignore' }
)
const cleanup = () => {
  site.kill()
  chrome.kill()
}
process.on('exit', cleanup)

const shotDir = path.join(root, 'dist', 'atlas-check')
await mkdir(shotDir, { recursive: true })

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
        /* page may still be swapping documents */
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

  // Seed the siege scenario: the lord stands next to a hostile (wolf/eagle) town.
  const { settlement, payload } = buildScenarioSave('siege')
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
  await sleep(500)

  // Open the detailed atlas by tapping the corner minimap.
  const opened = await evaluate(`
    (() => {
      const b = document.querySelector('button.minimap')
      if (!b) return false
      b.click()
      return true
    })()
  `)
  check('the minimap button opens the atlas', opened)
  await waitFor("!!document.querySelector('canvas.atlas-canvas')", 'the atlas canvas')
  await sleep(600) // let a few frames paint the world and its rings

  // The hostile town sits one tile from the lord, whom the atlas centres on, so
  // its ownership ring lies within the middle of the canvas. Scan that middle
  // region for the town owner's colour to prove the ring renders.
  const ring = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const st = w.settlements.find((s) => s.id === ${JSON.stringify(settlement.id)})
      const canvas = document.querySelector('canvas.atlas-canvas')
      if (!st || !canvas) return null
      const rect = canvas.getBoundingClientRect()
      const dpr = canvas.width / rect.width
      const ownerColor = { wolf: [122, 92, 192], eagle: [201, 138, 43] }[st.owner]
      const ctx = canvas.getContext('2d')
      const cx = Math.round(rect.width / 2 * dpr)
      const cy = Math.round(rect.height / 2 * dpr)
      const box = 90 * dpr
      const data = ctx.getImageData(cx - box, cy - box, box * 2, box * 2).data
      let matches = 0
      for (let i = 0; i < data.length; i += 4) {
        if (Math.abs(data[i] - ownerColor[0]) < 35 && Math.abs(data[i + 1] - ownerColor[1]) < 35 && Math.abs(data[i + 2] - ownerColor[2]) < 35) matches += 1
      }
      return { owner: st.owner, matches }
    })()
  `)
  check(
    'the atlas draws the hostile town ring in its faction colour',
    ring && ring.matches > 30,
    JSON.stringify(ring)
  )

  // Save a screenshot of the open atlas for the user to see the colours.
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  const shotFile = path.join(shotDir, `atlas-ownership-${settlement.owner}.png`)
  await writeFile(shotFile, Buffer.from(shot.data, 'base64'))
  check('the atlas screenshot was saved', true, shotFile)

  check('the console is clean', consoleErrors.length === 0, JSON.stringify(consoleErrors.slice(0, 3)))

  console.log(`\nscreenshot: ${shotFile}`)
} finally {
  cleanup()
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
