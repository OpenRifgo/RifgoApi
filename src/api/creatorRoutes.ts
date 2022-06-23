import App from '../App'
import creatorEventsRoutes from './creator/creatorEventsRoutes'
import creatorEventRegistrationsRoutes from './creator/creatorEventRegistrationsRoutes'
import creatorUserRoutes from './creator/creatorUserRoutes';
import uploadsRoutes from './creator/uploadsRoutes'

const app = App.getInstance()

export default function (router, opts, next) {

    router.register(creatorEventsRoutes, {prefix: '/events'});
    router.register(creatorEventRegistrationsRoutes, {prefix: '/event-registrations'});
    router.register(creatorUserRoutes, {prefix: '/user'});
    router.register(uploadsRoutes, {prefix: '/uploads'});

    next();
}
