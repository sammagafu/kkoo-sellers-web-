<template>
  <VerticalLayout>
    <b-card title="Shop (marketplace)">
      <p class="text-muted mb-4">
        Marketplace catalog: products, categories, brands, and promotions that power the main <strong>Shop</strong> experience in the buyer app.
      </p>
      <b-row class="g-3">
        <b-col md="6" lg="4">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:box-broken" class="fs-2 text-primary" />
            <h6 class="mb-0">Products</h6>
            <p class="small text-muted mb-0">Browse and moderate catalog listings.</p>
            <router-link :to="{ name: 'admin.catalog.products' }" class="btn btn-sm btn-primary mt-auto">Open products</router-link>
          </b-card>
        </b-col>
        <b-col md="6" lg="4">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:users-group-two-rounded-broken" class="fs-2 text-primary" />
            <h6 class="mb-0">Sellers</h6>
            <p class="small text-muted mb-0">Review and verify marketplace sellers.</p>
            <router-link :to="{ name: 'admin.sellers' }" class="btn btn-sm btn-outline-primary mt-auto">Open sellers</router-link>
          </b-card>
        </b-col>
        <b-col md="6" lg="4">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:folder-broken" class="fs-2 text-primary" />
            <h6 class="mb-0">Categories</h6>
            <p class="small text-muted mb-0">Organize how buyers discover items.</p>
            <router-link :to="{ name: 'admin.catalog.categories' }" class="btn btn-sm btn-outline-primary mt-auto">Open categories</router-link>
          </b-card>
        </b-col>
        <b-col md="6" lg="4">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:tag-price-broken" class="fs-2 text-primary" />
            <h6 class="mb-0">Promotions</h6>
            <p class="small text-muted mb-0">Discounts and campaigns for storefront.</p>
            <router-link :to="{ name: 'admin.promotions' }" class="btn btn-sm btn-outline-primary mt-auto">Open promotions</router-link>
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
