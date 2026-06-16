<template>
  <VerticalLayout>
    <b-card :title="t('catalog.myProductsTitle')">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <p class="text-muted mb-0 me-auto">
          {{ t('catalog.sellerProductsHint') }}
          <span class="d-block small">{{ t('catalog.sellerManageOwnOnly') }}</span>
        </p>
        <b-form-input
          v-model="search"
          :placeholder="t('catalog.searchTitleSlug')"
          class="w-auto"
          style="max-width: 220px;"
          @input="debouncedLoad"
        />
        <b-button variant="outline-secondary" size="sm" @click="exportCsv">{{ t('catalog.exportCsv') }}</b-button>
        <b-button variant="outline-secondary" size="sm" @click="downloadTemplate">{{ t('catalog.downloadCsvTemplate') }}</b-button>
        <b-dropdown variant="outline-secondary" size="sm" :text="t('catalog.bulkImport')" menu-class="shadow-sm">
          <b-dropdown-item @click="triggerImportInput">{{ t('catalog.importCatalogMultiple') }}</b-dropdown-item>
          <b-dropdown-item @click="downloadSellerImportTemplate">{{ t('catalog.importTemplateApi') }}</b-dropdown-item>
        </b-dropdown>
        <b-button variant="outline-primary" size="sm" :to="{ name: 'seller.products.import' }">{{ t('catalog.fullPageImport') }}</b-button>
        <input
          ref="importInputRef"
          type="file"
          accept=".csv,.xlsx"
          multiple
          :title="t('catalogImport.filePickerSpreadsheets')"
          class="d-none"
          @change="onImportFile"
        />
        <b-button variant="primary" :to="{ name: 'seller.products.create' }">{{ t('catalog.createProductWizard') }}</b-button>
      </div>
      <ImportBatchProgressBar
        :visible="!!importProgress"
        :subtitle="importProgressSubtitle"
        :overall-percent="importProgress?.overallPercent ?? 0"
        :pulse-striped="importProgressPulse"
      />
      <b-alert v-if="importResult" variant="info" show dismissible class="mb-3" @dismissed="importResult = ''">{{
        importResult
      }}</b-alert>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <b-table v-else-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(cover)="data">
          <img
            v-if="productCoverUrl(data.item)"
            :src="productCoverUrl(data.item) || ''"
            :alt="t('catalog.coverPhoto')"
            class="product-cover-thumb"
          />
          <span v-else class="text-muted">—</span>
        </template>
        <template #cell(title)="data">
          <router-link :to="productDetailPath(data.item)">{{ data.value }}</router-link>
        </template>
        <template #cell(status)="data">
          <b-badge :variant="statusVariant(data.item)">{{ statusLabel(data.item) }}</b-badge>
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" :to="productDetailPath(data.item)">{{ t('common.view') }}</b-button>
          <b-button size="sm" variant="outline-secondary" class="ms-1" :to="{ name: 'seller.products.edit', params: { slug: data.item.slug ?? String(data.item.id) } }">{{ t('common.edit') }}</b-button>
          <b-button size="sm" variant="outline-danger" class="ms-1" @click="confirmDelete(data.item)">{{ t('common.delete') }}</b-button>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">{{ t('common.loading') }}</p>
      <EmptyState v-else :title="t('catalog.noProductsYet')" :message="t('catalog.addFirstProduct')">
        <b-button variant="primary" size="sm" class="mt-3" :to="{ name: 'seller.products.create' }">{{ t('catalog.createProduct') }}</b-button>
      </EmptyState>
      <CatalogListPaginationBar
        :page="page"
        :page-size="pageSize"
        :total="total"
        :range-start="rangeStart"
        :range-end="rangeEnd"
        :loading="loading"
        @update:page="setPage"
        @update:page-size="setPageSize"
      />
    </b-card>
  </VerticalLayout>
</template>

<style scoped>
.product-cover-thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 4px;
  background: var(--bs-light, #f8f9fa);
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import { useRoute } from 'vue-router'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import CatalogListPaginationBar from '@/components/CatalogListPaginationBar.vue'
import ImportBatchProgressBar from '@/components/ImportBatchProgressBar.vue'
import { useCatalogListPagination } from '@/composables/useCatalogListPagination'
import { catalogSellerApi, usersAdminApi } from '@/api'
import { exportToCsv, downloadCsvTemplate } from '@/composables/useCsv'
import { productCoverUrl } from '@/utils/assetUrl'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'
import { useImportBatchProgress } from '@/composables/useImportBatchProgress'
import { formatImportBatchSummary, runSequentialImports } from '@/utils/sequentialFileImport'
import { toastError, toastSuccess } from '@/utils/toast'

interface ProductRow {
  id: number
  title?: string
  slug?: string
  status?: string
  verification_status?: string
  is_active?: boolean
  cover_image?: string
  image?: string
  thumbnail?: string
}

const route = useRoute()
const importInputRef = ref<HTMLInputElement | null>(null)
const importResult = ref('')
const { importProgress, importProgressSubtitle, importProgressPulse } = useImportBatchProgress()
const loading = ref(true)
const error = ref('')
const search = ref((route.query.search as string) ?? '')
const items = ref<ProductRow[]>([])
let searchDebounce: ReturnType<typeof setTimeout> | null = null

const {
  page,
  pageSize,
  total,
  rangeStart,
  rangeEnd,
  setPage,
  setPageSize,
  resetPage,
  applyListMeta,
} = useCatalogListPagination('kkoo.catalog.seller.products.pageSize')

const fields = computed(() => [
  { key: 'cover', label: t('catalog.coverPhoto') },
  { key: 'id', label: t('catalog.productId') },
  { key: 'title', label: t('catalog.productTitle') },
  { key: 'status', label: t('catalog.publish') },
  { key: 'actions', label: t('common.actions') },
])

const csvColumns = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'status' },
]

watch(() => route.query.search, (q) => {
  if (q != null && String(q).trim()) search.value = String(q).trim()
}, { immediate: true })

watch([page, pageSize], () => {
  void loadProducts()
})

function productDetailPath(item: { id?: number; slug?: string }): string {
  const slug = item.slug ?? String(item.id ?? '')
  return `/seller/products/${encodeURIComponent(slug)}`
}

function statusLabel(item: ProductRow): string {
  const s = (item.status ?? '').toString().trim().toLowerCase()
  if (s === 'published') return 'Published'
  if (s === 'draft') return 'Draft'
  const v = (item.verification_status ?? '').toString().toLowerCase()
  if (v === 'pending') return 'Pending review'
  if (v === 'rejected') return 'Rejected'
  if (item.is_active === false) return 'Inactive'
  return item.status ? String(item.status) : '—'
}

function statusVariant(item: ProductRow): string {
  const s = (item.status ?? '').toString().trim().toLowerCase()
  if (s === 'published') return 'success'
  if (s === 'draft') return 'warning'
  if (item.verification_status === 'rejected') return 'danger'
  return 'secondary'
}

function debouncedLoad() {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    const wasPage = page.value
    resetPage()
    if (wasPage === 1) void loadProducts()
  }, 350)
}

async function loadProducts(showLoadedToast = false) {
  loading.value = true
  error.value = ''
  try {
    const { data } = await catalogSellerApi.listProducts({
      page: page.value,
      page_size: pageSize.value,
      search: search.value.trim() || undefined,
    })
    const body = data as { results?: ProductRow[]; total?: number; page?: number }
    items.value = (body.results ?? []) as ProductRow[]
    applyListMeta({ total: body.total, page: body.page })
    if (showLoadedToast) toastSuccess(t('catalog.productsLoaded'))
  } catch {
    items.value = []
    applyListMeta({ total: 0 })
    toastError(t('catalog.failedLoadProducts'))
  } finally {
    loading.value = false
  }
}

onMounted(() => loadProducts(true))

function exportCsv() {
  exportToCsv(items.value as unknown as Record<string, unknown>[], csvColumns, 'my-products-export.csv')
}

function downloadTemplate() {
  downloadCsvTemplate(csvColumns, 'my-products-template.csv', { id: '1', title: 'Sample Product', status: 'published' })
}

/** Rows match POST /catalog/seller/import/catalog/ (no seller_id column required). */
async function downloadSellerImportTemplate() {
  try {
    const { data } = await usersAdminApi.getImportTemplate('catalog')
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'catalog_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    downloadCsvTemplate(
      [
        { key: 'title', label: 'title' },
        { key: 'description', label: 'description' },
        { key: 'base_price', label: 'base_price' },
        { key: 'category_slug', label: 'category_slug' },
        { key: 'brand_slug', label: 'brand_slug' },
        { key: 'slug', label: 'slug' },
        { key: 'status', label: 'status' },
        { key: 'sku_code', label: 'sku_code' },
        { key: 'stock_quantity', label: 'stock_quantity' },
      ],
      'seller-catalog-import-template.csv',
      {
        title: 'Example product',
        description: 'Short description',
        base_price: '99.99',
        category_slug: '',
        brand_slug: '',
        slug: '',
        status: 'published',
        sku_code: '',
        stock_quantity: '0',
      },
    )
  }
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
  try {
    const { lines } = await runSequentialImports(files, async (file, { onUploadProgress }) => {
      const { data } = await catalogSellerApi.importCatalog(file, { onUploadProgress })
      return data
    }, (p) => {
      importProgress.value = p
    })
    importResult.value = formatImportBatchSummary(files.length, lines)
    resetPage()
    await loadProducts()
    toastSuccess(t('catalogImport.toastImportFinished', { created: 0, files: files.length }))
  } catch (e: unknown) {
    toastError((e as { message?: string }).message ?? t('catalogImport.toastImportFailed'))
  }
}

async function confirmDelete(item: ProductRow) {
  const slug = item.slug ?? String(item.id)
  const name = item.title ?? slug
  const ok = await confirmDestructiveAction({
    title: t('catalog.deleteProductTitle'),
    text: t('catalog.deleteProductBodyNamed', { name }),
  })
  if (!ok) return
  try {
    await catalogSellerApi.deleteProduct(slug)
    toastSuccess(t('catalog.productDeleted'))
    await loadProducts()
  } catch {
    toastError(t('catalog.deleteProductFailed'))
  }
}
</script>
