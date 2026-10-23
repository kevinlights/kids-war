/**
 * Browser check for the frame rate of a big battle.
 *
 * It boots the built site, opens a quick battle with 400 soldiers a side (800
 * on the field) and samples requestAnimationFrame for a few seconds while the
 * armies are fighting. The simulation does the work, so the check fails when a
 * change makes a large battle crawl again.
 *
 * Usage: node tools/verify-perf-browser.mjs
 */
import { spawn } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4202'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9352)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const TARGET_FPS = 30

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

/* -------------------------------- start the site ---------------------------- */

const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const site = spawn(
  process.execPath,
  [viteBin, 'preview', '--port', String(SITE_PORT), '--host', '127.0.0.1', '--strictPort'],
  { cwd: root, stdio: 'ignore' }
)
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${path.join(root, 'node_modules', '.cache', 'kwg-verify', 'chrome-profile-perf')}`,
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

let ws
try {
  let siteUp = false
  let cdpUp = false
  for (let i = 0; i < 80; i += 1) {
    try {
      siteUp = (await fetch(`${SITE}/`)).ok
    } catch {
      siteUp = false
    }
    try {
      cdpUp = (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).ok
    } catch {
      cdpUp = false
    }
    if (siteUp && cdpUp) break
    await sleep(250)
  }
  if (!siteUp || !cdpUp) throw new Error('the preview server or Chrome did not start')

  const target = await (
    await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })
  ).json()
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true })
    ws.addEventListener('error', rej, { once: true })
  })

  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) rej(new Error(JSON.stringify(msg.error)))
      else res(msg.result)
    }
  })
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id
      pending.set(n, { res, rej })
      ws.send(JSON.stringify({ id: n, method, params }))
    })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''))
    }
    return r.result.value
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: `${SITE}/#/quick` })
  await sleep(2500)

  /* ---------------------------- open a big battle ---------------------------- */

  const started = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const army = [
        { type: 'militia', tier: 1, count: 100 },
        { type: 'spearman', tier: 1, count: 100 },
        { type: 'archer', tier: 1, count: 100 },
        { type: 'cavalry', tier: 1, count: 100 }
      ]
      b.startQuick({ map: 'plain', playerTroops: army, enemyTroops: army, enemyFaction: 'bandit', seed: 4242 })
      b.setSpeed('fast')
      location.hash = '#/battle'
      return { active: b.active, units: b.data.units.length }
    })()
  `)
  check('the field carries 800 soldiers', started.units === 800, JSON.stringify(started))

  // The armies hold for a moment before the charge: wait for the first blood
  // so the sample carries the full weight of the fight, not the standoff.
  let contact = false
  for (let i = 0; i < 40; i += 1) {
    await sleep(500)
    const alive = await evaluate(
      '(() => { const b = window.kidsWarGame.stores.battle; return b.data ? b.data.units.filter((u) => u.alive).length : 0 })()'
    )
    if (alive < 800) {
      contact = true
      break
    }
  }
  check('the armies meet', contact)

  const firstHud = await evaluate(
    "(() => { const el = document.querySelector('.hud-top'); return el ? el.innerText.replace(/\\s+/g, ' ') : '' })()"
  )
  const firstStamp = await evaluate('window.kidsWarGame.stores.battle.stamp')

  const frameStats = await evaluate(`
    new Promise((resolve) => {
      const gaps = []
      let last = performance.now()
      const started = last
      function frame(now) {
        gaps.push(now - last)
        last = now
        if (now - started < 6000) {
          requestAnimationFrame(frame)
          return
        }
        const sorted = gaps.slice().sort((a, b) => a - b)
        const total = now - started
        resolve({
          frames: gaps.length,
          fps: Math.round((gaps.length * 1000) / total),
          p50: +sorted[Math.floor(sorted.length * 0.5)].toFixed(1),
          p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
          worst: +sorted[sorted.length - 1].toFixed(1)
        })
      }
      requestAnimationFrame(frame)
    })
  `)
  console.log('  frame rate', JSON.stringify(frameStats))
  check(
    `the battle holds ${TARGET_FPS} frames a second with 800 soldiers`,
    frameStats.fps >= TARGET_FPS,
    JSON.stringify(frameStats)
  )
  check('only the odd frame drags', frameStats.p95 <= 50, JSON.stringify(frameStats))

  const after = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const alive = b.data.units.filter((u) => u.alive).length
      const el = document.querySelector('.hud-top')
      const canvas = document.querySelector('canvas')
      let ink = 0
      if (canvas) {
        const g = canvas.getContext('2d')
        const d = g.getImageData(0, 0, Math.min(48, canvas.width), Math.min(48, canvas.height)).data
        for (let i = 0; i < d.length; i += 4) ink += d[i] + d[i + 1] + d[i + 2]
      }
      return {
        alive,
        hud: el ? el.innerText.replace(/\\s+/g, ' ') : '',
        stamp: b.stamp,
        ink,
        errors: window.__kwgErrors || []
      }
    })()
  `)
  check('the fight goes on', after.alive < 800, JSON.stringify({ alive: after.alive }))
  check('the command bar keeps up', after.stamp > firstStamp, `${firstStamp} -> ${after.stamp}`)
  check('the counts on screen move', after.hud !== firstHud, firstHud + ' -> ' + after.hud)
  check('the field is painted', after.ink > 0)
  check('the console stays clean', after.errors.length === 0, JSON.stringify(after.errors))

  /* ---------------------------------- report -------------------------------- */

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exitCode = failed ? 1 : 0
} catch (err) {
  console.error('  FAIL the perf check could not run —', err.message)
  process.exitCode = 1
} finally {
  try {
    ws?.close()
  } catch {
    /* already closed */
  }
  cleanup()
}
