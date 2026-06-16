import { setTitle } from './meta'

export const invitationAcceptRoute = [
    {
        path: '/invitations/accept',
        name: 'invitations.accept',
        meta: {
            title: setTitle('Accept invitation'),
            authRequired: true,
        },
        component: () => import('@/views/invitations/InvitationAccept.vue'),
    },
];
