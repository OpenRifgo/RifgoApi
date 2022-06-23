import App from '../../App'
import {User, UserStatuses} from '../../entity/User'
import {EntityTarget} from 'typeorm/common/EntityTarget'
import {Event} from '../../entity/Event'

type TAction = 'index' | 'show' | 'create' | 'update' | 'delete'

export class AccessModule {
    protected app: App;

    constructor(app: App) {
        this.app = app;
    }

    async canUserId<Entity>(entityClass: EntityTarget<Entity>, userId: number, action: TAction, value: Entity) {
        const user = await this.app.dbm.findOneOrFail(User, {id: userId});
        return this.can(entityClass, user, action, value);
    }

    can<Entity>(entityClass: EntityTarget<Entity>, user: User, action: TAction, value: Entity) {
        // allow all actions with all entities to platform admins
        if (this.isPlatformAdmin(user)) {
            return true;
        }

        if (entityClass === Event) {
            const event = value as unknown as Event;
            switch (action) {
                case 'index':
                    return event.userId == user.id;
            }
        }

        return false;
    }

    isPlatformAdmin(user: User | null) {
        // check
        return user && user.status === UserStatuses.PlatformAdmin;
    }

    async getUserById(userId: number): Promise<User | null> {
        return await this.app.dbm.findOne(User, {id: userId});
    }
}
