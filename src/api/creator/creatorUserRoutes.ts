import App from '../../App';
import {bool, enumStr, id, obj, str} from 'json-schema-blocks';


const app = App.getInstance();

export default function (router, opts, next) {
  router.put('/', {
      schema: {
        body: obj({hasTermsAgree: bool()}),
        response: {
          200:
            obj({
              user: obj({
                id: id(),
                name: str(),
                email: str(),
                status: enumStr('New', 'Active', 'PlatformAdmin'),
                hasTermsAgree: bool(),
              }),
            }, {required: ['user']}),
        },
      },
    },
    async (req, resp) => {
      const user = await app.AuthService.getUser(req.session)
      if (!user.id) {
        return resp.code(403).send({
          error: 'User not authenticated',
        })
      }

      const hasTermsAgree = req.body.hasTermsAgree


      user.hasTermsAgree = hasTermsAgree
      await app.dbm.save(user)

      resp.send({
        user,
      })
    });

  next()
}
