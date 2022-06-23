import Env from '../Env'
import App from '../App'
import { SES, AWSError, config } from 'aws-sdk';
import { SendEmailRequest, SendEmailResponse } from 'aws-sdk/clients/ses';
import {SendinblueEmailSender} from '../services/SendinblueEmailSender'
import EmailModule from '../modules/emailModule/EmailModule'

const env = Env.getInstance();

const app = App.getInstance();
app.env = env;

const emailModule = new EmailModule(app);

emailModule.sendEmailVerifyTo({
    email: 'urvala@gmail.com',
    confirmSecret: '1234',
}).then(d => console.log(d))

// sender.send({
//     from: 'noreply@rifgo.com',
//     to: 'urvala@gmail.com',
//     subject: 'subject',
//     text: 'Hello!',
//     html: '<strong>Html Hello!</strong>'
// }).then(d => console.log(d))
