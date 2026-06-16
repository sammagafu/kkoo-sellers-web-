<template>
  <VerticalLayout>
    <b-card title="Order invoices">
      <p class="text-muted mb-3">
        Order invoices are managed per order. Create, customize, and send an invoice from the <strong>Order Detail</strong> page (open any order and use the Invoice section).
      </p>
      <p class="mb-0">
        <b-button variant="primary" :to="{ name: 'admin.orders' }">Go to Orders</b-button>
      </p>
      <hr />
      <h6 class="mb-2">Invoice features (per order)</h6>
      <ul class="text-muted small">
        <li>Create or update invoice with optional branding (logo, company name, colors, footer).</li>
        <li>Send via share link or email; track when the invoice was sent and opened.</li>
        <li>Use the share URL for the customer; optionally include the tracking pixel in emails.</li>
      </ul>
      <h6 class="mb-2 mt-3">Invoice view microsite</h6>
      <p class="text-muted small mb-0">
        Customers can open invoices at <strong>{{ appInvoiceViewUrl }}</strong> (no login). The app embeds the API invoice page and open tracking is recorded. You can share either the API link (from Order Detail) or this app link with the same token.
      </p>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'

const appInvoiceViewUrl = computed(() => {
  const base = typeof window !== 'undefined' ? window.location.origin + (import.meta.env.BASE_URL || '/').replace(/\/$/, '') : ''
  return base ? `${base}/invoice/view/:token` : '/invoice/view/:token'
})
</script>
