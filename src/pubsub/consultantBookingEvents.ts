import mitt, {Emitter} from 'mitt';
import {EventRegistration} from '../entity/EventRegistration'
import App from '../App'
import {Event} from '../entity/Event'
import {EventLink} from '../entity/EventLink'
import {ConsultantBooking} from '../entity/ConsultantBooking'
import {Consultant} from '../entity/Consultant'
import {ConsultantOffer} from '../entity/ConsultantOffer'
import {ConsultantReferralLink} from '../entity/ConsultantReferralLink'

type ConsultantBookingEvents = {
  paid?: {
    booking: ConsultantBooking,
    consultant: Consultant,
    offer: ConsultantOffer,
    consultantEmail: string
  },
  created?: {
    booking: ConsultantBooking,
    consultant: Consultant,
    offer: ConsultantOffer,
    consultantEmail: string
  },
  'created:free'?: {
    booking: ConsultantBooking,
    consultant: Consultant,
    offer: ConsultantOffer,
    consultantEmail: string
  },
  opened?: {
    booking: ConsultantBooking,
    consultant: Consultant,
    offer: ConsultantOffer,
    consultantEmail: string
  },
  'calendarLink:created'?: {
    booking: ConsultantBooking,
    consultant: Consultant,
    offer: ConsultantOffer,
    consultantEmail: string
  },
  error?: {
    message: string
    event?: string
    data: any
    stack?: string
  }
};

export const consultantBookingEvents: Emitter<ConsultantBookingEvents> = mitt<ConsultantBookingEvents>();

const app = App.getInstance();

// emitted when booking is created
consultantBookingEvents.on('created', async (data) => {
  if (data.booking.price === 0) {
    consultantBookingEvents.emit('created:free', data);
  }
});

// emitted when booking is created and don't need to be paid (free)
consultantBookingEvents.on('created:free', async (data) => {
  consultantBookingEvents.emit('opened', data);
});

// emitted when booking is paid
consultantBookingEvents.on('paid', async (data) => {
  consultantBookingEvents.emit('opened', data);
});

consultantBookingEvents.on('paid', async (data) => {
  consultantBookingEvents.emit('opened', data);
});

// Create Calendly link when booking is paid OR free booking is created
consultantBookingEvents.on('opened', async (data) => {
  try {
    const consultantUser =
      await app.repos.UserRepo.findById(
        (await app.repos.ConsultantRepo.findById(data.booking.consultantId)).userId,
      );

    const offer = data.offer;

    const schedulingLink = await app.CalendlyService.createCalendarLink(consultantUser, {uri: offer.calendlyEventType});

    //todo: move to service
    data.booking.calendarLink = schedulingLink.booking_url;
    await app.dbm.save(data.booking);

    consultantBookingEvents.emit('calendarLink:created', data);
  } catch (e) {
    consultantBookingEvents.emit('error', {
      message: e.message,
      event: 'opened[createCalendarLink]',
      data: data,
      stack: e.stack,
    });
  }
});

consultantBookingEvents.on('opened', async (data) => {
  try {
    const referralUid = data.booking.referralUid;
    const referral = await app.dbm.findOne(ConsultantReferralLink, {
      uid: referralUid,
    });

    if (referral) {
      await app.EmailModule.sendConsultationBookedWithAgentToConsultant({
        ...data,
        referral,
      });

      // update referral registrations counter
      await app.dbm.createQueryBuilder()
        .update(ConsultantReferralLink)
        .where({uid: referral.uid})
        .set({ confirmations: () => "confirmations + 1" })
        .execute();

      await app.EmailModule.sendConsultationBookedToAgent({
        ...data,
        referral,
      });
    } else {
      await app.EmailModule.sendConsultationBookedToConsultant({
        ...data,
      });
    }
  } catch (e) {
    consultantBookingEvents.emit('error', {
      message: e.message,
      event: 'opened[consultantAndAgent]',
      data: data,
      stack: e.stack,
    });
  }
});

// Send email with link when booking is paid OR free booking is created
consultantBookingEvents.on('calendarLink:created', async (data) => {
  try {
    await app.EmailModule.sendConsultationLinkToClient(data);
  } catch (e) {
    consultantBookingEvents.emit('error', {
      message: e.message,
      event: 'calendarLink:created',
      data: data,
      stack: e.stack,
    });
  }
});

consultantBookingEvents.on('error', async (data) => {
  app.logger.error('ConsultantBookingEvents error', data);
});
