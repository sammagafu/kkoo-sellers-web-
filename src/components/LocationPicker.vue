<template>
  <div class="loc-shell">
    <header class="loc-head">
      <div>
        <p class="loc-kicker">Location service</p>
        <h3 class="loc-title">Search, pin, and save a place for your orders.</h3>
        <p class="loc-copy">Powered by Google Places. Search an address or landmark, pin it on the map, and save it for rides or deliveries.</p>
      </div>
      <span v-if="!mapsApiKey" class="loc-warning">Add VITE_GOOGLE_MAPS_API_KEY to enable maps.</span>
    </header>

    <div class="loc-search">
      <Icon icon="solar:magnifer-linear" class="loc-search-icon" />
      <input
        v-model.trim="query"
        type="search"
        class="form-control loc-input"
        :placeholder="mapsApiKey ? 'Search a place or address' : 'Add Google Maps key to search'"
        :disabled="!mapsApiKey"
        @keyup.enter="fetchPredictions"
      />
      <b-button size="sm" variant="primary" class="loc-btn" :disabled="!mapsApiKey || !query" @click="fetchPredictions">
        Search
      </b-button>
    </div>

    <div v-if="predictions.length" class="loc-results">
      <button
        v-for="pred in predictions"
        :key="pred.place_id"
        class="loc-result"
        type="button"
        @click="selectPrediction(pred)"
      >
        <span>{{ pred.description }}</span>
        <Icon icon="solar:arrow-right-up-linear" />
      </button>
    </div>

    <div class="loc-grid">
      <div class="loc-map-card">
        <GoogleMap
          v-if="mapsApiKey"
          :api-key="mapsApiKey"
          style="width: 100%; height: 320px; border-radius: 18px"
          :center="center"
          :zoom="14"
          :libraries="['places']"
        >
          <Marker :options="{ position: center }" />
        </GoogleMap>
        <div v-else class="loc-map-placeholder">
          <p class="mb-1 fw-semibold">Map preview</p>
          <p class="small text-muted mb-0">Provide Google Maps API key to enable map search.</p>
        </div>
        <div class="loc-note mt-2">
          <p class="mb-1 fw-semibold">Selected</p>
          <p class="small mb-0 text-muted">{{ selectedLabel || 'Pick a place to pin it here.' }}</p>
        </div>
      </div>

      <div class="loc-form-card">
        <label class="form-label">Place name (what users call it)</label>
        <input v-model.trim="saveForm.name" type="text" class="form-control" placeholder="e.g. Bolt HQ, Coco Beach Gate B" />
        <label class="form-label mt-3">Notes / contribution</label>
        <textarea v-model.trim="saveForm.note" class="form-control" rows="2" placeholder="Entrance, floor, nearby shop, etc." />
        <div class="d-flex gap-2 mt-3">
          <b-button variant="primary" class="app-btn" :disabled="!canSave" @click="savePlace">
            Save location
          </b-button>
          <b-button variant="outline-secondary" class="app-btn ghost" @click="resetForm">Reset</b-button>
        </div>
        <p v-if="saveMessage" class="text-success small mt-2 mb-0">{{ saveMessage }}</p>
        <p v-if="saveError" class="text-danger small mt-2 mb-0">{{ saveError }}</p>
      </div>
    </div>

    <div class="loc-saved" v-if="savedPlaces.length">
      <h4 class="loc-subtitle">Saved spots</h4>
      <div class="loc-saved-grid">
        <article v-for="place in savedPlaces" :key="place.id" class="loc-saved-card">
          <div class="loc-saved-head">
            <span class="loc-pill">Pinned</span>
            <small class="text-muted">{{ place.lat.toFixed(4) }}, {{ place.lng.toFixed(4) }}</small>
          </div>
          <h5 class="mb-1">{{ place.name }}</h5>
          <p class="small text-muted mb-0">{{ place.note || 'No notes added.' }}</p>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { GoogleMap, Marker } from 'vue3-google-map'
import { Icon } from '@iconify/vue'

type Prediction = any

const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const center = ref<{ lat: number; lng: number }>({ lat: -6.7924, lng: 39.2083 }) // Dar es Salaam default
const selectedLabel = ref('')
const query = ref('')
const predictions = ref<Prediction[]>([])
const saveForm = ref({ name: '', note: '' })
const saveMessage = ref('')
const saveError = ref('')
const savedPlaces = ref<{ id: string; name: string; note: string; lat: number; lng: number }[]>([])

const canSave = computed(() => Boolean(saveForm.value.name && selectedLabel.value))

function clearMessages() {
  saveMessage.value = ''
  saveError.value = ''
}

function fetchPredictions() {
  clearMessages()
  predictions.value = []
  if (!mapsApiKey || !window.google?.maps || !query.value) return
  const mapsAny = window.google.maps as any
  const service = new mapsAny.places.AutocompleteService()
  service.getPlacePredictions({ input: query.value, componentRestrictions: { country: ['tz', 'ke', 'ug'] } }, (result: any, status: any) => {
    if (status === mapsAny.places.PlacesServiceStatus.OK && result) {
      predictions.value = result
    } else {
      predictions.value = []
    }
  })
}

function selectPrediction(pred: Prediction) {
  clearMessages()
  predictions.value = []
  selectedLabel.value = pred.description
  if (!window.google?.maps) return
  const mapsAny = window.google.maps as any
  const geocoder = new mapsAny.Geocoder()
  geocoder.geocode({ placeId: pred.place_id }, (res: any, status: any) => {
    if (status === 'OK' && res && res[0]?.geometry?.location) {
      const loc = res[0].geometry.location
      center.value = { lat: loc.lat(), lng: loc.lng() }
    }
  })
}

function savePlace() {
  clearMessages()
  if (!canSave.value) {
    saveError.value = 'Add a place name first.'
    return
  }
  savedPlaces.value.unshift({
    id: crypto.randomUUID(),
    name: saveForm.value.name,
    note: saveForm.value.note,
    lat: center.value.lat,
    lng: center.value.lng,
  })
  saveMessage.value = 'Saved locally. We will sync this when backend endpoints are ready.'
  saveForm.value = { name: '', note: '' }
}

function resetForm() {
  saveForm.value = { name: '', note: '' }
  clearMessages()
}
</script>

<style scoped>
.loc-shell {
  border: 1px solid rgba(92, 48, 143, 0.12);
  border-radius: 1.4rem;
  padding: 1.25rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 242, 255, 0.94));
  box-shadow: 0 16px 36px rgba(35, 20, 46, 0.08);
}
.loc-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.loc-kicker {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 800;
  font-size: 0.78rem;
  color: #5c308f;
  margin-bottom: 0.3rem;
}
.loc-title {
  margin: 0 0 0.4rem;
}
.loc-copy {
  margin: 0;
  color: var(--bs-secondary-color);
}
.loc-warning {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(247, 168, 41, 0.16);
  color: #8e5c00;
  font-weight: 700;
  font-size: 0.86rem;
}
.loc-search {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.6rem;
  align-items: center;
  padding: 0.65rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(92, 48, 143, 0.16);
  background: white;
  box-shadow: 0 10px 26px rgba(35, 20, 46, 0.1);
}
.loc-search-icon {
  color: #5c308f;
}
.loc-input {
  border: none;
  box-shadow: none;
}
.loc-input:focus {
  outline: none;
  box-shadow: none;
}
.loc-btn {
  border-radius: 999px;
}
.loc-results {
  margin-top: 0.65rem;
  display: grid;
  gap: 0.35rem;
}
.loc-result {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.85rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(92, 48, 143, 0.12);
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
}
.loc-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}
@media (min-width: 992px) {
  .loc-grid {
    grid-template-columns: 1.1fr 0.9fr;
  }
}
.loc-map-card,
.loc-form-card {
  border: 1px solid rgba(92, 48, 143, 0.12);
  border-radius: 1.1rem;
  padding: 1rem;
  background: white;
  box-shadow: 0 12px 28px rgba(35, 20, 46, 0.08);
}
.loc-map-placeholder {
  height: 320px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f8f0ff, #f2f6ff);
  display: grid;
  place-items: center;
  text-align: center;
  padding: 1rem;
  color: #5c308f;
}
.loc-note {
  border-top: 1px solid rgba(92, 48, 143, 0.12);
  padding-top: 0.65rem;
  margin-top: 0.65rem;
}
.loc-saved {
  margin-top: 1.25rem;
}
.loc-subtitle {
  margin-bottom: 0.6rem;
}
.loc-saved-grid {
  display: grid;
  gap: 0.75rem;
}
@media (min-width: 768px) {
  .loc-saved-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.loc-saved-card {
  border: 1px solid rgba(92, 48, 143, 0.12);
  border-radius: 1rem;
  padding: 0.85rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 22px rgba(35, 20, 46, 0.07);
}
.loc-saved-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}
.loc-pill {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(92, 48, 143, 0.08);
  color: #5c308f;
  font-weight: 700;
  font-size: 0.75rem;
}
.app-btn {
  border-radius: 999px;
}
.app-btn.ghost {
  border-color: rgba(92, 48, 143, 0.18);
}
</style>
