<template>
  <VerticalLayout>
    <div class="growth-hub">
      <div class="mb-4">
        <p class="small text-uppercase text-muted fw-semibold mb-1">Growth</p>
        <h1 class="h3 mb-2">Get people to order again</h1>
        <p class="text-muted mb-0" style="max-width: 42rem">
          This section is the promo side of Kkoo. Think of it like a WhatsApp blast or a Bolt fare cut:
          you write a simple offer, turn it on, and buyers see it in the app. You can always edit or turn it off later.
        </p>
      </div>

      <div v-if="showTour" class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
            <div class="me-auto">
              <h2 class="h5 mb-1">First time here? Do these three things</h2>
              <p class="text-muted small mb-0">About two minutes. You can come back to any step.</p>
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="dismissTour">
              I know this
            </button>
          </div>
          <ol class="mb-0 ps-3">
            <li class="mb-2">
              <strong>Make a price cut.</strong>
              Open
              <router-link :to="{ name: 'admin.promotions' }">Discount promos</router-link>
              and tap <em>Create discount</em>. Name it, set the percent, set start and end.
            </li>
            <li class="mb-2">
              <strong>Or run a short deal.</strong>
              Open
              <router-link :to="{ name: 'admin.flash-sales' }">Flash sales</router-link>
              when the offer should disappear after a few hours — like a surge window, but cheaper.
            </li>
            <li>
              <strong>Tell people.</strong>
              Open
              <router-link :to="{ name: 'admin.platform-campaigns' }">Push campaigns</router-link>,
              write one short message (the way you would on WhatsApp), send a test, then send it.
            </li>
          </ol>
        </div>
      </div>
        <button
        v-else
        type="button"
        class="btn btn-link btn-sm px-0 mb-3"
        @click="reopenTour"
      >
        Show the 3-step how-to again
      </button>

      <h2 class="h6 text-muted mb-2">Offers buyers see</h2>
      <div class="row g-3 mb-4">
        <div v-for="card in offers" :key="card.to" class="col-md-6 col-xl-4">
          <router-link :to="{ name: card.to }" class="growth-hub__card card h-100 text-decoration-none text-body">
            <div class="card-body">
              <div class="fw-semibold mb-1">{{ card.title }}</div>
              <p class="small text-muted mb-2">{{ card.what }}</p>
              <div class="small">{{ card.crud }}</div>
            </div>
          </router-link>
        </div>
      </div>

      <h2 class="h6 text-muted mb-2">Points, codes, and membership</h2>
      <div class="row g-3">
        <div v-for="card in loyalty" :key="card.to" class="col-md-6 col-xl-4">
          <router-link :to="{ name: card.to }" class="growth-hub__card card h-100 text-decoration-none text-body">
            <div class="card-body">
              <div class="fw-semibold mb-1">{{ card.title }}</div>
              <p class="small text-muted mb-2">{{ card.what }}</p>
              <div class="small">{{ card.crud }}</div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'

const TOUR_KEY = 'kkoo-admin-growth-tour-dismissed'
const showTour = ref(localStorage.getItem(TOUR_KEY) !== '1')

function dismissTour() {
  showTour.value = false
  localStorage.setItem(TOUR_KEY, '1')
}

function reopenTour() {
  showTour.value = true
  localStorage.removeItem(TOUR_KEY)
}

const offers = [
  {
    to: 'admin.promotions',
    title: 'Discount promos',
    what: 'A percent off at checkout. Buyers see it when they pay.',
    crud: 'Create · Edit · Delete from the list',
  },
  {
    to: 'admin.flash-sales',
    title: 'Flash sales',
    what: 'A deal that only lasts a few hours, then it ends by itself.',
    crud: 'Create on this page · Edit or turn off from the list',
  },
  {
    to: 'admin.platform-campaigns',
    title: 'Push campaigns',
    what: 'The message people get in the app — write it like a WhatsApp text.',
    crud: 'Create · Edit · Send · Delete',
  },
  {
    to: 'admin.ride-promotions',
    title: 'Delivery fee discounts',
    what: 'Cuts the delivery or ride fee, the way Bolt drops a fare.',
    crud: 'Create · Edit',
  },
  {
    to: 'admin.promotions.bundles',
    title: 'Bundle deals',
    what: 'A set of products sold together at one price.',
    crud: 'Also managed under Discount promos → Bundles',
  },
  {
    to: 'admin.discover-events',
    title: 'Dar events',
    what: 'Concerts and community events. Buyers buy tickets on Discover.',
    crud: 'Create · Edit · Check in a ticket code',
  },
  {
    to: 'admin.careers',
    title: 'Temp jobs',
    what: 'Short jobs (cleaning, helpers). People apply from the Careers page.',
    crud: 'Post · Edit · Close',
  },
  {
    to: 'admin.seller-help-tour',
    title: 'Seller help tour',
    what: 'The short videos new shop owners see the first time they open the seller app.',
    crud: 'Paste a video link · Save',
  },
]

const loyalty = [
  {
    to: 'admin.vouchers',
    title: 'Vouchers',
    what: 'A code you send someone. They type it at checkout, like a WhatsApp gift.',
    crud: 'Create · Copy code · Share',
  },
  {
    to: 'admin.reward-settings',
    title: 'Reward settings',
    what: 'How many points people earn for inviting a friend or placing an order.',
    crud: 'Change the numbers · Save',
  },
  {
    to: 'admin.redemptions',
    title: 'Loyalty redemptions',
    what: 'Someone wants to spend their points. You approve, reject, or mark it done.',
    crud: 'Approve · Reject · Complete',
  },
  {
    to: 'admin.weekly-pass',
    title: 'Weekly pass',
    what: 'A week of small tasks so people open the app again.',
    crud: 'Create · Edit · Add tasks · Turn off',
  },
  {
    to: 'admin.premium',
    title: 'Premium programs',
    what: 'Paid membership for buyers, and the rules for rider or seller premium.',
    crud: 'Edit the settings · Save',
  },
]
</script>

<style scoped>
.growth-hub__card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.growth-hub__card:hover {
  border-color: var(--bs-primary);
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.06);
}
</style>
