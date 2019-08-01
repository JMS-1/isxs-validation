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

export function convertToMongo(schema: any): any

export function addSchema<TSchema extends IValidatableSchema>(schema: TSchema): void

export function validate<TSchema extends IValidatableSchema>(object: any, schema: TSchema): IValidationError[]
