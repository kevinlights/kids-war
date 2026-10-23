/**
 * Real-Chrome check for the meeting with a hostile warband.
 *
 * It seeds a save with a bandit party one tile from the lord, then walks the
 * real dialog: the portrait and the roster are there, the battle does not start
 * by itself, 「喊话」 answers back, 「逃跑」 moves the lord away and cools the
 * enemy down, and 「开战」 finally opens the arena.
 *
 * Usage: node tools/verify-encounter-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4198'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9346)
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
const saveOut = path.join(cache, 'make-encounter-save.mjs')
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
const { payload, encounter } = buildSave(20261019, 'tester', { encounter: 'bandit' })
if (!encounter) throw new Error('the save could not place an enemy beside the lord')

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
  `--user-data-dir=${path.join(cache, `chrome-profile-encounter-${process.pid}`)}`,
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

  /* --------------------------- 1. open the world ---------------------------- */
  console.log('the meeting')
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
  await waitFor("!!document.querySelector('.encounter-card')", 'the meeting dialog')
  await sleep(500)

  const meeting = await evaluate(`
    (() => {
      const card = document.querySelector('.encounter-card')
      const img = card.querySelector('.portrait-img')
      const b = window.kidsWarGame.stores.battle
      const w = window.kidsWarGame.stores.world
      return {
        text: card.textContent.replace(/\\s+/g, ' ').trim(),
        portrait: img ? img.getAttribute('src') : null,
        portraitLoaded: !!(img && img.complete && img.naturalWidth > 0),
        buttons: [...card.querySelectorAll('.option')].map((n) => n.textContent.replace(/\\s+/g, ' ').trim()),
        troops: [...card.querySelectorAll('.troop')].map((n) => n.textContent.replace(/\\s+/g, ' ').trim()),
        battleActive: b.active,
        encounter: w.encounter ? w.encounter.faction : null,
        hash: location.hash
      }
    })()
  `)
  check('the meeting opens before the battle', !!meeting.encounter, JSON.stringify(meeting.encounter))
  check('the battle does not start by itself', meeting.battleActive === false, String(meeting.battleActive))
  check('the world map is still on screen', meeting.hash.includes('/world'), meeting.hash)
  check('the card names the enemy', meeting.text.includes('强盗'), meeting.text)
  check('the portrait is an image', !!meeting.portrait && meeting.portrait.includes('/pixel/commander/bandit.png'), String(meeting.portrait))
  check('the portrait really loads', meeting.portraitLoaded === true)
  check('the card counts the enemy troops', meeting.text.includes('敌方 6 兵'), meeting.text)
  check('the roster lists the enemy soldiers', meeting.troops.length === 2, JSON.stringify(meeting.troops))
  check('the roster names them', meeting.troops.join(' ').includes('民兵') && meeting.troops.join(' ').includes('弓箭手'), JSON.stringify(meeting.troops))
  check('the card offers the three choices', meeting.buttons.length === 3, JSON.stringify(meeting.buttons))
  check('one choice is to fight', meeting.buttons.some((t) => t.includes('开战')), JSON.stringify(meeting.buttons))
  check('one choice is to run', meeting.buttons.some((t) => t.includes('逃跑')), JSON.stringify(meeting.buttons))
  check('the card carries a line of dialogue', meeting.text.length > 40)

  /* ------------------------------ 2. talking -------------------------------- */
  console.log('talking back')
  await clickByText('.option', '喊话')
  await sleep(300)
  const firstReply = await evaluate(`
    (() => {
      const el = document.querySelector('.bubble.reply')
      return el ? el.textContent.trim() : null
    })()
  `)
  check('喊话 gets an answer', !!firstReply, String(firstReply))
  await clickByText('.option', '喊话')
  await sleep(300)
  const secondReply = await evaluate(`
    (() => {
      const el = document.querySelector('.bubble.reply')
      return el ? el.textContent.trim() : null
    })()
  `)
  check('the next 喊话 brings another line', !!secondReply && secondReply !== firstReply, `${firstReply} / ${secondReply}`)

  /* ------------------------------ 3. running -------------------------------- */
  console.log('running away')
  const before = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const p = window.kidsWarGame.stores.player
      const foe = w.parties.find((x) => x.id.startsWith('test-'))
      return {
        x: w.playerPos.x, y: w.playerPos.y,
        foeX: foe.x, foeY: foe.y,
        troops: p.totalTroops,
        gold: p.gold
      }
    })()
  `)
  await clickByText('.option', '逃跑')
  await waitFor("!document.querySelector('.encounter-card')", 'the dialog to close')
  await sleep(1600)
  const after = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const p = window.kidsWarGame.stores.player
      const foe = w.parties.find((x) => x.id.startsWith('test-'))
      return {
        encounter: w.encounter,
        cooldown: w.cooldown['test-bandit'] || 0,
        x: w.playerPos.x, y: w.playerPos.y,
        foeX: foe.x, foeY: foe.y,
        troops: p.totalTroops,
        gold: p.gold
      }
    })()
  `)
  check('the meeting is over', after.encounter === null, JSON.stringify(after.encounter))
  check('the enemy is on cooldown', after.cooldown > 0, String(after.cooldown))
  check('the lord has moved', Math.hypot(after.x - before.x, after.y - before.y) > 1, `${before.x},${before.y} -> ${after.x},${after.y}`)
  check('the lord is farther from the enemy', Math.hypot(after.x - after.foeX, after.y - after.foeY) > Math.hypot(before.x - before.foeX, before.y - before.foeY), `${Math.hypot(before.x - before.foeX, before.y - before.foeY).toFixed(1)} -> ${Math.hypot(after.x - after.foeX, after.y - after.foeY).toFixed(1)}`)
  check('running costs no soldier', after.troops === before.troops, `${after.troops} vs ${before.troops}`)
  check('running costs no gold', after.gold === before.gold, `${after.gold} vs ${before.gold}`)

  /* ------------------------------- 4. fighting ------------------------------ */
  console.log('choosing to fight')
  const start = payload.playerPos
  await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const foe = w.parties.find((x) => x.id.startsWith('test-'))
      w.playerPos = { x: ${start.x}, y: ${start.y} }
      w.path = []
      w.cooldown = {}
      w.encounter = null
      foe.x = ${encounter.x}
      foe.y = ${encounter.y}
      foe.targetX = ${encounter.x}
      foe.targetY = ${encounter.y}
      return true
    })()
  `)
  await waitFor("!!document.querySelector('.encounter-card')", 'the second meeting')
  await sleep(300)
  await clickByText('.option', '开战')
  await waitFor("!!document.querySelector('.battle-view')", 'the battle screen')
  await sleep(800)
  const fight = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      return {
        active: b.active,
        kind: b.context ? b.context.kind : null,
        faction: b.context ? b.context.faction : null,
        enemy: b.data ? b.data.units.filter((u) => u.side === 'enemy').length : 0
      }
    })()
  `)
  check('开战 opens the arena', fight.active === true)
  check('the fight is the party that was met', fight.kind === 'party', String(fight.kind))
  check('the enemy faction is the one in the dialog', fight.faction === 'bandit', String(fight.faction))
  check('the enemy army is on the field', fight.enemy === 6, String(fight.enemy))
  check('the console stays clean', consoleErrors.length === 0, consoleErrors.join(' | '))

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exitCode = 1
} finally {
  cleanup()
}
