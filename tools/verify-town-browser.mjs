/**
 * Browser check for the town scene.
 *
 * It boots the real app, drops the lord inside a town, then drives the scene the
 * way a child does: taps a house door, taps a townsperson, finishes the quest
 * and hires the NPC, then hands him a soldier. Along the way it samples the
 * canvas to prove the scene is really painted and saves screenshots.
 *
 * Usage: node tools/verify-town-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4191'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9338)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const SEED = 20261025
const TILE = 32

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
const sceneOut = path.join(cache, 'town-scene.mjs')
await build({
  entryPoints: [path.join(root, 'tools', 'town-scene.entry.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: sceneOut,
  alias: { '@': path.join(root, 'src') },
  logLevel: 'warning'
})
const { sceneInfo } = await import(pathToFileURL(sceneOut).href)
const scene = sceneInfo(SEED, 'town', 0)

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
    // The GPU process is not available on a headless CI box (and can fall over
    // on a busy desktop): the game only needs the 2D canvas, so software
    // rendering is enough.
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(cache, 'chrome-profile-town')}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,1100',
    'about:blank'
  ],
  { stdio: 'ignore' }
)
const cleanup = () => {
  site.kill()
  chrome.kill()
}
process.on('exit', cleanup)

const shotDir = path.join(root, 'dist', 'town-check')
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
  const waitFor = async (expression, label, timeout = 20000) => {
    const started = Date.now()
    while (Date.now() - started < timeout) {
      try {
        if (await evaluate(expression)) return true
      } catch {
        /* page may still be swapping documents */
      }
      await sleep(150)
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
  // A real mouse press and release on the canvas: the scene listens for clicks.
  const tapCanvas = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  }
  const screenshot = async (name) => {
    const res = await send('Page.captureScreenshot', { format: 'png' })
    const { writeFile } = await import('node:fs/promises')
    await writeFile(path.join(shotDir, `${name}.png`), Buffer.from(res.data, 'base64'))
  }

  await send('Page.enable')
  await send('Runtime.enable')

  await send('Page.navigate', { url: SITE })
  await waitFor("!!document.querySelector('input')", 'the home screen')

  // Drop the lord straight into the first town of a known world.
  await evaluate(`
    (() => {
      const { player, world } = window.kidsWarGame.stores
      player.reset('tester', 'normal')
      world.generate(${SEED})
      player.gold = 900
      const town = world.settlements.find((s) => s.kind === 'town')
      window.__town = town.id
      location.hash = '#/town?id=' + town.id
      return town.id
    })()
  `)
  await waitFor("!!document.querySelector('canvas.town-canvas')", 'the town canvas')
  await sleep(1200)

  // The camera is either centred (the scene fits the screen) or parked on the
  // lord (it does not). The same maths the component uses gives the screen
  // position of any tile, on both axes, whichever of the two applies.
  const geom = await evaluate(`
    (() => {
      const c = document.querySelector('canvas.town-canvas')
      const r = c.getBoundingClientRect()
      const sceneW = ${scene.w} * ${TILE}
      const sceneH = ${scene.h} * ${TILE}
      const park = (size, view, at) =>
        size <= view ? (size - view) / 2 : Math.max(0, Math.min(size - view, at * ${TILE} + ${TILE} / 2 - view / 2))
      return {
        w: r.width,
        h: r.height,
        camX: park(sceneW, r.width, ${scene.spawn.x}),
        camY: park(sceneH, r.height, ${scene.spawn.y}),
        sceneW,
        sceneH
      }
    })()
  `)
  // The canvas draws a tile at `tile * TILE - cam`, so the screen position of a
  // tile is the mirrored arithmetic: a negative camera pushes the scene right.
  const toScreen = (tx, ty) => ({
    x: (tx + 0.5) * TILE - geom.camX,
    y: (ty + 0.5) * TILE - geom.camY
  })

  check('the canvas fills the window', geom.w > 600 && geom.h > 400, `${geom.w}x${geom.h}`)
  // With a window big enough for the whole scene, both axes are centred and the
  // tile-to-screen maths below is exact.
  check(
    'the whole scene fits the window and is centred',
    geom.camX < 0 && geom.camY < 0,
    `${geom.w}x${geom.h} cam ${geom.camX},${geom.camY}`
  )

  // Is anything painted at all? A handful of ground samples must not be one
  // flat colour, which is what a blank canvas would give.
  const painted = await evaluate(`
    (() => {
      const c = document.querySelector('canvas.town-canvas')
      const ctx = c.getContext('2d')
      const d = ctx.getImageData(0, 0, c.width, c.height).data
      const seen = new Set()
      for (let i = 0; i < d.length; i += 4 * 977) {
        seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2])
      }
      return seen.size
    })()
  `)
  check('the scene is actually painted', painted > 12, `${painted} colours sampled`)

  // The scene draws its art on the canvas, so there is no <img> to look at: the
  // manifest is the list the game itself loads every sprite from.
  const atlas = await evaluate(`
    fetch('/pixel/index.json').then((r) => r.json()).then((rows) => ({
      total: rows.length,
      town: rows.filter((r) => ['ground', 'town', 'prop', 'npc'].includes(r.category)).length
    })).catch(() => ({ total: 0, town: 0 }))
  `)
  check('the pixel manifest is served', atlas.total >= 50, `${atlas.total} rows`)
  check('the manifest lists the town art', atlas.town >= 35, `${atlas.town} town sprites`)

  // No sprite request may 404: the manifest and the files on disk must agree.
  const missing = await evaluate(`
    (async () => {
      const paths = ['ground/grass', 'town/hall', 'town/shop', 'prop/tree', 'npc/guard']
      const bad = []
      for (const p of paths) {
        const r = await fetch('/pixel/' + p + '.png')
        if (!r.ok) bad.push(p)
      }
      return bad
    })()
  `)
  check('the town sprites are served from disk', missing.length === 0, missing.join(','))

  await screenshot('01-town')

  // --- a building ----------------------------------------------------------
  // Pick a building in the lower half so the top bar never covers the tap.
  const building = [...scene.buildings].filter((b) => b.y >= 16).sort((a, b) => b.y - a.y)[0] || scene.buildings[0]
  const doorPoint = toScreen(building.door.x, building.door.y)
  await tapCanvas(doorPoint.x, doorPoint.y)
  let opened = true
  try {
    await waitFor("!!document.querySelector('.sheet')", 'the building sheet', 12000)
  } catch {
    opened = false
  }
  check(`tapping the ${building.name} walks there and opens it`, opened)
  if (opened) {
    const title = await evaluate("document.querySelector('.sheet-head h2')?.textContent || ''")
    check('the sheet names the building', title.includes(building.name), title)
    await screenshot('02-building')
    await evaluate("document.querySelector('.sheet-head .btn.ghost')?.click()")
    await sleep(300)
  }

  // --- a townsperson -------------------------------------------------------
  // The townsfolk wander around their doorsteps, so the tap is tried a few
  // times around where the scene put them: the first one that opens a
  // conversation with a recruitable NPC is the one the test talks to.
  // The townsfolk wander around their doorsteps, so the tap is tried on the one
  // nearest the lord — the walking distance decides how long the dialog takes —
  // and a few offsets around him cover the drift.
  const lastDoor = opened ? building.door : scene.spawn
  const followerLine = scene.npcs
    .filter((n) => n.follower)
    .sort((a, b) => Math.hypot(a.x - lastDoor.x, a.y - lastDoor.y) - Math.hypot(b.x - lastDoor.x, b.y - lastDoor.y))
  let talking = false
  let who = null
  const offsets = [
    [0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7],
    [1.3, 0], [-1.3, 0], [0, 1.3], [0.9, 0.9], [-0.9, -0.9]
  ]
  for (const npc of followerLine) {
    if (talking) break
    for (const [dx, dy] of offsets) {
      const point = toScreen(npc.x + dx, npc.y + dy)
      if (point.y < 40 || point.y > geom.h - 120) continue
      await tapCanvas(point.x, point.y)
      try {
        // The lord may have to cross the whole square: give the walk its time.
        await waitFor("!!document.querySelector('.npc-card')", 'the NPC dialog', 9000)
        const shown = await evaluate("document.querySelector('.npc-card .name-row h2')?.textContent || ''")
        const match = scene.npcs.find((n) => shown.includes(n.name))
        if (match && match.follower) {
          talking = true
          who = match
          break
        }
        // Somebody else answered: close and keep looking.
        await evaluate("document.querySelector('.npc-card .close')?.click()")
        await sleep(200)
      } catch {
        /* nothing opened there, try the next spot */
      }
    }
  }
  check('tapping a townsperson opens the conversation', talking, who ? who.name : 'none')
  if (talking) {
    const shown = await evaluate("document.querySelector('.npc-card .name-row h2')?.textContent || ''")
    check('the dialog shows who the lord is talking to', shown.includes(who.name), shown)
    check('the dialog shows the quest', !!(await evaluate("!!document.querySelector('.npc-card .quest .bar')")))
    check(
      'the quest starts at the bottom',
      (await evaluate("document.querySelector('.npc-card .quest .chip')?.textContent || ''")).trim().startsWith('0')
    )
    await screenshot('03-npc')

    // The job has to be taken before it counts: there is an explicit button for
    // it, and progress only starts once it is pressed.
    const acceptBtn = await evaluate("!!document.querySelector('.npc-card .btn.accept')")
    check('an unaccepted job offers 「接受委托」', acceptBtn)
    await evaluate("document.querySelector('.npc-card .btn.accept')?.click()")
    await sleep(500)
    check('accepting the job marks it as taken', !!(await evaluate("!!document.querySelector('.npc-card .chip.accepted')")))
    check(
      'the accepted job shows up in the log',
      (await evaluate('window.kidsWarGame.stores.player.allQuests.length')) >= 1
    )
    await screenshot('03b-accepted')

    // Finish the quest the way the game measures it: do what it asks for.
    const before = await evaluate('window.kidsWarGame.stores.player.companions.length')
    await evaluate(`
      (() => {
        const p = window.kidsWarGame.stores.player
        p.stats.correct += 60
        p.stats.wins += 8
        p.stats.recruited += 40
        p.gold = 900
        return true
      })()
    `)
    await sleep(400)
    const hireDisabled = await evaluate("document.querySelector('.npc-card .btn.hire')?.disabled ?? true")
    check('finishing the quest enables the hire button', hireDisabled === false)
    await screenshot('04-quest-done')
    await evaluate("document.querySelector('.npc-card .btn.hire')?.click()")
    await sleep(600)
    const after = await evaluate('window.kidsWarGame.stores.player.companions.length')
    check('the NPC joins the party', after === before + 1, `${before} -> ${after}`)
    await evaluate("document.querySelector('.npc-card .close')?.click()")
    await sleep(300)
  }

  // --- the companions ------------------------------------------------------
  const openedComp = await clickByText('.hud-bottom button', '随从')
  check('the companion button opens the panel', openedComp)
  let compOpen = true
  try {
    await waitFor("!!document.querySelector('.comp-card')", 'the companion panel', 6000)
  } catch {
    compOpen = false
  }
  check('the companion panel renders', compOpen)
  if (compOpen) {
    await screenshot('05-companions')
    const gave = await clickByText('.comp-card button', '给他')
    check('a soldier can be handed to a companion', gave)
    await sleep(400)
    const carried = await evaluate(`
      (() => {
        const c = window.kidsWarGame.stores.player.companions[0]
        return c ? c.soldiers.reduce((n, g) => n + g.count, 0) : 0
      })()
    `)
    check('the companion now leads a soldier', carried === 1, `${carried}`)
    const badge = await evaluate("document.querySelector('.comp-card .portrait-badge')?.textContent?.trim() || ''")
    check('his portrait carries the troop count', badge === String(carried), `${badge}`)
    await screenshot('06-companion-soldier')
    await evaluate("document.querySelector('.comp-card .head .btn.ghost')?.click()")
    await sleep(300)
  }


  // Close the log: the map is what the next check looks at.
  await evaluate("document.querySelector('.quest-card .head .btn.ghost')?.click()")
  await sleep(300)

  // --- the town still runs -------------------------------------------------
  const clockA = await evaluate('window.kidsWarGame.stores.world.day * 1000 + window.kidsWarGame.stores.world.timeAcc')
  await sleep(1500)
  const clockB = await evaluate('window.kidsWarGame.stores.world.day * 1000 + window.kidsWarGame.stores.world.timeAcc')
  check('the town clock keeps running while the lord stands in it', clockB > clockA, `${clockA.toFixed(2)} -> ${clockB.toFixed(2)}`)

  // --- the quest log -------------------------------------------------------
  // The log is the entry the game was missing: every accepted job, from the
  // town screen and from the world map.
  const openedLog = await clickByText('.hud-bottom button', '委托')
  check('the town screen has a quest log entry', openedLog)
  let logOpen = true
  try {
    await waitFor("!!document.querySelector('.quest-card')", 'the quest log', 6000)
  } catch {
    logOpen = false
  }
  check('the quest log renders', logOpen)
  if (logOpen) {
    const rows = await evaluate("document.querySelectorAll('.quest-card .row').length")
    check('the log lists the accepted job', rows >= 1, `${rows}`)
    const finished = await evaluate("!!document.querySelector('.quest-card .row.done')")
    check('the finished job is marked done in the log', finished)
    await screenshot('07-quest-log')
    await evaluate("document.querySelector('.quest-card .head .btn.ghost')?.click()")
    await sleep(300)
  }

  // The world map is where a child spends most of the time: the same log is one
  // tap away up there.
  await evaluate("location.hash = '#/world'")
  await waitFor("!!document.querySelector('.quest-chip')", 'the world map', 8000)
  await sleep(500)
  // The whole top bar is one strip: every control shares the same black glass,
  // so no chip is tinted differently from its neighbours.
  const bar = await evaluate(`
    (() => {
      const nodes = [...document.querySelectorAll('.hud-top > .chip, .hud-top > .day-clock')]
      const styles = nodes.map((n) => {
        const cs = getComputedStyle(n)
        return { bg: cs.backgroundColor, border: cs.borderTopColor, radius: cs.borderRadius }
      })
      const same = styles.every((s) => s.bg === styles[0].bg && s.border === styles[0].border)
      return { count: styles.length, same, bg: styles[0]?.bg, border: styles[0]?.border }
    })()
  `)
  check('the top bar has several controls', bar.count >= 5, `${bar.count}`)
  check('every top-bar control is the same black glass', bar.same, `${bar.bg} / ${bar.border}`)
  check(
    'the glass is a translucent black',
    /rgba\(8, 12, 8, 0\.55\)|rgba\(8,12,8,0\.55\)/.test(bar.bg),
    bar.bg
  )

  const worldLog = await evaluate("!!document.querySelector('.quest-chip')")
  check('the world map carries the quest chip', worldLog)
  if (worldLog) {
    await evaluate("document.querySelector('.quest-chip').click()")
    let worldLogOpen = true
    try {
      await waitFor("!!document.querySelector('.quest-card')", 'the quest log from the world map', 6000)
    } catch {
      worldLogOpen = false
    }
    check('the quest log opens from the world map', worldLogOpen)
    await screenshot('08-quest-log-world')
  }

  // --- the party on the world map -------------------------------------------
  // The companions ride with the lord on the world map, not only inside a town.
  // The job log is still open from the check above: close it first.
  await evaluate("document.querySelector('.quest-card .head .btn.ghost')?.click()")
  await sleep(300)
  const chip = await evaluate(
    "(() => { const b = document.querySelector('.companion-chip'); return b ? b.textContent.replace(/\\s+/g, ' ').trim() : '' })()"
  )
  check('the world map shows who rides along', !!chip && /随从/.test(chip), chip)
  check('the chip carries the count', /1/.test(chip), chip)
  // Walk a few tiles so the train strings out behind the lord, which is what the
  // screenshot has to show.
  await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      w.moveTo(w.playerPos.x + 2.5, w.playerPos.y + 1.5)
      return w.path.length
    })()
  `)
  await sleep(900)
  await screenshot('09-world-followers')
  await evaluate("document.querySelector('.companion-chip')?.click()")
  let worldComp = true
  try {
    await waitFor("!!document.querySelector('.comp-card')", 'the companion panel from the world map', 6000)
  } catch {
    worldComp = false
  }
  check('the companions can be managed on the road', worldComp)
  if (worldComp) {
    const info = await evaluate(`
      (() => ({
        cards: document.querySelectorAll('.comp-card').length,
        rows: document.querySelectorAll('.comp-card .comp').length,
        companions: window.kidsWarGame.stores.player.companions.length,
        parents: [...document.querySelectorAll('.comp-card')].map((e) => e.parentElement.className)
      }))()
    `)
    check('the panel lists the companion hired in town', info.rows === info.companions, `${info.rows} rows / ${info.companions} companions / ${info.cards} panels / ${info.parents.join('|')}`)
    await evaluate("document.querySelector('.comp-card .head .btn.ghost')?.click()")
    await sleep(300)
  }

  check('the console stays clean', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exitCode = 1
} catch (error) {
  console.error(`\nFAILED: ${error.message}`)
  process.exitCode = 1
} finally {
  cleanup()
  process.exit(process.exitCode || 0)
}
