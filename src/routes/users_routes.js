const app = require("express").Router();
const usersController = require("../controllers/users_controller");
const {env} = require("../../config");

// if (env !== "testing") {
//     usersController.setUp();
// }

app.get("/", usersController.findAllUsers);
app.post("/", usersController.register);
app.delete("/", usersController.deleteUser);

app.post("/login", usersController.login);

module.exports = app;
