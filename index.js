const dotenv = require("dotenv").config
const { createHandler } = require("graphql-http/lib/use/express")
const express = require("express")

const gql = require("./controller/graphql/gql")

const app = express()

const handler = createHandler({
    schema: gql.schema,
    rootValue: gql.rootValue,
    context: async (req, res) => {

        const header = req.headers["authorization"]
        
        return {
            token: header
        }
    }
})

app.all("/graphql", handler)

app.get("/", (req, res) => {
    res.json({
        "status": "OK"
    })
})

app.get("/graphql-io", (_req, res) => {
    res.type("html")
    res.end(gql.ide)
})

app.listen(process.env.PORT, () => {
    console.log(`Running a GraphQL API server at http://localhost:${process.env.PORT}/graphql`)
})
