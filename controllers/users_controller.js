const usersModel = require("../models/users_model");

module.exports.setUp = () => {
    usersModel.setup();
};

module.exports.findAllUsers = (req, res) => {
    res.json(usersModel.findAllUsers());
};

module.exports.register = ({body: {name = null, email = null, password = null}}, res) => {
    res.json(usersModel.registerUser(name, email, password));
};

module.exports.login = (req, res) => {
    res.status(200).json({data: "success"});
};
