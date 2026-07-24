<template>
  <div :class="customClass ?? 'logo-box'">
    <router-link to="/" class="logo-box-link">
      <img
        :src="logoSrc"
        :height="logoHeight"
        :style="logoHeight ? { height: `${logoHeight}px` } : undefined"
        :class="logoClass ?? undefined"
        alt="KKOO"
      />
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLayoutStore } from '@/stores/layout'
/** Same assets as the index.html splash screen. */
import logoLight from '@/assets/images/logo-light.svg'
import logoDark from '@/assets/images/logo-dark.svg'

type PropsType = {
  customClass?: string
  logoClass?: string
  logoHeight?: number
}

withDefaults(defineProps<PropsType>(), {
  logoHeight: 40,
})

const layout = useLayoutStore()
const logoSrc = computed(() => (layout.layout.theme === 'dark' ? logoDark : logoLight))
</script>
