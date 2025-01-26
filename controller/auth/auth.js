const argon = require("argon2")

async function hashPassword(password, passwordCheck) {
    if (password === passwordCheck) {
        return await argon.hash(password)
    } else {
        return null
    }    
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