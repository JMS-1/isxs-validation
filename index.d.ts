/// <reference path="server.d.ts" />

declare module '@jms-1/isxs-validation' {
    const uniqueId: string

    interface IMuiString {
        [language: string]: string
    }

    interface IValidationScope {
        readonly items?: any
        readonly message?: IMuiString
        readonly properties?: any
    }

    interface IValidatableSchema extends IValidationScope {
        readonly $id: string
    }

    interface IValidationError {
        readonly constraint: string
        readonly message: IMuiString
        readonly property: string
    }

    type KeysOf<T> = keyof T

    interface IFieldSchemaCommon {
        message?: IMuiString
    }

    interface IObjectFieldSchema<TEntity> extends IFieldSchemaCommon {
        additionalProperties?: boolean
        properties: Required<{ [TField in KeysOf<TEntity>]: TFieldSchema<TEntity> }>
        required: KeysOf<TEntity>[]
        type: 'object'
    }

    interface IStringArrayFieldSchema extends IFieldSchemaCommon {
        items: IStringFieldSchema
        type: 'array'
        uniqueItems?: boolean
    }

    interface IObjectArrayFieldSchema extends IFieldSchemaCommon {
        items: IObjectFieldSchema<any>
        type: 'array'
        uniqueItems?: boolean
    }

    interface IStringFieldSchema extends IFieldSchemaCommon {
        maxLength?: number
        minLength?: number
        pattern?: string
        type: 'string'
    }

    interface IIntegerFieldSchema extends IFieldSchemaCommon {
        enum?: number[]
        minimum?: number
        type: 'integer'
    }

    type TFieldSchema<TEntity> =
        | IIntegerFieldSchema
        | IObjectArrayFieldSchema
        | IObjectFieldSchema<TEntity>
        | IStringArrayFieldSchema
        | IStringFieldSchema

    interface ISchema<TEntity> extends IObjectFieldSchema<TEntity> {
        $id: string
        $schema: 'http://json-schema.org/schema#'
    }

    function addSchema<TSchema extends IValidatableSchema>(schema: TSchema): void

    function validate<TSchema extends IValidatableSchema>(object: any, schema: TSchema): IValidationError[]
}
