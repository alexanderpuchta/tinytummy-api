const { createHandler } = require("graphql-http/lib/use/express")
const { buildSchema } = require("graphql")
const { ruruHTML } = require("ruru/server")

const auth = require("../auth/auth")
const prisma = require("../db/prisma")
// const redis = require("../cache/redis")

const schema = buildSchema(`
    enum Status {
       okay
    }
    
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
        deleteBaby(id: Int!): String!
    }

    type Query {

        babies: [Baby]
        login(email: String!, password: String!): User
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
    login: async ({ email, password }) => {

        const hashedPassword = await auth.methods.hashPassword(password)
        const cleanPassword = await auth.methods.verifyPassword(hashedPassword, password)

        return {
            id: 0,
            first: "FAKE",
            last: cleanPassword,
            email: hashedPassword
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

        await prisma.baby.create({
            data: {
                name: name,
                gender: gender,
                birth: dateOfBirth
            }
        })

        return await prisma.baby.findFirst({
            where: {
                name: name
            }
        })
    },
    deleteBaby: async ({ id }) => {

        await prisma.baby.delete({
            where: {
                id: id
            }
        })

        return `${id}`
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