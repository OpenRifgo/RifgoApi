import videoRoutes from './api/videoRoutes'
import App from './App'
import authRoutes from './api/authRoutes'
import creatorRoutes from './api/creatorRoutes'
import {handleWebsocket} from './api/websocket'
import chatRoutes from './api/chatRoutes'
import publicRoutes from './api/publicRoutes'
import stripeRoutes from './api/stripeRoutes'
import directoriesRoutes from './api/directoriesRoutes'
import registeredRoutes from './api/registeredRoutes'
import adminRoutes from './api/adminRoutes'
import publicStreamersRoutes from './api/public/publicStreamersRoutes'
import moderatorChatRoutes from './api/moderator/moderatorChatRoutes'
import webhookRoutes from './api/webhookRoutes'
import outRoutes from './api/outRoutes'
import creatorCalendlyRoutes, {creatorCalendlyOauthRoute} from './api/creator/creatorCalendlyRoutes'
import bookingRoutes from './api/bookingRoutes'
import consultantRoutes from './api/consultantRoutes'


export default function (app: App) {
    const env = app.env;

    // Require the framework and instantiate it
    const router = require('fastify')({
        trustProxy: 1,
        logger: {
            prettyPrint: true,
            serializers: {
                req: function (req) {
                    return {
                        method: req.method,
                        url: req.url,
                        // headers: req.headers,
                        params: req.params,
                        body: req.body,
                        hostname: req.hostname,
                        query: req.query,
                    }
                },
            },
        },
    });

    router.register(require('fastify-cors'), {
        origin: (origin, cb) => {
            cb(null, true)
            return

            // if (!origin || /localhost/.test(origin)) {
            //     //  Request from localhost will pass
            //     cb(null, true)
            //     return
            // }
            // // Generate an error on other origins, disabling access
            // cb(new Error("Not allowed"))
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', '*'],
    });

    if (env.nodeEnv === 'development' ) {
        router.register(require('fastify-secure-session'), {
            cookieName: env.sessionCookieName,
            key: env.appSecret,
            cookie: { // options for setCookie, https://github.com/fastify/fastify-cookie
                path: '/',
                httpOnly: true,
                // maxAge: env.sessionCookieTTL, // 14 days
            },
        });
    } else {
        let cookie = { // options for setCookie, https://github.com/fastify/fastify-cookie
          path: '/',
          httpOnly: true,
          // maxAge: env.sessionCookieTTL, // 14 days
        } as any;
        // if (env.nodeEnv === 'development' ) {
        //   cookie.sameSite = 'none';
        // }
        if (env.sessionCookieSecure) {
          cookie.secure = true;
        }

        router.register(require('fastify-secure-session'), {
            cookieName: env.sessionCookieName,
            key: env.appSecret,
            cookie,
        });

    }

    // const socketController = new SocketController(c)
    router.register(require('fastify-websocket'), {
        // handle: handleWebsocket,
        options: {
            maxPayload: 1048576, // we set the maximum allowed messages size to 1 MiB (1024 bytes * 1024 bytes)
            path: '/socket', // we accept only connections matching this path e.g.: ws://localhost:3000/fastify
            // verifyClient: function (info, next) {
            //     return next(websocketVerifyClient(router as FastifyInstance, info))
            // },
        },
    });

    router.register(require('fastify-multipart'));
    router.register(require('fastify-formbody'));

    router.get('/socket', {websocket: true}, (conn, req) => handleWebsocket(router, conn, req))

    router.setErrorHandler(function (error, request, reply) {
        console.error(error);

        reply
            .code(error.statusCode || 500)
            .send({
                error: error.message || 'Error occurred',
                meta: error,
            });
    });

    router.register(function (router, opts, next) {
        router.register(authRoutes, {prefix: '/auth'})
        router.register(adminRoutes, {prefix: '/admin'})
        router.register(chatRoutes, {prefix: '/chat'})
        router.register(creatorRoutes, {prefix: '/creator'})
        router.register(consultantRoutes, {prefix: '/consultant'})
        router.register(bookingRoutes, {prefix: '/booking'})
        router.register(directoriesRoutes, {prefix: '/directories'})
        router.register(publicRoutes, {prefix: '/public'})
        router.register(publicStreamersRoutes, {prefix: '/public/streamers'})
        router.register(registeredRoutes, {prefix: '/registered'})
        router.register(videoRoutes, {prefix: '/video'})
        router.register(stripeRoutes, {prefix: '/stripe'})
        router.register(creatorCalendlyRoutes, {prefix: '/creator/calendly'})
        router.register(creatorCalendlyOauthRoute, {prefix: '/calendly-oauth'})
        router.register(moderatorChatRoutes, {prefix: '/moderator/chat'})
        router.register(webhookRoutes, {prefix: '/webhook'})

        next()
    }, {prefix: '/api'});

    router.register(outRoutes, {prefix: '/out'})

    // Run the server
    router.listen(env.port, env.host, function (err, address) {
        if (err) {
            router.log.error(err);

            app.logger.fatal(err.message, {data: {err, address}});

            process.exit(1);
        }
        router.log.info(`server listening on ${address}`)
    })
}
