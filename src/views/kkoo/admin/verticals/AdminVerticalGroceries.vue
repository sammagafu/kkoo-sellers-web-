<template>
  <VerticalLayout>
    <b-card title="Groceries">
      <p class="text-muted mb-4">
        Grocery sellers use the same catalog and orders stack with category tags and delivery zones. Use <strong>Seller Management</strong> to review grocery businesses and
        <strong>Orders</strong> for fulfilment.
      </p>
      <b-row class="g-3">
        <b-col md="6">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:cart-large-2-broken" class="fs-2 text-success" />
            <h6 class="mb-0">Orders</h6>
            <p class="small text-muted mb-0">Filter and manage grocery orders.</p>
            <router-link :to="{ name: 'admin.orders' }" class="btn btn-sm btn-primary mt-auto">Open orders</router-link>
          </b-card>
        </b-col>
        <b-col md="6">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:user-id-broken" class="fs-2 text-success" />
            <h6 class="mb-0">Sellers</h6>
            <p class="small text-muted mb-0">Find and verify grocery sellers.</p>
            <router-link :to="{ name: 'admin.sellers' }" class="btn btn-sm btn-outline-primary mt-auto">Seller management</router-link>
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
