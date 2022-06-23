import App from '../App'
import {User} from '../entity/User'
import {Consultant} from '../entity/Consultant'
import {ShortLink, ShortLinkTypes} from '../entity/ShortLink'

const allowedCharsRegExp = /^[a-z0-9.\-]+$/;

export class PureSlugValidator {
  readonly normalizedSlug: string;

  constructor(slug: string) {
    this.normalizedSlug = slug.toLowerCase();
  }

  isSlugReserved() {
    return [
      'auth', 'out', 'admin', 'page', 'pages', 'api', 'assets', 'js', 'img', 'css', 'static'
    ].includes(this.normalizedSlug);
  }

  hasOnlyAllowedChars() {
    return allowedCharsRegExp.test(this.normalizedSlug);
  }

  isValid() {
    return (this.normalizedSlug.length > 0) && this.hasOnlyAllowedChars() && !this.isSlugReserved();
  }
}


export class ConsultantRepo {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

  async findOrCreateConsultant(data: {
    user: User,
  }) {
    let consultant = await this.app.dbm.findOne(Consultant, {
      where: {userId: data.user.id},
      order: {id: 'DESC'}
    });

    if (!consultant) { consultant = await this.createConsultant(data) }

    return consultant;
  }

  async createConsultant(data: {
    user: User,
  }) {
    const consultant = await this.app.dbm.create(Consultant, {
      user: {id: data.user.id}
    });
    await this.app.dbm.save(consultant);

    // const link = await this.app.dbm.create(ShortLink, {
    //   uid: consultant.slug,
    //   shortLinkType: ShortLinkTypes.ConsultantSlug,
    // });
    // await this.app.dbm.save(link);

    return consultant;
  }

  async setSlug(consultant: Consultant, slug: string | null) {
    if (!slug) return;
    if (consultant.slug) return;

    const link = await this.app.dbm.create(ShortLink, {
      uid: slug,
      shortLinkType: ShortLinkTypes.ConsultantSlug,
    });
    await this.app.dbm.save(link);

    consultant.slug = slug;
    await this.app.dbm.save(consultant);

    return consultant;
  }

  async findById(id: number) {
    return await this.app.dbm.findOne(Consultant, id);
  }
}
