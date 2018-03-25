const usersRoutes = require("../../index");
const usersModel = require("../../src/models/users_model");
const chai = require("chai"),
    chaiHttp = require("chai-http");
const should = chai.should();
const {expect} = chai;

chai.use(chaiHttp);

describe("Endpoints exists for users", () => {
    after((done) => {
        usersModel.clean(done);
    });

    describe("/GET users", () => {
        it("the get users endpoint should exist", (done) => {
            chai.request(usersRoutes).
                get("/users").
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    done();
                });
        });
    });

    describe("/POST users", () => {
        it("Post user requires name", (done) => {
            chai.request(usersRoutes).
                post("/users").
                set("content-type", "application/json").
                send({
                    email: "user@email.com",
                    password: "1234"
                }).
                end((err, res) => {
                    should.exist(err);
                    res.should.have.status(400);
                    done();
                });
        });

        it("Post user requires email", (done) => {
            chai.request(usersRoutes).
                post("/users").
                set("content-type", "application/json").
                send({
                    email: "user@email.com",
                    name: "user"
                }).
                end((err, res) => {
                    should.exist(err);
                    res.should.have.status(400);
                    done();
                });
        });

        it("Post user requires password", (done) => {
            chai.request(usersRoutes).
                post("/users").
                set("content-type", "application/json").
                send({
                    name: "user",
                    password: "1234"
                }).
                end((err, res) => {
                    should.exist(err);
                    res.should.have.status(400);
                    done();
                });
        });
    });

    it("Post user successful", (done) => {
        chai.request(usersRoutes).
            post("/users").
            set("content-type", "application/json").
            send({
                email: "user@email.com",
                name: "user",
                password: "1234"
            }).
            end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                done();
            });
    });

    describe("login tests", () => {
        it("logs in succesfully after user registration and issues a token", (done) => {
            chai.request(usersRoutes).
                post("/users").
                set("content-type", "application/json").
                send({
                    email: "user2@email.com",
                    name: "user2",
                    password: "1234"
                }).
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    chai.request(usersRoutes).
                        post("/users/login").
                        set("content-type", "application/json").
                        send({
                            email: "user2@email.com",
                            password: "1234"
                        }).
                        end((loginErr, loginRes) => {
                            should.not.exist(loginErr);
                            loginRes.should.have.status(200);
                            should.exist(loginRes.body.token);
                            done();
                        });
                });
        });

        it("logs in failed after with incorrect password", (done) => {
            chai.request(usersRoutes).
                post("/users").
                set("content-type", "application/json").
                send({
                    email: "user@email.com",
                    name: "user",
                    password: "1234"
                }).
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    chai.request(usersRoutes).
                        post("/users/login").
                        set("content-type", "application/json").
                        send({
                            email: "user@email.com",
                            password: "wrong_password"
                        }).
                        end((loginErr, loginRes) => {
                            should.exist(loginErr);
                            loginRes.should.have.status(401);
                            should.not.exist(loginRes.body.token);
                            done();
                        });
                });
        });

        it("logs in failed after with unregistered user", (done) => {
            chai.request(usersRoutes).
                post("/users/login").
                set("content-type", "application/json").
                send({
                    email: "wrong_user@email.com",
                    password: "wrong_password"
                }).
                end((loginErr, loginRes) => {
                    should.exist(loginErr);
                    loginRes.should.have.status(401);
                    should.not.exist(loginRes.body.token);
                    done();
                });
        });
    });

    describe("likes recipes tests", () => {

        let userToken = null;

        beforeEach((done) => {
            chai.request(usersRoutes).
                post("/users").
                set("content-type", "application/json").
                send({
                    email: "user2@email.com",
                    name: "user2",
                    password: "1234"
                }).
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    chai.request(usersRoutes).
                        post("/users/login").
                        set("content-type", "application/json").
                        send({
                            email: "user2@email.com",
                            password: "1234"
                        }).
                        end((loginErr, loginRes) => {
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

        it("likes a recipe successfully", (done) => {
            chai.request(usersRoutes).
                post("/users/likes_recipe").
                set("content-type", "application/json").
                set("token", userToken).
                send({recipeId: "1234"}).
                end((likeErr, likeRes) => {
                    should.not.exist(likeErr);
                    likeRes.should.have.status(200);
                    chai.request(usersRoutes).
                        get("/users/user_info").
                        set("content-type", "application/json").
                        set("token", userToken).
                        end((userInfoErr, userInfoRes) => {
                            should.not.exist(userInfoErr);
                            userInfoRes.should.have.status(200);
                            should.exist(userInfoRes.body);
                            done();
                        });
                });
        });

        it("likes a recipe successfully", (done) => {
            chai.request(usersRoutes).
                post("/users/likes_recipe").
                set("content-type", "application/json").
                set("token", userToken).
                send({recipeId: "2345"}).
                end((likeErr, likeRes) => {
                    should.not.exist(likeErr);
                    likeRes.should.have.status(200);
                    chai.request(usersRoutes).
                        post("/users/unlikes_recipe").
                        set("content-type", "application/json").
                        set("token", userToken).
                        send({recipeId: "2345"}).
                        end((unlikeRecipeErr, unlikeRecipeRes) => {
                            should.not.exist(unlikeRecipeErr);
                            unlikeRecipeRes.should.have.status(200);
                            chai.request(usersRoutes).
                                get("/users/user_info").
                                set("content-type", "application/json").
                                set("token", userToken).
                                end((userInfoErr, userInfoRes) => {
                                    should.not.exist(userInfoErr);
                                    userInfoRes.should.have.status(200);
                                    should.exist(userInfoRes.body.likedRecipes);
                                    /* eslint-disable no-unused-expressions */
                                    expect(userInfoRes.body.likedRecipes).to.be.empty;
                                    done();
                                });
                        })
                });
        });
    });
});
