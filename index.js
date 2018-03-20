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
app.use("/recipes", require("./src/routes/recipes_routes"));

app.listen(8080);
module.exports = app;
