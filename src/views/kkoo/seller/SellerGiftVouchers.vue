<template>
  <VerticalLayout>
    <GiftVouchersPanel
      :title="'Gift vouchers'"
      :subtitle="'Buy a voucher for a customer or team member, track what you issued and what you received, redeem at checkout with the code.'"
      :create-card-title="'Create gift voucher'"
      :create-help="'Creates a voucher billed to your account. You can email the recipient or share the code and link.'"
      :list-title="'Your vouchers'"
      :labels="panelLabels"
    />
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import GiftVouchersPanel from '@/components/kkoo/GiftVouchersPanel.vue'

const panelLabels = {
  createCta: 'Create voucher',
}
</script>
