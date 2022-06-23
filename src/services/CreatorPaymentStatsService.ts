import App from '../App'
import {Payment, PaymentFor, PaymentStatus} from '../entity/Payment'
import {Event} from '../entity/Event'

export class CreatorPaymentStatsService {
    protected app: App

    constructor(app: App) {
        this.app = app
    }

    /**
     * Total paid for event tickets (paywall)
     *
     * @param event
     */
    async eventTicketsTotalAmount(event: Event) {
        return await this.eventTotalAmountFor(event, PaymentFor.Event);
    }

    /**
     * Total donated on event
     *
     * @param event
     */
    async eventDonationsTotalAmount(event: Event) {
        return await this.eventTotalAmountFor(event, PaymentFor.Donation);
    }

    async eventTotalAmountFor(event: Event, paymentFor: PaymentFor) {
        const sumResult = await this.app.dbm.getRepository(Payment).createQueryBuilder("payment")
            .select("SUM(payment.amount)", "sum")
            .groupBy("eventRegistration.id")
            .leftJoinAndSelect("payment.eventRegistration", "eventRegistration")
            .andWhere('eventRegistration.eventId = :eventId', {eventId: event.id})
            .andWhere('payment.status = :status', {status: PaymentStatus.Paid})
            .andWhere('payment.paymentFor = :paymentFor', {paymentFor})
            .getRawMany();

        console.log(sumResult);

        return sumResult.reduce((prev, curr) => prev + Number(curr.sum), 0);
    }

}
