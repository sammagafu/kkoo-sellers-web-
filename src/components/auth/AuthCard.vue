<template>
  <article class="auth-center-card" :class="cardClass">
    <div v-if="showLogo" class="auth-center-card__logo-wrap" aria-hidden="true">
      <LogoBox customClass="auth-center-card__logo" :logo-height="logoHeight" />
    </div>
    <div v-else class="auth-center-card__icon" aria-hidden="true">
      <i class="bi" :class="icon" />
    </div>

    <p v-if="showLogo" class="auth-center-card__kicker">{{ t('auth.brandKicker') }}</p>
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

    <template v-if="$slots.alt">
      <p class="auth-center-card__divider">
        <span>{{ dividerLabel }}</span>
      </p>
      <div class="auth-center-card__alt">
        <slot name="alt" />
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LogoBox from '@/components/LogoBox.vue'

type Props = {
  title: string
  subtitle?: string
  icon?: string
  showLogo?: boolean
  logoHeight?: number
  wide?: boolean
  otp?: boolean
  dividerLabel?: string
  infoLines?: string[]
  tagIcons?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  icon: 'bi-box-arrow-in-right',
  showLogo: true,
  logoHeight: 68,
  wide: false,
  otp: false,
  dividerLabel: '',
  infoLines: () => [],
  tagIcons: () => [],
})

const { t } = useI18n()

const cardClass = computed(() => ({
  'auth-center-card--wide': props.wide,
  'auth-center-card--otp': props.otp,
}))

const dividerLabel = computed(() => props.dividerLabel || t('auth.orContinueWith'))
</script>
