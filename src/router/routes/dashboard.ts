import { setTitle } from './meta'

export const dashboardRoutes = [
    {
        path: '/dashboard',
        name: 'dashboards.index',
        meta: {
            title: setTitle('Dashboard'),
            authRequired: true
        },
        component: () => import('@/views/dashboards/index.vue'),
    }
];
