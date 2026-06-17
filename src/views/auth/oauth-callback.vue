<template>
  <AuthLayout>
    <AuthCard title="Signing you in" subtitle="Connecting your KKOO Account…" show-logo icon="bi-shield-check">
      <p v-if="error" class="auth-alert auth-alert--danger">{{ error }}</p>
      <p v-else class="text-muted text-center mb-0">{{ t('auth.redirecting') }}</p>
    </AuthCard>
  </AuthLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AuthCard from '@/components/auth/AuthCard.vue'
import { useAuthStore } from '@/stores/auth'
import { consumeOAuthReturnPath, exchangeOAuthCode } from '@/utils/kkooOAuth'
import { resolvePostAuthRedirect } from '@/utils/authRedirect'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()
const error = ref('')

onMounted(async () => {
  const err = String(route.query.error ?? '')
  if (err) {
    error.value = String(route.query.error_description ?? err)
    return
  }
  const code = String(route.query.code ?? '')
  const state = String(route.query.state ?? '')
  if (!code) {
    error.value = 'Missing authorization code'
    return
  }
  try {
    const tokens = await exchangeOAuthCode(code, state)
    await auth.establishSession(
      { access_token: tokens.access_token, refresh_token: tokens.refresh_token },
    )
    const returnTo = consumeOAuthReturnPath()
    const target = resolvePostAuthRedirect(returnTo, auth.defaultRouteAfterAuth())
    await router.replace(target)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Sign-in failed'
  }
})
</script>
