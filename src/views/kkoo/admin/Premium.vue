<template>
  <VerticalLayout>
    <GrowthGuide
      title="Premium programs"
      what="Paid membership. Set what buyers get, and the rules that qualify a rider or a seller."
      :steps="[
        'Read the section you want to change.',
        'Turn a switch on or edit the numbers.',
        'Tap Save premium settings. Refresh reloads what is live now.',
      ]"
      actions="This page is edit-and-save. Buyers see the membership after you save."
    />
    <PremiumConfigPanel />
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import GrowthGuide from '@/components/kkoo/GrowthGuide.vue'
import PremiumConfigPanel from '@/components/PremiumConfigPanel.vue'
</script>
