<template>
  <div class="store-preview">
    <div class="store-preview-bar d-flex align-items-center justify-content-between gap-2 px-3 py-2 bg-light border-bottom">
      <div class="d-flex align-items-center gap-2">
        <router-link :to="backTo" class="btn btn-sm btn-outline-secondary">← Back</router-link>
        <span class="text-muted small">Preview: {{ slugOrId }}</span>
      </div>
      <a
        :href="storeUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-sm btn-primary"
      >
        Open in new tab
      </a>
    </div>
    <iframe
      :src="storeUrl"
      title="Store preview"
      class="store-preview-iframe"
      frameborder="0"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const slugOrId = computed(() => route.params.slugOrId as string)

const storeUrl = computed(() => {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return `${base}${basePath}store/${encodeURIComponent(slugOrId.value)}`
})

const backTo = computed(() => {
  if (auth.isSeller) return { name: 'seller.profile' }
  return { name: 'admin.sellers' }
})
</script>

<style scoped>
.store-preview {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 0px);
  background: #fff;
}
.store-preview-bar {
  flex-shrink: 0;
}
.store-preview-iframe {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: none;
}
</style>
