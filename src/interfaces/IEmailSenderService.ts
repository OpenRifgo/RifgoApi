export interface IMessageParams {
  from: string,
  to: string,
  subject: string,
  text: string,
  html: string,
  template?: string,
  attachment?: {}
}

export interface IEmailSenderService {
  send(messageParams: IMessageParams)
}
