<script setup>
/**
 * Share popup: renders the game URL as a QR code so a friend on the same
 * network can scan it and start playing.
 *
 * The QR code is encoded locally by a dependency-free encoder, so nothing is
 * fetched from the internet and the popup still works on an offline LAN.
 */
import { computed, ref } from 'vue'
import qrcode from 'qrcode-generator'
import { closeShare } from '@/composables/share'

/**
 * Share the app root. Hash routing means the link works from any static host
 * and always drops the friend on the home screen instead of mid-game.
 */
const shareUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  const { origin, pathname } = window.location
  return `${origin}${pathname}`
})

const qrSvg = computed(() => {
  if (!shareUrl.value) return ''
  // Type 0 lets the encoder pick the smallest version that fits, with medium
  // error correction so the code still scans from a slightly smudged screen.
  const qr = qrcode(0, 'M')
  qr.addData(shareUrl.value)
  qr.make()
  return qr.createSvgTag(6, 20)
})

const copied = ref(false)

/** Fallback for plain HTTP LAN pages where the clipboard API is unavailable. */
function legacyCopy(text) {
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

async function copyLink() {
  const text = shareUrl.value
  let ok = false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      ok = true
    }
  } catch {
    ok = false
  }
  if (!ok) ok = legacyCopy(text)
  copied.value = ok
  if (ok) setTimeout(() => (copied.value = false), 1800)
}
</script>

<template>
  <div class="overlay" @click.self="closeShare">
    <div class="share-card pop">
      <h2>📤 分享给好朋友</h2>
      <p class="sub">让伙伴用手机扫一扫，就能一起来征战</p>

      <div class="qr-box" v-html="qrSvg" />

      <p class="url">{{ shareUrl }}</p>
      <p class="tip">要和好友连同一个网络（WiFi）哦</p>

      <div class="actions">
        <button class="btn" @click="copyLink">{{ copied ? '✅ 已复制链接' : '🔗 复制链接' }}</button>
        <button class="btn ghost" @click="closeShare">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 8, 5, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 55;
}

.share-card {
  width: min(400px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  padding: 22px 20px 18px;
  border-radius: var(--radius);
  background: linear-gradient(170deg, #f6f1e2, #ddd6c2);
  color: #2b2a22;
  box-shadow: var(--shadow);
}

h2 {
  margin: 0;
  text-align: center;
  font-size: 21px;
  color: #4a3a12;
}

.sub {
  margin: 6px 0 14px;
  text-align: center;
  font-size: 13.5px;
  font-weight: 700;
  color: #6b6552;
}

.qr-box {
  width: 100%;
  max-width: 232px;
  margin: 0 auto;
  padding: 10px;
  border-radius: 12px;
  background: #fff;
  box-shadow: inset 0 0 0 2px #e2dcc7;
}

/* The encoder emits a plain <svg>; scale it to the box and keep it crisp. */
.qr-box :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  shape-rendering: crispEdges;
}

.url {
  margin: 14px 0 0;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  color: #6b5119;
  word-break: break-all;
}

.tip {
  margin: 4px 0 0;
  text-align: center;
  font-size: 12.5px;
  font-weight: 700;
  color: #6b6552;
}

.actions {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.actions .btn.ghost {
  background: rgba(0, 0, 0, 0.08);
  color: #3b3a2c;
  border-color: rgba(0, 0, 0, 0.18);
}

.actions .btn.ghost:hover {
  background: rgba(0, 0, 0, 0.15);
}
</style>
