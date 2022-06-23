import App from '../App'
import facebookRoutes from './webhooks/facebookRoutes'

const app = App.getInstance()

export default function (router, opts, next) {

    router.register(facebookRoutes, {prefix: '/facebook'});

    router.post('/register', async (req, resp) => {
        const { email } = req.body as {
            email: string,
            tranid: string,
            formid: string,
        };
        const { eventLinkId } = req.query as {
            eventLinkId: string
        }

        // webhook check
        if (!email) {
            resp.send({
                ok: false
            });

            return;
        }

        await app.EventRegistrationService.register(eventLinkId, email);

        resp.send({
            ok: true
        });
    });

    next()
}
