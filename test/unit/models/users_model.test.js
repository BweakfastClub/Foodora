const { MongoClient } = require('mongodb');
const rewire = require('rewire');
const { url, dbName } = require('../../../config');

const usersModel = rewire('../../../src/models/users_model');
/* eslint-disable no-underscore-dangle */
const storeUser = usersModel.__get__('storeUser');

describe('create new users', () => {
  let client;
  let db;
  let users;

  beforeAll(async () => {
    client = await MongoClient.connect(url);
    db = await client.db(dbName);
    users = db.collection('users');
  });

  afterAll(async () => {
    await db.clean();
  });

  it('user is created successfully', async () => {
    const email = 'user@email.com';
    const name = 'user';
    const password = '1234';

    await storeUser(client, users, name, email, password, (err) => {
      expect(err).toBeNull();
    });

    users.findOne({ email }, (err, userInfo) => {
      expect(err).toBeNull();
      expect(userInfo.email).toEqual(email);
      expect(userInfo.name).toEqual(name);
      expect(userInfo.hashedPassword).toEqual(password);
    });
  });
});
