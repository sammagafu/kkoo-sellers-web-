<template>
  <div class="empty-state text-center py-5 px-3">
    <div class="empty-state-icon mb-3">
      <Icon icon="solar:inbox-line-bold-duotone" class="text-muted" />
    </div>
    <h5 class="empty-state-title text-muted mb-2">{{ title }}</h5>
    <p class="empty-state-message text-muted mb-0">{{ message }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    title?: string
    message?: string
  }>(),
  {}
)

const { t } = useI18n()
const title = computed(() => props.title ?? t('emptyState.noData'))
const message = computed(() => props.message ?? t('emptyState.nothingToShow'))
</script>

<style scoped>
.empty-state-icon {
  font-size: 4rem;
  line-height: 1;
  opacity: 0.7;
}
.empty-state-icon :deep(svg) {
  width: 4rem;
  height: 4rem;
}
.empty-state-title {
  font-weight: 600;
}
</style>
