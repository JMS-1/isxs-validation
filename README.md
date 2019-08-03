Experimental validation helper based on [JSON Schema definitions](https://json-schema.org) using [DJV](https://www.npmjs.com/package/djv).
Currently only a very basic implementation which allows to convert the Schema to [Mongo's \$jsonSchema](https://docs.mongodb.com/manual/reference/operator/query/jsonSchema).

This is one way to get a common validation system starting at the client (browser app) through the middleware (web server) down to the persistence layer (database). Since there are definitly may different approaches this implementation may eventually disappear as a whole. But for now hers's what it does.

Let' assume we got some very simple entity which will be stored in our (mongodb) database.

```typescript
interface ITestObject {
    _id: string
    name: string
}
```

We would like to always have the **\_id** field set to some unique identifier and the **name** not having more than 10 characters. So we declare the following JSON schema (actually all of the sample here can be found in the [mongodb.ts test script](src/test/mongodb.ts)).

```typescript
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
```

There are methods to manually register the schema and validate against it. But if we want to use MongoDb as the database system the module includes a simple but neat helper class - the way the initialisation code is used in the test environment is a bit weired but appropriate for educational purposes.

```typescript
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
```

Beside some playing around with the database connection (for a near production approach see my [Movie Database Playground](https://github.com/JMS-1/MovieDBNode/blob/master/Server/src/database/utils.ts)) the important point is calling the **initialize** method of the base class. This will not only register the schema for later validation but will in addition convert it to the MongoDb representation and install it inside the database.

```typescript
async initialize(collection: Collection<TType>, database: Db): Promise<void> {
    await this.onInitialize(collection)

    addSchema(this.schema)

    await database.command({ collMod: this.name, validator: { $jsonSchema: convertToMongo(this.schema) } })
}
```

Since the MongoDb validation (which by the way requires 3.6 or later) is a bit of bare metal all modifing operations using base class methods will do an additional validation to get enhanced error messages.

```typescript
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
```

If we want to add some new entity the result will be the list of potential schema violations.

```typescript
const errors = await collection.insertOne({ _id: uuid(), name: 'Das geht aber so leider nicht' })

strict(errors, 'MongoDb: Fehler erwartet')
strict.strictEqual(errors.length, 1, `MongoDb: ungültige Anzahl ${errors.length} von Fehlermeldungen`)
```

In addition the **validate** method may be called explicitly at any time, even in the client. To do so the middleware just has transfer the JSON schema to the client app and there it has to be registered globally using the **addSchema** method.

In the current evaluation state for more or less simple applications this leads to a seamless validation infrastructure throughout all software layers. This will surely not include any issues which can only be validated finally inside the database as for example key violations. But for some applications it may be a big step forward.
