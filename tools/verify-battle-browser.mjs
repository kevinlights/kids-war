/**
 * Browser check for the difficulty setting, the battle speed control, the
 * battlefield terrain and the siege interruption.
 *
 * It drives real Chrome over the DevTools protocol: it seeds saves with the
 * lord next to a hostile town and next to a bandit village, then walks the
 * real buttons and reads the DOM back.
 *
 * Usage: node tools/verify-battle-browser.mjs
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
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9337)
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

/* ------------------------------ build the saves ----------------------------- */

await mkdir(cache, { recursive: true })
const saveOut = path.join(cache, 'make-battle-save.mjs')
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

/* -------------------------------- start the site ---------------------------- */

const site = spawn('npx', ['vite', 'preview', '--port', String(SITE_PORT), '--host', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore'
})
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${path.join(cache, 'chrome-profile-battle')}`,
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

  /** Load a save and resume it, leaving the lord next to the settlement. */
  const loadScenario = async (scenario) => {
    const { payload, settlement } = buildScenarioSave(scenario)
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
    return settlement
  }

  /* ---------------------------- 1. the difficulty ---------------------------- */
  console.log('difficulty')
  await send('Page.navigate', { url: SITE })
  await waitFor("!!document.querySelector('input')", 'the home screen')
  const diffButtons = await evaluate(`
    [...document.querySelectorAll('.diff-btn')].map((b) => b.textContent.trim())
  `)
  check('the home screen offers three difficulties', diffButtons.length === 3, JSON.stringify(diffButtons))
  check(
    'the difficulties are named',
    diffButtons.some((t) => t.includes('简单')) &&
      diffButtons.some((t) => t.includes('普通')) &&
      diffButtons.some((t) => t.includes('困难')),
    JSON.stringify(diffButtons)
  )
  await clickByText('.diff-btn', '困难')
  await sleep(200)
  const picked = await evaluate(`
    (() => {
      const buttons = [...document.querySelectorAll('.diff-btn')]
      return buttons.findIndex((b) => b.classList.contains('on'))
    })()
  `)
  check('the hard difficulty can be picked', picked === 2, String(picked))

  /* --------------------------- 2. the world map ----------------------------- */
  console.log('world map')
  await loadScenario('siege')
  const diffChip = await evaluate(`
    (() => {
      const chip = document.querySelector('.diff-chip')
      return chip ? chip.textContent.trim() : null
    })()
  `)
  check('the world map shows the difficulty', !!diffChip && diffChip.includes('🎚'), String(diffChip))
  await clickByText('.diff-chip', '🎚')
  await waitFor("!!document.querySelector('.settings')", 'the difficulty sheet')
  const sheetButtons = await evaluate(`
    [...document.querySelectorAll('.settings .diff-btn')].map((b) => b.textContent.trim())
  `)
  check('the sheet offers the three difficulties', sheetButtons.length === 3, JSON.stringify(sheetButtons))
  await clickByText('.settings .diff-btn', '普通')
  await sleep(200)
  const storeDifficulty = await evaluate("window.kidsWarGame.stores.player.difficulty")
  check('the difficulty changes the campaign', storeDifficulty === 'normal', String(storeDifficulty))
  await clickByText('.settings .diff-btn', '简单')
  await sleep(200)

  // The siege can be prepared and then interrupted again.
  const siegeButtons = await evaluate(`
    [...document.querySelectorAll('.hud-bottom button')].map((b) => b.textContent.trim())
  `)
  check(
    'the hostile town offers to prepare a siege',
    siegeButtons.some((t) => t.includes('准备围城')),
    JSON.stringify(siegeButtons)
  )
  await clickByText('.hud-bottom button', '准备围城')
  await sleep(400)
  const duringSiege = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const st = w.settlements.find((s) => s.siege)
      return {
        active: w.siegeActive,
        buttons: [...document.querySelectorAll('.hud-bottom button')].map((b) => b.textContent.trim())
      }
    })()
  `)
  check('the siege is being prepared', duringSiege.active === true, JSON.stringify(duringSiege))
  check(
    'the siege can be interrupted from the map',
    duringSiege.buttons.some((t) => t.includes('取消围城')),
    JSON.stringify(duringSiege.buttons)
  )
  await clickByText('.hud-bottom button', '取消围城')
  await sleep(400)
  const afterCancel = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      return {
        active: w.siegeActive,
        buttons: [...document.querySelectorAll('.hud-bottom button')].map((b) => b.textContent.trim())
      }
    })()
  `)
  check('the siege is gone after the interruption', afterCancel.active === false, JSON.stringify(afterCancel))
  check(
    'the siege can be prepared again',
    afterCancel.buttons.some((t) => t.includes('准备围城')),
    JSON.stringify(afterCancel.buttons)
  )

  /* ---------------------------- 3. the battle ------------------------------- */
  console.log('battle')
  await loadScenario('bandit')
  await clickByText('.hud-bottom button', '赶走强盗')
  await waitFor("!!document.querySelector('canvas.battle-canvas')", 'the battle screen')
  await sleep(900)
  const battleState = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const canvas = document.querySelector('canvas.battle-canvas')
      const ctx = canvas.getContext('2d')
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      const colors = new Set()
      for (let i = 0; i < data.length; i += 4 * 97) {
        colors.add(data[i] + ',' + data[i + 1] + ',' + data[i + 2])
      }
      return {
        speed: b.speed,
        zoom: b.zoom,
        terrain: b.data ? [...new Set(Array.from(b.data.terrain.cells))].length : 0,
        colors: colors.size,
        speedButtons: [...document.querySelectorAll('.speed-btn')].map((x) => x.textContent.trim())
      }
    })()
  `)
  check('the battle starts slow', battleState.speed === 'slow', JSON.stringify(battleState))
  check('the field carries several kinds of terrain', battleState.terrain >= 4, JSON.stringify(battleState))
  check('the field is painted with many colours', battleState.colors > 8, JSON.stringify(battleState))
  check('the camera zooms into the field', battleState.zoom > 0.5 && battleState.zoom < 2, JSON.stringify(battleState))

  // The tools panel opens and the speed can be changed.
  await clickByText('.tool', '⚙')
  await waitFor("!!document.querySelector('.tools-panel')", 'the battle tools')
  const speedButtons = await evaluate(`
    [...document.querySelectorAll('.speed-btn')].map((x) => x.textContent.trim())
  `)
  check('the battle screen offers the three speeds', speedButtons.length === 3, JSON.stringify(speedButtons))
  const terrainRows = await evaluate(`
    [...document.querySelectorAll('.terrain-row .terrain-name')].map((x) => x.textContent.trim())
  `)
  check(
    'the tools panel lists the terrain',
    ['森林', '沙地', '河流', '湖泊', '山地'].every((n) => terrainRows.includes(n)),
    JSON.stringify(terrainRows)
  )
  await clickByText('.speed-btn', '快速')
  await sleep(300)
  const newSpeed = await evaluate("window.kidsWarGame.stores.battle.speed")
  check('the fast speed can be picked', newSpeed === 'fast', String(newSpeed))

  // A drag pans the field, and the recenter button brings the camera back.
  const camera = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const before = { x: b.camX, follow: b.follow }
      b.panCamera(120, 0)
      const after = { x: b.camX, follow: b.follow }
      b.recenter()
      return { before, after, follow: b.follow }
    })()
  `)
  check('a drag moves the camera', camera.after.x !== camera.before.x, JSON.stringify(camera))
  check('a drag stops the auto follow', camera.after.follow === false, JSON.stringify(camera))
  check('the recenter button follows the fight again', camera.follow === true, JSON.stringify(camera))

  check('the console stays clean', consoleErrors.length === 0, consoleErrors.join(' | '))
} catch (err) {
  failed += 1
  console.log(`  FAIL the browser pass — ${err.message}`)
} finally {
  cleanup()
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
