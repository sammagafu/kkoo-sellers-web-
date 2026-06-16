import { setTitle } from './meta'

export const previewRoutes = [
    {
        path: '/preview/store/:slugOrId',
        name: 'preview.store',
        meta: { title: setTitle('Preview store'), authRequired: true },
        component: () => import('@/views/store/StorePreview.vue'),
    },
]
