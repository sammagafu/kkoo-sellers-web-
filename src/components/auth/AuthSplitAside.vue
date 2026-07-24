<template>
  <aside class="auth-split-aside" :aria-label="content.eyebrow">
    <div class="auth-split-aside__pattern" aria-hidden="true" />

    <div class="auth-split-aside__hero" aria-hidden="true">
      <img :src="heroImg" alt="" width="320" height="240" loading="eager" decoding="async" />
    </div>

    <div class="auth-split-aside__content">
      <div class="auth-split-aside__brand">
        <LogoBox customClass="auth-split-aside__logo-box" :logo-height="44" />
        <p class="auth-split-aside__tagline">{{ content.tagline }}</p>
      </div>
      <p class="auth-split-aside__eyebrow">{{ content.eyebrow }}</p>
      <h2 class="auth-split-aside__title">{{ content.title }}</h2>
      <p class="auth-split-aside__lead">{{ content.lead }}</p>
      <ul v-if="content.points.length" class="auth-split-aside__points" role="list">
        <li v-for="(point, index) in content.points" :key="index">{{ point }}</li>
      </ul>
    </div>

    <div v-if="content.footerLinks?.length" class="auth-split-aside__footer">
      <template v-for="(link, index) in content.footerLinks" :key="`${link.label}-${index}`">
        <a
          v-if="link.href"
          :href="link.href"
          :class="link.variant === 'text' ? 'auth-split-aside__footer-link' : 'auth-split-aside__footer-btn'"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener noreferrer' : undefined"
        >{{ link.label }}</a>
        <router-link
          v-else-if="link.to"
          :to="link.to"
          :class="link.variant === 'text' ? 'auth-split-aside__footer-link' : 'auth-split-aside__footer-btn'"
        >{{ link.label }}</router-link>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import heroImg from '@/assets/images/auth/auth-hero.png'
import LogoBox from '@/components/LogoBox.vue'
import { authSplitByPortal, type AuthPortal } from '@/config/auth-split'

const props = defineProps<{
  portal: AuthPortal
}>()

const content = computed(() => authSplitByPortal[props.portal])
</script>
