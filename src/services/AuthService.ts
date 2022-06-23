import App from '../App'
import {User} from '../entity/User'

export interface IFastifySession {
    get(name: string): string | number
    set(name: string, value: string | number)
    delete()
}

export default class AuthService {
    protected app: App

    constructor(app: App) {
        this.app = app
    }

    getUserId(session: IFastifySession): number | null {
        const userId = session.get('userId')
        return userId ? Number(userId) : null
    }

    logOut(session: IFastifySession) {
        session.delete()
    }

    logIn(userId: number, session: IFastifySession) {
        session.set('userId', userId)
        session.set('loginAt', Date.now())
    }

    async getUser(session: IFastifySession) {
        const userId = this.getUserId(session);
        if (!userId) return null;

        return await this.app.dbm.findOne(User, {id: userId});
    }
}
