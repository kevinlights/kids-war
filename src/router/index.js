import { createRouter, createWebHashHistory } from 'vue-router'

// Hash history keeps the game working when opened directly from a file or a LAN host.
const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/world', name: 'world', component: () => import('@/views/WorldView.vue') },
  { path: '/settlement', name: 'settlement', component: () => import('@/views/SettlementView.vue') },
  { path: '/battle', name: 'battle', component: () => import('@/views/BattleView.vue') },
  { path: '/guide', name: 'guide', component: () => import('@/views/GuideView.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
