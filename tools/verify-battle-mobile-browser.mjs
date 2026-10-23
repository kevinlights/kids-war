/**
 * Mobile check for the battle screen.
 *
 * It drives real Chrome over the DevTools protocol with a 390 x 844 phone
 * viewport (dpr 3, touch on), opens a real battle and measures what a phone
 * player actually sees: which panels cover the field, whether the corners stay
 * clear, how much of the map is left between the bars, whether the buttons can
 * be hit with a thumb and how far the field can be dragged past its edge.
 *
 * Usage: node tools/verify-battle-mobile-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4192'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9339)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PHONE = { width: 390, height: 844, dpr: 3 }

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
const saveOut = path.join(cache, 'make-battle-mobile-save.mjs')
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

const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const site = spawn(
  process.execPath,
  [viteBin, 'preview', '--port', String(SITE_PORT), '--host', '127.0.0.1', '--strictPort'],
  { cwd: root, stdio: 'ignore' }
)
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${path.join(cache, 'chrome-profile-battle-mobile')}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=500,900',
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: PHONE.width,
    height: PHONE.height,
    deviceScaleFactor: PHONE.dpr,
    mobile: true
  })
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })

  /** Load the bandit save and resume it, leaving the lord next to the camp. */
  const { payload } = buildScenarioSave('bandit')
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
  await clickByText('.hud-bottom button', '赶走强盗')
  await waitFor("!!document.querySelector('canvas.battle-canvas')", 'the battle screen')
  await sleep(1200)

  const metrics = await evaluate('({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio })')
  check('the phone viewport is emulated', metrics.w === PHONE.width && metrics.h === PHONE.height, JSON.stringify(metrics))
  check('the page does not scroll sideways', await evaluate('document.documentElement.scrollWidth <= innerWidth'), '')
  check('the page does not scroll up and down', await evaluate('document.documentElement.scrollHeight <= innerHeight'), '')

  /* ------------------------------ the layout ------------------------------- */

  const layout = await evaluate(`
    (() => {
      const box = (sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return null
        return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }
      }
      const overlap = (a, b) => {
        if (!a || !b) return 0
        const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
        const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
        return Math.max(0, w) * Math.max(0, h)
      }
      const b = window.kidsWarGame.stores.battle
      const field = document.querySelector('.battle-canvas')
      const fr = field.getBoundingClientRect()
      const t = b.data ? b.data.terrain : null
      return {
        w: innerWidth,
        h: innerHeight,
        hudTop: box('.hud-top'),
        hudTools: box('.hud-tools'),
        command: box('.command'),
        chips: box('.chips'),
        orders: box('.command .orders'),
        sheetToggle: box('.sheet-toggle'),
        hint: box('.command .hint'),
        standoff: box('.standoff'),
        warn: box('.warn'),
        intel: box('.intel'),
        canvas: { x: fr.x, y: fr.y, w: fr.width, h: fr.height },
        topOverlap: overlap(box('.hud-top'), box('.hud-tools')),
        fieldW: t ? t.cols * t.cell : 0,
        fieldH: t ? t.rows * t.cell : 0,
        zoom: b.zoom,
        camX: b.camX,
        camY: b.camY,
        follow: b.follow
      }
    })()
  `)
  console.log('layout', JSON.stringify(layout, null, 2))
  if (process.env.KWG_SHOT) {
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    const { writeFileSync } = await import('node:fs')
    writeFileSync(process.env.KWG_SHOT, Buffer.from(shot.data, 'base64'))
    console.log('shot', process.env.KWG_SHOT)
  }

  check('the canvas fills the phone screen', layout.canvas.w === layout.w && layout.canvas.h === layout.h, JSON.stringify(layout.canvas))
  check('the top bar and the tools do not overlap', layout.topOverlap === 0, String(layout.topOverlap))
  check('the top bar stays inside the screen', layout.hudTop && layout.hudTop.x >= 0 && layout.hudTop.x + layout.hudTop.w <= layout.w, JSON.stringify(layout.hudTop))
  check('the tools stay inside the screen', layout.hudTools && layout.hudTools.x >= 0 && layout.hudTools.x + layout.hudTools.w <= layout.w, JSON.stringify(layout.hudTools))

  const clearBand = layout.command ? layout.command.y - (layout.hudTop.y + layout.hudTop.h) : layout.h
  const clearShare = clearBand / layout.h
  check(
    'the field keeps most of the screen clear',
    clearShare >= 0.55,
    `${clearBand.toFixed(0)} of ${layout.h} px (${(clearShare * 100).toFixed(0)}%)`
  )
  check(
    'the command bar is not taller than a third of the screen',
    layout.command && layout.command.h <= layout.h / 3,
    `${layout.command ? layout.command.h.toFixed(0) : 'none'} px`
  )
  check(
    'the hint does not sit under the safe area',
    !layout.hint || layout.hint.y + layout.hint.h <= layout.h,
    JSON.stringify(layout.hint)
  )

  // At the opening the two armies stand at opposite ends of the field. On a
  // phone the camera zooms out far enough that both are on screen, instead of
  // sitting on the empty ground between them.
  const onScreen = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const list = b.data ? b.data.units.filter((u) => u.alive) : []
      let inside = 0
      for (const u of list) {
        const sx = innerWidth / 2 + (u.x - b.camX) * b.zoom
        const sy = innerHeight / 2 + (u.y - b.camY) * b.zoom
        if (sx > 4 && sx < innerWidth - 4 && sy > 4 && sy < innerHeight - 4) inside += 1
      }
      return { inside, total: list.length, zoom: b.zoom }
    })()
  `)
  check(
    'both armies are on screen at the opening',
    onScreen.total > 0 && onScreen.inside === onScreen.total,
    `${onScreen.inside}/${onScreen.total} at zoom ${onScreen.zoom}`
  )
  const topBarText = await evaluate(`
    (() => {
      const el = document.querySelector('.hud-top')
      return { scroll: el.scrollWidth, client: el.clientWidth }
    })()
  `)
  check('the top bar text is not cut off', topBarText.scroll <= topBarText.client + 1, JSON.stringify(topBarText))

  const targets = await evaluate(`
    (() => {
      const sel = ['.tool', '.chip', '.orders .cmd', '.sheet-toggle']
      const out = []
      for (const s of sel) {
        for (const el of document.querySelectorAll(s)) {
          const r = el.getBoundingClientRect()
          out.push({ s, w: +r.width.toFixed(1), h: +r.height.toFixed(1) })
        }
      }
      return out
    })()
  `)
  const small = targets.filter((t) => t.h < 38 || t.w < 38)
  check('every battle button is thumb sized', small.length === 0, JSON.stringify(small))

  /* ------------------------------ the drag buffer --------------------------- */

  const drag = async (fromX, fromY, toX, toY) => {
    await send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: fromX, y: fromY, id: 1 }]
    })
    for (let i = 1; i <= 8; i += 1) {
      await send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: Math.round(fromX + ((toX - fromX) * i) / 8), y: Math.round(fromY + ((toY - fromY) * i) / 8), id: 1 }]
      })
      await sleep(16)
    }
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await sleep(120)
  }

  const midY = Math.round(layout.h * 0.45)
  const beforeDrag = await evaluate('window.kidsWarGame.stores.battle.camX')
  await drag(Math.round(layout.w / 2), midY, Math.round(layout.w / 2) - 240, midY)
  const afterDrag = await evaluate('window.kidsWarGame.stores.battle.camX')
  check('a finger drag pans the field', afterDrag > beforeDrag, `${beforeDrag.toFixed(0)} -> ${afterDrag.toFixed(0)}`)

  // Drag again and again to the right edge of the field: the camera has to be
  // allowed past the edge, so that a strip of the empty ground around the
  // field shows and the last soldier at the border is not pinned to the side.
  for (let i = 0; i < 4; i += 1) {
    await drag(Math.round(layout.w * 0.75), midY, Math.round(layout.w * 0.15), midY)
  }
  const edge = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const t = b.data.terrain
      const fieldW = t.cols * t.cell
      const halfW = innerWidth / b.zoom / 2
      const edgeX = innerWidth / 2 + (fieldW - b.camX) * b.zoom
      return { camX: b.camX, edgeX, outside: innerWidth - edgeX, halfW, fieldW, zoom: b.zoom }
    })()
  `)
  console.log('edge', JSON.stringify(edge))
  check('the camera stops at the buffer, not in the middle of the field', edge.camX > edge.fieldW - edge.halfW, JSON.stringify(edge))
  check('the drag shows ground past the field edge', edge.outside >= 80, `${edge.outside.toFixed(0)} px of ground`)
  check('the buffer is a strip, not a trip into the void', edge.outside <= 220, `${edge.outside.toFixed(0)} px of ground`)

  // The other side of the field has the same strip.
  for (let i = 0; i < 8; i += 1) {
    await drag(Math.round(layout.w * 0.2), midY, Math.round(layout.w * 0.85), midY)
  }
  const edgeLeft = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const left = b.camX - innerWidth / b.zoom / 2
      return { camX: b.camX, outside: -left }
    })()
  `)
  check('the left edge also shows a strip of ground', edgeLeft.outside >= 80, JSON.stringify(edgeLeft))
  check('the camera follows the fight again on demand', await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      b.recenter()
      return b.follow
    })()
  `), '')
  await sleep(400)
  const followed = await evaluate('window.kidsWarGame.stores.battle.follow')
  check('the camera is still following after the recenter', followed === true, String(followed))

  /* ------------------- the quick battle, same phone screen ------------------ */

  // A quick battle carries the extra 「← 返回」 button, so it is the widest the
  // top-right tools ever get; measure that layout too, or a clipped bar ships.
  await send('Page.navigate', { url: SITE })
  await waitFor("!!document.querySelector('input')", 'the home screen again')
  await clickByText('.actions button', '快速战斗')
  await waitFor("!!document.querySelector('.quick')", 'the quick battle setup')
  await clickByText('button.go', '进入战场')
  await waitFor("!!document.querySelector('canvas.battle-canvas')", 'the quick battle field')
  await sleep(1000)
  const quick = await evaluate(`
    (() => {
      const box = (sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }
      }
      const overlap = (a, b) => {
        if (!a || !b) return 0
        const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
        const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
        return Math.max(0, w) * Math.max(0, h)
      }
      const top = box('.hud-top')
      const tools = box('.hud-tools')
      const el = document.querySelector('.hud-top')
      return {
        top,
        tools,
        overlap: overlap(top, tools),
        clipped: el.scrollWidth > el.clientWidth + 1,
        quit: box('.hud-tools .tool.quit'),
        clear: box('.command') ? box('.command').y - (top.y + top.h) : 0
      }
    })()
  `)
  console.log('quick', JSON.stringify(quick))
  check('a quick battle keeps the top bar and tools apart', quick.overlap === 0, JSON.stringify(quick))
  check('a quick battle does not clip the top bar', quick.clipped === false, JSON.stringify(quick.top))
  check('a quick battle keeps its way out on screen', quick.quit && quick.quit.x >= 0 && quick.quit.x + quick.quit.w <= 390, JSON.stringify(quick.quit))

  check('the console stays clean', consoleErrors.length === 0, consoleErrors.join(' | '))
} catch (err) {
  failed += 1
  console.log('  FAIL the mobile run crashed —', err.message)
} finally {
  cleanup()
  await sleep(300)
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exitCode = failed ? 1 : 0
