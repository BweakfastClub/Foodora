const bcrypt = require('bcrypt');

const saltRounds = 10;
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./config');

module.exports.hashPassword = (password, next) => {
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      return next(err);
    }

    return next(null, hashedPassword);
  });
};

module.exports.authorizeLogin = (email, password, userInfo, next) => {
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

module.exports.issueToken = ({ name, email }, next) => {
  const token = jwt.sign({
    email,
    name,
  }, jwtSecret);

  next(null, token);
};

module.exports.verifyToken = (token, next) => {
  jwt.verify(token, jwtSecret, next);
};
