const { MongoClient } = require('mongodb');
const rewire = require('rewire');
const { url, dbName } = require('../../../config');

const usersModel = rewire('../../../src/models/users_model');
/* eslint-disable no-underscore-dangle */
const storeUser = usersModel.__get__('storeUser');
const deleteUser = usersModel.__get__('deleteUser');
const likesRecipes = usersModel.__get__('likesRecipes');
const unlikesRecipes = usersModel.__get__('unlikesRecipes');
const countLikedRecipes = usersModel.__get__('countLikedRecipes');
const selectAllUsers = usersModel.__get__('selectAllUsers');
const fetchUserInfo = usersModel.__get__('fetchUserInfo');
const addAllergies = usersModel.__get__('addAllergies');
const removeAllergies = usersModel.__get__('removeAllergies');

describe('Users model unit tests', () => {
  let client;
  let db;
  let users;

  beforeAll(async () => {
    client = await MongoClient.connect(url);
    db = await client.db(dbName);
    users = db.collection('users');

    // create user
    const email = 'user@email.com';
    const name = 'user';
    const password = '1234';

    await storeUser(users, name, email, password);

    // like recipes
    await likesRecipes(users, email, [151266, 237491, 231170, 26692, 139012, 20669, 33474, 246255]);

    // add allergies
    await addAllergies(users, email, ['shrimp']);
  });

  afterAll(async () => {
    await db.clean();
  });

  describe('selectAllUsers unit tests', () => {
    it('selectAllUsers gets all user', async () => {
      selectAllUsers(users, (err, res) => {
        expect(err).toBeNull();
        expect(res).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              email: 'user@email.com',
            }),
          ]),
        );
      });
    });
  });

  describe('countLikedRecipes unit tests', () => {
    it('countLikedRecipes get counts of liked recipes', async () => {
      countLikedRecipes(users, (err, recipes) => {
        expect(err).toBeNull();

        expect(recipes).toMatchObject(
          {
            20669: 1,
            26692: 1,
            33474: 1,
            139012: 1,
            151266: 1,
            231170: 1,
            237491: 1,
            246255: 1,
          },
        );
      });
    });
  });

  describe('deleteUser unit tests', () => {
    it('user is deleted successfully', async () => {
      // create user
      const email = 'deleteUser@email.com';
      const name = 'deleteUser';
      const password = '1234';

      await storeUser(users, name, email, password);

      await deleteUser(users, { email }, (err, res) => {
        expect(err).toBeNull();
        expect(res.email).toBe(email);
      });
    });
  });

  describe('storeUser unit tests', () => {
    it('user is created successfully', async () => {
      const email = 'storeUser@email.com';
      const name = 'storeUser';
      const password = '1234';

      await storeUser(users, name, email, password, (err) => {
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

  describe('fetchUserInfo unit tests', () => {
    it('information is fetched successfully', async () => {
      const email = 'storeUser@email.com';
      const name = 'storeUser';
      const password = '1234';

      await fetchUserInfo(users, email, (err, userInfo) => {
        expect(err).toBeNull();
        expect(userInfo.email).toEqual(email);
        expect(userInfo.name).toEqual(name);
        expect(userInfo.hashedPassword).toEqual(password);
      });
    });
  });

  describe('likesRecipes unit tests', () => {
    it('recipe is liked successfully', async () => {
      const email = 'user@email.com';
      const recipes = [25549, 27055];

      await likesRecipes(users, email, recipes, (err, { value }) => {
        expect(err).toBeNull();
        expect(value.likedRecipes).toEqual(
          expect.arrayContaining([
            25549, 27055,
          ]),
        );
      });
    });
  });

  describe('unlikesRecipes unit tests', () => {
    it('recipe is unliked successfully', async () => {
      const email = 'user@email.com';
      const recipes = [151266, 237491];

      await unlikesRecipes(users, email, recipes, (err, { value }) => {
        expect(err).toBeNull();
        expect(value.likedRecipes).toEqual(
          expect.not.arrayContaining([
            151266, 237491,
          ]),
        );
      });
    });
  });

  describe('addAllergies unit tests', () => {
    it('recipe is liked successfully', async () => {
      const email = 'user@email.com';
      const allergies = ['peanuts', 'beef'];

      await addAllergies(users, email, allergies, (err, { value }) => {
        expect(err).toBeNull();
        expect(value.likedRecipes).toEqual(
          expect.arrayContaining([
            'peanuts', 'beef',
          ]),
        );
      });
    });
  });

  describe('removeAllergies unit tests', () => {
    it('recipe is unliked successfully', async () => {
      const email = 'user@email.com';
      const allergies = ['shrimps'];

      await removeAllergies(users, email, allergies, (err, { value }) => {
        expect(err).toBeNull();
        expect(value.likedRecipes).toEqual(
          expect.not.arrayContaining([
            'shrimps',
          ]),
        );
      });
    });
  });
});
