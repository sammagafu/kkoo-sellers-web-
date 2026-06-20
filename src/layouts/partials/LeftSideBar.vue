<template>
  <div class="main-nav">
    <LogoBox />

    <!-- Menu Toggle Button (sm-hover) -->
    <button type="button" class="button-sm-hover" aria-label="Show Full Sidebar" @click="toggleMenuSize">
      <Icon icon="solar:hamburger-menu-broken" class="button-sm-hover-icon mt-1 me-1"
        style="height: 25px; width: 25px" />
    </button>

    <simplebar class="scrollbar">
      <AppMenu :menu-items="menuItems" />
    </simplebar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Icon } from "@iconify/vue";
import simplebar from 'simplebar-vue';
import AppMenu from '@/components/AppMenu/index.vue';
import { getKkooMenuItems } from '@/assets/data/kkoo-menu';
import { useLayoutStore } from '@/stores/layout';
import { useAuthStore } from '@/stores/auth';
import { useCrmSession } from '@/composables/useCrmSession';
import { ROLES } from '@/acl';

const useLayout = useLayoutStore();
const auth = useAuthStore();
const { crmPermissions, loadCrmSession } = useCrmSession();

const menuItems = computed(() =>
  getKkooMenuItems(
    auth.role,
    auth.isSeller ? auth.isSellerVerified : true,
    auth.user,
    auth.activePanelRole,
    auth.activePanelRole === ROLES.CRM_MEMBER ? crmPermissions.value : null,
    auth.activeAccountRole,
  )
);

const { layout, setLeftSideBarSize } = useLayout;

const toggleMenuSize = () => {
  if (layout.leftSideBarSize === 'sm-hover-active') return setLeftSideBarSize('sm-hover');
  return setLeftSideBarSize('sm-hover-active');
};

const resize = () => {
  if (window.innerWidth < 1140) {
    setLeftSideBarSize('hidden');
  } else {
    setLeftSideBarSize(layout.leftSideBarSize === 'hidden' ? 'sm-hover-active' : layout.leftSideBarSize);
  }
};

onMounted(() => {
  if (auth.activePanelRole === ROLES.CRM_MEMBER || auth.isSeller) {
    void loadCrmSession();
  }
  resize();
  window.addEventListener('resize', () => {
    resize();
  });
});
</script>