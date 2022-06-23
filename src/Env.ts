/**
 * Env variables wrapper
 */
const path = require('path')

type TNodeEnv = "development" | "production" | "test"


export default class Env {
    private static instance: Env;

    // environment: "development" | "production" | "test"
    public nodeEnv: TNodeEnv;
    public srcPath: string;

    // http config
    public port: number;
    public host: string;

    // database (postgreSQL) config
    public databaseName: string;
    public databaseUser: string;
    public databasePassword: string;
    public databaseHost: string;
    public databasePort: number;

    public appSecret: string
    public sessionCookieName: string
    public sessionCookieTTL: number
    public sessionCookieSecure: Boolean

    public domain: string;
    public apiRoot: string;
    public shortRoot: string;
    public frontendRoot: string;

    public opentokApiKey: number;
    public opentokApiSecret: string;

    public stripeAccountID: string;
    public stripeConnectClientID: string;
    public stripeSecretKey: string;
    public stripePublicKey: string;

    public daemonEnabled: boolean;

    public facebookVerifyToken: string;

    public mailGunApiKey: string;

    public calendlyClientId: string;
    public calendlySecret: string;
    public calendlyRedirectURI: string;

    /**
     * Don't call directly
     */
    private constructor() {
        this.nodeEnv = (process.env.NODE_ENV || "development") as TNodeEnv;
        this.srcPath = __dirname;

        this.sessionCookieSecure = (process.env.SESSION_COOKIE_SECURE === 'true') as Boolean;
        this.port = Number(process.env.PORT || 7000);
        this.host = String(process.env.HOST || "localhost");
        this.databaseName = String(process.env.DATABASE_NAME || "rifgo");
        this.databaseUser = String(process.env.DATABASE_USER || "postgres");
        this.databasePassword = String(process.env.DATABASE_PASSWORD || "postgres");
        this.databaseHost = String(process.env.DATABASE_HOST || "localhost");
        this.databasePort = Number(process.env.DATABASE_PORT || 5432);

        // bash$ secure-session-gen-key | base64
        this.appSecret = String(process.env.APP_SECRET || console.error('APP_SECRET in not set') || '');
        this.sessionCookieName = String(process.env.SESSION_COOKIE_NAME || "session");
        this.sessionCookieTTL = Number(process.env.SESSION_COOKIE_TTL || 14*24*60*60); // default=14 days

        this.domain = String(process.env.DOMIAN || `${this.host}:${this.port}`);
        this.frontendRoot = String(process.env.FRONTEND_ROOT || 'http://localhost:8082');
        this.shortRoot = String(process.env.SHORT_ROOT || 'http://localhost:8082/#/link');
        this.apiRoot = String(process.env.API_ROOT || 'http://localhost:7000/api');

        //
        this.opentokApiKey = Number(process.env.OPENTOK_API_KEY || console.error('OPENTOK_API_KEY in not set') || '');
        this.opentokApiSecret = String(process.env.OPENTOK_API_SECRET || console.error('OPENTOK_API_SECRET in not set') || '');

        this.stripeAccountID = String(process.env.STRIPE_ACCOUNT_ID || console.error('STRIPE_ACCOUNT_ID in not set') || '');
        this.stripeConnectClientID = String(process.env.STRIPE_CONNECT_CLIENT_ID || console.error('STRIPE_CONNECT_CLIENT_ID in not set') || '');
        this.stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || console.error('STRIPE_SECRET_KEY in not set') || '');
        this.stripePublicKey = String(process.env.STRIPE_PUBLIC_KEY || console.error('STRIPE_PUBLIC_KEY in not set') || '');

        this.daemonEnabled = process.env.DAEMON_ENABLED === 'true' || this.nodeEnv == 'development';

        this.facebookVerifyToken = String(process.env.FACEBOOK_VERIFY_TOKEN || console.error('FACEBOOK_VERIFY_TOKEN in not set') || '');

        this.mailGunApiKey = String(process.env.MAIL_GUN_API_KEY || console.error('MAIL_GUN_API_KEY in not set') || '');

        this.calendlyClientId = String(process.env.CALENDLY_CLIENT_ID || console.error('CALENDLY_CLIENT_ID in not set') || '');
        this.calendlySecret = String(process.env.CALENDLY_SECRET || console.error('CALENDLY_SECRET in not set') || '');
        this.calendlyRedirectURI = process.env.CALENDLY_REDIRECT_URI || 'https://app.rifgo.com/api/calendly-oauth';
    }

    /**
     * Get instance
     */
    public static getInstance(): Env {
        if (!Env.instance) {
            Env.instance = new Env()
        }

        return Env.instance
    }
}
