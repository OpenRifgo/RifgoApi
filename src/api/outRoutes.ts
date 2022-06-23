import App from '../App'
import {OutClick} from '../entity/OutClick'
import {TRouter} from '../interfaces/appTypes'
import {StatusCodes} from '../lib/StatusCodes'

const app = App.getInstance();

export default function (router: TRouter, opts, next) {

    router.get('/', {
        schema: {
            // description: 'Out redirect',
        },
    }, async (req, resp) => {
        const url = req.query['url'];
        const source = req.query['source'];
        const sourceId = req.query['sourceId'];

        resp.redirect(StatusCodes.TEMPORARY_REDIRECT, url);

        const outClick = app.dbm.create(OutClick, {
            url,
            source,
            sourceId,
        })
        await app.dbm.save(outClick);
    });

    next();
}
