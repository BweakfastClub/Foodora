const usersModel = require('../models/users_model')

module.exports.findAllUsers = (req, res) => {
    res.status(200).json({data : "success"})
}

module.exports.exampleForQueryingCassandra = (req, res) => {
	res.json(usersModel.insertAndQueryUser())
}

module.exports.register = (req, res) => {
    res.status(200).json({data : "success"})
}

module.exports.login = (req, res) => {
    res.status(200).json({data : "success"})
}