import Env from '../Env'
import App from '../App'
import { SES, AWSError, config } from 'aws-sdk';
import { SendEmailRequest, SendEmailResponse } from 'aws-sdk/clients/ses';

const env = Env.getInstance();

const app = App.getInstance();
app.env = env;

config.update({
    region: "us-east-1",
    accessKeyId: 'AKIA5CM6HG7RHBHZU25I',
    secretAccessKey: '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'
});

// 'AKIA5CM6HG7RHBHZU25I'
// 'suDBfgbEH0ZJ/IwUFtGEuvfitqLjgCui0Lvkq4vT'

const ses = new SES();

const sender = 'urvala@gmail.com',
    recipient = 'urvala@gmail.com',
    subject = 'subject',
    charset = 'UTF-8',
    body = 'Hello!',
    html = '<strong>Html Hello!</strong>'

const params: SendEmailRequest = {
    Source: sender,
    Destination: {
        ToAddresses: [
            recipient
        ]
    },
    Message: {
        Subject: {
            Data: subject,
            Charset: charset
        },
        Body: {
            Text: {
                Data: body,
                Charset: charset
            },
            Html: {
                Data: html,
                Charset: charset
            }
        }
    }
}

ses.sendEmail(params, (err: AWSError, data: SendEmailResponse) => {
    if (err) console.log(err, err.stack);
    else console.log(data);
});
