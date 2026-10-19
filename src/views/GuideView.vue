<template>
  <div class="guide-page scroll">
    <div class="topbar">
      <button class="btn ghost" @click="router.back()">← 返回</button>
    </div>
    <GuideContent />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import GuideContent from '@/components/GuideContent.vue'

const router = useRouter()
</script>

<style scoped>
.guide-page {
  height: 100%;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(232, 197, 106, 0.10), transparent 60%),
    var(--bg-deep);
}

.topbar {
  max-width: 760px;
  margin: 0 auto;
  padding: 14px 18px 0;
}
</style>
