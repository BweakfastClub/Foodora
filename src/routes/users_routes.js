const app = require("express").Router();
const usersController = require("../controllers/users_controller");

app.get("/", usersController.findAllUsers);
app.post("/", usersController.register);
app.delete("/", usersController.deleteUser);

app.get("/user_info", usersController.getUserInfo);

app.post("/login", usersController.login);

app.post("/likes_recipe", usersController.likesRecipe);
module.exports = app;
