<template>
  <VerticalLayout>
    <b-card :title="t('catalogImport.hubTitle')" class="shadow-sm border-0">
      <p class="text-muted mb-0">{{ t('catalogImport.hubLead') }}</p>
      <p class="text-muted small mb-3">
        <span v-if="sellerImportFromToken">{{ t('catalogImport.hubNoteSeller') }}</span>
        <span v-else>{{ t('catalogImport.hubNoteStaff') }}</span>
        {{ t('catalogImport.hubNoteUsers') }}
      </p>

      <ImportBatchProgressPanel
        :visible="!!importProgress || importing"
        :subtitle="importProgressSubtitle || (importing ? t('catalogImport.starting') : '')"
        :overall-percent="importProgress?.overallPercent ?? (importing ? 0 : 0)"
        :pulse-striped="importProgressPulse || importing"
        :lines="importPanelLines"
      />

      <b-tabs v-model="activeTab" content-class="pt-3" card>
        <b-tab :title="t('catalogImport.tabProducts')">
          <p class="text-muted small">
            <code>{{ productImportEndpoint }}</code> — {{ t('catalogImport.productsHint') }}
          </p>
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-button variant="outline-secondary" size="sm" @click="downloadProductTemplate">{{ t('catalogImport.downloadApiTemplate') }}</b-button>
            <b-button variant="outline-secondary" size="sm" @click="downloadProductTemplateMinimal">{{ t('catalogImport.downloadMinimalCsv') }}</b-button>
            <b-button variant="primary" size="sm" :disabled="importing" @click="triggerProductImport">
              {{ importing ? t('catalogImport.importing') : t('catalogImport.chooseSpreadsheets') }}
            </b-button>
            <b-button variant="outline-primary" size="sm" :to="{ name: 'admin.catalog.products' }">{{ t('catalogImport.productsList') }}</b-button>
          </div>
          <input
            ref="productImportRef"
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            class="d-none"
            :title="t('catalogImport.filePickerSpreadsheets')"
            @change="onImportProducts"
          />
          <b-alert v-if="productResult" variant="info" show dismissible class="mb-0" @dismissed="productResult = ''">
            {{ productResult }}
          </b-alert>
        </b-tab>

        <b-tab :title="t('catalogImport.tabImages')">
          <p class="text-muted small mb-2">{{ t('catalogImport.imagesHint') }}</p>
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-button variant="primary" size="sm" :disabled="importing" @click="triggerImageImport">
              {{ importing ? t('catalogImport.uploading') : t('catalogImport.chooseImages') }}
            </b-button>
            <b-button variant="outline-primary" size="sm" :to="{ name: 'admin.catalog.products' }">{{ t('catalogImport.productsList') }}</b-button>
          </div>
          <input
            ref="imageImportRef"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
            multiple
            class="d-none"
            :title="t('catalogImport.filePickerImages')"
            @change="onImportImages"
          />
          <b-alert v-if="imageResult" variant="info" show dismissible class="mb-0" @dismissed="imageResult = ''">
            {{ imageResult }}
          </b-alert>
        </b-tab>

        <b-tab :title="t('catalogImport.tabCategories')">
          <p class="text-muted small">
            <code>POST /catalog/admin/import/categories/</code> — {{ t('catalogImport.categoriesHint') }}
          </p>
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-button variant="outline-secondary" size="sm" @click="downloadCategoryTemplate">{{ t('catalogImport.downloadApiTemplate') }}</b-button>
            <b-button variant="outline-secondary" size="sm" @click="downloadCategoryTemplateMinimal">{{ t('catalogImport.downloadMinimalCsv') }}</b-button>
            <b-button variant="primary" size="sm" @click="triggerCategoryImport">{{ t('catalogImport.chooseFiles') }}</b-button>
            <b-button variant="outline-primary" size="sm" :to="{ name: 'admin.catalog.categories' }">{{ t('catalogImport.categoriesList') }}</b-button>
          </div>
          <input
            ref="categoryImportRef"
            type="file"
            :accept="EXCEL_ACCEPT"
            multiple
            class="d-none"
            :title="t('catalogImport.filePickerSpreadsheets')"
            @change="onImportCategories"
          />
          <b-alert v-if="categoryResult" variant="info" show dismissible class="mb-0" @dismissed="categoryResult = ''">
            {{ categoryResult }}
          </b-alert>
        </b-tab>

        <b-tab :title="t('catalogImport.tabBrands')">
          <p class="text-muted small">
            <code>POST /catalog/admin/import/brands/</code> — {{ t('catalogImport.brandsHint') }}
          </p>
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-button variant="outline-secondary" size="sm" @click="downloadBrandTemplate">{{ t('catalogImport.downloadApiTemplate') }}</b-button>
            <b-button variant="outline-secondary" size="sm" @click="downloadBrandTemplateMinimal">{{ t('catalogImport.downloadMinimalCsv') }}</b-button>
            <b-button variant="primary" size="sm" @click="triggerBrandImport">{{ t('catalogImport.chooseFiles') }}</b-button>
            <b-button variant="outline-primary" size="sm" :to="{ name: 'admin.catalog.brands' }">{{ t('catalogImport.brandsList') }}</b-button>
          </div>
          <input
            ref="brandImportRef"
            type="file"
            :accept="EXCEL_ACCEPT"
            multiple
            class="d-none"
            :title="t('catalogImport.filePickerSpreadsheets')"
            @change="onImportBrands"
          />
          <b-alert v-if="brandResult" variant="info" show dismissible class="mb-0" @dismissed="brandResult = ''">
            {{ brandResult }}
          </b-alert>
        </b-tab>

        <b-tab :title="t('catalogImport.tabUsers')">
          <p class="text-muted small">
            <code>POST /users/admin/import/users/</code> — {{ t('catalogImport.usersHint') }}
          </p>
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-button variant="outline-secondary" size="sm" @click="downloadUserTemplate">{{ t('catalogImport.downloadApiTemplate') }}</b-button>
            <b-button variant="outline-secondary" size="sm" @click="downloadUserTemplateFallback">{{ t('catalogImport.downloadMinimalCsv') }}</b-button>
            <b-button variant="primary" size="sm" @click="triggerUserImport">{{ t('catalogImport.chooseFiles') }}</b-button>
            <b-button variant="outline-primary" size="sm" :to="{ name: 'admin.users' }">{{ t('catalogImport.usersList') }}</b-button>
          </div>
          <input
            ref="userImportRef"
            type="file"
            :accept="EXCEL_ACCEPT"
            multiple
            class="d-none"
            :title="t('catalogImport.filePickerSpreadsheets')"
            @change="onImportUsers"
          />
          <b-alert v-if="userResult" variant="info" show dismissible class="mb-0" @dismissed="userResult = ''">
            {{ userResult }}
          </b-alert>
        </b-tab>
      </b-tabs>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import ImportBatchProgressPanel from '@/components/ImportBatchProgressPanel.vue'
import type { ImportBatchLine } from '@/components/ImportBatchProgressPanel.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { catalogAdminApi, usersAdminApi } from '@/api'
import { catalogImportUsesSellerFromToken, importCatalogProducts } from '@/utils/catalogProductImport'
import {
  formatMediaImportSummary,
  runSequentialProductMediaImports,
  type MediaImportItemResult,
} from '@/utils/catalogMediaBulkImport'
import { downloadCsvTemplate } from '@/composables/useCsv'
import { useImportBatchProgress } from '@/composables/useImportBatchProgress'
import {
  formatImportBatchSummary,
  importSummaryLinesFromStrings,
  runSequentialImports,
} from '@/utils/sequentialFileImport'
import { toastError, toastSuccess } from '@/utils/toast'

const { t } = useI18n()

const EXCEL_ACCEPT = '.csv,.xlsx,.xls'

const activeTab = ref(0)
const sellerImportFromToken = computed(() => catalogImportUsesSellerFromToken())
const productImportEndpoint = computed(() =>
  sellerImportFromToken.value ? 'POST /catalog/seller/import/catalog/' : 'POST /catalog/admin/import/catalog/',
)
const { importProgress, importProgressSubtitle, importProgressPulse } = useImportBatchProgress()
const productImportRef = ref<HTMLInputElement | null>(null)
const imageImportRef = ref<HTMLInputElement | null>(null)
const categoryImportRef = ref<HTMLInputElement | null>(null)
const brandImportRef = ref<HTMLInputElement | null>(null)
const userImportRef = ref<HTMLInputElement | null>(null)
const productResult = ref('')
const imageResult = ref('')
const categoryResult = ref('')
const brandResult = ref('')
const userResult = ref('')
const importing = ref(false)
const importPanelLines = ref<ImportBatchLine[]>([])

function triggerImageImport() {
  imageImportRef.value?.click()
}

function mediaResultLines(results: MediaImportItemResult[]): ImportBatchLine[] {
  return results.map((r) => ({
    label: r.fileName,
    text: r.ok ? `${r.productSlug}: ${r.message}` : `${r.productSlug || '?'}: ${r.message}`,
    ok: r.ok,
  }))
}

function triggerProductImport() {
  productImportRef.value?.click()
}
function triggerCategoryImport() {
  categoryImportRef.value?.click()
}
function triggerBrandImport() {
  brandImportRef.value?.click()
}
function triggerUserImport() {
  userImportRef.value?.click()
}

async function downloadProductTemplate() {
  try {
    const { data } = await usersAdminApi.getImportTemplate('catalog')
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'catalog_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : t('catalogImport.toastTemplateDownloadFailed'))
  }
}

function downloadProductTemplateMinimal() {
  downloadCsvTemplate(
    [
      { key: 'seller_id', label: 'seller_id' },
      { key: 'title', label: 'title' },
      { key: 'base_price', label: 'base_price' },
      { key: 'category_slug', label: 'category_slug' },
      { key: 'brand_slug', label: 'brand_slug' },
      { key: 'slug', label: 'slug' },
      { key: 'description', label: 'description' },
      { key: 'sku_code', label: 'sku_code' },
      { key: 'stock_quantity', label: 'stock_quantity' },
    ],
    'catalog-import-example.csv',
    {
      seller_id: '1',
      title: 'Example Product',
      base_price: '99.99',
      category_slug: '',
      brand_slug: '',
      slug: '',
      description: '',
      sku_code: '',
      stock_quantity: '0',
    },
  )
}

async function downloadCategoryTemplate() {
  try {
    const { data } = await usersAdminApi.getImportTemplate('categories')
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'categories_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : t('catalogImport.toastTemplateDownloadFailed'))
  }
}

function downloadCategoryTemplateMinimal() {
  downloadCsvTemplate(
    [
      { key: 'name', label: 'name' },
      { key: 'slug', label: 'slug' },
      { key: 'parent', label: 'parent' },
      { key: 'description', label: 'description' },
      { key: 'icon', label: 'icon' },
    ],
    'categories-import-example.csv',
    {
      name: 'Electronics',
      slug: 'electronics',
      parent: '',
      description: 'Top-level category',
      icon: '',
    },
  )
}

async function downloadBrandTemplate() {
  try {
    const { data } = await usersAdminApi.getImportTemplate('brands')
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'brands_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : t('catalogImport.toastTemplateDownloadFailed'))
  }
}

function downloadBrandTemplateMinimal() {
  downloadCsvTemplate(
    [
      { key: 'name', label: 'name' },
      { key: 'slug', label: 'slug' },
      { key: 'country_of_origin', label: 'country_of_origin' },
    ],
    'brands-import-example.csv',
    { name: 'Example Brand', slug: 'example-brand', country_of_origin: 'TZ' },
  )
}

async function downloadUserTemplate() {
  try {
    const { data } = await usersAdminApi.getImportTemplate('users')
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : t('catalogImport.toastTemplateDownloadFailed'))
  }
}

function downloadUserTemplateFallback() {
  downloadCsvTemplate(
    [
      { key: 'phone_number', label: 'phone_number' },
      { key: 'email', label: 'email' },
      { key: 'full_name', label: 'full_name' },
      { key: 'account_status', label: 'account_status' },
      { key: 'is_seller', label: 'is_seller' },
      { key: 'roles_csv', label: 'roles_csv' },
    ],
    'users-import-example.csv',
    {
      phone_number: '+255700000000',
      email: 'user@example.com',
      full_name: 'John Doe',
      account_status: 'active',
      is_seller: 'No',
      roles_csv: 'buyer',
    },
  )
}

async function onImportProducts(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  productResult.value = ''
  importPanelLines.value = []
  importing.value = true
  try {
    const { lines, totalCreated } = await runSequentialImports(
      files,
      async (file, { onUploadProgress }) => {
        const { data } = await importCatalogProducts(file, { onUploadProgress })
        return data
      },
      (p) => {
        importProgress.value = p
      },
    )
    importPanelLines.value = importSummaryLinesFromStrings(lines)
    productResult.value = formatImportBatchSummary(files.length, lines)
    toastSuccess(t('catalogImport.toastImportFinished', { created: totalCreated, files: files.length }))
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : t('catalogImport.toastImportFailed'))
  } finally {
    importing.value = false
  }
}

async function onImportImages(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  imageResult.value = ''
  importPanelLines.value = []
  importing.value = true
  importProgress.value = {
    currentFileIndex: 0,
    totalFiles: files.length,
    currentFileName: files[0]?.name ?? '',
    fileUploadPercent: null,
    overallPercent: 0,
    uploadIndeterminate: true,
  }
  try {
    const { results, uploaded } = await runSequentialProductMediaImports(files, {
      onProgress: (p) => {
        if (p) {
          importProgress.value = {
            currentFileIndex: p.currentIndex,
            totalFiles: p.total,
            currentFileName: p.currentFileName,
            fileUploadPercent: p.fileUploadPercent,
            overallPercent: p.overallPercent,
            uploadIndeterminate: p.uploadIndeterminate,
          }
        } else {
          importProgress.value = null
        }
      },
    })
    importPanelLines.value = mediaResultLines(results)
    imageResult.value = formatMediaImportSummary(results)
    toastSuccess(t('catalogImport.toastImagesUploaded', { ok: uploaded, total: files.length }))
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : t('catalogImport.toastImageImportFailed'))
  } finally {
    importing.value = false
  }
}

async function onImportCategories(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  categoryResult.value = ''
  try {
    const { lines, totalCreated } = await runSequentialImports(
      files,
      async (file, { onUploadProgress }) => {
        const { data } = await catalogAdminApi.importCategories(file, { onUploadProgress })
        return data
      },
      (p) => {
        importProgress.value = p
      },
    )
    categoryResult.value = formatImportBatchSummary(files.length, lines)
    toastSuccess(t('catalogImport.toastImportFinished', { created: totalCreated, files: files.length }))
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : t('catalogImport.toastImportFailed'))
  }
}

async function onImportBrands(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  brandResult.value = ''
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
    brandResult.value = formatImportBatchSummary(files.length, lines)
    toastSuccess(t('catalogImport.toastImportFinished', { created: totalCreated, files: files.length }))
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : t('catalogImport.toastImportFailed'))
  }
}

async function onImportUsers(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  userResult.value = ''
  try {
    const { lines, totalCreated } = await runSequentialImports(
      files,
      async (file, { onUploadProgress }) => {
        const { data } = await usersAdminApi.importUsers(file, { onUploadProgress })
        return data
      },
      (p) => {
        importProgress.value = p
      },
    )
    userResult.value = formatImportBatchSummary(files.length, lines)
    toastSuccess(t('catalogImport.toastUserImportFinished', { created: totalCreated, files: files.length }))
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : t('catalogImport.toastImportFailed'))
  }
}
</script>
