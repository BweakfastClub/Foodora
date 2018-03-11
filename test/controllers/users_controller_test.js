const usersRoutes = require("../../index");
const usersModel = require("../../src/models/users_model");
const chai = require("chai"),
    chaiHttp = require("chai-http");
const should = chai.should();

chai.use(chaiHttp);

describe("Endpoints exists for users", () => {
    before((done) => {
        usersModel.setup(done);
    });

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
});

