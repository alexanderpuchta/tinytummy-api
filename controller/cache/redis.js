const redis = require("redis")
const client = redis.createClient({

})

client.on("error", (error) => {
    console.log(`redis got error ${error}`)
})

client.connect()

async function get(key) {

    const cached = await client.get(key)

    if (cached) {
        return JSON.parse(cached)
    } else {
        return null
    }
}

async function store(key, value) {
    await client.set(key, JSON.stringify(value))
}

module.exports = {
    client: client,
    methods: {
        get: get,
        store: store
    }
}