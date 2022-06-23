import App from '../App'
import {Payment, PaymentFor, PaymentProviders, PaymentStatus} from '../entity/Payment'
import {EventRegistration} from '../entity/EventRegistration'
import {Streamer} from '../entity/Streamer'

export class PaymentsService {
  protected app: App;
  public readonly DonationFee = 10;
  public readonly EventFee = 10;
  public readonly DefaultFee = 10;

  constructor(app: App) {
    this.app = app;
  }

  async newPayment(
    amount: number,
    fee: number,
    data:
      {
        paymentProvider: PaymentProviders.StripeConnect,
        paymentFor: PaymentFor,
        eventRegistration?: EventRegistration,
        streamer?: Streamer,
        paymentForId?: string | number,
      },
  ) {
    const payment = this.app.dbm.create(Payment, {
      paymentProvider: data.paymentProvider,
      amount,
      feeAmount: Math.round(amount * fee) / 100,
      currency: 'usd',
      status: PaymentStatus.New,
      eventRegistration: data.eventRegistration,
      paymentFor: data.paymentFor,
      paymentForId: data.paymentForId ? String(data.paymentForId) : null,
    });
    await this.app.dbm.save(payment);

    return payment;
  }

  async newDonationPayment(amount: number, data: { paymentProvider: PaymentProviders.StripeConnect, eventRegistration: EventRegistration }) {
    return await this.newPayment(
      amount,
      this.DonationFee,
      {
        ...data,
        paymentFor: PaymentFor.Donation,
      },
    );
  }

  async newDonationPaymentStreamer(amount: number, data: { paymentProvider: PaymentProviders.StripeConnect, streamer: Streamer }) {
    return await this.newPayment(
      amount,
      this.DonationFee,
      {
        ...data,
        paymentFor: PaymentFor.Donation,
      },
    );
  }

  async newEventPayment(paymentProvider: PaymentProviders, eventRegistration: EventRegistration): Promise<Payment> {

    const event = eventRegistration.event;
    const user = eventRegistration.event.user;

    const payment = await this.newPayment(
      event.amount,
      this.EventFee,
      {
        ...eventRegistration,
        eventRegistration,
        paymentProvider,
        paymentFor: PaymentFor.Event,
      },
    );
    if (paymentProvider === PaymentProviders.StripeConnect) {
      const paymentIntent = await this.app.stripeConnectService.paymentIntent({
        amount: payment.amount,
        fee_amount: payment.feeAmount,
      }, {
        stripeAccountId: user.stripeAccountId,
      });
      payment.paymentProviderId = paymentIntent.id;
      payment.paymentProviderResponse = paymentIntent;
      payment.status = PaymentStatus.Created;
      await this.app.dbm.save(payment);
    }
    return payment;
  }


  async newPaymentFor(
    paymentProvider: PaymentProviders,
    data: {
      paymentFor: PaymentFor,
      paymentForId: number | string,
      amount: number,
      title: string,
      stripeAccountId?: string,
    },
  ): Promise<Payment> {

    const payment = await this.newPayment(
      data.amount,
      this.DefaultFee,
      {
        paymentProvider,
        paymentFor: data.paymentFor,
        paymentForId: data.paymentForId,
      },
    );

    if (paymentProvider === PaymentProviders.StripeConnect) {
      const paymentIntent = await this.app.stripeConnectService.paymentIntent({
        amount: payment.amount,
        fee_amount: payment.feeAmount,
      }, {
        stripeAccountId: data.stripeAccountId,
      });
      payment.paymentProviderId = paymentIntent.id;
      payment.paymentProviderResponse = paymentIntent;
      payment.status = PaymentStatus.Created;
      await this.app.dbm.save(payment);
    }

    return payment;
  }
}
