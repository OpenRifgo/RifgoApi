import IEmailSenderService from '../interfaces/IEmailSenderService'
import axios from 'axios'

const defaultBasePath = 'https://api.sendinblue.com/v3';

export class SendinblueEmailSender implements IEmailSenderService {
    // protected apiInstance: TransactionalEmailsApi

    constructor(c: {}) {
        // this.apiInstance = new TransactionalEmailsApi()
        //
        // // Configure API key authorization: apiKey
        //
        // this.apiInstance.setApiKey(
        //     TransactionalEmailsApiApiKeys.apiKey,
        //     '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',
        // );

    }

    async send(opts: {
        from: string,
        to: string,
        subject: string,
        text: string,
        html: string
    }) {
        return await this.sendTransacEmail({
            sender: {
                email: opts.from,
            },
            to: [
                {email: opts.to},
            ],
            htmlContent: opts.html,
            textContent: opts.text,
            subject: opts.subject,
        })
    }

    protected async sendTransacEmail(sendSmtpEmail) {
        return await axios.post(defaultBasePath + '/smtp/email', sendSmtpEmail, {
            headers: {
                'api-key': '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'
            }
        })
    }
}
