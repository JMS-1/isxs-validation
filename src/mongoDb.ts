import { IMuiString } from '@jms-1/isxs-validation/common'

interface IMappers {
    [prop: string]: (value: any, target: any, prop: string) => void
}

const dataPropsMapper: IMappers = {
    additionalProperties: copy,
    enum: copy,
    items: arrayElements,
    maxLength: copy,
    message: errorMessage,
    minLength: copy,
    pattern: copy,
    properties: subObject,
    required: copy,
    type: dataType,
    uniqueItems: copy,
}

const schemaPropsMapper: IMappers = {
    $id: discard,
    $schema: discard,
    additionalProperties: copy,
    message: errorMessage,
    properties: subObject,
    required: copy,
    type: dataType,
}

function discard(value: any, target: any, prop: string): void {}

function copy(value: any, target: any, prop: string): void {
    target[prop] = value
}

function dataType(value: string, target: any, prop: string): void {
    switch (value) {
        case 'array':
        case 'object':
        case 'string':
            target.bsonType = value
            break
        case 'integer':
            target.bsonType = 'int'
            break
        default:
            throw new Error(`unsupported data type '${value}'`)
    }
}

function errorMessage(value: IMuiString, target: any, prop: string): void {
    target.description = (value && (value.en || value.de)) || 'failed'
}

function subObject(value: any, target: any, prop: string): void {
    target.properties = {}

    for (let prop in value) {
        if (value.hasOwnProperty(prop)) {
            target.properties[prop] = mapProperties(value[prop], dataPropsMapper)
        }
    }
}

function arrayElements(value: any, target: any, prop: string): void {
    target.items = mapProperties(value, dataPropsMapper)
}

function mapProperties(object: any, mappers: IMappers): any {
    const mongo: any = {}

    for (let prop in object) {
        if (object.hasOwnProperty(prop)) {
            const mapper = mappers[prop]

            if (!mapper) {
                throw new Error(`can not map property '${prop}' to $jsonSchema`)
            }

            mapper(object[prop], mongo, prop)
        }
    }

    return mongo
}

export function convertToMongo(schema: any): any {
    return mapProperties(schema, schemaPropsMapper)
}
