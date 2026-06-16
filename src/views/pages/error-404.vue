<template>
  <AuthLayout>
    <div class="error-404">
      <div class="error-404__logo">
        <LogoBox customClass="error-404__logo-img" :logo-height="72" />
      </div>

      <p class="error-404__code" aria-hidden="true">404</p>

      <h1 class="error-404__title">{{ t('errors.notFoundTitle') }}</h1>
      <p class="error-404__copy">{{ t('errors.notFoundSubtitle') }}</p>
      <p class="error-404__hint">{{ t('errors.notFoundHint') }}</p>

      <div class="error-404__actions">
        <router-link to="/" class="error-404__btn error-404__btn--primary">
          {{ t('errors.backHome') }}
        </router-link>
        <router-link :to="{ name: 'auth.sign-in' }" class="error-404__btn error-404__btn--ghost">
          {{ t('auth.signIn') }}
        </router-link>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '@/layouts/AuthLayout.vue'
import LogoBox from '@/components/LogoBox.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
