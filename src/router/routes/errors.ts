import { setTitle } from './meta'

export const errorRoutes = [
    {
        path: '/404',
        name: 'error.404',
        meta: {
            title: setTitle('Error 404')
        },
        component: () => import('@/views/pages/error-404.vue')
    },
    {
        path: '/:catchAll(.*)',
        redirect: '404'
    }
];
