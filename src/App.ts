import {Connection} from 'typeorm/connection/Connection'
import Env from './Env'
import AuthService from './services/AuthService'
import {IEmailSenderService} from './interfaces/IEmailSenderService'
import {DirService} from './services/DirService'
import {MailgunSender} from './services/email/MailgunSender'
import {StripeConnectService} from './services/stripe/StripeConnectService'
import Stripe from 'stripe'
import {WsModule} from './modules/wsModule/WsModule'
import {WsApp} from './modules/wsModule/WsApp'
import {PaymentsService} from './services/PaymentsService'
import EmailModule from './modules/emailModule/EmailModule'
import {CreatorPaymentStatsService} from './services/CreatorPaymentStatsService'
import {AccessModule} from './modules/accessModule/AccessModule'
import RecommendationsService from './services/RecommendationsService'
import {EventRegistrationService} from './services/EventRegistrationService'
import {ReposContainer} from './repos/ReposContainer'
import {Mailgun} from 'mailgun-js'
import {mailgunFactory} from './services/email/MailgunFactory'
import {CalendlyApi} from './services/calendly/CalendlyApi'
import {CalendlyService} from './services/calendly/CalendlyService'
import {nanoid} from 'nanoid';
import {SimpleFileUploadService} from './services/SimpleFileUploadService'
import {MailgunTsSenderService} from 'bricks-ts-email-sender-mailgun-ts/lib/main'
import {BricksLoggerConsole, BricksLoggerMultiProxy, IBricksLogger} from 'bricks-ts-logger'
import {DatabaseLoggerConsole} from './services/DatabaseLogger'

const ejs = require('ejs')

// config.update({
//     region: "us-east-1",
//     accessKeyId: 'AKIA5CM6HG7RHBHZU25I',
//     secretAccessKey: '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'
// });

export default class App {
  // singleton
  private static instance: App

  /**
   * Get instance
   */
  public static getInstance(): App {
    if (!App.instance) {
      App.instance = new App()
    }

    return App.instance
  }

  db: Connection

  get dbm() {
    return this.db.manager
  }

  get env() {
    return Env.getInstance();
  }

  nanoid = nanoid

  protected _AuthService: AuthService
  get AuthService() {
    return this._AuthService || (this._AuthService = new AuthService(this));
  }

  protected _AccessModule: AccessModule;
  get AccessModule(): AccessModule {
    return this._AccessModule || (this._AccessModule = new AccessModule(this));
  }

  protected _emailSenderService: IEmailSenderService
  get emailSenderService(): IEmailSenderService {
    return this._emailSenderService || (this._emailSenderService = new MailgunSender(this));
  }

  protected _CalendlyApi: CalendlyApi;
  get CalendlyApi(): CalendlyApi {
    return this._CalendlyApi || (this._CalendlyApi = new CalendlyApi(this));
  }

  protected _CalendlyService: CalendlyService;
  get CalendlyService(): CalendlyService {
    return this._CalendlyService || (this._CalendlyService = new CalendlyService(this));
  }

  // protected _emailSenderWithAttachmentService: IEmailSenderService
  // get emailSenderServiceWithAttachment(): IEmailSenderServiceWithAttachment {
  //     return this._emailSenderService || (this._emailSenderService = new MailgunSender(this));
  // }

  protected _EmailModule: EmailModule
  get EmailModule(): EmailModule {
    return this._EmailModule || (this._EmailModule = new EmailModule(this));
  }

  protected _emailSender: MailgunTsSenderService
  get emailSender(): MailgunTsSenderService {
    return this._emailSender || (
      this._emailSender = MailgunTsSenderService.init({
        env: {
          NodeMailgun: {
            apiKey: this.env.mailGunApiKey,
            domain: 'rifgo.com',
            fromEmail: 'RIFGO <noreply@rifgo.com>',
          },
        },
      })
    )
  }

  protected _Mailgun: Mailgun
  get Mailgun(): Mailgun {
    return this._Mailgun || (this._Mailgun = mailgunFactory(this));
  }

  protected _EventRegistrationService: EventRegistrationService
  get EventRegistrationService(): EventRegistrationService {
    return this._EventRegistrationService || (this._EventRegistrationService = new EventRegistrationService(this));
  }

  protected _DirService: DirService

  get dirService(): DirService {
    return this._DirService || (this._DirService = new DirService());
  }

  get ejs() {
    return ejs
  }

  protected _Stripe: Stripe;

  get stripe(): Stripe {
    return this._Stripe || (this._Stripe = new Stripe(this.env.stripeSecretKey, {
      apiVersion: '2020-08-27',
      typescript: true,
    }));
  }

  protected _StripeConnectService: StripeConnectService;

  get stripeConnectService(): StripeConnectService {
    return this._StripeConnectService || (this._StripeConnectService = new StripeConnectService(this));
  }

  protected _WsModule: WsModule;

  get wsModule(): WsModule {
    return this._WsModule || (this._WsModule = new WsModule(this));
  }

  protected _WsApp: WsApp;

  get wsApp(): WsApp {
    return this._WsApp || (this._WsApp = WsApp.getInstance());
  }

  protected _PaymentsService: PaymentsService;

  get paymentsService(): PaymentsService {
    return this._PaymentsService || (this._PaymentsService = new PaymentsService(this));
  }

  protected _CreatorPaymentStatsService: CreatorPaymentStatsService;

  get creatorPaymentStatsService(): CreatorPaymentStatsService {
    return this._CreatorPaymentStatsService || (this._CreatorPaymentStatsService = new CreatorPaymentStatsService(this))
  }

  protected _RecommendationsService: RecommendationsService;

  get recommendationsService(): RecommendationsService {
    return this._RecommendationsService || (this._RecommendationsService = new RecommendationsService(this))
  }

  protected _ReposContainer: ReposContainer;

  get repos(): ReposContainer {
    return this._ReposContainer || (this._ReposContainer = new ReposContainer(this));
  }

  protected _fileUploadService: SimpleFileUploadService;
  get fileUploadService(): SimpleFileUploadService {
    return this._fileUploadService || (this._fileUploadService = new SimpleFileUploadService(this));
  }

  protected _logger: IBricksLogger;
  get logger(): IBricksLogger {
    return this._logger || (this._logger =
      new BricksLoggerMultiProxy(
        this.consoleLogger,
        this.dbLogger,
      )
    );
  }

  protected _dbLogger: IBricksLogger;
  get dbLogger(): IBricksLogger {
    return this._dbLogger || (this._dbLogger = new DatabaseLoggerConsole(this));
  }

  protected _consoleLogger: IBricksLogger;
  get consoleLogger(): IBricksLogger {
    return this._consoleLogger || (this._consoleLogger = new BricksLoggerConsole());
  }
}
