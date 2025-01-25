const { createHandler } = require("graphql-http/lib/use/express")
const { buildSchema } = require("graphql")
const { ruruHTML } = require("ruru/server")

const prisma = require("../db/prisma")
// const redis = require("../cache/redis")

const schema = buildSchema(`
    type Baby {
        id: Int
        name: String
        birth: String
        gender: String
    }

    type User {
        id: Int
        first: String
        last: String
        email: String
    }

    type Mutation {
        createBaby(name: String!, dateOfBirth: String!, gender: String!): Baby!
    }

    type Query {
        babies: [Baby]
        users: [User]
    }
`)

const root = {
    async babies() {
        
        const cached = false // await redis.methods.get("babies")

        if (cached) {
            return cached
        } else {

            const babies = await prisma.baby.findMany()
            // await redis.methods.store("babies", babies)
            return babies
        }
    },
    async users() {
        
        const cached = false // await redis.methods.get("users")

        if (cached) {
            return cached
        } else {

            const users = await prisma.user.findMany()
            // await redis.methods.store("users", users)
            return users
        }
    },
    createBaby: async ({ name, dateOfBirth, gender }) => {

        const babies = await prisma.baby.findMany()

        const newBaby = {
            id: babies.length,
            name: name,
            date: dateOfBirth,
            gender: gender
        }

        await prisma.baby.create({
            data: newBaby
        })

        return newBaby
    }
}

const handler = createHandler({
    schema: schema,
    rootValue: root
})

module.exports = {
    handler: handler,
    ide: ruruHTML({
        endpoint: "/graphql"
    })
}