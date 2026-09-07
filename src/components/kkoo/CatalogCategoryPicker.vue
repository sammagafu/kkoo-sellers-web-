<template>
  <div class="cat-picker">
    <label v-if="label" class="cat-picker__label">{{ label }}</label>
    <p v-if="hint" class="cat-picker__hint">{{ hint }}</p>

    <div v-if="selectedPath" class="cat-picker__selected">
      <span class="cat-picker__selected-icon" aria-hidden="true">{{ selectedIcon }}</span>
      <span class="cat-picker__selected-text">{{ selectedPath }}</span>
      <button type="button" class="cat-picker__selected-clear" @click="clearSelection">
        {{ t('catalog.categoryPicker.change') }}
      </button>
    </div>

    <template v-else>
      <div class="cat-picker__search-wrap" v-if="selectionMode !== 'children'">
        <i class="bx bx-search cat-picker__search-icon" aria-hidden="true" />
        <input
          v-model="search"
          type="search"
          class="cat-picker__search"
          :placeholder="t('catalog.categoryPicker.searchPlaceholder')"
          autocomplete="off"
          :disabled="loading"
          @focus="panelOpen = true"
        />
      </div>

      <div v-if="loading" class="cat-picker__status">
        <span class="cat-picker__spinner" aria-hidden="true" />
        {{ t('catalog.categoryPicker.loading') }}
      </div>

      <div v-else-if="loadError" class="cat-picker__error-box">
        <p>{{ loadError }}</p>
        <button type="button" class="cat-picker__retry" @click="loadCategories(true)">
          {{ t('common.retry') }}
        </button>
      </div>

      <template v-else>
        <section
          v-if="selectionMode !== 'children' && recentOptions.length && !search.trim() && !drillNode"
          class="cat-picker__section"
        >
          <h3 class="cat-picker__section-title">{{ t('catalog.categoryPicker.yourUsual') }}</h3>
          <div class="cat-picker__recents">
            <button
              v-for="item in recentOptions"
              :key="item.slug"
              type="button"
              class="cat-picker__recent"
              @click="onSearchPick(item)"
            >
              <span aria-hidden="true">{{ categoryIcon(item.name, item.slug, item.icon) }}</span>
              {{ item.pathLabel }}
            </button>
          </div>
        </section>

        <section v-if="search.trim() && selectionMode !== 'children'" class="cat-picker__section">
          <h3 class="cat-picker__section-title">{{ t('catalog.categoryPicker.searchResults') }}</h3>
          <ul v-if="searchResults.length" class="cat-picker__list">
            <li v-for="item in searchResults" :key="item.slug">
              <button type="button" class="cat-picker__list-btn" @click="onSearchPick(item)">
                <span class="cat-picker__list-icon" aria-hidden="true">{{
                  categoryIcon(item.name, item.slug, item.icon)
                }}</span>
                <span class="cat-picker__list-text">
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.pathLabel }}</small>
                </span>
                <i
                  v-if="item.hasChildren && selectionMode === 'full'"
                  class="bx bx-chevron-right"
                  aria-hidden="true"
                />
              </button>
            </li>
          </ul>
          <p v-else class="cat-picker__empty">{{ t('catalog.categoryPicker.noMatch') }}</p>
        </section>

        <section v-else class="cat-picker__section">
          <div v-if="drillNode && selectionMode !== 'roots'" class="cat-picker__breadcrumb" role="navigation" aria-label="Category path">
            <button type="button" class="cat-picker__crumb cat-picker__crumb--back" @click="drillBack">
              <i class="bx bx-arrow-back" aria-hidden="true" />
              {{ t('common.back') }}
            </button>
            <button
              v-for="(crumb, idx) in drillTrail"
              :key="crumb.slug"
              type="button"
              class="cat-picker__crumb"
              :class="{ 'cat-picker__crumb--active': idx === drillTrail.length - 1 }"
              :aria-current="idx === drillTrail.length - 1 ? 'page' : undefined"
              @click="drillToCrumb(crumb, idx)"
            >
              {{ crumb.name }}
            </button>
          </div>

          <h3 v-if="!drillNode" class="cat-picker__section-title">
            {{
              selectionMode === 'children'
                ? t('catalog.categoryPicker.subcategories')
                : t('catalog.categoryPicker.browse')
            }}
          </h3>

          <p v-if="selectionMode === 'children' && !visibleNodes.length" class="cat-picker__empty">
            {{ t('catalog.categoryPicker.noSubcategories') }}
          </p>

          <div v-else class="cat-picker__tiles">
            <button
              v-for="node in visibleNodes"
              :key="node.slug"
              type="button"
              class="cat-picker__tile"
              @click="onTileClick(node)"
            >
              <span class="cat-picker__tile-icon" aria-hidden="true">{{
                categoryIcon(node.name, node.slug, node.icon)
              }}</span>
              <span class="cat-picker__tile-name">{{ tileLabel(node) }}</span>
              <span v-if="swahiliLabel(node.name, node.slug)" class="cat-picker__tile-sw">{{
                swahiliLabel(node.name, node.slug)
              }}</span>
              <i
                v-if="node.children.length && selectionMode !== 'roots'"
                class="bx bx-chevron-right cat-picker__tile-chevron"
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            v-if="(selectionMode === 'full' || selectionMode === 'roots') && !drillNode && shopMenuRootsRef.length"
            class="cat-picker__shop"
          >
            <h3 class="cat-picker__section-title">{{ t('catalog.categoryPicker.shopSections') }}</h3>
            <div class="cat-picker__tiles cat-picker__tiles--compact">
              <button
                v-for="node in shopMenuRootsRef"
                :key="node.slug"
                type="button"
                class="cat-picker__tile cat-picker__tile--shop"
                @click="onTileClick(node)"
              >
                <span class="cat-picker__tile-icon" aria-hidden="true">{{
                  categoryIcon(node.name, node.slug, node.icon)
                }}</span>
                <span class="cat-picker__tile-name">{{ tileLabel(node) }}</span>
                <small class="cat-picker__tile-slug">{{ node.slug.replace(/-/g, ' ') }}</small>
              </button>
            </div>
          </div>
        </section>
      </template>
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { catalogPublicApi, catalogAdminCategoriesApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { categoryIcon, matchesCategoryQuery, swahiliLabel } from '@/utils/catalogCategoryLabels'
import {
  type CatalogCategoryNode,
  buildCategoryTreeFromFlat,
  categorySlugsEqual,
  combineMainAndSubs,
  disambiguatedRootLabel,
  flattenCategoryTree,
  getCategoryPathLabel,
  parseCategoryListResponse,
  partitionRoots,
  rootNameCounts,
  splitSlugsToMainAndSubs,
} from '@/utils/catalogCategoryTree'
import {
  loadCachedCategoryTree,
  loadRecentCategorySlugs,
  rememberCategorySlug,
  saveCachedCategoryTree,
} from '@/composables/useProductDraftAutosave'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    useAdminCategories?: boolean
    label?: string
    hint?: string
    /** full = pick any leaf (default). roots = pick top category only. children = pick under parentSlug. */
    selectionMode?: 'full' | 'roots' | 'children'
    parentSlug?: string
  }>(),
  {
    modelValue: () => [],
    useAdminCategories: false,
    label: '',
    hint: '',
    selectionMode: 'full',
    parentSlug: '',
  }
)

const emit = defineEmits<{
  'update:modelValue': [string[]]
  'selection-meta': [{ slug: string; hasChildren: boolean }]
}>()

const { t } = useI18n()
const auth = useAuthStore()

const loading = ref(false)
const loadError = ref('')
const roots = ref<CatalogCategoryNode[]>([])
const search = ref('')
const drillNode = ref<CatalogCategoryNode | null>(null)
const panelOpen = ref(false)
const flatOptions = computed(() => flattenCategoryTree(roots.value))
const browseRootsRef = computed(() => partitionRoots(roots.value).browseRoots)
const shopMenuRootsRef = computed(() => partitionRoots(roots.value).shopMenuRoots)

const nameCounts = computed(() => rootNameCounts(roots.value))

const parentNode = computed(() => {
  const slug = String(props.parentSlug || '').trim()
  if (!slug) return null
  return findNode(roots.value, slug)
})

const visibleNodes = computed(() => {
  if (props.selectionMode === 'children') {
    if (drillNode.value) return drillNode.value.children
    return parentNode.value?.children ?? []
  }
  if (drillNode.value) return drillNode.value.children
  return browseRootsRef.value
})

const selectedSlug = computed(() => {
  const slugs = props.modelValue ?? []
  if (!slugs.length) return ''
  if (props.selectionMode === 'roots') {
    const { main } = splitSlugsToMainAndSubs(roots.value, slugs)
    return main || slugs[0]
  }
  if (props.selectionMode === 'children') {
    const { subs } = splitSlugsToMainAndSubs(roots.value, slugs)
    return subs.length ? subs[subs.length - 1] : ''
  }
  const { subs } = splitSlugsToMainAndSubs(roots.value, slugs)
  return subs.length ? subs[subs.length - 1] : slugs[0]
})

const selectedHasChildren = computed(() => {
  if (!selectedSlug.value) return false
  const node = findNode(roots.value, selectedSlug.value)
  return !!(node && node.children.length > 0)
})

const parentHasChildren = computed(() => !!(parentNode.value && parentNode.value.children.length > 0))

defineExpose({
  selectedHasChildren,
  selectedSlug,
  parentHasChildren,
})

const selectedPath = computed(() => {
  if (!selectedSlug.value || !roots.value.length) return ''
  return getCategoryPathLabel(roots.value, selectedSlug.value)
})

const selectedIcon = computed(() => {
  const item = flatOptions.value.find((o) => o.slug === selectedSlug.value)
  return item ? categoryIcon(item.name, item.slug, item.icon) : '📦'
})

const recentOptions = computed(() => {
  const slugs = loadRecentCategorySlugs(auth.user?.id)
  return slugs
    .map((slug) => flatOptions.value.find((o) => o.slug === slug))
    .filter(Boolean) as ReturnType<typeof flattenCategoryTree>
})

const searchResults = computed(() => {
  const q = search.value.trim()
  if (!q) return []
  return flatOptions.value
    .filter((item) => matchesCategoryQuery(item.name, item.slug, item.pathLabel, q))
    .slice(0, 12)
})

function tileLabel(node: CatalogCategoryNode): string {
  if (!drillNode.value) return disambiguatedRootLabel(node, nameCounts.value)
  return node.name
}

function emitSlug(slug: string) {
  if (!slug) {
    emit('update:modelValue', [])
    emit('selection-meta', { slug: '', hasChildren: false })
    return
  }
  const node = findNode(roots.value, slug)
  const hasChildren = !!(node && node.children.length > 0)

  let next: string[]
  if (props.selectionMode === 'roots') {
    next = [slug]
  } else if (props.selectionMode === 'children') {
    const parent = String(props.parentSlug || '').trim()
    next = combineMainAndSubs(parent || null, [slug])
  } else {
    const { main } = splitSlugsToMainAndSubs(roots.value, [slug])
    next = combineMainAndSubs(main, [slug])
  }

  if (!categorySlugsEqual(next, props.modelValue)) {
    emit('update:modelValue', next)
  }
  emit('selection-meta', { slug, hasChildren })
  rememberCategorySlug(slug, auth.user?.id)
}

function pickCategory(slug: string) {
  emitSlug(slug)
  search.value = ''
  drillNode.value = null
}

function onTileClick(node: CatalogCategoryNode) {
  // Roots step: pick the category, then wizard advances to subcategory.
  if (props.selectionMode === 'roots') {
    pickCategory(node.slug)
    return
  }
  if (node.children.length) {
    drillNode.value = node
    return
  }
  pickCategory(node.slug)
}

function onSearchPick(item: (typeof flatOptions.value)[number]) {
  if (props.selectionMode === 'roots') {
    // Prefer the root of whatever matched so subcategory comes next.
    const node = findNode(roots.value, item.slug)
    const rootSlug = node
      ? (() => {
          let cur: CatalogCategoryNode | null = node
          let parent = findParent(roots.value, cur.slug)
          while (parent) {
            cur = parent
            parent = findParent(roots.value, cur.slug)
          }
          return cur?.slug || item.slug
        })()
      : item.slug
    pickCategory(rootSlug)
    return
  }
  if (item.hasChildren) {
    const node = findNode(roots.value, item.slug)
    if (node) drillNode.value = node
    else pickCategory(item.slug)
    return
  }
  pickCategory(item.slug)
}

function findNode(nodes: CatalogCategoryNode[], slug: string): CatalogCategoryNode | null {
  for (const n of nodes) {
    if (n.slug === slug) return n
    const found = findNode(n.children, slug)
    if (found) return found
  }
  return null
}

function drillBack() {
  if (!drillNode.value) return
  drillNode.value = findParent(roots.value, drillNode.value.slug)
}

/** Ancestor chain from root → current drill node (for pill breadcrumbs). */
const drillTrail = computed(() => {
  const current = drillNode.value
  if (!current) return [] as CatalogCategoryNode[]
  const trail: CatalogCategoryNode[] = [current]
  let parent = findParent(roots.value, current.slug)
  while (parent) {
    trail.unshift(parent)
    parent = findParent(roots.value, parent.slug)
  }
  return trail
})

function drillToCrumb(crumb: CatalogCategoryNode, idx: number) {
  if (idx === drillTrail.value.length - 1) return
  drillNode.value = crumb
}

function findParent(
  nodes: CatalogCategoryNode[],
  slug: string,
  parent: CatalogCategoryNode | null = null
): CatalogCategoryNode | null {
  for (const n of nodes) {
    if (n.slug === slug) return parent
    const found = findParent(n.children, slug, n)
    if (found !== null) return found
  }
  return null
}

function clearSelection() {
  emit('update:modelValue', [])
  emit('selection-meta', { slug: '', hasChildren: false })
  panelOpen.value = true
}

async function loadAdminCategoryTree(): Promise<CatalogCategoryNode[]> {
  const { data } = await catalogAdminCategoriesApi.list()
  const raw = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
  return buildCategoryTreeFromFlat(raw as Parameters<typeof buildCategoryTreeFromFlat>[0])
}

async function loadCategories(force = false) {
  loading.value = true
  loadError.value = ''
  try {
    if (!force) {
      const cached = loadCachedCategoryTree(props.useAdminCategories)
      if (cached?.length) {
        roots.value = parseCategoryListResponse(cached)
        loading.value = false
        return
      }
    }

    if (props.useAdminCategories) {
      try {
        roots.value = await loadAdminCategoryTree()
      } catch (adminErr) {
        const { data } = await catalogPublicApi.listCategories()
        roots.value = parseCategoryListResponse(data)
        loadError.value = formatApiError(adminErr, t('catalog.categoryPicker.publicFallback'))
      }
    } else {
      const { data } = await catalogPublicApi.listCategories()
      roots.value = parseCategoryListResponse(data)
    }

    if (roots.value.length) {
      saveCachedCategoryTree(roots.value, props.useAdminCategories)
    } else {
      loadError.value = t('catalog.categoryPicker.empty')
    }
  } catch (e: unknown) {
    roots.value = []
    loadError.value = formatApiError(e, t('catalog.categoryPicker.loadFailed'))
  } finally {
    loading.value = false
  }
}

watch(
  () => props.parentSlug,
  () => {
    drillNode.value = null
    search.value = ''
  }
)

watch(
  () => props.modelValue,
  () => {
    if (selectedSlug.value) rememberCategorySlug(selectedSlug.value, auth.user?.id)
  }
)

onMounted(() => loadCategories())
</script>

<style scoped>
.cat-picker {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.cat-picker__label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--kkoo-text-dark, #111827);
}
.cat-picker__hint {
  margin: 0;
  color: var(--kkoo-text-muted, #6a4c86);
  font-size: 0.8rem;
}
.cat-picker__selected {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--kkoo-radius-md, 13px);
  background: rgba(92, 48, 143, 0.08);
  border: 1px solid rgba(92, 48, 143, 0.18);
}
.cat-picker__selected-icon {
  font-size: 1.35rem;
  line-height: 1;
}
.cat-picker__selected-text {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--kkoo-text-dark, #111827);
}
.cat-picker__selected-clear {
  border: 0;
  background: none;
  color: var(--kkoo-primary, #5c308f);
  font-weight: 600;
  font-size: 0.85rem;
  min-height: 44px;
  padding: 0 0.25rem;
}
.cat-picker__search-wrap {
  position: relative;
}
.cat-picker__search-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--kkoo-text-muted, #6a4c86);
  font-size: 1.1rem;
  pointer-events: none;
}
.cat-picker__search {
  width: 100%;
  min-height: 48px;
  padding: 0.7rem 0.9rem 0.7rem 2.35rem;
  border: 1px solid rgba(92, 48, 143, 0.16);
  border-radius: var(--kkoo-radius-md, 13px);
  background: #fff;
  font-size: 1rem;
}
.cat-picker__search:focus {
  outline: 2px solid var(--kkoo-primary, #5c308f);
  outline-offset: 1px;
  border-color: transparent;
}
.cat-picker__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--kkoo-text-muted, #6a4c86);
  font-size: 0.875rem;
}
.cat-picker__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(92, 48, 143, 0.2);
  border-top-color: var(--kkoo-primary, #5c308f);
  border-radius: 50%;
  animation: cat-spin 0.7s linear infinite;
}
@keyframes cat-spin {
  to {
    transform: rotate(360deg);
  }
}
.cat-picker__error-box {
  padding: 0.75rem;
  border-radius: var(--kkoo-radius-md, 13px);
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 0.875rem;
}
.cat-picker__error-box p {
  margin: 0 0 0.5rem;
}
.cat-picker__retry {
  min-height: 44px;
  padding: 0.45rem 0.85rem;
  border: 1px solid rgba(92, 48, 143, 0.25);
  border-radius: 999px;
  background: #fff;
  color: var(--kkoo-primary, #5c308f);
  font-weight: 600;
}
.cat-picker__section-title {
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--kkoo-text-muted, #6a4c86);
}
.cat-picker__recents {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.cat-picker__recent {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0.4rem 0.85rem;
  border: 1px solid rgba(92, 48, 143, 0.16);
  border-radius: 999px;
  background: #fff;
  text-align: left;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--kkoo-primary, #5c308f);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.cat-picker__recent:hover {
  background: rgba(92, 48, 143, 0.08);
  border-color: var(--kkoo-primary, #5c308f);
}
.cat-picker__tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}
.cat-picker__tiles--compact {
  grid-template-columns: 1fr;
}
.cat-picker__tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  min-height: 72px;
  padding: 0.65rem 0.7rem;
  border: 1px solid rgba(92, 48, 143, 0.14);
  border-radius: var(--kkoo-radius-md, 13px);
  background: #fff;
  text-align: left;
}
.cat-picker__tile--shop {
  min-height: 56px;
}
.cat-picker__tile-icon {
  font-size: 1.35rem;
  line-height: 1;
}
.cat-picker__tile-name {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--kkoo-text-dark, #111827);
  line-height: 1.2;
}
.cat-picker__tile-sw {
  font-size: 0.78rem;
  color: var(--kkoo-text-muted, #6a4c86);
}
.cat-picker__tile-slug {
  font-size: 0.72rem;
  color: var(--kkoo-text-muted, #6a4c86);
}
.cat-picker__tile-chevron {
  position: absolute;
  right: 0.55rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--kkoo-text-muted, #6a4c86);
}
.cat-picker__breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.65rem;
}
.cat-picker__crumb {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 36px;
  padding: 0.3rem 0.8rem;
  border: 1px solid rgba(92, 48, 143, 0.16);
  border-radius: 999px;
  background: #fff;
  color: var(--kkoo-primary, #5c308f);
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.cat-picker__crumb:hover {
  background: rgba(92, 48, 143, 0.08);
  border-color: var(--kkoo-primary, #5c308f);
}
.cat-picker__crumb--back {
  color: var(--kkoo-text-muted, #6a4c86);
}
.cat-picker__crumb--active {
  background: var(--kkoo-primary, #5c308f);
  border-color: var(--kkoo-primary, #5c308f);
  color: #fff;
  cursor: default;
}
.cat-picker__crumb--active:hover {
  background: var(--kkoo-primary, #5c308f);
  color: #fff;
}
.cat-picker__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(92, 48, 143, 0.12);
  border-radius: var(--kkoo-radius-md, 13px);
  overflow: hidden;
}
.cat-picker__list-btn {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  min-height: 52px;
  padding: 0.55rem 0.75rem;
  border: 0;
  border-bottom: 1px solid rgba(92, 48, 143, 0.08);
  background: #fff;
  text-align: left;
}
.cat-picker__list li:last-child .cat-picker__list-btn {
  border-bottom: 0;
}
.cat-picker__list-icon {
  font-size: 1.25rem;
}
.cat-picker__list-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.cat-picker__list-text strong {
  font-size: 0.92rem;
  color: var(--kkoo-text-dark, #111827);
}
.cat-picker__list-text small {
  color: var(--kkoo-text-muted, #6a4c86);
  font-size: 0.78rem;
}
.cat-picker__empty {
  margin: 0;
  color: var(--kkoo-text-muted, #6a4c86);
  font-size: 0.875rem;
}
.cat-picker__shop {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed rgba(92, 48, 143, 0.15);
}
</style>
