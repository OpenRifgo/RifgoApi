import assert from 'assert';
import {PaymentProviders} from '../../entity/Payment';
import {Stripe} from 'stripe';
import App from '../../App';

const app = App.getInstance();

export default function (router, opts, next) {

  router.get('/:secret', async (req, reply) => {
    //

    const secret = String(req.params.secret);
    assert(secret);
    const eventRegistration = await app.EventRegistrationService.confirmEventRegistrationBySecret(secret);
    const event = eventRegistration.event;

    let clientSecret: string;
    let amount: number;
    if (event.accessType != 'free' && event.amount != 0) {
      const payment = await app.paymentsService.newEventPayment(PaymentProviders.StripeConnect, eventRegistration);
      const paymentIntent = payment.paymentProviderResponse as Stripe.PaymentIntent;
      clientSecret = paymentIntent.client_secret;
      amount = payment.amount;
    }

    reply
      .send({
        stripePublicKey: app.env.stripePublicKey,
        stripeAccountId: event.user.stripeAccountId,
        clientSecret,
        amount,
      });
  });


  next();
}
