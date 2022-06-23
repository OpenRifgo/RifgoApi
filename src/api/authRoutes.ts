import assert = require('assert')
import {User, UserStatuses} from '../entity/User'
import App from '../App'
import {nanoid} from 'nanoid'
import bcrypt = require('bcrypt')
import UserRepo from '../repos/UserRepo'
import {timeout} from '../lib/timeout'
import {StatusCodes} from '../lib/StatusCodes'
import EmailModule from '../modules/emailModule/EmailModule'
import {bool, enumStr, id, nullable, obj, str} from 'json-schema-blocks'

const saltRounds = 10;

const app = App.getInstance()

export default function (router, opts, next) {

  router.post('/me', {
    schema: {
      description: 'Current user info',
      response: {
        200: obj({
          loggedIn: bool(),
          user: nullable(obj({
            id: id(),
            name: str(),
            email: str(),
            status: enumStr(...Object.keys(UserStatuses)),
            hasTermsAgree: bool(),
          })),
        }),
      },
    },
  }, async (req, resp) => {
    const user = await app.AuthService.getUser(req.session)
    if (!user) {
      return resp.send({
        loggedIn: false,
        user: null,
      })
    }

    resp.send({
      loggedIn: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        hasTermsAgree: user.hasTermsAgree,
      },
    })
  });

  router.post('/login', {
    schema: {
      description: 'Login',
      body: obj({
        email: str(1),
        password: str(1),
      }),
      response: {
        200: obj({
          ok: {const: true},
        }),
      },
    },
  }, async (req, reply) => {
    const data: { email: string, password: string } = req.body
    assert(data.email, 'email is required')
    assert(data.password, 'password is required')
    const email = data.email.toLowerCase()

    const user = await app.dbm.findOne(User, {email})
    if (!user) {
      await timeout(500) // to prevent bruteforce
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({error: 'Wrong email or password'})
    }

    if (!await bcrypt.compare(data.password, user.password)) {
      await timeout(500) // to prevent bruteforce
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({error: 'Wrong email or password'})
    }

    if (user.status !== UserStatuses.Active && user.status !== UserStatuses.Streamer && user.status !== UserStatuses.PlatformAdmin) {
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({error: 'User is not activated. Rifgo is in closed beta.'})
    }

    app.AuthService.logIn(user.id, req.session)

    reply.send({ok: true})
  });

  router.post('/signup', {
    schema: {
      description: 'Sign up',
      body: obj({
        email: str(1),
        password: str(1),
        name: str(),
        access: bool(),
        login: bool(),
      }, {
        optional: ['login', 'name'],
      }),
      response: {
        200: obj({
          ok: {const: true},
        }),
      },
    },
  }, async (req, reply) => {
    // automatic login flag - user will be logged in
    const doLogin = req.body.login;

    // don't delete session if
    if (!doLogin) {
      app.AuthService.logOut(req.session)
    }

    const data: { email: string, password: string, access: boolean, login?: boolean, name?: string } = req.body
    assert(data.email, 'email is required')
    assert(data.password, 'email is required')
    const email = data.email.toLowerCase()

    if (await app.repos.UserRepo.emailTaken(email)) {
      await timeout(500) // to prevent bruteforce
      reply
        .code(StatusCodes.CONFLICT)
        .send({error: 'Email already taken'})
      return
    }

    const hash = await bcrypt.hash(data.password, saltRounds)
    const confirmSecret = nanoid(32)

    const user = app.dbm.create(User, {
      email,
      password: hash,
      name: data.name || '',
      confirmSecret,
      status: data.access ? UserStatuses.Active : UserStatuses.New,
    })
    // auto-active
    user.status = UserStatuses.Active;
    await app.dbm.save(user);

    if (doLogin) {
      app.AuthService.logIn(user.id, req.session);
    }

    reply.send({ok: true})
  });

  router.post('/forgotPassword', {
    schema: {
      description: 'Password recovery: request secret code',
      body: obj({
        email: str(),
      }),
      response: {
        200: obj({
          ok: {const: true},
        }),
      },
    },
  }, async (req, reply) => {
    const email = req.body.email;
    const passwordChangeSecret = nanoid(32);

    //todo: handle user not found
    const user = await app.dbm.findOneOrFail(User, {email});
    user.passwordChangeSecret = passwordChangeSecret;
    //todo: timelimit
    await app.dbm.save(user);

    await new EmailModule(app).sendPasswordRecoveryEmail(user);

    reply.send({ok: true})
  });

  router.post('/changePassword', {
    schema: {
      description: 'Password recovery: submit',
      body: obj({
        secret: str(20),
        password: str(),
      }),
      response: {
        200: obj({
          ok: {const: true},
        }),
      },
    },
  }, async (req, reply) => {
    const passwordChangeSecret = req.body.secret;
    assert(passwordChangeSecret, `passwordChangeSecret can't be empty`);
    const newPassword = req.body.password;

    //todo: handle user not found
    const user = await app.dbm.findOneOrFail(User, {passwordChangeSecret});

    const hash = await bcrypt.hash(newPassword, saltRounds)
    user.password = hash;
    user.passwordChangeSecret = null;

    //todo: check timelimit
    await app.dbm.save(user);

    reply.send({ok: true});
  });


  router.post('/logout', {
    schema: {
      description: 'Log out',
      response: {
        200: obj({
          ok: {const: true},
        }),
      },
    },
  }, async (req, reply) => {
    app.AuthService.logOut(req.session);

    reply.send({ok: true})
  });


  next()
}
