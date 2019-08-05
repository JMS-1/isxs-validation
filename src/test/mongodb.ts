import { strict } from 'assert'
import { Collection, Db, MongoClient } from 'mongodb'
import { v4 as uuid } from 'uuid'

import { ISchema } from '@jms-1/isxs-validation/common'

import { CollectionBase } from '../collection'
import { uniqueId } from '../common/validation'

interface ITestObject {
    _id: string
    name: string
}

const testSchema: ISchema<ITestObject> = {
    $schema: 'http://json-schema.org/schema#',
    $id: 'http://isxs-validation.test/schemas/mongodbjson',
    additionalProperties: false,
    type: 'object',
    message: { de: 'Objekt unvollständig' },
    properties: {
        _id: {
            message: { de: 'Kennung ungültig' },
            pattern: uniqueId,
            type: 'string',
        },
        name: {
            maxLength: 10,
            message: { de: 'Name nicht angegeben oder zu lang' },
            minLength: 1,
            type: 'string',
        },
    },
    required: ['_id', 'name'],
}

class TestCollection extends CollectionBase<ITestObject> {
    readonly name = 'isxs-validation-test-mongodb'

    readonly schema = testSchema

    constructor(protected readonly _database: Db) {
        super()
    }

    protected getCollection(): Promise<Collection<ITestObject>> {
        return Promise.resolve(this._database.collection(this.name))
    }

    async initializeForTest(): Promise<void> {
        const collection = await this._database.createCollection(this.name)

        return this.initialize(collection, this._database)
    }
}

export async function mongoDbTests(): Promise<void> {
    const client = await MongoClient.connect('mongodb://localhost:27017/isxs-validation-test', {
        auth: { user: 'test', password: 'test' },
        promiseLibrary: Promise,
        useNewUrlParser: true,
    })

    const collection = new TestCollection(client.db())

    await collection.initializeForTest()

    const errors = await collection.insertOne({ _id: uuid(), name: 'Das geht aber so leider nicht' })

    strict(errors, 'MongoDb: Fehler erwartet')
    strict.strictEqual(errors.length, 1, `MongoDb: ungültige Anzahl ${errors.length} von Fehlermeldungen`)

    const name = errors.filter(r => r.property === 'name')
    strict.strictEqual(name.length, 1, `MongoDb: ungültige Anzahl ${name.length} von Fehlermeldungen für name`)
    strict.strictEqual(name[0].constraint, 'maxLength', 'MongoDb: ungültige Meldung für name')

    console.log('MongoDb abgeschlossen')
}
