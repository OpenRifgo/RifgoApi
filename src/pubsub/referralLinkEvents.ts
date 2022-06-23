import mitt, {Emitter} from 'mitt'
import App from '../App'
import {ConsultantReferralLink} from '../entity/ConsultantReferralLink'
import {consultantBookingEvents} from './consultantBookingEvents'
import {Consultant} from '../entity/Consultant'


type ReferralLinkEvents = {
  created?: {
    referralLink: ConsultantReferralLink
    consultant: Consultant
    consultantEmail: string
  },
  error?: {
    message: string
    event?: string
    data: any
    stack?: string
  }
};

export const referralLinkEvents: Emitter<ReferralLinkEvents> = mitt<ReferralLinkEvents>();

const app = App.getInstance();


referralLinkEvents.on('created', async (data) => {
  try {
    await app.EmailModule.sendReferralLink(data);
  } catch (e) {
    consultantBookingEvents.emit('error', {
      message: e.message,
      event: 'referralLink:created',
      data: data,
      stack: e.stack,
    });
  }
});

referralLinkEvents.on('error', async (data) => {
  app.logger.error('ReferralLinkEvents:Error', data);
});
