<template>
  <VerticalLayout>
    <b-card title="Brands">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <p class="text-muted mb-0 me-auto">Create, edit, delete and verify brands.</p>
        <b-form-input v-model="search" placeholder="Search name/slug..." class="w-auto" style="max-width: 220px;" @input="debouncedLoad" />
        <b-button variant="outline-secondary" size="sm" @click="exportCsv">Export CSV</b-button>
        <b-dropdown variant="outline-secondary" size="sm" text="Import templates" menu-class="shadow-sm">
          <b-dropdown-item @click="downloadApiBrandTemplate">Official template (API)</b-dropdown-item>
          <b-dropdown-item @click="downloadMinimalBrandImportCsv">Minimal example CSV</b-dropdown-item>
        </b-dropdown>
        <b-button variant="outline-primary" size="sm" @click="triggerImportInput">Import CSV/XLSX (multiple)…</b-button>
        <b-button variant="outline-primary" size="sm" :to="{ name: 'admin.catalog.import' }">Import hub</b-button>
        <input
          ref="importInputRef"
          type="file"
          accept=".csv,.xlsx"
          multiple
          title="Select one or more CSV/XLSX files"
          class="d-none"
          @change="onImportFile"
        />
        <b-button variant="primary" @click="openCreate">Create brand</b-button>
        <b-button
          v-if="selected.length"
          variant="outline-danger"
          size="sm"
          @click="bulkDeleteSelected"
        >
          Delete selected ({{ selected.length }})
        </b-button>
      </div>
      <b-alert v-if="error" variant="danger" dismissible show class="mb-0">{{ error }}</b-alert>
      <ImportBatchProgressBar
        :visible="!!importProgress"
        :subtitle="importProgressSubtitle"
        :overall-percent="importProgress?.overallPercent ?? 0"
        :pulse-striped="importProgressPulse"
      />
      <b-alert v-if="importResult" variant="info" show dismissible class="mb-3" @dismissed="importResult = ''">{{ importResult }}</b-alert>
      <b-table
        v-if="displayItems.length"
        :items="displayItems"
        :fields="tableFields"
        striped
        responsive
        selectable
        v-model:selectedItems="selected"
      >
        <template #cell(logo)="data">
          <img
            v-if="brandLogoUrl(data.item)"
            :src="brandLogoUrl(data.item) || ''"
            alt="Logo"
            class="brand-logo-thumb"
            @error="hideBrokenLogo"
          />
          <span v-else class="text-muted">—</span>
        </template>
        <template #cell(verified)="data">
          <b-badge :variant="(data.item.verified ?? data.item.is_verified) ? 'success' : 'secondary'">{{ (data.item.verified ?? data.item.is_verified) ? 'Yes' : 'No' }}</b-badge>
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" class="me-1" @click="openEdit(data.item)">Edit</b-button>
          <b-button
            size="sm"
            :variant="brandVerified(data.item) ? 'outline-warning' : 'outline-success'"
            class="me-1"
            @click="verify(data.item)"
          >
            {{ brandVerified(data.item) ? 'Unverify' : 'Verify' }}
          </b-button>
          <b-button size="sm" variant="outline-danger" @click="confirmDelete(data.item)">Delete</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else />
      <p v-if="displayItems.length" class="text-muted small mt-2">Showing {{ displayItems.length }} brand(s)</p>
    </b-card>

    <b-modal v-model="showModal" :title="editSlug ? 'Edit brand' : 'Create brand'" @hidden="resetForm" @ok="saveBrand">
      <ImageUploadProgressBar
        :visible="logoUploadActive"
        subtitle="Uploading logo…"
        :percent="logoUploadPercent"
        :pulse-striped="logoUploadPulse"
      />
      <b-form>
        <b-form-group label="Name" label-for="brand-name">
          <b-form-input id="brand-name" v-model="form.name" required />
        </b-form-group>
        <b-form-group label="Country of origin (optional)" label-for="brand-country">
          <b-form-input id="brand-country" v-model="form.country_of_origin" />
        </b-form-group>
        <b-form-group label="Logo" label-for="brand-logo">
          <div v-if="form.logo_preview" class="mb-2">
            <img :src="form.logo_preview" alt="Preview" class="brand-logo-preview" />
          </div>
          <b-form-input
            id="brand-logo"
            v-model="form.logo"
            placeholder="Logo URL (e.g. https://... or /media/...)"
          />
          <div class="mt-2">
            <input
              type="file"
              accept="image/*"
              class="form-control"
              @change="onLogoFileChange"
            />
          </div>
        </b-form-group>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import ImportBatchProgressBar from '@/components/ImportBatchProgressBar.vue'
import ImageUploadProgressBar from '@/components/ImageUploadProgressBar.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { catalogAdminApi, usersAdminApi } from '@/api'
import { exportToCsv, downloadCsvTemplate } from '@/composables/useCsv'
import { formatApiError } from '@/utils/formatApiError'
import { useImportBatchProgress } from '@/composables/useImportBatchProgress'
import { useMultipartUploadProgress } from '@/composables/useMultipartUploadProgress'
import { formatImportBatchSummary, runSequentialImports } from '@/utils/sequentialFileImport'
import { brandLogoUrl, resolveAssetUrl } from '@/utils/assetUrl'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'
import { toastSuccess, toastError } from '@/utils/toast'

interface Brand {
  id?: number
  name: string
  slug: string
  country_of_origin?: string
  logo?: string
  logo_url?: string
  verified?: boolean
  is_verified?: boolean
}

const items = ref<Brand[]>([])
const selected = ref<Brand[]>([])
const loading = ref(false)
const error = ref('')
const importResult = ref('')
const search = ref('')
const showModal = ref(false)
const editSlug = ref<string | null>(null)
const editId = ref<number | null>(null)
const form = ref({
  name: '',
  country_of_origin: '',
  logo: '',
  logo_preview: '' as string,
  logo_file: null as File | null,
})
const importInputRef = ref<HTMLInputElement | null>(null)
const { importProgress, importProgressSubtitle, importProgressPulse } = useImportBatchProgress()
const {
  uploadActive: logoUploadActive,
  uploadPercent: logoUploadPercent,
  uploadPulse: logoUploadPulse,
  beginUpload: beginLogoUpload,
  onUploadProgress: onLogoUploadProgress,
  endUpload: endLogoUpload,
} = useMultipartUploadProgress()
let searchDebounce: ReturnType<typeof setTimeout> | null = null

function hideBrokenLogo(e: Event) {
  const el = e.target as HTMLImageElement
  if (el) el.style.display = 'none'
}

const tableFields = [
  { key: 'logo', label: 'Logo' },
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'country_of_origin', label: 'Country' },
  { key: 'verified', label: 'Verified' },
  { key: 'actions', label: 'Actions' },
]

const csvColumns = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'country_of_origin', label: 'Country of origin' },
]

const displayItems = computed(() => items.value)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await catalogAdminApi.listBrands({ search: search.value.trim() || undefined })
    const raw = (Array.isArray(data) ? data : (data as { results?: Brand[] })?.results ?? []) as Brand[]
    items.value = raw.map((b) => ({ ...b, verified: b.is_verified ?? b.verified }))
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = formatApiError(e, 'Failed to load brands')
  } finally {
    loading.value = false
  }
}

function debouncedLoad() {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(load, 350)
}

onMounted(load)

watch(
  () => form.value.logo,
  (url) => {
    if (!form.value.logo_file && url) form.value.logo_preview = resolveAssetUrl(url) ?? ''
  }
)

function exportCsv() {
  const cols = [...csvColumns, { key: 'verified', label: 'Verified' }]
  exportToCsv(
    items.value.map((b) => ({ ...b, verified: (b.verified ?? b.is_verified) ? 'Yes' : 'No' })),
    cols,
    'brands-export.csv'
  )
}

async function downloadApiBrandTemplate() {
  try {
    const { data } = await usersAdminApi.getImportTemplate('brands')
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'brands_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : 'Could not download API template')
  }
}

function downloadMinimalBrandImportCsv() {
  downloadCsvTemplate(
    csvColumns,
    'brands-import-example.csv',
    { name: 'Example Brand', slug: 'example-brand', country_of_origin: 'TZ' },
  )
}

function triggerImportInput() {
  importInputRef.value?.click()
}

async function onImportFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  importResult.value = ''
  error.value = ''
  try {
    const { lines, totalCreated } = await runSequentialImports(
      files,
      async (file, { onUploadProgress }) => {
        const { data } = await catalogAdminApi.importBrands(file, { onUploadProgress })
        return data
      },
      (p) => {
        importProgress.value = p
      },
    )
    importResult.value = formatImportBatchSummary(files.length, lines)
    await load()
    toastSuccess(`Import finished (${totalCreated} total created from ${files.length} file(s))`)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Import failed')
    toastError(error.value)
  }
}

function onLogoFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    form.value.logo_file = file
    form.value.logo_preview = URL.createObjectURL(file)
  }
}

function openCreate() {
  editSlug.value = null
  editId.value = null
  form.value = { name: '', country_of_origin: '', logo: '', logo_preview: '', logo_file: null }
  showModal.value = true
}

async function openEdit(item: Brand) {
  editSlug.value = item.slug
  editId.value = item.id ?? null
  try {
    const { data } = await catalogAdminApi.getBrand(item.slug)
    const d = data as Brand & { logo?: string }
    const preview = d.logo ? (resolveAssetUrl(d.logo) ?? '') : ''
    form.value = {
      name: d.name ?? '',
      country_of_origin: d.country_of_origin ?? '',
      logo: d.logo ?? '',
      logo_preview: preview ?? '',
      logo_file: null,
    }
  } catch {
    form.value = {
      name: item.name,
      country_of_origin: item.country_of_origin ?? '',
      logo: item.logo ?? '',
      logo_preview: item.logo ? (resolveAssetUrl(item.logo) ?? '') : '',
      logo_file: null,
    }
  }
  showModal.value = true
}

function resetForm() {
  if (form.value.logo_preview && form.value.logo_preview.startsWith('blob:')) URL.revokeObjectURL(form.value.logo_preview)
  editSlug.value = null
  editId.value = null
  form.value = { name: '', country_of_origin: '', logo: '', logo_preview: '', logo_file: null }
}

async function saveBrand() {
  if (!form.value.name?.trim()) return
  error.value = ''
  try {
    const hasFile = form.value.logo_file && form.value.logo_file.size > 0
    if (hasFile) {
      beginLogoUpload()
      try {
        const fd = new FormData()
        fd.append('name', form.value.name)
        if (form.value.country_of_origin) fd.append('country_of_origin', form.value.country_of_origin)
        fd.append('logo', form.value.logo_file!)
        if (editSlug.value) {
          await catalogAdminApi.updateBrandWithLogo(editSlug.value, fd, { onUploadProgress: onLogoUploadProgress })
        } else {
          await catalogAdminApi.createBrandWithLogo(fd, { onUploadProgress: onLogoUploadProgress })
        }
      } finally {
        endLogoUpload()
      }
    } else {
      if (editSlug.value) {
        const payload: Record<string, unknown> = { name: form.value.name.trim() }
        if (form.value.country_of_origin?.trim()) payload.country_of_origin = form.value.country_of_origin.trim()
        if (form.value.logo?.trim()) payload.logo = form.value.logo.trim()
        await catalogAdminApi.updateBrand(editSlug.value, payload)
      } else {
        await catalogAdminApi.createBrand({
          name: form.value.name,
          country_of_origin: form.value.country_of_origin || undefined,
          ...(form.value.logo ? { logo: form.value.logo } : {}),
        })
      }
    }
    await load()
    toastSuccess(editSlug.value ? 'Brand updated' : 'Brand created')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Save failed')
    toastError(error.value)
  }
}

function brandVerified(item: Brand): boolean {
  return item.verified === true || item.is_verified === true
}

async function verify(item: Brand) {
  if (!item.slug) return
  try {
    await catalogAdminApi.verifyBrand(item.slug, brandVerified(item) ? 'unverify' : 'verify')
    await load()
    toastSuccess(brandVerified(item) ? 'Brand unverified' : 'Brand verified')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = formatApiError(e, 'Verify failed')
    toastError(error.value)
  }
}

async function confirmDelete(item: Brand) {
  const ok = await confirmDestructiveAction({
    title: 'Delete brand?',
    text: `Delete "${item.name}"? Products linked to this brand may show as unbranded.`,
  })
  if (!ok) return
  try {
    await catalogAdminApi.deactivateBrand(item.slug)
    await load()
    toastSuccess('Brand deactivated')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = formatApiError(e, 'Delete failed')
    toastError(error.value)
  }
}

async function bulkDeleteSelected() {
  const slugs = selected.value.map((b) => b.slug).filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
  if (!slugs.length) return
  const ok = await confirmDestructiveAction({
    title: `Delete ${slugs.length} brands?`,
    text: `This will permanently delete ${slugs.length} brand record(s).`,
  })
  if (!ok) return
  error.value = ''
  try {
    const results = await Promise.allSettled(slugs.map((slug) => catalogAdminApi.deleteBrand(slug)))
    const failed = results.filter((r) => r.status === 'rejected').length
    selected.value = []
    await load()
    if (failed) {
      error.value = `${failed} delete(s) failed. Refresh and try again.`
      toastError(error.value)
    } else {
      toastSuccess('Selected brands deleted')
    }
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Bulk delete failed')
    toastError(error.value)
  }
}
</script>

<style scoped>
.brand-logo-thumb {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 4px;
  background: var(--bs-light, #f8f9fa);
}
.brand-logo-preview {
  max-width: 120px;
  max-height: 80px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid var(--bs-border-color, #dee2e6);
}
</style>
