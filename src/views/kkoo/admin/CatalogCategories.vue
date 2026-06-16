<template>
  <VerticalLayout>
    <b-card class="catalog-page-card shadow-sm border-0">
      <b-card-header class="bg-transparent border-bottom pb-3">
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <h4 class="mb-1 fw-semibold">Categories</h4>
            <p class="text-muted small mb-0">
              Build the catalog tree, approve categories, and re-parent rows or pills by dragging.
            </p>
          </div>
        </div>
      </b-card-header>
      <b-card-body class="pt-0">
        <div class="catalog-toolbar rounded-3 border bg-body-secondary bg-opacity-50 p-3 mb-3">
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-4 col-lg-4">
              <label class="form-label small text-muted mb-1">Search</label>
              <b-form-input v-model="search" placeholder="Name, slug, or path…" @input="debouncedLoad" />
            </div>
            <div class="col-6 col-md-4 col-lg-3">
              <label class="form-label small text-muted mb-1">Approval</label>
              <b-form-select v-model="filterApproval" :options="approvalOptions" @change="load" />
            </div>
            <div class="col-6 col-md-4 col-lg-3">
              <label class="form-label small text-muted mb-1">Active</label>
              <b-form-select v-model="filterActive" :options="activeOptions" @change="load" />
            </div>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top">
            <b-button variant="primary" size="sm" @click="openCreate">Create category</b-button>
            <b-dropdown variant="outline-secondary" size="sm" text="Import / export" menu-class="shadow-sm">
              <b-dropdown-item @click="exportCsv">Export CSV</b-dropdown-item>
              <b-dropdown-item @click="downloadApiCategoryTemplate">Official import template (API)</b-dropdown-item>
              <b-dropdown-item @click="downloadMinimalCategoryImportCsv">Minimal example CSV</b-dropdown-item>
              <b-dropdown-divider />
              <b-dropdown-item @click="triggerImportInput">Import CSV/XLSX (multiple files)…</b-dropdown-item>
              <b-dropdown-item :to="{ name: 'admin.catalog.import' }">{{ t('catalogImport.hubTitle') }}</b-dropdown-item>
            </b-dropdown>
            <b-button variant="outline-secondary" size="sm" @click="expandAll">Expand all</b-button>
            <b-button variant="outline-secondary" size="sm" @click="collapseAll">Collapse all</b-button>
            <b-button
              v-if="selected.length"
              variant="outline-danger"
              size="sm"
              @click="bulkDeleteSelected"
            >
              Delete selected ({{ selected.length }})
            </b-button>
            <input
              ref="importInputRef"
              type="file"
              accept=".csv,.xlsx"
              multiple
              title="Select one or more CSV/XLSX files"
              class="d-none"
              @change="onImportFile"
            />
          </div>
        </div>

        <div
          class="drop-root-zone mb-3"
          :class="{ 'is-over': dragOverRoot }"
          @dragenter.prevent="onRootDragEnter"
          @dragover.prevent
          @dragleave.prevent="onRootDragLeave"
          @drop.prevent="onDropToRoot"
        >
          <strong class="d-block small text-body-secondary mb-1">Make top-level</strong>
          <span class="text-muted small">Drop a row or child pill here to detach it from its parent.</span>
        </div>

        <b-alert v-if="error" variant="danger" dismissible show class="mb-3" @dismissed="error = ''">{{ error }}</b-alert>
        <ImportBatchProgressBar
          :visible="!!importProgress"
          :subtitle="importProgressSubtitle"
          :overall-percent="importProgress?.overallPercent ?? 0"
          :pulse-striped="importProgressPulse"
        />
        <b-alert v-if="importResult" variant="info" show dismissible class="mb-3" @dismissed="importResult = ''">{{ importResult }}</b-alert>

        <div v-if="loading && !displayItems.length" class="text-center py-5 text-muted">
          <b-spinner class="align-middle me-2" small /> Loading categories…
        </div>
        <div v-else-if="displayItems.length" class="catalog-table-shell position-relative rounded-3 overflow-hidden border">
          <div v-if="loading" class="catalog-loading-overlay">
            <b-spinner variant="primary" />
          </div>
          <b-table
            :items="displayItems"
            :fields="tableFields"
            striped
            hover
            responsive
            selectable
            class="catalog-table mb-0"
            v-model:selectedItems="selected"
          >
        <template #cell(level)="data">
          <b-badge :variant="(data.item.__depth ?? 0) === 0 ? 'primary' : 'secondary'">
            {{ (data.item.__depth ?? 0) === 0 ? 'Top level' : 'Subcategory' }}
          </b-badge>
        </template>
        <template #cell(name)="data">
          <div
            class="cat-drop-row"
            :class="{ 'is-over': dragOverParentSlug === data.item.slug }"
            @dragenter.prevent="onRowDragEnter(data.item.slug)"
            @dragover.prevent
            @dragleave.prevent="onRowDragLeave(data.item.slug)"
            @drop.prevent="onDropToParent(data.item.slug)"
          >
            <span
              class="cat-name d-inline-flex align-items-center gap-1"
              :style="{ paddingLeft: `${(data.item.__depth ?? 0) * 20}px` }"
            >
              <button
                v-if="childrenOfSlug(data.item.slug).length"
                type="button"
                class="btn btn-sm btn-link text-body-secondary p-0 me-1"
                :aria-expanded="isExpanded(data.item.slug)"
                :title="isExpanded(data.item.slug) ? 'Collapse subcategories' : 'Expand subcategories'"
                @click.stop="toggleExpand(data.item.slug)"
              >
                {{ isExpanded(data.item.slug) ? '▼' : '▶' }}
              </button>
              <span
                v-else
                class="d-inline-block"
                style="width: 1.25rem"
              />
              <span
                draggable="true"
                @dragstart="onDragStart(data.item.slug)"
                @dragend="onDragEnd"
                :title="'Drag to re-parent'"
              >
                <span class="cat-drag-handle">⋮⋮</span>
                <span v-if="(data.item.__depth ?? 0) > 0" class="cat-indent-marker">↳</span>
                {{ data.value }}
              </span>
            </span>
          </div>
        </template>
        <template #cell(image)="data">
          <img
            v-if="categoryImageUrl(data.item)"
            :src="categoryImageUrl(data.item) || ''"
            alt=""
            class="category-thumb"
            @error="hideBrokenImage"
          />
          <span v-else class="text-muted">—</span>
        </template>
        <template #cell(parent)="data">
          {{ parentDisplayName(data.item) }}
        </template>
        <template #cell(approval_status)="data">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <b-badge :variant="data.value === 'approved' ? 'success' : data.value === 'rejected' ? 'danger' : 'secondary'">
              {{ data.value || '—' }}
            </b-badge>
            <b-button-group size="sm" class="flex-shrink-0">
              <b-button variant="outline-success" @click="setApproval(data.item, 'approved')">Approve</b-button>
              <b-button variant="outline-danger" @click="setApproval(data.item, 'rejected')">Reject</b-button>
            </b-button-group>
          </div>
        </template>
        <template #cell(is_active)="data">
          <b-badge :variant="data.value === false ? 'secondary' : 'success'">{{ data.value === false ? 'No' : 'Yes' }}</b-badge>
        </template>
        <template #cell(actions)="data">
          <b-button-group size="sm" class="flex-wrap">
            <b-button variant="outline-secondary" title="Add subcategory under this row" @click="openCreateUnder(data.item)">Sub</b-button>
            <b-button variant="outline-primary" @click="openEdit(data.item)">Edit</b-button>
            <b-button variant="outline-danger" @click="confirmDelete(data.item)">Delete</b-button>
          </b-button-group>
        </template>
      </b-table>
        </div>
        <EmptyState v-else />
        <p v-if="displayItems.length" class="text-muted small mt-3 mb-0">
          Showing {{ displayItems.length }} row(s)
          <span v-if="!search.trim()">(top-level and expanded subcategories)</span>
          <span v-else>matching search</span>.
        </p>
      </b-card-body>
    </b-card>

    <b-modal
      v-model="showModal"
      :title="editSlug ? 'Edit category' : 'Create category'"
      size="lg"
      scrollable
      ok-title="Save"
      cancel-title="Cancel"
      @hidden="resetForm"
      @ok="saveCategory"
    >
      <b-alert v-if="formError" variant="danger" show dismissible @dismissed="formError = ''">{{ formError }}</b-alert>
      <ImageUploadProgressBar
        :visible="iconUploadActive"
        subtitle="Uploading icon…"
        :percent="iconUploadPercent"
        :pulse-striped="iconUploadPulse"
      />
      <b-form @submit.prevent>
        <h6 class="text-body-secondary text-uppercase small fw-semibold mb-3">Basics</h6>
        <b-form-group label="Name" label-for="cat-name">
          <b-form-input id="cat-name" v-model="form.name" required placeholder="Display name" />
        </b-form-group>
        <b-form-group
          label="Parent category"
          label-for="cat-parent"
          description="Pick any level as parent to nest like the catalog tree. None = top-level."
        >
          <b-form-select
            id="cat-parent"
            v-model="form.parent"
            :options="parentOptions"
            value-field="value"
            text-field="text"
            class="form-select"
          />
        </b-form-group>
        <b-form-group label="Description (optional)" label-for="cat-desc">
          <b-form-textarea id="cat-desc" v-model="form.description" rows="3" placeholder="Shown in apps where category text is used" />
        </b-form-group>

        <hr class="my-4" />

        <h6 class="text-body-secondary text-uppercase small fw-semibold mb-3">Image</h6>
        <b-form-group label="Icon / image" description="Upload a file or paste a URL (https://… or /media/…).">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <b-form-file
              v-model="form.image_file"
              placeholder="Choose image…"
              accept="image/*"
              browse-text="Upload"
              class="w-auto"
              @input="onImageFileInput"
            />
            <b-button v-if="form.image_file" size="sm" variant="outline-secondary" @click.prevent="clearImageFile">Clear file</b-button>
          </div>
          <b-form-input
            id="cat-image"
            v-model="form.image"
            placeholder="Or paste image URL"
            class="mt-2"
          />
        </b-form-group>
        <div v-if="categoryImagePreview" class="mt-2 p-2 rounded border bg-light d-inline-block">
          <img :src="categoryImagePreview" alt="Preview" class="category-edit-preview" @error="() => {}" />
        </div>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<style scoped>
.category-thumb {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 4px;
  background: var(--bs-light, #f8f9fa);
}
.cat-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cat-drag-handle {
  cursor: grab;
  color: var(--bs-secondary, #6c757d);
  user-select: none;
}
.cat-drop-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 0;
  border-radius: 6px;
}
.cat-drop-row.is-over {
  outline: 2px dashed rgba(13, 110, 253, 0.45);
  outline-offset: 2px;
  background: rgba(13, 110, 253, 0.04);
}
.cat-children-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cat-pill {
  cursor: grab;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.drop-root-zone {
  border: 2px dashed rgba(108, 117, 125, 0.35);
  border-radius: 8px;
  padding: 10px 12px;
  background: rgba(108, 117, 125, 0.04);
}
.drop-root-zone.is-over {
  border-color: rgba(13, 110, 253, 0.55);
  background: rgba(13, 110, 253, 0.06);
}
.cat-indent-marker {
  color: var(--bs-secondary, #6c757d);
  font-size: 12px;
  line-height: 1;
}
.category-edit-preview {
  max-width: 160px;
  max-height: 100px;
  object-fit: contain;
  border-radius: 6px;
  background: var(--bs-light, #f8f9fa);
}
.catalog-table-shell {
  min-height: 120px;
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
</style>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import ImportBatchProgressBar from '@/components/ImportBatchProgressBar.vue'
import ImageUploadProgressBar from '@/components/ImageUploadProgressBar.vue'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import { catalogAdminCategoriesApi, catalogAdminApi, usersAdminApi } from '@/api'
import { exportToCsv, downloadCsvTemplate } from '@/composables/useCsv'
import { formatApiError } from '@/utils/formatApiError'
import { useImportBatchProgress } from '@/composables/useImportBatchProgress'
import { useMultipartUploadProgress } from '@/composables/useMultipartUploadProgress'
import { formatImportBatchSummary, runSequentialImports } from '@/utils/sequentialFileImport'
import { categoryImageUrl, resolveAssetUrl } from '@/utils/assetUrl'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'
import { toastSuccess, toastError } from '@/utils/toast'

interface Category {
  id?: number | string
  name: string
  slug: string
  /** Parent category id (API may return parent_id). */
  parent_id?: number | string | null
  /** Parent category object (API may embed parent with name, slug). */
  parent?: { id?: number | string; name?: string; slug?: string } | null
  /** Legacy: parent slug when editing. */
  path?: string
  description?: string
  is_active?: boolean
  approval_status?: string
  icon?: string | null
  icon_url?: string | null
  image?: string | null
  image_url?: string | null
  thumbnail?: string | null
}

type CategoryRow = Category & { __depth?: number }

const items = ref<Category[]>([])
const selected = ref<Category[]>([])
const loading = ref(false)
const error = ref('')
const formError = ref('')
const importResult = ref('')
const search = ref('')
const filterApproval = ref<string>('')
const filterActive = ref<boolean | ''>('')
const importInputRef = ref<HTMLInputElement | null>(null)
const { importProgress, importProgressSubtitle, importProgressPulse } = useImportBatchProgress()
const {
  uploadActive: iconUploadActive,
  uploadPercent: iconUploadPercent,
  uploadPulse: iconUploadPulse,
  beginUpload: beginIconUpload,
  onUploadProgress: onIconUploadProgress,
  endUpload: endIconUpload,
} = useMultipartUploadProgress()
const showModal = ref(false)
const editSlug = ref<string | null>(null)
const form = ref({
  name: '',
  parent: null as string | null,
  description: '',
  image: '',
  image_file: null as File | null,
})
let lastObjectUrl: string | null = null
const categoryImagePreview = computed(() => {
  if (form.value.image_file) {
    if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl)
    lastObjectUrl = URL.createObjectURL(form.value.image_file)
    return lastObjectUrl
  }
  return resolveAssetUrl(form.value.image || null)
})
function onImageFileInput() {
  if (form.value.image_file) form.value.image = ''
}
function clearImageFile() {
  if (lastObjectUrl) {
    URL.revokeObjectURL(lastObjectUrl)
    lastObjectUrl = null
  }
  form.value.image_file = null
}
function hideBrokenImage(e: Event) {
  const el = e.target as HTMLImageElement
  if (el) el.style.display = 'none'
}
let searchDebounce: ReturnType<typeof setTimeout> | null = null
const draggingSlug = ref<string | null>(null)
const dragOverParentSlug = ref<string | null>(null)
const dragOverRoot = ref(false)
const expandedSlugs = ref<Set<string>>(new Set())

function isExpanded(slug: string | undefined): boolean {
  return !!slug && expandedSlugs.value.has(slug)
}

function toggleExpand(slug: string | undefined) {
  if (!slug) return
  const next = new Set(expandedSlugs.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  expandedSlugs.value = next
}

function expandAll() {
  const next = new Set<string>()
  for (const c of items.value) {
    if (c.slug && childrenOfSlug(c.slug).length) next.add(c.slug)
  }
  expandedSlugs.value = next
}

function collapseAll() {
  expandedSlugs.value = new Set()
}

function isRowVisible(row: CategoryRow): boolean {
  let current: Category | undefined = row
  while (current) {
    const pid = parentIdFor(current)
    if (pid == null) return true
    const parent = items.value.find((c) => safeId(c) === pid)
    if (!parent?.slug) return false
    if (!expandedSlugs.value.has(parent.slug)) return false
    current = parent
  }
  return true
}

const tableFields = [
  { key: 'image', label: 'Image', sortable: false },
  { key: 'id', label: 'ID' },
  { key: 'level', label: 'Level', sortable: false },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'path', label: 'Path' },
  { key: 'parent', label: 'Parent' },
  { key: 'approval_status', label: 'Approval' },
  { key: 'is_active', label: 'Active' },
  { key: 'actions', label: 'Actions' },
]

const approvalOptions = [
  { value: '', text: 'All approvals' },
  { value: 'pending', text: 'Pending' },
  { value: 'approved', text: 'Approved' },
  { value: 'rejected', text: 'Rejected' },
]
const activeOptions = [
  { value: '', text: 'All active' },
  { value: true, text: 'Active' },
  { value: false, text: 'Inactive' },
]

const csvColumns = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'parent', label: 'Parent' },
  { key: 'description', label: 'Description' },
  { key: 'icon', label: 'Icon' },
]

function safeId(cat: Category): number | null {
  const raw = cat.id
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function parentIdFor(cat: Category): number | null {
  const pidRaw = cat.parent_id
  if (typeof pidRaw === 'number' && pidRaw > 0) return pidRaw
  if (typeof pidRaw === 'string') {
    const n = parseInt(pidRaw, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  if (cat.parent && typeof cat.parent === 'object') {
    const embedded = cat.parent.id
    if (typeof embedded === 'number' && embedded > 0) return embedded
    if (typeof embedded === 'string') {
      const n = parseInt(embedded, 10)
      if (Number.isFinite(n) && n > 0) return n
    }
  }
  if (cat.parent && typeof cat.parent === 'object' && cat.parent.slug) {
    const found = items.value.find((c) => c.slug === cat.parent!.slug)
    return found ? safeId(found) : null
  }
  return null
}

function childrenOfSlug(slug: string): Category[] {
  const parent = items.value.find((c) => c.slug === slug)
  const pid = parent ? safeId(parent) : null
  if (pid == null) return []
  return items.value
    .filter((c) => parentIdFor(c) === pid)
    .sort((a, b) => (a.name || a.slug).localeCompare(b.name || b.slug))
}

function buildTreeOrder(all: Category[]): CategoryRow[] {
  const byId = new Map<number, Category>()
  for (const c of all) {
    const id = safeId(c)
    if (id != null) byId.set(id, c)
  }

  const childrenByParentId = new Map<number | null, Category[]>()
  for (const c of all) {
    const pid = parentIdFor(c)
    const parentExists = pid != null ? byId.has(pid) : true
    const key = parentExists ? pid : null
    const arr = childrenByParentId.get(key) ?? []
    arr.push(c)
    childrenByParentId.set(key, arr)
  }

  const sortByName = (a: Category, b: Category) => (a.name || a.slug).localeCompare(b.name || b.slug)
  for (const [, arr] of childrenByParentId) arr.sort(sortByName)

  const out: CategoryRow[] = []
  const walk = (parentId: number | null, depth: number) => {
    const kids = childrenByParentId.get(parentId) ?? []
    for (const k of kids) {
      out.push({ ...(k as Category), __depth: depth })
      const id = safeId(k)
      if (id != null) walk(id, depth + 1)
    }
  }
  walk(null, 0)
  return out
}

function collectDescendantIds(startId: number | null, all: Category[]): Set<number> {
  const out = new Set<number>()
  if (startId == null) return out

  const childrenByParentId = new Map<number, number[]>()
  for (const c of all) {
    const cid = safeId(c)
    const pid = parentIdFor(c)
    if (cid == null || pid == null) continue
    const arr = childrenByParentId.get(pid) ?? []
    arr.push(cid)
    childrenByParentId.set(pid, arr)
  }

  const stack = [...(childrenByParentId.get(startId) ?? [])]
  while (stack.length) {
    const id = stack.pop()!
    if (out.has(id)) continue
    out.add(id)
    const kids = childrenByParentId.get(id)
    if (kids?.length) stack.push(...kids)
  }
  return out
}

const treeRows = computed<CategoryRow[]>(() => buildTreeOrder(items.value))

const displayItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return treeRows.value.filter(isRowVisible)
  // When searching, show all matches (ancestors need not be expanded).
  return treeRows.value.filter(
    (c) =>
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.slug ?? '').toLowerCase().includes(q) ||
      (c.path ?? '').toLowerCase().includes(q)
  )
})

const parentOptions = computed(() => {
  const current = editSlug.value ? items.value.find((c) => c.slug === editSlug.value) : null
  const currentId = current ? safeId(current) : null
  const descendants = collectDescendantIds(currentId, items.value)
  return [
    { value: null, text: '— None (top-level) —' },
    ...treeRows.value
      .filter((c) => {
        if (!c.slug) return false
        if (editSlug.value && c.slug === editSlug.value) return false
        const id = safeId(c)
        if (id != null && descendants.has(id)) return false
        return true
      })
      .map((c) => {
        const depth = c.__depth ?? 0
        const prefix = depth ? `${'—'.repeat(depth)} ` : ''
        return { value: c.slug!, text: `${prefix}${c.name || c.slug}` }
      }),
  ]
})

/** Display parent as name (from embedded parent object or lookup by parent_id). */
function parentDisplayName(category: Category): string {
  const p = category.parent
  if (p && typeof p === 'object' && (p.name || p.slug)) return (p.name || p.slug)!
  const pid = parentIdFor(category)
  if (pid == null) return '—'
  const found = items.value.find((c) => safeId(c) === pid)
  return found ? (found.name || found.slug || '—') : String(pid)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await catalogAdminCategoriesApi.list({
      search: search.value.trim() || undefined,
      approval_status: filterApproval.value || undefined,
      is_active: filterActive.value === '' ? undefined : filterActive.value,
    })
    const raw = Array.isArray(data) ? data : (data as { results?: Category[] })?.results ?? []
    items.value = raw as Category[]
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load categories')
    items.value = []
  } finally {
    loading.value = false
  }
}

function onDragStart(slug: string) {
  draggingSlug.value = slug
}
function onDragEnd() {
  draggingSlug.value = null
  dragOverParentSlug.value = null
  dragOverRoot.value = false
}
function onRowDragEnter(targetParentSlug: string) {
  if (!draggingSlug.value) return
  if (draggingSlug.value === targetParentSlug) return
  dragOverParentSlug.value = targetParentSlug
}
function onRowDragLeave(targetParentSlug: string) {
  if (dragOverParentSlug.value === targetParentSlug) dragOverParentSlug.value = null
}
function onRootDragEnter() {
  if (!draggingSlug.value) return
  dragOverRoot.value = true
}
function onRootDragLeave() {
  dragOverRoot.value = false
}

async function moveCategory(slug: string, newParentSlug: string | null) {
  if (!slug) return
  // no-op if already in that parent
  const current = items.value.find((c) => c.slug === slug)
  if (current) {
    const currentParent = parentSlugForForm(current)
    if ((currentParent || null) === (newParentSlug || null)) return
  }
  error.value = ''
  try {
    await catalogAdminCategoriesApi.update(slug, newParentSlug ? { parent: newParentSlug } : { parent_id: null })
    await load()
    toastSuccess(newParentSlug ? 'Moved to subcategory' : 'Moved to top-level')
  } catch (e: unknown) {
    const msg = formatApiError(e, 'Move failed')
    error.value = msg
    toastError(msg)
  }
}

async function setApproval(item: Category, status: 'approved' | 'rejected') {
  if (!item?.slug) return
  try {
    await catalogAdminCategoriesApi.update(item.slug, { approval_status: status })
    await load()
    toastSuccess(status === 'approved' ? 'Category approved' : 'Category rejected')
  } catch (e: unknown) {
    const msg = formatApiError(e, 'Update failed')
    error.value = msg
    toastError(msg)
  }
}

async function onDropToParent(targetParentSlug: string) {
  const slug = draggingSlug.value
  onDragEnd()
  if (!slug) return
  if (slug === targetParentSlug) return
  // Prevent dropping into own descendant (UI also blocks in dropdown; this is extra safety)
  const self = items.value.find((c) => c.slug === slug)
  const selfId = self ? safeId(self) : null
  const descendants = collectDescendantIds(selfId, items.value)
  const target = items.value.find((c) => c.slug === targetParentSlug)
  const targetId = target ? safeId(target) : null
  if (targetId != null && descendants.has(targetId)) {
    error.value = 'Invalid move: cannot move a category under its own descendant.'
    return
  }
  await moveCategory(slug, targetParentSlug)
}

async function onDropToRoot() {
  const slug = draggingSlug.value
  onDragEnd()
  if (!slug) return
  await moveCategory(slug, null)
}

function debouncedLoad() {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(load, 350)
}

onMounted(load)

function exportCsv() {
  const rows = displayItems.value.map((item) => ({
    ...item,
    parent: parentDisplayName(item),
  })) as unknown as Record<string, unknown>[]
  exportToCsv(rows, csvColumns, 'categories-export.csv')
}

async function downloadApiCategoryTemplate() {
  try {
    const { data } = await usersAdminApi.getImportTemplate('categories')
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'categories_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : 'Could not download API template')
  }
}

function downloadMinimalCategoryImportCsv() {
  downloadCsvTemplate(csvColumns, 'categories-import-example.csv', {
    name: 'Electronics',
    slug: 'electronics',
    parent: '',
    description: 'Top-level category',
    icon: '',
  })
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
        const { data } = await catalogAdminApi.importCategories(file, { onUploadProgress })
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

function openCreate() {
  editSlug.value = null
  formError.value = ''
  form.value = { name: '', parent: null, description: '', image: '', image_file: null }
  showModal.value = true
}

function openCreateUnder(item: Category) {
  if (!item.slug) return
  editSlug.value = null
  formError.value = ''
  form.value = {
    name: '',
    parent: item.slug,
    description: '',
    image: '',
    image_file: null,
  }
  showModal.value = true
}

function parentSlug(val: unknown): string | null {
  if (val == null) return null
  if (typeof val === 'string') return val || null
  if (typeof val === 'object' && val !== null && 'slug' in val) return (val as { slug: string }).slug ?? null
  return null
}

/** Resolve category's parent to a slug for the form (from parent object or parent_id lookup). */
function parentSlugForForm(cat: Category): string | null {
  const fromParent = parentSlug(cat.parent)
  if (fromParent) return fromParent
  const pid = parentIdFor(cat)
  if (pid == null) return null
  const found = items.value.find((c) => safeId(c) === pid)
  return found?.slug ?? null
}

async function openEdit(item: Category) {
  editSlug.value = item.slug
  formError.value = ''
  try {
    const { data } = await catalogAdminCategoriesApi.get(item.slug)
    const d = data as Category & { parent?: string | null | { slug?: string }; parent_id?: number | null }
    const iconVal = (d.icon ?? d.icon_url ?? d.image ?? d.image_url ?? d.thumbnail ?? '') as string
    form.value = {
      name: d.name ?? '',
      parent: parentSlug(d.parent) ?? parentSlugForForm(d),
      description: d.description ?? '',
      image: iconVal ?? '',
      image_file: null,
    }
  } catch {
    const iconVal = (item.icon ?? item.icon_url ?? item.image ?? item.image_url ?? item.thumbnail ?? '') as string
    form.value = {
      name: item.name,
      parent: parentSlugForForm(item),
      description: item.description ?? '',
      image: iconVal ?? '',
      image_file: null,
    }
  }
  showModal.value = true
}

function resetForm() {
  if (lastObjectUrl) {
    URL.revokeObjectURL(lastObjectUrl)
    lastObjectUrl = null
  }
  editSlug.value = null
  formError.value = ''
  form.value = { name: '', parent: null, description: '', image: '', image_file: null }
}

async function saveCategory(ev: Event) {
  ev.preventDefault()
  formError.value = ''
  if (!form.value.name?.trim()) {
    formError.value = 'Please enter a name.'
    return
  }
  const parent = form.value.parent?.trim() || null
  const img = form.value.image?.trim()
  const hasFile = !!form.value.image_file

  try {
    if (hasFile) {
      beginIconUpload()
      try {
        const fd = new FormData()
        fd.append('name', form.value.name.trim())
        if (form.value.description?.trim()) fd.append('description', form.value.description.trim())
        fd.append('icon', form.value.image_file!)
        if (editSlug.value) {
          if (parent) {
            fd.append('parent', parent)
          } else {
            fd.append('parent_id', '0')
          }
          await catalogAdminCategoriesApi.updateWithImage(editSlug.value, fd, { onUploadProgress: onIconUploadProgress })
        } else {
          if (parent) fd.append('parent', parent)
          await catalogAdminCategoriesApi.createWithImage(fd, { onUploadProgress: onIconUploadProgress })
        }
      } finally {
        endIconUpload()
      }
    } else {
      const payload: Record<string, unknown> = {
        name: form.value.name.trim(),
        description: form.value.description?.trim() || undefined,
      }
      if (editSlug.value) {
        if (parent) {
          payload.parent = parent
        } else {
          payload.parent_id = null
        }
      } else if (parent) {
        payload.parent = parent
      }
      if (img) payload.icon = img
      else payload.icon = null
      if (editSlug.value) {
        await catalogAdminCategoriesApi.update(editSlug.value, payload)
      } else {
        await catalogAdminCategoriesApi.create({
          name: form.value.name,
          parent: parent ?? undefined,
          description: form.value.description || undefined,
          icon: img || undefined,
        })
      }
    }
    await load()
    toastSuccess(editSlug.value ? 'Category updated' : 'Category created')
    showModal.value = false
  } catch (e: unknown) {
    formError.value = formatApiError(e, 'Save failed')
    toastError(formError.value)
  }
}

async function confirmDelete(item: Category) {
  const ok = await confirmDestructiveAction({
    title: 'Delete category?',
    text: `Delete "${item.name}"? Products linked to this category may no longer be categorized.`,
  })
  if (!ok) return
  try {
    await catalogAdminCategoriesApi.delete(item.slug)
    await load()
    toastSuccess('Category deleted')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Delete failed')
    toastError(error.value)
  }
}

async function bulkDeleteSelected() {
  const slugs = selected.value.map((c) => c.slug).filter((s) => typeof s === 'string' && s.trim().length > 0)
  if (!slugs.length) return
  const ok = await confirmDestructiveAction({
    title: `Delete ${slugs.length} categories?`,
    text: `This will permanently delete ${slugs.length} categor${slugs.length === 1 ? 'y' : 'ies'}.`,
  })
  if (!ok) return
  error.value = ''
  try {
    const results = await Promise.allSettled(slugs.map((slug) => catalogAdminCategoriesApi.delete(slug)))
    const failed = results.filter((r) => r.status === 'rejected').length
    selected.value = []
    await load()
    if (failed) {
      error.value = `${failed} delete(s) failed. Refresh and try again.`
    }
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Bulk delete failed')
  }
}
</script>
