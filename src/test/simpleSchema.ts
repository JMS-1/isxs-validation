import { strict } from 'assert'

import { ISchema } from '@jms-1/isxs-validation'

import { addSchema, uniqueId, validate } from '../validation'

interface ITest {
    _id: string
    name: string
    type: number
    description?: string
}

const testSchema: ISchema<ITest> = {
    $schema: 'http://json-schema.org/schema#',
    $id: 'http://isxs-validation.test/schemas/simple-schema.json',
    additionalProperties: false,
    type: 'object',
    message: { de: 'Objekt unvollständig' },
    properties: {
        _id: {
            message: { de: 'Kennung ungültig' },
            pattern: uniqueId,
            type: 'string',
        },
        description: {
            maxLength: 2000,
            message: { de: 'Beschreibung ist zu lang' },
            type: 'string',
        },
        name: {
            maxLength: 50,
            message: { de: 'Name nicht angegeben oder zu lang' },
            minLength: 1,
            type: 'string',
        },
        type: {
            message: { de: 'Art fehlt oder ist unzulässig' },
            type: 'integer',
            enum: [13, 17, 22],
        },
    },
    required: ['_id', 'name', 'type'],
}

export function testSimpleSchema(): void {
    addSchema(testSchema)

    const results = validate(
        {
            _id: 'test',
            description: 'Jochen',
            name: 'Dieser Name ist einfach zu lang für das Schema und wird als fehlerhaft gemeldet.',
            type: 42,
        },
        testSchema
    )
    strict(results, 'einfaches Schema: Fehler erwartet')
    strict.strictEqual(results.length, 3, `einfaches Schema: ungültige Anzahl ${results.length} von Fehlermeldungen`)

    const _id = results.filter(r => r.property === '_id')
    strict.strictEqual(_id.length, 1, `einfaches Schema: ungültige Anzahl ${_id.length} von Fehlermeldungen für _id`)
    strict.strictEqual(_id[0].message.de, 'Kennung ungültig', 'einfaches Schema: ungültige Meldung für _id')

    const type = results.filter(r => r.property === 'type')
    strict.strictEqual(type.length, 1, `einfaches Schema: ungültige Anzahl ${type.length} von Fehlermeldungen für type`)
    strict.strictEqual(
        type[0].message.de,
        'Art fehlt oder ist unzulässig',
        'einfaches Schema: ungültige Meldung für type'
    )

    const name = results.filter(r => r.property === 'name')
    strict.strictEqual(name.length, 1, `einfaches Schema: ungültige Anzahl ${name.length} von Fehlermeldungen für name`)
    strict.strictEqual(
        name[0].message.de,
        'Name nicht angegeben oder zu lang',
        'einfaches Schema: ungültige Meldung für name'
    )

    console.log('einfaches Schema abgeschlossen')
}
