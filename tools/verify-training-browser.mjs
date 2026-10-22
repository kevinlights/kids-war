/**
 * Browser check for the version display on the home screen and for the
 * training drill the lord can enter while he is camped.
 *
 * It drives real Chrome over the DevTools protocol: it seeds a save with a
 * warband, walks the real buttons (camp → drill → end the drill) and reads
 * the DOM and the stores back.
 *
 * Usage: node tools/verify-training-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4197'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9345)
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
const saveOut = path.join(cache, 'make-training-save.mjs')
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
  // A profile of its own, so a Chrome left over from an earlier run cannot
  // lock this one out.
  `--user-data-dir=${path.join(cache, `chrome-profile-training-${process.pid}`)}`,
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

  // Open a page: Chrome only accepts PUT on /json/new, and it may need a
  // moment before it answers.
  let target = null
  for (let i = 0; i < 20 && !target; i += 1) {
    try {
      const res = await fetch(
        `http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(SITE)}`,
        { method: 'PUT' }
      )
      if (res.ok) target = await res.json()
    } catch {
      /* not up yet */
    }
    if (!target) await sleep(500)
  }
  if (!target) throw new Error('Chrome did not open a page')
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

  /* --------------------------- 1. the home screen --------------------------- */
  console.log('home screen')
  await send('Page.navigate', { url: SITE })
  await waitFor("!!document.querySelector('input')", 'the home screen')

  const badge = await evaluate(`
    (() => {
      const el = document.querySelector('.brand .version-badge')
      return el ? el.textContent.replace(/\\s+/g, ' ').trim() : null
    })()
  `)
  // The version is read from the badge, so the check survives a release.
  check('the home screen shows the version', !!badge && /v\d+\.\d+\.\d+/.test(badge), String(badge))
  // The page carries one version element only: the badge opens the notes.
  const versionElements = await evaluate(`
    document.querySelectorAll('.version-badge, .version').length
  `)
  check('the home screen carries one version element', versionElements === 1, String(versionElements))

  // The badge at the bottom opens the update notes in a dialog.
  const notesBefore = await evaluate(`
    (() => {
      const list = document.querySelector('.notes-body')
      return list ? list.textContent.trim() : null
    })()
  `)
  check('the update notes start folded away', notesBefore === null, String(notesBefore))
  const opened = await clickByText('button.version-badge', '版本')
  await sleep(400)
  const notes = await evaluate(`
    (() => {
      const list = document.querySelector('.notes-body')
      return list ? list.textContent.trim() : null
    })()
  `)
  check('the badge opens the update notes', opened && !!notes, String(notes))
  check('the notes mention the version display', !!notes && notes.includes('版本号'))
  check('the notes mention the training drill', !!notes && notes.includes('练兵'))

  /* ---------------------------- 2. the world map ---------------------------- */
  console.log('world map')
  const { payload } = buildSave()
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

  // Without a camp there is no drill button.
  const beforeCamp = await evaluate(`
    [...document.querySelectorAll('.hud-bottom button')].map((b) => b.textContent.trim())
  `)
  check(
    'the drill button only shows while camped',
    !beforeCamp.some((t) => t.includes('练兵')),
    JSON.stringify(beforeCamp)
  )

  await clickByText('.hud-bottom button', '⛺ 扎营')
  await sleep(400)
  const camped = await evaluate(`
    [...document.querySelectorAll('.hud-bottom button')].map((b) => b.textContent.trim())
  `)
  check(
    'the camp offers the drill',
    camped.some((t) => t.includes('练兵')),
    JSON.stringify(camped)
  )

  /* ------------------------------ 3. the drill ------------------------------ */
  console.log('the drill')
  const before = await evaluate(`
    (() => {
      const p = window.kidsWarGame.stores.player
      return { gold: p.gold, troops: JSON.stringify(p.troops), food: p.supplies.food }
    })()
  `)
  await clickByText('.hud-bottom button', '练兵')
  await waitFor("!!document.querySelector('.battle-view')", 'the battle screen')
  await sleep(600)

  const bar = await evaluate(`
    (() => {
      const vs = document.querySelector('.hud-top .vs')
      const enemy = document.querySelector('.hud-top .side.enemy')
      return {
        vs: vs ? vs.textContent.trim() : null,
        enemy: enemy ? enemy.textContent.trim() : null
      }
    })()
  `)
  check('the battle screen says it is a drill', !!bar.vs && bar.vs.includes('练兵'), String(bar.vs))
  check('the other side is the wooden dummies', !!bar.enemy && bar.enemy.includes('训练木桩'), String(bar.enemy))

  const drill = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const p = window.kidsWarGame.stores.player
      return {
        training: b.isTraining,
        kind: b.context ? b.context.kind : null,
        dummies: b.data ? b.data.units.filter((u) => u.isDummy).length : 0,
        enemies: b.data ? b.data.units.filter((u) => u.side === 'enemy' && !u.isDummy).length : -1,
        outcome: b.data ? b.data.outcome : null,
        gold: p.gold,
        troops: JSON.stringify(p.troops),
        food: p.supplies.food
      }
    })()
  `)
  check('the store knows it is a drill', drill.training === true)
  check('the drill has no enemy', drill.enemies === 0, String(drill.enemies))
  check('the drill has the wooden dummies', drill.dummies === 8, String(drill.dummies))
  check('the drill has no outcome', drill.outcome === null, String(drill.outcome))
  check('the drill costs no gold', drill.gold === before.gold, `${drill.gold} vs ${before.gold}`)
  check('the drill costs no food', drill.food === before.food, `${drill.food} vs ${before.food}`)
  check('the drill keeps the warband', drill.troops === before.troops)

  // The dummies really take the blows and never fight back. The soldiers
  // have to cross the field first, so the drill runs until the first dummy
  // is hit instead of waiting for a fixed time.
  const dummyHurt = `
    (() => {
      const b = window.kidsWarGame.stores.battle
      if (!b.data) return 0
      const dummies = b.data.units.filter((u) => u.isDummy)
      return dummies.reduce((sum, u) => sum + (u.maxHp - u.hp), 0)
    })()
  `
  let hurt = 0
  for (let i = 0; i < 60; i += 1) {
    hurt = await evaluate(dummyHurt)
    if (hurt > 0) break
    await sleep(500)
  }
  const afterFight = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const dummies = b.data.units.filter((u) => u.isDummy)
      const soldiers = b.data.units.filter((u) => u.side === 'player' && !u.isCommander)
      return {
        hurt: dummies.reduce((sum, u) => sum + (u.maxHp - u.hp), 0),
        soldierHp: soldiers.map((u) => u.hp),
        maxHp: soldiers.map((u) => u.maxHp),
        outcome: b.data.outcome
      }
    })()
  `)
  check('the dummies take the blows', afterFight.hurt > 0, String(afterFight.hurt))
  check(
    'the soldiers are never hurt',
    afterFight.soldierHp.every((hp, i) => hp === afterFight.maxHp[i]),
    JSON.stringify(afterFight.soldierHp)
  )
  check('the drill still has no outcome', afterFight.outcome === null, String(afterFight.outcome))

  /* ---------------------------- 4. leaving the drill ------------------------- */
  console.log('leaving the drill')
  const endButton = await evaluate(`
    (() => {
      const el = document.querySelector('.end-train')
      return el ? el.textContent.trim() : null
    })()
  `)
  check('the drill can be ended', !!endButton && endButton.includes('结束练兵'), String(endButton))
  await clickByText('.end-train', '结束练兵')
  await waitFor("!!document.querySelector('.hud-bottom')", 'the world map again')
  await sleep(400)

  const after = await evaluate(`
    (() => {
      const p = window.kidsWarGame.stores.player
      const w = window.kidsWarGame.stores.world
      return {
        gold: p.gold,
        troops: JSON.stringify(p.troops),
        food: p.supplies.food,
        camping: w.camping
      }
    })()
  `)
  check('the warband is untouched', after.troops === before.troops)
  check('the purse is untouched', after.gold === before.gold, `${after.gold} vs ${before.gold}`)
  check('the food store is untouched', after.food === before.food)
  check('the camp is still pitched', after.camping === true, String(after.camping))

  check('the console is clean', consoleErrors.length === 0, consoleErrors.join(' | '))
} catch (err) {
  failed += 1
  console.log(`  FAIL the run itself — ${err.message}`)
} finally {
  cleanup()
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
