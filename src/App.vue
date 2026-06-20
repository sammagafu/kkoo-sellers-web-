<template>
  <div class="kkoo-app-shell" data-kkoo-portal="admin">
    <div class="kkoo-portal-strip" aria-hidden="true" />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useLayoutStore } from '@/stores/layout';
import { onMounted } from 'vue';

onMounted(() => {
  useLayoutStore().init();
  document.documentElement.setAttribute('data-kkoo-portal', 'admin');
});
</script>
