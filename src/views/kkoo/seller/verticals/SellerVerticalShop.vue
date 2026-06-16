<template>
  <VerticalLayout>
    <b-card title="Shop (your storefront)">
      <p class="text-muted mb-4">
        Your <strong>shop</strong> is built from catalog products, optional wholesale tiers, and your public store link. Customers discover you in the marketplace and on your microsite.
      </p>
      <b-row class="g-3">
        <b-col md="6" lg="4">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:box-broken" class="fs-2 text-primary" />
            <h6 class="mb-0">My products</h6>
            <p class="small text-muted mb-0">List SKUs, prices, and stock.</p>
            <router-link :to="{ name: 'seller.products' }" class="btn btn-sm btn-primary mt-auto">Manage products</router-link>
          </b-card>
        </b-col>
        <b-col md="6" lg="4">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:cart-large-2-broken" class="fs-2 text-primary" />
            <h6 class="mb-0">Wholesale</h6>
            <p class="small text-muted mb-0">Bulk pricing for B2B buyers.</p>
            <router-link :to="{ name: 'seller.wholesale' }" class="btn btn-sm btn-outline-primary mt-auto">Wholesale tiers</router-link>
          </b-card>
        </b-col>
        <b-col md="6" lg="4">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:shop-2-broken" class="fs-2 text-primary" />
            <h6 class="mb-0">Store & preview</h6>
            <p class="small text-muted mb-0">Public store URL and preview open from your profile.</p>
            <router-link :to="{ name: 'seller.profile' }" class="btn btn-sm btn-outline-primary mt-auto">Open profile</router-link>
          </b-card>
        </b-col>
      </b-row>
      <p class="small text-muted mt-3 mb-0">
        Tip: set branding and links in <router-link :to="{ name: 'seller.profile' }">Profile</router-link>.
      </p>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { Icon } from '@iconify/vue'
</script>
