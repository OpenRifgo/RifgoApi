import App from '../App'
import {User} from '../entity/User'
import {ExtError} from '../lib/ExtError'
import {StatusCodes} from '../lib/StatusCodes'
import {Payment, PaymentFor, PaymentProviders, PaymentStatus} from '../entity/Payment'
import {PaymentSystemLog} from '../entity/PaymentSystemLog'
import {ChatMessage} from '../entity/ChatMessage'
import {paymentEvents} from '../pubsub/paymentEvents'
import {bool, int, obj, str} from 'json-schema-blocks'

const app = App.getInstance()

export default function (fastify, opts, next) {

  fastify.get('/status', async (req, reply) => {
    reply.send({})
  });

  fastify.post('/createAccount', {
      schema: {
        body: obj({
          ifNotExists: bool(),
        }, {required: []}),
        response: {
          200: obj({
            success: bool(),
            created: bool(),
          }),
        },
      },
    },
    async (req, reply) => {
      const userId = app.AuthService.getUserId(req.session);
      if (!userId) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

      const ifNotExists = req.body?.ifNotExists;

      const user = await app.dbm.findOneOrFail(User, {id: userId});

      if (user.stripeAccountId) {
        if (ifNotExists) {
          reply.send({
            success: true,
            created: false,
          });

          return;
        } else {
          throw new ExtError('User already has StripeId', StatusCodes.CONFLICT);
        }
      }
      // const domainForAPay = app.env.frontendRoot;
      const domainForAPay = undefined; //disable
      const createAccountResult = await app.stripeConnectService.createAccount(user, domainForAPay);
      user.stripeAccountId = createAccountResult.id;
      await app.dbm.save(user);

      reply.send({
        success: true,
        created: true,
      });
    });

  fastify.post('/createAccountOnboardingLink', async (req, reply) => {
    const userId = app.AuthService.getUserId(req.session)
    if (!userId) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    const user = await app.dbm.findOneOrFail(User, {id: userId});

    if (!user.stripeAccountId) throw new ExtError('User don\'t have StripeId', StatusCodes.CONFLICT);

    const createAccountResult = await app.stripeConnectService.createAccountOnboardingLink(user);

    reply.send({
      url: createAccountResult.url,
    });
  });

  fastify.post('/checkAccount', async (req, reply) => {
    const userId = app.AuthService.getUserId(req.session)
    if (!userId) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    const user = await app.dbm.findOneOrFail(User, {id: userId});

    if (!user.stripeAccountId) throw new ExtError('User don\'t have StripeId', StatusCodes.CONFLICT);

    const checkAccountResult = await app.stripeConnectService.checkAccount(user);

    reply.send({
      checkAccountResult,
    });
  });

  fastify.post('/createPayment', async (req, reply) => {
    // paymentIntent

    const paymentIntent = app.dbm.create(Payment, {});
    await app.dbm.save(paymentIntent);

    // const x = await app.stripeConnectService.paymentIntent({
    //     stripeAccountId: ''
    // }, {
    //     amount: 100,
    //     fee_amount: 10,
    // });

  });

  /**

   {
  id: 'evt_3JLUOzA8u6jRGcKh0OqqKut8',
  object: 'event',
  api_version: '2020-08-27',
  created: 1628261521,
  data: {
    object: {
      id: 'pi_3JLUOzA8u6jRGcKh0vmj5quO',
      object: 'payment_intent',
      amount: 2000,
      amount_capturable: 0,
      amount_received: 0,
      application: null,
      application_fee_amount: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'automatic',
      charges: [Object],
      client_secret: 'pi_3JLUOzA8u6jRGcKh0vmj5quO_secret_q2X0gnkxzaL7BNZRwfa8Nl0TP',
      confirmation_method: 'automatic',
      created: 1628261521,
      currency: 'usd',
      customer: null,
      description: '(created by Stripe CLI)',
      invoice: null,
      last_payment_error: null,
      livemode: false,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: null,
      payment_method_options: [Object],
      payment_method_types: [Array],
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'requires_payment_method',
      transfer_data: null,
      transfer_group: null
    }
  },
  livemode: false,
  pending_webhooks: 2,
  request: { id: 'req_Nl8n10QOV4HE7W', idempotency_key: null },
  type: 'payment_intent.created'
}

   */

  /*

  {
"id": "evt_3JMAQ2PDtHBc9tvi075IWW1X",
"data": {
  "object": {
    "id": "ch_3JMAQ2PDtHBc9tvi0p35i8FC",
    "paid": true,
    "order": null,
    "amount": 1000,
    "object": "charge",
    "review": null,
    "source": null,
    "status": "succeeded",
    "created": 1628423042,
    "dispute": null,
    "invoice": null,
    "outcome": {
      "type": "authorized",
      "reason": null,
      "risk_level": "normal",
      "risk_score": 4,
      "network_status": "approved_by_network",
      "seller_message": "Payment complete."
    },
    "refunds": {
      "url": "/v1/charges/ch_3JMAQ2PDtHBc9tvi0p35i8FC/refunds",
      "data": [],
      "object": "list",
      "has_more": false,
      "total_count": 0
    },
    "captured": true,
    "currency": "usd",
    "customer": null,
    "disputed": false,
    "livemode": false,
    "metadata": {},
    "refunded": false,
    "shipping": null,
    "application": "ca_JwnOuZsKpibshcC7hTa3FYmHTKlNckdY",
    "description": null,
    "destination": null,
    "receipt_url": "https://pay.stripe.com/receipts/acct_1JK2ZSPDtHBc9tvi/ch_3JMAQ2PDtHBc9tvi0p35i8FC/rcpt_K0AludDDslbkCyr7DNKwiVYEcyiAKdv",
    "failure_code": null,
    "on_behalf_of": null,
    "fraud_details": {},
    "receipt_email": null,
    "transfer_data": null,
    "payment_intent": "pi_3JMAQ2PDtHBc9tvi0iqjjWfd",
    "payment_method": "pm_1JMAQ9PDtHBc9tvikObnfRAp",
    "receipt_number": null,
    "transfer_group": null,
    "amount_captured": 1000,
    "amount_refunded": 0,
    "application_fee": "fee_1JMAQAPDtHBc9tvihqhJOhXP",
    "billing_details": {
      "name": null,
      "email": null,
      "phone": null,
      "address": {
        "city": null,
        "line1": null,
        "line2": null,
        "state": null,
        "country": null,
        "postal_code": "42424"
      }
    },
    "failure_message": null,
    "source_transfer": null,
    "balance_transaction": "txn_3JMAQ2PDtHBc9tvi0YSKWUe0",
    "statement_descriptor": null,
    "application_fee_amount": 100,
    "payment_method_details": {
      "card": {
        "brand": "visa",
        "last4": "4242",
        "checks": {
          "cvc_check": "pass",
          "address_line1_check": null,
          "address_postal_code_check": "pass"
        },
        "wallet": null,
        "country": "US",
        "funding": "credit",
        "network": "visa",
        "exp_year": 2024,
        "exp_month": 4,
        "fingerprint": "ayWRI3zNbJOWsLz4",
        "installments": null,
        "three_d_secure": null
      },
      "type": "card"
    },
    "statement_descriptor_suffix": null,
    "calculated_statement_descriptor": "RIFGO.COM"
  }
},
"type": "charge.succeeded",
"object": "event",
"account": "acct_1JK2ZSPDtHBc9tvi",
"created": 1628423042,
"request": {
  "id": "req_JrRE3jenH2M8ar",
  "idempotency_key": null
},
"livemode": false,
"api_version": "2020-08-27",
"pending_webhooks": 3
}

   */

  fastify.post('/hooks', async (req, reply) => {
    const body: {
      type: string,
      data: any,
    } /*| {
            id: string,
            type: 'payment_intent.created',
            data: {
                object: {
                    id: string,
                    object: 'payment_intent' | string,
                    amount: number,
                    amount_capturable: number,
                    amount_received: number,
                    currency: 'usd' | string,
                    status: 'requires_payment_method' | string,
                    client_secret: string,
                    confirmation_method: 'automatic' | string,
                }
            }
        } | {
            id: string,
            type: 'charge.succeeded',
            data: {
                object: {
                    id: string,
                    paid: boolean,
                    order: null,
                    amount: number,
                    object: "charge",
                    status: "succeeded" | string,
                    currency: 'usd',
                }
            } */
      = req.body;

    console.log(body);

    const paymentSystemLog = app.dbm.create(PaymentSystemLog, {
      paymentProvider: PaymentProviders.StripeConnect,
      paymentProviderId: req.body.id,
      event: `webhook:${body.type || 'unknown'}`,
      data: body,
    });
    await app.dbm.save(paymentSystemLog);

    if (body.type === 'charge.succeeded') {
      // try {

      const data: {
        object: {
          id: string,
          paid: boolean,
          order: null,
          amount: number,
          payment_intent: string, // to match with Payment.paymentProviderId in DB
          object: "charge" | string,
          status: "succeeded" | string,
          currency: 'usd',
        }
      } = body.data;

      if (data.object.status === 'succeeded' || data.object.object === 'charge') {
        const payment = await app.dbm.findOneOrFail(Payment, {
          where: {
            paymentProvider: PaymentProviders.StripeConnect,
            paymentProviderId: data.object.payment_intent,
          },
          relations: ['eventRegistration', 'eventRegistration.event'],
        });

        payment.status = PaymentStatus.Paid;

        await app.dbm.save(payment);

        paymentEvents.emit('succeeded', {
          payment,
          eventRegistration: payment.eventRegistration,
          event: payment.eventRegistration?.event,
        });
      }

      // } catch (e) {
      //
      // }

    }

    reply.send({ok: true});
  });

  next();

}
