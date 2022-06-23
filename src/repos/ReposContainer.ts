import App from '../App'
import StreamerRepo from './StreamerRepo'
import UserRepo from './UserRepo'
import {ConsultantReferralLinkRepo} from './ConsultantReferralLinkRepo'
import {ConsultantBookingRepo} from './ConsultantBookingRepo'
import {ConsultantRepo} from './ConsultantRepo'

export class ReposContainer {
    protected app: App;

    constructor(app: App) {
        this.app = app;
    }

    protected _UserRepo: UserRepo;
    get UserRepo() {
        return this._UserRepo || (this._UserRepo = new UserRepo(this.app));
    }

    protected _StreamerRepo: StreamerRepo;
    get StreamerRepo() {
        return this._StreamerRepo || (this._StreamerRepo = new StreamerRepo(this.app));
    }

    protected _ConsultantReferralLinkRepo: ConsultantReferralLinkRepo;
    get ConsultantReferralLinkRepo() {
        return this._ConsultantReferralLinkRepo || (this._ConsultantReferralLinkRepo = new ConsultantReferralLinkRepo(this.app));
    }

    protected _ConsultantBookingRepo: ConsultantBookingRepo;
    get ConsultantBookingRepo() {
        return this._ConsultantBookingRepo || (this._ConsultantBookingRepo = new ConsultantBookingRepo(this.app));
    }

    protected _ConsultantRepo: ConsultantRepo;
    get ConsultantRepo() {
        return this._ConsultantRepo || (this._ConsultantRepo = new ConsultantRepo(this.app));
    }
}
