import { setTitle } from './meta'

export const urlAliasRoutes = [
    { path: '/login', redirect: { name: 'auth.sign-in' } },
    { path: '/register', redirect: { name: 'auth.sign-up' } },
    { path: '/join', redirect: { name: 'auth.seller-register' } },
    // Rider/driver flows live in the rider mobile app (not this panel)
    { path: '/drive', redirect: { name: 'auth.sign-in' } },
    { path: '/signin', redirect: { name: 'auth.sign-in' } },
];
