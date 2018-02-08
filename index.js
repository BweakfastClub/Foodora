const express = require("express");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.get("/ping", (req, res) => {
    res.json({
        message: "pong"
    });
});

app.use("/users", require("./src/routes/users_routes"));
module.exports = app;
app.listen(8080);
