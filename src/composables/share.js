// Tiny shared flag for the "share the game" popup. The home screen and the
// world map can both open it, while App.vue owns the single modal instance.
import { reactive } from 'vue'

export const shareState = reactive({ open: false })

export function openShare() {
  shareState.open = true
}

export function closeShare() {
  shareState.open = false
}
