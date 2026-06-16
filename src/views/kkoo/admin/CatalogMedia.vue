<template>
  <VerticalLayout>
    <b-row>
      <b-col>
        <b-card title="Media">
          <p class="text-muted">List and verify media assets. Each row shows the product name and its media.</p>
          <b-alert v-if="endpointUnavailable" variant="info" show class="mb-0">
            <strong>Endpoint not available.</strong> The backend does not yet expose
            <code>GET /api/v1/catalog/admin/media/</code>. Add this route in kkoo-fiber to list and verify catalog media.
          </b-alert>
          <template v-else-if="!loading && !error">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
              <b-button variant="outline-primary" size="sm" @click="load">Refresh</b-button>
            </div>
            <b-table
              v-if="groupedItems.length"
              :items="groupedItems"
              :fields="fields"
              striped
              responsive
            >
              <template #cell(product_name)="row">
                {{ productName(row.item.product_id) }}
              </template>
              <template #cell(media)="row">
                <div
                  v-if="row.item.mediaItems && row.item.mediaItems.length"
                  class="media-row"
                >
                  <img
                    v-for="media in row.item.mediaItems"
                    :key="media.id ?? media.file ?? media.caption ?? media.created_at"
                    :src="mediaUrl(media) || ''"
                    alt="Media"
                    class="media-thumb"
                    loading="lazy"
                  />
                </div>
                <span v-else class="text-muted">—</span>
              </template>
              <template #cell(is_verified)="row">
                <b-badge :variant="row.item.is_verified ? 'success' : 'secondary'">
                  {{ row.item.is_verified ? 'Yes' : 'No' }}
                </b-badge>
              </template>
              <template #cell(is_primary)="row">
                <b-badge v-if="row.item.is_primary" variant="primary">Primary</b-badge>
                <span v-else class="text-muted">—</span>
              </template>
              <template #cell(actions)="row">
                <b-button
                  size="sm"
                  :variant="isGroupVerified(row.item) ? 'outline-warning' : 'outline-success'"
                  @click="toggleVerifyGroup(row.item)"
                >
                  {{ isGroupVerified(row.item) ? 'Unverify all' : 'Verify all' }}
                </b-button>
              </template>
            </b-table>
            <EmptyState v-else />
            <p
              v-if="productCount && mediaCount"
              class="text-muted small mt-2"
            >
              Showing {{ productCount }} product<span v-if="productCount !== 1">s</span>
              with {{ mediaCount }} media item<span v-if="mediaCount !== 1">s</span>
            </p>
          </template>
          <p v-else-if="loading" class="text-muted mb-0">Loading…</p>
          <p v-else-if="error" class="text-danger mb-0">{{ error }}</p>
        </b-card>
      </b-col>
    </b-row>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted, computed } from 'vue'
import { catalogAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { resolveAssetUrl } from '@/utils/assetUrl'

const loading = ref(false)
const error = ref('')
const endpointUnavailable = ref(false)
const mediaItems = ref<Record<string, unknown>[]>([])
const totalMedia = ref<number | null>(null)
const productMap = ref<Record<number, string>>({})

const fields = [
  { key: 'id', label: 'ID', thStyle: { width: '60px' } },
  { key: 'product_name', label: 'Product', sortable: false },
  { key: 'media', label: 'Media', sortable: false, thStyle: { width: '160px' } },
  { key: 'media_type', label: 'Type' },
  { key: 'is_verified', label: 'Verified' },
  { key: 'is_primary', label: 'Primary' },
  { key: 'caption', label: 'Caption' },
  { key: 'created_at', label: 'Created' },
  { key: 'media_count', label: 'Media count', thStyle: { width: '110px' } },
  { key: 'actions', label: 'Actions', sortable: false, thStyle: { width: '150px' } },
]

const groupedItems = computed(() => {
  const groups = new Map<number | 'unknown', Record<string, unknown>[]>()

  for (const item of mediaItems.value) {
    const productId = item.product_id as number | undefined
    const key: number | 'unknown' = typeof productId === 'number' ? productId : 'unknown'
    const arr = groups.get(key) ?? []
    arr.push(item)
    groups.set(key, arr)
  }

  const result: Record<string, unknown>[] = []

  for (const [key, items] of groups.entries()) {
    if (!items.length) continue
    const representative =
      items.find((i) => (i as { is_primary?: boolean }).is_primary) ?? items[0]

    const row: Record<string, unknown> = { ...representative }
    ;(row as { product_id?: number | null }).product_id =
      key === 'unknown' ? null : (key as number)
    ;(row as { mediaItems?: Record<string, unknown>[] }).mediaItems = items
    ;(row as { media_count?: number }).media_count = items.length
    ;(row as { is_verified?: boolean }).is_verified = items.every(
      (i) => (i as { is_verified?: boolean }).is_verified === true,
    )

    result.push(row)
  }

  return result
})

const productCount = computed(() => groupedItems.value.length)
const mediaCount = computed(
  () => totalMedia.value ?? mediaItems.value.length,
)

function isGroupVerified(row: Record<string, unknown>): boolean {
  const mediaList =
    (row.mediaItems as Record<string, unknown>[] | undefined) ?? []
  if (!mediaList.length) return false
  return mediaList.every(
    (m) => (m as { is_verified?: boolean }).is_verified === true,
  )
}

function productName(productId: number | undefined): string {
  if (productId == null) return '—'
  const name = productMap.value[productId]
  return name ?? `Product #${productId}`
}

function mediaUrl(item: Record<string, unknown>): string | null {
  const file = item.file as string | undefined
  return resolveAssetUrl(file ?? null)
}

async function loadProducts(productIds: number[]) {
  const ids = [...new Set(productIds)].filter(Boolean)
  if (ids.length === 0) return
  try {
    const { data } = await catalogAdminApi.listProducts({ page_size: 500 })
    const results = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
    const map: Record<number, string> = {}
    for (const p of results as Record<string, unknown>[]) {
      const id = p.id as number
      const title = (p.title as string) ?? (p.name as string)
      if (id != null && title) map[id] = title
    }
    productMap.value = { ...productMap.value, ...map }
  } catch {
    // non-fatal: we still show "Product #id"
  }
}

async function load() {
  loading.value = true
  error.value = ''
  endpointUnavailable.value = false
  try {
    const { data } = await catalogAdminApi.listMedia({ page: 1 })
    const raw = data as { results?: unknown[]; total?: number; count?: number; page?: number }
    const list = Array.isArray(data) ? data : raw?.results ?? []
    mediaItems.value = list as Record<string, unknown>[]
    totalMedia.value = raw?.total ?? raw?.count ?? null

    const productIds = (list as Record<string, unknown>[])
      .map((item) => item.product_id as number)
      .filter((id): id is number => typeof id === 'number')
    await loadProducts(productIds)
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status
    if (status === 404 || status === 405) {
      endpointUnavailable.value = true
    } else {
      error.value = formatApiError(e, 'Failed to load media')
    }
  } finally {
    loading.value = false
  }
}

async function toggleVerifyGroup(row: Record<string, unknown>) {
  const mediaList =
    (row.mediaItems as { id?: number; is_verified?: boolean }[] | undefined) ??
    []
  if (!mediaList.length) return

  const action: 'approve' | 'reject' = isGroupVerified(row) ? 'reject' : 'approve'

  try {
    await Promise.all(
      mediaList.map((m) => {
        const id = m.id
        if (typeof id !== 'number') return Promise.resolve()
        return catalogAdminApi.verifyMedia(id, {
          action,
          ...(action === 'reject' && { rejection_reason: 'Rejected from admin media review' }),
        })
      }),
    )
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to update media verification')
  }
}

onMounted(load)
</script>

<style scoped>
.media-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  align-items: center;
  overflow-x: auto;
}

.media-thumb {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  background: var(--bs-light, #f8f9fa);
  flex: 0 0 auto;
}
</style>
