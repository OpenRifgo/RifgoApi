import Env from '../../Env'
import Stripe from 'stripe';

export class StripeConnectService {

    protected c: {env: Env}
    protected stripe: Stripe

    constructor(c: {env: Env, stripe: Stripe}) {
        this.c = c;
        this.stripe = c.stripe;
    }

    async createAccount(user: {email: string}, domainForAPayRegister?: string) {
        const params: Stripe.AccountCreateParams = {
            type: 'standard',
            email: user.email,
        }

        const accountCreateResult = await this.stripe.accounts.create(params);
        if (domainForAPayRegister) {
          await this.stripe.applePayDomains.create({
            domain_name: domainForAPayRegister,
          },{
            stripe_account: accountCreateResult.id,
          });
        }

      return accountCreateResult;
    }

    async createAccountOnboardingLink(user: {stripeAccountId: string}) {
        const params: Stripe.AccountLinkCreateParams = {
            account: user.stripeAccountId,
            type: 'account_onboarding',
            return_url: 'https://rifgo.com/#/creator/stripe',
            refresh_url: 'https://rifgo.com/#/creator/stripe',
        }

        return await this.stripe.accountLinks.create(params);
    }

    async checkAccount(user: {stripeAccountId: string}) {
        return await this.stripe.accounts.retrieve({}, {
            stripeAccount: user.stripeAccountId
        });
    }

    async paymentIntent(params: {amount: number, fee_amount: number}, user: {stripeAccountId: string}) {
        return await this.stripe.paymentIntents.create({
            payment_method_types: ['card'],
            amount: Math.round(params.amount * 100),
            currency: 'usd',
            application_fee_amount: Math.round(params.fee_amount * 100),
        }, {
            stripeAccount: user.stripeAccountId,
        })
    }

}
