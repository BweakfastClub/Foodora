module.exports = async function () {
  await global.mongod.stop();
};
