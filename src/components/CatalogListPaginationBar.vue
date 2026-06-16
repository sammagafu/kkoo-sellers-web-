<template>
  <div
    v-if="total > 0"
    class="catalog-pagination-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3 pt-3 border-top"
  >
    <div class="d-flex flex-wrap align-items-center gap-2 small text-muted">
      <span>{{ rangeLabel }}</span>
      <label class="d-inline-flex align-items-center gap-1 mb-0">
        <span class="text-nowrap">{{ t('catalog.perPage') }}</span>
        <b-form-select
          :model-value="pageSize"
          :options="pageSizeOptions"
          size="sm"
          class="catalog-page-size-select"
          :disabled="loading"
          @update:model-value="onPageSizeChange"
        />
      </label>
    </div>
    <b-pagination
      v-if="showPager"
      :model-value="page"
      :total-rows="total"
      :per-page="pageSize"
      size="sm"
      class="mb-0"
      :disabled="loading"
      @update:model-value="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CATALOG_PAGE_SIZE_OPTIONS,
  type CatalogPageSize,
} from '@/composables/useCatalogListPagination'

const props = withDefaults(
  defineProps<{
    page: number
    pageSize: number
    total: number
    rangeStart: number
    rangeEnd: number
    loading?: boolean
  }>(),
  { loading: false },
)

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [size: CatalogPageSize]
}>()

const { t } = useI18n()

const pageSizeOptions = CATALOG_PAGE_SIZE_OPTIONS.map((n) => ({ value: n, text: String(n) }))

const showPager = computed(() => props.total > props.pageSize)

const rangeLabel = computed(() =>
  t('catalog.showingRange', {
    start: props.rangeStart,
    end: props.rangeEnd,
    total: props.total,
  }),
)

function onPageChange(v: unknown) {
  const n = Number(v)
  if (Number.isFinite(n) && n >= 1) emit('update:page', n)
}

function onPageSizeChange(v: unknown) {
  const n = Number(v)
  if ((CATALOG_PAGE_SIZE_OPTIONS as readonly number[]).includes(n)) {
    emit('update:pageSize', n as CatalogPageSize)
  }
}
</script>

<style scoped>
.catalog-page-size-select {
  width: auto;
  min-width: 4.5rem;
}
</style>
