<template>
  <div class="auth-shell auth-shell--centered account-pages account-pages--auth w-100">
    <AuthScene />

    <main class="auth-center-stage">
      <AuthViewportFit>
        <slot />
      </AuthViewportFit>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AuthScene from '@/components/auth/AuthScene.vue'
import AuthViewportFit from '@/components/auth/AuthViewportFit.vue'
const body = document.body
const root = document.documentElement

onMounted(() => {
  if (body) {
    body.classList.add('authentication-bg')
    body.removeAttribute('style')
  }
  root.classList.add('auth-viewport-lock')
  document.querySelector('.offcanvas-backdrop')?.classList.remove('show')
})

onUnmounted(() => {
  if (body) {
    body.classList.remove('authentication-bg')
  }
  root.classList.remove('auth-viewport-lock')
})
</script>
