const argon = require("argon2")

async function hashPassword(password) {
    return await argon.hash(password)
}

async function verifyPassword(hash, password) {
    return await argon.verify(hash, password)
}

module.exports = {
    methods: {
        hashPassword: hashPassword,
        verifyPassword: verifyPassword
    }
}