const chai = require('chai');
const chaiHttp = require('chai-http');
const async = require('async');
const routes = require('../../../index');
const userModel = require('../../../src/models/users_model');
const recipeData = require('../../../data/tests/recipes/recipes.json');
const recipeModel = require('../../../src/models/recipes_model');


const should = chai.should();
const { expect } = chai;

chai.use(chaiHttp);

describe('Endpoints exists for recipes', () => {
  beforeEach((done) => {
    userModel.setup(
      () => recipeModel.setup(recipeData, done),
    );
  });

  afterEach((done) => {
    userModel.clean(
      () => recipeModel.clean(done),
    );
  });

  describe('/GET recipes', () => {
    it('the get recipes endpoint should return a list of all available recipes', (done) => {
      chai.request(routes)
        .get('/recipes')
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });

    it('the get recipes endpoint should return a list of all available recipes with user information when token is provided', (done) => {
      async.auto(
        {
          userRegister: autoCallback => chai.request(routes)
            .post('/users')
            .set('content-type', 'application/json')
            .send({
              email: 'user@email.com',
              name: 'user',
              password: '1234',
            })
            .end(autoCallback),
          getRecipesWithToken: [
            'userRegister',
            ({ userRegister: { body: { token } } }, autoCallback) => chai.request(routes)
              .get('/recipes')
              .set('token', token)
              .end(autoCallback),
          ],
        },
        (err, { getRecipesWithToken }) => {
          should.not.exist(err);
          getRecipesWithToken.should.have.status(200);
          getRecipesWithToken.body.should.be.a('array');
          getRecipesWithToken.body.forEach((recipe) => {
            should.exist(recipe.userSpecificInformation);
          });
          done();
        },
      );
    });
  });

  describe('/POST search/filter recipes', () => {
    it('should return a list of recipes with a keyword and caloric filter', (done) => {
      chai.request(routes)
        .post('/recipes/search')
        .set('content-type', 'application/json')
        .send({
          query: {
            'nutrition.calories.amount': {
              $lt: 500,
            },
          },
        })
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.forEach((recipe) => {
            expect(recipe.nutrition.calories.amount).to.be.below(500);
          });
          done();
        });
    });

    it('should return a list of recipes with a keyword search', (done) => {
      chai.request(routes)
        .post('/recipes/search')
        .set('content-type', 'application/json')
        .send({
          query: {
            $text: {
              $search: 'pork',
            },
          },
        })
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });

    it('should return a list of recipes with empty keyword search', (done) => {
      chai.request(routes)
        .post('/recipes/search')
        .set('content-type', 'application/json')
        .send({
          query: {
            $text: {
              $search: '',
            },
          },
        })
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          res.body.should.be.a('array');
          // eslint-disable-next-line no-unused-expressions
          expect(res.body).to.be.empty;
          done();
        });
    });

    it('should return a list of recipes with caloric filter', (done) => {
      chai.request(routes)
        .post('/recipes/search')
        .set('content-type', 'application/json')
        .send({
          query: {
            'nutrition.calories.amount': {
              $lt: 500,
            },
          },
        })
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.forEach((recipe) => {
            expect(recipe.nutrition.calories.amount).to.be.below(500);
          });
          done();
        });
    });
  });

  describe('/GET recipe by Id', () => {
    it('get recipe by Id should return an existing recipe', (done) => {
      chai.request(routes)
        .get('/recipes/id/25449')
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          expect(res.body.id).to.equal(25449);
          done();
        });
    });

    it('get recipe by Id should return null for non existing recipe', (done) => {
      chai.request(routes)
        .get('/recipes/id/0')
        .end((err, res) => {
          res.should.have.status(200);
          should.not.exist(err);
          should.not.exist(res.body);
          done();
        });
    });

    it('the get recipes by Id should return null for non existing recipe for logged in user', (done) => {
      async.auto(
        {
          userRegister: autoCallback => chai.request(routes)
            .post('/users')
            .set('content-type', 'application/json')
            .send({
              email: 'user@email.com',
              name: 'user',
              password: '1234',
            })
            .end(autoCallback),
          getRecipeWithToken: [
            'userRegister',
            ({ userRegister: { body: { token } } }, autoCallback) => chai.request(routes)
              .get('/recipes/id/0')
              .set('token', token)
              .end(autoCallback),
          ],
        },
        (err, { getRecipeWithToken }) => {
          should.not.exist(err);
          getRecipeWithToken.should.have.status(200);
          should.not.exist(getRecipeWithToken.body);
          done();
        },
      );
    });

    it('the get recipes endpoint should return a list of all available recipes with user information when token is provided', (done) => {
      async.auto(
        {
          userRegister: autoCallback => chai.request(routes)
            .post('/users')
            .set('content-type', 'application/json')
            .send({
              email: 'user@email.com',
              name: 'user',
              password: '1234',
            })
            .end(autoCallback),
          getRecipeWithToken: [
            'userRegister',
            ({ userRegister: { body: { token } } }, autoCallback) => chai.request(routes)
              .get('/recipes/id/25449')
              .set('token', token)
              .end(autoCallback),
          ],
        },
        (err, { getRecipeWithToken }) => {
          should.not.exist(err);
          getRecipeWithToken.should.have.status(200);
          expect(getRecipeWithToken.body.id).to.equal(25449);
          should.exist(getRecipeWithToken.body.userSpecificInformation);
          expect(getRecipeWithToken.body.userSpecificInformation.likedRecipes).to.equal(false);
          /* eslint-disable no-unused-expressions */
          expect(getRecipeWithToken.body.userSpecificInformation.mealPlan).to.be.empty;
          done();
        },
      );
    });
  });

  describe('/Get random recipes', () => {
    it('gets 1 random recipes', (done) => {
      chai.request(routes)
        .get('/recipes/random?recipes=1')
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(1);
          done();
        });
    });

    it('gets 10 random recipes', (done) => {
      chai.request(routes)
        .get('/recipes/random?recipes=10')
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(10);
          done();
        });
    });

    it('gets 50 random recipes', (done) => {
      chai.request(routes)
        .get('/recipes/random?recipes=50')
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(50);
          done();
        });
    });
  });

  describe('/GET top recipes', () => {
    it('gets 8 random recipes as suggestion if there are not 8 top liked recipes', (done) => {
      chai.request(routes)
        .get('/recipes/top_recipes')
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(8);
          done();
        });
    });

    it('gets the top 8 liked recipes', (done) => {
      async.auto({
        user1Register: callback => chai.request(routes)
          .post('/users')
          .set('content-type', 'application/json')
          .send({
            email: 'user1@email.com',
            name: 'user1',
            password: '1234',
          })
          .end(callback),
        user2Register: callback => chai.request(routes)
          .post('/users')
          .set('content-type', 'application/json')
          .send({
            email: 'user2@email.com',
            name: 'user2',
            password: '1234',
          })
          .end(callback),
        user1Login: ['user1Register', (results, callback) => chai.request(routes)
          .post('/users/login')
          .set('content-type', 'application/json')
          .send({
            email: 'user1@email.com',
            password: '1234',
          })
          .end(callback)],
        user2Login: ['user2Register', (results, callback) => chai.request(routes)
          .post('/users/login')
          .set('content-type', 'application/json')
          .send({
            email: 'user2@email.com',
            password: '1234',
          })
          .end(callback)],
        user1LikeRecipes: ['user1Login', ({ user1Login: { body: { token } } }, callback) => {
          chai.request(routes)
            .post('/users/liked_recipes')
            .set('content-type', 'application/json')
            .set('token', token)
            .send({ recipeIds: [151266, 237491, 231170, 26692, 139012, 20669, 33474, 246255] })
            .end(callback);
        }],
        user2LikeRecipes: ['user2Login', ({ user2Login: { body: { token } } }, callback) => chai.request(routes)
          .post('/users/liked_recipes')
          .set('content-type', 'application/json')
          .set('token', token)
          .send({ recipeIds: [151266, 237491, 231170, 26692, 139012, 20669, 33474, 246255] })
          .end(callback)],
        getTopRecipes: ['user1LikeRecipes', 'user2LikeRecipes', (results, callback) => chai.request(routes)
          .get('/recipes/top_recipes')
          .set('content-type', 'application/json')
          .end(callback)],
      }, (err, { getTopRecipes }) => {
        should.not.exist(err);
        getTopRecipes.should.have.status(200);
        expect(getTopRecipes.body).to.be.an('array');
        expect(getTopRecipes.body.length).to.equal(8);
        const ids = getTopRecipes.body.map(recipe => recipe.id);
        expect(ids).to.have.members([151266, 237491, 231170, 26692, 139012, 20669, 33474, 246255]);
        done();
      });
    });
  });
});
