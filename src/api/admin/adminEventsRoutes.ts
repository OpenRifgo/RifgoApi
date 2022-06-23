import App from '../../App'
import {ILike} from 'typeorm'
import {Event} from '../../entity/Event'

const app = App.getInstance();

export default function (router, opts, next) {

    router.get('/', {
        // schema: {
        //     description: 'Count registrations',
        //     query: obj({
        //         from: str(1),
        //         to: str(1)
        //     }),
        //     response: {
        //         200: obj({
        //             data: {
        //                 registrationsCount: int(),
        //             }
        //         })
        //     }
        // },
    }, async (req, reply) => {
        const userId = Number(app.AuthService.getUserId(req.session));
        if (!app.AccessModule.isPlatformAdmin(await app.AccessModule.getUserById(userId))) {
            return reply.code(403).send({
                error: 'User is not admin',
            });
        }

        const where: Record<string, any> = {};
        if (req.query.name) {
            where.name = ILike(req.query.name + '%')
        }

        const events = await app.dbm.find(Event, {
            where,
            take: Math.min(req.query.take || 100, 1000),
            skip: req.query.skip || 0,
            order: {id: 'DESC'}
        });

        reply.send({
            events
        });
    });


    next()
}
