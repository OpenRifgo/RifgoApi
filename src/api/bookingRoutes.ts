import bookingPaymentRoutes from './booking/bookingPaymentRoutes'

export default function (router, opts, next) {

  router.register(bookingPaymentRoutes, {prefix: '/payments'});

  next();
}
