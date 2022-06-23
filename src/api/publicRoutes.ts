import App from '../App'
import {EventLink} from '../entity/EventLink'
import {EventRegistration} from '../entity/EventRegistration'
import {PaymentFor, PaymentProviders} from '../entity/Payment'
import assert from 'assert'
import {enumStr, id, num, obj, str} from 'json-schema-blocks'
import {Stripe} from "stripe";
import publicConsultantRoutes from './public/publicConsultantRoutes';
import {User} from '../entity/User'
import publicShortLinkRoutes from './public/publicShortLinkRoutes'
import {ConsultantBooking} from '../entity/ConsultantBooking'

const app = App.getInstance()

export default function (router, opts, next) {

  router.register(publicConsultantRoutes, {prefix: '/consultant'});
  router.register(publicShortLinkRoutes, {prefix: '/shortLink'});

  router.get('/events/:eventUid', async (req, resp) => {
    // const userId = app.AuthService.getUserId(req.session)
    // if (!userId) {
    //     return resp.code(403).send({
    //         error: 'User not authenticated'
    //     });
    // }

    const eventLinkUid = String(req.params.eventUid)

    const eventLink = await app.dbm.findOneOrFail(EventLink, {
      where: {
        uid: eventLinkUid,
      },
      relations: ['event'],
    });

    const event = eventLink.event;

    resp.send({
      event,
    });
  });

  router.get('/event', async (req, resp) => {
    const regSecret = String(req.query.regSecret);
    assert(regSecret);

    const eventRegistration = await app.dbm.findOneOrFail(EventRegistration, {
      where: {
        secret: regSecret,
      },
      relations: ['event'],
    });

    const event = eventRegistration.event;

    req.session.set('registrationSecret', eventRegistration.secret);

    resp.send({
      event,
      eventRegistration,
    });
  });

  router.get('/events/registered/:regSecret/recommended', async (req, resp) => {
    const regSecret = String(req.query.regSecret);
    assert(regSecret);

    const eventRegistration = await app.dbm.findOneOrFail(EventRegistration, {
      where: {
        secret: regSecret,
      },
      relations: ['event'],
    });

    const event = eventRegistration.event;

    req.session.set('registrationSecret', eventRegistration.secret);

    resp.send({
      event,
      eventRegistration,
    });
  });

  router.post('/events/:eventUid/register', {
    schema: {
      params: obj({
        eventUid: str(1),
      }),
      body: obj({
        email: str(3),
      }),
    },
  }, async (req, resp) => {
    const eventLinkUid = String(req.params.eventUid);
    const email = String(req.body.email);

    await app.EventRegistrationService.register(eventLinkUid, email);

    resp.send({ok: true});
  });

  router.get('/paywall/:secret', async (req, reply) => {
    const secret = String(req.params.secret);
    assert(secret);
    const eventRegistration = await app.EventRegistrationService.confirmEventRegistrationBySecret(secret);

    const event = eventRegistration.event;

    if (event.accessType != 'free' && event.amount != 0) {
      const payment = await app.paymentsService.newEventPayment(PaymentProviders.StripeConnect, eventRegistration);
      const paymentIntent = payment.paymentProviderResponse as Stripe.PaymentIntent;
      reply
        .type('text/html')
        .send(await app.ejs.renderFile(
          `${app.dirService.rootDir}/src/templates/stripe/stripePayment.html.ejs`,
          {
            name: event.name,
            date: event.date,
            timeFrom: event.timeFrom,
            timezone: event.timezone,
            eventAmount: event.amount,
            stripePublicKey: app.env.stripePublicKey,
            stripeAccountId: event.user.stripeAccountId,
            client_secret: paymentIntent.client_secret,
          },
          {async: true},
        ));
    }
  });

  router.get('/paywall/:secret/data', async (req, reply) => {
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

  router.post('/payment', {
    schema: {
      body: obj({
        paymentFor: enumStr(...Object.keys(PaymentFor)),
        paymentForId: {anyOf: [id(), str(1)]},
        amount: num(0),
        title: str(),
      })
    },
  }, async (req, reply) => {
    const data = req.body;

    let user: User;
    if (data.paymentFor === PaymentFor.ConsultantOffer) {
      const consultantOffer = await app.dbm.findOneOrFail(ConsultantBooking, {
        where: {
          uid: data.paymentForId
        },
        relations: ['consultant', 'consultant.user', 'offer'],
      });

      assert(data.amount === consultantOffer.price, `Booking price is expected to be ${consultantOffer.price}`);

      user = consultantOffer.consultant.user;
    }

    const stripeAccountId = user.stripeAccountId;

    const payment = await app.paymentsService.newPaymentFor(
      PaymentProviders.StripeConnect,
      {
        ...data,
        stripeAccountId,
      }
    );

    const paymentIntent = payment.paymentProviderResponse as Stripe.PaymentIntent;
    const clientSecret = paymentIntent.client_secret;
    const amount = payment.amount;

    reply
      .send({
        stripePublicKey: app.env.stripePublicKey,
        stripeAccountId,
        clientSecret,
        amount,
      });
  });

  router.get('/eventRegistration/:secret/confirm', async (req, resp) => {
    const secret = String(req.params.secret);
    assert(secret);

    const eventRegistration = await app.dbm.findOneOrFail(EventRegistration, {
      where: {
        secret,
      },
      relations: ['event', 'event.user'],
    });

    eventRegistration.confirmed = true;
    await app.dbm.save(eventRegistration);

    resp.redirect(`${app.env.frontendRoot}/#/public/events/registered/${eventRegistration.secret}`);

    // } else {
    //     resp.redirect(`${app.env.frontendRoot}/#/public/events/registered/${eventRegistration.secret}`);
    // }
  });

  next()
}
