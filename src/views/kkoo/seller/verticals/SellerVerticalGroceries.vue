<template>
  <VerticalLayout>
    <b-card title="Groceries">
      <p class="text-muted mb-4">
        If you sell <strong>groceries</strong>, use the same product and order flows—tag categories for fresh produce, staples, and household items. Delivery follows your zone and logistics settings.
      </p>
      <b-row class="g-3">
        <b-col md="6">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:box-broken" class="fs-2 text-success" />
            <h6 class="mb-0">Products</h6>
            <p class="small text-muted mb-0">List grocery SKUs with clear units and stock.</p>
            <router-link :to="{ name: 'seller.products' }" class="btn btn-sm btn-primary mt-auto">My products</router-link>
          </b-card>
        </b-col>
        <b-col md="6">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:cart-large-2-broken" class="fs-2 text-success" />
            <h6 class="mb-0">Orders</h6>
            <p class="small text-muted mb-0">Pick and pack grocery orders from your queue.</p>
            <router-link :to="{ name: 'seller.orders' }" class="btn btn-sm btn-outline-primary mt-auto">My orders</router-link>
          </b-card>
        </b-col>
      </b-row>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { Icon } from '@iconify/vue'
</script>
