import App from '../../App'
import axios from 'axios'

type TCreateAuthTokenData = ({ grant_type: 'authorization_code', code: string }
  | { grant_type: 'refresh_token', refresh_token: string })
  & { redirect_uri?: string };

export class CalendlyApi {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

  userSession(session: ICalendlyApiSessionSession) {
    return new CalendlyApiSession(this.app, session);
  }

  async createAuthToken(data: TCreateAuthTokenData) {
    const response = await axios.post<{
      access_token: string,
      token_type: "Bearer",
      expires_in: number //7200,
      refresh_token: string,
      scope: "default",
      created_at: number // 1644340752,
      organization: string // "https://api.calendly.com/organizations/bbafaf44-b815-4ac8-97d1-5b32972dbcba",
      owner: string // "https://api.calendly.com/users/381e08b4-eeee-461b-81e4-700d94563501"
    }>(
      'https://auth.calendly.com/oauth/token',
      {
        ...data,
        client_id: this.app.env.calendlyClientId,
        client_secret: this.app.env.calendlySecret,
        redirect_uri: data.redirect_uri || this.app.env.calendlyRedirectURI,
      },
    );

    return response.data;
  }
}

export interface ICalendlyApiSessionSession {
  accessToken: string,
}

export class CalendlyApiSession {
  protected app: App;
  protected session: ICalendlyApiSessionSession;

  constructor(app: App, session: ICalendlyApiSessionSession) {
    this.app = app;
    this.session = session;
  }

  async getMe() {
    const response = await axios.get<{
      resource: {
        avatar_url: string | null,
        created_at: string // "2022-01-31T16:26:43.312945Z",
        current_organization: string // "https://api.calendly.com/organizations/bbafaf44-b815-4ac8-97d1-5b32972dbcba",
        email: string,
        name: string,
        scheduling_url: string // "https://calendly.com/roman-rifgo",
        slug: string // "roman-rifgo",
        timezone: string // "Europe/Moscow",
        updated_at: string //"2022-02-02T09:54:57.645399Z",
        uri: string //"https://api.calendly.com/users/381e08b4-eeee-461b-81e4-700d94563501"
      }
    }>(
      'https://api.calendly.com/users/me',
      {
        headers: {
          Authorization: `Bearer ${this.session.accessToken}`,
        },
      },
    );

    return response.data;
  }

  async getEventTypes(data: { user: string }) {
    const response = await axios.get<{
      collection: Array<{
        active: boolean,
        color: string // "#8247f5",
        created_at: string // "2022-01-31T16:27:59.862116Z",
        custom_questions: Array<{
          answer_choices: Array<any>,
          enabled: boolean,
          include_other: boolean,
          name: string // Please share anything that will help prepare for our meeting.,
          position: number,
          required: boolean,
          type: string
        }>,
        description_html: string //<p>RIFGO demo</p>,
        description_plain: string // RIFGO demo,
        duration: number,
        internal_note: boolean,
        kind: string //solo,
        name: string //15 Minute Demo,
        pooling_type: null,
        profile: {
          name: string,
          owner: string // https://api.calendly.com/users/381e08b4-eeee-461b-81e4-700d94563501,
          type: 'User'
        },
        scheduling_url: string // https://calendly.com/roman-rifgo/15min,
        secret: boolean,
        slug: string // 15min,
        type: 'StandardEventType',
        updated_at: string //2022-01-31T16:34:03.111254Z,
        uri: string // https://api.calendly.com/event_types/00c706f8-9655-4e06-8acd-0f65a082ac1a
      }>,
      pagination: {
        count: number,
        next_page: null | string
      }
    }>(
      `https://api.calendly.com/event_types?user=${data.user}`,
      {
        headers: {
          Authorization: `Bearer ${this.session.accessToken}`,
        },
      },
    );

    return response.data;
  }

  async createSchedulingLink(data: { owner: string }) {
    const response = await axios.post<{
      resource: {
        booking_url: string // https://calendly.com/d/abcd-brv8/15-minute-meeting,
        owner: string // https://api.calendly.com/event_types/GBGBDCAADAEDCRZ2,
        owner_type: 'EventType'
      }
    }>(
      `https://api.calendly.com/scheduling_links`,
      {
        max_event_count: 1,
        owner: data.owner,
        owner_type: 'EventType',
      },
      {
        headers: {
          Authorization: `Bearer ${this.session.accessToken}`,
        },
      },
    );

    return response.data;
  }
}
