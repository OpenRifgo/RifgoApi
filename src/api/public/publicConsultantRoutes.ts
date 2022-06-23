import App from '../../App';
import {arr, bool, id, nullable, num, obj, str} from 'json-schema-blocks';
import {ConsultantOffer} from '../../entity/ConsultantOffer';
import {Consultant} from '../../entity/Consultant'
import {consultantBookingEvents} from '../../pubsub/consultantBookingEvents'
import {referralLinkEvents} from '../../pubsub/referralLinkEvents'
import {User} from '../../entity/User'
import {ConsultantReview} from '../../entity/ConsultantReview'
import {ConsultantPeer} from '../../entity/ConsultantPeer'

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

  router.get('/:consultantSlug/offers', {
    schema: {
      params: {
        consultantSlug: str(),
      },
      response: {
        200: obj({
          offers: arr(
            obj({
              id: id(),
              price: num(),
              title: str(),
              subtitle: str(),
              description: str(),
              isEnabled: bool()
            }),
          ),
        }),
      },
    },
  }, async (req, resp) => {
    const consultantSlug = req.params.consultantSlug;

    const consultant = await app.dbm.findOneOrFail(Consultant, {
      slug: consultantSlug,
    })

    const offers = await app.dbm.find(ConsultantOffer, {
      where: {consultantId: consultant.id},
      order: {id: 'DESC'},
    });

    resp.send({offers});
  });

  router.get('/:consultantSlug/reviews', {
    schema: {
      params: {
        consultantSlug: str(),
      },
      response: {
        200: obj({
          reviews: arr(
            obj({
              id: id(),
              name: str(),
              text: str(),
              sessions: nullable(num()),
            }),
          ),
        }),
      },
    },
  }, async (req, resp) => {
    const consultantSlug = req.params.consultantSlug;

    const consultant = await app.dbm.findOneOrFail(Consultant, {
      slug: consultantSlug,
    })

    const reviews = await app.dbm.find(ConsultantReview, {
      where: {consultantId: consultant.id},
      order: {id: 'DESC'},
    });

    resp.send({reviews});
  });

  router.get('/:consultantSlug/peers', {
    schema: {
      params: {
        consultantSlug: str(),
      },
      response: {
        200: obj({
          peers: arr(
            obj({
              id: id(),
              name: str(),
              text: str(),
              peerConsultant: obj({
                name: str(),
                title: str(),
                slug: str(),
                avatarUrl: str(),
              })
            }),
          ),
        }),
      },
    },
  }, async (req, resp) => {
    const consultantSlug = req.params.consultantSlug;

    const consultant = await app.dbm.findOneOrFail(Consultant, {
      slug: consultantSlug,
    })

    const peers = await app.dbm.find(ConsultantPeer, {
      where: {consultantId: consultant.id},
      relations: ['peerConsultant'],
      order: {id: 'DESC'},
    });

    resp.send({peers});
  });

  router.get('/:consultantSlug', {
    schema: {
      params: {
        consultantSlug: str(),
      },
      response: {
        200: obj({
          consultant: obj({
            id: id(),
            ...consultantSchema,
          }),
        }),
      },
    },
  }, async (req, resp) => {
    const consultantSlug = req.params.consultantSlug;

    const consultant = await app.dbm.findOneOrFail(Consultant, {
      slug: consultantSlug,
    });

    resp.send({consultant});
  });

  router.post('/:consultantSlug/referralLink', {
    schema: {
      params: {
        consultantSlug: str(),
      },
      body: obj({
        email: str(),
      }),
      response: {
        200: obj({
          referralLink: obj({
            uid: str(),
            url: str(1),
          }),
        }),
      },
    },
  }, async (req, resp) => {
    const consultantSlug = String(req.params.consultantSlug);
    const data = req.body as {
      email: string,
    }

    const {referralLink, consultant} = await app.repos.ConsultantReferralLinkRepo
      .createReferralLink({
        consultantSlug,
        email: data.email,
      });

    const consultantUser = await app.dbm.findOneOrFail(User, consultant.userId);

    referralLinkEvents.emit('created', {
      referralLink,
      consultant,
      consultantEmail: consultantUser.email,
    });

    resp.send({
      referralLink: {
        ...referralLink,
        url: `${app.env.shortRoot}/${referralLink.uid}`,
      },
    });
  });

  router.post('/:consultantSlug/offers/:offerId/booking', {
    schema: {
      params: {
        consultantSlug: str(),
        offerId: num(),
      },
      body: obj({
        email: str(),
        referralUid: str(),
      }, {
        optional: ['referralUid'],
      }),
      response: {
        200: obj({
          booking: obj({
            uid: str(),
            email: str(),
            // offer: obj({id: id()}),
            // consultant: obj({slug: str()}),
            price: num(),
            paid: bool(),
          }),
        }),
      },
    },
  }, async (req, resp) => {
    const consultantSlug = String(req.params.consultantSlug);
    const offerId = Number(req.params.offerId);
    const data = req.body as {
      email: string,
      referralUid: string,
    }

    const booking = await app.repos.ConsultantBookingRepo
      .createConsultantBooking({
        consultantSlug,
        offerId,
        email: data.email,
        referralUid: data.referralUid,
      });

    consultantBookingEvents.emit('created', {
      booking,
      consultant: booking.consultant,
      offer: booking.offer,
      consultantEmail: (await app.repos.UserRepo.findById(booking.consultant.userId)).email,
    });

    resp.send({
      booking,
    });
  });

  next();
}
