import { setTitle } from './meta'

export const accountRoutes = [
    {
        path: '/account',
        name: 'account.home',
        meta: {
            title: setTitle('My Account'),
            authRequired: true
        },
        component: () => import('@/views/account/AccountHub.vue'),
    },
    {
        path: '/account/profile',
        name: 'account.profile',
        meta: {
            title: setTitle('Account Profile'),
            authRequired: true
        },
        component: () => import('@/views/account/profile.vue'),
    },
    {
        path: '/account/notifications',
        name: 'account.notifications',
        meta: {
            title: setTitle('Notifications'),
            authRequired: true
        },
        component: () => import('@/views/account/Notifications.vue'),
    },
    {
        path: '/account/backup-codes',
        name: 'account.backup-codes',
        meta: {
            title: setTitle('Backup codes'),
            authRequired: true
        },
        component: () => import('@/views/account/BackupCodes.vue'),
    }
];
