import App from '../App'
import {Consultant} from '../entity/Consultant'
import {ConsultantReferralLink} from '../entity/ConsultantReferralLink'
import {nanoid} from 'nanoid'
import {ShortLink, ShortLinkTypes} from '../entity/ShortLink'

export class ConsultantReferralLinkRepo {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

  async createReferralLinkByConsultantSlug(data: {
    consultantSlug: string,
    email: string,
  }) {
    return await this.createReferralLink(data);
  }

  async createReferralLink(data: {
    consultantSlug: string,
    email: string,
  }) {
    const consultant = await this.app.dbm.findOneOrFail(Consultant, {
      slug: data.consultantSlug
    });

    const uid = nanoid(32);

    const referralLink = this.app.dbm.create(ConsultantReferralLink, {
      uid,
      consultant: {id: consultant.id},
      email: data.email,
    });
    await this.app.dbm.save(referralLink);

    // create shortLink record for routing
    const shortLink = await this.app.dbm.create(ShortLink, {
      uid,
      shortLinkType: ShortLinkTypes.ConsultantReferralLink,
    });
    await this.app.dbm.save(shortLink);

    return {
      consultant,
      shortLink,
      referralLink,
    };
  }
}
