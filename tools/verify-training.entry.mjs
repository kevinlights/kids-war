/**
 * Headless checks for the version display on the home screen and for the
 * training session the lord can enter while he is camped.
 *
 * The training rules are the point of these checks:
 *   - the field holds the lord's own soldiers and wooden dummies only,
 *   - a training session never ends and never costs anything,
 *   - the campaign is not touched: no soldier dies, no gold is lost.
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { useWorldStore } from '@/stores/world'
import { usePlayerStore } from '@/stores/player'
import { useBattleStore } from '@/stores/battle'
import { ARENA, createBattle, spawnTrainingDummies, stepBattle, TRAINING_DUMMY_COUNT } from '@/game/battle'
import { BATCHES, CHANGELOG, VERSION, nextPatchVersion, versionLabel } from '@/game/versions'

const check = (name, condition, detail = '') => globalThis.__reporter.check(name, condition, detail)

setActivePinia(createPinia())
const world = useWorldStore()
const player = usePlayerStore()
const battle = useBattleStore()

/* ------------------------------- 1. version -------------------------------- */

check('the version has three numbers', /^\d+\.\d+\.\d+$/.test(VERSION), VERSION)
check('the version starts at 0.0.1', VERSION === '0.0.1', VERSION)
check('the interface shows the version with a v', versionLabel(VERSION) === `v${VERSION}`)
check('the changelog has an entry', CHANGELOG.length > 0)
check('the newest entry is the current version', CHANGELOG[0].version === VERSION, CHANGELOG[0].version)
check('every entry has a date', CHANGELOG.every((entry) => !!entry.date))
check('every entry lists at least one change', CHANGELOG.every((entry) => (entry.summary || []).length > 0))
check('the changelog mentions the version display', CHANGELOG[0].summary.some((line) => line.includes('版本号')))
check('the changelog mentions the training session', CHANGELOG[0].summary.some((line) => line.includes('练兵')))
check('the changelog mentions the quick battle', CHANGELOG[0].summary.some((line) => line.includes('快速战斗')))
// The notes are the batches of the progress file.
const progressText = readFileSync(path.join(globalThis.__kwgRoot || process.cwd(), 'progress.md'), 'utf8')
// Only the batches that hold something a player can see are in the notes.
const technicalBatches = (progressText.match(/^- 🔧 /gm) || []).length
const playerBatches = progressText
  .split('### 批次 ')
  .slice(1)
  .filter((chunk) => chunk.includes('\n- ▶ ')).length
check(
  'the notes hold every batch of the progress file that a player can see',
  BATCHES.length === playerBatches,
  `${BATCHES.length} vs ${playerBatches}`
)
check('every batch has a title, a date and its items', BATCHES.every((b) => b.title && b.date && b.items.length > 0))
check('every batch item has its Chinese text', BATCHES.every((b) => b.items.every((i) => !!i.zh)))
check('the technical notes are left out of the update notes', BATCHES.every((b) => b.items.every((i) => !i.zh.startsWith('技术'))))
check(
  'the update notes carry no development details',
  BATCHES.every((b) =>
    b.items.every((i) => !/`|src\/|tools\/|\.mjs|\.vue|\.js|Pinia|Vue|canvas|localStorage/.test(i.zh + i.en))
  )
)
check('the progress file keeps its technical notes', technicalBatches >= BATCHES.length)
check('only the patch moves', nextPatchVersion('0.0.1') === '0.0.2', nextPatchVersion('0.0.1'))
check('the patch of v0.0.9 rolls over', nextPatchVersion('0.0.9') === '0.0.10', nextPatchVersion('0.0.9'))
check('the major and the minor stay at zero', VERSION.split('.').slice(0, 2).join('.') === '0.0', VERSION)

/* ------------------------------ 2. training -------------------------------- */

world.generate(20261021)
player.reset('tester')
player.addTroops('militia', 1, 4)
player.addTroops('spearman', 1, 2)
player.addGold(120)
player.supplies.food = 30

const warband = player.totalTroops
const troopsBefore = JSON.stringify(player.troops)
const goldBefore = player.gold
const foodBefore = player.supplies.food
const battlesBefore = player.stats.battles
const winsBefore = player.stats.wins

battle.startTraining(4242)
check('the training session is running', battle.active)
check('the store knows it is a training session', battle.isTraining)
check('the battle is flagged as a training one', !!battle.data.training)
check('the context says what kind of battle it is', battle.context.kind === 'training')

const dummies = battle.data.units.filter((u) => u.isDummy)
const soldiers = battle.data.units.filter((u) => u.side === 'player')
check('the dummies stand on the field', dummies.length === TRAINING_DUMMY_COUNT, String(dummies.length))
check('there are no real enemies', battle.data.units.every((u) => u.side === 'player' || u.isDummy))
check('the lord brings his own soldiers', soldiers.length === warband, `${soldiers.length} vs ${warband}`)
check('the dummies stand on the far side of the field', dummies.every((u) => u.x > ARENA.w / 2))
check('the dummies hold their post', battle.data.groups['enemy:training:1'].order === 'defend')

// The fight never ends on its own and nobody is hurt.
const hpBefore = soldiers.map((u) => u.hp)
let dummyDamage = 0
// The drill runs at the fast speed, so the soldiers reach the dummies quickly.
battle.setSpeed('fast')
for (let i = 0; i < 900; i += 1) {
  battle.tick(1 / 60)
  dummyDamage += dummies.reduce((sum, u) => sum + (u.maxHp - u.hp), 0)
}
check('the training session never ends', battle.data.outcome === null, String(battle.data.outcome))
check('the soldiers are never hurt', soldiers.every((u, i) => u.hp === hpBefore[i]))
check('the dummies take the blows', dummyDamage > 0, String(dummyDamage))

// The dummies stand back up, so the drill never runs out of targets. The
// check runs on a drill without soldiers, so nothing knocks them down again
// while they are getting up.
const solo = createBattle({ playerTroops: [], enemyTroops: [], seed: 11, training: true })
spawnTrainingDummies(solo)
const soloDummies = solo.units.filter((u) => u.isDummy)
for (const u of soloDummies) {
  u.hp = 0
  u.alive = false
  u.downAt = solo.time
}
for (let i = 0; i < 200; i += 1) stepBattle(solo, 1 / 60)
check('the dummies stand back up', soloDummies.every((u) => u.alive))
check('the dummies are whole again', soloDummies.every((u) => u.hp === u.maxHp))

// The campaign is not touched by a drill.
check('the warband is untouched', JSON.stringify(player.troops) === troopsBefore)
check('the purse is untouched', player.gold === goldBefore, `${player.gold} vs ${goldBefore}`)
check('the food store is untouched', player.supplies.food === foodBefore, `${player.supplies.food} vs ${foodBefore}`)
check('the record is untouched', player.stats.battles === battlesBefore && player.stats.wins === winsBefore)

// Even a forced settlement must not change anything.
battle.data.outcome = 'win'
battle.settle()
check('a training session never settles', battle.settled === false)
check('the warband survives a forced settlement', JSON.stringify(player.troops) === troopsBefore)
check('the purse survives a forced settlement', player.gold === goldBefore)
battle.close()
check('closing the session clears the battle', !battle.active && !battle.data)

/* --------------------------- 3. the plain battle --------------------------- */

// A real fight still ends the way it always did: a strong warband wipes a
// weak one out.
const b = createBattle({
  playerTroops: [{ type: 'cavalry', tier: 4, count: 8, hp: [] }],
  enemyTroops: [{ type: 'militia', tier: 1, count: 2, hp: [] }],
  enemyFaction: 'bandit',
  seed: 7
})
let t = 0
while (!b.outcome && t < 60 * 120) {
  stepBattle(b, 1 / 60)
  t += 1
}
check('a real battle still ends', !!b.outcome, String(b.outcome))

// The dummies of a plain battle do not exist.
const plain = createBattle({
  playerTroops: [{ type: 'militia', tier: 1, count: 1, hp: [30] }],
  enemyTroops: [{ type: 'militia', tier: 1, count: 1, hp: [30] }],
  enemyFaction: 'bandit',
  seed: 8
})
check('a plain battle has no dummies', !plain.units.some((u) => u.isDummy))
check('a plain battle is not a training one', plain.training === false)

// The dummies can also be placed by hand.
const field = { groups: {}, units: [] }
spawnTrainingDummies(field, 3)
check('the dummies can be spawned on a field', field.units.length === 3 && field.units.every((u) => u.isDummy))
check('a spawned dummy stands on the field', field.units.every((u) => u.x > 0 && u.y > 0))

/* ----------------------------- 4. the interface ----------------------------- */

const root = globalThis.__kwgRoot || process.cwd()
const homeView = readFileSync(path.join(root, 'src', 'views', 'HomeView.vue'), 'utf8')
check('the home screen shows the version', homeView.includes('versionLabel(VERSION)'))
check('the home screen shows the update notes', homeView.includes('showChangelog'))
check('the home screen reads the version module', homeView.includes("from '@/game/versions'"))
check('the home screen opens the notes in a dialog', homeView.includes('notes-wrap'))

const worldView = readFileSync(path.join(root, 'src', 'views', 'WorldView.vue'), 'utf8')
check('the world map offers the drill', worldView.includes('练兵'))
check('the drill only shows while camped', /v-if="world\.camping"[\s\S]{0,120}练兵/.test(worldView))
check('the world map starts the drill', worldView.includes('startTraining'))

const battleView = readFileSync(path.join(root, 'src', 'views', 'BattleView.vue'), 'utf8')
check('the battle screen can end the drill', battleView.includes('结束练兵'))
check('the battle screen knows about the training', battleView.includes('battle.isTraining'))

const battleStore = readFileSync(path.join(root, 'src', 'stores', 'battle.js'), 'utf8')
check('the store has a training action', battleStore.includes('startTraining'))
check('the store never settles a training session', battleStore.includes("kind === 'training'"))

const versionModule = readFileSync(path.join(root, 'src', 'game', 'versions', 'index.js'), 'utf8')
check('the version module holds the number', versionModule.includes('export const VERSION'))
check('the version module holds the notes', versionModule.includes('export const CHANGELOG'))
check('the versions live in their own folder', existsSync(path.join(root, 'src', 'game', 'versions')))
check('every release has a file of its own', existsSync(path.join(root, 'src', 'game', 'versions', `v${VERSION}.js`)))
