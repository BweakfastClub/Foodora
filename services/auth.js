const bcrypt = require("bcrypt");
const saltRounds = 10;

module.exports.hashPassword = (password, next) => {
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            return next(err);
        }
        console.log(hashedPassword);
        next(null, hashedPassword);
    });
};

module.exports.authorizeLogin = (email, password, hashedPassword, next) => {
    bcrypt.compare(password, hashedPassword, (err, res) => {
        if (err) {
            return next(err);
        }
        if (!res) {
            return next({message: "password is wrong"});
        }

        return next(null);
    });
};
