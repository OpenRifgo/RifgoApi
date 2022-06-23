import App from '../App';
import {arr, bool, id, obj, str} from 'json-schema-blocks';
import {Consultant} from '../entity/Consultant';
import {ExtError} from '../lib/ExtError';
import {StatusCodes} from '../lib/StatusCodes';
import consultantOffersRoutes from './consultant/consultantOffersRoutes';
import sanitizeHtml from 'sanitize-html';
import {PureSlugValidator} from '../repos/ConsultantRepo';
import assert from 'assert';
import {timeout} from '../lib/timeout'

const app = App.getInstance();

const consultantSchema = {
  slug: str(),
  name: str(),
  title: str(),
  description: str(),
  promoDescription: str(),
  avatarUrl: str(),
  smm: obj({}, {additionalProperties: true}),
  buttons: arr(obj({}, {additionalProperties: true})),
}

export default function (router, opts, next) {

  router.register(consultantOffersRoutes, {prefix: '/offers'});

  router.get('/profile', {
    schema: {
      response: {
        200: obj({
          consultant: obj({
            id: id(),
            ...consultantSchema
          }),
        }),
      },
    },
  }, async (req, resp) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    const consultant = await app.repos.ConsultantRepo.findOrCreateConsultant({user});

    resp.send({consultant});
  });

  router.put('/profile', {
    schema: {
      body: obj({
        slug: str(3),
        name: str(1),
        title: str(),
        description: str(),
        promoDescription: str(),
        avatarUrl: str(),
        smm: obj({}, {additionalProperties: true}),
        buttons: arr(obj({}, {additionalProperties: true})),
      }, {optional: ['slug']}),
      response: {
        consultant: obj({
          id: id(),
          ...consultantSchema
        }),
      },
    },
  }, async (req, resp) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    const consultant = await app.dbm.findOneOrFail(Consultant, {
      where: {userId: user.id},
      order: {id: 'DESC'}
    });

    const sanitizeOption = {
      allowedTags: ['b', 'i', 'em', 'strong']
    }

    let slug = req.body.slug;
    const slugValidator = new PureSlugValidator(slug);
    assert(slugValidator.isValid(), 'Slug is invalid, please pick another one');
    slug = slugValidator.normalizedSlug;

    const consultantData = req.body;
    delete consultantData['slug'];
    Object.assign(consultant, consultantData);

    consultant.description = sanitizeHtml(req.body.description, sanitizeOption);
    consultant.promoDescription = sanitizeHtml(req.body.promoDescription, sanitizeOption);

    await app.dbm.save(consultant);

    await app.repos.ConsultantRepo.setSlug(consultant, slug);

    resp.send({consultant});
  });

  router.get('/slug/:slug/isAvailable', {
    schema: {
      response: {
        slug: obj({
          isAvailable: bool(),
          validSlug: str()
        }),
      },
    },
  }, async (req, resp) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    let slug = req.params.slug;
    const consultant = await app.dbm.findOne(Consultant, {
      where: {slug: slug},
    });
    let isAvailable: boolean = !consultant;
    let validSlug = '';

    if (isAvailable) {
      const slugValidator = new PureSlugValidator(slug);
      isAvailable = slugValidator.isValid();
      validSlug = slugValidator.normalizedSlug;
    }

    resp.send({isAvailable, validSlug});
  });

  router.post('/calendlyEventTypes', async (req, reply) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    try {
      const eventTypes = await app.CalendlyService.getEventTypes(user, {active: true});

      reply.send(eventTypes);
    } catch (e) {
      app.logger.error(e.message, {
        event: 'POST calendlyEventTypes',
        data: {response: e.response?.data, req: {path: req.path, method: req.method}}
      });

      reply.send({
        error: e.message,
        code: e.response?.statusCode,
        data: e.response?.data,
      });
    }
  });

  next();
}
