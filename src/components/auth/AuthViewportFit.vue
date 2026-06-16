<template>
  <div ref="rootEl" class="auth-viewport-fit">
    <div ref="innerEl" class="auth-viewport-fit__inner">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

const rootEl = ref<HTMLElement | null>(null)
const innerEl = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

function fit() {
  const root = rootEl.value
  const inner = innerEl.value
  if (!root || !inner) return

  inner.style.transform = 'none'
  inner.style.width = ''

  const available = root.clientHeight
  const needed = inner.scrollHeight
  if (available < 1 || needed < 1) return

  const scale = Math.min(1, available / needed)
  if (scale < 0.999) {
    inner.style.transform = `scale(${scale})`
    inner.style.width = `${100 / scale}%`
  }
}

onMounted(async () => {
  await nextTick()
  fit()
  requestAnimationFrame(fit)
  ro = new ResizeObserver(() => fit())
  if (rootEl.value) ro.observe(rootEl.value)
  if (innerEl.value) ro.observe(innerEl.value)
  innerEl.value?.querySelectorAll('img').forEach((img) => {
    img.addEventListener('load', fit)
  })
  window.addEventListener('resize', fit)
})

onUnmounted(() => {
  ro?.disconnect()
  window.removeEventListener('resize', fit)
})
</script>
