import { Collection, FilterQuery, Db } from 'mongodb'

export const uniqueId: string

export interface IValidationScope {
    readonly items?: any
    readonly message?: string
    readonly properties?: any
}

export interface IValidatableSchema extends IValidationScope {
    readonly $id: string
}

export interface IValidationError {
    readonly constraint: string
    readonly message: string
    readonly property: string
}

export type KeysOf<T> = keyof T

export interface IFieldSchemaCommon {
    message?: string
}

export interface IObjectFieldSchema<TEntity> extends IFieldSchemaCommon {
    additionalProperties?: boolean
    properties: Required<{ [TField in KeysOf<TEntity>]: TFieldSchema<TEntity> }>
    required: KeysOf<TEntity>[]
    type: 'object'
}

export interface IStringArrayFieldSchema extends IFieldSchemaCommon {
    items: IStringFieldSchema
    type: 'array'
    uniqueItems?: boolean
}

export interface IObjectArrayFieldSchema extends IFieldSchemaCommon {
    items: IObjectFieldSchema<any>
    type: 'array'
    uniqueItems?: boolean
}

export interface IStringFieldSchema extends IFieldSchemaCommon {
    maxLength?: number
    minLength?: number
    pattern?: string
    type: 'string'
}

export interface IIntegerFieldSchema extends IFieldSchemaCommon {
    enum?: number[]
    minimum?: number
    type: 'integer'
}

export type TFieldSchema<TEntity> =
    | IIntegerFieldSchema
    | IObjectArrayFieldSchema
    | IObjectFieldSchema<TEntity>
    | IStringArrayFieldSchema
    | IStringFieldSchema

export interface ISchema<TEntity> extends IObjectFieldSchema<TEntity> {
    $id: string
    $schema: 'http://json-schema.org/schema#'
}

export function convertToMongo(schema: any): any

export function addSchema<TSchema extends IValidatableSchema>(schema: TSchema): void

export function validate<TSchema extends IValidatableSchema>(object: any, schema: TSchema): IValidationError[]

export abstract class CollectionBase<TType extends { _id: string }> {
    abstract readonly name: string

    abstract readonly schema: IValidatableSchema

    protected abstract getCollection(): Promise<Collection<TType>>

    protected onInitialize(collection: Collection<TType>): Promise<void>

    protected canDelete(id: string): Promise<string>

    protected postDelete(id: string): Promise<void>

    initialize(collection: Collection<TType>, database: Db): Promise<void>

    insertOne(item: TType): Promise<IValidationError[]>

    findOneAndReplace(item: TType): Promise<IValidationError[]>

    find(filter?: FilterQuery<TType>, sort?: object, project?: object): Promise<TType[]>

    findOne(id: string): Promise<TType>

    deleteOne(id: string): Promise<IValidationError[]>
}
