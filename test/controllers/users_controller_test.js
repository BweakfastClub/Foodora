const chai = require('chai');
const chaiHttp = require('chai-http');
const async = require('async');
const usersRoutes = require('../../index');
const usersModel = require('../../src/models/users_model');
const recipesModel = require('../../src/models/recipes_model');

const should = chai.should();
const { expect } = chai;

chai.use(chaiHttp);

describe('Endpoint tests', () => {
  before((done) => {
    async.parallel({
      recipeSetup: callback => recipesModel.setup(callback),
      userSetup: callback => usersModel.setup(callback),
      addUser1: callback => chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          name: 'user',
          password: '1234',
        })
        .end(callback),
      addUser2: callback => chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'deleteUser@email.com',
          name: 'deleteUser',
          password: '1234',
        })
        .end(callback),
    }, (err, results) => {
      should.not.exist(err);
      results.addUser1.should.have.status(200);
      results.addUser2.should.have.status(200);
      done();
    });
  });

  after((done) => {
    usersModel.clean(done);
  });

  describe('/GET users', () => {
    it('the get users endpoint should exist', (done) => {
      chai.request(usersRoutes)
        .get('/users')
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          done();
        });
    });
  });

  describe('/POST users', () => {
    it('Post user requires name', (done) => {
      chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          password: '1234',
        })
        .end((err, res) => {
          should.exist(err);
          res.should.have.status(400);
          done();
        });
    });

    it('Post user requires email', (done) => {
      chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          name: 'user',
          password: '1234',
        })
        .end((err, res) => {
          should.exist(err);
          res.should.have.status(400);
          done();
        });
    });

    it('Post user requires password', (done) => {
      chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          name: 'user',
        })
        .end((err, res) => {
          should.exist(err);
          res.should.have.status(400);
          done();
        });
    });

    it('Post user successful', (done) => {
      chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'createUser@email.com',
          name: 'createUser',
          password: '1234',
        })
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          done();
        });
    });

    it('Post user fails with email that is already registered', (done) => {
      chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          name: 'user',
          password: '1234',
        })
        .end((err, res) => {
          should.exist(err);
          res.should.have.status(409);
          done();
        });
    });
  });

  describe('login tests', () => {
    it('logs in succesfully after user registration and issues a token', (done) => {
      chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'registerUser@email.com',
          name: 'registerUser',
          password: '1234',
        })
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          chai.request(usersRoutes)
            .post('/users/login')
            .set('content-type', 'application/json')
            .send({
              email: 'registerUser@email.com',
              password: '1234',
            })
            .end((loginErr, loginRes) => {
              should.not.exist(loginErr);
              loginRes.should.have.status(200);
              should.exist(loginRes.body.token);
              done();
            });
        });
    });

    it('logs in failed after with incorrect password', (done) => {
      chai.request(usersRoutes)
        .post('/users/login')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          password: 'wrong_password',
        })
        .end((loginErr, loginRes) => {
          should.exist(loginErr);
          loginRes.should.have.status(401);
          should.not.exist(loginRes.body.token);
          done();
        });
    });

    it('logs in failed after with unregistered user', (done) => {
      chai.request(usersRoutes)
        .post('/users/login')
        .set('content-type', 'application/json')
        .send({
          email: 'wrong_user@email.com',
          password: 'wrong_password',
        })
        .end((loginErr, loginRes) => {
          should.exist(loginErr);
          loginRes.should.have.status(401);
          should.not.exist(loginRes.body.token);
          done();
        });
    });
  });

  describe('/Delete users', () => {
    it('Delete user require password', (done) => {
      chai.request(usersRoutes)
        .del('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'deleteUser@email.com',
        })
        .end((delErr, delRes) => {
          should.exist(delErr);
          delRes.should.have.status(400);
          done();
        });
    });

    it('Delete user require email', (done) => {
      chai.request(usersRoutes)
        .del('/users')
        .set('content-type', 'application/json')
        .send({
          password: '1234',
        })
        .end((delErr, delRes) => {
          should.exist(delErr);
          delRes.should.have.status(400);
          done();
        });
    });

    it('Delete user successfully', (done) => {
      chai.request(usersRoutes)
        .del('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'deleteUser@email.com',
          password: '1234',
        })
        .end((delErr, delRes) => {
          should.not.exist(delErr);
          should.exist(delRes);
          delRes.should.have.status(200);
          done();
        });
    });
  });

  describe('Change user info', () => {
    let userToken = null;
    before((done) => {
      chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'userToBeChanged@email.com',
          name: 'userToBeChanged',
          password: 'passwordToBeChanged',
        })
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(200);
          chai.request(usersRoutes)
            .post('/users/login')
            .set('content-type', 'application/json')
            .send({
              email: 'userToBeChanged@email.com',
              password: 'passwordToBeChanged',
            })
            .end((loginErr, loginRes) => {
              should.not.exist(loginErr);
              loginRes.should.have.status(200);
              should.exist(loginRes.body.token);
              userToken = loginRes.body.token;
              done();
            });
        });
    });

    it('changes the user name successfully', (done) => {
      chai.request(usersRoutes)
        .put('/users/user_info')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({ 
          name: 'New User Name',
          password: 'passwordToBeChanged',
        })
        .end((changeNameErr, changeNameRes) => {
          should.not.exist(changeNameErr);
          changeNameRes.should.have.status(200);
          chai.request(usersRoutes)
            .get('/users/user_info')
            .set('content-type', 'application/json')
            .set('token', userToken)
            .end((userInfoErr, userInfoRes) => {
              should.not.exist(userInfoErr);
              userInfoRes.should.have.status(200);
              expect(userInfoRes.body.name).to.equal('New User Name');
              done();
            });
        });
    });
    it('changes the user password successfully', (done) => {
      chai.request(usersRoutes)
        .put('/users/user_info')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({
           password: 'passwordToBeChanged',
           newPassword: 'New Password' 
          })
        .end((changePasswordErr, changePasswordRes) => {
          should.not.exist(changePasswordErr);
          changePasswordRes.should.have.status(200);
          async.parallel({
            loginWithNewPassword: async.reflect((callback) => {
              chai.request(usersRoutes)
                .post('/users/login')
                .set('content-type', 'application/json')
                .send({
                  email: 'userToBeChanged@email.com',
                  password: 'New Password',
                })
                .end(callback);
            }),
            loginWithOldPassword: async.reflect((callback) => {
              chai.request(usersRoutes)
                .post('/users/login')
                .set('content-type', 'application/json')
                .send({
                  email: 'userToBeChanged@email.com',
                  password: 'passwordToBeChanged',
                })
                .end(callback);
            }),
          }, (err, { loginWithNewPassword, loginWithOldPassword }) => {
            should.not.exist(loginWithNewPassword.error);
            loginWithNewPassword.value.should.have.status(200);
            should.exist(loginWithNewPassword.value.body.token);

            should.exist(loginWithOldPassword.error);
            loginWithOldPassword.error.should.have.status(401);
            done();
          });
        });
    });
  });

  describe('liked recipes tests', () => {
    let userToken = null;

    before((done) => {
      chai.request(usersRoutes)
        .post('/users/login')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          password: '1234',
        })
        .end((loginErr, loginRes) => {
          should.not.exist(loginErr);
          loginRes.should.have.status(200);
          should.exist(loginRes.body.token);
          userToken = loginRes.body.token;
          done();
        });
    });

    it('likes a recipe successfully', (done) => {
      chai.request(usersRoutes)
        .post('/users/liked_recipes')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({ recipeIds: ['1234', '2345', '3456'] })
        .end((likeErr, likeRes) => {
          should.not.exist(likeErr);
          likeRes.should.have.status(200);
          chai.request(usersRoutes)
            .get('/users/user_info')
            .set('content-type', 'application/json')
            .set('token', userToken)
            .end((userInfoErr, userInfoRes) => {
              should.not.exist(userInfoErr);
              userInfoRes.should.have.status(200);
              should.exist(userInfoRes.body.likedRecipes);
              expect(userInfoRes.body.likedRecipes).to.include.members(['1234', '2345', '3456']);
              done();
            });
        });
    });

    it('unlikes a recipe successfully', (done) => {
      chai.request(usersRoutes)
        .post('/users/liked_recipes')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({ recipeIds: ['1234_to_be_deleted', '2345_to_be_deleted', '6666'] })
        .end((likeErr, likeRes) => {
          should.not.exist(likeErr);
          likeRes.should.have.status(200);
          chai.request(usersRoutes)
            .delete('/users/liked_recipes')
            .set('content-type', 'application/json')
            .set('token', userToken)
            .send({ recipeIds: ['1234_to_be_deleted', '2345_to_be_deleted', 'will_not_throw_error'] })
            .end((unlikeRecipeErr, unlikeRecipeRes) => {
              should.not.exist(unlikeRecipeErr);
              unlikeRecipeRes.should.have.status(200);
              chai.request(usersRoutes)
                .get('/users/user_info')
                .set('content-type', 'application/json')
                .set('token', userToken)
                .end((userInfoErr, userInfoRes) => {
                  should.not.exist(userInfoErr);
                  userInfoRes.should.have.status(200);
                  should.exist(userInfoRes.body.likedRecipes);
                  expect(userInfoRes.body.likedRecipes).to.contain('6666');
                  expect(userInfoRes.body.likedRecipes).to.not.have.members(['1234_to_be_deleted', '2345_to_be_deleted']);
                  done();
                });
            });
        });
    });
  });

  describe('user allergy tests', () => {
    let userToken = null;

    before((done) => {
      chai.request(usersRoutes)
        .post('/users/login')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          password: '1234',
        })
        .end((loginErr, loginRes) => {
          should.not.exist(loginErr);
          loginRes.should.have.status(200);
          should.exist(loginRes.body.token);
          userToken = loginRes.body.token;
          done();
        });
    });

    it('add an allergy successfully', (done) => {
      chai.request(usersRoutes)
        .post('/users/allergies')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({ allergies: ['peanuts', 'beef'] })
        .end((allergyErr, allergyRes) => {
          should.not.exist(allergyErr);
          allergyRes.should.have.status(200);
          chai.request(usersRoutes)
            .get('/users/user_info')
            .set('content-type', 'application/json')
            .set('token', userToken)
            .end((userInfoErr, userInfoRes) => {
              should.not.exist(userInfoErr);
              userInfoRes.should.have.status(200);
              should.exist(userInfoRes.body.foodAllergies);
              expect(userInfoRes.body.foodAllergies).to.include.members(['peanuts', 'beef']);
              done();
            });
        });
    });

    it('removes an allergy successfully', (done) => {
      chai.request(usersRoutes)
        .post('/users/allergies')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({ allergies: ['shrimp', 'milk'] })
        .end((addAllergiesErr, addAllergiesRes) => {
          should.not.exist(addAllergiesErr);
          addAllergiesRes.should.have.status(200);
          chai.request(usersRoutes)
            .delete('/users/allergies')
            .set('content-type', 'application/json')
            .set('token', userToken)
            .send({ allergies: ['milk', 'coconut'] })
            .end((deleteAllergiesErr, deleteAllergiesRes) => {
              should.not.exist(deleteAllergiesErr);
              deleteAllergiesRes.should.have.status(200);
              chai.request(usersRoutes)
                .get('/users/user_info')
                .set('content-type', 'application/json')
                .set('token', userToken)
                .end((userInfoErr, userInfoRes) => {
                  should.not.exist(userInfoErr);
                  userInfoRes.should.have.status(200);
                  should.exist(userInfoRes.body.foodAllergies);
                  expect(userInfoRes.body.foodAllergies).to.not.contain('milk');
                  expect(userInfoRes.body.foodAllergies).to.contain('shrimp');
                  done();
                });
            });
        });
    });
  });

  describe('meal plan tests', () => {
    let userToken = null;

    before((done) => {
      chai.request(usersRoutes)
        .post('/users/login')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          password: '1234',
        })
        .end((loginErr, loginRes) => {
          should.not.exist(loginErr);
          loginRes.should.have.status(200);
          should.exist(loginRes.body.token);
          userToken = loginRes.body.token;
          done();
        });
    });

    it('adds recipes to the meal plan successfully', (done) => {
      chai.request(usersRoutes)
        .post('/users/meal_plan')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({ recipeIds: [25449, 237491, 246256] })
        .end((mealPlanErr, mealPlanRes) => {
          should.not.exist(mealPlanErr);
          mealPlanRes.should.have.status(200);
          chai.request(usersRoutes)
            .get('/users/user_info')
            .set('content-type', 'application/json')
            .set('token', userToken)
            .end((userInfoErr, userInfoRes) => {
              should.not.exist(userInfoErr);
              userInfoRes.should.have.status(200);
              should.exist(userInfoRes.body.mealPlan);
              expect(userInfoRes.body.mealPlan).to.include.members([25449, 237491, 246256]);
              done();
            });
        });
    });

    it('ignores adding invalid recipes to the meal plan', (done) => {
      chai.request(usersRoutes)
        .post('/users/meal_plan')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({ recipeIds: [9999999] })
        .end((mealPlanErr, mealPlanRes) => {
          should.not.exist(mealPlanErr);
          mealPlanRes.should.have.status(200);
          chai.request(usersRoutes)
            .get('/users/user_info')
            .set('content-type', 'application/json')
            .set('token', userToken)
            .end((userInfoErr, userInfoRes) => {
              should.not.exist(userInfoErr);
              userInfoRes.should.have.status(200);
              should.exist(userInfoRes.body.mealPlan);
              expect(userInfoRes.body.mealPlan).to.not.include(9999999);
              done();
            });
        });
    });

    it('removes a recipe from the meal plan successfully', (done) => {
      chai.request(usersRoutes)
        .post('/users/meal_plan')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({ recipeIds: [51147, 241000, 237835] })
        .end((addRecipeToMealPlanErr, addRecipeToMealPlanRes) => {
          should.not.exist(addRecipeToMealPlanErr);
          addRecipeToMealPlanRes.should.have.status(200);
          chai.request(usersRoutes)
            .delete('/users/meal_plan')
            .set('content-type', 'application/json')
            .set('token', userToken)
            .send({ recipeIds: [241000, 237835] })
            .end((removeRecipeFromMealPlanErr, removeRecipeFromMealPlanRes) => {
              should.not.exist(removeRecipeFromMealPlanErr);
              removeRecipeFromMealPlanRes.should.have.status(200);
              chai.request(usersRoutes)
                .get('/users/user_info')
                .set('content-type', 'application/json')
                .set('token', userToken)
                .end((userInfoErr, userInfoRes) => {
                  should.not.exist(userInfoErr);
                  userInfoRes.should.have.status(200);
                  should.exist(userInfoRes.body.mealPlan);
                  expect(userInfoRes.body.mealPlan).to.include.members([51147]);
                  expect(userInfoRes.body.mealPlan).to.not.have.members([241000, 237835]);
                  done();
                });
            });
        });
    });
  });
});
