<template>
  <VerticalLayout>
    <b-card>
      <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
        <div class="me-auto">
          <h1 class="h4 mb-1">{{ title }}</h1>
          <p class="text-muted mb-0">{{ intro }}</p>
        </div>
        <b-button variant="primary" size="sm" @click="openAddPlace">{{ addPlaceLabel }}</b-button>
      </div>

      <ol class="small text-muted ps-3 mb-4">
        <li>{{ stepPlace }}</li>
        <li>{{ stepMenu }}</li>
        <li>{{ stepCheck }}</li>
      </ol>

      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-input v-model="search" :placeholder="searchPlaceholder" class="w-auto" style="max-width: 280px;" />
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
      </div>

      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-alert v-if="note" variant="success" show>{{ note }}</b-alert>

      <b-table v-if="filtered.length" :items="filtered" :fields="fields" striped responsive>
        <template #cell(business_name)="data">
          <strong>{{ data.item.business_name || 'Unnamed' }}</strong>
          <div class="small text-muted">{{ guestLink(data.item) }}</div>
        </template>
        <template #cell(actions)="data">
          <div class="d-flex flex-wrap gap-1">
            <b-button size="sm" variant="primary" @click="openAddItem(data.item)">{{ addItemLabel }}</b-button>
            <b-button size="sm" variant="outline-primary" @click="openMenu(data.item)">{{ viewLabel }}</b-button>
            <b-button size="sm" variant="outline-secondary" @click="openEditPlace(data.item)">Edit</b-button>
          </div>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState
        v-else
        :title="emptyTitle"
        :message="emptyMessage"
      />
    </b-card>

    <b-modal v-model="showPlace" :title="placeModalTitle" hide-footer>
      <b-alert v-if="placeError" variant="danger" show>{{ placeError }}</b-alert>
      <p class="text-muted small">Pick a business that already has an account, then set the name guests should see.</p>
      <b-form-input v-model="sellerQuery" placeholder="Search business name or phone" class="mb-2" @focus="sellerOpen = true" />
      <div v-if="sellerOpen" class="border rounded mb-3" style="max-height: 180px; overflow: auto;">
        <p v-if="sellersLoading" class="small text-muted px-3 py-2 mb-0">Searching…</p>
        <p v-else-if="!sellerMatches.length" class="small text-muted px-3 py-2 mb-0">
          No businesses found.
          <router-link :to="{ name: 'admin.sellers' }">Open sellers</router-link>
          to create the account first.
        </p>
        <button
          v-for="s in sellerMatches"
          :key="s.id"
          type="button"
          class="btn btn-link text-start w-100 text-decoration-none px-3 py-2"
          @click="pickSeller(s)"
        >
          <span class="fw-semibold">{{ s.business_name || 'Unnamed' }}</span>
          <span class="text-muted small ms-2">{{ s.contact_phone || s.seller_type }}</span>
        </button>
      </div>
      <b-form-group label="Name guests see" class="mb-2">
        <b-form-input v-model="placeForm.name" :placeholder="namePlaceholder" />
      </b-form-group>
      <b-form-group label="Phone" class="mb-0">
        <b-form-input v-model="placeForm.phone" placeholder="07…" />
      </b-form-group>
      <div class="d-flex flex-wrap gap-2 mt-4">
        <b-button variant="primary" :disabled="savingPlace" @click="savePlace">
          {{ savingPlace ? 'Saving…' : 'Save' }}
        </b-button>
        <b-button variant="outline-secondary" @click="showPlace = false">Cancel</b-button>
      </div>
    </b-modal>

    <b-modal v-model="showItem" :title="addItemLabel" hide-footer>
      <b-alert v-if="itemError" variant="danger" show>{{ itemError }}</b-alert>
      <p v-if="itemTargetName" class="small text-muted">Adding to <strong>{{ itemTargetName }}</strong>.</p>
      <b-form-group :label="itemNameLabel" class="mb-2">
        <b-form-input v-model="itemForm.name" :placeholder="itemNamePlaceholder" />
      </b-form-group>
      <b-form-group label="Price (TZS)" class="mb-2">
        <b-form-input v-model.number="itemForm.price" type="number" min="1" step="1" />
        <small class="text-muted">{{ priceHint }}</small>
      </b-form-group>
      <b-form-group label="Menu section" class="mb-2">
        <div class="d-flex flex-wrap gap-2 mb-2">
          <b-button
            v-for="section in sections"
            :key="section"
            size="sm"
            :variant="itemForm.section === section ? 'primary' : 'outline-secondary'"
            @click="itemForm.section = section"
          >
            {{ section }}
          </b-button>
        </div>
        <b-form-input v-model="itemForm.section" placeholder="Or type a section, e.g. Lunch" />
      </b-form-group>
      <b-button size="sm" variant="link" class="px-0" @click="showItemMore = !showItemMore">
        {{ showItemMore ? 'Hide details' : 'Add a short description' }}
      </b-button>
      <b-form-textarea v-if="showItemMore" v-model="itemForm.description" rows="2" class="mt-2" placeholder="What the guest should know" />
      <div class="d-flex flex-wrap gap-2 mt-4">
        <b-button variant="primary" :disabled="savingItem" @click="saveItem">
          {{ savingItem ? 'Saving…' : 'Add to menu' }}
        </b-button>
        <b-button variant="outline-secondary" @click="showItem = false">Cancel</b-button>
      </div>
    </b-modal>

    <b-modal v-model="showMenu" :title="viewLabel" size="lg" @hidden="menuData = null">
      <template v-if="menuData">
        <p class="mb-1"><strong>{{ menuPlaceName }}</strong></p>
        <p v-if="menuShare" class="small text-muted">{{ menuShareLabel }}</p>
        <div v-if="menuCategories.length">
          <div v-for="cat in menuCategories" :key="String(cat.id ?? cat.slug ?? cat.name)" class="mb-3">
            <h6 class="mb-1">{{ cat.name || 'Menu' }}</h6>
            <ul class="list-unstyled ms-2 mb-0">
              <li v-for="p in (cat.products || [])" :key="String(p.id ?? p.slug ?? p.title)" class="mb-1">
                {{ p.title }} — {{ formatMoney(p.price ?? p.base_price) }}
              </li>
            </ul>
          </div>
        </div>
        <p v-else class="text-muted mb-0">{{ emptyShelf }}</p>
      </template>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { computed, onMounted, ref } from 'vue'
import {
  catalogAdminApi,
  catalogAdminCategoriesApi,
  superAppApi,
  usersAdminApi,
  sellersAdminApi,
  type HotelMenuResponse,
  type RestaurantMenuResponse,
} from '@/api'
import { formatApiError } from '@/utils/formatApiError'

type Kind = 'hotel' | 'restaurant' | 'grocery'
type Place = Record<string, unknown>
type SellerRow = {
  id: number
  user_id: number
  business_name: string
  contact_phone: string
  seller_type: string
}

const props = defineProps<{ kind: Kind }>()

const copy = computed(() => {
  if (props.kind === 'grocery') {
    return {
      title: 'Groceries',
      intro: 'Add a grocery shop, then put items on the shelf with a price.',
      addPlaceLabel: 'Add grocery',
      addItemLabel: 'Add item',
      stepPlace: 'Add grocery — choose the business, then the name and phone.',
      stepMenu: 'Add item — name, price, and a section such as Produce, Drinks, or Household.',
      stepCheck: 'Open the shelf to check what shoppers will see.',
      searchPlaceholder: 'Search groceries',
      emptyTitle: 'No grocery shops yet',
      emptyMessage: 'Add a grocery from a business that already has an account.',
      namePlaceholder: 'e.g. Kariakoo Fresh',
      itemNameLabel: 'Item',
      itemNamePlaceholder: 'e.g. Rice 5kg, Fresh tomatoes, Cooking oil',
      priceHint: 'What the shopper pays for this item.',
      sections: ['Produce', 'Drinks', 'Household', 'Snacks'],
      viewLabel: 'View shelf',
      emptyShelf: 'Nothing on the shelf yet. Add an item.',
      savedPlace: 'Grocery saved.',
      savedItem: 'is on the shelf.',
    }
  }
  if (props.kind === 'hotel') {
    return {
      title: 'Hotels',
      intro: 'Add a hotel, then put rooms and services on its menu with a price.',
      addPlaceLabel: 'Add hotel',
      addItemLabel: 'Add room or service',
      stepPlace: 'Add hotel — choose the business, then the name and phone.',
      stepMenu: 'Add room or service — name, price, and a section such as Rooms or Breakfast.',
      stepCheck: 'Open the menu to check what guests will see.',
      searchPlaceholder: 'Search hotels',
      emptyTitle: 'No hotels yet',
      emptyMessage: 'Add a hotel from a business that already has an account.',
      namePlaceholder: 'e.g. Seaside Hotel',
      itemNameLabel: 'Room or service',
      itemNamePlaceholder: 'e.g. Deluxe double, Airport pickup',
      priceHint: 'For a room, this is the price per night.',
      sections: ['Rooms', 'Breakfast', 'Services'],
      viewLabel: 'View menu',
      emptyShelf: 'Nothing on the menu yet. Add a room or service.',
      savedPlace: 'Hotel saved.',
      savedItem: 'is on the menu.',
    }
  }
  return {
    title: 'Restaurants & menu',
    intro: 'Add a restaurant, then put dishes on its menu with a price.',
    addPlaceLabel: 'Add restaurant',
    addItemLabel: 'Add dish',
    stepPlace: 'Add restaurant — choose the business, then the name and phone.',
    stepMenu: 'Add dish — name, price, and a section such as Mains or Drinks.',
    stepCheck: 'Open the menu to check what guests will see.',
    searchPlaceholder: 'Search restaurants',
    emptyTitle: 'No restaurants yet',
    emptyMessage: 'Add a restaurant from a business that already has an account.',
    namePlaceholder: 'e.g. Mama’s Kitchen',
    itemNameLabel: 'Dish',
    itemNamePlaceholder: 'e.g. Chicken biryani, Passion juice',
    priceHint: 'What the guest pays for this dish.',
    sections: ['Starters', 'Mains', 'Drinks', 'Desserts'],
    viewLabel: 'View menu',
    emptyShelf: 'Nothing on the menu yet. Add a dish.',
    savedPlace: 'Restaurant saved.',
    savedItem: 'is on the menu.',
  }
})
const title = computed(() => copy.value.title)
const intro = computed(() => copy.value.intro)
const addPlaceLabel = computed(() => copy.value.addPlaceLabel)
const addItemLabel = computed(() => copy.value.addItemLabel)
const stepPlace = computed(() => copy.value.stepPlace)
const stepMenu = computed(() => copy.value.stepMenu)
const stepCheck = computed(() => copy.value.stepCheck)
const searchPlaceholder = computed(() => copy.value.searchPlaceholder)
const emptyTitle = computed(() => copy.value.emptyTitle)
const emptyMessage = computed(() => copy.value.emptyMessage)
const namePlaceholder = computed(() => copy.value.namePlaceholder)
const itemNameLabel = computed(() => copy.value.itemNameLabel)
const itemNamePlaceholder = computed(() => copy.value.itemNamePlaceholder)
const priceHint = computed(() => copy.value.priceHint)
const sections = computed(() => copy.value.sections)
const viewLabel = computed(() => copy.value.viewLabel)
const emptyShelf = computed(() => copy.value.emptyShelf)

const places = ref<Place[]>([])
const loading = ref(false)
const error = ref('')
const note = ref('')
const search = ref('')

const sellers = ref<SellerRow[]>([])
const sellersLoading = ref(false)
const sellerQuery = ref('')
const sellerOpen = ref(false)
const showPlace = ref(false)
const savingPlace = ref(false)
const placeError = ref('')
const placeForm = ref({ profileId: null as number | null, name: '', phone: '' })

const showItem = ref(false)
const savingItem = ref(false)
const itemError = ref('')
const showItemMore = ref(false)
const itemTarget = ref<Place | null>(null)
const itemForm = ref({ name: '', price: 0 as number, section: '', description: '' })

const showMenu = ref(false)
const menuData = ref<HotelMenuResponse | RestaurantMenuResponse | null>(null)

const fields = [
  { key: 'business_name', label: 'Name' },
  { key: 'contact_phone', label: 'Phone' },
  { key: 'actions', label: '' },
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return places.value
  return places.value.filter((row) => {
    const name = String(row.business_name ?? '').toLowerCase()
    const phone = String(row.contact_phone ?? '').toLowerCase()
    const slug = String(row.menu_slug ?? row.store_slug ?? '').toLowerCase()
    return name.includes(q) || phone.includes(q) || slug.includes(q)
  })
})

const sellerMatches = computed(() => {
  const q = sellerQuery.value.trim().toLowerCase()
  const list = sellers.value
  if (!q) return list.slice(0, 8)
  return list
    .filter((s) => s.business_name.toLowerCase().includes(q) || s.contact_phone.toLowerCase().includes(q))
    .slice(0, 8)
})

const placeModalTitle = computed(() => (placeForm.value.profileId ? 'Edit details' : addPlaceLabel.value))
const itemTargetName = computed(() => String(itemTarget.value?.business_name ?? ''))

const menuPlaceName = computed(() => {
  const data = menuData.value as { hotel?: { business_name?: string }; restaurant?: { business_name?: string } } | null
  return data?.hotel?.business_name || data?.restaurant?.business_name || ''
})
const menuShare = computed(() => String((menuData.value as { share_slug?: string } | null)?.share_slug ?? ''))
const menuShareLabel = computed(() => {
  if (!menuShare.value) return ''
  if (props.kind === 'grocery') return `Shop link: /store/${menuShare.value}`
  return `Guest link: /menu/public/${menuShare.value}`
})
const menuCategories = computed(() => {
  const cats = (menuData.value as { categories?: Record<string, unknown>[] } | null)?.categories
  return Array.isArray(cats) ? cats : []
})

function guestLink(row: Place) {
  const slug = String(row.menu_slug || row.store_slug || row.seller_id || '')
  if (!slug) return 'Link appears after you save the name'
  if (props.kind === 'grocery') return `Shop link: /store/${slug}`
  return `Guest link: /menu/public/${slug}`
}

function formatMoney(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = Number(v)
  return Number.isNaN(n)
    ? String(v)
    : new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function mapSeller(raw: Record<string, unknown>): SellerRow | null {
  const id = Number(raw.id)
  const userId = Number(raw.user_id ?? (raw.user as { id?: number } | undefined)?.id)
  if (!id || !userId) return null
  return {
    id,
    user_id: userId,
    business_name: String(raw.business_name ?? ''),
    contact_phone: String(raw.contact_phone ?? ''),
    seller_type: String(raw.seller_type ?? ''),
  }
}

async function loadSellers() {
  if (sellers.value.length || sellersLoading.value) return
  sellersLoading.value = true
  try {
    const { data } = await sellersAdminApi.list()
    const payload = data as { results?: Record<string, unknown>[] }
    const list = Array.isArray(payload?.results) ? payload.results : []
    sellers.value = list.map(mapSeller).filter((s): s is SellerRow => s != null)
  } catch (e: unknown) {
    placeError.value = formatApiError(e, 'Could not load businesses')
  } finally {
    sellersLoading.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } =
      props.kind === 'hotel'
        ? await superAppApi.getHotels({ limit: 100 })
        : props.kind === 'grocery'
          ? await superAppApi.getGroceryStores({ limit: 100 })
          : await superAppApi.getRestaurants({ limit: 100 })
    places.value = (data?.results ?? []) as Place[]
  } catch (e: unknown) {
    error.value = formatApiError(e, `Could not load ${copy.value.title.toLowerCase()}`)
    places.value = []
  } finally {
    loading.value = false
  }
}

function openAddPlace() {
  placeForm.value = { profileId: null, name: '', phone: '' }
  sellerQuery.value = ''
  placeError.value = ''
  sellerOpen.value = true
  showPlace.value = true
  void loadSellers()
}

function openEditPlace(row: Place) {
  const userId = Number(row.seller_id ?? row.user_id)
  const match = sellers.value.find((s) => s.user_id === userId)
  placeForm.value = {
    profileId: match?.id ?? null,
    name: String(row.business_name ?? ''),
    phone: String(row.contact_phone ?? match?.contact_phone ?? ''),
  }
  sellerQuery.value = placeForm.value.name
  placeError.value = ''
  sellerOpen.value = !match
  showPlace.value = true
  void loadSellers().then(() => {
    if (placeForm.value.profileId) return
    const found = sellers.value.find((s) => s.user_id === userId)
    if (found) placeForm.value.profileId = found.id
  })
}

function pickSeller(s: SellerRow) {
  placeForm.value.profileId = s.id
  placeForm.value.name = s.business_name
  placeForm.value.phone = s.contact_phone
  sellerQuery.value = s.business_name
  sellerOpen.value = false
}

async function savePlace() {
  placeError.value = ''
  const name = placeForm.value.name.trim()
  if (!placeForm.value.profileId) {
    placeError.value = 'Choose a business first.'
    return
  }
  if (!name) {
    placeError.value = 'Enter the name guests should see.'
    return
  }
  savingPlace.value = true
  try {
    await usersAdminApi.patchSellerProfile(placeForm.value.profileId, {
      seller_type: props.kind,
      business_name: name,
      contact_phone: placeForm.value.phone.trim(),
    })
    showPlace.value = false
    note.value = copy.value.savedPlace
    sellers.value = []
    await load()
  } catch (e: unknown) {
    placeError.value = formatApiError(e, 'Could not save')
  } finally {
    savingPlace.value = false
  }
}

function openAddItem(row: Place) {
  itemTarget.value = row
  itemForm.value = { name: '', price: 0, section: sections.value[0], description: '' }
  itemError.value = ''
  showItemMore.value = false
  showItem.value = true
}

async function ensureSection(name: string): Promise<string | undefined> {
  const label = name.trim()
  if (!label) return undefined
  const { data } = await catalogAdminCategoriesApi.list({ search: label, page: 1 })
  const payload = data as { results?: Record<string, unknown>[] }
  const list = Array.isArray(payload?.results) ? payload.results : []
  const hit = list.find((c) => String(c.name ?? '').trim().toLowerCase() === label.toLowerCase())
  if (hit?.slug) return String(hit.slug)
  const created = await catalogAdminCategoriesApi.create({ name: label })
  const body = created.data as { slug?: string }
  return body.slug
}

async function saveItem() {
  itemError.value = ''
  const sellerId = Number(itemTarget.value?.seller_id ?? itemTarget.value?.user_id)
  const name = itemForm.value.name.trim()
  if (!sellerId) {
    itemError.value = 'Choose a business first.'
    return
  }
  if (!name) {
    itemError.value = 'Enter a name.'
    return
  }
  if (!(Number(itemForm.value.price) > 0)) {
    itemError.value = 'Enter a price greater than zero.'
    return
  }
  savingItem.value = true
  try {
    const slug = await ensureSection(itemForm.value.section)
    const payload: Record<string, unknown> = {
      title: name,
      description: itemForm.value.description.trim() || name,
      base_price: Number(itemForm.value.price),
      seller_id: sellerId,
      status: 'published',
      available_on_microsite: true,
      available_on_marketplace: true,
    }
    if (slug) payload.category = slug
    await catalogAdminApi.createProduct(payload)
    showItem.value = false
    note.value = `${name} ${copy.value.savedItem}`
  } catch (e: unknown) {
    itemError.value = formatApiError(e, 'Could not add this')
  } finally {
    savingItem.value = false
  }
}

async function openMenu(row: Place) {
  const id = row.seller_id ?? row.user_id
  if (id == null) return
  error.value = ''
  try {
    if (props.kind === 'grocery') {
      const { data } = await catalogAdminApi.listProducts({ seller: String(id), page_size: 100 })
      const results = (data?.results ?? []) as Record<string, unknown>[]
      const groups = new Map<string, { name: string; products: { title?: string; base_price?: number; id?: number }[] }>()
      for (const product of results) {
        const category = product.category as { name?: string } | undefined
        const section = String(category?.name || 'Shelf')
        const group = groups.get(section) ?? { name: section, products: [] }
        group.products.push({
          id: Number(product.id) || undefined,
          title: String(product.title ?? ''),
          base_price: Number(product.base_price) || undefined,
        })
        groups.set(section, group)
      }
      menuData.value = {
        restaurant: { business_name: String(row.business_name ?? '') },
        share_slug: String(row.store_slug || row.menu_slug || id),
        categories: [...groups.values()],
      }
    } else {
      const { data } =
        props.kind === 'hotel'
          ? await superAppApi.getHotelMenu(Number(id))
          : await superAppApi.getRestaurantMenu(Number(id))
      menuData.value = data ?? null
    }
    showMenu.value = true
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Could not load the menu')
  }
}

onMounted(load)
</script>
