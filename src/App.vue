<template>
  <router-view />
  <ShareModal v-if="shareState.open" />
</template>

<script setup>
// Root shell. All screens are routed views rendered full-screen, and the share
// popup has a single instance here so any screen can open it.
import ShareModal from '@/components/ShareModal.vue'
import { shareState } from '@/composables/share'
</script>
