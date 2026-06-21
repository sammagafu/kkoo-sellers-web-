<template>
  <div class="invoice-microsite">
    <div v-if="error" class="invoice-error p-4 text-center">
      <p class="text-danger mb-2">{{ error }}</p>
      <p class="small text-muted">This invoice link may be invalid or expired.</p>
    </div>
    <iframe
      v-else
      :src="iframeSrc"
      class="invoice-iframe"
      title="Invoice"
      @load="onIframeLoad"
      @error="onIframeError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { resolveApiBaseUrl } from '@/utils/apiBaseUrl'

const route = useRoute()
const token = computed(() => (route.params.token as string) || '')
const baseURL = resolveApiBaseUrl()
const iframeSrc = computed(() => `${baseURL.replace(/\/$/, '')}/invoice/view/${encodeURIComponent(token.value)}`)
const error = ref('')

function onIframeLoad() {
  error.value = ''
}

function onIframeError() {
  error.value = 'Failed to load invoice.'
}

onMounted(() => {
  if (!token.value) error.value = 'Missing invoice token.'
})
</script>

<style scoped>
.invoice-microsite {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}
.invoice-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
}
.invoice-error {
  max-width: 400px;
  margin: 2rem auto;
}
</style>
