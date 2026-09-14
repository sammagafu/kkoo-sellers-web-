<template>
  <div class="catalog-category-picker" @mousedown.stop>
    <b-row>
      <b-col md="6">
        <b-form-group label="Main group" class="mb-3">
          <b-form-input
            v-if="!selectedMain"
            v-model="mainSearch"
            type="search"
            placeholder="Search (e.g. Food, Clothes, Pharmacy)…"
            autocomplete="off"
            :disabled="loading"
            @focus="openMainList"
            @input="openMainList"
          />
          <div v-if="loading" class="text-muted small mt-1">Loading categories…</div>
          <b-alert v-else-if="loadError" variant="warning" show class="small py-2 mt-1 mb-0">{{ loadError }}</b-alert>
          <div
            v-else-if="selectedMain"
            class="d-flex align-items-center gap-2 mt-2 flex-wrap"
          >
            <b-badge variant="primary" class="fw-normal py-2 px-2">
              {{ selectedMain.name }}
              <button
                type="button"
                class="btn-close btn-close-white btn-sm ms-2"
                aria-label="Clear main category"
                @click="clearMain"
              />
            </b-badge>
          </div>
          <ul
            v-else-if="mainListOpen && filteredSearchHits.length"
            class="catalog-category-picker-list list-group list-group-flush border rounded mt-1"
          >
            <li
              v-for="hit in filteredSearchHits"
              :key="hit.slug"
              class="list-group-item list-group-item-action py-2"
              role="button"
              @click="pickSearchHit(hit)"
            >
              <span class="d-block">{{ hit.name }}</span>
              <span v-if="hit.depth > 0" class="small text-muted">{{ hit.pathLabel }}</span>
            </li>
          </ul>
          <p v-else-if="mainListOpen && mainSearch.trim() && !filteredSearchHits.length" class="text-muted small mt-1 mb-0">
            No categories match your search.
          </p>
          <p v-else-if="mainListOpen && !mainSearch.trim() && !filteredSearchHits.length && !loading" class="text-muted small mt-1 mb-0">
            No categories available.
          </p>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="More specific group" class="mb-3">
          <b-form-input
            v-model="subSearch"
            type="search"
            placeholder="Search under this group…"
            autocomplete="off"
            :disabled="loading || !mainSlug"
            @focus="subListOpen = true"
            @input="subListOpen = true"
          />
          <p v-if="!mainSlug && !loading" class="text-muted small mt-1 mb-0">Pick a main group first.</p>
          <p v-else-if="mainSlug && !loading && !subcategoryOptions.length" class="text-muted small mt-1 mb-0">
            No smaller groups here — we’ll use the main group.
          </p>
          <div v-if="selectedSubLabels.length" class="d-flex flex-wrap gap-1 mt-2">
            <b-badge
              v-for="item in selectedSubLabels"
              :key="item.slug"
              variant="light"
              class="border text-secondary fw-normal py-2 px-2"
            >
              {{ item.name }}
              <button
                type="button"
                class="btn-close btn-sm ms-2"
                aria-label="Remove subcategory"
                @click="removeSub(item.slug)"
              />
            </b-badge>
          </div>
          <ul
            v-if="mainSlug && subListOpen && filteredSubcategories.length"
            class="catalog-category-picker-list list-group list-group-flush border rounded mt-1"
          >
            <li
              v-for="opt in filteredSubcategories"
              :key="opt.slug"
              class="list-group-item list-group-item-action py-2 d-flex align-items-start gap-2"
              role="button"
              @click="toggleSub(opt.slug)"
            >
              <input
                class="form-check-input mt-1 flex-shrink-0"
                type="checkbox"
                :checked="selectedSubSlugs.includes(opt.slug)"
                tabindex="-1"
                @click.stop="toggleSub(opt.slug)"
              />
              <span>
                <span class="d-block">{{ opt.label }}</span>
              </span>
            </li>
          </ul>
          <p
            v-else-if="mainSlug && subListOpen && subSearch.trim() && !filteredSubcategories.length && subcategoryOptions.length"
            class="text-muted small mt-1 mb-0"
          >
            No subcategories match your search.
          </p>
        </b-form-group>
      </b-col>
    </b-row>
    <p class="text-muted small mb-2">
      Search any category name. Nested matches select the main category and that subcategory. If there are no subcategories, only the main category is saved.
    </p>
    <div v-if="!useAdminCategories" class="border-top pt-3 mt-2">
      <p class="small text-muted mb-2">
        Need a section that isn’t listed?
        <span v-if="selectedMain">Add a subcategory under <strong>{{ selectedMain.name }}</strong>, or leave “Under selected main” off for a top-level category.</span>
        <span v-else>Sellers can create a top-level category here — it’s approved immediately.</span>
      </p>
      <b-row class="g-2 align-items-end">
        <b-col md="6">
          <b-form-input v-model="newCategoryName" placeholder="New category name" @keyup.enter="createCategory" />
        </b-col>
        <b-col md="3" v-if="selectedMain">
          <b-form-checkbox v-model="createAsSubcategory" class="mb-1">
            Under selected main
          </b-form-checkbox>
        </b-col>
        <b-col md="3">
          <b-button size="sm" variant="outline-primary" :disabled="creatingCategory || !newCategoryName.trim()" @click="createCategory">
            {{ creatingCategory ? 'Adding…' : 'Add category' }}
          </b-button>
        </b-col>
      </b-row>
      <p v-if="createMsg" class="small text-success mt-2 mb-0">{{ createMsg }}</p>
      <p v-if="createErr" class="small text-danger mt-2 mb-0">{{ createErr }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { catalogPublicApi, catalogAdminCategoriesApi, catalogSellerApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import {
  type CatalogCategoryNode,
  type FlatCategoryHit,
  parseCategoryListResponse,
  buildCategoryTreeFromFlat,
  splitSlugsToMainAndSubs,
  combineMainAndSubs,
  categorySlugsEqual,
  findCategoryNode,
  getCategoryDescendants,
  filterCategoriesByQuery,
  flattenCategories,
  buildCategoryIndex,
  isUnderRoot,
} from '@/utils/catalogCategoryTree'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    /** When true, load all admin categories (not only public approved tree). */
    useAdminCategories?: boolean
  }>(),
  {
    modelValue: () => [],
    useAdminCategories: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [string[]]
}>()

const loading = ref(false)
const loadError = ref('')
const roots = ref<CatalogCategoryNode[]>([])
const mainSlug = ref('')
const selectedSubSlugs = ref<string[]>([])
const mainSearch = ref('')
const subSearch = ref('')
const mainListOpen = ref(false)
const subListOpen = ref(false)
const newCategoryName = ref('')
const createAsSubcategory = ref(true)
const creatingCategory = ref(false)
const createMsg = ref('')
const createErr = ref('')
let syncingFromParent = false

const allHits = computed(() => flattenCategories(roots.value))

const filteredSearchHits = computed(() => {
  const hits = filterCategoriesByQuery(allHits.value, mainSearch.value)
  // Prefer shorter paths first when searching; keep alphabetical within depth.
  return [...hits]
    .sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name))
    .slice(0, 80)
})

const selectedMain = computed(() => {
  if (!mainSlug.value) return null
  return findCategoryNode(roots.value, mainSlug.value)
})

const subcategoryOptions = computed(() => {
  const main = selectedMain.value
  if (!main) return []
  return getCategoryDescendants(main).map((c) => ({
    slug: c.slug,
    name: c.name,
    label: `${'—'.repeat(Math.max(0, c.depth - 1))} ${c.name}`.trim(),
  }))
})

const filteredSubcategories = computed(() => {
  const items = subcategoryOptions.value.map((c) => ({
    slug: c.slug,
    name: c.name,
    label: c.label,
  }))
  return filterCategoriesByQuery(items, subSearch.value)
})

const selectedSubLabels = computed(() =>
  selectedSubSlugs.value
    .map((slug) => subcategoryOptions.value.find((c) => c.slug === slug))
    .filter(Boolean) as { slug: string; name: string }[]
)

function openMainList() {
  mainListOpen.value = true
}

function applyModelToLocal(slugs: string[]) {
  syncingFromParent = true
  const { main, subs } = splitSlugsToMainAndSubs(roots.value, slugs)
  mainSlug.value = main ?? ''
  selectedSubSlugs.value = subs
  mainSearch.value = ''
  if (main) {
    const node = findCategoryNode(roots.value, main)
    subListOpen.value = Boolean(node && node.children.length)
  } else {
    subListOpen.value = false
  }
  syncingFromParent = false
}

function emitModel() {
  if (syncingFromParent) return
  const next = combineMainAndSubs(mainSlug.value, selectedSubSlugs.value)
  if (categorySlugsEqual(next, props.modelValue)) return
  emit('update:modelValue', next)
}

function selectMain(slug: string, keepSubs = false) {
  mainSlug.value = slug
  mainSearch.value = ''
  mainListOpen.value = false
  if (!keepSubs) {
    selectedSubSlugs.value = []
    subSearch.value = ''
  }
  const main = findCategoryNode(roots.value, slug)
  subListOpen.value = Boolean(main && main.children.length)
  emitModel()
}

function pickSearchHit(hit: FlatCategoryHit) {
  if (hit.depth === 0) {
    selectMain(hit.slug)
    return
  }
  // Nested hit: set main root and select this subcategory.
  mainSlug.value = hit.rootSlug
  mainSearch.value = ''
  mainListOpen.value = false
  selectedSubSlugs.value = [hit.slug]
  subSearch.value = ''
  subListOpen.value = true
  emitModel()
}

function clearMain() {
  mainSlug.value = ''
  mainSearch.value = ''
  selectedSubSlugs.value = []
  subSearch.value = ''
  mainListOpen.value = true
  subListOpen.value = false
  emitModel()
}

function toggleSub(slug: string) {
  if (selectedSubSlugs.value.includes(slug)) {
    selectedSubSlugs.value = selectedSubSlugs.value.filter((s) => s !== slug)
  } else {
    selectedSubSlugs.value = [...selectedSubSlugs.value, slug]
  }
  emitModel()
}

function removeSub(slug: string) {
  selectedSubSlugs.value = selectedSubSlugs.value.filter((s) => s !== slug)
  emitModel()
}

function onDocumentClick(ev: MouseEvent) {
  const el = ev.target as Node | null
  if (!el || !(el instanceof HTMLElement)) return
  if (!el.closest('.catalog-category-picker')) {
    mainListOpen.value = false
    // Keep sub list visible once a main is chosen — it's the working panel, not a dropdown.
    if (!mainSlug.value) subListOpen.value = false
  }
}

async function loadAdminCategoryTree(): Promise<CatalogCategoryNode[]> {
  const { data } = await catalogAdminCategoriesApi.list()
  const raw = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
  return buildCategoryTreeFromFlat(raw as Parameters<typeof buildCategoryTreeFromFlat>[0])
}

async function loadCategories() {
  loading.value = true
  loadError.value = ''
  try {
    if (props.useAdminCategories) {
      try {
        roots.value = await loadAdminCategoryTree()
      } catch (adminErr) {
        const { data } = await catalogPublicApi.listCategories()
        roots.value = parseCategoryListResponse(data)
        loadError.value = formatApiError(
          adminErr,
          'Showing public categories only (admin list unavailable).'
        )
      }
    } else {
      const { data } = await catalogPublicApi.listCategories()
      roots.value = parseCategoryListResponse(data)
    }
    if (!roots.value.length) {
      loadError.value = loadError.value || 'No categories found. Create categories in Admin → Catalog → Categories.'
    }
    applyModelToLocal(props.modelValue)
    if (!mainSlug.value) mainListOpen.value = true
  } catch (e: unknown) {
    roots.value = []
    loadError.value = formatApiError(e, 'Failed to load categories')
  } finally {
    loading.value = false
  }
}

async function createCategory() {
  const name = newCategoryName.value.trim()
  if (!name || creatingCategory.value || props.useAdminCategories) return
  creatingCategory.value = true
  createMsg.value = ''
  createErr.value = ''
  try {
    const payload: { name: string; category_kind: string; parent_id?: number } = {
      name,
      category_kind: 'menu',
    }
    const nestUnderMain = Boolean(selectedMain.value && createAsSubcategory.value && selectedMain.value.id)
    if (nestUnderMain && selectedMain.value?.id) {
      payload.parent_id = selectedMain.value.id
    }
    const { data } = await catalogSellerApi.createSellerCategory(payload)
    const created = (data ?? {}) as { name?: string; slug?: string; parent_id?: number | null; id?: number }
    createMsg.value = nestUnderMain
      ? `“${created.name || name}” added under ${selectedMain.value?.name}.`
      : `“${created.name || name}” added.`
    newCategoryName.value = ''
    await loadCategories()
    if (created.slug) {
      if (nestUnderMain && mainSlug.value) {
        selectedSubSlugs.value = [...new Set([...selectedSubSlugs.value, String(created.slug)])]
        subListOpen.value = true
        emitModel()
      } else {
        selectMain(String(created.slug))
      }
    }
  } catch (e: unknown) {
    createErr.value = formatApiError(e, 'Failed to add category')
  } finally {
    creatingCategory.value = false
  }
}

watch(
  () => props.modelValue,
  (slugs) => {
    if (!roots.value.length) return
    const next = slugs ?? []
    const current = combineMainAndSubs(mainSlug.value, selectedSubSlugs.value)
    if (categorySlugsEqual(next, current)) return
    applyModelToLocal(next)
  },
  { deep: true }
)

watch(mainSlug, (next, prev) => {
  if (!prev || next === prev || syncingFromParent) return
  const index = buildCategoryIndex(roots.value)
  selectedSubSlugs.value = selectedSubSlugs.value.filter((s) => isUnderRoot(index, s, next))
  emitModel()
})

onMounted(() => {
  loadCategories()
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<style scoped>
.catalog-category-picker-list {
  max-height: 260px;
  overflow-y: auto;
  z-index: 20;
  position: relative;
  background: var(--bs-body-bg, #fff);
}
.catalog-category-picker-list .list-group-item {
  cursor: pointer;
}
</style>
