<template>
  <div v-if="visible" class="import-batch-panel border rounded-3 p-3 bg-body-secondary bg-opacity-50 mb-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
      <div class="small text-muted text-truncate flex-grow-1" :title="subtitle">{{ subtitle }}</div>
      <b-badge v-if="overallPercent >= 0" variant="primary" class="fw-normal">{{ barValue }}%</b-badge>
    </div>
    <b-progress :max="100" class="mb-2" style="height: 12px">
      <b-progress-bar
        :value="barValue"
        variant="primary"
        :striped="pulseStriped"
        :animated="pulseStriped"
      />
    </b-progress>
    <ul v-if="lines.length" class="list-unstyled small mb-0 import-batch-lines">
      <li
        v-for="(line, idx) in lines"
        :key="idx"
        class="py-1 border-bottom border-light-subtle"
        :class="line.ok === false ? 'text-danger' : line.ok === true ? 'text-success' : ''"
      >
        <span class="font-monospace text-muted me-1">{{ line.label }}</span>
        {{ line.text }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type ImportBatchLine = {
  label: string
  text: string
  ok?: boolean
}

const props = defineProps<{
  visible: boolean
  subtitle: string
  overallPercent: number
  pulseStriped?: boolean
  lines?: ImportBatchLine[]
}>()

const barValue = computed(() => Math.max(0, Math.min(100, Math.round(props.overallPercent))))
const lines = computed(() => props.lines ?? [])
</script>

<style scoped>
.import-batch-lines {
  max-height: 220px;
  overflow-y: auto;
}
</style>
