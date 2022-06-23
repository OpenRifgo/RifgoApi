import { SES, AWSError } from 'aws-sdk';
import { SendEmailRequest, SendEmailResponse } from 'aws-sdk/clients/ses';
import IEmailSenderService from '../interfaces/IEmailSenderService'

class AWSEmailSender implements IEmailSenderService {
    protected ses: SES

    constructor(c: {ses: SES}) {
        this.ses = c.ses
    }

    async send(opts: {
        from: string,
        to: string,
        subject: string,
        text: string,
        html: string
    }) {
        const charset = 'UTF-8'

        const params: SendEmailRequest = {
            Source: opts.from,
            Destination: {
                ToAddresses: [
                    opts.to
                ]
            },
            Message: {
                Subject: {
                    Data: opts.subject,
                    Charset: charset
                },
                Body: {
                    Text: {
                        Data: opts.text,
                        Charset: charset
                    },
                    Html: {
                        Data: opts.html,
                        Charset: charset
                    }
                }
            }
        }

        return new Promise((resolve, reject) => {

            this.ses.sendEmail(params, (err: AWSError, data: SendEmailResponse) => {
                if (err) reject(err);
                else resolve(data);
            });

        })

    }
}
