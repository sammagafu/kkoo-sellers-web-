<template>
  <div :class="customClass ?? 'logo-box'">
    <router-link to="/" class="logo-box-link">
      <img
        :src="logoLightImg"
        :height="logoHeight"
        :style="logoHeight ? { height: `${logoHeight}px` } : undefined"
        :class="logoClass ?? undefined"
        alt="KKOO"
      />
    </router-link>
  </div>
</template>

<script setup lang="ts">
import logoLightImg from '@/assets/images/logo-light.svg'

type PropsType = {
  customClass?: string
  logoClass?: string
  logoHeight?: number
}

withDefaults(defineProps<PropsType>(), {
  logoHeight: 128,
})
</script>
