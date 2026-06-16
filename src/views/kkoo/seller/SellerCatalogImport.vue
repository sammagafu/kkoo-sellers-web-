<template>
  <VerticalLayout>
    <b-card :title="t('catalogImport.sellerTitle')">
      <p class="text-muted mb-2">{{ t('catalogImport.sellerLead') }}</p>
      <ImportBatchProgressPanel
        :visible="!!importProgress || importing"
        :subtitle="importProgressSubtitle || (importing ? t('catalogImport.working') : '')"
        :overall-percent="importProgress?.overallPercent ?? 0"
        :pulse-striped="importProgressPulse || importing"
        :lines="importPanelLines"
      />
      <b-tabs content-class="pt-3" card>
        <b-tab :title="t('catalogImport.sellerTabCatalog')">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-dropdown variant="outline-secondary" size="sm" :text="t('catalogImport.sellerTemplates')" menu-class="shadow-sm">
              <b-dropdown-item @click="downloadOfficialCatalogTemplate">{{ t('catalogImport.sellerOfficialTemplate') }}</b-dropdown-item>
              <b-dropdown-item @click="downloadGeneratedSellerTemplate">{{ t('catalogImport.sellerExampleCsv') }}</b-dropdown-item>
            </b-dropdown>
            <b-button variant="primary" size="sm" :disabled="importing" @click="triggerCatalogInput">
              {{ importing ? t('catalogImport.importing') : t('catalogImport.sellerChooseSpreadsheets') }}
            </b-button>
          </div>
          <input
            ref="catalogInputRef"
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            class="d-none"
            @change="onImportCatalog"
          />
        </b-tab>
        <b-tab :title="t('catalogImport.sellerTabImages')">
          <p class="text-muted small">{{ t('catalogImport.sellerImageHint') }}</p>
          <b-button variant="primary" size="sm" :disabled="importing" @click="triggerImageInput">
            {{ importing ? t('catalogImport.uploading') : t('catalogImport.chooseImages') }}
          </b-button>
          <input
            ref="imageInputRef"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
            multiple
            class="d-none"
            @change="onImportImages"
          />
        </b-tab>
      </b-tabs>
      <b-alert v-if="importResult" variant="info" show dismissible class="mt-3 mb-0" @dismissed="importResult = ''">
        {{ importResult }}
      </b-alert>
      <b-button variant="outline-primary" size="sm" class="mt-3" :to="{ name: 'seller.products' }">{{ t('catalogImport.backToProducts') }}</b-button>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import ImportBatchProgressPanel from '@/components/ImportBatchProgressPanel.vue'
import type { ImportBatchLine } from '@/components/ImportBatchProgressPanel.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usersAdminApi } from '@/api'
import {
  formatMediaImportSummary,
  runSequentialProductMediaImports,
  type MediaImportItemResult,
} from '@/utils/catalogMediaBulkImport'
import { importCatalogProducts } from '@/utils/catalogProductImport'
import { downloadCsvTemplate } from '@/composables/useCsv'
import { useImportBatchProgress } from '@/composables/useImportBatchProgress'
import {
  formatImportBatchSummary,
  importSummaryLinesFromStrings,
  runSequentialImports,
} from '@/utils/sequentialFileImport'
import { formatApiError } from '@/utils/formatApiError'
import { toastError, toastSuccess } from '@/utils/toast'

const { t } = useI18n()

const { importProgress, importProgressSubtitle, importProgressPulse } = useImportBatchProgress()
const catalogInputRef = ref<HTMLInputElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const importResult = ref('')
const importing = ref(false)
const importPanelLines = ref<ImportBatchLine[]>([])

function triggerCatalogInput() {
  catalogInputRef.value?.click()
}
function triggerImageInput() {
  imageInputRef.value?.click()
}

function mediaResultLines(results: MediaImportItemResult[]): ImportBatchLine[] {
  return results.map((r) => ({
    label: r.fileName,
    text: r.ok ? `${r.productSlug}: ${r.message}` : `${r.productSlug || '?'}: ${r.message}`,
    ok: r.ok,
  }))
}

async function downloadOfficialCatalogTemplate() {
  try {
    const { data } = await usersAdminApi.getImportTemplate('catalog')
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'catalog_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : t('common.couldNotDownloadTemplate'))
  }
}

function downloadGeneratedSellerTemplate() {
  downloadCsvTemplate(
    [
      { key: 'title', label: 'title' },
      { key: 'slug', label: 'slug' },
      { key: 'description', label: 'description' },
      { key: 'base_price', label: 'base_price' },
      { key: 'stock_quantity', label: 'stock_quantity' },
      { key: 'category_slug', label: 'category_slug' },
      { key: 'brand_slug', label: 'brand_slug' },
      { key: 'sku_code', label: 'sku_code' },
    ],
    'catalog-seller-example.csv',
    {
      title: 'Example product',
      slug: 'example-product',
      description: 'Short description',
      base_price: '10000',
      stock_quantity: '5',
      category_slug: 'electronics',
      brand_slug: '',
      sku_code: '',
    },
  )
}

async function onImportCatalog(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  importing.value = true
  importResult.value = ''
  importPanelLines.value = []
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
    importResult.value = formatImportBatchSummary(files.length, lines)
    toastSuccess(t('catalogImport.toastImportFinished', { created: totalCreated, files: files.length }))
  } catch (e: unknown) {
    toastError(formatApiError(e, t('catalogImport.toastImportFailed')))
  } finally {
    importing.value = false
  }
}

async function onImportImages(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  importing.value = true
  importResult.value = ''
  importPanelLines.value = []
  try {
    const { results, uploaded } = await runSequentialProductMediaImports(files, {
      onProgress: (p) => {
        importProgress.value = p
          ? {
              currentFileIndex: p.currentIndex,
              totalFiles: p.total,
              currentFileName: p.currentFileName,
              fileUploadPercent: p.fileUploadPercent,
              overallPercent: p.overallPercent,
              uploadIndeterminate: p.uploadIndeterminate,
            }
          : null
      },
    })
    importPanelLines.value = mediaResultLines(results)
    importResult.value = formatMediaImportSummary(results)
    toastSuccess(t('catalogImport.toastImagesUploaded', { ok: uploaded, total: files.length }))
  } catch (e: unknown) {
    toastError(formatApiError(e, t('catalogImport.toastImageImportFailed')))
  } finally {
    importing.value = false
  }
}
</script>
