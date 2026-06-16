<template>
  <AuthLayout>
    <AuthCard :title="t('auth.lockTitle')" :subtitle="t('auth.lockCopy')" show-logo :logo-height="56">
      <div class="text-center">
        <b-button variant="primary" class="auth-center-card__submit w-100" :to="{ name: 'auth.sign-in' }">
          {{ t('auth.lockCta') }}
        </b-button>
      </div>

      <template #alt>
        <router-link :to="{ name: 'auth.sign-up' }" class="auth-alt-btn">{{ t('auth.signUp') }}</router-link>
      </template>
    </AuthCard>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '@/layouts/AuthLayout.vue'
import AuthCard from '@/components/auth/AuthCard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
