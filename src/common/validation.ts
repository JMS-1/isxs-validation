import * as djv from 'djv'

import * as common from '@jms-1/isxs-validation'

export const uniqueId = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

const validation = new djv()

export function addSchema<TSchema extends common.IValidatableSchema>(schema: TSchema): void {
    function errorHandler(errorType: string): string {
        let scope: common.IValidationScope = schema

        const props: string[] = []

        for (let prop of this.data.slice(1)) {
            const testProp = /^\[decodeURIComponent\(['"]([^'"]+)['"]\)\]$/.exec(prop)
            const isProp = testProp && testProp[1]

            if (isProp) {
                props.push(`"${isProp}"`)

                scope = (scope.properties || (scope.items && scope.items.properties) || {})[isProp] || {}
            } else {
                const testIndex = /^\[(i\d+)\]$/.exec(prop)

                if (testIndex && props.length > 0) {
                    props[props.length - 1] += `+"["+${testIndex[1]}+"]"`
                }
            }
        }

        const command = `{
            errors.push({
                constraint: "${errorType}",
                property: ${props.join("+'.'+") || "'*'"},
                message: ${JSON.stringify(scope.message || { en: 'failed' })}
            }); }`

        return command
    }

    validation.setErrorHandler(errorHandler)
    validation.addSchema(schema.$id, schema)

    validation.setErrorHandler(undefined)
}

export function validate<TSchema extends common.IValidatableSchema>(
    object: any,
    schema: TSchema
): common.IValidationError[] {
    try {
        return <any>validation.validate(schema.$id, object)
    } catch (error) {
        return [
            {
                constraint: 'validator',
                message: { en: typeof error === 'string' ? error : error.message || 'failed' },
                property: '*',
            },
        ]
    }
}
