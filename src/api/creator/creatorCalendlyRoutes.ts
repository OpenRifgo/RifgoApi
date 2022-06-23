import App from '../../App';
import {ExtError} from '../../lib/ExtError';
import {StatusCodes} from '../../lib/StatusCodes';
import {bool, obj, str} from 'json-schema-blocks';


const app = App.getInstance();

function calendlyRedirectURL(opts: { onboarding?: boolean }) {
  if (opts?.onboarding) return `${app.env.calendlyRedirectURI}?${opts.onboarding ? 'onboarding=true' : ''}`;
  return app.env.calendlyRedirectURI;
}

export const creatorCalendlyOauthRoute = (fastify, opts, next) => {

  fastify.get('', {
    schema: {
      query: obj({
        code: str(1),
        onboarding: bool(),
      }, {
        optional: ['onboarding'],
      }),
    },
  }, async (req, reply) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    const code = req.query.code;
    const onboarding = Boolean(req.query.onboarding);

    console.log(req.query)
    // const params = new URLSearchParams()
    // params.append('grant_type', 'authorization_code')
    // params.append('client_id', app.env.calendlyClientId)
    // params.append('client_secret', app.env.calendlySecret)
    // params.append('code', code)
    // params.append('redirect_uri', app.env.calendlyRedirectURI);

    const response = await app.CalendlyApi.createAuthToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: calendlyRedirectURL({onboarding}),
    })

    // const response = await axios.post<{
    //   access_token: string,
    //   token_type: "Bearer",
    //   expires_in: number //7200,
    //   refresh_token: string,
    //   scope: "default",
    //   created_at: number // 1644340752,
    //   organization: string // "https://api.calendly.com/organizations/bbafaf44-b815-4ac8-97d1-5b32972dbcba",
    //   owner: string // "https://api.calendly.com/users/381e08b4-eeee-461b-81e4-700d94563501"
    // }>(
    //   'https://auth.calendly.com/oauth/token',
    //   {
    //     grant_type: 'authorization_code',
    //     client_id: app.env.calendlyClientId,
    //     client_secret: app.env.calendlySecret,
    //     code,
    //     redirect_uri: app.env.calendlyRedirectURI,
    //   },
    //   {
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded'
    //     }
    //   }
    // );

    console.log(response)

    user.calendlyAccessToken = response.access_token;
    user.calendlyRefreshToken = response.refresh_token;
    await app.dbm.save(user);

    const redirectUrl = onboarding
      ? `${app.env.frontendRoot}/#/dashboard/onboarding/calendly`
      : `${app.env.frontendRoot}/#/dashboard/consultant/calendly`;

    reply.redirect(StatusCodes.TEMPORARY_REDIRECT, redirectUrl);
  });

  next();

}

export default function (fastify, opts, next) {

  fastify.get('/status', {
    schema: {
      query: obj({
        onboarding: bool(),
      }, {
        optional: ['onboarding'],
      }),
    },
  }, async (req, reply) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    reply.send({
      calendly: {
        clientId: app.env.calendlyClientId,
        redirectUrl: calendlyRedirectURL({onboarding: req.query.onboarding}),
        codeRetrieved: !!user.calendlyAccessToken,
      },
    })
  });

  // dev route
  fastify.post('/schedulingLinks', async (req, reply) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    try {
      const eventTypes = await app.CalendlyService.getEventTypes(user, {active: true});
      const schedulingLink = await app.CalendlyService.createCalendarLink(user, eventTypes[0]);

      reply.send(schedulingLink);
    } catch (e) {
      app.logger.error(e.message, {
        event: 'POST schedulingLinks',
        data: {response: e.response?.data, req: {path: req.path, method: req.method}},
      });

      reply.send({
        error: e.message,
        code: e.response?.statusCode,
        data: e.response?.data,
      });
    }

  });

  // dev route
  fastify.post('/eventTypes', async (req, reply) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    try {
      const eventTypes = await app.CalendlyService.getEventTypes(user, {active: true});

      reply.send(eventTypes);
    } catch (e) {
      app.logger.error(e.message, {
        event: 'POST eventTypes',
        data: {response: e.response?.data, req: {path: req.path, method: req.method}},
      });

      reply.send({
        error: e.message,
        code: e.response?.statusCode,
        data: e.response?.data,
      });
    }

  });

  next();

}
