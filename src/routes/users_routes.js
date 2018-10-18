const app = require('express').Router();
const usersController = require('../controllers/users_controller');
const { env } = require('../../config');

if (env !== 'testing') {
  usersController.setUp();
}

app.get('/', usersController.findAllUsers);
app.post('/', usersController.register);
app.delete('/', usersController.deleteUser);

app.post('/login', usersController.login);
app.get('/user_info', usersController.getUserInfo);

app.post('/likes_recipe', usersController.likesRecipe);
app.post('/unlikes_recipe', usersController.unlikesRecipe);
app.post('/allergy', usersController.addAllergy);
app.delete('/allergy', usersController.removeAllergy);

module.exports = app;
