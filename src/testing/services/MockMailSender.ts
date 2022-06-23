import IEmailSenderService, {IEmailSenderServiceOpts} from '../../interfaces/IEmailSenderService'

export class MockMailSender implements IEmailSenderService {
    public sendCallLog: Array<IEmailSenderServiceOpts> = [];

    send(opts: IEmailSenderServiceOpts) {
        this.sendCallLog.push(opts);
    }
}
