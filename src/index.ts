import 'dotenv/config'
import router from './router'
import Env from './Env'
import {createConnection} from 'typeorm/index'
import App from './App'
import {emailDaemon} from './emailDaemon'
import {liveStatsDaemon} from './liveStatsDaemon'

const env = Env.getInstance();
const app = App.getInstance();

Promise.all([
    createConnection({
        type: "postgres",
        host: env.databaseHost,
        port: env.databasePort,
        username: env.databaseUser,
        password: env.databasePassword,
        database: env.databaseName,
        entities: [
            __dirname + "/entity/*.ts",
        ],
        synchronize: true,
    })
]).then(([conn]) => {
    app.db = conn;

    // if (app.env.daemonEnabled) {
        emailDaemon(app);
        liveStatsDaemon(app);
    // }

    router(app);
}).catch((e) => {
    console.error(e);
});
