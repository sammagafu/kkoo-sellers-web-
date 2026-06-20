<template>
  <header class="auth-topbar">
    <router-link to="/" class="auth-topbar__brand text-decoration-none">
      <img
        class="auth-topbar__mark"
        :src="markSrc"
        alt=""
        width="32"
        height="32"
        decoding="async"
      />
      <span class="auth-topbar__title">KKOO</span>
    </router-link>
    <PortalBadge :portal="portal" />
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLayoutStore } from '@/stores/layout'
import PortalBadge from '@/components/PortalBadge.vue'
import logoMarkLight from '@/assets/images/logo-mark-light.svg'
import logoMarkDark from '@/assets/images/logo-mark-dark.svg'

defineProps<{
  portal: 'admin' | 'buyer' | 'seller'
}>()

const layout = useLayoutStore()
const markSrc = computed(() => (layout.layout.theme === 'dark' ? logoMarkDark : logoMarkLight))
</script>
