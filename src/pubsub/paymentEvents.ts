import mitt, {Emitter} from 'mitt';
import {Payment, PaymentFor} from '../entity/Payment';
import {EventRegistration} from '../entity/EventRegistration';
import {ChatMessage} from '../entity/ChatMessage';
import App from '../App';
import {eventRegistrationEvents} from './eventRegistrationEvents';
import {Event} from '../entity/Event';
import {consultantBookingEvents} from './consultantBookingEvents';
import {ConsultantBooking} from '../entity/ConsultantBooking';

type PaymentEvents = {
  succeeded?: {
    payment: Payment,
    eventRegistration: EventRegistration,
    event: Event,
  }
};

export const paymentEvents: Emitter<PaymentEvents> = mitt<PaymentEvents>();

const app = App.getInstance();

// Make PaymentRegistration paid
paymentEvents.on('succeeded', async (data) => {
  const payment = data.payment;
  const event = data.event;
  const eventRegistration = data.eventRegistration;

  if (payment.paymentFor == PaymentFor.Event) {
    if (eventRegistration) {
      eventRegistration.paid = true;
      await app.dbm.save(eventRegistration);
    }

    eventRegistrationEvents.emit('paid', {event, eventRegistration})
  } else if (payment.paymentFor == PaymentFor.ConsultantOffer) {
    const booking = await app.dbm.findOne(ConsultantBooking, {
      where: {uid: data.payment.paymentForId},
      relations: ['consultant', 'consultant.user', 'offer'],
    });
    if (booking) {
      booking.paid = true;
      await app.dbm.save(booking);

      consultantBookingEvents.emit('paid', {
        booking,
        consultant: booking.consultant,
        offer: booking.offer,
        consultantEmail: booking.consultant.user.email,
      });
    } else {
      consultantBookingEvents.emit('error', {message: 'ConsultantBooking is not found', data: {booking}});
    }
  }
});

class DonationMessageFacade {
  protected payment: Payment;
  protected eventRegistration: EventRegistration;

  constructor(payment: Payment, eventRegistration: EventRegistration) {
    this.payment = payment;
  }

  get paymentDonationQuestion() {
    return this.payment.donationQuestion ? this.payment.donationQuestion : '';
  }

  get messageText() {
    return this.payment.isPrivate ? '' : this.paymentDonationQuestion;
  }

  get screenName() {
    return this.payment?.screenName || this.eventRegistration?.screenName || 'anonymous';
  }

  get eventId() {
    return this.eventRegistration.eventId;
  }

  get amount() {
    return this.payment.amount;
  }
}

// Save donation to the chat message
paymentEvents.on('succeeded', async (data) => {
  const payment = data.payment;
  const eventRegistration = data.eventRegistration;

  if (payment.paymentFor == PaymentFor.Donation) {
    const messageFacade = new DonationMessageFacade(payment, eventRegistration);

    const chatMessage = app.dbm.create(ChatMessage, {
      screenName: messageFacade.screenName,
      messageText: messageFacade.messageText,
      // socketSessionId,
      messageType: 'donation',
      event: {id: messageFacade.eventId},
      meta: {
        donationAmount: messageFacade.amount,
      },
    })
    await app.dbm.save(chatMessage);
  }
});

// Broadcast donation via sockets
paymentEvents.on('succeeded', async (data) => {
  const payment = data.payment;
  const eventRegistration = data.eventRegistration;

  if (payment.paymentFor == PaymentFor.Donation) {
    const messageFacade = new DonationMessageFacade(payment, eventRegistration);

    await app.wsApp.wsChat.broadcastDonatedMessage({
      // socketSessionId: string,
      eventId: messageFacade.eventId,
      // secret: string,
      screenName: messageFacade.screenName,
      messageText: messageFacade.messageText,
      donationAmount: messageFacade.amount,
    });
  }
});
