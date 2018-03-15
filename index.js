const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";

app.use(bodyParser.json());

app.get("/ping", (req, res) => {
    res.json({
        message: "pong"
    });
});

app.get("/mongo_test", (req, res) => {
    mongoClient.connect(url, (err, client) => {
        const adminDb = client.db("test").admin();
        adminDb.listDatabases((err, dbs) => {
            res.json({
                message: dbs
            });
        });
    });
});

app.use("/users", require("./src/routes/users_routes"));
app.use("/recipes", require("./src/routes/recipes_routes"));

app.listen(8080);
module.exports = app;
