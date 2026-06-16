<template>
  <AuthLayout>
    <AuthCard
      :title="otpSent ? t('auth.verifyTitle') : t('auth.signInWithPhone')"
      :subtitle="otpSent ? t('auth.otpPromptSent') : t('auth.signInSubtitle')"
      :info-lines="otpSent ? [] : signInInfoLines"
      :tag-icons="signInTagIcons"
      show-logo
      :icon="otpSent ? 'bi-shield-lock' : 'bi-box-arrow-in-right'"
      :logo-height="68"
      :otp="otpSent"
    >
      <b-form class="auth-center-form" @submit.prevent="otpSent ? handleVerifyOtp() : handleRequestOtp()" novalidate>
        <div v-if="route.query.reset === 'success'" class="auth-alert auth-alert--success">{{ t('auth.resetSuccess') }}</div>
        <div v-if="route.query.notAllowed === '1'" class="auth-alert auth-alert--warning">{{ t('auth.notAllowedPortal') }}</div>
        <div v-if="route.query.registered === 'seller'" class="auth-alert auth-alert--success">{{ t('auth.sellerRegistered') }}</div>
        <div v-if="successMessage" class="auth-alert auth-alert--success">{{ successMessage }}</div>
        <div v-if="error.length > 0" class="auth-alert auth-alert--danger">{{ error }}</div>

        <AuthField :label="t('auth.phoneNumber')" icon="bi-telephone">
          <b-form-input
            v-model="phone"
            class="auth-field__input"
            type="tel"
            :placeholder="t('auth.phonePlaceholder')"
            autocomplete="tel"
            :readonly="otpSent"
            :aria-label="t('auth.phoneNumber')"
          />
        </AuthField>

        <template v-if="otpSent">
          <AuthField :label="t('auth.otpCode')" icon="bi-key" otp>
            <b-form-input
              v-model="otpCode"
              class="auth-field__input auth-field__input--otp"
              type="text"
              inputmode="numeric"
              :placeholder="t('auth.otpPlaceholder')"
              maxlength="8"
              autocomplete="one-time-code"
              :aria-label="t('auth.otpCode')"
            />
          </AuthField>
          <p class="auth-center-form__links">
            <button type="button" class="auth-text-link" :disabled="loading" @click.prevent="otpSent = false; otpCode = ''; error = ''">
              {{ t('auth.useDifferentNumber') }}
            </button>
            <button
              type="button"
              class="auth-text-link"
              :disabled="loading || resendCooldownSec > 0"
              @click.prevent="handleResendOtp"
            >
              {{ resendCooldownSec > 0 ? `${t('auth.resendOtp')} (${resendCooldownSec}s)` : t('auth.resendOtp') }}
            </button>
          </p>
        </template>

        <b-button variant="primary" type="submit" class="auth-center-card__submit w-100" :disabled="submitDisabled">
          {{ submitLabel }}
        </b-button>
      </b-form>

      <template #alt>
        <router-link :to="{ name: 'auth.sign-up' }" class="auth-alt-btn">{{ t('auth.signUp') }}</router-link>
        <router-link :to="{ name: 'auth.sign-up', query: { as: 'seller' } }" class="auth-alt-btn">{{ t('auth.registerAsSeller') }}</router-link>
      </template>
    </AuthCard>

    <b-modal id="backup-codes-modal" v-model="showBackupCodes" title="Backup codes" hide-footer centered>
      <p class="mb-2">
        Save these codes offline. If you can’t receive OTP messages, you can use one of these codes to sign in.
        <strong>Each code works once.</strong>
      </p>
      <div class="backup-codes-grid mb-2">
        <div
          v-for="(code, index) in backupCodesList"
          :key="`${index}-${code}`"
          class="backup-code-tile border rounded d-flex align-items-center gap-2 px-3 py-2 mb-2"
        >
          <span class="backup-code-index rounded-circle flex-shrink-0">{{ index + 1 }}</span>
          <code class="backup-code-value flex-grow-1 mb-0">{{ code }}</code>
        </div>
      </div>
      <div class="d-flex gap-2 justify-content-end">
        <b-button variant="outline-primary" @click="copyBackupCodes">Copy</b-button>
        <b-button variant="primary" @click="continueAfterBackupCodes">Continue</b-button>
      </div>
    </b-modal>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '@/layouts/AuthLayout.vue'
import AuthCard from '@/components/auth/AuthCard.vue'
import AuthField from '@/components/auth/AuthField.vue'
import { ref, computed } from 'vue'
import { saveStoredBackupCodes } from '@/utils/backupCodesStorage'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api'
import { toastError, toastSuccess } from '@/utils/toast'

const phone = ref('')
const otpCode = ref('')
const error = ref('')
const successMessage = ref('')
const loading = ref(false)
const redirecting = ref(false)
const otpSent = ref(false)
const resendCooldownSec = ref(0)
const showBackupCodes = ref(false)
const backupCodesList = ref<string[]>([])

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const signInInfoLines = computed(() => [
  t('auth.signInInfo1'),
  t('auth.signInInfo2'),
  t('auth.signInInfo3'),
])

const signInTagIcons = ['bi-shield-check', 'bi-phone', 'bi-shop']

const submitDisabled = computed(() => {
  if (loading.value || redirecting.value) return true
  return otpSent.value ? !otpCode.value.trim() : !phone.value.trim()
})

const submitLabel = computed(() => {
  if (redirecting.value) return t('auth.redirecting')
  if (loading.value) return otpSent.value ? t('auth.verifying') : t('auth.sending')
  return otpSent.value ? t('auth.verifyAndSignIn') : t('auth.getStarted')
})

let resendTimer: ReturnType<typeof setInterval> | null = null

function startResendCooldown(sec = 30) {
  resendCooldownSec.value = sec
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendCooldownSec.value -= 1
    if (resendCooldownSec.value <= 0 && resendTimer) {
      clearInterval(resendTimer)
      resendTimer = null
    }
  }, 1000)
}

async function handleRequestOtp() {
  error.value = ''
  successMessage.value = ''
  if (!phone.value.trim()) {
    error.value = t('auth.phoneRequired')
    return
  }
  loading.value = true
  try {
    await authApi.requestOtp(phone.value.trim())
    otpSent.value = true
    successMessage.value = t('auth.otpSent')
    startResendCooldown()
  } catch {
    error.value = t('auth.otpSendFailed')
  } finally {
    loading.value = false
  }
}

async function handleVerifyOtp() {
  error.value = ''
  if (!otpCode.value.trim()) {
    error.value = t('auth.otpRequired')
    return
  }
  loading.value = true
  try {
    await auth.loginWithOtp(phone.value.trim(), otpCode.value.trim())
    const codes = auth.pendingBackupCodes
    if (codes?.length) {
      backupCodesList.value = [...codes]
      showBackupCodes.value = true
      saveStoredBackupCodes(auth.user?.id, codes)
      loading.value = false
      return
    }
    redirecting.value = true
    toastSuccess(t('auth.signInSuccess'))
    await router.push(auth.defaultRouteAfterAuth())
  } catch (e: unknown) {
    const msg = String((e as Error)?.message || '')
    if (msg.toLowerCase().includes('not_allowed')) {
      error.value = t('auth.notAllowedPortal')
    } else {
      error.value = t('auth.otpInvalidOrExpired')
    }
    loading.value = false
  }
}

async function handleResendOtp() {
  if (resendCooldownSec.value > 0) return
  await handleRequestOtp()
}

async function continueAfterBackupCodes() {
  showBackupCodes.value = false
  auth.clearPendingBackupCodes()
  redirecting.value = true
  try {
    toastSuccess(t('auth.signInSuccess'))
    await router.push(auth.defaultRouteAfterAuth())
  } catch {
    toastError('Could not continue. Try signing in again.')
    redirecting.value = false
  }
}

function copyBackupCodes() {
  const text = backupCodesList.value.join('\n')
  navigator.clipboard?.writeText(text).then(() => toastSuccess('Copied'))
}
</script>
