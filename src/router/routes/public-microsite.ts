import { setTitle } from './meta'

export const publicMicrositeRoutes = [
    {
        path: '/invoice/view/:token',
        name: 'invoice.view',
        meta: { title: setTitle('Invoice') },
        component: () => import('@/views/invoice/InvoiceView.vue'),
    },
    {
        path: '/store/:slugOrId',
        name: 'store.microsite',
        meta: { title: setTitle('Store') },
        component: () => import('@/views/store/BusinessMicrosite.vue'),
    },
    {
        path: '/menu/display/:slugOrId',
        name: 'menu.display',
        meta: { title: setTitle('Menu Screen') },
        component: () => import('@/views/store/MenuDisplay.vue'),
    },
];
