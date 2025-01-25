const dotenv = require("dotenv").config
const express = require("express")

const gql = require("./controller/graphql/gql")

const app = express()

app.all(
    "/graphql",
    gql.handler
)

app.get("/", (req, res) => {
    res.json({
        "msg": "hello"
    })
})

app.get("/graphql-io", (_req, res) => {
    res.type("html")
    res.end(gql.ide)
})

app.listen(process.env.PORT, () => {
    console.log(`Running a GraphQL API server at http://localhost:${process.env.PORT}/graphql`)
})
