<template>
  <div class="auth-shell auth-shell--split account-pages account-pages--auth w-100" data-kkoo-portal="admin">
    <aside class="auth-split-pattern" aria-hidden="true" />
    <main class="auth-split-form">
      <div class="auth-split-form__inner">
        <AuthViewportFit>
          <slot />
        </AuthViewportFit>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AuthViewportFit from '@/components/auth/AuthViewportFit.vue'

const body = document.body
const root = document.documentElement

onMounted(() => {
  if (body) {
    body.classList.add('authentication-bg')
    body.setAttribute('data-kkoo-portal', 'admin')
    body.removeAttribute('style')
  }
  root.classList.add('auth-viewport-lock')
  document.querySelector('.offcanvas-backdrop')?.classList.remove('show')
})

onUnmounted(() => {
  if (body) {
    body.classList.remove('authentication-bg')
    body.removeAttribute('data-kkoo-portal')
  }
  root.classList.remove('auth-viewport-lock')
})
</script>
