const hash = require("argon2")

async function hashPassword(password) {
    return await hash(password)
}


module.exports = {
    hash: hashPassword
}