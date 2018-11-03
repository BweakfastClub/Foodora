require('dotenv/config');

const config = {
  env: process.env.NODE_ENV || 'production',
  jwtSecret: process.env.SECRET_KEY ? process.env.SECRET_KEY : 'themagicalkeyboardcatateapotatoandshathimself',
  url: process.env.DB_URL || 'mongodb://localhost:27017',
  dbName: 'mongodb',
};

module.exports = config;
