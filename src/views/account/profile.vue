<template>
  <VerticalLayout>
    <b-card title="Account profile">
      <p class="text-muted">Update your name, photo, and contact details. These are used across your buyer account and any KKOO workspaces you can open.</p>
      <b-alert v-if="successMessage" variant="success" dismissible show>{{ successMessage }}</b-alert>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-form v-if="loaded" @submit.prevent="save">
        <div class="d-flex flex-column flex-sm-row align-items-center gap-3 mb-4">
          <div class="position-relative flex-shrink-0">
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              alt=""
              class="rounded-circle object-fit-cover border"
              width="96"
              height="96"
            />
            <div
              v-else
              class="profile-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
            >
              {{ initials }}
            </div>
            <span
              v-if="avatarUploading"
              class="position-absolute top-50 start-50 translate-middle spinner-border spinner-border-sm text-primary"
              role="status"
            />
          </div>
          <div class="text-center text-sm-start">
            <b-button variant="outline-primary" size="sm" :disabled="avatarUploading" @click="triggerAvatarPick">
              {{ avatarPreview ? 'Change photo' : 'Upload photo' }}
            </b-button>
            <input
              ref="avatarInput"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              class="d-none"
              @change="onAvatarSelected"
            />
            <p class="text-muted small mb-0 mt-2">JPEG, PNG, GIF or WebP. Max 5 MB.</p>
          </div>
        </div>

        <b-row>
          <b-col md="6">
            <b-form-group label="First name" label-for="first_name">
              <b-form-input id="first_name" v-model="form.first_name" placeholder="First name" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Last name" label-for="last_name">
              <b-form-input id="last_name" v-model="form.last_name" placeholder="Last name" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Email" label-for="email">
              <b-form-input id="email" v-model="form.email" type="email" placeholder="Email" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Phone number" label-for="phone_number">
              <b-form-input id="phone_number" v-model="form.phone_number" type="tel" placeholder="+255..." readonly disabled class="bg-light" />
              <p class="text-muted small mb-0 mt-1">Phone cannot be changed here. Contact support if needed.</p>
            </b-form-group>
          </b-col>
        </b-row>
        <b-button type="submit" variant="primary" :disabled="saving">Save profile</b-button>
        <div class="mt-4 pt-3 border-top">
          <p class="text-muted small mb-2">Sign-in backup codes (if SMS OTP is unavailable)</p>
          <router-link :to="{ name: 'account.backup-codes' }" class="btn btn-outline-secondary btn-sm">
            View backup codes
          </router-link>
        </div>
      </b-form>
      <p v-else-if="loading" class="text-muted">Loading…</p>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/api'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { formatApiError } from '@/utils/formatApiError'
import { toastSuccess, toastError } from '@/utils/toast'

const auth = useAuthStore()
const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const successMessage = ref('')
const saving = ref(false)
const avatarUploading = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarUrl = ref('')

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
})

const initials = computed(() => {
  const a = form.first_name.trim()[0] ?? ''
  const b = form.last_name.trim()[0] ?? ''
  const s = `${a}${b}`.toUpperCase()
  return s || '?'
})

const avatarPreview = computed(() => resolveAssetUrl(avatarUrl.value) ?? '')

function applyUserFields(u: Record<string, unknown> | null | undefined) {
  if (!u) return
  form.first_name = String(u.first_name ?? '')
  form.last_name = String(u.last_name ?? '')
  form.email = String(u.email ?? '')
  form.phone_number = String(u.phone_number ?? '')
  avatarUrl.value = String(u.avatar_url ?? u.avatar ?? '')
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    applyUserFields(auth.user as Record<string, unknown>)
    loaded.value = true
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load profile')
  } finally {
    loading.value = false
  }
})

function triggerAvatarPick() {
  avatarInput.value?.click()
}

async function onAvatarSelected(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  avatarUploading.value = true
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('avatar', file)
    const { data } = await userApi.uploadAvatar(fd)
    const d = data as { avatar_url?: string; avatar?: string; user?: Record<string, unknown> }
    const url = String(d.avatar_url ?? d.avatar ?? '')
    if (url) avatarUrl.value = url
    if (d.user && auth.user) {
      auth.setUser({ ...auth.user, ...d.user, avatar_url: url, avatar: url })
    } else if (auth.user && url) {
      auth.setUser({ ...auth.user, avatar_url: url, avatar: url })
    }
    toastSuccess('Profile photo updated')
  } catch (e: unknown) {
    toastError(formatApiError(e, 'Could not upload photo'))
  } finally {
    avatarUploading.value = false
  }
}

async function save() {
  error.value = ''
  successMessage.value = ''
  saving.value = true
  try {
    await userApi.updateMe({
      first_name: form.first_name.trim() || undefined,
      last_name: form.last_name.trim() || undefined,
      email: form.email.trim() || undefined,
    })
    if (auth.user) {
      auth.setUser({
        ...auth.user,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        avatar_url: avatarUrl.value,
        avatar: avatarUrl.value,
      })
    }
    successMessage.value = 'Profile saved successfully.'
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } }; message?: string }
    error.value = err.response?.data?.detail ?? err.message ?? 'Save failed'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-avatar-placeholder {
  width: 96px;
  height: 96px;
  font-size: 1.75rem;
  font-weight: 700;
  background: var(--bs-primary-bg-subtle, #f0e8f5);
  color: var(--bs-primary, #6b2d8a);
}
</style>
