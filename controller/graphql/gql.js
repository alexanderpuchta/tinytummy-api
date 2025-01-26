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
        id: Int!
        name: String!
        birth: String!
        gender: String!
    }

    type Credentials {

        firstName: String!
        lastName: String!
        token: String!
    }

    type User {
        id: Int!
        first: String!
        last: String!
        email: String!
        babies: [Baby]
    }

    type Mutation {

        createBaby(name: String!, dateOfBirth: String!, gender: String!): Baby
        deleteBaby(id: Int!): Status

        registerUser(first: String!, last: String!, email: String!, password: String!, passwordCheck: String!): User
        removeUser(id: Int!, password: String!, passwordCheck: String!): Status
    }

    type Query {

        babies: [Baby]
        login(email: String!, password: String!): Credentials
        users: [User]
    }
`)

const root = {
    babies: async (_, context) => {
        
        console.log(user)
        const cached = false // await redis.methods.get("babies")

        if (cached) {
            return cached
        } else {

            const babies = await prisma.baby.findMany({
                where: {
                    parentId: user
                }
            })
            // await redis.methods.store("babies", babies)
            return babies
        }
    },
    login: async ({ email, password }) => {

        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        })

        if (user && await auth.methods.verifyPassword(user.password, password)) {
            return {
                firstName: user.first,
                lastName: user.last,
                token: auth.methods.startSession(user.id)
            }
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
    createBaby: async ({ name, dateOfBirth, gender }, context) => {
        
        const user = await auth.methods.verifySession(context.token)

        await prisma.baby.create({
            data: {
                name: name,
                gender: gender,
                birth: dateOfBirth,
                parentId: user
            }
        })

        return await prisma.baby.findFirst({
            where: {
                name: name,
                parentId: user
            }
        })
    },
    deleteBaby: async ({ id }, context) => {

        const user = await auth.methods.verifySession(context.token)

        await prisma.baby.delete({
            where: {
                id: id,
                parentId: user
            }
        })

        return "okay"
    },
    registerUser: async ({ first, last, email, password, passwordCheck }) => {

        const hash = await auth.methods.hashPassword(password, passwordCheck)

        if (hash) {
            await prisma.user.create({
                data: {
                    first: first,
                    last: last,
                    email: email,
                    password: hash
                }
            })
        } else {
            return null
        }
    },
    removeUser: async ({ id, password, passwordCheck }) => {

        const hash = await auth.methods.hashPassword(password, passwordCheck)

        const user = await prisma.user.findFirst({
            where: {
                id: id
            }
        })

        if (user && password === passwordCheck) {
            if (await auth.methods.verifyPassword(hash, password)) {

                await prisma.user.delete({
                    where: {
                        id: id
                    }
                })

                return "okay"
            }
        }

        return null
    }
}

module.exports = {
    schema: schema,
    rootValue: root,
    ide: ruruHTML({
        endpoint: "/graphql"
    })
}