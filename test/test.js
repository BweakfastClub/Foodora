const usersRoutes = require("../index");
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
        it("the get users endpoint should exist", (done) => {
            chai.request(usersRoutes).
                post("/users").
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    done();
                });
        });
    });
});
