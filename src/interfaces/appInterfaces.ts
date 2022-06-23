import {EntityManager} from 'typeorm/entity-manager/EntityManager'

export interface IAppDbm {
    dbm: EntityManager
}
