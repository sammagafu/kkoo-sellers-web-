<template>
  <VerticalLayout>
    <GrowthGuide
      title="Dar events"
      what="Concerts and community events in Dar. Buyers buy a ticket on Discover. You check them in with the ticket code."
      :steps="[
        'Tap Add event. Name, when, place, a photo, and one ticket price are enough.',
        'Publish. Buyers see it on Discover.',
        'On the day, paste the ticket code and tap Check in.',
      ]"
      actions="Create and edit are on this page. Check in marks someone as arrived and can add attendance points."
    />
    <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
    <b-alert v-if="success" variant="success" dismissible show>{{ success }}</b-alert>

    <b-card title="Events" class="mb-4">
      <div class="d-flex flex-wrap align-items-end gap-2 mb-3">
        <b-button variant="primary" @click="openCreate">Add event</b-button>
        <b-form-input v-model="checkInCode" placeholder="Ticket code to check in" style="max-width: 16rem" @keyup.enter="doCheckIn" />
        <b-button variant="outline-primary" :disabled="checkingIn || !checkInCode.trim()" @click="doCheckIn">
          {{ checkingIn ? '…' : 'Check in' }}
        </b-button>
        <b-button variant="outline-secondary" :disabled="loading" @click="load">Refresh</b-button>
      </div>
      <p v-if="loading" class="text-muted">Loading…</p>
      <b-table v-else :items="events" :fields="fields" small responsive hover>
        <template #cell(cover)="data">
          <img
            v-if="coverUrl(data.item)"
            :src="coverUrl(data.item)!"
            alt=""
            class="event-cover-thumb"
          />
          <span v-else class="text-muted small">No cover</span>
        </template>
        <template #cell(starts_at)="data">
          {{ formatDate(data.item.starts_at) }}
        </template>
        <template #cell(status)="data">
          <b-badge :variant="data.item.status === 'published' ? 'success' : 'secondary'">{{ data.item.status }}</b-badge>
        </template>
        <template #cell(actions)="data">
          <b-button
            v-if="data.item.status !== 'published'"
            size="sm"
            variant="outline-success"
            class="me-1"
            @click="publish(data.item)"
          >
            Publish
          </b-button>
          <label class="btn btn-sm btn-outline-primary mb-0">
            {{ uploadingCoverId === data.item.id ? '…' : 'Cover' }}
            <input
              type="file"
              accept="image/*"
              class="d-none"
              :disabled="uploadingCoverId === data.item.id"
              @change="(e) => onRowCoverChange(data.item, e)"
            />
          </label>
        </template>
      </b-table>
      <p v-if="!loading && !events.length" class="text-muted mb-0">No events yet. Tap Add event.</p>
    </b-card>

    <b-modal v-model="showEventForm" title="Add event" size="lg" hide-footer>
      <p class="text-muted small">Name, when, place, a photo, and one ticket. It goes live on Discover.</p>
      <b-form-group label="Event name">
        <b-form-input v-model="form.title" placeholder="Sunday live at the waterfront" />
      </b-form-group>
      <b-row class="g-2">
        <b-col md="6">
          <b-form-group label="Starts">
            <b-form-input v-model="form.starts_local" type="datetime-local" />
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group label="Ends">
            <b-form-input v-model="form.ends_local" type="datetime-local" />
          </b-form-group>
        </b-col>
      </b-row>
      <b-form-group label="Place">
        <b-form-input v-model="form.venue_name" placeholder="Mlimani City Hall" />
      </b-form-group>
      <b-form-group label="Cover photo">
        <img v-if="coverPreview" :src="coverPreview" alt="Cover preview" class="event-cover-preview mb-2" />
        <input type="file" accept="image/*" class="form-control" @change="onCoverChange" />
      </b-form-group>
      <p class="small fw-semibold mb-2">Ticket</p>
      <b-row v-if="form.ticket_classes[0]" class="g-2">
        <b-col md="5">
          <b-form-group label="Name">
            <b-form-input v-model="form.ticket_classes[0].name" placeholder="General" />
          </b-form-group>
        </b-col>
        <b-col md="4">
          <b-form-group label="Price (TZS)">
            <b-form-input v-model.number="form.ticket_classes[0].price" type="number" min="0" />
          </b-form-group>
        </b-col>
        <b-col md="3">
          <b-form-group label="Seats">
            <b-form-input v-model.number="form.ticket_classes[0].capacity" type="number" min="1" />
          </b-form-group>
        </b-col>
      </b-row>

      <button type="button" class="btn btn-link btn-sm px-0 mb-2" @click="showEventMore = !showEventMore">
        {{ showEventMore ? 'Hide extra details' : 'Add VIP, summary, or another ticket' }}
      </button>
      <div v-if="showEventMore">
        <b-row class="g-2">
          <b-col md="4">
            <b-form-group label="Kind">
              <b-form-select v-model="form.category" :options="categoryOptions" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="City">
              <b-form-input v-model="form.city" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Organizer">
              <b-form-input v-model="form.organizer_name" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="Short description">
          <b-form-textarea v-model="form.summary" rows="2" />
        </b-form-group>
        <b-form-checkbox v-model="form.is_featured" class="mb-3">Show at the top of Discover</b-form-checkbox>
        <div v-for="(tc, idx) in form.ticket_classes" :key="idx" class="border rounded p-2 mb-2">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="small fw-semibold">{{ tc.name || `Ticket ${idx + 1}` }}</span>
            <b-button v-if="form.ticket_classes.length > 1" size="sm" variant="outline-danger" @click="form.ticket_classes.splice(idx, 1)">Remove</b-button>
          </div>
          <b-row class="g-2">
            <b-col md="4"><b-form-input v-model="tc.name" placeholder="VIP" /></b-col>
            <b-col md="4"><b-form-input v-model.number="tc.price" type="number" min="0" placeholder="Price" /></b-col>
            <b-col md="4"><b-form-input v-model.number="tc.capacity" type="number" min="1" placeholder="Seats" /></b-col>
            <b-col md="6"><b-form-input v-model.number="tc.gift_card_amount" type="number" min="0" placeholder="Gift card TZS (optional)" /></b-col>
            <b-col md="6"><b-form-input v-model.number="tc.attendance_bonus_points" type="number" min="0" placeholder="Check-in points" /></b-col>
          </b-row>
        </div>
        <b-button size="sm" variant="outline-primary" @click="addTicketClass">Add another ticket</b-button>
      </div>

      <div class="d-flex flex-wrap gap-2 mt-3">
        <b-button variant="primary" :disabled="saving" @click="createEvent">{{ saving ? 'Publishing…' : 'Publish event' }}</b-button>
        <b-button variant="outline-secondary" @click="showEventForm = false">Cancel</b-button>
      </div>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import GrowthGuide from '@/components/kkoo/GrowthGuide.vue'
import { discoverEventsAdminApi, type PlatformEventRow } from '@/api/events'
import { formatApiError } from '@/utils/formatApiError'
import { resolveAssetUrl } from '@/utils/assetUrl'

const loading = ref(false)
const saving = ref(false)
const checkingIn = ref(false)
const uploadingCoverId = ref<number | null>(null)
const error = ref('')
const success = ref('')
const events = ref<PlatformEventRow[]>([])
const checkInCode = ref('')
const coverFile = ref<File | null>(null)
const coverPreview = ref('')
const showEventForm = ref(false)
const showEventMore = ref(false)

const categoryOptions = [
  { value: 'music', text: 'Music' },
  { value: 'sports', text: 'Sports' },
  { value: 'food', text: 'Food' },
  { value: 'business', text: 'Business' },
  { value: 'arts', text: 'Arts' },
  { value: 'community', text: 'Community' },
]

const fields = [
  { key: 'cover', label: 'Cover' },
  { key: 'title', label: 'Title' },
  { key: 'city', label: 'City' },
  { key: 'venue_name', label: 'Venue' },
  { key: 'starts_at', label: 'Starts' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' },
]

type TicketDraft = {
  name: string
  price: number
  capacity: number
  gift_card_amount: number
  attendance_bonus_points: number
}

const form = reactive({
  title: '',
  summary: '',
  category: 'community',
  city: 'Dar es Salaam',
  venue_name: '',
  organizer_name: 'KKOO',
  starts_local: '',
  ends_local: '',
  is_featured: false,
  ticket_classes: [
    { name: 'General', price: 15000, capacity: 200, gift_card_amount: 0, attendance_bonus_points: 100 },
  ] as TicketDraft[],
})

function openCreate() {
  showEventMore.value = false
  showEventForm.value = true
}

function addTicketClass() {
  form.ticket_classes.push({
    name: '',
    price: 10000,
    capacity: 100,
    gift_card_amount: 0,
    attendance_bonus_points: 100,
  })
}

function coverUrl(item: PlatformEventRow) {
  return resolveAssetUrl(item.cover_image ?? '')
}

function onCoverChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  coverFile.value = file
  coverPreview.value = file ? URL.createObjectURL(file) : ''
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function toRfc3339(local: string) {
  if (!local) return ''
  const d = new Date(local)
  return d.toISOString()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await discoverEventsAdminApi.list()
    events.value = data?.results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load events')
  } finally {
    loading.value = false
  }
}

async function createEvent() {
  if (!form.title.trim() || !form.starts_local || !form.ends_local) {
    error.value = 'Title, start, and end are required'
    return
  }
  if (!coverFile.value) {
    error.value = 'Add a cover photo for this event'
    return
  }
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const fd = new FormData()
    fd.append('title', form.title.trim())
    fd.append('summary', form.summary.trim())
    fd.append('category', form.category)
    fd.append('city', form.city.trim() || 'Dar es Salaam')
    fd.append('venue_name', form.venue_name.trim())
    fd.append('organizer_name', form.organizer_name.trim())
    fd.append('starts_at', toRfc3339(form.starts_local))
    fd.append('ends_at', toRfc3339(form.ends_local))
    fd.append('is_featured', form.is_featured ? 'true' : 'false')
    fd.append('status', 'published')
    fd.append(
      'ticket_classes',
      JSON.stringify(
        form.ticket_classes
          .filter((t) => t.name.trim() && t.price > 0 && t.capacity > 0)
          .map((t) => ({
            name: t.name.trim(),
            price: t.price,
            capacity: t.capacity,
            currency: 'TZS',
            gift_card_amount: t.gift_card_amount || 0,
            attendance_bonus_points: t.attendance_bonus_points || 100,
            benefits: t.gift_card_amount > 0 ? ['Gift card included'] : [],
          })),
      ),
    )
    fd.append('cover_image', coverFile.value)
    await discoverEventsAdminApi.createWithCover(fd)
    success.value = 'Event published. Buyers can see it on Discover.'
    form.title = ''
    form.summary = ''
    form.venue_name = ''
    form.starts_local = ''
    form.ends_local = ''
    coverFile.value = null
    coverPreview.value = ''
    showEventForm.value = false
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to create event')
  } finally {
    saving.value = false
  }
}

async function onRowCoverChange(item: PlatformEventRow, ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploadingCoverId.value = item.id
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('cover_image', file)
    await discoverEventsAdminApi.updateWithCover(item.slug || String(item.id), fd)
    success.value = `Cover updated for “${item.title}”.`
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to update cover')
  } finally {
    uploadingCoverId.value = null
  }
}

async function publish(item: PlatformEventRow) {
  error.value = ''
  try {
    await discoverEventsAdminApi.update(item.slug || String(item.id), { status: 'published' })
    success.value = `Published “${item.title}”.`
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to publish')
  }
}

async function doCheckIn() {
  checkingIn.value = true
  error.value = ''
  success.value = ''
  try {
    const { data } = await discoverEventsAdminApi.checkIn(checkInCode.value.trim())
    success.value = data?.message
      ? `${data.message}${data.attendance_points_awarded ? ` (+${data.attendance_points_awarded} pts)` : ''}`
      : 'Checked in'
    checkInCode.value = ''
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Check-in failed')
  } finally {
    checkingIn.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.event-cover-preview {
  display: block;
  width: min(100%, 28rem);
  max-height: 10rem;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
}
.event-cover-thumb {
  width: 4.5rem;
  height: 2.5rem;
  object-fit: cover;
  border-radius: 0.35rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
}
</style>
