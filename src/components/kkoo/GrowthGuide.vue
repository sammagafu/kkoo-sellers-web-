<template>
  <div class="growth-guide card border-0 shadow-sm mb-3">
    <div class="card-body py-3">
      <div class="d-flex flex-wrap align-items-start gap-2">
        <div class="me-auto">
          <div class="small text-uppercase text-muted fw-semibold">Growth</div>
          <h2 class="h5 mb-1">{{ title }}</h2>
          <p v-if="!open" class="text-muted small mb-0">{{ what }}</p>
        </div>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="open = !open">
          {{ open ? 'Hide how-to' : 'How to use' }}
        </button>
        <router-link class="btn btn-sm btn-link" :to="{ name: 'admin.growth' }">All growth tools</router-link>
      </div>

      <div v-if="open" class="mt-3">
        <p class="mb-2">{{ what }}</p>
        <ol class="small mb-2 ps-3">
          <li v-for="(step, i) in steps" :key="i" class="mb-1">{{ step }}</li>
        </ol>
        <p v-if="actions" class="small text-muted mb-0">{{ actions }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
  what: string
  steps: string[]
  actions?: string
}>()

const open = ref(true)
</script>
