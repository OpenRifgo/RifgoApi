import {User} from '../../entity/User'
import App from '../../App'

export class CalendlyService {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

  async createCalendarLink(user: User, eventType: {uri: string}) {
    const createAuthTokenResponse = await this.app.CalendlyApi.createAuthToken({
      grant_type: 'refresh_token',
      refresh_token: user.calendlyRefreshToken
    });

    user.calendlyAccessToken = createAuthTokenResponse.access_token;
    user.calendlyRefreshToken = createAuthTokenResponse.refresh_token;
    await this.app.dbm.save(user);

    const calendlySession = this.app.CalendlyApi.userSession({accessToken: createAuthTokenResponse.access_token});

    const createSchedulingLinkResponse = await calendlySession.createSchedulingLink({owner: eventType.uri});

    return createSchedulingLinkResponse.resource;
  }

  /**
 [
   {
    "active": true,
    "color": "#8247f5",
    "created_at": "2022-01-31T16:27:59.862116Z",
    "custom_questions": [
      {
        "answer_choices": [],
        "enabled": true,
        "include_other": false,
        "name": "Please share anything that will help prepare for our meeting.",
        "position": 0,
        "required": false,
        "type": "text"
      }
    ],
    "description_html": "<p>RIFGO demo</p>",
    "description_plain": "RIFGO demo",
    "duration": 15,
    "internal_note": null,
    "kind": "solo",
    "name": "15 Minute Demo",
    "pooling_type": null,
    "profile": {
      "name": "Roman Exemplarov",
      "owner": "https://api.calendly.com/users/381e08b4-eeee-461b-81e4-700d94563501",
      "type": "User"
    },
    "scheduling_url": "https://calendly.com/roman-rifgo/15min",
    "secret": false,
    "slug": "15min",
    "type": "StandardEventType",
    "updated_at": "2022-01-31T16:34:03.111254Z",
    "uri": "https://api.calendly.com/event_types/00c706f8-9655-4e06-8acd-0f65a082ac1a"
  }
   ]

   * @param user
   * @param filters.active - filters by value (true or false) if set
   */
  async getEventTypes(user: User, filters: {active?: boolean} = {}) {
    const createAuthTokenResponse = await this.app.CalendlyApi.createAuthToken({
      grant_type: 'refresh_token',
      refresh_token: user.calendlyRefreshToken
    });

    user.calendlyAccessToken = createAuthTokenResponse.access_token;
    user.calendlyRefreshToken = createAuthTokenResponse.refresh_token;
    await this.app.dbm.save(user);

    const calendlySession = this.app.CalendlyApi.userSession({accessToken: createAuthTokenResponse.access_token});
    const getMeResponse = await calendlySession.getMe();
    const getEventTypesResponse = await calendlySession.getEventTypes({user: getMeResponse.resource.uri});

    return getEventTypesResponse.collection
      .filter((v) => filters.active === undefined ? true : v.active == filters.active);
  }
}
