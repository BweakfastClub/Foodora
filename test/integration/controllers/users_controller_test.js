const chai = require('chai');
const chaiHttp = require('chai-http');
const async = require('async');
const recipesData = require('../../../data/recipes/recipes.json');
const usersRoutes = require('../../../index');
const usersModel = require('../../../src/models/users_model');
const recipesModel = require('../../../src/models/recipes_model');

const should = chai.should();
const { expect } = chai;

chai.use(chaiHttp);

describe('Endpoint tests', () => {
  before((done) => {
    usersModel.setup(
      recipesModel.setup(recipesData, done),
    );
  });

  describe('/POST users', () => {
    before((done) => {
      async.parallel({
        addUser: callback => chai.request(usersRoutes)
          .post('/users')
          .set('content-type', 'application/json')
          .send({
            email: 'user@email.com',
            name: 'user',
            password: '1234',
          })
          .end(callback),
      }, (err, results) => {
        should.not.exist(err);
        results.addUser.should.have.status(200);
        done();
      });
    });

    after((done) => {
      usersModel.clean(done);
    });

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
          should.exist(res.body.token);
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
    before((done) => {
      async.parallel({
        addUser: callback => chai.request(usersRoutes)
          .post('/users')
          .set('content-type', 'application/json')
          .send({
            email: 'user@email.com',
            name: 'user',
            password: '1234',
          })
          .end(callback),
      }, (err, results) => {
        should.not.exist(err);
        results.addUser.should.have.status(200);
        done();
      });
    });

    after((done) => {
      usersModel.clean(done);
    });

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

  describe('/DELETE users', () => {
    before((done) => {
      async.parallel({
        userSetup: callback => usersModel.setup(callback),
        addUser: callback => chai.request(usersRoutes)
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
        results.addUser.should.have.status(200);
        done();
      });
    });

    after((done) => {
      usersModel.clean(done);
    });

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
    beforeEach((done) => {
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

    afterEach((done) => {
      usersModel.clean(done);
    });

    it('changing user info must include correct password', (done) => {
      chai.request(usersRoutes)
        .put('/users/user_info')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({
          name: 'New User Name',
        })
        .end((changeNameErr, changeNameRes) => {
          should.exist(changeNameErr);
          changeNameRes.should.have.status(401);
          chai.request(usersRoutes)
            .get('/users/user_info')
            .set('content-type', 'application/json')
            .set('token', userToken)
            .end((userInfoErr, userInfoRes) => {
              should.not.exist(userInfoErr);
              userInfoRes.should.have.status(200);
              expect(userInfoRes.body.name).to.not.equal('New User Name');
              expect(userInfoRes.body.name).to.equal('userToBeChanged');
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
        .end((changeUserInfoErr, changeUserInfoRes) => {
          should.not.exist(changeUserInfoErr);
          changeUserInfoRes.should.have.status(200);
          async.parallel({
            loginWithOriginalPassword: async.reflect((callback) => {
              chai.request(usersRoutes)
                .post('/users/login')
                .set('content-type', 'application/json')
                .send({
                  email: 'userToBeChanged@email.com',
                  password: 'passwordToBeChanged',
                })
                .end(callback);
            }),
            getUserInfo: async.reflect((callback) => {
              chai.request(usersRoutes)
                .get('/users/user_info')
                .set('content-type', 'application/json')
                .set('token', userToken)
                .end(callback);
            }),
          }, (err, { loginWithOriginalPassword, getUserInfo }) => {
            should.not.exist(loginWithOriginalPassword.error);
            loginWithOriginalPassword.value.should.have.status(200);
            should.exist(loginWithOriginalPassword.value.body.token);

            should.not.exist(getUserInfo.error);
            getUserInfo.value.should.have.status(200);
            expect(getUserInfo.value.body.name).to.equal('New User Name');
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
          newPassword: 'New Password',
        })
        .end((changeUserInfoErr, changeUserInfoRes) => {
          should.not.exist(changeUserInfoErr);
          changeUserInfoRes.should.have.status(200);
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
            getUserInfo: async.reflect((callback) => {
              chai.request(usersRoutes)
                .get('/users/user_info')
                .set('content-type', 'application/json')
                .set('token', userToken)
                .end(callback);
            }),
          }, (err, { loginWithNewPassword, loginWithOldPassword, getUserInfo }) => {
            should.not.exist(loginWithNewPassword.error);
            loginWithNewPassword.value.should.have.status(200);
            should.exist(loginWithNewPassword.value.body.token);

            should.exist(loginWithOldPassword.error);
            loginWithOldPassword.error.should.have.status(401);

            should.not.exist(getUserInfo.error);
            getUserInfo.value.should.have.status(200);
            expect(getUserInfo.value.body.name).to.equal('userToBeChanged');
            done();
          });
        });
    });

    it('changes the user password and name successfully', (done) => {
      chai.request(usersRoutes)
        .put('/users/user_info')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({
          password: 'passwordToBeChanged',
          newPassword: 'New Password',
          name: 'New Username',
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
            getUserInfo: async.reflect((callback) => {
              chai.request(usersRoutes)
                .get('/users/user_info')
                .set('content-type', 'application/json')
                .set('token', userToken)
                .end(callback);
            }),
          }, (err, { loginWithNewPassword, loginWithOldPassword, getUserInfo }) => {
            should.not.exist(loginWithNewPassword.error);
            loginWithNewPassword.value.should.have.status(200);
            should.exist(loginWithNewPassword.value.body.token);

            should.exist(loginWithOldPassword.error);
            loginWithOldPassword.error.should.have.status(401);

            should.not.exist(getUserInfo.error);
            getUserInfo.value.should.have.status(200);
            expect(getUserInfo.value.body.name).to.equal('New Username');
            done();
          });
        });
    });

    it('leaves the username and password unchanged if not inclued in request', (done) => {
      chai.request(usersRoutes)
        .put('/users/user_info')
        .set('content-type', 'application/json')
        .set('token', userToken)
        .send({
          password: 'passwordToBeChanged',
        })
        .end((changeUserInfoErr, changeUserInfoRes) => {
          should.exist(changeUserInfoErr);
          changeUserInfoRes.should.have.status(400);
          async.parallel({
            loginWithOriginalPassword: async.reflect((callback) => {
              chai.request(usersRoutes)
                .post('/users/login')
                .set('content-type', 'application/json')
                .send({
                  email: 'userToBeChanged@email.com',
                  password: 'passwordToBeChanged',
                })
                .end(callback);
            }),
            getUserInfo: async.reflect((callback) => {
              chai.request(usersRoutes)
                .get('/users/user_info')
                .set('content-type', 'application/json')
                .set('token', userToken)
                .end(callback);
            }),
          }, (err, { loginWithOriginalPassword, getUserInfo }) => {
            should.not.exist(loginWithOriginalPassword.error);
            loginWithOriginalPassword.value.should.have.status(200);
            should.exist(loginWithOriginalPassword.value.body.token);

            should.not.exist(getUserInfo.error);
            getUserInfo.value.should.have.status(200);
            expect(getUserInfo.value.body.name).to.equal('userToBeChanged');
            done();
          });
        });
    });
  });

  describe('liked recipes tests', () => {
    let userToken = null;

    beforeEach((done) => {
      chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          name: 'user',
          password: '1234',
        })
        .end((err, registerRes) => {
          should.not.exist(err);
          registerRes.should.have.status(200);
          should.exist(registerRes.body.token);
          userToken = registerRes.body.token;
          done();
        });
    });

    afterEach((done) => {
      usersModel.clean(done);
    });

    it('likes a recipe successfully', (done) => {
      async.auto({
        likeRecipes: callback => chai.request(usersRoutes)
          .post('/users/liked_recipes')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ recipeIds: [68461, 15184, 20669] })
          .end(callback),
        getUserInfo: ['likeRecipes', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback)],
      }, (err, { likeRecipes, getUserInfo }) => {
        should.not.exist(err);
        expect(likeRecipes.should.have.status(200));
        expect(getUserInfo.should.have.status(200));
        const likedRecipeIds = getUserInfo.body.likedRecipes.map(recipeDetail => recipeDetail.id);
        expect(likedRecipeIds).to.have.members([68461, 15184, 20669]);
        done();
      });
    });

    it('only likes a recipe once', (done) => {
      async.auto({
        likeRecipes: callback => chai.request(usersRoutes)
          .post('/users/liked_recipes')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ recipeIds: [68461, 15184, 20669] })
          .end(callback),
        likeSameRecipesAgain: callback => chai.request(usersRoutes)
          .post('/users/liked_recipes')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ recipeIds: [68461, 15184, 20669] })
          .end(callback),
        getUserInfo: ['likeRecipes', 'likeSameRecipesAgain', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback)],
      }, (err, { likeRecipes, likeSameRecipesAgain, getUserInfo }) => {
        should.not.exist(err);
        expect(likeRecipes.should.have.status(200));
        expect(likeSameRecipesAgain.should.have.status(200));
        expect(getUserInfo.should.have.status(200));
        const likedRecipeIds = getUserInfo.body.likedRecipes.map(recipeDetail => recipeDetail.id);
        expect(likedRecipeIds.sort()).to.deep.equal([68461, 15184, 20669].sort());
        done();
      });
    });

    it('ignores liking invalid recipeIds', (done) => {
      async.auto({
        likeRecipes: callback => chai.request(usersRoutes)
          .post('/users/liked_recipes')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ recipeIds: [6666666666, 9999999999] })
          .end(callback),
        getUserInfo: ['likeRecipes', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback)],
      }, (err, { likeRecipes, getUserInfo }) => {
        should.not.exist(err);
        expect(likeRecipes.should.have.status(200));
        expect(getUserInfo.should.have.status(200));
        const likedRecipeIds = getUserInfo.body.likedRecipes.map(recipeDetail => recipeDetail.id);
        expect(likedRecipeIds).to.not.have.members([6666666666, 9999999999]);
        done();
      });
    });

    it('ignores liking an invalid recipeId while adding a valid recipeId', (done) => {
      async.auto({
        likeRecipes: callback => chai.request(usersRoutes)
          .post('/users/liked_recipes')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ recipeIds: [777777777, 88888888888, 13838] })
          .end(callback),
        getUserInfo: ['likeRecipes', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback)],
      }, (err, { likeRecipes, getUserInfo }) => {
        should.not.exist(err);
        expect(likeRecipes.should.have.status(200));
        expect(getUserInfo.should.have.status(200));
        const likedRecipeIds = getUserInfo.body.likedRecipes.map(recipeDetail => recipeDetail.id);
        expect(likedRecipeIds).to.include(13838);
        expect(likedRecipeIds).to.not.have.members([777777777, 88888888888]);
        done();
      });
    });

    it('unlikes a recipe successfully', (done) => {
      async.auto({
        likeRecipes: callback => chai.request(usersRoutes)
          .post('/users/liked_recipes')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ recipeIds: [19673, 71722, 14830] })
          .end(callback),
        unlikeRecipes: ['likeRecipes', (results, callback) => chai.request(usersRoutes)
          .post('/users/liked_recipes')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ recipeIds: [71722, 14830] })
          .end(callback)],
        getUserInfo: ['unlikeRecipes', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback)],
      }, (err, { likeRecipes, unlikeRecipes, getUserInfo }) => {
        should.not.exist(err);
        expect(likeRecipes.should.have.status(200));
        expect(unlikeRecipes.should.have.status(200));
        expect(getUserInfo.should.have.status(200));
        const likedRecipeIds = getUserInfo.body.likedRecipes.map(recipeDetail => recipeDetail.id);
        expect(likedRecipeIds).to.include(19673);
        expect(likedRecipeIds).to.not.have.members([71722, 14830]);
        done();
      });
    });
  });

  describe('user allergy tests', () => {
    let userToken = null;

    beforeEach((done) => {
      chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          name: 'user',
          password: '1234',
        })
        .end((err, registerRes) => {
          should.not.exist(err);
          registerRes.should.have.status(200);
          should.exist(registerRes.body.token);
          userToken = registerRes.body.token;
          done();
        });
    });

    afterEach((done) => {
      usersModel.clean(done);
    });

    it('add an allergy successfully', (done) => {
      async.auto({
        addAllergies: callback => chai.request(usersRoutes)
          .post('/users/allergies')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ allergies: ['peanuts', 'beef'] })
          .end(callback),
        getUserInfo: ['addAllergies', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addAllergies, getUserInfo }) => {
        should.not.exist(err);
        addAllergies.should.have.status(200);
        getUserInfo.should.have.status(200);
        should.exist(getUserInfo.body.foodAllergies);
        expect(getUserInfo.body.foodAllergies).to.include.members(['peanuts', 'beef']);
        done();
      });
    });


    it('only add an allergy once', (done) => {
      async.auto({
        addAllergies: callback => chai.request(usersRoutes)
          .post('/users/allergies')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ allergies: ['peanuts', 'beef'] })
          .end(callback),
        addSameAllergiesAgain: callback => chai.request(usersRoutes)
          .post('/users/allergies')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ allergies: ['peanuts', 'beef'] })
          .end(callback),
        getUserInfo: ['addAllergies', 'addSameAllergiesAgain', (_, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addAllergies, addSameAllergiesAgain, getUserInfo }) => {
        should.not.exist(err);
        addAllergies.should.have.status(200);
        addSameAllergiesAgain.should.have.status(200);
        getUserInfo.should.have.status(200);
        should.exist(getUserInfo.body.foodAllergies);
        expect(getUserInfo.body.foodAllergies.sort()).to.deep.equal(['peanuts', 'beef'].sort());
        done();
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

    beforeEach((done) => {
      chai.request(usersRoutes)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          email: 'user@email.com',
          name: 'user',
          password: '1234',
        })
        .end((err, registerRes) => {
          should.not.exist(err);
          registerRes.should.have.status(200);
          should.exist(registerRes.body.token);
          userToken = registerRes.body.token;
          done();
        });
    });

    afterEach((done) => {
      usersModel.clean(done);
    });

    it('adds recipes to the breakfast meal plan successfully', (done) => {
      async.auto({
        addRecipeToBreakfast: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ breakfast: [25449, 237491, 246256] })
          .end(callback),
        getUserInfo: ['addRecipeToBreakfast', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addRecipeToBreakfast, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToBreakfast.should.have.status(200);
        getUserInfo.should.have.status(200);
        should.exist(getUserInfo.body.mealPlan.breakfast);

        const recipeIds = getUserInfo.body.mealPlan.breakfast.map(recipe => recipe.id);

        expect(recipeIds).to.include.members([25449, 237491, 246256]);
        done();
      });
    });

    it('adds recipes to the lunch meal plan successfully', (done) => {
      async.auto({
        addRecipeToLunch: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ lunch: [25449, 237491, 246256] })
          .end(callback),
        getUserInfo: ['addRecipeToLunch', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addRecipeToLunch, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToLunch.should.have.status(200);
        getUserInfo.should.have.status(200);
        should.exist(getUserInfo.body.mealPlan.lunch);
        const recipeIds = getUserInfo.body.mealPlan.lunch.map(recipe => recipe.id);
        expect(recipeIds).to.include.members([25449, 237491, 246256]);
        done();
      });
    });


    it('adds recipes to the dinner meal plan successfully', (done) => {
      async.auto({
        addRecipeToDinner: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ dinner: [25449, 237491, 246256] })
          .end(callback),
        getUserInfo: ['addRecipeToDinner', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addRecipeToDinner, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToDinner.should.have.status(200);
        getUserInfo.should.have.status(200);
        should.exist(getUserInfo.body.mealPlan.dinner);

        const recipeIds = getUserInfo.body.mealPlan.dinner.map(recipe => recipe.id);

        expect(recipeIds).to.include.members([25449, 237491, 246256]);
        done();
      });
    });

    it('adds recipes to the multiple meals successfully', (done) => {
      async.auto({
        addRecipeToMeals: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({
            breakfast: [246255, 33474],
            lunch: [246255, 33474],
            dinner: [246255, 33474],
          })
          .end(callback),
        getUserInfo: ['addRecipeToMeals', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addRecipeToMeals, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToMeals.should.have.status(200);
        getUserInfo.should.have.status(200);

        should.exist(getUserInfo.body.mealPlan.breakfast);
        should.exist(getUserInfo.body.mealPlan.lunch);
        should.exist(getUserInfo.body.mealPlan.dinner);

        const breakfastRecipeIds = getUserInfo.body.mealPlan.breakfast.map(recipe => recipe.id);
        const lunchRecipeIds = getUserInfo.body.mealPlan.lunch.map(recipe => recipe.id);
        const dinnerRecipeIds = getUserInfo.body.mealPlan.dinner.map(recipe => recipe.id);

        expect(breakfastRecipeIds).to.include.members([246255, 33474]);
        expect(lunchRecipeIds).to.include.members([246255, 33474]);
        expect(dinnerRecipeIds).to.include.members([246255, 33474]);
        done();
      });
    });

    it('ignores adding invalid recipes to breakfast', (done) => {
      async.auto({
        addRecipeToBreakfast: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ breakfast: [9999999] })
          .end(callback),
        getUserInfo: ['addRecipeToBreakfast', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addRecipeToBreakfast, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToBreakfast.should.have.status(200);
        getUserInfo.should.have.status(200);
        should.exist(getUserInfo.body.mealPlan.breakfast);

        const breakfastRecipeIds = getUserInfo.body.mealPlan.breakfast.map(recipe => recipe.id);

        expect(breakfastRecipeIds).to.not.include(9999999);
        done();
      });
    });

    it('ignores adding invalid recipes to lunch', (done) => {
      async.auto({
        addRecipeToLunch: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ lunch: [9999999] })
          .end(callback),
        getUserInfo: ['addRecipeToLunch', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addRecipeToLunch, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToLunch.should.have.status(200);
        getUserInfo.should.have.status(200);
        should.exist(getUserInfo.body.mealPlan.lunch);

        const lunchRecipeIds = getUserInfo.body.mealPlan.lunch.map(recipe => recipe.id);

        expect(lunchRecipeIds).to.not.include(9999999);
        done();
      });
    });

    it('ignores adding invalid recipes to dinner', (done) => {
      async.auto({
        addRecipeToDinner: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ dinner: [9999999] })
          .end(callback),
        getUserInfo: ['addRecipeToDinner', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addRecipeToDinner, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToDinner.should.have.status(200);
        getUserInfo.should.have.status(200);
        should.exist(getUserInfo.body.mealPlan.dinner);

        const dinnerRecipeIds = getUserInfo.body.mealPlan.dinner.map(recipe => recipe.id);

        expect(dinnerRecipeIds).to.not.include(9999999);
        done();
      });
    });

    it('ignores adding invalid recipes to multiple meals', (done) => {
      async.auto({
        addRecipeToMeals: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({
            breakfast: [9999999],
            lunch: [9999999],
            dinner: [9999999],
          })
          .end(callback),
        getUserInfo: ['addRecipeToMeals', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addRecipeToMeals, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToMeals.should.have.status(200);
        getUserInfo.should.have.status(200);

        should.exist(getUserInfo.body.mealPlan.breakfast);
        should.exist(getUserInfo.body.mealPlan.lunch);
        should.exist(getUserInfo.body.mealPlan.dinner);

        const breakfastRecipeIds = getUserInfo.body.mealPlan.breakfast.map(recipe => recipe.id);
        const lunchRecipeIds = getUserInfo.body.mealPlan.lunch.map(recipe => recipe.id);
        const dinnerRecipeIds = getUserInfo.body.mealPlan.dinner.map(recipe => recipe.id);

        expect(breakfastRecipeIds).to.not.include(9999999);
        expect(lunchRecipeIds).to.not.include(9999999);
        expect(dinnerRecipeIds).to.not.include(9999999);
        done();
      });
    });

    it('removes all recipes from breakfast successfully', (done) => {
      async.auto({
        addRecipeToBreakfast: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ breakfast: [241000, 237835] })
          .end(callback),
        removeRecipeFromBreakfast: ['addRecipeToBreakfast', (results, callback) => chai.request(usersRoutes)
          .delete('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ breakfast: [241000, 237835] })
          .end(callback)],
        getUserInfo: ['removeRecipeFromBreakfast', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback)],
      }, (err, { addRecipeToBreakfast, removeRecipeFromBreakfast, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToBreakfast.should.have.status(200);
        removeRecipeFromBreakfast.should.have.status(200);
        getUserInfo.should.have.status(200);

        const breakfastRecipeIds = getUserInfo.body.mealPlan.breakfast.map(recipe => recipe.id);

        expect(breakfastRecipeIds).to.not.have.members([241000, 237835]);
        expect(breakfastRecipeIds).to.deep.equal([]);
        done();
      });
    });

    it('removes recipes from breakfast successfully', (done) => {
      async.auto({
        addRecipeToBreakfast: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ breakfast: [51147, 241000, 237835] })
          .end(callback),
        removeRecipeFromBreakfast: ['addRecipeToBreakfast', (results, callback) => chai.request(usersRoutes)
          .delete('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ breakfast: [241000, 237835] })
          .end(callback)],
        getUserInfo: ['removeRecipeFromBreakfast', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback)],
      }, (err, { addRecipeToBreakfast, removeRecipeFromBreakfast, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToBreakfast.should.have.status(200);
        removeRecipeFromBreakfast.should.have.status(200);
        getUserInfo.should.have.status(200);

        const breakfastRecipeIds = getUserInfo.body.mealPlan.breakfast.map(recipe => recipe.id);

        expect(breakfastRecipeIds).to.include.members([51147]);
        expect(breakfastRecipeIds).to.not.have.members([241000, 237835]);
        done();
      });
    });

    it('removes a recipe from lunch successfully', (done) => {
      async.auto({
        addRecipeToLunch: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ lunch: [51147, 241000, 237835] })
          .end(callback),
        removeRecipeFromLunch: ['addRecipeToLunch', (results, callback) => chai.request(usersRoutes)
          .delete('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ lunch: [241000, 237835] })
          .end(callback)],
        getUserInfo: ['removeRecipeFromLunch', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback)],
      }, (err, { addRecipeToLunch, removeRecipeFromLunch, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToLunch.should.have.status(200);
        removeRecipeFromLunch.should.have.status(200);
        getUserInfo.should.have.status(200);

        const lunchRecipeIds = getUserInfo.body.mealPlan.lunch.map(recipe => recipe.id);

        expect(lunchRecipeIds).to.include.members([51147]);
        expect(lunchRecipeIds).to.not.have.members([241000, 237835]);
        done();
      });
    });

    it('removes a recipe from dinner successfully', (done) => {
      async.auto({
        addRecipeToDinner: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ dinner: [51147, 241000, 237835] })
          .end(callback),
        removeRecipeFromDinner: ['addRecipeToDinner', (results, callback) => chai.request(usersRoutes)
          .delete('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ dinner: [241000, 237835] })
          .end(callback)],
        getUserInfo: ['removeRecipeFromDinner', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback)],
      }, (err, { addRecipeToDinner, removeRecipeFromDinner, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToDinner.should.have.status(200);
        removeRecipeFromDinner.should.have.status(200);
        getUserInfo.should.have.status(200);

        const dinnerRecipeIds = getUserInfo.body.mealPlan.dinner.map(recipe => recipe.id);

        expect(dinnerRecipeIds).to.include.members([51147]);
        expect(dinnerRecipeIds).to.not.have.members([241000, 237835]);
        done();
      });
    });

    it('removes a recipe from multiple meals successfully', (done) => {
      async.auto({
        addRecipeToMeals: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({
            breakfast: [51147, 241000, 237835],
            lunch: [51147, 241000, 237835],
            dinner: [51147, 241000, 237835],
          })
          .end(callback),
        removeRecipeFromMeals: ['addRecipeToMeals', (results, callback) => chai.request(usersRoutes)
          .delete('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({
            breakfast: [241000, 237835],
            lunch: [241000, 237835],
            dinner: [241000, 237835],
          })
          .end(callback)],
        getUserInfo: ['removeRecipeFromMeals', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback)],
      }, (err, { addRecipeToMeals, removeRecipeFromMeals, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToMeals.should.have.status(200);
        removeRecipeFromMeals.should.have.status(200);
        getUserInfo.should.have.status(200);

        const breakfastRecipeIds = getUserInfo.body.mealPlan.breakfast.map(recipe => recipe.id);
        const lunchRecipeIds = getUserInfo.body.mealPlan.lunch.map(recipe => recipe.id);
        const dinnerRecipeIds = getUserInfo.body.mealPlan.dinner.map(recipe => recipe.id);

        expect(breakfastRecipeIds).to.include.members([51147]);
        expect(lunchRecipeIds).to.include.members([51147]);
        expect(dinnerRecipeIds).to.include.members([51147]);

        expect(breakfastRecipeIds).to.not.have.members([241000, 237835]);
        expect(lunchRecipeIds).to.not.have.members([241000, 237835]);
        expect(dinnerRecipeIds).to.not.have.members([241000, 237835]);
        done();
      });
    });

    it('adds recipes to the breakfast meal only once - ignoring the second time adding the same recipe', (done) => {
      async.auto({
        addRecipeToBreakfast: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ breakfast: [241000, 237835] })
          .end(callback),
        addSameRecipeToBreakfastAgain: callback => chai.request(usersRoutes)
          .post('/users/meal_plan')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .send({ breakfast: [241000, 237835] })
          .end(callback),
        getUserInfo: ['addRecipeToBreakfast', 'addSameRecipeToBreakfastAgain', (results, callback) => chai.request(usersRoutes)
          .get('/users/user_info')
          .set('content-type', 'application/json')
          .set('token', userToken)
          .end(callback),
        ],
      }, (err, { addRecipeToBreakfast, addSameRecipeToBreakfastAgain, getUserInfo }) => {
        should.not.exist(err);
        addRecipeToBreakfast.should.have.status(200);
        addSameRecipeToBreakfastAgain.should.have.status(200);
        getUserInfo.should.have.status(200);
        should.exist(getUserInfo.body.mealPlan.breakfast);

        const breakfastRecipeIds = getUserInfo.body.mealPlan.breakfast.map(recipe => recipe.id);

        expect(breakfastRecipeIds.sort()).to.deep.equal([241000, 237835].sort());
        done();
      });
    });
  });
});
