const app = require('express').Router()
const usersController = require('../controllers/users_controller')

	app.get('/', usersController.findAllUsers)
    app.post('/', usersController.register)

    app.post('/login', usersController.login)

    app.get('/example', usersController.exampleForQueryingCassandra)

module.exports = app
