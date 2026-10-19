import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { loadSprites } from './game/pixelAssets'
import { ensureModsLoaded, modApi } from './game/quiz'
import { usePlayerStore } from './stores/player'
import { useWorldStore } from './stores/world'
import { useBattleStore } from './stores/battle'
import './styles/global.css'

// Start the pixel art download alongside the app boot, so the first world map
// already has its sprites in memory.
loadSprites()

// Load the built-in question packs and any external mod under public/mods/.
// The exam awaits the same promise, so a late mod still lands in the paper.
ensureModsLoaded()
// Handy for experiments: kidsWarGame.loadModsFromText('{ "key": … }')
// The stores are exposed as well, so the world, the lord and the battle can be
// inspected or driven from the console: kidsWarGame.stores.world.day = 12
if (typeof window !== 'undefined') {
  const api = modApi()
  api.stores = {
    get player() {
      return usePlayerStore()
    },
    get world() {
      return useWorldStore()
    },
    get battle() {
      return useBattleStore()
    }
  }
  window.kidsWarGame = api
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
