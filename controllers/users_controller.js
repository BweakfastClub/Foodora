const usersModel = require('../models/users_model')

module.exports.setUp = () =>{
    usersModel.setup()
};

module.exports.findAllUsers = (req, res) => {
    res.json(usersModel.findAllUsers())
};

module.exports.register = (req, res) => {
    res.status(200).json({data : "success"})
};

module.exports.login = (req, res) => {
    res.status(200).json({data : "success"})
};