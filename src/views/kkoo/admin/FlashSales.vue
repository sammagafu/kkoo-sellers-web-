<template>
  <VerticalLayout>
    <GrowthGuide
      title="Flash sales"
      what="A short deal that ends by itself. Use this when the price should only last a few hours, like a Bolt fare that drops for a little while."
      :steps="[
        'Fill in the name, start, and end on Create flash sale.',
        'Add the products that are on sale.',
        'Save. Live, upcoming, and ended sales stay in the lists below — edit or turn one off anytime.',
      ]"
      actions="Create is the form on this page. Edit and turn off are on each sale in the list."
    />
    <FlashSalesList />
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import GrowthGuide from '@/components/kkoo/GrowthGuide.vue'
import FlashSalesList from '@/components/FlashSalesList.vue'
</script>
