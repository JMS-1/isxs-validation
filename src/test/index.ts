import { mongoDbTests } from './mongodb'
import { testSimpleSchema } from './simpleSchema'

async function runTests(): Promise<void> {
    testSimpleSchema()

    await mongoDbTests()
}

runTests()
    .then(
        () => {
            console.log('alle Tests durchgeführt')
            process.exit(0)
        },
        err => {
            console.log(err)
            process.exit(1)
        }
    )
    .catch(err => {
        console.log(err)
        process.exit(2)
    })
