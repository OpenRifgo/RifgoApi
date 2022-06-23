import App from '../../App'
import {StatusCodes} from '../../lib/StatusCodes'
import {WebhookLog} from '../../entity/WebhookLog'

const app = App.getInstance();

export default function (router, opts, next) {

    router.get('/', (req, resp) => {
        const challenge = req.headers['hub_challenge'];
        const verifyToken = req.headers['hub_verify_token'];

        if (verifyToken === app.env.facebookVerifyToken) {
            resp.send(challenge)
        } else {
            resp.code(StatusCodes.FORBIDDEN).send('FORBIDDEN');
        }
    });

    router.post('/', async (req, resp) => {
        const accessToken = req.query.access_token; //app.env.facebookVerifyToken;

        const webhookLog = app.dbm.create(WebhookLog, {
            provider: 'fb',
            query: req.query,
            body: req.body,
        });

        const forbidden = accessToken === app.env.facebookVerifyToken;

        if (forbidden) {
            resp.code(StatusCodes.FORBIDDEN);
        }

        const result = forbidden ? {ok: false} : {ok: true};
        webhookLog.result = result;
        await app.dbm.save(webhookLog);

        resp.send(result)
    });

    next()
}
