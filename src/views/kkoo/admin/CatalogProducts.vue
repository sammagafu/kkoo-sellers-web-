<template>
  <VerticalLayout>
    <b-card class="catalog-page-card shadow-sm border-0">
      <b-card-header class="bg-transparent border-bottom pb-3">
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <h4 class="mb-1 fw-semibold">{{ t('catalog.productsTitle') }}</h4>
            <p class="text-muted small mb-0">{{ t('catalog.productsSubtitle') }}</p>
          </div>
          <b-button variant="primary" size="sm" :to="{ name: 'admin.catalog.products.create' }">{{ t('catalog.createProduct') }}</b-button>
        </div>
      </b-card-header>
      <b-card-body class="pt-0">
        <div class="catalog-toolbar rounded-3 border bg-body-secondary bg-opacity-50 p-3 mb-3">
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-6 col-lg-4">
              <label class="form-label small text-muted mb-1">{{ t('common.search') }}</label>
              <b-form-input v-model="search" :placeholder="t('catalog.searchPlaceholder')" @input="debouncedLoad" />
            </div>
            <div class="col-6 col-md-3 col-lg-2">
              <label class="form-label small text-muted mb-1">{{ t('catalog.verification') }}</label>
              <b-form-select v-model="filterVerification" :options="verificationOptions" @change="onFilterChange" />
            </div>
            <div class="col-6 col-md-3 col-lg-2">
              <label class="form-label small text-muted mb-1">{{ t('catalog.publish') }}</label>
              <b-form-select v-model="filterStatus" :options="statusOptions" @change="onFilterChange" />
            </div>
            <div class="col-6 col-md-3 col-lg-2">
              <label class="form-label small text-muted mb-1">{{ t('common.active') }}</label>
              <b-form-select v-model="filterActive" :options="activeOptions" @change="onFilterChange" />
            </div>
            <div class="col-6 col-md-3 col-lg-2">
              <label class="form-label small text-muted mb-1">Seller</label>
              <b-form-input v-model="filterSeller" placeholder="Email / id" @input="debouncedLoad" />
            </div>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top">
            <b-dropdown variant="outline-secondary" size="sm" :text="t('catalog.importExport')" menu-class="shadow-sm">
              <b-dropdown-item @click="exportCsv">{{ t('catalog.exportCsv') }}</b-dropdown-item>
              <b-dropdown-item @click="downloadTemplate">{{ t('catalog.downloadCsvTemplate') }}</b-dropdown-item>
              <b-dropdown-divider />
              <b-dropdown-item @click="triggerImportInput">{{ t('catalog.importCatalogMultiple') }}</b-dropdown-item>
              <b-dropdown-item @click="triggerImageImportInput">{{ t('catalog.importProductImages') }}</b-dropdown-item>
              <b-dropdown-item :to="{ name: 'admin.catalog.import' }">{{ t('catalog.importHub') }}</b-dropdown-item>
              <b-dropdown-item @click="downloadImportTemplate">{{ t('catalog.downloadApiImportTemplate') }}</b-dropdown-item>
              <b-dropdown-divider />
            </b-dropdown>
            <b-button
              v-if="items.length"
              variant="outline-secondary"
              size="sm"
              @click="setSelectAllOnPage(!allOnPageSelected)"
            >
              {{ allOnPageSelected ? t('catalog.clearPageSelection') : t('catalog.selectAllOnPage') }}
            </b-button>
            <b-button
              v-if="selected.length"
              variant="outline-secondary"
              size="sm"
              @click="clearSelection"
            >
              {{ t('catalog.clearSelection', { count: selected.length }) }}
            </b-button>
            <b-dropdown
              v-if="selected.length"
              variant="primary"
              size="sm"
              :text="t('catalog.bulkCount', { count: selected.length })"
              menu-class="shadow-sm"
            >
              <b-dropdown-item @click="bulkApprove">Approve verification</b-dropdown-item>
              <b-dropdown-item @click="bulkReject">Reject verification</b-dropdown-item>
              <b-dropdown-divider />
              <b-dropdown-item @click="bulkActivate">Activate listings</b-dropdown-item>
              <b-dropdown-item @click="bulkDeactivate">Deactivate listings</b-dropdown-item>
            </b-dropdown>
            <input
              ref="importInputRef"
              type="file"
              accept=".csv,.xlsx,.xls"
              multiple
              :title="t('catalogImport.filePickerSpreadsheets')"
              class="d-none"
              @change="onImportFile"
            />
            <input
              ref="imageImportInputRef"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
              multiple
              :title="t('catalog.filePickerImagesBySlug')"
              class="d-none"
              @change="onImportImages"
            />
          </div>
        </div>

        <b-alert v-if="error" variant="danger" dismissible show class="mb-3" @dismissed="error = ''">{{ error }}</b-alert>
        <ImportBatchProgressPanel
          :visible="!!importProgress || catalogImporting"
          :subtitle="importProgressSubtitle || (catalogImporting ? t('catalogImport.working') : '')"
          :overall-percent="importProgress?.overallPercent ?? 0"
          :pulse-striped="importProgressPulse || catalogImporting"
          :lines="importPanelLines"
        />
        <b-alert v-if="importResult" variant="info" show dismissible class="mb-3" @dismissed="importResult = ''">{{ importResult }}</b-alert>

        <div v-if="loading && !items.length" class="text-center py-5 text-muted">
          <b-spinner class="align-middle me-2" small /> {{ t('catalog.loadingProducts') }}
        </div>
        <div v-else-if="items.length" class="catalog-table-shell position-relative rounded-3 overflow-hidden border">
          <div v-if="loading" class="catalog-loading-overlay">
            <b-spinner variant="primary" />
          </div>
          <b-table
            :items="items"
            :fields="tableFields"
            hover
            responsive
            primary-key="id"
            class="catalog-table mb-0 align-middle"
          >
            <template #head(__select)>
              <b-form-checkbox
                :model-value="allOnPageSelected"
                :indeterminate="someOnPageSelected && !allOnPageSelected"
                :title="t('catalog.selectAllOnPage')"
                :aria-label="t('catalog.selectAllOnPage')"
                @update:model-value="setSelectAllOnPage"
                @click.stop
              />
            </template>
            <template #cell(__select)="data">
              <b-form-checkbox
                :model-value="isProductSelected(data.item)"
                :aria-label="t('catalog.selectRow', { title: data.item.title ?? data.item.id })"
                @update:model-value="(v: boolean) => setProductSelected(data.item, Boolean(v))"
                @click.stop
              />
            </template>
            <template #cell(title)="data">
              <div class="catalog-product-cell">
                <img
                  v-if="productCoverUrl(data.item)"
                  :src="productCoverUrl(data.item) || ''"
                  alt=""
                  class="product-cover-thumb"
                />
                <span v-else class="product-cover-thumb product-cover-thumb--empty" aria-hidden="true" />
                <div class="catalog-product-cell__text min-w-0">
                  <router-link :to="productDetailRoute(data.item)" class="catalog-product-link">
                    {{ data.value }}
                  </router-link>
                  <div v-if="data.item.slug" class="catalog-product-slug">{{ data.item.slug }}</div>
                </div>
              </div>
            </template>
            <template #cell(categories)="data">
              <div class="catalog-category-list">
                <template v-if="categorySlugs(data.item).length">
                  <span v-for="s in categorySlugs(data.item)" :key="s" class="catalog-chip">{{ s }}</span>
                </template>
                <span v-else class="catalog-cell-muted">—</span>
              </div>
            </template>
            <template #cell(seller)="data">
              <span v-if="sellerLabel(data.item)" class="catalog-seller">{{ sellerLabel(data.item) }}</span>
              <span v-else class="catalog-cell-muted">—</span>
            </template>
            <template #cell(status)="data">
              <span class="catalog-status" :class="`catalog-status--${publishVariant(data.item)}`">
                {{ publishLabel(data.item) }}
              </span>
            </template>
            <template #cell(is_active)="data">
              <span
                class="catalog-status"
                :class="data.item.is_active === false ? 'catalog-status--secondary' : 'catalog-status--success'"
              >
                {{ data.item.is_active === false ? 'Inactive' : 'Active' }}
              </span>
            </template>
            <template #cell(verification_status)="data">
              <span class="catalog-status" :class="`catalog-status--${reviewVariant(data.item)}`">
                {{ statusLabel(data.item) }}
              </span>
            </template>
            <template #cell(actions)="data">
              <div class="catalog-row-actions">
                <b-button size="sm" variant="primary" class="catalog-row-actions__btn" :to="productDetailRoute(data.item)">
                  View
                </b-button>
                <b-button
                  size="sm"
                  variant="outline-primary"
                  class="catalog-row-actions__btn"
                  :disabled="!data.item.slug"
                  :to="
                    data.item.slug
                      ? { name: 'admin.catalog.products.edit', params: { slug: data.item.slug } }
                      : undefined
                  "
                >
                  Edit
                </b-button>
                <b-dropdown
                  size="sm"
                  variant="outline-secondary"
                  toggle-class="catalog-row-actions__menu"
                  menu-class="catalog-actions-menu shadow-sm"
                  end
                  no-caret
                >
                  <template #button-content>
                    <span class="catalog-row-actions__more" aria-hidden="true">⋯</span>
                    <span class="visually-hidden">More actions</span>
                  </template>
                  <b-dropdown-item @click="toggleVerify(data.item)">
                    {{ isVerified(data.item) ? 'Unverify' : 'Verify' }}
                  </b-dropdown-item>
                  <b-dropdown-divider />
                  <b-dropdown-item variant="danger" @click="deactivate(data.item)">
                    Deactivate listing
                  </b-dropdown-item>
                </b-dropdown>
              </div>
            </template>
          </b-table>
        </div>
        <EmptyState v-else />
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
      </b-card-body>
    </b-card>
  </VerticalLayout>
</template>

<style scoped>
.catalog-table-shell {
  min-height: 120px;
  --catalog-primary: var(--bs-primary, #5c308f);
  --catalog-gold: var(--bs-warning, #f7a829);
}

.catalog-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--bs-body-bg-rgb, 255, 255, 255), 0.72);
  backdrop-filter: blur(1px);
}

.catalog-table :deep(thead th) {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
  border-bottom-width: 1px;
  white-space: nowrap;
  vertical-align: middle;
  padding-top: 0.65rem;
  padding-bottom: 0.65rem;
}

.catalog-table :deep(tbody td) {
  padding-top: 0.65rem;
  padding-bottom: 0.65rem;
  vertical-align: middle;
}

.catalog-table :deep(tbody tr:hover) {
  background: color-mix(in srgb, var(--catalog-primary) 4%, var(--bs-table-hover-bg, transparent));
}

.catalog-select-col {
  width: 2.5rem;
}

.catalog-table :deep(.catalog-select-col .form-check) {
  margin-bottom: 0;
  min-height: 1.25rem;
  display: flex;
  justify-content: center;
}

.catalog-id-col {
  width: 4.5rem;
  font-variant-numeric: tabular-nums;
  color: var(--bs-secondary-color);
  font-size: 0.84rem;
}

.catalog-categories-col {
  max-width: 11rem;
}

.catalog-seller-col {
  max-width: 9rem;
}

.catalog-status-col {
  width: 5.5rem;
}

.catalog-actions-col {
  width: 1%;
  white-space: nowrap;
}

.catalog-product-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  max-width: 22rem;
}

.product-cover-thumb {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  object-fit: contain;
  border-radius: 0.5rem;
  background: var(--bs-tertiary-bg, #f8f9fa);
  border: 1px solid var(--bs-border-color-translucent, rgba(0, 0, 0, 0.08));
}

.product-cover-thumb--empty {
  display: inline-block;
  background: var(--bs-tertiary-bg, #f8f9fa);
}

.catalog-product-link {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--catalog-primary);
  text-decoration: none;
  line-height: 1.35;
}

.catalog-product-link:hover {
  color: color-mix(in srgb, var(--catalog-primary) 80%, #000);
  text-decoration: underline;
}

.catalog-product-slug {
  margin-top: 0.15rem;
  font-size: 0.72rem;
  line-height: 1.3;
  color: var(--bs-secondary-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.catalog-chip {
  display: inline-block;
  max-width: 100%;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.25;
  color: color-mix(in srgb, var(--catalog-gold) 55%, #5a3a00);
  background: color-mix(in srgb, var(--catalog-gold) 16%, #fff);
  border: 1px solid color-mix(in srgb, var(--catalog-gold) 28%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-seller {
  display: block;
  font-size: 0.8rem;
  color: var(--bs-body-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-cell-muted {
  color: var(--bs-secondary-color);
}

.catalog-status {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.catalog-status--success {
  color: #0d5c36;
  background: rgba(25, 135, 84, 0.12);
}

.catalog-status--warning {
  color: #7a4d00;
  background: color-mix(in srgb, var(--catalog-gold) 22%, #fff);
}

.catalog-status--danger {
  color: #842029;
  background: rgba(220, 53, 69, 0.12);
}

.catalog-status--secondary {
  color: var(--bs-secondary-color);
  background: var(--bs-tertiary-bg);
}

.catalog-row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
}

.catalog-row-actions__btn {
  padding: 0.25rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
}

.catalog-row-actions__menu {
  min-width: 2rem;
  padding: 0.25rem 0.45rem;
  line-height: 1;
}

.catalog-row-actions__more {
  font-size: 1.1rem;
  line-height: 1;
  letter-spacing: 0.05em;
}

html[data-bs-theme='dark'] .catalog-product-link {
  color: #d4b8ff;
}

html[data-bs-theme='dark'] .catalog-product-link:hover {
  color: #f0e6ff;
}

html[data-bs-theme='dark'] .catalog-chip {
  color: #ffe6b0;
  background: color-mix(in srgb, var(--catalog-gold) 18%, #1a1424);
  border-color: color-mix(in srgb, var(--catalog-gold) 32%, transparent);
}

html[data-bs-theme='dark'] .catalog-status--success {
  color: #9ae6c4;
  background: rgba(25, 135, 84, 0.22);
}

html[data-bs-theme='dark'] .catalog-status--warning {
  color: #ffd98a;
  background: color-mix(in srgb, var(--catalog-gold) 20%, #1a1424);
}

html[data-bs-theme='dark'] .catalog-status--danger {
  color: #ffb3bd;
  background: rgba(220, 53, 69, 0.2);
}
</style>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import CatalogListPaginationBar from '@/components/CatalogListPaginationBar.vue'
import ImportBatchProgressPanel from '@/components/ImportBatchProgressPanel.vue'
import { useCatalogListPagination } from '@/composables/useCatalogListPagination'
import type { ImportBatchLine } from '@/components/ImportBatchProgressPanel.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { catalogAdminApi, usersAdminApi } from '@/api'
import { exportToCsv, downloadCsvTemplate } from '@/composables/useCsv'
import { productCoverUrl } from '@/utils/assetUrl'
import { formatApiError } from '@/utils/formatApiError'
import { useImportBatchProgress } from '@/composables/useImportBatchProgress'
import {
  formatImportBatchSummary,
  importSummaryLinesFromStrings,
  runSequentialImports,
} from '@/utils/sequentialFileImport'
import { importCatalogProducts } from '@/utils/catalogProductImport'
import {
  formatMediaImportSummary,
  runSequentialProductMediaImports,
  type MediaImportItemResult,
} from '@/utils/catalogMediaBulkImport'
import { toastSuccess, toastError } from '@/utils/toast'

interface ProductRow {
  id: number
  title?: string
  slug?: string
  status?: string
  cover_image?: string
  image?: string
  thumbnail?: string
  category_slug?: string
  category_slugs?: string[]
  verification_status?: string
  is_verified?: boolean
  is_active?: boolean
  seller?: string
}

const items = ref<ProductRow[]>([])
const selected = ref<ProductRow[]>([])
const loading = ref(false)
const error = ref('')
const importResult = ref('')
const catalogImporting = ref(false)
const importPanelLines = ref<ImportBatchLine[]>([])
const { importProgress, importProgressSubtitle, importProgressPulse } = useImportBatchProgress()
const importInputRef = ref<HTMLInputElement | null>(null)
const imageImportInputRef = ref<HTMLInputElement | null>(null)
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
} = useCatalogListPagination('kkoo.catalog.admin.products.pageSize')
const filterVerification = ref<string>('')
const filterStatus = ref<string>('')
const filterActive = ref<boolean | ''>('')
const filterSeller = ref('')
const route = useRoute()
const search = ref((route.query.search as string) ?? '')
let loadDebounce: ReturnType<typeof setTimeout> | null = null

watch(() => route.query.search, (q) => {
  const val = q != null ? String(q).trim() : ''
  if (val !== search.value) search.value = val
  clearSelection()
  resetPage()
  load()
}, { immediate: false })

watch([page, pageSize], () => {
  void load()
})

const verificationOptions = [
  { value: '', text: 'All verification' },
  { value: 'pending', text: 'Pending' },
  { value: 'approved', text: 'Approved' },
  { value: 'rejected', text: 'Rejected' },
]
const statusOptions = [
  { value: '', text: 'All publish status' },
  { value: 'draft', text: 'Draft' },
  { value: 'published', text: 'Published' },
]
const activeOptions = [
  { value: '', text: 'All active' },
  { value: true, text: 'Active' },
  { value: false, text: 'Inactive' },
]

const tableFields = [
  { key: '__select', label: '', sortable: false, thClass: 'catalog-select-col', tdClass: 'catalog-select-col' },
  { key: 'id', label: 'ID', sortable: false, thClass: 'catalog-id-col', tdClass: 'catalog-id-col' },
  { key: 'title', label: 'Product', sortable: false },
  { key: 'categories', label: 'Categories', sortable: false, thClass: 'catalog-categories-col', tdClass: 'catalog-categories-col' },
  { key: 'seller', label: 'Seller', sortable: false, thClass: 'catalog-seller-col', tdClass: 'catalog-seller-col' },
  { key: 'status', label: 'Publish', sortable: false, thClass: 'catalog-status-col', tdClass: 'catalog-status-col' },
  { key: 'is_active', label: 'Listing', sortable: false, thClass: 'catalog-status-col', tdClass: 'catalog-status-col' },
  { key: 'verification_status', label: 'Review', sortable: false, thClass: 'catalog-status-col', tdClass: 'catalog-status-col' },
  { key: 'actions', label: '', sortable: false, thClass: 'catalog-actions-col', tdClass: 'catalog-actions-col' },
]

function categorySlugs(item: ProductRow): string[] {
  const slugs = Array.isArray(item.category_slugs) ? item.category_slugs.filter(Boolean) : []
  if (slugs.length) return slugs.map(String)
  if (item.category_slug) return [String(item.category_slug)]
  return []
}

function publishLabel(item: ProductRow): string {
  const s = (item.status ?? '').toString().trim().toLowerCase()
  if (s === 'published') return 'Published'
  if (s === 'draft') return 'Draft'
  return item.status ? String(item.status) : '—'
}

function publishVariant(item: ProductRow): string {
  const s = (item.status ?? '').toString().trim().toLowerCase()
  if (s === 'published') return 'success'
  if (s === 'draft') return 'warning'
  return 'secondary'
}

function productDetailRoute(item: ProductRow): RouteLocationRaw {
  const slug = item.slug ?? String(item.id ?? '')
  return { name: 'admin.catalog.products.detail', params: { slug } }
}

const csvColumns = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'seller', label: 'Seller' },
  { key: 'verification_status', label: 'Status' },
]

const selectedIds = computed(() => selected.value.map((r) => r.id))
const selectedSlugs = computed(() => selected.value.map((r) => r.slug).filter((s): s is string => !!s))

const selectedIdSet = computed(() => new Set(selected.value.map((r) => r.id)))

const allOnPageSelected = computed(
  () => items.value.length > 0 && items.value.every((row) => selectedIdSet.value.has(row.id)),
)
const someOnPageSelected = computed(() =>
  items.value.some((row) => selectedIdSet.value.has(row.id)),
)

function isProductSelected(item: ProductRow): boolean {
  return selectedIdSet.value.has(item.id)
}

function setProductSelected(item: ProductRow, checked: boolean) {
  if (checked) {
    if (!isProductSelected(item)) selected.value = [...selected.value, item]
    return
  }
  selected.value = selected.value.filter((r) => r.id !== item.id)
}

function setSelectAllOnPage(checked: boolean) {
  if (!checked) {
    const pageIds = new Set(items.value.map((r) => r.id))
    selected.value = selected.value.filter((r) => !pageIds.has(r.id))
    return
  }
  const known = new Set(selected.value.map((r) => r.id))
  const merged = [...selected.value]
  for (const row of items.value) {
    if (!known.has(row.id)) merged.push(row)
  }
  selected.value = merged
}

function clearSelection() {
  selected.value = []
}

function isVerified(item: ProductRow): boolean {
  return item.is_verified === true || item.verification_status === 'approved'
}

function statusLabel(item: ProductRow): string {
  if (isVerified(item)) return 'Verified'
  if (item.verification_status === 'rejected') return 'Rejected'
  return 'Pending'
}

function reviewVariant(item: ProductRow): string {
  if (isVerified(item)) return 'success'
  if (item.verification_status === 'rejected') return 'danger'
  return 'warning'
}

function sellerLabel(item: ProductRow): string {
  const raw = item.seller ?? (item as { seller_email?: string }).seller_email
  if (raw == null || raw === '') return ''
  return String(raw)
}

function toggleVerify(item: ProductRow) {
  verify(item, isVerified(item) ? 'reject' : 'approve')
}

function onFilterChange() {
  clearSelection()
  const wasPage = page.value
  resetPage()
  if (wasPage === 1) void load()
}

function debouncedLoad() {
  if (loadDebounce) clearTimeout(loadDebounce)
  loadDebounce = setTimeout(() => {
    clearSelection()
    const wasPage = page.value
    resetPage()
    if (wasPage === 1) void load()
  }, 350)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await catalogAdminApi.listProducts({
      page: page.value,
      page_size: pageSize.value,
      verification_status: filterVerification.value || undefined,
      status: filterStatus.value || undefined,
      is_active: filterActive.value === '' ? undefined : filterActive.value,
      seller: filterSeller.value.trim() || undefined,
      search: search.value.trim() || undefined,
    })
    if (Array.isArray(data)) {
      items.value = data as ProductRow[]
      applyListMeta({ total: items.value.length })
    } else {
      const body = data as { results?: ProductRow[]; total?: number; page?: number }
      items.value = (body.results ?? []) as ProductRow[]
      applyListMeta({ total: body.total, page: body.page })
    }
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load products')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function exportCsv() {
  exportToCsv(items.value as unknown as Record<string, unknown>[], csvColumns, 'products-export.csv')
}

function downloadTemplate() {
  downloadCsvTemplate(csvColumns, 'products-template.csv', {
    id: '1',
    title: 'Sample Product',
    seller: 'seller@example.com',
    verification_status: 'pending',
  })
}

async function downloadImportTemplate() {
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
      'catalog_template.csv',
      { seller_id: '1', title: 'Example Product', base_price: '99.99', category_slug: '', brand_slug: '', slug: '', description: '', sku_code: '', stock_quantity: '0' }
    )
  }
}

function triggerImportInput() {
  importInputRef.value?.click()
}

function triggerImageImportInput() {
  imageImportInputRef.value?.click()
}

function mediaResultLines(results: MediaImportItemResult[]): ImportBatchLine[] {
  return results.map((r) => ({
    label: r.fileName,
    text: r.ok ? `${r.productSlug}: ${r.message}` : `${r.productSlug || '?'}: ${r.message}`,
    ok: r.ok,
  }))
}

async function onImportFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  importResult.value = ''
  error.value = ''
  importPanelLines.value = []
  catalogImporting.value = true
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
    await load()
    toastSuccess(t('catalogImport.toastImportFinished', { created: totalCreated, files: files.length }))
  } catch (e: unknown) {
    error.value = formatApiError(e, t('catalogImport.toastImportFailed'))
    toastError(error.value)
  } finally {
    catalogImporting.value = false
  }
}

async function onImportImages(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  importResult.value = ''
  error.value = ''
  importPanelLines.value = []
  catalogImporting.value = true
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
    importResult.value = formatMediaImportSummary(results)
    await load()
    toastSuccess(t('catalogImport.toastImagesUploaded', { ok: uploaded, total: files.length }))
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Image import failed')
    toastError(error.value)
  } finally {
    catalogImporting.value = false
  }
}

async function verify(item: ProductRow, action: 'approve' | 'reject') {
  try {
    await catalogAdminApi.verifyProduct(item.slug ?? String(item.id), action)
    await load()
    toastSuccess(action === 'approve' ? t('catalog.productVerified') : t('catalog.productUnverified'))
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Action failed')
    toastError(error.value)
  }
}

async function deactivate(item: ProductRow) {
  try {
    await catalogAdminApi.deactivateProduct(item.slug ?? String(item.id))
    await load()
    toastSuccess(t('catalog.productDeactivated'))
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Deactivate failed')
    toastError(error.value)
  }
}

function bulkPayload(action: 'approve' | 'reject' | 'activate' | 'deactivate') {
  return selectedSlugs.value.length
    ? { action, slugs: selectedSlugs.value }
    : { action, product_ids: selectedIds.value }
}

async function bulkApprove() {
  if (!selectedIds.value.length && !selectedSlugs.value.length) return
  try {
    await catalogAdminApi.bulkAction(bulkPayload('approve'))
    selected.value = []
    await load()
    toastSuccess(t('catalog.approvedSelected'))
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Bulk action failed')
    toastError(error.value)
  }
}

async function bulkReject() {
  if (!selectedIds.value.length && !selectedSlugs.value.length) return
  try {
    await catalogAdminApi.bulkAction(bulkPayload('reject'))
    selected.value = []
    await load()
    toastSuccess(t('catalog.rejectedSelected'))
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Bulk action failed')
    toastError(error.value)
  }
}

async function bulkDeactivate() {
  if (!selectedIds.value.length && !selectedSlugs.value.length) return
  try {
    await catalogAdminApi.bulkAction(bulkPayload('deactivate'))
    selected.value = []
    await load()
    toastSuccess(t('catalog.deactivatedSelected'))
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Bulk action failed')
    toastError(error.value)
  }
}

async function bulkActivate() {
  if (!selectedIds.value.length && !selectedSlugs.value.length) return
  try {
    await catalogAdminApi.bulkAction(bulkPayload('activate'))
    selected.value = []
    await load()
    toastSuccess(t('catalog.activatedSelected'))
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Bulk action failed')
    toastError(error.value)
  }
}
</script>
