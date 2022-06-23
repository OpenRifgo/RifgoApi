import App from '../App'
import {Consultant} from '../entity/Consultant'
import {nanoid} from 'nanoid'
import {ConsultantBooking} from '../entity/ConsultantBooking'
import {ConsultantOffer} from '../entity/ConsultantOffer'
import {ConsultantReferralLink} from '../entity/ConsultantReferralLink'

export class ConsultantBookingRepo {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

  async createConsultantBooking(data: {
    consultantSlug: string,
    email: string,
    offerId: number,
    referralUid?: string | null,
  }) {
    const consultant = await this.app.dbm.findOneOrFail(Consultant, {
      slug: data.consultantSlug
    });

    const offer = await this.app.dbm.findOneOrFail(ConsultantOffer, {
      id: data.offerId,
      consultant: {id: consultant.id},
    });

    const uid = nanoid(32);

    const booking = this.app.dbm.create(ConsultantBooking, {
      uid,
      consultant,
      offer,
      price: offer.price,
      email: data.email,
      referralUid: data.referralUid || null,
    });
    await this.app.dbm.save(booking);

    if (data.referralUid) {
      // update referral registrations counter
      await this.app.dbm.createQueryBuilder()
        .update(ConsultantReferralLink)
        .where({uid: data.referralUid})
        .set({ registrations: () => "registrations + 1" })
        .execute();
    }

    return booking;
  }
}
