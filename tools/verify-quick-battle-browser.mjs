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
// The preview server and the browser keep the event loop alive, so the script
// would never end on its own: the cleanup has to run when the walkthrough is
// over, not only when the process exits.
let cleaned = false
const closeAll = () => {
  if (cleaned) return
  cleaned = true
  cleanup()
}
process.on('SIGINT', () => {
  closeAll()
  process.exit(130)
})

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
  // The version is read from the badge, so the check never has to be updated
  // when the game is released again.
  const badge = await evaluate(`
    (() => {
      const el = document.querySelector('button.version-badge')
      return el ? el.textContent.replace(/\\s+/g, ' ').trim() : null
    })()
  `)
  const shown = (badge || '').match(/v\d+\.\d+\.\d+/)
  check('the badge shows the version', !!shown, String(badge))
  check('the dialog names the version', !!shown && !!dialog && dialog.includes(shown[0]), String(dialog).slice(0, 80))
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
      const blocks = [...document.querySelectorAll('.block')]
      return {
        maps: blocks[0] ? blocks[0].querySelectorAll('.maps .pick').length : 0,
        scales: blocks[1] ? blocks[1].querySelectorAll('.scales .pick').length : 0,
        armies: document.querySelectorAll('.side')[0] ? document.querySelectorAll('.side')[0].querySelectorAll('.presets .chip').length : 0,
        factions: document.querySelectorAll('.side')[1] ? document.querySelectorAll('.side')[1].querySelectorAll('.presets .chip').length : 0,
        counters: document.querySelectorAll('.counter').length,
        steps: document.querySelectorAll('.counter .step').length,
        sliders: document.querySelectorAll('.counter .counter-slider').length,
        slidersAtHundred: [...document.querySelectorAll('.counter .counter-slider')].every((s) => s.max === '100'),
        title: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : null
      }
    })()
  `)
  check('the screen is the quick battle', !!options.title && options.title.includes('快速战斗'), String(options))
  check('six battlefields can be picked', options.maps === 6, String(options.maps))
  check('four army sizes can be picked', options.scales === 4, String(options.scales))
  check('four friendly armies can be picked', options.armies === 4, String(options.armies))
  check('three enemy factions can be picked', options.factions === 3, String(options.factions))
  check('every kind of soldier has a counter', options.counters === 8, String(options.counters))
  check('every counter has a stepper', options.steps === 16, String(options.steps))
  check('every counter has a quick slider', options.sliders === 8, String(options.sliders))
  check('the slider tops out at 100', options.slidersAtHundred === true, String(options.slidersAtHundred))

  // The number of soldiers of a kind can be set to any value.
  const before = await evaluate(`
    (() => {
      const row = document.querySelectorAll('.side')[0].querySelectorAll('.counter')[0]
      return row.querySelector('.num').textContent.trim()
    })()
  `)
  await evaluate(`
    (() => {
      const row = document.querySelectorAll('.side')[0].querySelectorAll('.counter')[0]
      const plus = [...row.querySelectorAll('.step')].pop()
      for (let i = 0; i < 5; i += 1) plus.click()
      return true
    })()
  `)
  await sleep(200)
  const after = await evaluate(`
    (() => {
      const row = document.querySelectorAll('.side')[0].querySelectorAll('.counter')[0]
      return row.querySelector('.num').textContent.trim()
    })()
  `)
  check('the count of a kind can be raised', Number(after) === Number(before) + 5, `${before} -> ${after}`)

  await evaluate(`
    (() => {
      const row = document.querySelectorAll('.side')[0].querySelectorAll('.counter')[0]
      const minus = row.querySelector('.step')
      for (let i = 0; i < 20; i += 1) minus.click()
      return true
    })()
  `)
  await sleep(200)
  const zero = await evaluate(`
    (() => {
      const row = document.querySelectorAll('.side')[0].querySelectorAll('.counter')[0]
      return row.querySelector('.num').textContent.trim()
    })()
  `)
  check('the count of a kind can be cleared', Number(zero) === 0, String(zero))

  // The slider is the quick way to set a large count, and it stops at 100.
  await evaluate(`
    (() => {
      const row = document.querySelectorAll('.side')[0].querySelectorAll('.counter')[0]
      const slider = row.querySelector('.counter-slider')
      slider.value = '100'
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })()
  `)
  await sleep(200)
  const slid = await evaluate(`
    (() => {
      const row = document.querySelectorAll('.side')[0].querySelectorAll('.counter')[0]
      return row.querySelector('.num').textContent.trim()
    })()
  `)
  check('the slider sets a count quickly', Number(slid) === 100, String(slid))

  await evaluate(`
    (() => {
      const row = document.querySelectorAll('.side')[0].querySelectorAll('.counter')[0]
      const slider = row.querySelector('.counter-slider')
      slider.value = '0'
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })()
  `)
  await sleep(200)

  // Pick a battlefield, a faction and an army, then walk into the battle.
  await clickByText('.maps .pick', '密林')
  await clickByText('.presets .chip', '苍狼')
  await clickByText('.presets .chip', '骑兵')
  await sleep(200)
  const setup = await evaluate(`
    (() => {
      const sides = [...document.querySelectorAll('.side')]
      const read = (side) => [...side.querySelectorAll('.counter .num')].map((n) => Number(n.textContent.trim()))
      return {
        player: read(sides[0]),
        enemy: read(sides[1]),
        playerTotal: sides[0].querySelector('.side-total').textContent.trim(),
        enemyTotal: sides[1].querySelector('.side-total').textContent.trim()
      }
    })()
  `)
  check('the friendly army is the chosen one', setup.player[3] > 0 && setup.player[0] === 0, JSON.stringify(setup))
  check('the enemy mix is the faction one', setup.enemy[0] > 0 && setup.enemy[1] > 0, JSON.stringify(setup))
  check('the totals are shown', /名/.test(setup.playerTotal) && /名/.test(setup.enemyTotal), JSON.stringify(setup))

  await clickByText('button.go', '进入战场')
  await waitFor("!!document.querySelector('canvas.battle-canvas')", 'the battle field')
  await sleep(900)

  const fight = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      return {
        kind: b.context ? b.context.kind : null,
        faction: b.context ? b.context.faction : null,
        map: b.context ? b.context.map : null,
        player: b.data ? b.data.units.filter((u) => u.side === 'player').length : 0,
        enemy: b.data ? b.data.units.filter((u) => u.side === 'enemy').length : 0,
        title: document.querySelector('.vs') ? document.querySelector('.vs').textContent.trim() : null,
        chips: [...document.querySelectorAll('.chips .chip')].map((c) => c.textContent.trim())
      }
    })()
  `)
  check('the fight is a quick battle', fight.kind === 'quick', JSON.stringify(fight))
  check('the enemy is the chosen faction', fight.faction === 'wolf', JSON.stringify(fight))
  check('the field is the chosen battlefield', fight.map === 'forest', JSON.stringify(fight))
  check('the chosen armies fight', fight.player > 0 && fight.enemy > 0, JSON.stringify(fight))
  check('the battle screen says it is a quick battle', !!fight.title && fight.title.includes('快速战斗'), String(fight.title))
  check('the squads can be picked', fight.chips.length >= 2, JSON.stringify(fight.chips))

  // The fight can be ended and the way back is the quick battle setup.
  await clickByText('.command .cmd', '攻击')
  await sleep(200)
  const ordered = await evaluate("window.kidsWarGame.stores.battle.order")
  check('the orders work in a quick battle', ordered === 'attack', String(ordered))

  check('the console stayed clean', consoleErrors.length === 0, consoleErrors.join(' | '))
} catch (err) {
  failed += 1
  console.log(`  FAIL the browser walkthrough — ${err.message}`)
} finally {
  closeAll()
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
// The child processes are gone, so the event loop can end on its own.
process.exit(failed > 0 ? 1 : 0)
