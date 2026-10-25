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
import { mkdir, writeFile } from 'node:fs/promises'
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
  const hardNote = await evaluate("document.querySelector('.diff-note') ? document.querySelector('.diff-note').textContent.trim() : ''")
  check('the note follows the picked level', hardNote.includes('挑战') && hardNote.includes('敌军'), hardNote)
  await clickByText('.diff-btn', '简单')
  const easyNote = await evaluate("document.querySelector('.diff-note') ? document.querySelector('.diff-note').textContent.trim() : ''")
  check('the practice note explains the cap', easyNote.includes('封顶'), easyNote)

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
  const sheetText = await evaluate("document.querySelector('.settings') ? document.querySelector('.settings').textContent : ''")
  check('the sheet explains the threat and the costs', sheetText.includes('威胁') && sheetText.includes('军粮') && sheetText.includes('招募价'), sheetText.trim())
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

  // Both generals are on the field with their bodyguards, and the two bars at
  // the top of the screen really read them.
  const generalBars = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const rows = [...document.querySelectorAll('.gen-row .gen')]
      const guardOf = (id) => b.data.units.filter((u) => u.isGuard && u.guardOf === id).length
      return {
        lord: !!b.data.commander,
        enemy: !!b.data.enemyCommander,
        enemyArt: b.data.enemyCommander ? b.data.enemyCommander.sprite : '',
        lordGuards: guardOf('commander'),
        enemyGuards: guardOf('enemy-commander'),
        rows: rows.length,
        bars: rows.map((r) => {
          const fill = r.querySelector('.gen-bar i')
          return { width: fill ? fill.style.width : '', text: r.textContent.trim() }
        })
      }
    })()
  `)
  check('the field carries both generals', generalBars.lord && generalBars.enemy, JSON.stringify(generalBars))
  check('the hostile general wears a faction sprite', ['bandit', 'wolf', 'eagle'].includes(generalBars.enemyArt), generalBars.enemyArt)
  check('each general starts behind a bodyguard', generalBars.lordGuards > 0 && generalBars.enemyGuards > 0, JSON.stringify(generalBars))
  check('the top bar shows the two general bars', generalBars.rows === 2, JSON.stringify(generalBars.bars))
  check(
    'the general bars are filled',
    generalBars.bars.every((bar) => bar.width.endsWith('%') && parseFloat(bar.width) > 0),
    JSON.stringify(generalBars.bars)
  )

  // Keep a picture of the field with both generals and their bars, for a human
  // to look at afterwards.
  {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    const shotFile = path.join(cache, 'battle-generals.png')
    await writeFile(shotFile, Buffer.from(shot.data, 'base64'))
    check('the general screenshot was saved', true, shotFile)
    console.log('\nscreenshot: ' + shotFile)
  }

  // The map opens on a standoff: both sides hold their ground and the banner
  // asks the lord for the order that starts his own advance.
  const opening = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const groups = Object.values(b.data.groups)
      const banner = document.querySelector('.standoff')
      return {
        phase: b.data.opening ? b.data.opening.phase : null,
        playerHolds: b.data.playerGroups.every((k) => b.data.groups[k].order === 'defend'),
        // The bodyguard follows its general, so only the squads are checked.
        enemyHolds: groups.filter((g) => g.side === 'enemy' && !g.isGuard).every((g) => g.order === 'defend'),
        text: banner ? banner.textContent.trim() : '',
        button: banner ? banner.querySelector('button').textContent.trim() : ''
      }
    })()
  `)
  check('the battle opens on a standoff', opening.phase === 'wait', JSON.stringify(opening))
  check('both armies hold at the start', opening.playerHolds && opening.enemyHolds, JSON.stringify(opening))
  check(
    'the standoff banner asks for an order',
    opening.text.includes('对峙') && opening.button.includes('全军出击'),
    JSON.stringify(opening)
  )
  await clickByText('.standoff button', '全军出击')
  await sleep(300)
  const charged = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      return {
        attacks: b.data.playerGroups.every((k) => b.data.groups[k].order === 'attack'),
        phase: b.data.opening ? b.data.opening.phase : null
      }
    })()
  `)
  check('the charge button orders every squad', charged.attacks === true, JSON.stringify(charged))
  check('the charge ends the standoff', charged.phase !== 'wait', JSON.stringify(charged))
  // The banner must really leave the screen, not just the phase machine: the
  // opening lives in raw data, and a banner reading it through another
  // computed would freeze while the fight already moves on.
  await waitFor("!document.querySelector('.standoff')", 'the standoff banner to clear')
  const cleared = await evaluate(`
    (() => {
      const banner = document.querySelector('.standoff')
      const hint = document.querySelector('.hint')
      return { banner: !!banner, hint: hint ? hint.textContent.trim() : '' }
    })()
  `)
  check('the standoff banner clears once the charge starts', cleared.banner === false, JSON.stringify(cleared))
  check('the hint follows the charge', !cleared.hint.includes('对峙'), JSON.stringify(cleared))

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

  // A strike and a wound set the timers the renderer turns into a lean and a
  // shake. Watch a few seconds of the real fight for both to fire.
  const animation = await evaluate(`
    new Promise((resolve) => {
      const b = window.kidsWarGame.stores.battle
      let swing = false
      let flash = false
      const started = performance.now()
      const timer = setInterval(() => {
        const units = (b.data && b.data.units) || []
        if (units.some((u) => u.swing > 0)) swing = true
        if (units.some((u) => u.hitFlash > 0) || (b.data && b.data.commander.hitFlash > 0)) flash = true
        if ((swing && flash) || performance.now() - started > 12000) {
          clearInterval(timer)
          resolve({ swing, flash })
        }
      }, 55)
    })
  `)
  check('a strike and a wound drive the animations', animation.swing && animation.flash, JSON.stringify(animation))

  // The frame rate is on screen: the chip reads a positive number and turns a
  // colour of its own, so a stutter can be judged without the dev tools.
  const fpsChip = await evaluate(`
    (() => {
      const chip = document.querySelector('.fps')
      if (!chip) return null
      return {
        text: chip.textContent.trim(),
        value: Number((chip.querySelector('b') || chip).textContent.trim()),
        tone: ['good', 'ok', 'bad'].find((t) => chip.classList.contains(t)) || null,
        title: chip.getAttribute('title') || ''
      }
    })()
  `)
  check('the battle screen shows the frame rate', !!fpsChip && /\d/.test(fpsChip.text), JSON.stringify(fpsChip))
  check('the frame rate is measured', !!fpsChip && fpsChip.value > 0, JSON.stringify(fpsChip))
  check(
    'the frame rate has a tone and a slowest frame',
    !!fpsChip && !!fpsChip.tone && /ms/.test(fpsChip.title),
    JSON.stringify(fpsChip)
  )

  // The command bar must not lay a dark sheet over the field: only the chips
  // and buttons carry a panel of their own.
  const bar = await evaluate(`
    (() => {
      const c = document.querySelector('.command')
      const chip = document.querySelector('.chip')
      const cmd = document.querySelector('.orders .cmd')
      const own = (el) => {
        if (!el) return null
        const s = getComputedStyle(el)
        return { color: s.backgroundColor, image: s.backgroundImage }
      }
      return { bar: own(c), chip: own(chip), cmd: own(cmd) }
    })()
  `)
  const clear = (s) => !s || s.color === 'rgba(0, 0, 0, 0)' || s.color === 'transparent'
  check('the command bar leaves the field clear', clear(bar.bar) && bar.bar.image === 'none', JSON.stringify(bar))
  const panel = (s) => !clear(s) || (s && s.image !== 'none')
  check(
    'the chips and orders keep their own panel',
    panel(bar.chip) && panel(bar.cmd),
    JSON.stringify(bar)
  )

  // A real drag on the field pans the camera: the pointer handlers, the CSS
  // touch action and the camera all have to line up for this to pass. The
  // drag goes towards the side with room left, because a view wider than the
  // field is already showing the whole field and cannot pan on that axis.
  const fieldBox = await evaluate(`
    (() => {
      const c = document.querySelector('.battle-canvas')
      const r = c.getBoundingClientRect()
      const b = window.kidsWarGame.stores.battle
      const t = b.data ? b.data.terrain : null
      return {
        x: r.x, y: r.y, w: r.width, h: r.height, camX: b.camX, camY: b.camY, zoom: b.zoom,
        fieldW: t ? t.cols * t.cell : 0, fieldH: t ? t.rows * t.cell : 0
      }
    })()
  `)
  const grabX = Math.round(fieldBox.x + fieldBox.w * 0.35)
  const grabY = Math.round(fieldBox.y + fieldBox.h * 0.45)
  const roomOf = (cam, size, view, zoom) => {
    const half = view / zoom / 2
    return { low: cam - half, high: size - half - cam }
  }
  const hRoom = roomOf(fieldBox.camX, fieldBox.fieldW, fieldBox.w, fieldBox.zoom)
  const vRoom = roomOf(fieldBox.camY, fieldBox.fieldH, fieldBox.h, fieldBox.zoom)
  const dx = hRoom.high >= hRoom.low ? -60 : 60
  const dy = vRoom.high >= vRoom.low ? -60 : 60

  const dragMouse = async () => {
    await evaluate('window.kidsWarGame.stores.battle.recenter(); true')
    await sleep(150)
    const before = await evaluate(`
      (() => {
        const b = window.kidsWarGame.stores.battle
        return {
          x: b.camX,
          y: b.camY,
          follow: b.follow,
          zoom: b.zoom,
          tx: b.data ? b.data.commander.tx : -1,
          ty: b.data ? b.data.commander.ty : -1
        }
      })()
    `)
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: grabX, y: grabY, button: 'left', buttons: 1, clickCount: 1
    })
    for (let i = 1; i <= 6; i += 1) {
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: grabX + Math.round((dx * i) / 6),
        y: grabY + Math.round((dy * i) / 6),
        button: 'left',
        buttons: 1
      })
      await sleep(20)
    }
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: grabX + dx, y: grabY + dy, button: 'left', buttons: 0, clickCount: 1
    })
    await sleep(150)
    const after = await evaluate(`
      (() => {
        const b = window.kidsWarGame.stores.battle
        return {
          x: b.camX,
          y: b.camY,
          follow: b.follow,
          tx: b.data ? b.data.commander.tx : -1,
          ty: b.data ? b.data.commander.ty : -1
        }
      })()
    `)
    return { before, after, dx, dy, hRoom, vRoom }
  }

  const mouse = await dragMouse()
  check('a mouse drag stops the auto follow', mouse.after.follow === false, JSON.stringify(mouse))
  check(
    'a mouse drag pans the field',
    mouse.after.x !== mouse.before.x || mouse.after.y !== mouse.before.y,
    JSON.stringify(mouse)
  )
  check(
    'a drag does not tap the field',
    mouse.after.tx === mouse.before.tx && mouse.after.ty === mouse.before.ty,
    JSON.stringify(mouse)
  )

  // The same handlers serve a finger: touch emulation makes Chrome send touch
  // pointers, which is what a phone in the field would send.
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  const beforeTouch = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      b.recenter()
      return { follow: b.follow }
    })()
  `)
  await sleep(150)
  const touchStart = [{ x: grabX, y: grabY, id: 1 }]
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touchStart })
  for (let i = 1; i <= 6; i += 1) {
    await send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: grabX + Math.round((dx * i) / 6), y: grabY + Math.round((dy * i) / 6), id: 1 }]
    })
    await sleep(20)
  }
  await send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  })
  await sleep(150)
  const touch = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      return { x: b.camX, y: b.camY, follow: b.follow }
    })()
  `)
  await send('Emulation.setTouchEmulationEnabled', { enabled: false })
  check('a touch drag stops the auto follow', touch.follow === false, JSON.stringify({ beforeTouch, touch }))
  check(
    'a touch drag pans the field',
    touch.x !== mouse.after.x || touch.y !== mouse.after.y,
    JSON.stringify({ mouse, touch })
  )

  // The recenter button follows the fight again, and a tap still places a flag
  // when the finger did not drag.
  await clickByText('.tool', '🎯')
  await sleep(200)
  const recentered = await evaluate('window.kidsWarGame.stores.battle.follow')
  check('the recenter button follows the fight again', recentered === true, JSON.stringify({ recentered }))

  const tapX = Math.round(fieldBox.x + fieldBox.w * 0.62)
  const tapY = Math.round(fieldBox.y + fieldBox.h * 0.3)
  const beforeTap = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      return { tx: b.data.commander.tx, ty: b.data.commander.ty }
    })()
  `)
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: tapX, y: tapY, button: 'left', buttons: 1, clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tapX, y: tapY, button: 'left', buttons: 0, clickCount: 1 })
  await sleep(200)
  const tap = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      return { tx: b.data.commander.tx, ty: b.data.commander.ty }
    })()
  `)
  check(
    'a tap without a drag still moves the commander',
    tap.tx !== beforeTap.tx || tap.ty !== beforeTap.ty,
    JSON.stringify({ beforeTap, tap })
  )

  // A back step is what a phone's edge swipe sends. The fight is a commitment,
  // so it is refused and the screen says why.
  const routeBefore = await evaluate('location.pathname')
  await evaluate('history.back(); true')
  await sleep(600)
  const guarded = await evaluate(`
    (() => ({
      path: location.pathname,
      active: window.kidsWarGame.stores.battle.active,
      hint: document.querySelector('.leave-hint') ? document.querySelector('.leave-hint').textContent.trim() : ''
    }))()
  `)
  check(
    'a back step does not leave the running battle',
    guarded.active === true && guarded.path === routeBefore,
    JSON.stringify({ routeBefore, guarded })
  )
  check('a refused back step says why', guarded.hint.length > 0, JSON.stringify(guarded))

  /* ------------------ 4. a general going down ends the fight ----------------- */
  // The whole way back: a general falls, the fight is settled, and both armies
  // turn up on the world map around the field they just fought over.
  console.log('the way back to the map')
  await loadScenario('bandit')
  const fieldTile = await evaluate('({ ...window.kidsWarGame.stores.world.playerPos })')
  await clickByText('.hud-bottom button', '赶走强盗')
  await waitFor("!!document.querySelector('canvas.battle-canvas')", 'a fresh battle')
  await sleep(500)
  // Expose the hostile general: his bodyguard falls and the lord is put right
  // in front of him, so the next swing ends the fight.
  const exposed = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const g = b.data.enemyCommander
      b.speed = 'fast'
      b.data.units.filter((u) => u.isGuard && u.guardOf === g.id).forEach((u) => { u.alive = false })
      g.hp = 1
      g.x = b.data.commander.x + 24
      g.y = b.data.commander.y
      g.tx = g.x
      g.ty = g.y
      return { guards: b.data.units.filter((u) => u.isGuard && u.guardOf === g.id && u.alive).length, hp: g.hp }
    })()
  `)
  check('the hostile general can be exposed', exposed.guards === 0 && exposed.hp === 1, JSON.stringify(exposed))
  await waitFor("!!document.querySelector('.overlay .result')", 'the result of a general going down', 40000)
  const downed = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const w = window.kidsWarGame.stores.world
      const result = b.result || {}
      return {
        outcome: b.data ? b.data.outcome : null,
        settled: b.settled,
        generalDown: !!result.generalDown,
        lordDown: !!result.lordDown,
        relocated: !!result.relocated,
        halfLost: result.halfLost || 0,
        heading: document.querySelector('.result h2') ? document.querySelector('.result h2').textContent.trim() : '',
        text: document.querySelector('.result') ? document.querySelector('.result').textContent : '',
        lastReturn: w.lastReturn,
        parties: w.parties.length,
        pos: { ...w.playerPos },
        troops: window.kidsWarGame.stores.player.totalTroops
      }
    })()
  `)
  check('the battle ends with the hostile general down', downed.outcome === 'general' && downed.generalDown, JSON.stringify(downed))
  check('the result screen names his fall', downed.heading.includes('敌将倒下'), JSON.stringify(downed.heading))
  check('the result screen says both sides went back to the field', downed.text.includes('战场周围'), downed.text.slice(0, 120))
  check('the lord paid nothing for it', downed.lordDown === false && downed.halfLost === 0, JSON.stringify(downed))
  check('he is put back beside the field', downed.relocated === true && downed.lastReturn === 'enemy', JSON.stringify(downed))
  check('the enemy warband is still on the map', downed.parties > 0, String(downed.parties))
  const backDistance = Math.hypot(downed.pos.x - fieldTile.x, downed.pos.y - fieldTile.y)
  check('the lord does not cross the world to get there', backDistance <= 8.5, String(backDistance.toFixed(2)))

  await clickByText('.result button', '返回世界地图')
  await waitFor("!!document.querySelector('.hud-bottom')", 'the world map after the battle')
  await sleep(400)
  const backHome = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const toast = document.querySelector('.toast')
      return {
        pos: { ...w.playerPos },
        parties: w.parties.length,
        lastReturn: w.lastReturn,
        toast: toast ? toast.textContent.trim() : '',
        // The app routes on the hash, so the path alone says nothing.
        route: location.hash || location.pathname
      }
    })()
  `)
  check('the result screen leads back to the world map', backHome.route.includes('/world'), backHome.route)
  check('the map says the hostile general went down', backHome.toast.includes('敌将') || backHome.toast.includes('退回战场'), backHome.toast)
  check('the note is read only once', backHome.lastReturn === null, String(backHome.lastReturn))
  const homeDistance = Math.hypot(backHome.pos.x - fieldTile.x, backHome.pos.y - fieldTile.y)
  check('he is standing beside the field, not in a town', homeDistance <= 8.5, String(homeDistance.toFixed(2)))
  check('the enemy is still there to be chased', backHome.parties > 0, String(backHome.parties))

  /* --------------------- 5. the last stand of a lone lord ------------------- */
  // The warband is wiped out to the last soldier: the lord holds the field on
  // his own, the screen says so, and 撤退 takes him home without another loss.
  console.log('the last stand')
  await loadScenario('bandit')
  const standField = await evaluate('({ ...window.kidsWarGame.stores.world.playerPos })')
  await clickByText('.hud-bottom button', '赶走强盗')
  await waitFor("!!document.querySelector('canvas.battle-canvas')", 'a battle for the last stand')
  await sleep(500)
  const wiped = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      b.data.units.filter((u) => u.side === 'player').forEach((u) => { u.alive = false })
      return { playerUnits: b.data.units.filter((u) => u.side === 'player' && u.alive).length }
    })()
  `)
  check('the warband can be wiped out on the field', wiped.playerUnits === 0, JSON.stringify(wiped))
  await waitFor("!!document.querySelector('.last-stand')", 'the last stand banner')
  const stand = await evaluate(`
    (() => {
      const el = document.querySelector('.last-stand')
      const b = window.kidsWarGame.stores.battle
      const button = el.querySelector('.ls-btn')
      return {
        text: el.textContent,
        mine: el.classList.contains('mine'),
        barWidth: el.querySelector('.ls-bar i') ? el.querySelector('.ls-bar i').style.width : '',
        button: button ? button.textContent.trim() : '',
        side: b.data.lastStand ? b.data.lastStand.side : null,
        outcome: b.data.outcome,
        lordHp: b.data.commander.hp
      }
    })()
  `)
  check('the battle does not end when the soldiers are gone', stand.side === 'player' && stand.outcome === null, JSON.stringify(stand))
  check('the screen says the lord stands alone', stand.mine && stand.text.includes('只剩主将'), stand.text)
  check('the last stand has a clock', stand.barWidth.endsWith('%'), stand.barWidth)
  check('the last stand offers a way home', stand.button.includes('撤退'), stand.button)

  // Keep a picture of the countdown for a human to look at afterwards.
  {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    const shotFile = path.join(cache, 'battle-last-stand.png')
    await writeFile(shotFile, Buffer.from(shot.data, 'base64'))
    check('the last stand screenshot was saved', true, shotFile)
    console.log('\nscreenshot: ' + shotFile)
  }

  await clickByText('.last-stand .ls-btn', '撤退')
  await waitFor("!!document.querySelector('.overlay .result')", 'the result of a retreat')
  const retreat = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const r = b.result || {}
      return {
        outcome: b.data ? b.data.outcome : null,
        withdrew: !!r.withdrew,
        halfLost: r.halfLost || 0,
        lordDown: !!r.lordDown,
        relocated: !!r.relocated,
        troops: window.kidsWarGame.stores.player.totalTroops,
        text: document.querySelector('.result') ? document.querySelector('.result').textContent : ''
      }
    })()
  `)
  check('the retreat is settled as a defeat', retreat.outcome === 'lose' && retreat.withdrew === true, JSON.stringify(retreat))
  check('the retreat costs him no second army', retreat.halfLost === 0 && retreat.lordDown === false, JSON.stringify(retreat))
  check('the result screen explains the retreat', retreat.text.includes('主将退出战场'), retreat.text.slice(0, 120))
  check('he still has a handful of wounded at most', retreat.troops <= 4, String(retreat.troops))

  await clickByText('.result button', '返回世界地图')
  await waitFor("!!document.querySelector('.hud-bottom')", 'the world map after the retreat')
  await sleep(400)
  const afterRetreat = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const toast = document.querySelector('.toast')
      return { pos: { ...w.playerPos }, toast: toast ? toast.textContent.trim() : '', parties: w.parties.length }
    })()
  `)
  check('the map says he walked away', afterRetreat.toast.includes('退出'), afterRetreat.toast)
  const retreatDistance = Math.hypot(afterRetreat.pos.x - standField.x, afterRetreat.pos.y - standField.y)
  check('he is put down beside the field', retreatDistance <= 8.5, String(retreatDistance.toFixed(2)))
  check('the enemy is still on the map', afterRetreat.parties > 0, String(afterRetreat.parties))

  check('the console stays clean', consoleErrors.length === 0, consoleErrors.join(' | '))
} catch (err) {
  failed += 1
  console.log(`  FAIL the browser pass — ${err.message}`)
} finally {
  cleanup()
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
