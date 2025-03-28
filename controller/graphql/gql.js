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
        dateOfBirth: String!
        gender: String!
        nutrition: String
    }

    type Credentials {

        firstName: String!
        lastName: String!
        token: String!
    }

    type User {
        id: Int!
        firstName: String!
        lastName: String!
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
        
        const user = await auth.methods.verifySession(context.token)
        const cached = false // await redis.methods.get("babies")

        if (!user) {
            return new Error("invalid credentials")
        }

        if (cached) {
            return cached
        } else {

            const babies = await prisma.baby.findMany({
                where: {
                    parents: {
                        some: {
                            userId: user
                        }
                    }
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

        console.log(user)

        if (user && await auth.methods.verifyPassword(user.password, password)) {
            return {
                firstName: user.firstName,
                lastName: user.lastName,
                token: auth.methods.startSession(user.id)
            }
        } else {
            return new Error("Could not create session")
        }
    },
    users: async (_, context) => {
        
        const user = await auth.methods.verifySession(context.token)

        if (!user) {
            return new Error("invalid credentials")
        }

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

        if (user) {
            
            const newBaby = await prisma.baby.create({
                data: {
                    name: name,
                    gender: gender,
                    dateOfBirth: new Date(dateOfBirth),
                    parents: {
                        create: [
                            {
                                user: {
                                    connect: {
                                        id: user
                                    }
                                }
                            }
                        ]
                    }
                }
            })

            return await prisma.baby.findFirst({
                where: {
                    id: newBaby.id
                },
                include: {
                    parents: {
                        include: {
                            user: true
                        }
                    }
                }
            })
        } else {
            return new Error("invalid credentials")
        }
    },
    deleteBaby: async ({ id }, context) => {

        const user = await auth.methods.verifySession(context.token)

        if (user) {
            const babies = await prisma.baby.findMany({
                where: {
                    parents: {
                        some: {
                            userId: user
                        }
                    }
                }
            })

            if (babies.some(baby => baby.id === id)) {
                await prisma.baby.delete({
                    where: {
                        id: id
                    }
                })

                return "okay"
            } else {
                return new Error("invalid input")
            }
        } else {
            return new Error("user not found")
        }
    },
    registerUser: async ({ first, last, email, password, passwordCheck }) => {

        const hash = await auth.methods.hashPassword(password, passwordCheck)

        if (hash) {
            await prisma.user.create({
                data: {
                    firstName: first,
                    lastName: last,
                    password: hash,
                    email: email
                }
            })
        } else {
            return new Error("invalid passwords")
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

        return new Error("invalid credentials")
    }
}

module.exports = {
    schema: schema,
    rootValue: root,
    ide: ruruHTML({
        endpoint: "/graphql"
    })
}