import adminSendEmailRoutes from './admin/adminSendEmailRoutes'
import adminStatsRoutes from './admin/adminStatsRoutes'
import adminEventsRoutes from './admin/adminEventsRoutes'

export default function (router, opts, next) {

    router.register(adminSendEmailRoutes, {prefix: '/send-email'});
    router.register(adminStatsRoutes, {prefix: '/stats'});
    router.register(adminEventsRoutes, {prefix: '/events'});

    next();
}
