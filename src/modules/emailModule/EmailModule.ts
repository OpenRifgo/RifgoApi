import App from '../../App'
import moment from 'moment';
import {Streamer} from '../../entity/Streamer'
import {eventFormattedTimezone} from '../../lib/dateTime'
import {createEvent, DateArray} from 'ics'
import {readFileSync, writeFileSync} from 'fs'
import {request} from 'https';
import {log} from 'util';
import {ConsultantBooking} from '../../entity/ConsultantBooking'
import bookingRoutes from '../../api/bookingRoutes'
import {EmailTemplateBuilderFactory} from './EmailTemplateBuilder'
import {Consultant} from '../../entity/Consultant'
import {ConsultantOffer} from '../../entity/ConsultantOffer'
import {ConsultantReferralLink} from '../../entity/ConsultantReferralLink'

const ejs = require('ejs')

export default class EmailModule {
  protected app: App;
  protected emailTemplateBuilderFactory: EmailTemplateBuilderFactory;

  constructor(app: App) {
    this.app = app;
    this.emailTemplateBuilderFactory = new EmailTemplateBuilderFactory(app);
  }

  GenerateICSValue = (event, url) => {
    let from = moment(event.dateTimeFrom)
    let to = moment(event.dateTimeTo)

    console.log(from)
    console.log(to)

    let beginArray: DateArray = [from.year(), from.month() + 1, from.date(), from.hour(), from.minute()]
    let duration: number = to.diff(from, 'minutes')
    console.log('How mutch? ' + duration.toString())

    let valueICS = ''
    createEvent({
      title: event.name,
      description: event.description,
      busyStatus: 'FREE',
      start: beginArray,
      duration: {minutes: duration},
      url: url,
    }, (error, value) => {
      if (error) console.log(error)
      valueICS = value
    })
    return valueICS
  }

  async sendEmailVerifyTo(user: { email: string, confirmSecret: string }) {

    const fileName = 'eventRegistration.html'
    const data = {}

    const html = await ejs.renderFile(
      `${this.app.dirService.rootDir}/templates/mail/${fileName}.ejs`,
      data,
      {async: true},
    )

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: user.email,
      subject: 'Email verification',
      text: html,
      html: html,
    })

  }

  async sendFreeEventRegistrationEmail(event: { name: string, }, eventRegistration: { email: string, secret: string }) {
    const email = eventRegistration.email;

    const subject = `${event.name} — Webinar link`
    const confirmationLink = this.getConfirmRegistrationUrl(eventRegistration.secret);
    const whatsappURITextParameter = 'I invite you to watch an interesting stream '

    const whatsappURI = encodeURI('https://wa.me/?text=' + whatsappURITextParameter) +
      confirmationLink.split('#').join('%23').split('/').join('%2F')

    const emailText = await this.app.ejs.renderFile(
      this.getFullTemplatePath('mail/eventRegistrationFree.html'),
      {
        subject,
        confirmationLink,
        event,
        whatsappURI,
      },
      {async: true},
    );
    let ICSValue = this.GenerateICSValue(event, confirmationLink)

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: email,
      subject,
      text: emailText,
      html: emailText,
      attachment: {filename: 'event.ics', data: ICSValue},
    });
  }

  async sendPaidEventRegistrationEmail(event: { name: string, amount: number }, eventRegistration: { email: string, secret: string }) {
    const email = eventRegistration.email;

    const subject = `${event.name} — Payment link`
    const confirmationLink = this.getConfirmRegistrationUrl(eventRegistration.secret);

    const emailText = await this.app.ejs.renderFile(
      this.getFullTemplatePath('mail/eventRegistrationPaid.html'),
      {
        subject,
        confirmationLink,
        event,
      },
      {async: true},
    );

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: email,
      subject,
      text: emailText,
      html: emailText,
    });
  }

  async sendEventPersonalLinkEmail(
    event: { name: string, amount: number },
    eventRegistration: { email: string, secret: string },
    eventLink: { uid: string },
  ) {
    const email = eventRegistration.email;

    const subject = `${event.name} — Webinar link`
    const eventUrl = this.getConfirmRegistrationUrl(eventRegistration.secret);
    const registrationUrl = this.getRegistrationLink(eventLink.uid);
    const whatsappURITextParameter = 'I invite you to watch an interesting stream '

    const whatsappURI = encodeURI('https://wa.me/?text=' + whatsappURITextParameter) +
      registrationUrl.split('#').join('%23').split('/').join('%2F')

    const emailText = await this.app.ejs.renderFile(
      this.getFullTemplatePath('mail/eventPersonalLink.html'),
      {
        subject,
        eventUrl,
        registrationUrl,
        event,
        whatsappURI,
      },
      {async: true},
    );

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: email,
      subject,
      text: emailText,
      html: emailText,
    });
  }

  protected async sendEventReminder(
    opts: {
      subject: string,
      template: string,
    },
    event: { name: string, amount: number, speakerName: string, speakerTitle: string, dateTimeFrom: Date, timezone: string },
    eventRegistration: { email: string, secret: string },
    eventLink: { uid: string },
    streamer?: Streamer,
  ) {
    const email = eventRegistration.email;
    const timeFromFormatted = moment.utc(event.dateTimeFrom).tz(event.timezone).format('h:mm a')
    const dateFormatted = moment.utc(event.dateTimeFrom).tz(event.timezone).format('MMMM Do, YYYY')
    const eventUrl = this.getConfirmRegistrationUrl(eventRegistration.secret);
    const registrationUrl = this.getRegistrationLink(eventLink.uid);
    const timezoneFormatted = eventFormattedTimezone(event.timezone);

    const emailText = await this.app.ejs.renderFile(
      this.getFullTemplatePath(opts.template),
      {
        subject: opts.subject,
        eventUrl,
        registrationUrl,
        timeFromFormatted,
        timezoneFormatted,

        dateFormatted,
        event,
        smm: streamer?.smm || {},
      },
      {async: true},
    );

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: email,
      subject: opts.subject,
      text: emailText,
      html: emailText,
    });
  }

  async sendEventWillStartInOneDay(
    event: { name: string, amount: number, speakerName: string, speakerTitle: string, dateTimeFrom: Date, timezone: string },
    eventRegistration: { email: string, secret: string },
    eventLink: { uid: string },
    streamer?: Streamer,
  ) {
    await this.sendEventReminder(
      {
        subject: `Reminder: ${event.name} starts tomorrow`,
        template: 'mail/eventWillStartInOneDay.html',
      },
      event,
      eventRegistration,
      eventLink,
      streamer,
    )
  }

  async sendEventWillStartInOneHour(
    event: { name: string, amount: number, speakerName: string, speakerTitle: string, dateTimeFrom: Date, timezone: string },
    eventRegistration: { email: string, secret: string },
    eventLink: { uid: string },
    streamer?: Streamer,
  ) {
    await this.sendEventReminder(
      {
        subject: `Reminder: ${event.name} starts in 1 hour`,
        template: 'mail/eventWillStartInOneHour.html',
      },
      event,
      eventRegistration,
      eventLink,
      streamer,
    )
  }

  async sendEventWillStartInTenMinutes(
    event: { name: string, amount: number, speakerName: string, speakerTitle: string, dateTimeFrom: Date, timezone: string },
    eventRegistration: { email: string, secret: string },
    eventLink: { uid: string },
    streamer?: Streamer,
  ) {
    await this.sendEventReminder(
      {
        subject: `Reminder: ${event.name} starts in 10 minutes`,
        template: 'mail/eventWillStartInTenMinutes.html',
      },
      event,
      eventRegistration,
      eventLink,
      streamer,
    )
  }

  async sendEventStartsNow(
    event: { name: string, amount: number, speakerName: string, speakerTitle: string, dateTimeFrom: Date, timezone: string },
    eventRegistration: { email: string, secret: string },
    eventLink: { uid: string },
    streamer?: Streamer,
  ) {

    await this.sendEventReminder(
      {
        subject: `Reminder: ${event.name} has started`,
        template: 'mail/eventStartsNow.html',
      },
      event,
      eventRegistration,
      eventLink,
      streamer,
    )
  }

  async sendEventWillStartSoonEmail(
    event: { name: string, amount: number, timeFrom: string },
    eventRegistration: { email: string, secret: string },
    eventLink: { uid: string },
  ) {
    const email = eventRegistration.email;
    const timeFromFormatted = moment.utc(event.timeFrom).format('h:mm a')
    const subject = `${event.name} — Streaming will start at ${timeFromFormatted}`
    const eventUrl = this.getConfirmRegistrationUrl(eventRegistration.secret);
    const registrationUrl = this.getRegistrationLink(eventLink.uid);

    const emailText = await this.app.ejs.renderFile(
      this.getFullTemplatePath('mail/eventWillStartSoon.html'),
      {
        subject,
        eventUrl,
        registrationUrl,
        event,
      },
      {async: true},
    );

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: email,
      subject,
      text: emailText,
      html: emailText,
    });
  }

  async sendEventWillStartSoonNotPaidEmail(
    event: { name: string, amount: number, timeFrom: string },
    eventRegistration: { email: string, secret: string },
    eventLink: { uid: string },
  ) {
    const email = eventRegistration.email;

    const timeFromFormatted = moment.utc(event.timeFrom).format('h:mm a')
    const subject = `${event.name} — Streaming will start at ${timeFromFormatted}`
    const eventUrl = this.getConfirmRegistrationUrl(eventRegistration.secret);
    const registrationUrl = this.getRegistrationLink(eventLink.uid);

    const emailText = await this.app.ejs.renderFile(
      this.getFullTemplatePath('mail/eventWillStartSoonNotPaid.html'),
      {
        subject,
        eventUrl,
        registrationUrl,
        event,
      },
      {async: true},
    );

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: email,
      subject,
      text: emailText,
      html: emailText,
    });
  }

  async sendPasswordRecoveryEmail(data: { email: string, passwordChangeSecret: string }) {
    const email = data.email;

    const subject = `Rifgo.com - password recovery`
    const passwordChangeLink = this.getPasswordRecoveryUrl(data.passwordChangeSecret);

    const emailText = await this.app.ejs.renderFile(
      this.getFullTemplatePath('mail/passwordRecovery.html'),
      {
        subject,
        passwordChangeLink,
      },
      {async: true},
    );

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: email,
      subject,
      text: emailText,
      html: emailText,
    });
  }

  async sendConsultantCalendarLinkEmail(data: { booking: ConsultantBooking }) {
    const email = data.booking.email;

    const subject = `${data.booking.offer.title} booking - Rifgo.com`;

    const emailText = await this.app.ejs.renderFile(
      this.getFullTemplatePath('mail/consultantCalendarLink.html'),
      {
        subject,
        booking: data.booking,
      },
      {async: true},
    );

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: email,
      subject,
      text: emailText,
      html: emailText,
    });
  }

  // Email клиенту с подтверждением booking
  async sendConsultationFreeToClient(data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string }) {
    const email = data.booking.email;

    const consultantName = data.consultant.name;
    const offerName = data.offer.title;
    const calendarLink = data.booking.calendarLink;

    const subject = `🎉 Finish booking your free meeting with ${consultantName} ${offerName}`;

    const emailHtml = await this.emailTemplateBuilderFactory.build().render({
      topic: subject,
      content: `<p>Hello!<br/>
        Thank you for your interest in ${consultantName}.<br/>
        Please use this <b>link</b> to choose a date and time for the meeting that is convenient for you:
        </p>
        <p><a href="${calendarLink}" target="_blank" title="Event link">${calendarLink}</a></p>
        <p>If you have any questions please contact ${consultantName} at ${data.consultantEmail}.</p>
      `,
    });

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: email,
      subject,
      text: emailHtml,
      html: emailHtml,
    });
  }

  async sendConsultationPaidToClient(data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string }) {
    const email = data.booking.email;

    const consultantName = data.consultant.name;
    const offerName = data.offer.title;
    const calendarLink = data.booking.calendarLink;

    const subject = `🎉 ${consultantName} ${offerName} was purchased`;

    const emailHtml = await this.emailTemplateBuilderFactory.build().render({
      topic: subject,
      content: `<p>Hello!<br/>
        You have successfully purchased the ${consultantName} ${offerName}.<br/>
        Please use this <b>one-time link</b> to choose a date and time for the meeting that is convenient for you:
        </p>
        <p><a href="${calendarLink}" target="_blank" title="Event link">${calendarLink}</a></p>
        <p>If you have any questions please contact ${consultantName} at ${data.consultantEmail}.</p>
      `,
    });

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: email,
      subject,
      text: emailHtml,
      html: emailHtml,
    });
  }

  async sendConsultationLinkToClient(
    data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string }
  ) {
    if (data.booking.price === 0) {
      await this.sendConsultationFreeToClient(data);
    } else {
      await this.sendConsultationPaidToClient(data);
    }
  }

  // Email клиенту с подтверждением booking
  async sendFreeConsultationBookedToConsultant(
    data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string },
    options?: { additionalText: string },
  ) {
    const clientEmail = data.booking.email;

    const consultantName = data.consultant.name;
    const offerName = data.offer.title;
    const supportEmail = 'support@rifgo.com'

    const subject = `🎉 A meeting with you has been requested through your referral link`;

    const emailHtml = await this.emailTemplateBuilderFactory.build().render({
      topic: subject,
      content: `<p>Hello ${consultantName},</p>
                <p>Congratulations! You have a <b>new lead</b>. ${clientEmail} has requested a meeting with you.</p>
                <p>We have sent the customer your one-time Calendly link to select a date and time for your meeting. 
                We’ve also provided them  your email address in case they need to contact you.</p>
                <p>So you should expect a new booking soon, have a great meeting!</p>` +
        (options?.additionalText || '') +
        `<p>We hope this customer will recommend you to their friends in the future.<br />
                If you have any questions please email ${supportEmail}.</p>`,
    });

    try {
      await this.app.emailSenderService.send({
        from: 'noreply@rifgo.com',
        to: data.consultantEmail,
        subject,
        text: 'emailHtml',
        html: emailHtml,
      });
    } catch (e) {
      console.log('!!!!', {
        from: 'noreply@rifgo.com',
        to: data.consultantEmail,
        subject,
        text: 'emailHtml',
        html: emailHtml,
      })
      throw e;
    }
  }

  async sendPaidConsultationBookedToConsultant(
    data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string },
    options?: { additionalText: string },
  ) {
    const clientEmail = data.booking.email;

    const consultantName = data.consultant.name;
    const offerName = data.offer.title;
    const supportEmail = 'support@rifgo.com'

    const subject = `🎉 Your ${offerName} was purchased`;

    const emailHtml = await this.emailTemplateBuilderFactory.build().render({
      topic: subject,
      content: `<p>Hello ${consultantName},</p>
                <p>Congratulations! You have a <b>new client</b>. ${clientEmail} has purchased your ${offerName}.</p>
                <p>We have sent the customer your one-time Calendly link to select a date and time for your meeting. 
                We’ve also provided them  your email address in case they need to contact you.</p>
                <p>So you should expect a new booking soon, have a great meeting!</p>` +
        (options?.additionalText || '') +
        `<p>We hope this customer will recommend you to their friends in the future.<br />
                If you have any questions please email ${supportEmail}.</p>`,
    });

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: data.consultantEmail,
      subject,
      text: emailHtml,
      html: emailHtml,
    });
  }

  async sendConsultationBookedToConsultant(
    data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string },
    options?: { additionalText: string },
  ) {
    if (data.booking.price === 0) {
      await this.sendFreeConsultationBookedToConsultant(data);
    } else {
      await this.sendPaidConsultationBookedToConsultant(data);
    }
  }

  // Email коучу с уведомлением о встрече и данными клиента с агентом
  async sendFreeConsultationBookedWithAgentToConsultant(
    data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string, referral: ConsultantReferralLink },
  ) {
    const clientEmail = data.booking.email;
    const agentEmail = data.referral.email;
    const registrations = data.referral.registrations;

    await this.sendFreeConsultationBookedToConsultant(data, {
      additionalText: `${clientEmail} came from ${agentEmail} recommendation. 
                       ${agentEmail}’s has brought you ${registrations} leads so far.`,
    });
  }

  async sendPaidConsultationBookedWithAgentToConsultant(
    data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string, referral: ConsultantReferralLink },
  ) {
    const clientEmail = data.booking.email;
    const agentEmail = data.referral.email;
    const confirmations = data.referral.confirmations;

    await this.sendConsultationBookedToConsultant(data, {
      additionalText: `${clientEmail} came from ${agentEmail} recommendation. 
                       ${agentEmail}’s has brought you ${confirmations} leads so far.`,
    });
  }

  async sendConsultationBookedWithAgentToConsultant(
    data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string, referral: ConsultantReferralLink },
  ) {
    if (data.booking.price === 0) {
      await this.sendFreeConsultationBookedWithAgentToConsultant(data);
    } else {
      await this.sendPaidConsultationBookedWithAgentToConsultant(data);
    }
  }

  // Email агенту с информацией о покупке сессии по его ссылке и суммой его вознаграждения и уникальной ссылкой на покупку сессии со скидкой
  async sendFreeConsultationBookedToAgent(
    data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string, referral: ConsultantReferralLink }
  ) {
    const referralEmail = data.referral.email;
    const consultantName = data.consultant.name;
    const registrations = data.referral.registrations;

    const subject = `🎉 Your reward from ${consultantName}`;

    const emailHtml = await this.emailTemplateBuilderFactory.build().render({
      topic: subject,
      content: `<p>Hello,</p>
                <p>Congratulations! ${consultantName} has a new client thanks to your recommendation!</p>
                <p>You’ve forwarded <b>${registrations}</b> clients to ${consultantName} so far.</p>
                <p>If you would like to recommend more to ${consultantName} keep sharing your referral link: </p>
                <p>https://rifgo.com/${data.referral.uid}</p>
                <p>If you have any questions please email ${data.consultantEmail}.</p>`,
    });

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: referralEmail,
      subject,
      text: emailHtml,
      html: emailHtml,
    });
  }

  async sendPaidConsultationBookedToAgent(
    data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string, referral: ConsultantReferralLink }
  ) {
    const referralEmail = data.referral.email;
    const consultantName = data.consultant.name;
    const confirmations = data.referral.confirmations;

    const subject = `🎉 Your reward from ${consultantName}`;

    const emailHtml = await this.emailTemplateBuilderFactory.build().render({
      topic: subject,
      content: `<p>Hello,</p>
                <p>Congratulations! ${consultantName} has a new client thanks to your recommendation!</p>
                <p>You’ve forwarded <b>${confirmations}</b> people to ${consultantName} so far. Expect a reward soon!</p>
                <p>If you would like to recommend more to ${consultantName} keep sharing your referral link: </p>
                <p>https://rifgo.com/${data.referral.uid}</p>
                <p>If you have any questions please email ${data.consultantEmail}.</p>`,
    });

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: referralEmail,
      subject,
      text: emailHtml,
      html: emailHtml,
    });
  }

  async sendConsultationBookedToAgent(
    data: { booking: ConsultantBooking, consultant: Consultant, offer: ConsultantOffer, consultantEmail: string, referral: ConsultantReferralLink }
  ) {
    if (data.booking.price === 0) {
      await this.sendFreeConsultationBookedToAgent(data);
    } else {
      await this.sendPaidConsultationBookedToAgent(data);
    }
  }

  async sendReferralLink(
    data: { referralLink: ConsultantReferralLink, consultant: Consultant, consultantEmail: string }
  ) {

    const referral = data.referralLink;
    const consultantName = data.consultant.name;

    const subject = `Referral link for recommending ${consultantName}`;

    const emailHtml = await this.emailTemplateBuilderFactory.build().render({
      topic: subject,
      content: `<p>Hello,</p>
                <p>Your <b>referral link</b> for recommending ${consultantName} is here:</p>
                <p>https://rifgo.com/${referral.uid}</p>
                <p>Send this link to your friends or colleagues on occasion or even share it on your social network.</p>
                <p>If you have any questions please email ${data.consultantEmail}.</p>`,
    });

    await this.app.emailSenderService.send({
      from: 'noreply@rifgo.com',
      to: referral.email,
      subject,
      text: emailHtml,
      html: emailHtml,
    });
  }

  protected getConfirmRegistrationUrl(secret: string) {
    return `${this.app.env.apiRoot}/public/eventRegistration/${secret}/confirm`
  }

  protected getRegistrationLink(eventLinkUid: string) {
    return `${this.app.env.frontendRoot}/#/event/${eventLinkUid}`
  }

  protected getFullTemplatePath(templateName: string) {
    return `${this.app.dirService.rootDir}/src/templates/${templateName}.ejs`
  }

  protected getPasswordRecoveryUrl(secret: string) {
    // return `${this.app.env.apiRoot}/auth/passwordRecovery/${secret}/confirm`
    return `${this.app.env.frontendRoot}/#/auth/changePassword/${secret}`
  }
}
