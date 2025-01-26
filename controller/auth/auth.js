const argon = require("argon2")

async function hashPassword(password) {
    return await argon.hash(password)
}


module.exports = {
    methods: {
        hashPassword: hashPassword
    }
}