<template>
  <VerticalLayout>
    <GrowthGuide
      title="Vouchers"
      what="A gift code you send someone, the way you would forward a code on WhatsApp. They type it at checkout."
      :steps="[
        'Create a voucher and set the amount.',
        'Copy the code or the share link.',
        'Send it. The list below shows vouchers from this account.',
      ]"
      actions="Create makes the code. Copy and share send it. Loyalty point rules live under Reward settings."
    />
    <b-card class="mb-3 border-0 shadow-sm bg-transparent">
      <p class="text-muted mb-0">
        Gift vouchers can be purchased and shared; recipients redeem with <code>gift_voucher_code</code> at checkout.
        Configure loyalty rules in
        <router-link :to="{ name: 'admin.reward-settings' }">Reward Settings</router-link>
        and handle point redemptions in
        <router-link :to="{ name: 'admin.redemptions' }">Redemptions</router-link>.
      </p>
    </b-card>
    <GiftVouchersPanel
      :title="'Gift vouchers'"
      :subtitle="'Create platform or personal vouchers, list issued and received, and copy codes or share links.'"
      :create-card-title="'Create gift voucher'"
      :create-help="'Creates a voucher billed to the signed-in account. Share the code or link with the recipient.'"
      :list-title="'All vouchers (this account)'"
      :labels="panelLabels"
    />
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import GrowthGuide from '@/components/kkoo/GrowthGuide.vue'
import GiftVouchersPanel from '@/components/kkoo/GiftVouchersPanel.vue'

const panelLabels = {
  createCta: 'Create voucher',
}
</script>
