import App from '../../App'
import {Event} from '../../entity/Event'
import {VonageService} from '../../services/vonage/VonageService'
import {EventLinkService} from '../../services/EventLinkService'
import {EventSession} from '../../entity/EventSession'
import {EventBroadcast} from '../../entity/EventBroadcast'
import {enumStr, id, nullable, num, obj, str} from 'json-schema-blocks'
import {StatusCodes} from '../../lib/StatusCodes'
import moment from 'moment-timezone';
import {timezonesList} from '../../modules/timezonesModule/timezonesList'

const app = App.getInstance();

interface ICreatorEvent {
  name: string
  description: string
  speakerName: string
  speakerTitle: string
  speakerAvatarUrl: string
  date: string
  dateTimeTo: Date
  dateTimeFrom: Date
  timeTo: string
  timeFrom: string
  accessType: 'paid' | 'free'
  timezone: string,
  amount: null | number
}

interface ICreatorEventWithId extends ICreatorEvent {
  id: number
}

const bodyProperties = {
  name: str(),
  description: str(),
  speakerName: str(),
  speakerTitle: str(),
  speakerAvatarUrl: str(),
  date: str(),
  timeFrom: str(),
  timeTo: str(),
  accessType: enumStr('paid', 'free'),
  timezone: str(),
  amount: nullable(num()),
}

const getDateTime = (date, time, timezone) => {
  const dateTime = moment.tz(`${date} ${time}`, timezone);
  return dateTime.utc().toDate()
}

export default function (router, opts, next) {

  router.post('/', {
      schema: {
        body: obj(bodyProperties, {optional: ['amount']}),
      },
    },
    async (req, resp) => {
      const userId = app.AuthService.getUserId(req.session)
      if (!userId) {
        return resp.code(403).send({
          error: 'User not authenticated',
        })
      }

      const data = req.body as ICreatorEvent
      switch (req.body.accessType) {
        case 'paid':
          data.amount = req.body.amount;
          break;
        case 'free':
        default:
          data.amount = 0
      }
      data.dateTimeFrom = getDateTime(data.date, data.timeFrom, data.timezone)

      data.dateTimeTo = getDateTime(data.date, data.timeTo, data.timezone)

      const event = app.dbm.create(Event, {
        ...data,
        user: {
          id: userId,
        },
      })
      await app.dbm.save(event)

      await new EventLinkService(app).createEventLink(event.id)

      resp.send({
        event,
      })
    });

  router.put('/', {
      schema: {
        body: obj(
          {id: id(), ...bodyProperties},
          {required: ['id']},
        ),
      },
    },
    async (req, resp) => {
      const userId = app.AuthService.getUserId(req.session)
      if (!userId) {
        return resp.code(403).send({
          error: 'User not authenticated',
        })
      }

      const data = req.body as ICreatorEventWithId
      switch (req.body.accessType) {
        case 'paid':
          data.amount = req.body.amount;
          break;
        case 'free':
        default:
          data.amount = 0
      }

      const event = await app.dbm.findOneOrFail(
        Event, {where: {id: data.id}},
      )
      /*todo do update of paid/free access type */

      const dateTimeFrom = getDateTime(data.date, data.timeFrom, data.timezone)
      const dateTimeTo = getDateTime(data.date, data.timeTo, data.timezone)

      if (data.name) event.name = data.name
      if (data.description) event.description = data.description
      if (data.speakerName) event.speakerName = data.speakerName
      if (data.speakerTitle) event.speakerTitle = data.speakerTitle
      if (data.speakerAvatarUrl) event.speakerAvatarUrl = data.speakerAvatarUrl
      if (data.date) event.date = data.date
      if (data.timeFrom) {
        event.timeFrom = data.timeFrom
        event.dateTimeFrom = dateTimeFrom
      }
      if (data.timeTo) {
        event.timeTo = data.timeTo
        event.dateTimeTo = dateTimeTo
      }
      if (data.accessType) event.accessType = data.accessType
      if (data.timezone) event.timezone = data.timezone
      if (data.amount && data.accessType !== 'free') event.amount = data.amount
      else event.amount = 0

      await app.dbm.save(event)

      resp.send({
        event,
      })
    });

  router.patch('/:eventId', {
      schema: {
        // body: obj(
        //     {id: id(), ...bodyProperties},
        //     {required: ['id']}
        // ),
      },
    },
    async (req, resp) => {
      const userId = app.AuthService.getUserId(req.session)
      if (!userId) {
        return resp.code(403).send({
          error: 'User not authenticated',
        })
      }

      const eventId = Number(req.params.eventId)

      const event = await app.dbm.findOneOrFail(Event, {
        id: eventId,
        user: {
          id: userId,
        },
      });

      event.isFinallyStoped = true

      await app.dbm.save(event)

      resp.send({
        event,
      })
    });

  router.get('/', async (req, resp) => {
    const userId = Number(app.AuthService.getUserId(req.session));
    if (!userId) {
      return resp.code(403).send({
        error: 'User not authenticated',
      });
    }

    const events = await app.dbm.find(Event, {
      where: {user: {id: userId}},
      order: {id: 'DESC'},
      relations: ['eventLinks'],
    });

    resp.send({
      events: events.map((event) => {
        return {
          ...event,
          publicEventLink: {
            uid: event.eventLinks[0]?.uid,
          },
        }
      }),
    });
  });

  router.get('/:eventId', async (req, resp) => {
    const userId = app.AuthService.getUserId(req.session)
    if (!userId) {
      return resp.code(403).send({
        error: 'User not authenticated',
      });
    }

    const eventId = Number(req.params.eventId)

    const event = await app.dbm.findOneOrFail(Event, {
      id: eventId,
      user: {
        id: userId,
      },
    });

    const eventLinks = (await new EventLinkService(app)
      .getEventLinks(event.id))
      .map(el => ({uid: el.uid}))

    resp.send({
      event: {
        ...event,
        eventLinks,
        amounts: {
          tickets: await app.creatorPaymentStatsService.eventTicketsTotalAmount(event),
          donated: await app.creatorPaymentStatsService.eventDonationsTotalAmount(event),
        },
      },
    });
  });

  router.post('/:eventId/start-session', async (req, resp) => {
    const userId = app.AuthService.getUserId(req.session)
    if (!userId) {
      return resp.code(403).send({
        error: 'User not authenticated',
      });
    }

    const eventId = Number(req.params.eventId)

    const event = await app.dbm.findOneOrFail(Event, {
      id: eventId,
      user: {
        id: userId,
      },
    });

    if (!event.streamingSessionId) {
      const vonageService = new VonageService();
      const result = await vonageService.createSession();
      const sessionId = result.sessionId;
      const token = result.token;

      event.streamingSessionId = sessionId;
      event.streamingToken = token;
      event.streamingBroadcastId = null;
      await app.dbm.save(event);

      // save session
      const eventSession = app.dbm.create(EventSession, {
        event,
        streamingSessionId: result.sessionId,
        streamingToken: result.token,
        createdAt: new Date(),
      });
      await app.dbm.save(eventSession);
    }

    resp.send({
      event: {
        ...event,
        amounts: {
          tickets: await app.creatorPaymentStatsService.eventTicketsTotalAmount(event),
          donated: await app.creatorPaymentStatsService.eventDonationsTotalAmount(event),
        },
      },
    });
  });

  router.post('/:eventId/start-broadcast', async (req, resp) => {
    const userId = app.AuthService.getUserId(req.session)
    if (!userId) {
      return resp.code(403).send({
        error: 'User not authenticated',
      });
    }

    const eventId = Number(req.params.eventId)

    const event = await app.dbm.findOneOrFail(Event, {
      id: eventId,
      user: {
        id: userId,
      },
    });

    if (event.streamingSessionId) {
      const vonageService = new VonageService();

      const broadcastResult = await vonageService.startBroadcast(event.streamingSessionId);
      const archiveResult = await vonageService.startArchive(event.streamingSessionId);

      console.log('broadcast: ', broadcastResult);
      console.log('archive: ', archiveResult);

      event.streamingBroadcastId = broadcastResult.id;
      event.streamingBroadcastLink = broadcastResult.url;
      event.streamingArchiveId = archiveResult.id;

      await app.dbm.save(event);

      const eventBroadcast = app.dbm.create(EventBroadcast, {
        event,
        streamingSessionId: event.streamingSessionId,
        streamingToken: event.streamingToken,
        streamingBroadcastId: event.streamingBroadcastId,
        streamingBroadcastLink: event.streamingBroadcastLink,
        streamingArchiveId: event.streamingArchiveId,
        createdAt: new Date(),
      });
      await app.dbm.save(eventBroadcast);
    }

    resp.send({
      event: {
        ...event,
        amounts: {
          tickets: await app.creatorPaymentStatsService.eventTicketsTotalAmount(event),
          donated: await app.creatorPaymentStatsService.eventDonationsTotalAmount(event),
        },
      },
    });
  });

  router.post('/:eventId/stop-broadcast', async (req, resp) => {
    const userId = app.AuthService.getUserId(req.session)
    if (!userId) {
      return resp.code(403).send({
        error: 'User not authenticated',
      });
    }

    const eventId = Number(req.params.eventId)
    const isFinallyStoped = req.body.isFinallyStoped

    const event = await app.dbm.findOneOrFail(Event, {
      id: eventId,
      user: {
        id: userId,
      },
    });

    event.isFinallyStoped = isFinallyStoped

    const vonageService = new VonageService();

    let eventModified = false;

    if (event.streamingBroadcastId) {
      try {
        const broadcastResult = await vonageService.stopBroadcast(event.streamingBroadcastId);

        const eventBroadcast = await app.dbm.findOne(EventBroadcast, {
          event,
          streamingSessionId: event.streamingSessionId,
          streamingBroadcastId: event.streamingBroadcastId,
        });
        if (eventBroadcast) {
          eventBroadcast.finishedAt = new Date();
          await app.dbm.save(eventBroadcast);
        } else {
          app.logger.error(`EventBroadcast not found; session ID: ${event.streamingSessionId}; broadcast ID: ${event.streamingBroadcastId}`);
        }

        event.streamingBroadcastId = null;
        event.streamingBroadcastLink = null;

        eventModified = true;
      } catch (e) {
        app.logger.error(e);
      }
    }

    if (event.streamingArchiveId) {
      try {
        const archiveResult = await vonageService.stopArchive(event.streamingArchiveId);
      } catch (e) {
        app.logger.error(e);
      }
    }

    if (eventModified) {
      await app.dbm.save(event);
    }

    resp.send({
      event: {
        ...event,
        amounts: {
          tickets: await app.creatorPaymentStatsService.eventTicketsTotalAmount(event),
          donated: await app.creatorPaymentStatsService.eventDonationsTotalAmount(event),
        },
      },
    });
  });

  router.get('/:eventId/archive',
    {
      schema: {
        description: 'List recommended & next streams',
        params: obj({
          eventId: id(),
        }),
        // response: {
        //     200: obj({
        //         id: str(),
        //     }),
        // },
      },
    },
    async (req, reply) => {
      const userId = app.AuthService.getUserId(req.session);
      if (!userId) {
        return reply.code(403).send({
          error: 'User not authenticated',
        });
      }

      const eventId = Number(req.params.eventId);

      const event = await app.dbm.findOneOrFail(Event, {
        id: eventId,
      });

      if (!await app.AccessModule.canUserId(Event, userId, 'show', event)) {
        return reply
          .code(StatusCodes.FORBIDDEN)
          .send({error: 'Access denied'})
      }

      const vonageService = new VonageService();
      const archive = await vonageService.getArchive(event.streamingArchiveId);

      reply.send({
        archive,
      });
    },
  );

  // router.post('/me', (req, resp) => {
  //     const userId = app.AuthService.getUserId(req.session)
  //
  //     resp.send({
  //         loggedIn: !!userId,
  //         user: userId ? {
  //             id: userId
  //         } : null
  //     })
  // })
  //
  // router.post('/login', async (req, reply) => {
  //     const data: { email: string, password: string } = req.body
  //     assert(data.email, 'email is required')
  //     assert(data.password, 'password is required')
  //     const email = data.email.toLowerCase()
  //
  //     const user = await app.dbm.findOneOrFail(User, {email})
  //     if (!user) {
  //         await timeout(500) // to prevent bruteforce
  //         return reply
  //             .code(StatusCodes.FORBIDDEN)
  //             .send({error: 'User not found'})
  //     }
  //
  //     if (!await bcrypt.compare(data.password, user.password)) {
  //         await timeout(500) // to prevent bruteforce
  //         return reply
  //             .code(StatusCodes.FORBIDDEN)
  //             .send({error: 'Wrong password'})
  //     }
  //
  //     app.AuthService.logIn(user.id, req.session)
  //
  //     reply.send({ok: true})
  // });
  //
  // router.post('/signup', async (req, reply) => {
  //     app.AuthService.logOut(req.session)
  //
  //     const data: { email: string, password: string, name: string} = req.body
  //     assert(data.email, 'email is required')
  //     assert(data.password, 'email is required')
  //     assert(data.name, 'name is required')
  //     const email = data.email.toLowerCase()
  //
  //     if (await new UserRepo(app).emailTaken(email)) {
  //         await timeout(500) // to prevent bruteforce
  //         reply
  //             .code(StatusCodes.CONFLICT)
  //             .send({error: 'Email already taken'})
  //         return
  //     }
  //
  //     const hash = await bcrypt.hash(data.password, saltRounds)
  //     const confirmSecret = nanoid(32)
  //
  //     const user = app.dbm.create(User, {
  //         email,
  //         password: hash,
  //         name: data.name,
  //         confirmSecret,
  //     })
  //     await app.dbm.save(user)
  //
  //     reply.send({ok: true})
  // });

  next()
}
