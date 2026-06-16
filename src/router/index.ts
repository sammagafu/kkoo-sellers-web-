import { createRouter, createWebHistory } from 'vue-router';
import { allRoutes } from './routes/index';
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/acl'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: allRoutes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 72 };
    }
    return { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  const title = to.meta.title;
  if (title) {
    document.title = title.toString();
  }
  const description = to.meta.description;
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl && typeof description === 'string') {
    descEl.setAttribute('content', description);
  } else if (descEl && !description) {
    descEl.setAttribute(
      'content',
      'KKOO Admin — platform operations, catalog, orders, logistics, and payouts.',
    );
  }
  next();
});

/** Admin panel: public auth pages; protected admin/staff areas require the right role. */
router.beforeEach(async (routeTo, _routeFrom, next) => {
  const authRequired = routeTo.matched.some((route) => route.meta.authRequired);
  if (!authRequired) return next();

  const auth = useAuthStore();
  await auth.initialize();
  if (!auth.isAuthenticated) {
    return next({ name: 'auth.sign-in', query: { redirectedFrom: routeTo.fullPath } });
  }

  const path = routeTo.path;
  if (path === '/account' || path.startsWith('/account/')) {
    return next();
  }

  const needsAdminStaff =
    path === '/dashboard' || path.startsWith('/admin') || path.startsWith('/preview/');

  if (needsAdminStaff) {
    const canAccessAdmin =
      auth.isAdminOrStaff ||
      auth.hasRole(ROLES.ADMIN) ||
      auth.hasRole(ROLES.STAFF);
    if (!canAccessAdmin) {
      return next({ name: 'account.home', query: { restricted: 'admin' } });
    }
    const isSellerManagementRoute =
      path === '/admin/sellers' || path.startsWith('/admin/sellers/');
    if (isSellerManagementRoute && !auth.isSuperuser) {
      return next({ name: 'dashboards.index', query: { restricted: 'seller-management' } });
    }
    auth.setActiveAccountRole(auth.hasRole(ROLES.ADMIN) ? ROLES.ADMIN : ROLES.STAFF);
  }

  next();
});

export default router;
