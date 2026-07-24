<template>
  <VerticalLayout>
    <b-card title="Seller how-to tour videos">
      <p class="text-muted small mb-3">
        First-time merchants see a guided tour with spotlights and tooltips
        (“Click here to select a vertical…”, “Click here to create a product…”).
        Paste a YouTube or direct video URL for each section — leave blank to show a placeholder.
      </p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-button variant="primary" :disabled="saving" @click="save">
          {{ saving ? 'Saving…' : 'Save videos' }}
        </b-button>
        <b-button variant="outline-secondary" :disabled="loading" @click="load">Refresh</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show dismissible @dismissed="error = ''">{{ error }}</b-alert>
      <b-alert v-if="ok" variant="success" show dismissible @dismissed="ok = ''">{{ ok }}</b-alert>

      <div v-if="loading" class="text-muted py-4">Loading…</div>
      <div v-else class="seller-help-admin">
        <div v-for="sec in sections" :key="sec.key" class="seller-help-admin__row border rounded p-3 mb-3">
          <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
            <div>
              <code class="small">{{ sec.key }}</code>
              <h6 class="mb-0 mt-1">{{ sec.title }}</h6>
            </div>
            <b-form-checkbox v-model="sec.enabledBool" switch>Enabled</b-form-checkbox>
          </div>
          <p class="small text-muted mb-2">{{ sec.body }}</p>
          <b-form-group :label="`Video URL — ${sec.cta_label || 'CTA'}`" class="mb-0">
            <b-form-input
              v-model="sec.video_url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=… or https://…/demo.mp4"
            />
          </b-form-group>
        </div>
      </div>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import {
  getAdminSiteExperience,
  patchSellerHelpTour,
  type SellerHelpTourSection,
} from '@/api/sellerHelpTour'
import { formatApiError } from '@/utils/formatApiError'

type Row = SellerHelpTourSection & { enabledBool: boolean }

const sections = ref<Row[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const ok = ref('')

function toRows(list: SellerHelpTourSection[]): Row[] {
  return list.map((s) => ({
    ...s,
    video_url: s.video_url || '',
    enabledBool: s.enabled !== false,
  }))
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await getAdminSiteExperience()
    sections.value = toRows(data.seller_help_tour?.sections ?? [])
  } catch (e) {
    error.value = formatApiError(e, 'Could not load help tour settings')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  ok.value = ''
  try {
    const payload = sections.value.map((s) => ({
      key: s.key,
      title: s.title,
      body: s.body,
      cta_label: s.cta_label,
      video_url: (s.video_url || '').trim(),
      enabled: s.enabledBool,
      sort_order: s.sort_order,
    }))
    await patchSellerHelpTour(payload)
    ok.value = 'Seller help tour videos saved.'
  } catch (e) {
    error.value = formatApiError(e, 'Could not save')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})
</script>
