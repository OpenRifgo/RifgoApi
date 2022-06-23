import Mailgun from 'mailgun-js'
import App from '../../App'

export function mailgunFactory(app: App): Mailgun.Mailgun {
    const DOMAIN = "rifgo.com";
    return Mailgun({
        apiKey: app.env.mailGunApiKey,
        domain: DOMAIN
    });
}
