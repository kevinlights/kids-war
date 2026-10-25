/**
 * Browser check for the two optimisations of the world-map HUD:
 *
 *   1. every companion sprite on the detailed atlas carries his troop badge in
 *      the top-right corner — the same badge the lord and the warbands wear;
 *   2. every button above the world map (the top-bar chips, the minimap, the
 *      legend and its toggle) shares one black-transparent background.
 *
 * It boots the real app with two companions riding along (one leading three
 * militia, one with no soldiers yet), screenshots the world map and the open
 * atlas, samples the atlas canvas where the badge must be, and reads the
 * computed styles of every control above the map — hover included.
 *
 * Usage: node tools/verify-companions-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4192'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9349)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const SEED = 20261025

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
    // The GPU process is not available on a headless box (and can fall over on
    // a busy desktop): the game only needs the 2D canvas, so software rendering
    // is enough.
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(cache, 'chrome-profile-companions')}`,
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

const shotDir = path.join(root, 'dist', 'companion-check')
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

  await send('Page.enable')
  await send('Runtime.enable')

  // Drop the lord straight into the world with two companions riding along:
  // one leads three militia, the other has no soldiers yet.
  await send('Page.navigate', { url: SITE })
  await waitFor("!!document.querySelector('input')", 'the home screen')
  await evaluate(`
    (() => {
      const { player, world } = window.kidsWarGame.stores
      player.reset('tester', 'normal')
      world.generate(${SEED})
      player.companions.push(
        {
          id: 'npc-a', npcId: 'npc-a', name: '赵铁柱', role: 'guard', sprite: 'npc-guard',
          soldiers: [{ type: 'militia', tier: 1, count: 3, hp: [30, 30, 30] }]
        },
        {
          id: 'npc-b', npcId: 'npc-b', name: '林小猎', role: 'hunter', sprite: 'npc-hunter',
          soldiers: []
        }
      )
      location.hash = '#/world'
      return player.companions.length
    })()
  `)
  await waitFor("!!document.querySelector('.hud-bottom')", 'the world map')
  await sleep(900) // let the sprites load and a few frames paint

  // The world map itself: the HUD the child sees.
  const worldShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  const worldShotFile = path.join(shotDir, 'world-hud.png')
  await writeFile(worldShotFile, Buffer.from(worldShot.data, 'base64'))
  check('the world map screenshot was saved', true, worldShotFile)

  /* --------------------- 1. the black glass above the map -------------------- */

  // Every control that sits above the world map must wear the same translucent
  // black: the chips and buttons of the top bar, the minimap button, the legend
  // and the legend's own toggle. Text colours are free to differ.
  const styles = await evaluate(`
    (() => {
      const read = (el) => {
        const s = getComputedStyle(el)
        return { bg: s.backgroundColor, border: s.borderTopColor, image: s.backgroundImage }
      }
      const out = {}
      const chip = document.querySelector('.hud-top .chip')
      out.chip = chip ? read(chip) : null
      const roleBtn = document.querySelector('.hud-top .role-btn')
      out.roleBtn = roleBtn ? read(roleBtn) : null
      const mini = document.querySelector('button.minimap')
      out.minimap = mini ? read(mini) : null
      const legend = document.querySelector('.legend')
      out.legend = legend ? read(legend) : null
      const legendBtn = document.querySelector('.legend .mini')
      out.legendBtn = legendBtn ? read(legendBtn) : null
      return out
    })()
  `)
  // " translucent black" = every channel low and the alpha below one.
  const isBlackGlass = (bg) => {
    const s = String(bg || '')
    const open = s.indexOf('(')
    const close = s.indexOf(')')
    if (!s.startsWith('rgb') || open < 0 || close < 0) return false
    const parts = s.slice(open + 1, close).split(',').map((n) => Number(n.trim()))
    const [r, g, b] = parts
    const a = parts.length > 3 ? parts[3] : 1
    return r <= 24 && g <= 24 && b <= 24 && a > 0 && a < 1
  }
  check('the top-bar chip is black glass', isBlackGlass(styles.chip?.bg), JSON.stringify(styles.chip))
  check('a top-bar button is black glass', isBlackGlass(styles.roleBtn?.bg), JSON.stringify(styles.roleBtn))
  check('the minimap button is black glass', isBlackGlass(styles.minimap?.bg), JSON.stringify(styles.minimap))
  check('the legend is black glass', isBlackGlass(styles.legend?.bg), JSON.stringify(styles.legend))
  check(
    'the legend toggle is black glass',
    isBlackGlass(styles.legendBtn?.bg),
    JSON.stringify(styles.legendBtn)
  )
  check(
    'no control above the map keeps a gold panel fill',
    [styles.chip, styles.roleBtn, styles.minimap, styles.legend, styles.legendBtn].every(
      (s) => s && !s.bg.includes('232, 197, 106') && !s.border.includes('232, 197, 106')
    )
  )

  // The hover of a top-bar button deepens the same black glass — it must never
  // flash a white or gold background.
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 120, y: 60 })
  const hovered = await evaluate(`
    (() => {
      const btn = document.querySelector('.hud-top button')
      if (!btn) return null
      const r = btn.getBoundingClientRect()
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
    })()
  `)
  if (hovered) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hovered.x, y: hovered.y })
    await sleep(150)
    const hoverBg = await evaluate(`
      getComputedStyle(document.querySelector('.hud-top button')).backgroundColor
    `)
    check('a top-bar button hovers on black glass', isBlackGlass(hoverBg), String(hoverBg))
  } else {
    check('a top-bar button hovers on black glass', false, 'no button found')
  }

  /* ------------------- 2. the companion badge on the atlas ------------------- */

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
  await sleep(700) // let a few frames paint the world, the train and the badges

  const atlasShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  const atlasShotFile = path.join(shotDir, 'atlas-companions.png')
  await writeFile(atlasShotFile, Buffer.from(atlasShot.data, 'base64'))
  check('the atlas screenshot was saved', true, atlasShotFile)

  // The atlas opens centred on the lord, so a companion's badge sits at a known
  // spot: the slot followerTargets gives him, plus the badge offset the atlas
  // painter uses. Sample that spot on the real canvas for the dark disc and the
  // white digit of the badge.
  const badge = await evaluate(`
    (() => {
      const stores = window.kidsWarGame.stores
      const world = stores.world
      const player = stores.player
      const canvas = document.querySelector('canvas.atlas-canvas')
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const dpr = canvas.width / rect.width
      const ctx = canvas.getContext('2d')
      const S = 16
      // The slot of companion i, the same layout followers.js computes.
      const dir = { x: 0, y: 1 }
      const behind = { x: -dir.x, y: -dir.y }
      const side = { x: -dir.y, y: dir.x }
      const slotOf = (i) => {
        const row = Math.floor(i / 2)
        const rowIndex = Math.min(row, 3)
        const spread = 0.58 + 0.26 * rowIndex
        const lateral = (i % 2 === 0 ? -1 : 1) * spread
        const depth = 0.98 + 0.46 * rowIndex
        const extra = row > 3 ? (row - 3) * 0.18 : 0
        return {
          x: world.playerPos.x + behind.x * (depth + extra) + side.x * lateral,
          y: world.playerPos.y + behind.y * (depth + extra) + side.y * lateral
        }
      }
      const sample = (cx, cy, label) => {
        const bx = Math.round((rect.width / 2 + (cx - world.playerPos.x) * S + S * 0.55) * dpr)
        const by = Math.round((rect.height / 2 + (cy - world.playerPos.y) * S - S * 0.55) * dpr)
        const box = 9 * dpr
        const data = ctx.getImageData(bx - box, by - box, box * 2, box * 2).data
        let dark = 0
        let white = 0
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          if (r < 70 && g < 70 && b < 70) dark += 1
          if (r > 200 && g > 200 && b > 200) white += 1
        }
        return { label, dark, white }
      }
      const out = []
      player.companions.forEach((c, i) => {
        const s = slotOf(i)
        out.push({ ...sample(s.x, s.y, c.name), soldiers: (c.soldiers || []).reduce((n, g) => n + g.count, 0) })
      })
      return out
    })()
  `)
  check('the atlas canvas was sampled', Array.isArray(badge) && badge.length === 2, JSON.stringify(badge))
  if (Array.isArray(badge)) {
    const withTroops = badge.find((b) => b.soldiers > 0)
    const withoutTroops = badge.find((b) => b.soldiers === 0)
    check(
      'the companion with soldiers carries his badge on the atlas',
      !!withTroops && withTroops.dark >= 60 && withTroops.white >= 4,
      JSON.stringify(withTroops)
    )
    check(
      'the soldier-less companion stays unbaded',
      !!withoutTroops && withoutTroops.dark < 60,
      JSON.stringify(withoutTroops)
    )
  }

  check('the console is clean', consoleErrors.length === 0, JSON.stringify(consoleErrors.slice(0, 3)))

  console.log(`\nscreenshots: ${worldShotFile} , ${atlasShotFile}`)
} finally {
  cleanup()
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
