/**
 * Browser check for the settlement, siege and town-economy features.
 *
 * It drives real Chrome over the DevTools protocol: it seeds a save with the
 * lord next to a bandit village, a hostile town and a town he owns, then walks
 * the real buttons and reads the DOM back.
 *
 * Usage: node tools/verify-settlements-browser.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(root, 'node_modules', '.cache', 'kwg-verify')
const SITE = process.env.KWG_SITE || 'http://127.0.0.1:4189'
const SITE_PORT = Number(SITE.split(':').pop())
const CDP_PORT = Number(process.env.KWG_CDP_PORT || 9335)
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

/* -------------------------------- start the site ---------------------------- */

const site = spawn('npx', ['vite', 'preview', '--port', String(SITE_PORT), '--host', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore'
})
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${path.join(cache, 'chrome-profile-settlements')}`,
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
    // Back to the home screen first: a reload would keep the current route.
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

  /* --------------------------- 1. bandit village --------------------------- */
  console.log('bandit village')
  const bandit = await loadScenario('bandit')
  const banditButtons = await evaluate(`
    [...document.querySelectorAll('.hud-bottom button')].map((b) => b.textContent.trim())
  `)
  check(
    'the bandit village offers to drive the bandits off',
    banditButtons.some((t) => t.includes('赶走强盗')),
    JSON.stringify(banditButtons)
  )
  check(
    'the bandit village cannot be entered',
    !banditButtons.some((t) => t.includes('进入')),
    JSON.stringify(banditButtons)
  )

  // The map draws an ownership ring in the colour of the holder.
  const ring = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const st = w.settlements.find((s) => s.owner === 'bandit')
      const canvas = document.querySelector('canvas.world-canvas')
      if (!st || !canvas) return null
      const rect = canvas.getBoundingClientRect()
      const dpr = canvas.width / rect.width
      const cx = (st.x * 32 + 16 - w.camX) * dpr
      const cy = (st.y * 32 + 16 - w.camY) * dpr
      const ctx = canvas.getContext('2d')
      const radius = 19 * dpr
      const px = ctx.getImageData(Math.round(cx + radius), Math.round(cy), 1, 1).data
      return { owner: st.owner, rgb: [px[0], px[1], px[2]] }
    })()
  `)
  check(
    'the map draws the ownership ring of the settlement',
    ring && Math.abs(ring.rgb[0] - 154) < 45 && Math.abs(ring.rgb[1] - 162) < 45 && Math.abs(ring.rgb[2] - 171) < 45,
    JSON.stringify(ring)
  )

  // The wounded soldiers show up in the lord panel.
  await evaluate(`
    (() => {
      const p = window.kidsWarGame.stores.player
      p.troops = [{ type: 'militia', tier: 1, count: 4, hp: [30, 30, 12, 6] }]
      return true
    })()
  `)
  await clickByText('.chip', '角色详情')
  await waitFor("!!document.querySelector('.wound-note')", 'the lord panel')
  const woundNote = await evaluate("document.querySelector('.wound-note').textContent.replace(/\\s+/g, ' ').trim()")
  check('the lord panel reports the wounded', woundNote.includes('2') && woundNote.includes('受伤'), woundNote)
  await clickByText('button', '知道了')
  await sleep(300)

  await clickByText('.hud-bottom button', '赶走强盗')
  await waitFor("!!document.querySelector('.battle-view, .arena, canvas')", 'the battle screen')
  await sleep(800)
  const battleState = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      const w = window.kidsWarGame.stores.world
      const st = w.settlements.find((s) => s.id === b.context?.settlementId)
      return {
        kind: b.context?.kind,
        enemies: b.data ? b.data.units.filter((u) => u.side === 'enemy').length : 0,
        garrison: st ? st.garrison.reduce((n, g) => n + g.count, 0) : 0,
        route: location.hash
      }
    })()
  `)
  check('the fight against the bandits starts', battleState.kind === 'bandits', JSON.stringify(battleState))
  check(
    'the bandits of the village are the enemy',
    battleState.enemies > 0 && battleState.enemies === battleState.garrison,
    JSON.stringify(battleState)
  )
  check('the battle screen is open', battleState.route.includes('battle'), battleState.route)

  /* ---------------------------- 2. hostile town ---------------------------- */
  console.log('hostile town and siege')
  const hostile = await loadScenario('siege')
  const siegeButtons = await evaluate(`
    [...document.querySelectorAll('.hud-bottom button')].map((b) => b.textContent.trim())
  `)
  check(
    'the hostile town can be entered without taking it',
    siegeButtons.some((t) => t.includes('进入')),
    JSON.stringify(siegeButtons)
  )
  check(
    'the lord can prepare a siege',
    siegeButtons.some((t) => t.includes('准备围城')),
    JSON.stringify(siegeButtons)
  )
  await clickByText('.hud-bottom button', '准备围城')
  await sleep(600)
  const siegeState = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const st = w.settlements.find((s) => s.name === ${JSON.stringify(hostile.name)})
      const state = w.siegeState(st)
      return { active: state.active, daysLeft: state.daysLeft, ready: state.ready }
    })()
  `)
  check('the siege starts', siegeState.active && siegeState.daysLeft > 0, JSON.stringify(siegeState))
  check('the siege is not ready yet', !siegeState.ready)

  // Fast-forward the preparation and let the clock notice it.
  await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const st = w.settlements.find((s) => s.name === ${JSON.stringify(hostile.name)})
      w.day = st.siege.readyDay
      w.updateSiege(st)
      return true
    })()
  `)
  await sleep(600)
  const readyButtons = await evaluate(`
    [...document.querySelectorAll('.hud-bottom button')].map((b) => b.textContent.trim())
  `)
  check(
    'the town can be stormed once the preparation is over',
    readyButtons.some((t) => t.includes('攻打')),
    JSON.stringify(readyButtons)
  )
  await clickByText('.hud-bottom button', '攻打')
  await waitFor("!!document.querySelector('.battle-view, .arena, canvas')", 'the battle screen')
  await sleep(800)
  const stormState = await evaluate(`
    (() => {
      const b = window.kidsWarGame.stores.battle
      return {
        kind: b.context?.kind,
        enemies: b.data ? b.data.units.filter((u) => u.side === 'enemy').length : 0
      }
    })()
  `)
  check('the assault on the town starts', stormState.kind === 'siege', JSON.stringify(stormState))
  check('the garrison defends the town', stormState.enemies > 0, JSON.stringify(stormState))

  /* ------------------------------ 3. own town ------------------------------ */
  console.log('the lord\'s own town')
  const own = await loadScenario('town')
  await clickByText('.hud-bottom button', '进入')
  await waitFor("!!document.querySelector('.tabs')", 'the settlement screen')
  await sleep(500)
  const header = await evaluate(`
    (() => {
      const head = document.querySelector('.head')
      const level = head.querySelector('.chip.level')
      const left = head.querySelector('.title')
      return {
        level: level?.textContent.trim() || '',
        levelOnTheLeft: !!(level && left && left.contains(level)),
        owner: head.querySelector('.chip.owner')?.textContent.trim() || '',
        tabs: [...document.querySelectorAll('.tab')].map((t) => t.textContent.trim())
      }
    })()
  `)
  check('the town level sits in the top left', header.level.includes('Lv.2') && header.levelOnTheLeft, JSON.stringify(header))
  check('the owner is shown', header.owner.length > 0, JSON.stringify(header))
  check('the town panel is a tab', header.tabs.some((t) => t.includes('城镇')), JSON.stringify(header.tabs))

  // The exam of a town the lord owns funds the town instead of his purse.
  await clickByText('.tab', '考试')
  await waitFor("!!document.querySelector('.exam-card')", 'the exam card')
  const examCopy = await evaluate("document.querySelector('.exam-card').textContent.replace(/\\s+/g, ' ').trim()")
  check('the exam says it develops the town', examCopy.includes('城镇资金'), examCopy)
  await clickByText('.tab', '城镇')
  await waitFor("!!document.querySelector('.meters')", 'the town panel')

  await clickByText('.tab', '城镇')
  await waitFor("!!document.querySelector('.meters')", 'the town panel')
  await sleep(300)
  const townPanel = await evaluate(`
    (() => ({
      prosperity: document.querySelector('.meter-label')?.textContent.replace(/\\s+/g, ' ').trim() || '',
      stats: [...document.querySelectorAll('.stat')].map((s) => s.textContent.replace(/\\s+/g, ' ').trim()),
      facilities: [...document.querySelectorAll('.facility-head')].map((f) => f.textContent.replace(/\\s+/g, ' ').trim())
    }))()
  `)
  check('the prosperity is shown', townPanel.prosperity.includes('繁荣度'), JSON.stringify(townPanel))
  check('the town funds are shown', townPanel.stats.some((s) => s.includes('500')), JSON.stringify(townPanel.stats))
  check('both facilities are offered', townPanel.facilities.length === 2, JSON.stringify(townPanel.facilities))

  const before = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const st = w.settlements.find((s) => s.name === ${JSON.stringify(own.name)})
      return { funds: st.funds, development: st.development }
    })()
  `)
  await clickByText('.facility button', '建造')
  await sleep(400)
  const afterBuild = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const st = w.settlements.find((s) => s.name === ${JSON.stringify(own.name)})
      return { funds: st.funds, hospital: st.facilities.hospital }
    })()
  `)
  check('a hospital can be built', afterBuild.hospital === 1, JSON.stringify(afterBuild))
  check('the hospital is paid for', afterBuild.funds === before.funds - 120, `${before.funds} -> ${afterBuild.funds}`)

  await clickByText('.block-body button', '投入')
  await sleep(400)
  const afterInvest = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const st = w.settlements.find((s) => s.name === ${JSON.stringify(own.name)})
      return { funds: st.funds, development: st.development }
    })()
  `)
  check('the town can invest in its development', afterInvest.development === before.development + 6, JSON.stringify(afterInvest))
  check('the investment costs money', afterInvest.funds === afterBuild.funds - 60, `${afterBuild.funds} -> ${afterInvest.funds}`)

  check('the console stayed clean', consoleErrors.length === 0, consoleErrors.join(' | '))

  /* --------------------------- 4. an unclaimed town --------------------------- */
  console.log('an unclaimed town')
  const free = await loadScenario('claim')
  const claimButtons = await evaluate(`
    [...document.querySelectorAll('.hud-bottom button')].map((b) => b.textContent.trim())
  `)
  check(
    'an unclaimed town can be entered',
    claimButtons.some((t) => t.includes('进入')),
    JSON.stringify(claimButtons)
  )
  check(
    'an unclaimed town can be claimed',
    claimButtons.some((t) => t.includes('占领')),
    JSON.stringify(claimButtons)
  )
  await clickByText('.hud-bottom button', '占领')
  await sleep(600)
  const claimed = await evaluate(`
    (() => {
      const w = window.kidsWarGame.stores.world
      const st = w.settlements.find((s) => s.name === ${JSON.stringify(free.name)})
      return { owner: st.owner, level: st.level, prosperity: st.prosperity }
    })()
  `)
  check('the unclaimed town changes hands', claimed.owner === 'player', JSON.stringify(claimed))
  check('the claimed town starts poor', claimed.level === 1 && claimed.prosperity === 25, JSON.stringify(claimed))
} finally {
  await cleanup()
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exitCode = 1
