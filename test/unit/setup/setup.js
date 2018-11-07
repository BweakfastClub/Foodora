const { MongoMemoryServer } = require('mongodb-memory-server');

const mongoDb = new MongoMemoryServer();

const mongoServer = new MongoMemoryServer({
  autoStart: false,
});

module.exports = async () => {
  if (!mongoDb.isRunning) {
    await mongoDb.start();
  }

  // Set reference to mongoDb in order to close the server during teardown.
  global.mongod = mongoServer;
};
