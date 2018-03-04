const app = require("express").Router();
const usersController = require("../controllers/users_controller");
const config = require("../../config");

if (config.env !== "testing") {
    usersController.setUp();
}

app.get("/", usersController.findAllUsers);
app.post("/", usersController.register);
app.delete("/", usersController.deleteUser);

app.post("/login", usersController.login);

module.exports = app;
