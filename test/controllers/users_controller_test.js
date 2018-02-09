const usersRoutes = require("../../index");
const chai = require("chai"),
    chaiHttp = require("chai-http");
const should = chai.should();

chai.use(chaiHttp);

describe("Endpoints exists", () => {
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
    });
});
