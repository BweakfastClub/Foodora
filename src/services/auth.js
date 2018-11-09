const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./config');

const saltRounds = 10;

module.exports.hashPassword = (password, next) => {
  bcrypt.hash(
    password,
    saltRounds,
    next,
  );
};

module.exports.authorizeLogin = (password, userInfo, next) => {
  bcrypt.compare(password, userInfo.hashedPassword, (err, res) => {
    if (err) {
      return next(err);
    }
    if (!res) {
      return next({ message: 'password is wrong' });
    }

    return next(null, userInfo);
  });
};

module.exports.issueToken = (name, email, next) => {
  const token = jwt.sign({
    email,
    name,
  }, jwtSecret);

  next(null, token);
};

module.exports.verifyToken = (token, next) => {
  jwt.verify(token, jwtSecret, next);
};
