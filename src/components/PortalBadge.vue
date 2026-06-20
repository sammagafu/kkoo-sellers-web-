<template>
  <span
    class="kkoo-portal-badge"
    :class="[`kkoo-portal-badge--${portal}`, { 'kkoo-portal-badge--floating': floating }]"
    role="status"
    :aria-label="`${labels[portal]} portal`"
  >
    {{ labels[portal] }}
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    portal: 'admin' | 'buyer' | 'seller'
    floating?: boolean
  }>(),
  { floating: false },
)

const labels = {
  admin: 'Admin',
  buyer: 'Buyer',
  seller: 'Seller',
} as const
</script>
