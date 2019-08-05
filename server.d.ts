declare module '@jms-1/isxs-validation' {
    import { Collection, FilterQuery, Db } from 'mongodb'

    import { IValidatableSchema, IMuiString, IValidationError } from '@jms-1/isxs-validation'

    function convertToMongo(schema: any): any

    abstract class CollectionBase<TType extends { _id: string }> {
        abstract readonly name: string

        abstract readonly schema: IValidatableSchema

        protected abstract getCollection(): Promise<Collection<TType>>

        protected onInitialize(collection: Collection<TType>): Promise<void>

        protected canDelete(id: string): Promise<IMuiString>

        protected postDelete(id: string): Promise<void>

        initialize(collection: Collection<TType>, database: Db): Promise<void>

        insertOne(item: TType): Promise<IValidationError[]>

        findOneAndReplace(item: TType): Promise<IValidationError[]>

        find(filter?: FilterQuery<TType>, sort?: object, project?: object): Promise<TType[]>

        findOne(id: string): Promise<TType>

        deleteOne(id: string): Promise<IValidationError[]>
    }
}
