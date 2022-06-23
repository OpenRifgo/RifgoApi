import App from '../App'
import {User} from '../entity/User'
import {Consultant} from '../entity/Consultant'

export default class UserRepo {
  protected app: App

  constructor(app: App) {
    this.app = app
  }

  async emailTaken(email: string) {
    return await this.app.dbm.count(User, {
      email: email.toLowerCase(),
    }) > 0
  }

  async findById(id: number) {
    return await this.app.dbm.findOne(User, id);
  }
}
