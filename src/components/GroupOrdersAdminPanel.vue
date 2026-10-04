<template>
  <div class="group-orders-panel card shadow-sm">
    <div class="card-body">
      <h2 class="h5 mb-2">Group orders</h2>
      <p class="text-muted">
        Shared carts use the <strong>buyer</strong> API only. There is no admin list endpoint on Fiber.
        Look up one cart with its share code. Any signed-in JWT can call
        <code>GET /group-orders/:code/</code>.
      </p>

      <form class="row g-2 align-items-end mb-3" @submit.prevent="lookup">
        <div class="col-sm-8">
          <label class="form-label small mb-1" for="group-share-code">Share code</label>
          <input
            id="group-share-code"
            v-model="code"
            class="form-control"
            placeholder="KKOOAB3X7Q"
            autocomplete="off"
            spellcheck="false"
          />
        </div>
        <div class="col-sm-4">
          <button class="btn btn-primary w-100" type="submit" :disabled="loading || !code.trim()">
            {{ loading ? 'Looking up…' : 'Look up' }}
          </button>
        </div>
      </form>

      <div v-if="error" class="alert alert-danger py-2 small" role="alert">{{ error }}</div>

      <div v-if="detail" class="border rounded p-3 mb-3">
        <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
          <div>
            <div class="fw-semibold">{{ detail.share_code }}</div>
            <div class="small text-muted">
              Seller user {{ detail.seller_user_id }} · creator {{ detail.creator_user_id }}
            </div>
          </div>
          <span class="badge text-bg-secondary align-self-start">{{ detail.status }}</span>
        </div>
        <dl class="row small mb-2">
          <dt class="col-4">Cutoff</dt>
          <dd class="col-8">{{ formatWhen(detail.cutoff_at) }}</dd>
          <dt class="col-4">Time left</dt>
          <dd class="col-8">{{ formatRemaining(detail.seconds_remaining) }}</dd>
          <dt v-if="detail.notes" class="col-4">Notes</dt>
          <dd v-if="detail.notes" class="col-8">{{ detail.notes }}</dd>
          <dt v-if="detail.order_id" class="col-4">Order</dt>
          <dd v-if="detail.order_id" class="col-8">#{{ detail.order_id }}</dd>
        </dl>

        <h3 class="h6 mt-3">Members</h3>
        <p v-if="!detail.members?.length" class="small text-muted mb-2">No members returned.</p>
        <ul v-else class="small mb-3">
          <li v-for="m in detail.members" :key="m.id">
            {{ m.guest_name || (m.user_id ? `User ${m.user_id}` : 'Member') }}
            <span v-if="m.is_creator" class="text-muted">· creator</span>
          </li>
        </ul>

        <h3 class="h6">Items</h3>
        <p v-if="!detail.items?.length" class="small text-muted mb-0">No items yet.</p>
        <div v-else class="table-responsive">
          <table class="table table-sm mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detail.items" :key="item.id">
                <td>#{{ item.product_id }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.unit_price }}</td>
                <td>{{ item.member_user_id ? `User ${item.member_user_id}` : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ul class="small mb-3">
        <li><code>POST /group-orders/</code> — create (seller_user_id, cutoff_at)</li>
        <li><code>POST /group-orders/join/</code> — join with share_code</li>
        <li><code>GET /group-orders/:code/</code> — detail + members + items</li>
        <li><code>GET /group-orders/mine/</code> — caller’s groups</li>
        <li><code>POST /group-orders/:code/lock/</code> — creator closes window</li>
      </ul>

      <p class="text-muted small mb-3">
        Create, join, and lock live in <strong>kkoo-buyers-app</strong> (<code>GroupOrdersService</code>).
        Lock only succeeds for the creator’s JWT.
      </p>

      <p class="small mb-0">
        Reference: <code>kkooapp-backend-fiber/docs/API.md</code> §30 ·
        <code>kkoo-buyers-app/docs/API_ALIGNMENT.md</code>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getGroupOrder } from '@/api'
import type { GroupOrderDetail } from '@/types/groupOrders'

const code = ref('')
const loading = ref(false)
const error = ref('')
const detail = ref<GroupOrderDetail | null>(null)

function formatWhen(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function formatRemaining(seconds?: number) {
  if (seconds == null) return '—'
  if (seconds <= 0) return 'Closed'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  return `${hours}h ${mins % 60}m`
}

function errorMessage(err: unknown) {
  const data = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data
  return data?.error || data?.message || 'Could not load that share code.'
}

async function lookup() {
  const share = code.value.trim().toUpperCase()
  if (!share) return
  loading.value = true
  error.value = ''
  detail.value = null
  try {
    detail.value = await getGroupOrder(share)
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.group-orders-panel {
  max-width: 720px;
}
</style>
