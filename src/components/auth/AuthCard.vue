<template>
  <article class="auth-center-card" :class="cardClass">
    <div v-if="showLogo" class="auth-center-card__logo-wrap">
      <LogoBox customClass="auth-center-card__logo" :logo-height="logoHeight" />
      <span v-if="portalEyebrow" class="auth-center-card__portal">{{ portalEyebrow }}</span>
    </div>
    <div v-else class="auth-center-card__icon" aria-hidden="true">
      <i class="bi" :class="icon" />
    </div>

    <h1 class="auth-center-card__title">{{ title }}</h1>
    <p v-if="subtitle?.trim()" class="auth-center-card__subtitle">{{ subtitle }}</p>

    <ul v-if="infoLines.length" class="auth-center-card__tags" role="list">
      <li v-for="(line, idx) in infoLines" :key="idx" role="listitem">
        <i v-if="tagIcons[idx]" class="bi auth-center-card__tag-icon" :class="tagIcons[idx]" aria-hidden="true" />
        <span>{{ line }}</span>
      </li>
    </ul>

    <div class="auth-center-card__body">
      <slot />
    </div>

    <template v-if="$slots.alt || usefulLinks.length">
      <p v-if="$slots.alt && resolvedDivider" class="auth-center-card__divider">
        <span>{{ resolvedDivider }}</span>
      </p>
      <div v-if="$slots.alt" class="auth-center-card__alt">
        <slot name="alt" />
      </div>
      <nav v-if="usefulLinks.length" class="auth-useful-links" aria-label="Useful links">
        <template v-for="(link, idx) in usefulLinks" :key="`${link.label}-${idx}`">
          <a
            v-if="link.href"
            :href="link.href"
            class="auth-useful-links__item"
            :target="link.external ? '_blank' : undefined"
            :rel="link.external ? 'noopener noreferrer' : undefined"
          >
            {{ link.label }}
          </a>
          <router-link
            v-else-if="link.to"
            :to="link.to"
            class="auth-useful-links__item"
          >
            {{ link.label }}
          </router-link>
        </template>
      </nav>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LogoBox from '@/components/LogoBox.vue'
import { authSplitByPortal, type AuthPortal } from '@/config/auth-split'

type Props = {
  title: string
  subtitle?: string
  showLogo?: boolean
  icon?: string
  logoHeight?: number
  otp?: boolean
  wide?: boolean
  infoLines?: string[]
  tagIcons?: string[]
  dividerLabel?: string
  /** When set, shows portal label under logo and useful links from auth-split config. */
  portal?: AuthPortal
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  showLogo: true,
  icon: 'bi-person',
  logoHeight: 40,
  otp: false,
  wide: false,
  infoLines: () => [],
  tagIcons: () => [],
  dividerLabel: '',
})

const { t } = useI18n()

const portalContent = computed(() => (props.portal ? authSplitByPortal[props.portal] : null))
const portalEyebrow = computed(() => portalContent.value?.eyebrow ?? '')
const usefulLinks = computed(() => portalContent.value?.footerLinks ?? [])

const resolvedDivider = computed(() => props.dividerLabel || t('auth.orContinueWith'))

const cardClass = computed(() => ({
  'auth-center-card--otp': props.otp,
  'auth-center-card--wide': props.wide,
}))
</script>
