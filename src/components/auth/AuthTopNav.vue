<template>
  <header class="auth-split-nav">
    <div class="auth-split-nav__inner">
      <div class="auth-split-nav__brand">
        <LogoBox customClass="auth-split-nav__logo" :logo-height="32" />
        <span class="auth-split-nav__portal">{{ content.eyebrow }}</span>
      </div>

      <nav class="auth-split-nav__links" :aria-label="`${content.eyebrow} navigation`">
        <template v-for="(link, idx) in content.footerLinks" :key="`${link.label}-${idx}`">
          <a
            v-if="link.href"
            :href="link.href"
            class="auth-split-nav__link"
            :class="{ 'auth-split-nav__link--muted': link.variant === 'text' }"
            :target="link.external ? '_blank' : undefined"
            :rel="link.external ? 'noopener noreferrer' : undefined"
          >
            {{ link.label }}
          </a>
          <router-link
            v-else-if="link.to"
            :to="link.to"
            class="auth-split-nav__link"
            :class="{ 'auth-split-nav__link--muted': link.variant === 'text' }"
          >
            {{ link.label }}
          </router-link>
        </template>

        <router-link
          v-if="altAuthRoute"
          :to="altAuthRoute"
          class="auth-split-nav__cta"
        >
          {{ altAuthLabel }}
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LogoBox from '@/components/LogoBox.vue'
import { authSplitByPortal, type AuthPortal } from '@/config/auth-split'

const props = defineProps<{
  portal: AuthPortal
}>()

const route = useRoute()
const { t } = useI18n()

const content = computed(() => authSplitByPortal[props.portal])

const isSignUp = computed(() => route.name === 'auth.sign-up' || route.name === 'auth.seller-register')

const altAuthRoute = computed(() => {
  if (route.name === 'auth.lock-screen' || route.name === 'auth.oauth-callback') return null
  return isSignUp.value ? { name: 'auth.sign-in' } : { name: 'auth.sign-up' }
})

const altAuthLabel = computed(() => (isSignUp.value ? t('auth.signIn') : t('auth.signUp')))
</script>
