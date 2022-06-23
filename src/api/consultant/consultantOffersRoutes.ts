import {arr, bool, id, num, obj, str} from 'json-schema-blocks'
import App from '../../App'
import {ExtError} from '../../lib/ExtError'
import {StatusCodes} from '../../lib/StatusCodes'
import {ConsultantOffer} from '../../entity/ConsultantOffer'
import sanitizeHtml from 'sanitize-html';

const app = App.getInstance();

const offerSchema = {
  price: num(0),
  title: str(),
  description: str(),
  subtitle: str(),
  isEnabled: bool(),
  calendlyEventType: str(),
}

const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'br'],
  selfClosing: ['br']
}

export default function (router, opts, next) {

  router.get('', {
    schema: {
      response: {
        200: obj({
          offers: arr(
            obj({
              id: id(),
              ...offerSchema,
            }),
          ),
        }),
      },
    },
  }, async (req, resp) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    const consultant = await app.repos.ConsultantRepo.findOrCreateConsultant({user});

    const offers = await app.dbm.find(ConsultantOffer, {
      where: {
        consultant: {id: consultant.id},
      },
      order: {id: 'DESC'},
    });

    resp.send({offers});
  });

  router.post('', {
    schema: {
      body: obj(
        offerSchema,
        {optional: ['calendlyEventType', 'subtitle']}
      ),
      response: {
        200: obj({
          offer: obj({
            id: id(),
            ...offerSchema,
          }),
        }),
      },
    },
  }, async (req, resp) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    const consultant = await app.repos.ConsultantRepo.findOrCreateConsultant({user});
    const data = {...req.body}

    data.description = sanitizeHtml(req.body.description, sanitizeOptions)

    const offer = app.dbm.create(ConsultantOffer, {
      ...data,
      consultant: {id: consultant.id}
    });


    await app.dbm.save(offer);

    resp.send({offer});
  });

  router.put('', {
    schema: {
      body: obj(
          offerSchema,
          {optional: ['calendlyEventType', 'subtitle']}
      ),
      response: {
        200: obj({
          offer: obj({
            id: id(),
            ...offerSchema,
          }),
        }),
      },
    },
  }, async (req, resp) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    // const consultant = await app.repos.ConsultantRepo.findOrCreateConsultant({user});
    const offer = await app.dbm.findOneOrFail(ConsultantOffer, {
      where: {id: req.body.id},
    });

    Object.assign(offer, req.body)

    offer.description = sanitizeHtml(req.body.description, sanitizeOptions)
    await app.dbm.save(offer);

    resp.send({offer});
  });

  next();
}
