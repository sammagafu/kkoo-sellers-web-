<template>
  <VerticalLayout>
    <b-card title="Menu (restaurant)">
      <p class="text-muted mb-3">
        Manage your shareable menu and how it looks. Set <strong>Seller type</strong> to <strong>Restaurant</strong> and a <strong>Menu slug</strong> in your
        <router-link :to="{ name: 'seller.profile' }">Profile</router-link>
        so your menu appears at a friendly URL. Customize card colors below; the API uses these when displaying your menu.
      </p>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-alert v-if="successMessage" variant="success" dismissible show>{{ successMessage }}</b-alert>

      <template v-if="loaded">
        <b-card title="Public menu link" class="mb-4">
          <p class="small text-muted mb-2">Customers and the app use this URL to view your menu (no login).</p>
          <div v-if="menuPublicUrl" class="d-flex align-items-center gap-2 flex-wrap">
            <b-form-input :value="menuPublicUrl" readonly class="flex-grow-1" style="max-width: 400px;" />
            <b-button size="sm" variant="outline-primary" @click="copyMenuUrl">Copy</b-button>
            <b-button size="sm" variant="outline-secondary" :href="menuPublicUrl" target="_blank" rel="noopener noreferrer">Open menu</b-button>
          </div>
          <p v-else class="text-muted mb-0">Set a <strong>Menu / store slug</strong> in your Profile (e.g. my-kitchen) and save to get a shareable menu link.</p>
        </b-card>

        <b-card title="Fullscreen menu screen" class="mb-4">
          <p class="small text-muted mb-3">
            Need a TV-ready loop instead of the full site? Use the dedicated menu screen setup to pick featured items, combos, backgrounds, and timing.
          </p>
          <b-button variant="primary" :to="{ name: 'seller.menu-screen' }">Open menu screen setup</b-button>
        </b-card>

        <b-card title="Menu card colors">
          <p class="small text-muted mb-3">Colors used for menu cards when your menu is displayed (e.g. primary buttons, accents). You can also set these in Profile.</p>
          <b-row>
            <b-col md="6">
              <b-form-group label="Primary color" label-for="menu_card_primary_color">
                <b-form-input id="menu_card_primary_color" v-model="menuCardPrimary" type="color" class="w-auto" />
                <b-form-input v-model="menuCardPrimary" size="sm" class="mt-1" placeholder="#5C308F" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Accent color" label-for="menu_card_accent_color">
                <b-form-input id="menu_card_accent_color" v-model="menuCardAccent" type="color" class="w-auto" />
                <b-form-input v-model="menuCardAccent" size="sm" class="mt-1" placeholder="#F7A829" />
              </b-form-group>
            </b-col>
          </b-row>
          <b-button variant="primary" :disabled="saving" @click="saveColors">Save menu card colors</b-button>
        </b-card>

        <p class="small text-muted mt-3">
          API for displaying menu: <code>GET /menu/public/:slug_or_id</code> — use your <strong>menu_slug</strong> or seller id. Card colors can be sent as query params or stored on your profile and applied by the app when rendering your menu.
        </p>
      </template>
      <p v-else-if="loading" class="text-muted">Loading…</p>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, computed, onMounted } from 'vue'
import { authApi } from '@/api'

const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const successMessage = ref('')
const saving = ref(false)
const profileId = ref<number | string | null>(null)
const menuSlug = ref('')
const menuCardPrimary = ref('#5C308F')
const menuCardAccent = ref('#F7A829')

const apiBase = ((): string => {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined
  const base = env?.VITE_API_BASE_URL
  if (typeof base !== 'string' || !base) return ''
  return base.replace(/\/$/, '')
})()

const menuPublicUrl = computed(() => {
  if (!apiBase) return ''
  const slugOrId = menuSlug.value?.trim() || profileId.value
  if (!slugOrId) return ''
  return `${apiBase}/menu/public/${encodeURIComponent(String(slugOrId))}`
})

function copyMenuUrl() {
  if (!menuPublicUrl.value) return
  navigator.clipboard.writeText(menuPublicUrl.value).then(
    () => {
      successMessage.value = 'Menu link copied.'
      setTimeout(() => { successMessage.value = '' }, 3000)
    },
    () => {}
  )
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await authApi.getSellerProfile()
    const d = (data ?? {}) as Record<string, unknown>
    profileId.value = (d.id != null ? d.id : d.user_id != null ? d.user_id : null) as number | string | null
    menuSlug.value = String(d.menu_slug ?? '')
    menuCardPrimary.value = String(d.menu_card_primary_color ?? '#5C308F')
    menuCardAccent.value = String(d.menu_card_accent_color ?? '#F7A829')
    loaded.value = true
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

async function saveColors() {
  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await authApi.updateSellerProfile({
      menu_card_primary_color: menuCardPrimary.value?.trim() || undefined,
      menu_card_accent_color: menuCardAccent.value?.trim() || undefined,
    })
    successMessage.value = 'Menu card colors saved.'
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to save'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
