<template>
  <VerticalLayout>
    <b-card title="Dar events (Discover)" class="mb-4">
      <p class="text-muted mb-3">
        Publish concerts, festivals, and community events in Dar es Salaam. Buyers purchase tickets on Discover,
        earn KKOO Points on ticket payment and venue spend, get attendance bonus points at check-in, and may receive
        gift cards on VIP (or gift-card) ticket classes.
      </p>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-alert v-if="success" variant="success" dismissible show>{{ success }}</b-alert>

      <b-row class="g-3 mb-4">
        <b-col md="5">
          <b-form-group label="Check in ticket (attendance points)" class="mb-0">
            <div class="d-flex gap-2">
              <b-form-input v-model="checkInCode" placeholder="KKOO-XXXXXXXX" @keyup.enter="doCheckIn" />
              <b-button variant="primary" :disabled="checkingIn || !checkInCode.trim()" @click="doCheckIn">
                {{ checkingIn ? '…' : 'Check in' }}
              </b-button>
            </div>
          </b-form-group>
        </b-col>
        <b-col md="3" class="d-flex align-items-end">
          <b-button variant="outline-secondary" :disabled="loading" @click="load">Refresh list</b-button>
        </b-col>
      </b-row>
    </b-card>

    <b-card title="Add event" class="mb-4">
      <b-row class="g-3">
        <b-col md="6">
          <b-form-group label="Title"><b-form-input v-model="form.title" required /></b-form-group>
        </b-col>
        <b-col md="3">
          <b-form-group label="Category">
            <b-form-select v-model="form.category" :options="categoryOptions" />
          </b-form-group>
        </b-col>
        <b-col md="3">
          <b-form-group label="City"><b-form-input v-model="form.city" /></b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group label="Venue"><b-form-input v-model="form.venue_name" /></b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group label="Organizer"><b-form-input v-model="form.organizer_name" /></b-form-group>
        </b-col>
        <b-col cols="12">
          <b-form-group label="Summary"><b-form-textarea v-model="form.summary" rows="2" /></b-form-group>
        </b-col>
        <b-col md="4">
          <b-form-group label="Starts (local)">
            <b-form-input v-model="form.starts_local" type="datetime-local" />
          </b-form-group>
        </b-col>
        <b-col md="4">
          <b-form-group label="Ends (local)">
            <b-form-input v-model="form.ends_local" type="datetime-local" />
          </b-form-group>
        </b-col>
        <b-col md="4" class="d-flex align-items-end">
          <b-form-checkbox v-model="form.is_featured">Featured</b-form-checkbox>
        </b-col>
      </b-row>

      <h6 class="mt-3">Ticket classes</h6>
      <div v-for="(tc, idx) in form.ticket_classes" :key="idx" class="border rounded p-3 mb-2">
        <b-row class="g-2">
          <b-col md="3"><b-form-input v-model="tc.name" placeholder="Name (General / VIP)" /></b-col>
          <b-col md="2"><b-form-input v-model.number="tc.price" type="number" min="0" placeholder="Price" /></b-col>
          <b-col md="2"><b-form-input v-model.number="tc.capacity" type="number" min="1" placeholder="Capacity" /></b-col>
          <b-col md="2"><b-form-input v-model.number="tc.gift_card_amount" type="number" min="0" placeholder="Gift card TZS" /></b-col>
          <b-col md="2"><b-form-input v-model.number="tc.attendance_bonus_points" type="number" min="0" placeholder="Attend pts" /></b-col>
          <b-col md="1" class="d-flex align-items-center">
            <b-button size="sm" variant="outline-danger" @click="form.ticket_classes.splice(idx, 1)">×</b-button>
          </b-col>
        </b-row>
      </div>
      <b-button size="sm" variant="outline-primary" class="me-2" @click="addTicketClass">Add ticket class</b-button>
      <b-button variant="primary" :disabled="saving" @click="createEvent">{{ saving ? 'Saving…' : 'Publish event' }}</b-button>
    </b-card>

    <b-card title="Published & draft events">
      <p v-if="loading" class="text-muted">Loading…</p>
      <b-table v-else :items="events" :fields="fields" small responsive hover>
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
            @click="publish(data.item)"
          >
            Publish
          </b-button>
        </template>
      </b-table>
      <p v-if="!loading && !events.length" class="text-muted mb-0">No events yet — add one above.</p>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { discoverEventsAdminApi, type PlatformEventRow } from '@/api/events'
import { formatApiError } from '@/utils/formatApiError'

const loading = ref(false)
const saving = ref(false)
const checkingIn = ref(false)
const error = ref('')
const success = ref('')
const events = ref<PlatformEventRow[]>([])
const checkInCode = ref('')

const categoryOptions = [
  { value: 'music', text: 'Music' },
  { value: 'sports', text: 'Sports' },
  { value: 'food', text: 'Food' },
  { value: 'business', text: 'Business' },
  { value: 'arts', text: 'Arts' },
  { value: 'community', text: 'Community' },
]

const fields = [
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
  is_featured: true,
  ticket_classes: [
    { name: 'General Admission', price: 15000, capacity: 200, gift_card_amount: 0, attendance_bonus_points: 100 },
    { name: 'VIP', price: 45000, capacity: 50, gift_card_amount: 10000, attendance_bonus_points: 250 },
  ] as TicketDraft[],
})

function addTicketClass() {
  form.ticket_classes.push({
    name: '',
    price: 10000,
    capacity: 100,
    gift_card_amount: 0,
    attendance_bonus_points: 100,
  })
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
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await discoverEventsAdminApi.create({
      title: form.title.trim(),
      summary: form.summary.trim(),
      category: form.category,
      city: form.city.trim() || 'Dar es Salaam',
      venue_name: form.venue_name.trim(),
      organizer_name: form.organizer_name.trim(),
      starts_at: toRfc3339(form.starts_local),
      ends_at: toRfc3339(form.ends_local),
      is_featured: form.is_featured,
      status: 'published',
      ticket_classes: form.ticket_classes
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
    })
    success.value = 'Event published. Buyers can buy tickets on Discover and earn points.'
    form.title = ''
    form.summary = ''
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to create event')
  } finally {
    saving.value = false
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
