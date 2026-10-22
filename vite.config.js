import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      // The production build keeps the component tree reachable, so the
      // browser checks can read the state of a component (the paper of an
      // exam, for instance) instead of guessing it from the DOM.
      features: { prodDevtools: true }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5180
  },
  preview: {
    host: '0.0.0.0',
    port: 4180
  }
})
