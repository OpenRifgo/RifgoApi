import App from '../../App'
import {Event} from '../../entity/Event'
import {EventLinkService} from '../../services/EventLinkService'
import {arr, bool, enumStr, id, obj, str} from 'json-schema-blocks'
import {EventRegistration} from '../../entity/EventRegistration'
import {FindConditions} from 'typeorm/find-options/FindConditions'
import {timeout} from '../../lib/timeout'
import {StatusCodes} from '../../lib/StatusCodes'

const app = App.getInstance();

export default function (router, opts, next) {

  router.get('/', {
    schema: {
      description: 'Login',
      query: obj({
        eventId: id(),
        confirmed: enumStr('true', 'false'),
        paid: enumStr('true', 'false'),
      }, {required: ['eventId']}),
      response: {
        200: obj({
          eventRegistrations: arr(
            obj({
              id: id(),
              email: str(),
              screenName: str(),
              confirmed: bool(),
              paid: bool(),
              createdAt: str(),
              updatedAt: str(),
              eventId: id(),
              eventLinkId: id(),
            }),
          ),
        }),
      },
    },
  }, async (req, reply) => {
    const userId = Number(app.AuthService.getUserId(req.session));
    if (!userId) {
      return reply.code(403).send({
        error: 'User not authenticated',
      });
    }

    const eventId = Number(req.query.eventId);

    const event = await app.dbm.findOneOrFail(Event, {
      id: eventId,
    });

    if (!await app.AccessModule.canUserId(Event, userId, 'index', event)) {
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({error: 'Access denied'})
    }

    const conditions: FindConditions<EventRegistration> = {
      event,
    }

    const confirmed = req.query.confirmed ? Boolean(req.query.confirmed) : null;
    if (confirmed !== null) {
      conditions.confirmed = confirmed;
    }

    const paid = req.query.paid ? Boolean(req.query.paid === 'true') : null;
    if (paid !== null) {
      conditions.paid = paid;
    }

    const eventRegistrations = await app.dbm.find(EventRegistration, {
      where: conditions,
      order: {id: 'DESC'},
    });

    reply.send({
      eventRegistrations,
    });
  });

  next()
}
