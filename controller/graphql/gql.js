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
        parents: [User]
    }

    type Credentials {

        refreshToken: String
        token: String!
    }

    type User {

        id: Int!
        firstName: String!
        lastName: String!
        email: String!
        babies: [Baby]
        partners: [User]
    }

    type Mutation {

        addPartner(email: String!): Status

        createBaby(name: String!, dateOfBirth: String!, gender: String!): Baby
        deleteBaby(id: Int!): Status

        createUser(first: String!, last: String!, email: String!, password: String!, passwordCheck: String!): User
        deleteUser(id: Int!, password: String!, passwordCheck: String!): Status
    }

    type Query {

        login(email: String!, password: String!): Credentials
        user: User
    }
`)

const root = {
    addPartner: async({ email }, context) => {

        const user = await auth.methods.verifySession(context.token)
        const partner = await prisma.user.findFirst({
            where: {
                email: email
            }
        })

        if (!user) {
            return new Error("not authorized")
        }

        if (!partner) {
            return new Error("partner not found")
        }

        const result = await prisma.user.update({
            where: {
                id: user
            },
            data: {
                partners: {
                    connect: {
                        id: partner.id
                    }
                }
            }
        })

        await prisma.user.update({
            where: {
                id: partner.id
            },
            data: {
                partners: {
                    connect: {
                        id: user
                    }
                }
            }
        })

        if (result) {
            return "okay"
        } else {
            return new Error("something went wrong.")
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
                refreshToken: null,
                token: auth.methods.startSession(user.id)
            }
        } else {
            return new Error("Could not create session")
        }
    },
    user: async (_, context) => {
        
        const id = await auth.methods.verifySession(context.token)

        if (!id) {
            return new Error("invalid credentials")
        }

        const cached = false // await redis.methods.get("users")

        if (cached) {
            return cached
        } else {

            const user = await prisma.user.findFirst({
                where: {
                    id: id
                },
                include: {
                    partners: true,
                    children: {
                        include: {
                            baby: true
                        }
                    }
                }
            })

            return {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                partners: user.partners,
                babies: user.children.map(children => children.baby)
            }
        }
    },
    createBaby: async ({ name, dateOfBirth, gender }, context) => {
        
        const user = await auth.methods.verifySession(context.token)

        if (user) {

            const account = await prisma.user.findUnique({
                where: {
                    id: user
                },
                include: {
                    partners: true
                }
            })
            
            const userConnections = account.partners.map(partner => ({
                id: partner.id
            }))
            userConnections.push({
                id: account.id
            })

            const newBaby = await prisma.baby.create({
                data: {
                    name: name,
                    gender: gender,
                    dateOfBirth: new Date(dateOfBirth),
                    parents: {
                        create: userConnections.map(partner => ({
                            user: {
                                connect: {
                                    id: partner.id
                                }
                            }
                        }))
                    }
                }
            })

            const userId = account.id
            const babyId = newBaby.id
            await prisma.userBaby.upsert({
                where: {
                    userId_babyId: {
                        userId, babyId
                    }
                },
                update: {},
                create: {
                    user: {
                        connect: {
                            id: userId
                        }
                    },
                    baby: {
                        connect: {
                            id: babyId
                        }
                    }
                }
            })

            const baby = await prisma.baby.findFirst({
                where: {
                    id: babyId
                },
                include: {
                    parents: {
                        include: {
                            user: true
                        }
                    }
                }
            })

            return {
                id: baby.id,
                name: baby.name,
                dateOfBirth: baby.dateOfBirth,
                gender: baby.gender,
                nutrition: baby.nutrition,
                parents: baby.parents.map(parent => parent.user)
            }
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
    createUser: async ({ first, last, email, password, passwordCheck }) => {

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
    deleteUser: async ({ id, password, passwordCheck }) => {

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