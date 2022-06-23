import App from '../App'
import {timezonesList} from '../modules/timezonesModule/timezonesList'

// const app = App.getInstance()

export default function (router, opts, next) {

    router.get('/timezones', async (req, resp) => {
        resp.send({
            timezones: timezonesList
        });
    });

    next();
}
