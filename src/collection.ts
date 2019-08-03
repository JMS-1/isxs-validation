import * as debug from 'debug'
import { Collection, Db, FilterQuery } from 'mongodb'

import { getMessage } from '@jms-1/isxs-tools'

import { IMuiString, IValidatableSchema, IValidationError } from '../'
import { convertToMongo } from './mongoDb'
import { addSchema, validate } from './validation'

const databaseError = debug('database')

export abstract class CollectionBase<TType extends { _id: string }> {
    abstract readonly name: string

    abstract readonly schema: IValidatableSchema

    protected abstract getCollection(): Promise<Collection<TType>>

    protected onInitialize(collection: Collection<TType>): Promise<void> {
        return Promise.resolve<void>(undefined)
    }

    async initialize(collection: Collection<TType>, database: Db): Promise<void> {
        await this.onInitialize(collection)

        addSchema(this.schema)

        await database.command({ collMod: this.name, validator: { $jsonSchema: convertToMongo(this.schema) } })
    }

    private processValidatableError(item: TType, type: string, error: any): IValidationError[] {
        if (error.code !== 121) {
            databaseError('error during %s: %s', type, getMessage(error))

            throw error
        }

        try {
            return (
                validate(item, this.schema) || [
                    { constraint: 'database', message: { en: getMessage(error) }, property: '*' },
                ]
            )
        } catch (e) {
            databaseError('error during %s validation: %s', type, getMessage(e))

            throw error
        }
    }

    async insertOne(item: TType): Promise<IValidationError[]> {
        try {
            const me = await this.getCollection()

            await me.insertOne(item)

            return undefined
        } catch (error) {
            return this.processValidatableError(item, 'insert', error)
        }
    }

    async findOneAndReplace(item: TType): Promise<IValidationError[]> {
        try {
            const me = await this.getCollection()
            const updated = await me.findOneAndReplace({ _id: item._id }, item)

            if (!updated) {
                return [{ constraint: 'database', message: { en: 'not found' }, property: '_id' }]
            }

            return undefined
        } catch (error) {
            return this.processValidatableError(item, 'update', error)
        }
    }

    async find(filter?: FilterQuery<TType>, sort?: object, project?: object): Promise<TType[]> {
        const me = await this.getCollection()

        let query = me.find(filter)

        if (sort) {
            query = query.sort(sort)
        }

        if (project) {
            query = query.project(project)
        }

        return query.toArray()
    }

    async findOne(id: string): Promise<TType> {
        const me = await this.getCollection()

        return me.findOne({ _id: id.toString() })
    }

    protected canDelete(id: string): Promise<IMuiString> {
        return Promise.resolve<IMuiString>(undefined)
    }

    protected postDelete(id: string): Promise<void> {
        return Promise.resolve<void>(undefined)
    }

    async deleteOne(id: string): Promise<IValidationError[]> {
        try {
            const forbidDelete = await this.canDelete(id)

            if (forbidDelete) {
                return [{ constraint: 'delete', property: '*', message: forbidDelete }]
            }

            const me = await this.getCollection()
            const deleted = await me.deleteOne({ _id: typeof id === 'string' && id })

            if (deleted.deletedCount !== 1) {
                return [{ constraint: 'delete', property: '*', message: { en: 'not found' } }]
            }

            await this.postDelete(id)

            return undefined
        } catch (error) {
            return [{ constraint: 'database', property: '*', message: { en: getMessage(error) } }]
        }
    }
}
