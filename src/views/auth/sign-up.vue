<template>
  <AuthLayout>
    <AuthCard
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :info-lines="signUpInfoLines"
      :tag-icons="signUpTagIcons"
      :logo-height="64"
      wide
      show-logo
    >
      <div class="auth-role-toggle" role="group" :aria-label="t('auth.joinAs')">
        <button
          v-for="opt in roleOptions"
          :key="opt.value"
          type="button"
          class="auth-role-toggle__btn"
          :class="{ 'auth-role-toggle__btn--active': role === opt.value }"
          @click="role = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <b-form class="auth-center-form" @submit.prevent="handleSubmit" novalidate>
        <div v-if="error.length > 0" class="auth-alert auth-alert--danger">{{ error }}</div>

        <AuthField :label="t('auth.phoneNumber')" icon="bi-telephone">
          <b-form-input
            v-model="phone"
            class="auth-field__input"
            type="tel"
            :placeholder="t('auth.phonePlaceholder')"
            autocomplete="tel"
            required
            :aria-label="t('auth.phoneNumber')"
          />
        </AuthField>

        <div class="auth-form-grid auth-form-grid--2">
          <AuthField :label="t('auth.firstName')" icon="bi-person">
            <b-form-input
              v-model="firstName"
              class="auth-field__input"
              type="text"
              :placeholder="t('auth.optional')"
              autocomplete="given-name"
            />
          </AuthField>
          <AuthField :label="t('auth.lastName')" icon="bi-person">
            <b-form-input
              v-model="lastName"
              class="auth-field__input"
              type="text"
              :placeholder="t('auth.optional')"
              autocomplete="family-name"
            />
          </AuthField>
        </div>

        <AuthTermsCheck v-model="acceptTerms" class="auth-terms--centered" />

        <b-button variant="primary" type="submit" class="auth-center-card__submit w-100" :disabled="loading">
          {{ loading ? t('auth.signUpSubmitting') : submitLabel }}
        </b-button>
      </b-form>

      <template #alt>
        <router-link :to="{ name: 'auth.sign-in' }" class="auth-alt-btn">{{ t('auth.signIn') }}</router-link>
      </template>
    </AuthCard>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '@/layouts/AuthLayout.vue'
import AuthCard from '@/components/auth/AuthCard.vue'
import AuthField from '@/components/auth/AuthField.vue'
import AuthTermsCheck from '@/components/auth/AuthTermsCheck.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/api'
import { BUYER_ACCOUNT_ROLE, useAuthStore } from '@/stores/auth'
import type { User } from '@/types/auth'
import { ROLES } from '@/acl'
import { formatApiError } from '@/utils/formatApiError'

type Role = 'buyer' | 'seller'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const role = ref<Role>('buyer')
const phone = ref('')
const firstName = ref('')
const lastName = ref('')
const acceptTerms = ref(false)
const error = ref('')
const loading = ref(false)

const roleOptions = computed(() => [
  { value: 'buyer' as const, label: t('auth.roleBuyer') },
  { value: 'seller' as const, label: t('auth.roleSeller') },
])

const signUpInfoLines = computed(() => [
  t('auth.signUpInfo1'),
  t('auth.signUpInfo2'),
  t('auth.signUpInfo3'),
])

const signUpTagIcons = ['bi-bag', 'bi-phone', 'bi-shield-check']

function parseRoleQuery(q: unknown): Role | null {
  const v = typeof q === 'string' ? q.toLowerCase().trim() : ''
  if (v === 'buyer' || v === 'shopper') return 'buyer'
  if (v === 'seller' || v === 'sell' || v === 'business') return 'seller'
  return null
}

watch(
  () => route.query.as,
  (as) => {
    const r = parseRoleQuery(as)
    if (r) role.value = r
  },
  { immediate: true },
)

watch(role, () => {
  error.value = ''
})

const pageTitle = computed(() =>
  role.value === 'seller' ? t('auth.signUpTitleSeller') : t('auth.signUpTitleBuyer'),
)

const pageSubtitle = computed(() =>
  role.value === 'seller' ? t('auth.signUpCopySeller') : t('auth.signUpCopyBuyer'),
)

const submitLabel = computed(() =>
  role.value === 'seller' ? t('auth.signUpSubmitSeller') : t('auth.signUpSubmitBuyer'),
)

async function handleSubmit() {
  error.value = ''
  if (!phone.value.trim()) {
    error.value = t('auth.phoneRequired')
    return
  }
  if (!acceptTerms.value) {
    error.value = t('auth.acceptTermsRequired')
    return
  }

  loading.value = true
  try {
    const { data } =
      role.value === 'buyer'
        ? await authApi.registerBuyer({
            phone_number: phone.value.trim(),
            first_name: firstName.value.trim() || undefined,
            last_name: lastName.value.trim() || undefined,
          })
        : await authApi.registerSeller({
            phone_number: phone.value.trim(),
            first_name: firstName.value.trim() || undefined,
            last_name: lastName.value.trim() || undefined,
          })

    await auth.completeRegistration({
      ...data,
      user: data.user as User | undefined,
    })

    if (role.value === 'seller' && auth.hasRole(ROLES.SELLER)) {
      auth.setActiveAccountRole(ROLES.SELLER)
    } else if (role.value === 'buyer') {
      auth.setActiveAccountRole(BUYER_ACCOUNT_ROLE)
    }

    await router.push(auth.defaultRouteAfterAuth())
  } catch (e: unknown) {
    const err = e as { message?: string }
    if (String(err.message || '').toLowerCase().includes('not_allowed')) {
      error.value = t('auth.notAllowedPortal')
      return
    }
    error.value = formatApiError(e, t('auth.otpSendFailed'))
  } finally {
    loading.value = false
  }
}
</script>
