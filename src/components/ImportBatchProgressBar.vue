<template>
  <div v-if="visible" class="import-batch-progress border rounded-3 p-3 bg-body-secondary bg-opacity-50 mb-3">
    <div class="small text-muted mb-2 text-truncate" :title="subtitle">{{ subtitle }}</div>
    <b-progress :max="100" class="mb-0" style="height: 10px">
      <b-progress-bar
        :value="barValue"
        variant="primary"
        :striped="pulseStriped"
        :animated="pulseStriped"
      />
    </b-progress>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  subtitle: string
  overallPercent: number
  /** When true, bar shows striped animation (e.g. upload size unknown). */
  pulseStriped?: boolean
}>()

const barValue = computed(() => Math.max(0, Math.min(100, Math.round(props.overallPercent))))
</script>
