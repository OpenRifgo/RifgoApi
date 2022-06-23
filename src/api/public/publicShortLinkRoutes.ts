import App from '../../App';
import {obj, str} from 'json-schema-blocks';
import {ShortLink, ShortLinkTypes} from '../../entity/ShortLink'
import {ConsultantReferralLinkRepo} from '../../repos/ConsultantReferralLinkRepo'
import {ConsultantReferralLink} from '../../entity/ConsultantReferralLink'


const app = App.getInstance();

export default function (router, opts, next) {

  router.get('/:shortLinkUid', {
    schema: {
      params: {
        shortLinkUid: str(),
      },
      response: {
        200: obj({
          shortLink: obj({
            uid: str(),
            shortLinkType: str(),
            consultantReferralLink: obj({
              uid: str(),
              consultant: obj({
                slug: str()
              })
            })
          }, { required: ['uid', 'shortLinkType'] }),
        }),
      },
    },
  }, async (req, resp) => {
    const uid = req.params.shortLinkUid;

    const shortLink = await app.dbm.findOneOrFail(ShortLink, {
      uid,
    });

    let result = {shortLink};

    if (shortLink.shortLinkType === ShortLinkTypes.ConsultantReferralLink) {
      const consultantReferralLink = await app.dbm.findOne(ConsultantReferralLink, {
        where: { uid },
        relations: ['consultant'],
      });
      result.shortLink['consultantReferralLink'] = consultantReferralLink;
    }

    resp.send(result);
  });

  next();
}
