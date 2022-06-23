import App from '../../App'
import {StatusCodes} from '../../lib/StatusCodes'
import assert from 'assert'
import {EventRegistration} from '../../entity/EventRegistration'
import {Between} from 'typeorm'
import {int, obj, str} from 'json-schema-blocks'

const app = App.getInstance();

export default function (router, opts, next) {

    router.get('/count-registrations', {
        schema: {
            description: 'Count registrations',
            query: obj({
                from: str(1),
                to: str(1)
            }),
            response: {
                200: obj({
                    data: {
                        registrationsCount: int(),
                    }
                })
            }
        },
    }, async (req, reply) => {
        const userId = app.AuthService.getUserId(req.session)
        if (!userId) {
            return reply.code(403).send({
                error: 'User not authenticated'
            })
        }

        if (!await app.AccessModule.canUserId(EventRegistration, userId, 'index', null)) {
            return reply
                .code(StatusCodes.FORBIDDEN)
                .send({error: 'Access denied'})
        }

        const from = req.query.from;
        const to = req.query.to;

        const registrationsCount = (await app.dbm.find(EventRegistration, {
            createdAt: Between(from, to),
        })).length;

        reply.send({
            data: {
                registrationsCount
            }
        });
    });


    next()
}
