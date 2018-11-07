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
  before((done) => {
    userModel.setup(
      recipeModel.setup(recipeData, done),
    );
  });

  after((done) => {
    recipeModel.clean(done);
  });

  describe('/GET recipes', () => {
    it('the get recipes endpoint should exist', (done) => {
      chai.request(routes)
        .get('/recipes')
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          done();
        });
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

  describe('/GET recipes by Id', () => {
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
