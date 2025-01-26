const argon = require("argon2")
const dotenv = require("dotenv").config
const jwt = require("jsonwebtoken")

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

function startSession(id) {
    
    const payload = {
        id: id
    }
    const options = {
        expiresIn: '7d'
    }
    const token = jwt.sign(payload, process.env.SESSION_SECRET, options)

    return token
}

async function verifySession(token) {
    return new Promise((resolve, reject) => {

        const splitted = token.split(" ")[1]

        jwt.verify(splitted, process.env.SESSION_SECRET, function(err, decoded) {

            if (err) {
                reject(new Error("not authorized"))
            }

            resolve(decoded.id)
        })
    })
}

module.exports = {
    methods: {
        hashPassword: hashPassword,
        verifyPassword: verifyPassword,
        startSession: startSession,
        verifySession: verifySession
    }
}