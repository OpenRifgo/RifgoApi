import {NodeMailgun} from 'ts-mailgun';

import Mailgun from 'mailgun.js';
import formData from 'form-data';

import {IEmailSenderService, IMessageParams} from '../../interfaces/IEmailSenderService';
import App from '../../App';
import Client from 'mailgun.js/dist/lib/client';

export class MailgunSender implements IEmailSenderService {
  protected app: App;
  protected mailer: NodeMailgun;
  protected mailgun: Mailgun
  protected mg: Client

  constructor(app: App) {
    this.app = app;
    this.mailgun = new Mailgun(formData);
    this.mg = this.mailgun.client({username: 'api', key: this.app.env.mailGunApiKey});
    this.mailgun = new Mailgun(formData);
    this.mg = this.mailgun.client({username: 'api', key: this.app.env.mailGunApiKey});
  }

  async send(messageParams: IMessageParams) {
    try {
      console.log('sending email:', messageParams);
      return this.mg.messages.create('rifgo.com', messageParams);
    } catch (e) {
      console.error('sending email error:', messageParams);
      throw e;
    }
  }

}
