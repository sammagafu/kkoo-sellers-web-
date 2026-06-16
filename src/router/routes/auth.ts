import type { RouteLocationGeneric } from 'vue-router'
import { setTitle } from './meta'

export const authRoutes = [
    {
        path: '/auth/sign-in',
        name: 'auth.sign-in',
        meta: {
            title: setTitle('Sign In'),
            description: "Sign in to KKOO Admin or Business. One account, the right dashboard."
        },
        component: () => import('@/views/auth/sign-in.vue')
    },
    {
        path: '/auth/sign-up',
        name: 'auth.sign-up',
        meta: {
            title: setTitle('Sign Up'),
            description: "Create your KKOO account. Shop, sell, send, and move from one trusted platform."
        },
        component: () => import('@/views/auth/sign-up.vue')
    },
    {
        path: '/auth/seller-register',
        name: 'auth.seller-register',
        meta: {
            title: setTitle('Become a Seller'),
            description:
                "Register for KKOO Business. List products, manage orders, request delivery, and get paid in one place.",
        },
        redirect: (to: RouteLocationGeneric) => ({ name: 'auth.sign-up', query: { ...to.query, as: 'seller' } }),
    },
    {
        path: '/auth/lock-screen',
        name: 'auth.lock-screen',
        meta: {
            title: setTitle('Lock Screen')
        },
        component: () => import('@/views/auth/lock-screen.vue')
    }
];
