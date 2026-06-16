<template>
  <VerticalLayout>
    <b-card title="Restaurants & menu">
      <p class="text-muted mb-3">
        Restaurants (sellers with type <em>restaurant</em>) appear in the super-app Food tab. Each has a shareable menu; set <strong>menu_slug</strong> on the seller profile for a friendly link (e.g. <code>/menu/public/johns-kitchen</code>).
      </p>
      <b-row class="g-3 mb-4">
        <b-col md="6" lg="4">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:folder-broken" class="fs-2 text-primary" />
            <h6 class="mb-0">Menu categories</h6>
            <p class="small text-muted mb-0">Create and organize menu categories.</p>
            <router-link :to="{ name: 'admin.catalog.categories' }" class="btn btn-sm btn-outline-primary mt-auto">Open categories</router-link>
          </b-card>
        </b-col>
        <b-col md="6" lg="4">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:chef-hat-broken" class="fs-2 text-primary" />
            <h6 class="mb-0">Restaurants</h6>
            <p class="small text-muted mb-0">Browse restaurants and preview menus.</p>
            <router-link :to="{ name: 'admin.restaurants-menu' }" class="btn btn-sm btn-primary mt-auto">Open restaurants</router-link>
          </b-card>
        </b-col>
        <b-col md="6" lg="4">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:buildings-2-broken" class="fs-2 text-primary" />
            <h6 class="mb-0">Hotels</h6>
            <p class="small text-muted mb-0">Manage hotel storefronts and menus.</p>
            <router-link :to="{ name: 'admin.hotel' }" class="btn btn-sm btn-outline-primary mt-auto">Open hotels</router-link>
          </b-card>
        </b-col>
      </b-row>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <p class="text-muted mb-0 me-auto">Browse restaurants and preview menus.</p>
        <b-form-input
          v-model="search"
          placeholder="Search restaurant name/phone/menu slug..."
          class="w-auto"
          style="max-width: 280px;"
        />
        <b-button variant="outline-secondary" size="sm" @click="exportCsv" :disabled="!filteredRestaurants.length">Export CSV</b-button>
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
      </div>
      <b-alert v-if="error" variant="danger" dismissible show>{{ error }}</b-alert>
      <b-table v-if="filteredRestaurants.length" :items="filteredRestaurants" :fields="fields" striped responsive>
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-primary" class="me-1" @click="openMenu(row.item)">View menu</b-button>
          <router-link :to="{ name: 'admin.sellers.detail', params: { id: String(row.item.seller_id ?? row.item.user_id) } }" class="btn btn-sm btn-outline-secondary">
            Seller
          </router-link>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading restaurants…</p>
      <EmptyState v-else />
      <b-modal v-model="showMenuModal" title="Restaurant menu" size="lg" @hidden="menuData = null">
        <template v-if="menuData">
          <p><strong>{{ menuData.restaurant?.business_name }}</strong> — {{ menuData.restaurant?.contact_phone }}</p>
          <p v-if="menuData.share_slug" class="small text-muted">Share link: /menu/public/{{ menuData.share_slug }}</p>
          <div v-for="cat in menuData.categories" :key="cat.id ?? cat.slug" class="mb-3">
            <h6>{{ cat.name }}</h6>
            <ul class="list-unstyled ms-2">
              <li v-for="p in cat.products" :key="p.id ?? p.slug" class="mb-1">
                {{ p.title }} — {{ formatMoney(p.price ?? p.base_price) }}
                <span v-if="p.skus?.length" class="text-muted small">({{ p.skus.length }} SKU(s))</span>
              </li>
            </ul>
          </div>
        </template>
      </b-modal>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted, computed } from 'vue'
import { superAppApi, type RestaurantMenuResponse } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { Icon } from '@iconify/vue'
import { exportToCsv } from '@/composables/useCsv'
import { toastError, toastSuccess } from '@/utils/toast'

const restaurants = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref('')
const showMenuModal = ref(false)
const menuData = ref<RestaurantMenuResponse | null>(null)
const search = ref('')

const fields = [
  { key: 'seller_id', label: 'Seller ID' },
  { key: 'business_name', label: 'Business' },
  { key: 'contact_phone', label: 'Phone' },
  { key: 'menu_slug', label: 'Menu slug' },
  { key: 'prep_time_minutes', label: 'Prep (min)' },
  { key: 'actions', label: 'Actions' },
]

const filteredRestaurants = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return restaurants.value
  return restaurants.value.filter((r) => {
    const business = String(r.business_name ?? '').toLowerCase()
    const phone = String(r.contact_phone ?? '').toLowerCase()
    const slug = String(r.menu_slug ?? '').toLowerCase()
    const id = String(r.seller_id ?? r.user_id ?? '').toLowerCase()
    return business.includes(q) || phone.includes(q) || slug.includes(q) || id.includes(q)
  })
})

function formatMoney(v: unknown): string {
  if (v == null) return '—'
  const n = Number(v)
  return isNaN(n) ? String(v) : n.toLocaleString()
}

function exportCsv() {
  exportToCsv(filteredRestaurants.value as unknown as Record<string, unknown>[], [
    { key: 'seller_id', label: 'seller_id' },
    { key: 'business_name', label: 'business_name' },
    { key: 'contact_phone', label: 'contact_phone' },
    { key: 'menu_slug', label: 'menu_slug' },
    { key: 'prep_time_minutes', label: 'prep_time_minutes' },
  ], 'restaurants-export.csv')
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await superAppApi.getRestaurants({ limit: 200 })
    restaurants.value = (data?.results ?? []) as Record<string, unknown>[]
    toastSuccess('Restaurants loaded')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load restaurants')
    restaurants.value = []
    toastError(error.value)
  } finally {
    loading.value = false
  }
}

async function openMenu(item: Record<string, unknown>) {
  const id = item.seller_id ?? item.user_id
  if (id == null) return
  try {
    const { data } = await superAppApi.getRestaurantMenu(Number(id))
    menuData.value = data ?? null
    showMenuModal.value = true
    toastSuccess('Menu loaded')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load menu')
    toastError(error.value)
  }
}

onMounted(load)
</script>
