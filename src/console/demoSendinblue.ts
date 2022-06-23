import Env from '../Env'
import App from '../App'
import { SES, AWSError, config } from 'aws-sdk';
import { SendEmailRequest, SendEmailResponse } from 'aws-sdk/clients/ses';
import {SendinblueEmailSender} from '../services/SendinblueEmailSender'

const env = Env.getInstance();

const app = App.getInstance();
app.env = env;

const sender = new SendinblueEmailSender({});

sender.send({
    from: 'noreply@rifgo.com',
    to: 'urvala@gmail.com',
    subject: 'subject',
    text: 'Hello!',
    html: '<strong>Html Hello!</strong>'
}).then(d => console.log(d))
