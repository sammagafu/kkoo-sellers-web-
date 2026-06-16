<template>
  <VerticalLayout>
    <b-card title="Hotel">
      <p class="text-muted mb-4">
        <strong>Hotel</strong> sellers expose rooms and services through a shareable menu (same menu system as food). Set your <em>menu_slug</em> and business details in profile so guests can open your public menu link.
      </p>
      <b-row class="g-3">
        <b-col md="6">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:restaurant-broken" class="fs-2 text-warning" />
            <h6 class="mb-0">Menu & items</h6>
            <p class="small text-muted mb-0">Rooms and services appear as menu categories/items.</p>
            <router-link :to="{ name: 'seller.menu' }" class="btn btn-sm btn-primary mt-auto">Restaurant / hotel menu</router-link>
          </b-card>
        </b-col>
        <b-col md="6">
          <b-card body-class="d-flex flex-column gap-2" class="h-100 border shadow-sm">
            <Icon icon="solar:user-id-broken" class="fs-2 text-warning" />
            <h6 class="mb-0">Business profile</h6>
            <p class="small text-muted mb-0">Phone, hours, and menu slug for sharing.</p>
            <router-link :to="{ name: 'seller.profile' }" class="btn btn-sm btn-outline-primary mt-auto">Edit profile</router-link>
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
